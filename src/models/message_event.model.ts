import { MessageEventType } from '@/enums/enums';
import { Message } from './message.entity';

export class MessageEvent {
  event: MessageEventType;
  message: Message;

  constructor(event: MessageEventType, message: Message) {
    this.event = event;
    this.message = message;
  }
}
