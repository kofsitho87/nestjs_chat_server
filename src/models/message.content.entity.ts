import { MessageTemplateButtonAction } from '@/enums/enums';
import { Schema, Prop } from '@nestjs/mongoose';

export class MessageTemplateButton {
  @Prop({
    required: true,
    type: String,
  })
  title!: string;

  @Prop({
    required: false,
    type: String,
    default: null,
  })
  style?: string;

  @Prop({
    required: true,
    type: String,
    enum: MessageTemplateButtonAction,
  })
  action!: MessageTemplateButtonAction;

  @Prop({
    required: false,
    type: Object,
    default: null,
  })
  arguments?: Record<string, any>;
}

@Schema({
  versionKey: false,
  _id: false,
})
export class FrameSize {
  @Prop({ required: true, type: Number })
  width!: number;

  @Prop({ required: true, type: Number })
  height!: number;
}

export class MessageTemplateFile {
  @Prop({
    required: true,
    type: String,
  })
  path!: string;

  @Prop({
    required: true,
    type: Number,
  })
  size!: number;

  @Prop({
    required: false,
    type: String,
    default: null,
  })
  name?: string;

  @Prop({
    required: false,
    type: String,
    default: null,
  })
  thumbnail?: string;

  @Prop({
    required: false,
    type: Number,
    default: null,
  })
  duration?: number;

  @Prop({ required: false, type: FrameSize, default: null })
  frameSize?: FrameSize;
}

@Schema({
  versionKey: false,
  _id: false,
})
export class MessageTemplateContent {
  @Prop({
    required: false,
    type: String,
    default: null,
  })
  title?: string;

  @Prop({
    required: false,
    type: String,
    default: null,
  })
  text?: string;

  @Prop({
    _id: false,
    required: false,
    type: MessageTemplateFile,
    default: null,
  })
  files?: MessageTemplateFile[];

  @Prop({
    _id: false,
    required: false,
    type: MessageTemplateButton,
    default: null,
  })
  buttons?: MessageTemplateButton[];
}
