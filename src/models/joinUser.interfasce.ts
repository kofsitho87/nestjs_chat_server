import { Document } from 'mongoose';
export interface JoinUser extends Document {
  _id: string;

  nickName: string;

  profileUrl?: string;

  lastReadMessageId?: string;

  master: boolean;

  alarmOn: boolean;

  meta: Record<string, any>;

  createdAt: Date;
}
