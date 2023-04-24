import { Module } from '@nestjs/common';
import { DingdonguChatDatabaseModule } from '../database/database.module';
import { RoomService } from './room.service';

@Module({
  imports: [DingdonguChatDatabaseModule],
  providers: [RoomService],
})
export class RoomModule {}
