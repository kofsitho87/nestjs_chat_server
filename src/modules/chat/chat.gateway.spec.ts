import { MessageType } from '@/enums/enums';
import { Test, TestingModule } from '@nestjs/testing';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { AuthModule } from '../auth/auth.module';
import { TestConfigModule } from '../config/test.config.module';
import { DingdonguChatDatabaseModule } from '../database/database.module';
import { MessageService } from '../message/message.service';
import { PushModule } from '../push/push.module';
import { RoomService } from '../room/room.service';
import { UploadModule } from '../upload/upload.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { updateMessageKafkaDto } from './dto/kafka/updateMessage.kafka.dto';

describe('ChatGateway', () => {
  let gateway: ChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestConfigModule,
        NestjsFormDataModule,
        DingdonguChatDatabaseModule,
        UploadModule,
        PushModule,
        AuthModule,
      ],
      providers: [ChatGateway, ChatService, RoomService, MessageService],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('Should be defined', () => {
    expect(gateway).toBeDefined();
  });

  // it('listenToUpdateMessageFromKafka', () => {
  //   const kafkaPayload: updateMessageKafkaDto = {
  //     messageId: '',
  //     data: {
  //       type: MessageType.CARD,
  //       content: {},
  //     },
  //   };
  //   gateway.listenToUpdateMessageFromKafka(kafkaPayload);
  // });
});
