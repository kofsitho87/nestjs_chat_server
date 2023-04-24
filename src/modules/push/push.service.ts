import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Room } from '@/models/room.entity';
import { Message } from '@/models/message.entity';
import { print } from 'graphql';
import gql from 'graphql-tag';
import { LoggerService } from '@/modules/logger/logger.service';
import { KafkaCoreService } from '@/modules/kafka/kafka.service';
import { MessageTemplateType, RoomType } from '@/enums/enums';

@Injectable()
export class PushService {
  private logger = new LoggerService('PushService');

  constructor(private readonly kafkaCoreService: KafkaCoreService) {}

  async readLastMessage(roomId: string, userId: string) {
    if (process.env.CHAT_ENV == 'LOCAL') {
      //
    } else {
      this.readLastMessageWithKafka([userId], roomId);
    }
  }

  async send(room: Room, message: Message, exceptPushUserIds?: string[]) {
    const joinUserIds = room.joinUsers
      .filter((ju) => {
        if (!ju.alarmOn) {
          return false;
        }
        if (exceptPushUserIds) {
          if (exceptPushUserIds.includes(ju._id)) {
            return false;
          }
        }
        return true;
      })
      .map((u) => u._id);
    if (joinUserIds.length < 1) {
      console.error('방에 회원이 존재하지 않습니다.');
      return;
    }

    const userIds = joinUserIds as [string];
    const author = message.author;

    let content = '';
    switch (message.template) {
      case MessageTemplateType.photo_type_1:
      case MessageTemplateType.video_type_1:
      case MessageTemplateType.file_type_1:
        content = '파일 메세지';
        break;
      default:
        content = message.content.text;

      // case 'PHOTO':
      // case 'VIDEO':
      // case 'FILE':
      //   content = '파일 메세지';
      //   break;
      // case 'CARD':
      //   content = message.data.content.rawData.text || '카드 메세지';
      //   break;
      // default:
      //   content = message.data.content.text;
    }
    const body = `${author.nickName ? author.nickName + ':' : ''}${content}`;
    const data = {
      roomId: room._id,
      roomType: room.roomType,
      linkSid: room.link?.sid || '',
    };

    if (process.env.CHAT_ENV == 'LOCAL') {
      //
    } else {
      /*
       * 3.23(수) 앤디의 요청으로 room.roomType = [SYSTEM_ALARM, ALARM] 일 경우에만 푸시메세지 발송
       */
      const isSilent =
        room.roomType === RoomType.GROUP || room.roomType === RoomType.INQUIRY;
      this.sendWithKafka(userIds, room._id, '[메시지]', body, data, isSilent);
    }
  }

  private async pushWithApi(
    tokens: string[],
    title: string,
    body: string,
    data: any,
  ) {
    const appToken = await this.getAppToken();
    if (!appToken) {
      return null;
    }
    const result = await axios({
      url: 'https://dev-api-notification.dingdongu.com/push',
      method: 'post',
      data: {
        operationName: 'sendPush',
        variables: {
          input: {
            tokens,
            title,
            body,
            data,
          },
          token: appToken,
        },
        query: print(gql`
          mutation sendPush($input: SendPushInput!, $token: String!) {
            sendPush(input: $input, token: $token) {
              success
              detail
            }
          }
        `),
      },
    });
    return result.data;
  }

  private async getAppToken(): Promise<string | null> {
    const dataPayload = {
      operationName: 'signInAsApp',
      variables: {},
      query: print(gql`
        mutation signInAsApp {
          signInAsApp(
            input: {
              apiKey: "E1C94F1AB1ED7EC2679371A53C2F62DE"
              secretKey: "0199B76B9259F0D446E25EDAC4ECF6EEE99103EAC07196C3309A00F417F80CC71AD9D9FE351DF14BC4E901B6C706724E021E215E02D75681A1DE9371C3394816"
            }
          ) {
            token
          }
        }
      `),
    };
    const { data } = await axios({
      url: 'https://dev-api.dingdongu.com/auth',
      method: 'post',
      data: dataPayload,
    });
    const result = data as any;
    if (!result || !result.data) {
      return null;
    }
    const appToken = result.data.signInAsApp.token;
    return appToken;
  }

  private async sendWithKafka(
    accountIds: [string],
    roomId: string,
    title: string,
    body: string,
    data: Record<string, unknown> | null,
    isSilent = false,
  ) {
    const topic = `${process.env.CHAT_ENV}_NOTIFICATION_SEND_IMPORTANT`;
    const payload = {
      accountIds: accountIds,
      type: 'CHAT',
      targetId: roomId,
      title: title,
      body: body,
      data: data,
      isSilent: isSilent,
    };
    const result = await this.kafkaCoreService.sendMessage(topic, payload);
    this.logger.log('sendWithKafka', { topic, payload, result: result });
    return payload;
  }

  private async readLastMessageWithKafka(accountIds: [string], roomId: string) {
    const topic = `${process.env.CHAT_ENV}_NOTIFICATION_READ_IMPORTANT`;
    const payload = {
      accountIds: accountIds,
      type: 'CHAT',
      targetId: roomId,
    };
    const result = await this.kafkaCoreService.sendMessage(topic, payload);
    this.logger.log('readLastMessageWithKafka', {
      topic,
      payload,
      result: result,
    });
  }
}
