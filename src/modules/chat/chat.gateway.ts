import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { ChatService } from './chat.service';

import { SendMessageDto } from './dto/sendMessage.dto';
import { ReadMessageDto } from './dto/readMessage.dto';
import { UploadService } from '../upload/upload.service';
import { SendFileMessageDto } from './dto/sendFileMessage.dto';
import { ReadMessagesByRoomDto } from './dto/readMessagesByRoom.dto';
import {
  ChatEmitEvents,
  ChatErrorCodes,
  ChatEvents,
  MessageEventType,
  MessageTemplateType,
  RoomType,
} from '@/enums/enums';
import { CreateMessageDto } from './dto/createMessage.dto';
import { Room } from '@/models/room.entity';
import { Message } from '@/models/message.entity';
import { ChatResponse, CurrentUser } from './interface';
import { PushService } from '../push/push.service';

import { KafkaCoreService } from '@/modules/kafka/kafka.service';
import { SubscribeTo } from '@/modules/kafka/kafka.decorator';
import { CreateRoomWithMessageKafkaDto } from './dto/kafka/createRoom.kafka.dto';
import { updateMessageKafkaDto } from './dto/kafka/updateMessage.kafka.dto';
import { Payload } from '@nestjs/microservices';
import { CreateRoomDto } from './dto/createRoom.dto';
import { LoggerService } from '@/modules/logger/logger.service';
import { RoomService } from '../room/room.service';
import { MessageService } from '../message/message.service';

import { QueryRoomsDto } from './dto/queryRooms.dto';
import { UpdateRoomSettingDto } from './dto/updateRoomSetting.dto';
import { UpdateRoomAlaramSettingDto } from './dto/updateRoomAlarmSetting.dto';
import { RoomRuleDto } from './dto/roomRule.dto';
import { KickOutUserDto } from './dto/kickOutUser.dto';
import { InviteRoomDto } from './dto/inviteRoom.dto';
import { GetMessagesByRoomDto } from './dto/getMessagesByRoom.dto';
import { SearchMessagesByRoomDto } from './dto/searchMessagesByRoom.dto';
import { UserLeaveKafkaDto } from './dto/kafka/userLeavel.kafka.dto';
import { LinkDeleteKafkaDto } from './dto/kafka/linkDelete.kafka.dto';
import { AuthService } from '../auth/auth.service';
import { SendAnnounceMessageDto } from './dto/sendAnnounceMessage.dto';
import { UpdateMessageDto } from './dto/updateMessage.dto';
import sizeOf from 'image-size';

