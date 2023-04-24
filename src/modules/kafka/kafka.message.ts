import { MessageCardType, MessageType } from '@/enums/enums';

export class SendPushPayload {
  public tokens: string[];
  public title: string;
  public body: string;
  public data: Record<string, unknown> | null;
  // public topicName: string;
  // public createdTime?: string;

  create?(tokens, title, body, data): SendPushPayload {
    return {
      tokens,
      title,
      body,
      data,
    };
  }
}

interface JoinUser {
  _id: string;
  nickName: string;
  profileUrl?: string | null;
}

interface RawData {
  cardType: MessageCardType;
  content: any;
}

export class ConsumeSendAlarmMessagePayload {
  public from: JoinUser;
  public to: JoinUser;
  public messageType: MessageType;
  public rawData: RawData;

  create?(from, to, messageType, rawData): ConsumeSendAlarmMessagePayload {
    return {
      from,
      to,
      messageType,
      rawData,
    };
  }
}

export declare class KafkaConfig {
  clientId: string;
  brokers: string[];
  groupId: string;
  ssl: boolean;
}
