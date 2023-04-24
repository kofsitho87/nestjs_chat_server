import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConnectionDocument = Connection & Document;

@Schema({
  versionKey: false,
  collection: 'connections',
  // _id: false,
})
export class Connection {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  clientId: string;

  @Prop(
    raw({
      _id: { type: String, required: true },
      nickName: { type: String, required: true },
      email: { type: String, required: true },
      profileUrl: { type: String, default: null },
    }),
  )
  user: Record<string, any>;

  @Prop({
    type: Date,
    expires: 3600,
    default: Date.now,
  })
  expireAt: Date;
}

export const ConnectionSchema = SchemaFactory.createForClass(Connection);
