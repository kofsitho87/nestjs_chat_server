/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

//m1 mac 에서 실행안됨!!!!!!!!!!!!!!!!!!!!!!!!!!!
if (process.env.CHAT_ENV !== 'LOCAL') {
  const ffprobe = require('ffprobe-static');
  ffmpeg.setFfprobePath(ffprobe.path);
}

import { join } from 'path';
const { writeFileSync, unlinkSync, existsSync } = require('fs');

async function videoDuration(videoFilePath: string): Promise<number | null> {
  if (existsSync(videoFilePath)) {
    const duration = await new Promise<number>((rs, reject): void => {
      ffmpeg(videoFilePath).ffprobe((err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        if (metadata.format.duration) {
          rs(metadata.format.duration);
          return;
        }
      });
    });
    if (duration) {
      const durationVal = Math.ceil(duration);
      // let min = Math.floor(durationVal / 60).toString();
      // let sec = (durationVal % 60).toString();
      // let durationStr = `${min.length > 1 ? min : '0' + min}:${sec.length > 1 ? sec : '0' + sec}`;
      return durationVal;
    }
  }
  return null;
}

async function makeVideoThumnail(
  videoFile: Buffer,
  tempFileName: string,
): Promise<any | null> {
  !fs.existsSync('temp') && fs.mkdirSync('temp');

  const thumnailFileName = `${tempFileName}.png`;
  const videoFilePath = `temp/${tempFileName}.mp4`;
  const thumnailFileFolderPath = join(__dirname, '..', '..', 'temp');
  const thumnailFilePath = `${thumnailFileFolderPath}/${thumnailFileName}`;

  writeFileSync(videoFilePath, videoFile);

  const duration = await videoDuration(videoFilePath);

  const result = await new Promise(function (resolve, reject) {
    ffmpeg(videoFilePath)
      .on('error', function (err) {
        console.log('An error occurred: ' + err.message);
        reject(err);
      })
      .on('end', function () {
        console.log('Processing finished !');
        resolve(true);
      })
      .outputOptions('-q:v', '40')
      .screenshots({
        timestamps: [0.0],
        filename: thumnailFileName,
        folder: thumnailFileFolderPath,
      });
  });

  unlinkSync(videoFilePath);
  if (result) {
    return {
      thumbnailPath: thumnailFilePath,
      duration,
    };
  }

  return null;
}

function removeThumnail(thumnailPath) {
  if (existsSync(thumnailPath)) {
    unlinkSync(thumnailPath);
  }
}

export const MakeVideoThumnail = makeVideoThumnail;
export const RemoveThumnail = removeThumnail;
// export const VideoDuration = videoDuration;
