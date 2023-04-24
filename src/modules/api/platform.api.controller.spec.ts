import { Test, TestingModule } from '@nestjs/testing';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { ChatService } from '../chat/chat.service';
import { TestConfigModule } from '../config/test.config.module';
import { DingdonguChatDatabaseModule } from '../database/database.module';
import { MessageService } from '../message/message.service';
import { PushModule } from '../push/push.module';
import { RoomService } from '../room/room.service';
import { UploadModule } from '../upload/upload.module';
import { ApiController } from './platform.api.controller';

describe('ApiController', () => {
  let controller: ApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TestConfigModule,
        NestjsFormDataModule,
        // DingdonguChatDatabaseModule,
        // ChatModule,
        // UploadModule,
        // PushModule,
        AuthModule,
      ],
      controllers: [ApiController],
      // providers: [ChatService, RoomService, MessageService],
    }).compile();

    controller = module.get<ApiController>(ApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
