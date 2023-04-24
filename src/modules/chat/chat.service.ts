import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConnectionDocument } from '@/models/connection.entity';
import { Server } from 'socket.io';
import { CurrentUser } from './interface';
import { ApiPlatform, ApiPlatformDocument } from '@/models/api.platform.entity';
import { MessageTemplateType, MessageType } from '@/enums/enums';
import { MakeVideoThumnail, RemoveThumnail } from '@/utils/ffmpeg';
import { UploadService } from '../upload/upload.service';
import sizeOf from 'image-size';
import * as sharp from 'sharp';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('apiPlatforms')
    private platformsModel: Model<ApiPlatformDocument>,
    @InjectModel('connections')
    private connectionModel: Model<ConnectionDocument>,
    protected readonly uploadService: UploadService,
  ) {}

  async findPlatformWithKey(key: string): Promise<ApiPlatform> {
    return this.platformsModel.findOne({ apiKey: key }).lean();
  }

  //TODO: 1. change mongo to redis
  async createUserConnection(currentUser: CurrentUser, clientId: string) {
    const connection = new this.connectionModel({
      userId: currentUser.id,
      clientId,
      user: {
        _id: currentUser.id,
        nickName: currentUser.nickName,
        email: currentUser.email,
        profileUrl: currentUser.profileUrl,
      },
      expireAt: new Date(),
    });
    return await connection.save();
  }

  async deleteUserConnection(clientId: string) {
    await this.connectionModel.findOneAndDelete({ clientId });
  }

  async deleteAllConnection() {
    await this.connectionModel.deleteMany();
  }

  async getUserConnection(filter: {
    [key: string]: string;
  }): Promise<ConnectionDocument> {
    return await this.connectionModel.findOne(filter).lean();
  }

  async getUserConnections(filter: {
    [key: string]: string;
  }): Promise<ConnectionDocument[]> {
    return await this.connectionModel.find(filter).lean();
  }

  async getCurrentRoomClients(wss: Server, roomId: string): Promise<string[]> {
    const clientIds = await wss.in(roomId).allSockets();
    return Array.from(clientIds);
  }

  async uploadVideoThumnailAndDuration(payload: {
    videoFile: Buffer;
    keyFileName: string;
    roomId: string;
  }): Promise<{
    thumnailPath: string | null;
    videoDuration: number | null;
    dimensions: ISizeCalculationResult;
  } | null> {
    const ffmpegResult = await MakeVideoThumnail(
      payload.videoFile,
      payload.keyFileName,
    );
    if (!ffmpegResult) {
      return null;
    }

    const dimensions = sizeOf(ffmpegResult.thumbnailPath);
    const { saveFilePath } = await this.uploadService.directUploadToS3({
      name: `${payload.keyFileName}_thumbnail.png`,
      keyFileName: `${payload.keyFileName}_thumbnail`,
      roomId: payload.roomId,
      fileData: ffmpegResult.thumbnailPath,
    });
    RemoveThumnail(ffmpegResult.thumbnailPath);
    const thumnailPath = saveFilePath;
    const videoDuration = ffmpegResult.duration;

    return {
      dimensions,
      thumnailPath,
      videoDuration,
    };
  }

  async uploadImgThumnail(payload: {
    keyFileName: string;
    roomId: string;
    buffer: Buffer;
    dimensions: { width: number; height: number };
  }): Promise<string> {
    const percentageOfImage = 10;
    const width = parseInt(
      (payload.dimensions.width * (percentageOfImage / 100)).toFixed(0),
    );
    const height = parseInt(
      (payload.dimensions.height * (percentageOfImage / 100)).toFixed(0),
    );

    const thumbnailBuffer = await sharp(payload.buffer)
      .resize(width, height)
      .toBuffer();

    const { saveFilePath } = await this.uploadService.directUploadToS3({
      name: `${payload.keyFileName}_thumbnail.png`,
      keyFileName: `${payload.keyFileName}_thumbnail`,
      roomId: payload.roomId,
      fileData: thumbnailBuffer,
    });

    return saveFilePath;
  }

  isVideoType(mimeType: string): boolean {
    return [
      'video/mp4',
      'video/mpeg',
      'video/ogg',
      'video/quicktime',
      'video/webm',
      'video/x-m4v',
      'video/ms-asf',
      'video/x-ms-wmv',
      'video/x-msvideo',
      'video/x-ms-asf',
    ].includes(mimeType);
  }

  isImageType(mimeType: string): boolean {
    return ['image/jpeg', 'image/png', 'image/gif'].includes(mimeType);
  }

  getMessageTypeByMimeType(mimeType: string): MessageTemplateType {
    if (this.isImageType(mimeType) === true) {
      // return MessageType.PHOTO;
      return MessageTemplateType.photo_type_1;
    } else if (this.isVideoType(mimeType) === true) {
      // return MessageType.VIDEO;
      return MessageTemplateType.video_type_1;
    }
    // return MessageType.FILE
    return MessageTemplateType.file_type_1;
  }
}
