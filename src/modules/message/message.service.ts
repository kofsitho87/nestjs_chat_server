import { BaseService } from '@/common/base.service';
import {
  CompareOperator,
  MessageTemplateType,
  MessageType,
  OrderbyOperator,
} from '@/enums/enums';
import { Message, MessageDocument } from '@/models/message.entity';
import { RoomDocument } from '@/models/room.entity';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMessageDto } from '../chat/dto/createMessage.dto';
import { SearchMessagesByRoomDto } from '../chat/dto/searchMessagesByRoom.dto';

@Injectable()
export class MessageService extends BaseService<MessageDocument> {
  constructor(
    @InjectModel('messages') private messageModel: Model<MessageDocument>,
    @InjectModel('rooms') private roomModel: Model<RoomDocument>,
  ) {
    super(messageModel);
  }

  async createMessage(payload: CreateMessageDto): Promise<Message> {
    const messageDoc = new this.messageModel(payload);

    const updateData: any = { lastMessage: messageDoc };

    //lastAnnounce
    // if (payload.data.type === MessageType.ANNOUNCE) {
    //   updateData.lastAnnounce = messageDoc;
    // }
    if (payload.template === MessageTemplateType.announce_type_1) {
      updateData.lastAnnounce = messageDoc;
    }

    await this.roomModel.updateOne({ _id: payload.roomId }, updateData);
    return await messageDoc.save();
  }

  async getMessages(payload: {
    roomId: string;
    count?: number;
    lastMessageId?: string;
    createdAt?: Date;
    messageType?: MessageType;
  }): Promise<Message[]> {
    const count = payload.count || 10;
    const findMatch = {
      roomId: payload.roomId,
    };
    if (payload.lastMessageId) {
      findMatch['_id'] = { $lt: payload.lastMessageId };
    }
    if (payload.createdAt) {
      findMatch['createdAt'] = { $gte: payload.createdAt };
    }
    if (payload.messageType) {
      findMatch['data.type'] = payload.messageType;
    }

    const messages = await this.messageModel
      .find(findMatch)
      .limit(count)
      .sort({ _id: -1 })
      .lean();

    messages.reverse();
    return messages;
  }

  async getMessagesByRoom(payload: {
    roomId: string;
    message?: { _id: string; operator: CompareOperator };
    sort?: {
      fieldName: string;
      orderBy: OrderbyOperator;
    };
    count?: number;
    messageType?: MessageType;
  }): Promise<Message[]> {
    const count = payload.count || 10;
    const findMatch = {
      roomId: payload.roomId,
    };
    if (payload.message) {
      findMatch['_id'] = { [payload.message.operator]: payload.message._id };
    }
    // if (payload.createdAt) {
    //   findMatch['createdAt'] = { $gte: payload.createdAt };
    // }
    if (payload.messageType) {
      findMatch['data.type'] = payload.messageType;
    }

    const promise = this.messageModel.find(findMatch).limit(count);
    if (payload.sort) {
      promise.sort({
        [payload.sort.fieldName]:
          payload.sort.orderBy == OrderbyOperator.ASC ? 1 : -1,
      });
    }

    const messages = await promise.lean();
    // if (payload.sort && payload.sort.orderBy === OrderbyOperator.DESC) {
    //   messages.reverse();
    // }
    return messages;
  }

  async searchMessages(payload: SearchMessagesByRoomDto): Promise<Message[]> {
    const findMatch = {
      roomId: payload.roomId,
    };
    if (payload.keyword) {
      findMatch['data.content.text'] = { $regex: payload.keyword };
    }
    if (payload.messageType) {
      findMatch['data.type'] = payload.messageType;
    }
    const messages = await this.messageModel
      .find(findMatch)
      .sort({ _id: -1 })
      .lean();
    return messages;
  }

  async getMessage(messageId: string): Promise<Message> {
    return await this.findOne({ _id: messageId });
  }

  async updateMessage(messageId: string, data: any) {
    return await this.updateOne({ _id: messageId }, { data });
  }
}
