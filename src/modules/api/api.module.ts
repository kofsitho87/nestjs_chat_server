import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { ChatService } from '../chat/chat.service';
import { DingdonguChatDatabaseModule } from '../database/database.module';
import { MessageService } from '../message/message.service';
import { PushModule } from '../push/push.module';
import { RoomService } from '../room/room.service';
import { UploadModule } from '../upload/upload.module';
import { ChatApiController } from './chat.api.controller';
import { PlatformApiController } from './platform.api.controller';

@Module({
  imports: [
    DingdonguChatDatabaseModule,
    ChatModule,
    UploadModule,
    PushModule,
    AuthModule,
  ],
  providers: [ChatService, RoomService, MessageService],
  controllers: [PlatformApiController, ChatApiController],
})
export class ApiModule {}
