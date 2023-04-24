import { Module } from '@nestjs/common';
import { DingdonguChatDatabaseModule } from '../database/database.module';
import { MessageService } from './message.service';

@Module({
  imports: [DingdonguChatDatabaseModule],
  providers: [MessageService],
})
export class MessageModule {}
