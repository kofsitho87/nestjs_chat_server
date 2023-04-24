import { MessageTemplateType } from '@/enums/enums';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MessageTemplateContent } from './message.content.entity';

export type MessageDocument = Message & Document;

// @Schema({
//   versionKey: false,
//   _id: false,
// })
// class MessageFile {
//   @Prop({ required: true, type: String })
//   name!: string;

//   @Prop({ required: true, type: String })
//   path!: string;

//   @Prop({ required: true, type: Number })
//   size!: number;

//   @Prop({ required: false, type: String, default: null })
//   thumbnail?: string;

//   @Prop({ required: false, type: Number, default: null })
//   duration?: number;

//   @Prop({ required: false, type: FrameSize, default: null })
//   frameSize?: FrameSize;
// }

// @Schema({
//   versionKey: false,
//   _id: false,
// })
// class MessageContent {
//   @Prop({ required: false, type: String, default: null })
//   text?: string;

//   @Prop([MessageFile])
//   files?: MessageFile[];

//   @Prop({ required: false, type: CardData, default: null })
//   rawData?: CardData;
// }

// @Schema({
//   versionKey: false,
//   _id: false,
// })
// class MessageData {
//   @Prop({ required: true, type: String })
//   type!: MessageType;

//   @Prop({ required: true, type: MessageContent })
//   content!: MessageContent;
// }

@Schema({
  versionKey: false,
  _id: false,
})
class MessageAuthor {
  @Prop({ required: true, type: String })
  authorId!: string;

  @Prop({ required: false, type: String, default: null })
  nickName?: string;

  @Prop({ required: false, type: String, default: null })
  profileUrl?: string;
}

@Schema({
  versionKey: false,
  _id: false,
})
class MessageStatus {
  @Prop({ required: false, type: Boolean, default: false })
  deleted?: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  hidden?: string;
}

@Schema({
  versionKey: false,
  collection: 'messages',
})
export class Message {
  _id: string;

  @Prop({ required: true, type: String })
  syncKey!: string;

  @Prop({ required: true, type: String })
  roomId!: string;

  @Prop({
    type: MessageAuthor,
    required: true,
  })
  author!: MessageAuthor;

  @Prop({
    required: true,
    enum: MessageTemplateType,
    type: String,
  })
  template!: MessageTemplateType;

  @Prop({
    required: true,
    type: MessageTemplateContent,
  })
  content!: MessageTemplateContent;

  // @Prop({
  //   type: MessageData,
  //   required: true,
  // })
  // data!: MessageData;

  @Prop({
    type: Object,
    default: null,
  })
  meta?: Record<string, any>;

  @Prop({
    required: false,
    type: MessageStatus,
  })
  status?: MessageStatus;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message).index({
  roomId: 1,
});
