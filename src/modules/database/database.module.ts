import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConnectionSchema } from '@/models/connection.entity';
import { ApiPlatformSchema } from '@/models/api.platform.entity';
import { MessageSchema } from '@/models/message.entity';
import { RoomSchema } from '@/models/room.entity';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_HOST, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      connectionName: 'CHAT',
    }),
  ],
})
export class DatabaseModule {}

export const DingdonguChatDatabaseModule = MongooseModule.forFeature(
  [
    { name: 'messages', schema: MessageSchema },
    { name: 'rooms', schema: RoomSchema },
    { name: 'connections', schema: ConnectionSchema },
    { name: 'apiPlatforms', schema: ApiPlatformSchema },
  ],
  'CHAT',
);
