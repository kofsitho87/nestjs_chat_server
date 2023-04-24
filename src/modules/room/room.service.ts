import { BaseService } from '@/common/base.service';
import { OptionalSelection } from '@/common/types';
import { Message, MessageDocument } from '@/models/message.entity';
import { Room, RoomDocument } from '@/models/room.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRoomDto } from '../chat/dto/createRoom.dto';
import { UserLeaveKafkaDto } from '../chat/dto/kafka/userLeavel.kafka.dto';
import { UpdateRoomSettingData } from '../chat/dto/updateRoomSetting.dto';
import { CreateMessageDto } from '../chat/dto/createMessage.dto';

@Injectable()
export class RoomService extends BaseService<RoomDocument> {
  constructor(
    @InjectModel('rooms') private roomModel: Model<RoomDocument>,
    @InjectModel('messages') private messageModel: Model<MessageDocument>,
  ) {
    super(roomModel);
  }

  async getUnreadMsgCount(
    roomId: string,
    lastReadMessageId?: string,
    joinRoomDate?: Date,
  ): Promise<number> {
    if (!lastReadMessageId) {
      return await this.messageModel.countDocuments({
        roomId,
        createdAt: {
          $gt: joinRoomDate,
        },
      });
    }

    return await this.messageModel.countDocuments({
      roomId,
      _id: {
        $gt: lastReadMessageId,
      },
    });
  }

  async getRoomsWithUnReadMsgCount(
    currentUserId: string,
    filter: any,
  ): Promise<RoomDocument[]> {
    const rooms = await this.find(filter);
    const roomsWithUnreadMsgCount = await Promise.all(
      rooms.map(async (r) => {
        const roomId = r._id;
        const joinUserRow = r.joinUsers.find((j) => j._id == currentUserId);
        const lastReadMessageId = joinUserRow.lastReadMessageId;
        const joinRoomDate = joinUserRow.createdAt;
        r.unreadMsgCount = await this.getUnreadMsgCount(
          roomId,
          lastReadMessageId,
          joinRoomDate,
        );
        return r;
      }),
    );
    return roomsWithUnreadMsgCount;
  }

  async getMyRoomWithId(
    roomId: string,
    userId: string,
    projection?: Record<string, number>,
  ): Promise<Room> {
    const filter = {
      _id: roomId,
      'joinUsers._id': userId,
    };
    const roomDoc: RoomDocument = await this.findOne(filter, projection);
    const room = new Room(roomDoc);
    return room;
  }

  async leaveOutRoom(roomId: string, userIds: [string]): Promise<boolean> {
    return this.updateOne(
      { _id: roomId },
      { $pull: { joinUsers: { _id: { $in: userIds } } } },
    );
  }

  async updateLastReadMessage(
    filter: { roomId: string; userId: string },
    messageId: string,
  ) {
    await this.roomModel.updateOne(
      {
        _id: filter.roomId,
        'joinUsers._id': filter.userId,
      },
      { $set: { 'joinUsers.$.lastReadMessageId': messageId } },
    );
    return true;
  }

  async updateAllLastReadMessage(payload: any): Promise<boolean> {
    await this.roomModel.updateMany(
      {
        _id: payload.roomId,
        'joinUsers.id': { $in: payload.joinUserIds },
      },
      {
        $set: { 'joinUsers.$.lastReadMessageId': payload.messageId },
      },
    );
    return true;
  }

  async createNewRoom(payload: CreateRoomDto): Promise<RoomDocument> {
    const roomModel = new this.roomModel(payload);
    const roomDoc = await roomModel.save();
    // return new Room(roomDoc);
    return roomDoc;
  }

  async updateRoomSetting(
    roomId: string,
    userId: string,
    data: UpdateRoomSettingData,
  ): Promise<boolean> {
    const { nModified } = await this.roomModel.updateOne(
      {
        _id: roomId,
        'joinUsers._id': userId,
      },
      { $set: data },
    );
    return nModified > 0;
  }

  async updateRoomsSetting(matchFilter: any, data: any): Promise<boolean> {
    const { nModified } = await this.roomModel.updateMany(matchFilter, {
      $set: data,
    });
    return nModified > 0;
  }

  async updateRoomAlarm(roomId: string, userId: string, turnOnOff: boolean) {
    const { nModified } = await this.roomModel.updateOne(
      {
        _id: roomId,
        'joinUsers._id': userId,
      },
      { $set: { 'joinUsers.$.alarmOn': turnOnOff } },
    );
    return nModified > 0;
  }

  async inviteRoom(room: Room, joinUsers: any[]): Promise<boolean> {
    const roomJoinUserIds = room.joinUsers.map((ru) => ru._id);
    const notDuplicatedJoinUsers = joinUsers.filter(
      (ju) => !roomJoinUserIds.includes(ju._id),
    );
    if (notDuplicatedJoinUsers.length < 1) {
      throw new Error('WRONG_TARGET_USER_IDS');
    }

    const result = await this.updateOne(
      { _id: room._id },
      { $push: { joinUsers: notDuplicatedJoinUsers } },
    );
    if (!result) {
      throw new Error('JOIN_USER_ALREADY_EXISTS');
    }
    return true;
  }

  async findRooms(filter: any, selection?: OptionalSelection) {
    return this.find(filter, selection);
  }

  async userLeaveToRooms(payload: UserLeaveKafkaDto) {
    const { userId, linkSid } = payload;
    const matchFilter: any = { 'joinUsers._id': userId };
    if (linkSid) {
      matchFilter['link.sid'] = linkSid;
    }
    if (linkSid) {
      const rooms = await this.find(matchFilter);
      for (const room of rooms) {
        await this.messageModel.updateMany(
          {
            roomId: room._id,
            'author.authorId': userId,
          },
          {
            'author.nickName': '',
            'author.profileUrl': null,
          },
        );
      }
    } else {
      await this.messageModel.updateMany(
        {
          'author.authorId': userId,
        },
        {
          'author.nickName': '',
          'author.profileUrl': null,
        },
      );
    }

    await this.roomModel.updateMany(matchFilter, {
      $pull: {
        joinUsers: { _id: userId },
      },
    });
    return true;
  }

  async updateLastMessage(roomId: string, message: Message): Promise<boolean> {
    // const messageDoc = new this.messageModel(message);
    const { nModified } = await this.roomModel.updateOne(
      { _id: roomId },
      { lastMessage: message },
    );
    return nModified > 0;
  }

  async updateLastAnnouncement(
    roomId: string,
    message: Message,
  ): Promise<boolean> {
    const messageDoc = new this.messageModel(message);
    const { nModified } = await this.roomModel.updateOne(
      { _id: roomId },
      { lastAnnounce: messageDoc },
      // { $set: { lastAnnounce: messageDoc } },
    );
    return nModified > 0;
  }

  async deleteLastMessage(roomId: string): Promise<boolean> {
    const { nModified } = await this.roomModel.updateOne(
      { _id: roomId },
      { lastMessage: null },
    );
    return nModified > 0;
  }

  async deleteLastAnnouncement(roomId: string): Promise<boolean> {
    const { nModified } = await this.roomModel.updateOne(
      { _id: roomId },
      { lastAnnounce: null },
    );
    return nModified > 0;
  }
}
