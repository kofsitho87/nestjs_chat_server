import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { SendFileMessageDto } from '../chat/dto/sendFileMessage.dto';
import * as FileType from 'file-type';
import { createReadStream, existsSync, ReadStream } from 'fs';
import * as path from 'path';

type CallbackFunction = (_progress: number) => void;
@Injectable()
export class UploadService {
  private s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  });

  private files = {};
  private s3Files = {};
  private struct = {
    name: null,
    size: 0,
    data: [],
    slice: 0,
    startTime: null,

    //for s3 multipart
    // uploadId: null,
    // fileName: null,
    // Parts: [],
  };

  storeFileSlice(payload: SendFileMessageDto) {
    const fileSizeMb = payload.size / (1000 * 1000);
    // console.log('fileSizeMb', fileSizeMb);
    if (fileSizeMb > 500) {
      throw new Error('FILE_SIZE_CAN_NOT_OVER_500MB');
    } else if (payload.data.byteLength < 1) {
      throw new Error('SEND_FILE_IS_EMPTY');
    }
    if (!this.files[payload.syncKey]) {
      // const fileType = await FileType.fromBuffer(payload.data);
      // const fileName = `${payload.syncKey}.${fileType ? ('.' + fileType.ext) : ''}`;
      // this.files[payload.syncKey].fileName = fileName;
      // await this.test(payload, fileName);

      this.files[payload.syncKey] = Object.assign({}, this.struct, payload);
      this.files[payload.syncKey].data = [];
      this.files[payload.syncKey].startTime = new Date().getTime();
    }
    this.files[payload.syncKey].data.push(payload.data);
    this.files[payload.syncKey].slice++;
  }

  getCurrentFileSlice(key: string) {
    const currentFile = this.files[key];
    if (currentFile) {
      const total = currentFile.size;
      // let cSize = currentFile.slice * (1000 * 100);
      const cSize = Buffer.concat(currentFile.data).byteLength;
      // let progress = cSize / total * 50;
      // let progress = cSize / total * 80;
      const progress = (cSize / total) * 0.8;
      // console.log(progress);

      return {
        slice: currentFile.slice,
        progress: Math.min(progress, 1),
      };
    }
    return null;
  }

  fileIsComplete(key: string) {
    const currentFile = this.files[key];
    const cSize = Buffer.concat(currentFile.data).byteLength;
    // let result = currentFile.slice * Number(1000 * 100) >= currentFile.size;
    const result = cSize >= currentFile.size;
    return result;
  }

  getFileBuffter(key: string): Buffer {
    const currentFile = this.files[key];
    return Buffer.concat(currentFile.data);
  }

  async getCurrentFileType(buffer: Buffer) {
    const fileType = await FileType.fromBuffer(buffer);
    return fileType;
  }

  async getCurrentFileTypeByFile(filePath: string) {
    if (!existsSync(filePath)) {
      return null;
    }
    const fileType = await FileType.fromFile(filePath);
    return fileType;
  }

  _fileKey(payload: any, fileName: string): string {
    return `chat/${payload.roomId}/${fileName}`;
  }

  async uploadToS3(
    payload: SendFileMessageDto,
    progress?: CallbackFunction | null,
  ): Promise<any> {
    const buffer = this.getFileBuffter(payload.syncKey);
    const fileType = await this.getCurrentFileType(buffer);
    const fileExtension = path.extname(payload.name).replace('.', '');
    const fileName = `${payload.syncKey}.${
      fileType ? fileType.ext : fileExtension
    }`;
    const saveFilePath = this._fileKey(payload, fileName);
    const filePayload = {
      Bucket: 'dingdongu',
      ACL: 'public-read',
      Body: buffer,
      ContentType: fileType ? fileType.mime : null,
      Key: saveFilePath,
    };

    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.info(
      `The script uses approximately ${Math.round(used * 100) / 100} MB`,
    );

    delete this.files[payload.syncKey];
    this.removeOverProcess();

    return new Promise((resolve, reject) => {
      this.s3
        .upload(filePayload, async (err: any, data: any) => {
          if (err) {
            return reject(err);
          }
          const result = {
            origin: data.Location,
            saveFilePath: saveFilePath,
            etag: data.ETag,
            key: data.Key,
            mimeType: fileType,
            fileBuffer: buffer,
          };
          return resolve(result);
        })
        .on('httpUploadProgress', function (evt) {
          if (progress) {
            const _progress = Math.min((evt.loaded / evt.total) * 0.2 + 0.8, 1);
            progress(_progress);
          }
        });
    });
  }

  async directUploadToS3(payload: {
    name: string;
    keyFileName: string;
    roomId: string;
    fileData: Buffer | string;
  }): Promise<{
    origin: string;
    etag: string;
    key: string;
    mimeType: any;
    saveFilePath: string;
  }> {
    console.log('start updloasd');
    const fileDataIsBuffer = typeof payload.fileData !== 'string';
    const fileType =
      typeof payload.fileData === 'string'
        ? await this.getCurrentFileTypeByFile(payload.fileData)
        : await this.getCurrentFileType(payload.fileData);
    const fileExtension = path.extname(payload.name).replace('.', '');
    const fileName = `${payload.keyFileName}.${
      fileType ? fileType.ext : fileExtension
    }`;

    const saveFilePath = this._fileKey({ roomId: payload.roomId }, fileName);
    const filePayload = {
      Bucket: 'dingdongu',
      ACL: 'public-read',
      Body: fileDataIsBuffer
        ? payload.fileData
        : createReadStream(payload.fileData),
      ContentType: fileType ? fileType.mime : null,
      Key: saveFilePath,
    };

    return new Promise((resolve, reject) => {
      this.s3.upload(filePayload, async (err: any, data: any) => {
        if (err) {
          return reject(err);
        }
        const result = {
          origin: data.Location,
          saveFilePath: saveFilePath,
          etag: data.ETag,
          key: data.Key,
          mimeType: fileType,
        };
        return resolve(result);
      });
    });
  }

  removeOverProcess() {
    // Math.floor((new Date().getTime() - before) / 1000)
    const fileKeys = Object.keys(this.files);
    for (const key of fileKeys) {
      const item = this.files[key];
      const min = Math.floor(
        (new Date().getTime() - item.startTime) / (1000 * 60),
      );
      console.log('min:', min, key);

      //10분이상 요청이 오지 않으면 해당파일 삭제
      if (min >= 10) {
        delete this.files[key];
      }
    }
  }
}
