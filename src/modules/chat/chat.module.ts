import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { RoomService } from '../room/room.service';
import { MessageService } from '../message/message.service';
import { DingdonguChatDatabaseModule } from '@/modules/database/database.module';
import { UploadModule } from '@/modules/upload/upload.module';
import { PushModule } from '@/modules/push/push.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DingdonguChatDatabaseModule, UploadModule, PushModule, AuthModule],
  controllers: [],
  providers: [ChatGateway, ChatService, RoomService, MessageService],
  exports: [ChatGateway],
})
export class ChatModule {}
