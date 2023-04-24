import {
  ChatErrorCodes,
  MessageEventType,
  MessageTemplateType,
  MessageType,
} from '@/enums/enums';
import { JwtAuthGuard } from '@/guard/jwt.auth.guard';
import {
  Body,
  Controller,
  Delete,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ChatGateway } from '../chat/chat.gateway';
import { CreateAnnouncementDto } from './dto/createAnnouncement.api.dto';
import { ChatResponse } from '../chat/interface';
import { LoggerService } from '../logger/logger.service';
import { MessageService } from '../message/message.service';
import { RoomService } from '../room/room.service';
import { UploadService } from '../upload/upload.service';
import { ListAnnouncementsApiDto } from './dto/ListAnnouncements.api.dto';
import { UpdateAnnouncementDto } from './dto/updateAnnouncement.api.dto';
import { createFileMessageDto } from './dto/createFileMessage.api.dto';
import { CreateMessageDto } from '../chat/dto/createMessage.dto';
import { ChatService } from '../chat/chat.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import sizeOf from 'image-size';

@Controller('chat')
export class ChatApiController {
  private logger = new LoggerService('ApiController');

  constructor(
    private readonly messageService: MessageService,
    private readonly roomService: RoomService,
    private readonly uploadService: UploadService,
    private readonly chatGateway: ChatGateway,
    private readonly chatService: ChatService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @Post('message/file')
  async sendFileMessage(
    @Req() request,
    @Body() payload: createFileMessageDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<ChatResponse<void>> {
    const currentUser = request.user;
    // // this.logger.log('sendFileMessage', { payload, currentUser });

    const room = await this.roomService.findById(payload.roomId);
    if (!room) {
      this.logger.warn('sendFileMessage:ROOM_NO_EXISTS', {
        currentUser,
      });
      throw new HttpException(
        ChatErrorCodes.ROOM_NO_EXISTS,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    for (const f of files) {
      const syncKey = payload.syncKey;
      const keyFileName = new Date().getTime().toString();
      const { saveFilePath, mimeType } =
        await this.uploadService.directUploadToS3({
          name: f.originalname,
          keyFileName: keyFileName,
          roomId: payload.roomId,
          fileData: f.buffer,
        });

      const messageTemplateType = this.chatService.getMessageTypeByMimeType(
        mimeType?.mime,
      );

      let frameSize;
      let messageThumbnail: string | undefined;
      let videoDuration: number | undefined;

      if (messageTemplateType === MessageTemplateType.video_type_1) {
        const result = await this.chatService.uploadVideoThumnailAndDuration({
          videoFile: f.buffer,
          keyFileName: keyFileName,
          roomId: payload.roomId,
        });
        if (result) {
          const { thumnailPath, videoDuration: duration, dimensions } = result;
          messageThumbnail = thumnailPath;
          videoDuration = duration;
          frameSize = {
            width: dimensions.width,
            height: dimensions.height,
          };
        }
      } else if (messageTemplateType === MessageTemplateType.photo_type_1) {
        const dimensions = sizeOf(f.buffer);
        frameSize = {
          width: dimensions.width,
          height: dimensions.height,
        };
        const result = await this.chatService.uploadImgThumnail({
          keyFileName: keyFileName,
          roomId: payload.roomId,
          buffer: f.buffer,
          dimensions: frameSize,
        });
        if (result) {
          messageThumbnail = result;
        }
      }

      const messagePayload: CreateMessageDto = {
        author: { authorId: currentUser.id },
        syncKey: syncKey,
        roomId: payload.roomId,
        template: messageTemplateType,
        content: {
          files: [
            {
              path: saveFilePath,
              name: f.originalname,
              size: f.size,
              thumbnail: messageThumbnail,
              duration: videoDuration,
              frameSize,
            },
          ],
        },
        // data: {
        //   type: messageType,
        //   content: {
        //     files: [
        //       {
        //         path: saveFilePath,
        //         name: f.originalname,
        //         size: f.size,
        //         thumbnail: messageThumbnail,
        //         duration: videoDuration,
        //         frameSize,
        //       },
        //     ],
        //   },
        // },
      };
      // this.logger.log('sendFileMessage:SEND_MESSAGE_PROCESS', {
      //   currentUser,
      //   messagePayload,
      // });
      await this.chatGateway.sendMessageProcess(messagePayload);
    }

    return {
      success: true,
      error: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @Post('announce')
  async createAnnouncement(
    @Req() request,
    @Body() payload: CreateAnnouncementDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<ChatResponse<void>> {
    const currentUser = request.user;
    this.logger.log('createAnnouncement', { payload, currentUser });

    const room = await this.roomService.findById(payload.roomId);
    if (!room) {
      this.logger.warn('sendFileMessage:ROOM_NO_EXISTS', {
        payload,
        currentUser,
      });
      throw new HttpException(
        ChatErrorCodes.ROOM_NO_EXISTS,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const fileList = [];
    if (files && files.length > 0) {
      for (const f of files) {
        const syncKey = new Date().getTime().toString();
        const result = await this.uploadService.directUploadToS3({
          name: f.originalname,
          keyFileName: syncKey,
          roomId: payload.roomId,
          fileData: f.buffer,
        });
        if (result) {
          fileList.push({
            path: result.saveFilePath,
            name: f.originalname,
            size: f.size,
          });
        }
      }
    }

    const messagePayload = {
      author: { authorId: currentUser.id },
      syncKey: new Date().getTime().toString(),
      roomId: payload.roomId,
      template: MessageTemplateType.announce_type_1,
      content: {
        files: fileList,
      },
      // data: {
      //   type: MessageType.ANNOUNCE,
      //   content: {
      //     text: payload.content,
      //     files: fileList,
      //   },
      // },
    };
    await this.chatGateway.sendMessageProcess(messagePayload);
    return {
      success: true,
      error: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('announce/list')
  async listAnnouncements(
    @Req() request,
    @Body() payload: ListAnnouncementsApiDto,
  ) {
    this.logger.log('listAnnouncements', { payload });
    const currentUser = request.user;
    const filter = {
      roomId: payload.roomId,
      messageType: MessageType.ANNOUNCE,
      'joinUsers._id': currentUser.id,
    };
    const list = await this.messageService.searchMessages(filter);
    return { list: list, count: list.length };
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @Post('announce/update')
  async updateAnnouncement(
    @Req() request,
    @Body() payload: UpdateAnnouncementDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ): Promise<boolean> {
    const currentUser = request.user;
    this.logger.log('updateAnnouncement', { payload, currentUser });

    const room = await this.roomService.findById(payload.roomId);
    if (!room) {
      this.logger.warn('updateAnnouncement:ROOM_NO_EXISTS', {
        payload,
        currentUser,
      });
      throw new HttpException(
        ChatErrorCodes.ROOM_NO_EXISTS,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const message = await this.messageService.findOne({
      _id: payload.messageId,
      roomId: payload.roomId,
    });
    if (!message) {
      this.logger.warn('updateAnnouncement:MESSAGE_NO_EXISTS', {
        payload,
        currentUser,
      });
      throw new HttpException(
        ChatErrorCodes.MESSAGE_NO_EXISTS,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const fileList = [];
    if (files && files.length > 0) {
      for (const f of files) {
        const syncKey = new Date().getTime().toString();
        const result = await this.uploadService.directUploadToS3({
          name: f.originalname,
          keyFileName: syncKey,
          roomId: payload.roomId,
          fileData: f.buffer,
        });
        if (result) {
          fileList.push({
            path: result.saveFilePath,
            name: f.originalname,
            size: f.size,
          });
        }
      }
    }

    const messageContent = message.content;
    messageContent.text = payload.content;
    messageContent.files = fileList;

    await this.messageService.updateMessage(payload.messageId, messageContent);

    message.content = messageContent;

    if (room.lastAnnounce._id == payload.messageId) {
      await this.roomService.updateLastAnnouncement(room._id, message);
      room.lastAnnounce = message;
    }
    if (room.lastMessage._id == payload.messageId) {
      await this.roomService.updateLastMessage(room._id, message);
      room.lastMessage = message;
    }

    this.chatGateway.emitListenRoomEvent(room);
    this.chatGateway.emitListenMessageEvent(MessageEventType.UPDATE, message);

    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('announce/:roomId/:messageId')
  async deleteAnnouncement(
    @Req() request,
    @Param('roomId') roomId: string,
    @Param('messageId') messageId: string,
  ) {
    const currentUser = request.user;
    const payload = {
      roomId: roomId,
      messageId: messageId,
      authorId: currentUser.id,
    };
    this.logger.log('deleteAnnouncement', { payload: payload });

    const room = await this.roomService.findById(roomId);

    if (!room) {
      this.logger.warn('deleteAnnouncement:ROOM_NO_EXISTS', {
        payload,
        currentUser,
      });
      throw new HttpException(
        ChatErrorCodes.ROOM_NO_EXISTS,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const message = await this.messageService.findById(messageId);
    if (!message) {
      this.logger.warn('deleteAnnouncement:MESSAGE_NO_EXISTS', {
        payload,
        currentUser,
      });
      throw new HttpException(
        ChatErrorCodes.MESSAGE_NO_EXISTS,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    await this.messageService.deleteOne({ _id: messageId });

    if (room.lastAnnounce?._id == payload.messageId) {
      await this.roomService.deleteLastAnnouncement(room._id);
      room.lastAnnounce = null;
    }
    if (room.lastMessage?._id == payload.messageId) {
      //find last message for room
      const lastMessage = await this.messageService.findLastOne({
        roomId: roomId,
      });
      //update last message for room
      await this.roomService.updateLastMessage(roomId, lastMessage);
      room.lastMessage = lastMessage;
    }

    this.chatGateway.emitListenRoomEvent(room);
    this.chatGateway.emitListenMessageEvent(MessageEventType.DELETE, message);

    return true;
  }
}
