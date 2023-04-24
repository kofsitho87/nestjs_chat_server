import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApiPlatformDocument = ApiPlatform & Document;

@Schema({
  _id: false,
  versionKey: false,
  collection: 'api_platforms',
})
export class ApiPlatform {
  @Prop({ required: true, type: String, unique: true })
  platform: string;

  @Prop({ required: true, type: String })
  apiKey: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ApiPlatformSchema = SchemaFactory.createForClass(ApiPlatform);
