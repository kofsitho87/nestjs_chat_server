import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { UploadModule } from './modules/upload/upload.module';
import { LoggerModule } from './modules/logger/logger.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { PushModule } from './modules/push/push.module';
import { RoomModule } from './modules/room/room.module';
import { MessageModule } from './modules/message/message.module';
import { ApiModule } from './modules/api/api.module';

@Module({
  imports: [
    KafkaModule.register({
      clientId: 'DU-MSK-DEV',
      brokers: eval(process.env.KAFKA_BROKERS),
      groupId: `${process.env.CHAT_ENV}-SEND_PUSH_MESSAGE`,
      ssl: process.env.CHAT_ENV != 'LOCAL',
    }),
    LoggerModule,
    DatabaseModule,
    AuthModule,
    ChatModule,
    UploadModule,
    PushModule,
    RoomModule,
    MessageModule,
    ApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
