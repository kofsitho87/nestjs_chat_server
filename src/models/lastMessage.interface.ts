import { MessageType } from '@/enums/enums';
import { Document } from 'mongoose';
export interface LastMessage extends Document {
  _id: string;

  authorId: string;

  syncKey: string;

  data: {
    type: {
      type: {
        enum: MessageType;
        default: 'TEXT';
      };
      content: {
        type: string;
        default: null;
      };
    };
    required: true;
  };

  createdAt: Date;
}
