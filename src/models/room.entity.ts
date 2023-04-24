import { RoomType } from '@/enums/enums';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { JoinUser } from './joinUser.interfasce';
import { Message } from './message.entity';

export type RoomDocument = Room & Document;

@Schema({
  versionKey: false,
  collection: 'rooms',
})
export class Room {
  constructor(roomDoc: RoomDocument) {
    Object.assign(this, roomDoc);
  }

  _id: string;

  @Prop({ enum: RoomType, deafult: RoomType.GROUP, type: String })
  roomType: RoomType;

  @Prop({ required: true })
  name: string;

  @Prop({ default: null })
  profileUrl: string;

  @Prop({
    type: {
      sid: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        default: null,
      },
    },
    default: null,
  })
  link: Record<string, any>;

  @Prop({
    type: [
      {
        _id: {
          type: String,
          required: true,
        },
        nickName: {
          type: String,
          required: true,
        },
        profileUrl: {
          type: String,
          default: null,
        },
        lastReadMessageId: {
          type: String,
          default: null,
        },
        master: {
          type: Boolean,
          default: false,
        },
        alarmOn: {
          type: Boolean,
          default: true,
        },
        meta: {
          type: Object,
          default: null,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  })
  joinUsers: JoinUser[];
  @Prop(
    raw({
      canCopyMessage: { type: Boolean, default: true },
      canCaptureMessage: { type: Boolean, default: true },
      canDeleteMessage: { type: Boolean, default: true },
      canShareMessage: { type: Boolean, default: true },
      canInviteMemebrs: { type: Boolean, default: false },
      canLeaveOutRoom: { type: Boolean, default: false },
      canShowMemberList: { type: Boolean, default: true },
      isFreezed: { type: Boolean, default: false },
    }),
  )
  rules: Record<string, any>;

  @Prop({
    required: false,
    default: null,
    type: Message,
  })
  lastMessage: Message;

  @Prop({
    required: false,
    default: null,
    type: Message,
  })
  lastAnnounce: Message;

  @Prop({
    type: Object,
    default: null,
  })
  meta?: Record<string, any>;

  @Prop({
    required: false,
    default: null,
    type: String,
  })
  freezingReasonCode?: string; //ex: MASTER_LEFT,

  @Prop({ default: Date.now })
  createdAt: Date;

  unreadMsgCount: number;

  master(): JoinUser | null {
    return this.joinUsers.find((ju) => ju.master);
  }

  isMaster(userId: string): boolean {
    const masterUser = this.master();
    return masterUser._id === userId;
  }

  getJoinUser(userId: string): JoinUser {
    return this.joinUsers.find((ju) => ju._id === userId);
  }
}

export const RoomSchema = SchemaFactory.createForClass(Room);