@WebSocketGateway({
  namespace: 'chat',
  transports: ['websocket'],
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  protected logger = new LoggerService('ChatGateway');
  @WebSocketServer() wss: Server;

  constructor(
    protected readonly chatService: ChatService,
    protected readonly roomService: RoomService,
    protected readonly messageService: MessageService,
    protected readonly authService: AuthService,
    protected readonly uploadService: UploadService,
    protected readonly pushService: PushService,
    private client: KafkaCoreService,
  ) {}

  async onModuleInit() {
    this.wss.use(async (client, next) => {
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      const tokenUser = this.authService.jwtVerifyToken(token);
      this.logger.verbose('TOKEN_USER', tokenUser);
      if (!tokenUser) {
        const err = new Error('not authorized');
        return next(err);
      }

      //set user with socket client id
      const currentUser: CurrentUser = {
        id: tokenUser.id,
        email: tokenUser.identity,
        nickName: tokenUser.name || 'empty',
        profileUrl: null,
      };
      client.data.currentUser = currentUser;

      //save user data in connections collection
      try {
        await this.chatService.createUserConnection(currentUser, client.id);
        this.logger.verbose(`USER_CONNECTED`, currentUser);
      } catch (e) {
        const err = new Error('not authorized');
        return next(err);
      }

      next();
    });

    this.chatService.deleteAllConnection();

    this.client.subscribeToResponseOf(
      `${process.env.CHAT_ENV}_CHAT_ROOM_CREATE_IMPORTANT`,
      this,
    );

    this.client.subscribeToResponseOf(
      `${process.env.CHAT_ENV}_CHAT_MESSAGE_CREATE_IMPORTANT`,
      this,
    );
    this.client.subscribeToResponseOf(
      `${process.env.CHAT_ENV}_CHAT_MESSAGE_UPDATE_IMPORTANT`,
      this,
    );

    this.client.subscribeToResponseOf(
      `${process.env.CHAT_ENV}_CHAT_USER_LEAVE_IMPORTANT`,
      this,
    );

    this.client.subscribeToResponseOf(
      `${process.env.CHAT_ENV}_CHAT_LINK_DELETE_IMPORTANT`,
      this,
    );
  }

  afterInit() {
    //
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.verbose(`SOCKET_CONNECTED`, { clientId: client.id });
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const currentUser = client.data.currentUser;
    this.logger.verbose(`SOCKET_DISCONNECTED`, currentUser);
    this.chatService.deleteUserConnection(client.id);
  }

  //TODO: 링크삭제시 해당링크 모든채팅방 얼리기
  //TODO: 해당되는 모든채팅방에 알림발송하기
  @UsePipes(new ValidationPipe())
  @SubscribeTo(`${process.env.CHAT_ENV}_CHAT_LINK_DELETE_IMPORTANT`)
  async listenToLinkDeleteFromKafka(
    @Payload() kafkaPayload: LinkDeleteKafkaDto,
  ): Promise<void> {
    this.logger.log('listenToLinkDeleteFromKafka', {
      payload: kafkaPayload,
    });

    const matchFilter = {
      'link.sid': kafkaPayload.link.linkSid,
    };
    const updateData = {
      'rules.isFreezed': true,
    };
    await this.roomService.updateRoomsSetting(matchFilter, updateData);
    const rooms = await this.roomService.findRooms(matchFilter);

    for (const room of rooms) {
      this.wss.to(room._id).emit(ChatEvents.ListenRoom, room);
    }
  }

  @UsePipes(new ValidationPipe())
  @SubscribeTo(`${process.env.CHAT_ENV}_CHAT_USER_LEAVE_IMPORTANT`)
  async listenToUserLeaveFromKafka(
    @Payload() kafkaPayload: UserLeaveKafkaDto,
  ): Promise<void> {
    //TODO: DU회원(링크회원)삭제시 해당회원의 대화방에서 내보내기
    //1.Todo: pull out each joinUser from rooms
    //2.Todo: send 'listenRoom' event to User and make User leave room out!
    //3.Todo: send 'listenRoom' event to JoinuUers for roooms
    this.logger.log('listenToUserLeaveFromKafka', {
      payload: kafkaPayload,
    });

    const findRoomsPayload = {
      'joinUsers._id': kafkaPayload.userId,
    };
    if (kafkaPayload.linkSid) {
      findRoomsPayload['link.sid'] = kafkaPayload.linkSid;
    }
    const rooms = await this.roomService.findRooms(findRoomsPayload);

    //4.Todo: room중에 마스터유저가 현재유저라면(userId) 해당하는 룸을 전부얼리고 freezingReasonCode를 업데이트한다.
    const masterUserRooms = rooms.filter((r) => {
      return !!r.joinUsers.find(
        (ju) => ju.master && ju._id === kafkaPayload.userId,
      );
    });
    if (masterUserRooms.length > 0) {
      const updateData = {
        'rules.isFreezed': true,
        freezingReasonCode: 'MASTER_LEFT',
      };
      for (const room of masterUserRooms) {
        this.roomService.updateOne({ _id: room._id }, updateData);
        room.rules.isFreezed = true;
        room.freezingReasonCode = 'MASTER_LEFT';
        this.wss.to(room._id).emit(ChatEvents.ListenRoom, room);
      }
    }

    //해당유저 채팅밤에서 out!
    await this.roomService.userLeaveToRooms(kafkaPayload);

    if (rooms.length > 0) {
      const targetUserConn = await this.chatService.getUserConnection({
        userId: kafkaPayload.userId,
      });
      if (targetUserConn) {
        for (const room of rooms) {
          room.joinUsers = room.joinUsers.filter(
            (ju) => ju._id !== kafkaPayload.userId,
          );
          const currentClient = this.wss.in(targetUserConn.clientId);
          currentClient.emit('listenRoom', room);
          this.wss.to(room._id).emit(ChatEvents.ListenRoom, room);
          currentClient.socketsLeave(room._id);
        }
      }
    }

    //notification 모두 읽음처리
    for (const room of rooms) {
      this.pushService.readLastMessage(room._id, kafkaPayload.userId);
    }
  }

  @UsePipes(new ValidationPipe())
  @SubscribeTo(`${process.env.CHAT_ENV}_CHAT_MESSAGE_CREATE_IMPORTANT`)
  async listenToCreateMessageFromKafka(
    @Payload() kafkaPayload: CreateRoomWithMessageKafkaDto,
  ) {
    // console.log('[KAKFA-CONSUMER]: CHAT_MESSAGE_CREATE_IMPORTANT');
    // console.log(kafkaPayload);
    // console.log(kafkaPayload.message.data.content.rawData);

    this.logger.log('listenToCreateMessageFromKafka', {
      payload: kafkaPayload,
    });

    const { roomType, name, profileUrl, link, joinUsers, message, meta } =
      kafkaPayload;
    const findRoomPayload = {
      $and: joinUsers.map((joinUser) => {
        return { 'joinUsers._id': joinUser._id };
      }),
      joinUsers: { $size: joinUsers.length },
    };
    if (roomType) {
      findRoomPayload['roomType'] = roomType;
      if (roomType == RoomType.INQUIRY && meta && meta['productId']) {
        findRoomPayload['meta.productId'] = meta['productId'];
      }
    }
    if (link) {
      findRoomPayload['link.sid'] = link.sid;
    }
    let room: Room = await this.roomService.findOne(findRoomPayload);

    if (!room) {
      const roomPayload: CreateRoomDto = {
        roomType,
        name,
        profileUrl,
        link,
        joinUsers: joinUsers,
        // roomUsers: joinUsers,
        rules: {
          canShareMessage: true,
          canCopyMessage: true,
          canCaptureMessage: true,
          canLeaveOutRoom: true,
          canInviteMemebrs: roomType === RoomType.GROUP,
          canDeleteMessage: false,
          canShowMemberList: true,
          isFreezed:
            roomType == RoomType.SYSTEM_ALARM || roomType == RoomType.ALARM,
        },
        meta,
      };
      try {
        room = await this.roomService.createNewRoom(roomPayload);
      } catch (e) {
        this.logger.error('listenToCreateMessageFromKafka', {
          payload: kafkaPayload,
          error: e,
        });
        return false;
      }
    }

    //create message...
    try {
      const messagePayload: CreateMessageDto = {
        author: message.author,
        roomId: room._id,
        syncKey: new Date().getTime().toString(),
        template: message.template,
        content: message.content,
        // data: message.data,
        meta: meta,
      };
      await this.sendMessageProcess(messagePayload);
      return true;
    } catch (e) {
      this.logger.error('listenToCreateMessageFromKafka', {
        error: e,
        payload: kafkaPayload,
      });
      return false;
    }
  }

  // @SubscribeMessage('test')
  // async test(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() kafkaPayload: updateMessageKafkaDto,
  // ) {
  //   console.log(kafkaPayload);
  //   const { messageId, data } = kafkaPayload;
  //   let message = await this.messageService.getMessage(messageId);
  //   console.log('1', message);
  //   message = Object.assign(message, { data });
  //   console.log('2', message);
  //   const updateResult = await this.messageService.updateMessage(
  //     messageId,
  //     message.data,
  //   );
  //   console.log('updateResult', updateResult);
  //   return true;
  // }

  @UsePipes(new ValidationPipe())
  @SubscribeTo(`${process.env.CHAT_ENV}_CHAT_MESSAGE_UPDATE_IMPORTANT`)
  async listenToUpdateMessageFromKafka(
    @Payload() kafkaPayload: updateMessageKafkaDto,
  ): Promise<boolean> {
    // console.log('[KAKFA-CONSUMER]: CHAT_MESSAGE_UPDATE_IMPORTANT');
    // console.log(kafkaPayload);
    // console.log(kafkaPayload.data.content.rawData);
    this.logger.log('listenToUpdateMessageFromKafka', {
      payload: kafkaPayload,
    });

    const { messageId, content } = kafkaPayload;

    let message = await this.messageService.getMessage(messageId);
    if (!message) {
      this.logger.error('listenToUpdateMessageFromKafka', {
        error: 'MESSAGE_NOT_FOUND_WITH_MESSAGE_ID',
        payload: kafkaPayload,
      });
      return false;
    }

    message = Object.assign(message, { content });
    const updateResult = await this.messageService.updateMessage(
      messageId,
      message.content,
    );
    this.logger.log('listenToUpdateMessageFromKafka', {
      kafkaPayload,
      updateResult,
    });

    const result = {
      eventType: MessageEventType.UPDATE,
      message,
    };
    this.wss.emit(`listenMessage_${message.roomId}`, result);
    return true;
  }

  @UsePipes(new ValidationPipe())
  async sendMessageProcess(
    messagePayload: CreateMessageDto,
    notifyLastMessage = true,
  ): Promise<Message> {
    this.logger.log('sendMessageProcess', {
      payload: messagePayload,
    });

    //Get Room!
    const room = await this.roomService.findById(messagePayload.roomId);
    if (!room) {
      throw new Error('ROOM_NO_EXISTS');
    }
    const roomClients = await this.chatService.getCurrentRoomClients(
      this.wss,
      messagePayload.roomId,
    );

    if (messagePayload.template !== MessageTemplateType.admin_type_1) {
      const authorJoinUser = room.joinUsers.find(
        (row) => row._id == messagePayload.author.authorId,
      );
      if (
        !authorJoinUser &&
        (room.roomType == RoomType.GROUP || room.roomType == RoomType.INQUIRY)
      ) {
        this.logger.error('sendMessageProcess', {
          error: 'AUTHOR_JOIN_USER_NO_EXISTS',
          payload: messagePayload,
        });
        throw new Error('AUTHOR_JOIN_USER_NO_EXISTS');
      }
      messagePayload.author.nickName =
        authorJoinUser?.nickName || messagePayload.author.nickName;
      messagePayload.author.profileUrl =
        authorJoinUser?.profileUrl || messagePayload.author.profileUrl;
    }
    const message = await this.messageService.createMessage(messagePayload);

    //get connection data with client.id
    const promises = roomClients.map(async (clientId) =>
      this.chatService.getUserConnection({ clientId }),
    );
    const currentRoomLiveUserConnections = (await Promise.all(promises)).filter(
      (v) => v,
    );

    //update last read msg for all live users
    if (notifyLastMessage) {
      const updateReadMsgPromises = currentRoomLiveUserConnections.map(
        async (c) => {
          return this.roomService.updateLastReadMessage(
            {
              roomId: messagePayload.roomId,
              userId: c.userId,
            },
            message._id.toString(),
          );
        },
      );
      await Promise.all(updateReadMsgPromises);
    }

    //emit 'updateRoomLastMessage' Event to all Live users in this chat room
    const joinUsers = room.joinUsers;
    const updatedRoom = await this.roomService.findById(messagePayload.roomId);

    const updateRoomPromises = joinUsers.map(async ({ _id }) => {
      const conns = await this.chatService.getUserConnections({ userId: _id });
      if (conns) {
        for (const conn of conns) {
          this.wss
            .to(conn.clientId)
            .emit(ChatEvents.UpdateRoomLastMessage, updatedRoom);
        }
      }
    });
    await Promise.all(updateRoomPromises);

    //emit message to Room!
    const result = {
      eventType: MessageEventType.CREATE,
      message,
    };

    this.wss
      .to(messagePayload.roomId.toString())
      .emit(`listenMessage_${messagePayload.roomId.toString()}`, result);

    //비동기로 PUSH!
    const liveConnUserIds = currentRoomLiveUserConnections.map(
      (liveConn) => liveConn.userId,
    );
    const exceptPushUserIds = liveConnUserIds;
    this.pushService.send(updatedRoom, message, exceptPushUserIds);
    return message;
  }

  /*
   * ROOM
   *
   */
  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.ListenRooms)
  async queryRooms(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: QueryRoomsDto,
  ): Promise<ChatResponse<{ list: Room[] }>> {
    const currentUser = client.data.currentUser;
    const currentUserId = currentUser.id;

    const filter: any = {
      joinUsers: {
        $elemMatch: {
          _id: currentUserId,
        },
      },
    };
    if (payload.linkSid) {
      filter['link.sid'] = payload.linkSid;
    }
    if (payload.roomType) {
      filter['roomType'] = payload.roomType;
    } else if (payload.roomTypes) {
      filter['roomType'] = { $in: payload.roomTypes };
    }
    if (typeof payload.masterUser === 'boolean') {
      filter.joinUsers.$elemMatch.master = payload.masterUser;
    }

    this.logger.log('queryRooms', { currentUser, payload });

    const roomsWithunReadMsgCount =
      await this.roomService.getRoomsWithUnReadMsgCount(currentUserId, filter);

    return {
      success: true,
      data: { list: roomsWithunReadMsgCount },
    };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.QueryRoom)
  async queryRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): Promise<ChatResponse<Room>> {
    const { currentUser } = client.data;

    this.logger.log('queryRoom', { payload, currentUser });
    const room = await this.roomService.getMyRoomWithId(
      payload.roomId,
      currentUser.id,
    );
    if (!room) {
      this.logger.warn('queryRoom:ROOM_NO_EXISTS', { payload, currentUser });
      return {
        success: false,
        error: ChatErrorCodes.ROOM_NO_EXISTS,
      };
    }
    return {
      success: true,
      data: room,
    };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.ListenRoom)
  async queryRoom2(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): Promise<ChatResponse<Room>> {
    const { currentUser } = client.data;
    this.logger.log('queryRoom2', { currentUser, payload });
    const room = await this.roomService.getMyRoomWithId(
      payload.roomId,
      currentUser.id,
    );
    if (!room) {
      this.logger.warn('queryRoom2:ROOM_NO_EXISTS', { currentUser, payload });
      return {
        success: false,
        error: ChatErrorCodes.ROOM_NO_EXISTS,
      };
    }
    return {
      success: true,
      data: room,
    };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.KickOutUsers)
  async kickOutUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: KickOutUserDto,
  ): Promise<ChatResponse<{ result: boolean }>> {
    const { currentUser } = client.data;

    this.logger.log('kickOutUsers', {
      currentUser,
      payload,
    });

    const room = await this.roomService.getMyRoomWithId(
      payload.roomId,
      currentUser.id,
    );

    if (!room) {
      this.logger.warn('kickOutUsers:ROOM_NO_EXISTS', {
        currentUser,
        payload,
      });
      return {
        success: false,
        error: ChatErrorCodes.ROOM_NO_EXISTS,
      };
    }

    if (!room.isMaster(currentUser.id)) {
      this.logger.warn('kickOutUsers:YOU_HAVE_NO_AUTHORIZATION', {
        currentUser,
        payload,
      });
      return {
        success: false,
        error: ChatErrorCodes.YOU_HAVE_NO_AUTHORIZATION,
      };
    }

    try {
      await this.roomService.leaveOutRoom(
        payload.roomId,
        payload.targetUserIds,
      );
    } catch (e) {
      this.logger.error('kickOutUsers', {
        error: e,
        payload,
        currentUser,
      });
      return {
        success: false,
        error: ChatErrorCodes.FAILED_LEAVEOUT_USERS,
      };
    }

    //client leave room
    const _room = Object.assign({}, room);
    for (const userId of payload.targetUserIds) {
      _room.joinUsers = _room.joinUsers.filter((ju) => ju._id !== userId);
      this.pushService.readLastMessage(room._id, userId);
      const targetUserConns = await this.chatService.getUserConnections({
        userId: userId,
      });
      if (targetUserConns) {
        for (const conn of targetUserConns) {
          this.wss.in(conn.clientId).emit('listenRoom', _room);
          this.wss.in(conn.clientId).socketsLeave(payload.roomId);
        }
      }
    }

    //create Admin msg
    const leaveUserNickNames = room.joinUsers
      .filter((ju) => {
        return payload.targetUserIds.includes(ju._id);
      })
      .map((ju) => ju.nickName);

    const messagePayload: CreateMessageDto = {
      author: { authorId: 'ADMIN', nickName: '' },
      roomId: payload.roomId,
      syncKey: new Date().getTime().toString(),
      template: MessageTemplateType.admin_type_1,
      content: {
        text: `${leaveUserNickNames
          .map((row) => row + '님')
          .join(' ')}을 내보냈습니다.`,
      },
      // data: {
      //   type: MessageType.ADMIN,
      //   content: {
      //     text: `${leaveUserNickNames
      //       .map((row) => row + '님')
      //       .join(' ')}을 내보냈습니다.`,
      //   },
      // },
    };
    await this.sendMessageProcess(messagePayload);
    return {
      success: true,
      data: { result: true },
    };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.JoinRoom)
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ): Promise<ChatResponse<{ result: boolean }>> {
    const { currentUser } = client.data;

    this.logger.log('joinRoom', {
      currentUser,
      roomId,
    });

    const room = await this.roomService.getMyRoomWithId(
      roomId,
      currentUser.id,
      { name: 1 },
    );
    if (!room) {
      this.logger.warn('joinRoom:ROOM_NO_EXISTS', {
        currentUser,
        roomId,
      });
      return {
        success: false,
        error: ChatErrorCodes.ROOM_NO_EXISTS,
      };
    }
    await client.join(roomId);
    return {
      success: true,
      data: { result: true },
    };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.LeaveRoom)
  async leaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ): Promise<ChatResponse<{ result: boolean }>> {
    const { currentUser } = client.data;

    this.logger.log('leaveRoom', {
      currentUser,
      roomId,
    });

    await client.leave(roomId);
    return {
      success: true,
      data: { result: true },
    };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.LeaveOutRoom)
  async leaveOutRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ): Promise<ChatResponse<{ result: boolean }>> {
    const currentUser = client.data.currentUser;

    this.logger.log('leaveOutRoom', {
      currentUser,
      payload: {
        roomId: roomId,
      },
    });

    const roomExists = await this.roomService.exists({
      _id: roomId,
      joinUsers: {
        $elemMatch: {
          master: true,
          _id: currentUser.id,
        },
      },
    });

    if (!roomExists) {
      this.logger.warn('leaveOutRoom:ROOM_NO_EXISTS', {
        currentUser,
        payload: {
          roomId,
        },
      });
      return {
        success: false,
        error: ChatErrorCodes.ROOM_NO_EXISTS,
      };
    }

    const currentUserId = currentUser.id;
    const result = await this.roomService.leaveOutRoom(roomId, [currentUserId]);
    if (!result) {
      this.logger.warn('leaveOutRoom:YOU_ARE_NO_JOINED_ROOM', {
        currentUser,
        payload: {
          roomId: roomId,
        },
      });
      return {
        success: false,
        error: ChatErrorCodes.YOU_ARE_NO_JOINED_ROOM,
      };
    }

    //client leave room
    client.leave(roomId);

    //update lasteMessage to join users!
    const room = await this.roomService.findById(roomId);
    if (room) {
      this.pushService.readLastMessage(room._id, currentUserId);
      client.broadcast.emit(ChatEmitEvents.ListenRoom, room);
    }
    return {
      success: true,
      data: { result: true },
    };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.InviteUsers)
  async inviteUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: InviteRoomDto,
  ): Promise<ChatResponse<{ result: boolean }>> {
    const { currentUser } = client.data;

    this.logger.log('inviteUsers', {
      currentUser,
      payload,
    });

    const room = await this.roomService.getMyRoomWithId(
      payload.roomId,
      currentUser.id,
    );

    if (!room) {
      this.logger.warn('inviteUsers:ROOM_NO_EXISTS', {
        currentUser,
        payload,
      });
      return {
        success: false,
        error: ChatErrorCodes.ROOM_NO_EXISTS,
      };
    }

    if (!room.isMaster(currentUser.id)) {
      this.logger.warn('inviteUsers:YOU_HAVE_NO_AUTHORIZATION', {
        currentUser,
        payload,
      });
      return {
        success: false,
        error: ChatErrorCodes.YOU_HAVE_NO_AUTHORIZATION,
      };
    }

    const joinUserIds = room.joinUsers.map((ju) => ju._id);
    const targetUsers = payload.joinUsers.filter((ju) => {
      return !joinUserIds.includes(ju._id);
    });

    if (targetUsers.length < 1) {
      this.logger.warn('inviteUsers:EMPTY_TARGET_USERS', {
        currentUser,
        payload,
      });
      return {
        success: false,
        error: ChatErrorCodes.EMPTY_TARGET_USERS,
      };
    }

    try {
      await this.roomService.inviteRoom(room, targetUsers);
      //초대한 유저들
      const messagePayload: CreateMessageDto = {
        author: { authorId: 'ADMIN' },
        roomId: payload.roomId,
        syncKey: new Date().getTime().toString(),
        template: MessageTemplateType.admin_type_1,
        content: {
          text: `${currentUser.email}님이 ${targetUsers[0].nickName}님${
            targetUsers.length > 1
              ? ' 외 ' + (targetUsers.length - 1) + '명을'
              : '을'
          } 초대하였습니다.`,
        },
        // data: {
        //   type: MessageType.ADMIN,
        //   content: {
        //     text: `${currentUser.email}님이 ${targetUsers[0].nickName}님${
        //       targetUsers.length > 1
        //         ? ' 외 ' + (targetUsers.length - 1) + '명을'
        //         : '을'
        //     } 초대하였습니다.`,
        //   },
        // },
      };
      await this.sendMessageProcess(messagePayload);
      return {
        success: true,
        data: { result: true },
      };
    } catch (e) {
      return {
        success: false,
        error: e.message,
      };
    }
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.RoomAlarmTurnOnOff)
  async roomAlarmTurnOnOff(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: UpdateRoomAlaramSettingDto,
  ): Promise<ChatResponse<{ result: boolean }>> {
    const currentUser = client.data.currentUser;

    this.logger.log('roomAlarmTurnOnOff', {
      currentUser,
      payload,
    });

    await this.roomService.updateRoomAlarm(
      payload.roomId,
      currentUser.id,
      payload.turnOn,
    );
    return {
      success: true,
      data: { result: true },
    };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.UpdateRoomSetting)
  async updateRoomSetting(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: UpdateRoomSettingDto,
  ): Promise<ChatResponse<{ result: boolean }>> {
    const currentUser = client.data.currentUser;

    this.logger.log('updateRoomSetting', {
      currentUser,
      payload,
    });

    const room = await this.roomService.findById(payload.roomId);
    if (!room) {
      this.logger.warn('updateRoomSetting:ROOM_NO_EXISTS', {
        currentUser,
        payload,
      });
      return {
        success: false,
        error: ChatErrorCodes.ROOM_NO_EXISTS,
      };
    }
    const joinUser = room.joinUsers.find((ju) => ju._id == currentUser.id);
    if (!joinUser) {
      this.logger.warn('updateRoomSetting:YOU_ARE_NO_JOINED_ROOM', {
        currentUser,
        payload,
      });
      return {
        success: false,
        error: ChatErrorCodes.YOU_ARE_NO_JOINED_ROOM,
      };
    }

    //일반 이용자가 채팅방을 종료하는것이 가능해야한다!
    // if (!joinUser.master) {
    //   this.logger.warn('updateRoomSetting:YOU_HAVE_NO_AUTHORIZATION', {
    //     currentUser,
    //     payload,
    //   });
    //   return {
    //     success: false,
    //     error: ChatErrorCodes.YOU_HAVE_NO_AUTHORIZATION,
    //   };
    // }

    if (payload.updateData.rules) {
      const newRules = new RoomRuleDto(payload.updateData.rules);
      payload.updateData.rules = newRules;
    }

    await this.roomService.updateRoomSetting(
      payload.roomId,
      currentUser.id,
      payload.updateData,
    );

    const newRoom = Object.assign(room, payload.updateData);
    this.wss.to(payload.roomId).emit(ChatEvents.ListenRoom, newRoom);

    return {
      success: true,
      data: { result: true },
    };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.UpdateReadMessage)
  async updateReadMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ReadMessageDto,
  ): Promise<ChatResponse<{ result: boolean }>> {
    const currentUser = client.data.currentUser;

    this.logger.log('updateReadMessage', {
      currentUser,
      payload,
    });

    const room = await this.roomService.getMyRoomWithId(
      payload.roomId,
      currentUser.id,
    );
    if (!room) {
      this.logger.warn('updateReadMessage:ROOM_NO_EXISTS', {
        currentUser,
        payload,
      });
      return {
        success: false,
        error: ChatErrorCodes.ROOM_NO_EXISTS,
      };
    }

    await this.roomService.updateLastReadMessage(
      { roomId: payload.roomId, userId: currentUser.id },
      payload.messageId,
    );

    const newRoom = await this.roomService.findById(payload.roomId);

    this.wss.to(payload.roomId).emit('listenRoom', newRoom);
    this.pushService.readLastMessage(room._id, currentUser.id);

    return {
      success: true,
      data: { result: true },
    };
  }

  /*
   * MESSAGE
   *
   */
  //deprecated
  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.QueryMessagesByRoom)
  async queryMessagesByRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ReadMessagesByRoomDto,
  ): Promise<ChatResponse<{ list: Message[] }>> {
    const { currentUser } = client.data;

    this.logger.log('queryMessagesByRoom', { currentUser, payload });

    const room = await this.roomService.getMyRoomWithId(
      payload.roomId,
      currentUser.id,
    );

    if (!room) {
      this.logger.warn('queryMessagesByRoom:ROOM_NO_EXISTS', {
        currentUser,
        payload,
      });
      return {
        success: false,
        error: ChatErrorCodes.ROOM_NO_EXISTS,
      };
    }
    const currentUserId = client.data.currentUser.id;
    const joinUser = room.getJoinUser(currentUserId);
    payload.createdAt = joinUser.createdAt;
    const messages = await this.messageService.getMessages(payload);
    return {
      success: true,
      data: { list: messages },
    };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.GetMessagesByRoom)
  async getMessagesByRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GetMessagesByRoomDto,
  ): Promise<ChatResponse<{ list: Message[] }>> {
    const { currentUser } = client.data;

    this.logger.log('getMessagesByRoom', { currentUser, payload });

    const room = await this.roomService.getMyRoomWithId(
      payload.roomId,
      currentUser.id,
    );
    if (!room) {
      this.logger.warn('getMessagesByRoom:ROOM_NO_EXISTS', {
        currentUser,
        payload,
      });
      return {
        success: false,
        error: ChatErrorCodes.ROOM_NO_EXISTS,
      };
    }
    const currentUserId = client.data.currentUser.id;
    const joinUser = room.getJoinUser(currentUserId);
    payload.createdAt = joinUser.createdAt;
    const messages = await this.messageService.getMessagesByRoom(payload);
    return {
      success: true,
      error: null,
      data: { list: messages },
    };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.SearchMessagesByRoom)
  async searchMessagesByRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SearchMessagesByRoomDto,
  ): Promise<ChatResponse<{ list: Message[] }>> {
    const { currentUser } = client.data;

    this.logger.log('searchMessagesByRoom', { currentUser, payload });

    const room = await this.roomService.getMyRoomWithId(
      payload.roomId,
      currentUser.id,
    );
    if (!room) {
      this.logger.warn('searchMessagesByRoom:ROOM_NO_EXISTS', {
        currentUser,
        payload,
      });
      return {
        success: false,
        error: ChatErrorCodes.ROOM_NO_EXISTS,
      };
    }
    const messages = await this.messageService.searchMessages(payload);
    return {
      success: true,
      error: null,
      data: { list: messages },
    };
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.SendTextMessage)
  async sendTextMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ): Promise<ChatResponse<{ result: boolean }>> {
    const currentUser = client.data.currentUser;
    this.logger.log('sendTextMessage', { currentUser, payload });

    const messagePayload: CreateMessageDto = {
      author: { authorId: currentUser.id },
      syncKey: payload.syncKey,
      roomId: payload.roomId,
      template: MessageTemplateType.text_type_1,
      content: {
        text: payload.content,
      },
      // data: {
      //   type: MessageType.TEXT,
      //   content: { text: payload.content },
      // },
    };
    try {
      await this.sendMessageProcess(messagePayload);
      return {
        success: true,
        data: { result: true },
      };
    } catch (e) {
      this.logger.error('sendTextMessage', {
        error: e,
        currentUser,
        payload,
      });
      return {
        success: false,
        error: e.message,
      };
    }
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.SendFileMessage)
  async sendFileMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendFileMessageDto,
  ): Promise<ChatResponse<any | null>> {
    try {
      this.uploadService.storeFileSlice(payload);
    } catch (e) {
      return {
        success: false,
        error: e.message,
      };
    }
    const complete = this.uploadService.fileIsComplete(payload.syncKey);
    if (complete) {
      //save to s3
      const currentUser = client.data.currentUser;
      this.logger.log('sendFileMessage:COMPLETE', { currentUser });
      try {
        const progressFunc = (_progress: number) => {
          const ret = _progress;
          if (ret == 1) {
            client.emit(`progress_${payload.syncKey}`, { finished: true });
          } else {
            client.emit(`progress_${payload.syncKey}`, {
              finished: false,
              progress: ret,
            });
          }
        };

        //1. check file is Video or Not
        //2. if file is Video
        //3. make thumnail
        //4. upload thumnail
        let frameSize;
        let thumnailPath;
        let videoDuration;
        const curretBuffer = this.uploadService.getFileBuffter(payload.syncKey);
        const currentFileType = await this.uploadService.getCurrentFileType(
          curretBuffer,
        );
        const messageTemplateType = this.chatService.getMessageTypeByMimeType(
          currentFileType?.mime,
        );

        if (messageTemplateType === MessageTemplateType.photo_type_1) {
          const dimensions = sizeOf(curretBuffer);
          frameSize = {
            width: dimensions.width,
            height: dimensions.height,
          };
        } else if (
          currentFileType &&
          messageTemplateType === MessageTemplateType.video_type_1
        ) {
          const result = await this.chatService.uploadVideoThumnailAndDuration({
            videoFile: curretBuffer,
            keyFileName: new Date().getTime().toString(),
            roomId: payload.roomId,
          });
          if (result) {
            thumnailPath = result.thumnailPath;
            videoDuration = result.videoDuration;
            frameSize = {
              width: result.dimensions.width,
              height: result.dimensions.height,
            };
          }
        }

        const { saveFilePath } = await this.uploadService.uploadToS3(
          payload,
          progressFunc,
        );

        const messagePayload: CreateMessageDto = {
          author: { authorId: currentUser.id },
          syncKey: payload.syncKey,
          roomId: payload.roomId,
          template: messageTemplateType,
          content: {
            files: [
              {
                name: payload.name,
                path: saveFilePath,
                size: payload.size,
                thumbnail: thumnailPath,
                duration: videoDuration,
                frameSize: frameSize,
              },
            ],
          },
          // data: {
          //   type: messageType,
          //   content: {
          //     files: [
          //       {
          //         name: payload.name,
          //         path: saveFilePath,
          //         size: payload.size,
          //         thumbnail: thumnailPath,
          //         duration: videoDuration,
          //         frameSize: frameSize,
          //       },
          //     ],
          //   },
          // },
        };
        this.logger.log('sendFileMessage:SEND_MESSAGE_PROCESS', {
          currentUser,
          messagePayload,
        });
        await this.sendMessageProcess(messagePayload);
        return { success: true };
      } catch (e) {
        this.logger.error('sendFileMessage', {
          error: e,
          currentUser,
          payload,
        });
        return {
          success: false,
          error: e.message,
        };
      }
    } else {
      const data = this.uploadService.getCurrentFileSlice(payload.syncKey);
      if (data) {
        client.emit(`progress_${payload.syncKey}`, {
          finished: false,
          progress: data.progress,
        });
        return {
          success: true,
          data: data,
        };
      } else {
        return {
          success: false,
          error: 'FILE_NO_EXISTS_WITH_SYNC_KEY',
          data: data,
        };
      }
    }
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.SendAnnounceMessage)
  async sendAnnounceMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendAnnounceMessageDto,
  ): Promise<ChatResponse<{ result: boolean }>> {
    const currentUser = client.data.currentUser;
    this.logger.log('sendAnnounceMessage', { currentUser, payload });

    try {
      await this.sendMessageProcess({
        author: { authorId: currentUser.id },
        syncKey: payload.syncKey,
        roomId: payload.roomId,
        template: MessageTemplateType.announce_type_1,
        content: {
          text: payload.content,
          files: payload.files.map((imgUrl) => ({ path: imgUrl, size: 0 })),
        },
        // data: {
        //   type: MessageType.ANNOUNCE,
        //   content: { text: payload.content, files: payload.files },
        // },
      });
      return {
        success: true,
        data: { result: true },
      };
    } catch (e) {
      this.logger.error('sendAnnounceMessage', {
        error: e,
        currentUser,
        payload,
      });
      return {
        success: false,
        error: e.message,
      };
    }
  }

  @UsePipes(new ValidationPipe())
  @SubscribeMessage(ChatEvents.UpdateMessage)
  async updateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: UpdateMessageDto,
  ): Promise<ChatResponse<{ message: Message }>> {
    const currentUser = client.data.currentUser;
    this.logger.log('updateMessage', { payload, currentUser });

    const message = await this.messageService.findById(payload.messageId);
    if (!message) {
      this.logger.warn('updateAnnouncement:MESSAGE_NO_EXISTS', {
        payload,
        currentUser,
      });
    }

    if (message.author.authorId !== currentUser.id) {
      return {
        success: false,
        error: ChatErrorCodes.MESSAGE_IS_NOT_MINE,
      };
    }

    const room = await this.roomService.findById(message.roomId);
    if (!room) {
      return {
        success: false,
        error: ChatErrorCodes.ROOM_NO_EXISTS,
      };
    }

    await this.messageService.updateMessage(payload.messageId, payload.data);

    message.content = payload.data;

    if (room.lastAnnounce._id == payload.messageId) {
      await this.roomService.updateLastAnnouncement(room._id, message);
      room.lastAnnounce = message;
    }
    if (room.lastMessage._id == payload.messageId) {
      await this.roomService.updateLastMessage(room._id, message);
      room.lastMessage = message;
    }

    this.emitListenRoomEvent(room);
    this.emitListenMessageEvent(MessageEventType.UPDATE, message);

    return {
      success: true,
      data: {
        message: message,
      },
    };
  }

  async emitListenRoomEvent(room: Room): Promise<void> {
    //find live connections with roomId
    const roomClients = await this.chatService.getCurrentRoomClients(
      this.wss,
      room._id,
    );

    //emit event to connections
    if (roomClients) {
      for (const clientId of roomClients) {
        this.wss.to(clientId).emit(ChatEvents.ListenRoom, room);
      }
    }
  }

  async emitListenMessageEvent(
    eventType: MessageEventType,
    message: Message,
  ): Promise<void> {
    const result = {
      eventType: eventType,
      message: message,
    };
    this.wss.to(message.roomId).emit(`listenMessage_${message.roomId}`, result);
  }
}
