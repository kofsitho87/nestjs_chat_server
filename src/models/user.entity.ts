import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export interface SignedInDevice {
  deviceToken: string;
  authToken: string;
  deviceType: string;
  deviceId: string;
}

@Schema({
  versionKey: false,
  collection: 'accounts',
})
export class User {
  _id: string;
  id: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false })
  username?: string;

  name?: string;
  nickName: string;

  @Prop({ required: false, default: null })
  phone?: string;

  @Prop({
    type: [
      {
        deviceToken: String,
        authToken: String,
        deviceType: String,
        deviceId: String,
      },
    ],
  })
  signedInDevices?: SignedInDevice[];

  identity?: string;

  // @Prop({ required: true })
  // nickName: string;

  // @Prop({ default: null })
  // profileUrl: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
