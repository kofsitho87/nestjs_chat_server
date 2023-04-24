import {
  ChatAdminEventMsg,
  MessageTemplateType,
  MessageType,
  PlatformApiErrorCodes,
  RoomType,
} from '@/enums/enums';
import { ApiAuthGuard } from '@/guard/api.auth.guard';
import { Room } from '@/models/room.entity';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ChatGateway } from '../chat/chat.gateway';
import { CreateMessageDto } from '../chat/dto/createMessage.dto';
import { CreateRoomDto } from '../chat/dto/createRoom.dto';
import { LoggerService } from '../logger/logger.service';
import { RoomService } from '../room/room.service';
import { CreateRoomApiDto } from './dto/createRoom.api.dto';
import { InviteUsersToRoomApiDto } from './dto/inviteUsersToRoom.api.dto';

@Controller('chat')
export class PlatformApiController {
  private logger = new LoggerService('ApiController');

  constructor(
    private readonly roomService: RoomService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @UseGuards(ApiAuthGuard)
  @Post('room')
  async createRoomWithMessage(
    @Body() payload: CreateRoomApiDto,
  ): Promise<Room> {
    this.logger.log('createRoomWithMessage', { payload });

    const { joinUsers, roomType, meta, link } = payload;
    const findRoomPayload = {
      'link.sid': link.sid,
      roomType: roomType,
      $and: joinUsers.map((joinUser) => {
        return { 'joinUsers._id': joinUser._id };
      }),
      joinUsers: { $size: joinUsers.length },
      'rules.isFreezed': false,
    };
    if (roomType == RoomType.INQUIRY && meta && meta['productId']) {
      findRoomPayload['meta.productId'] = meta['productId'];
    }

    let room: Room = await this.roomService.findOne(findRoomPayload);

    if (roomType == RoomType.GROUP && room) {
      //error: “동일한 회원들로 구성된 채팅방이 존재합니다.”
      // return {
      //   success: false,
      //   error: PlatformApiErrorCodes.ROOM_NO_EXISTS,
      // };
      this.logger.error('createRoomWithMessage', {
        error: '동일한 회원들로 구성된 채팅방이 존재합니다.',
        payload,
      });
      throw new HttpException(
        PlatformApiErrorCodes.ROOM_ALREADY_EXISTS,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!room) {
      const roomPayload: CreateRoomDto = {
        roomType: payload.roomType,
        name: payload.name,
        profileUrl: payload.profileUrl,
        link: payload.link,
        joinUsers: payload.joinUsers,
        rules: {
          canCaptureMessage: true,
          canCopyMessage: true,
          canShareMessage: true,
          canLeaveOutRoom: true,
          canInviteMemebrs: payload.roomType === RoomType.GROUP,
          canDeleteMessage: false,
          canShowMemberList: true,
          isFreezed:
            roomType == RoomType.SYSTEM_ALARM ||
            payload.roomType == RoomType.ALARM,
        },
        meta: payload.meta,
      };
      try {
        room = await this.roomService.createNewRoom(roomPayload);
      } catch (e) {
        this.logger.error('createRoomWithMessage', {
          error: e,
          payload,
        });
        throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      if (!payload.message) {
        const messagePayload: CreateMessageDto = {
          author: { authorId: 'ADMIN', nickName: '' },
          syncKey: new Date().getTime().toString(),
          roomId: room._id,
          template: MessageTemplateType.admin_type_1,
          content: {
            text: ChatAdminEventMsg.ROOM_CREATED,
          },
          // data: {
          //   type: MessageType.ADMIN,
          //   content: { text: ChatAdminEventMsg.ROOM_CREATED },
          // },
        };
        await this.chatGateway.sendMessageProcess(messagePayload);
      }
    }
    if (payload.message) {
      try {
        await this.chatGateway.sendMessageProcess({
          roomId: room._id,
          syncKey: new Date().getTime().toString(),
          author: payload.message.author,
          template: payload.message.template,
          content: payload.message.content,
          // data: payload.message.data,
        });
      } catch (e) {
        this.logger.error('createRoomWithMessage', {
          error: e,
          payload,
        });
        throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
    return room;
  }

  @UseGuards(ApiAuthGuard)
  @Post('upsertRoom')
  async upsertRoomWithMessage(
    @Body() payload: CreateRoomApiDto,
  ): Promise<{ roomExists: boolean; room: Room }> {
    this.logger.log('upsertRoomWithMessage', { payload });

    const { joinUsers, roomType, meta, link } = payload;
    const findRoomPayload = {
      'link.sid': link.sid,
      roomType: roomType,
      $and: joinUsers.map((joinUser) => {
        return { 'joinUsers._id': joinUser._id };
      }),
      joinUsers: { $size: joinUsers.length },
      'rules.isFreezed': false,
    };
    if (roomType == RoomType.INQUIRY && meta && meta['productId']) {
      findRoomPayload['meta.productId'] = meta['productId'];
    }

    let room: Room = await this.roomService.findOne(findRoomPayload);

    if (roomType == RoomType.GROUP && room) {
      //error: “동일한 회원들로 구성된 채팅방이 존재합니다.”
      return {
        roomExists: true,
        room: room,
      };
    }

    if (!room) {
      const roomPayload: CreateRoomDto = {
        roomType: payload.roomType,
        name: payload.name,
        profileUrl: payload.profileUrl,
        link: payload.link,
        joinUsers: payload.joinUsers,
        rules: {
          canCaptureMessage: true,
          canCopyMessage: true,
          canShareMessage: true,
          canLeaveOutRoom: true,
          canInviteMemebrs: payload.roomType === RoomType.GROUP,
          canDeleteMessage: false,
          canShowMemberList: true,
          isFreezed:
            roomType == RoomType.SYSTEM_ALARM ||
            payload.roomType == RoomType.ALARM,
        },
        meta: payload.meta,
      };
      try {
        room = await this.roomService.createNewRoom(roomPayload);
      } catch (e) {
        this.logger.error('createRoomWithMessage', {
          error: e,
          payload,
        });
        throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }

      if (!payload.message) {
        const messagePayload: CreateMessageDto = {
          author: { authorId: 'ADMIN', nickName: '' },
          syncKey: new Date().getTime().toString(),
          roomId: room._id,
          template: MessageTemplateType.admin_type_1,
          content: {
            text: ChatAdminEventMsg.ROOM_CREATED,
          },
          // data: {
          //   type: MessageType.ADMIN,
          //   content: { text: ChatAdminEventMsg.ROOM_CREATED },
          // },
        };
        await this.chatGateway.sendMessageProcess(messagePayload);
      }
    }
    if (payload.message) {
      try {
        await this.chatGateway.sendMessageProcess({
          roomId: room._id,
          syncKey: new Date().getTime().toString(),
          author: payload.message.author,
          template: payload.message.template,
          content: payload.message.content,
          // data: payload.message.data,
        });
      } catch (e) {
        this.logger.error('createRoomWithMessage', {
          error: e,
          payload,
        });
        throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
    return {
      roomExists: false,
      room: room,
    };
  }

  @UseGuards(ApiAuthGuard)
  @Post('inviteUsers')
  async inviteUsersToRoom(
    @Body() payload: InviteUsersToRoomApiDto,
  ): Promise<Room> {
    this.logger.log('inviteUsersToRoom', { payload });
    const room = await this.roomService.findOne({
      _id: payload.roomId,
      'joinUsers._id': payload.inviterId,
    });
    if (!room) {
      this.logger.error('inviteUsersToRoom', {
        error: 'ROOM_NO_EXISTS',
        payload,
      });
      throw new HttpException(
        PlatformApiErrorCodes.ROOM_NO_EXISTS,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } else if (room.rules.isFreezed) {
      this.logger.error('inviteUsersToRoom', {
        error: 'ROOM_IS_FREEZED_CAN_NOT_BE_CHANGED',
        payload,
      });
      throw new HttpException(
        PlatformApiErrorCodes.ROOM_IS_FREEZED_CAN_NOT_BE_CHANGED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } else if (!room.rules.canInviteMemebrs) {
      this.logger.error('inviteUsersToRoom', {
        error: 'ROOM_RULES_CAN_NOT_INVITE_MEMBERS',
        payload,
      });
      throw new HttpException(
        PlatformApiErrorCodes.ROOM_RULES_CAN_NOT_INVITE_MEMBERS,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const inviter = room.joinUsers.find(
      (ju) => ju._id === payload.inviterId && ju.master,
    );
    if (!inviter) {
      this.logger.error('inviteUsersToRoom', {
        error: 'INVITER_ID_IS_NOT_MASTER',
        payload,
      });
      throw new HttpException(
        PlatformApiErrorCodes.INVITER_ID_IS_NOT_MASTER,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const joinedUserIds = room.joinUsers.map((ju) => ju._id);
    const joinUsers = payload.joinUsers.filter(
      (ju) => !joinedUserIds.includes(ju._id),
    );

    if (joinUsers.length < 1) {
      this.logger.error('inviteUsersToRoom', {
        error: 'JOIN_USERS_EMPTY',
        payload,
      });
      throw new HttpException(
        PlatformApiErrorCodes.JOIN_USERS_EMPTY,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const firstJoinUser = joinUsers[0];

    try {
      await this.roomService.inviteRoom(room, joinUsers);
      //초대한 유저들
      const messagePayload: CreateMessageDto = {
        author: { authorId: 'ADMIN', nickName: '' },
        roomId: payload.roomId,
        syncKey: new Date().getTime().toString(),
        template: MessageTemplateType.admin_type_1,
        content: {
          text: `${inviter.nickName}님이 ${firstJoinUser.nickName}님${
            joinUsers.length > 1
              ? ' 외 ' + (joinUsers.length - 1) + '명을'
              : '을'
          } 초대하였습니다.`,
        },
        // data: {
        //   type: MessageType.ADMIN,
        //   content: {
        //     text: `${inviter.nickName}님이 ${firstJoinUser.nickName}님${
        //       joinUsers.length > 1
        //         ? ' 외 ' + (joinUsers.length - 1) + '명을'
        //         : '을'
        //     } 초대하였습니다.`,
        //   },
        // },
      };
      await this.chatGateway.sendMessageProcess(messagePayload);
      const newRoom = await this.roomService.findOne({ _id: payload.roomId });
      return newRoom;
    } catch (e) {
      this.logger.error('inviteUsersToRoom', {
        error: e.message,
        payload,
      });
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
