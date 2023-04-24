import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { config } from 'dotenv';
import { join } from 'path';
import { SocketIoAdapter } from './utils/socket-io.adapter';

config({
  path: `./env/.env.${
    process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'local'
  }`,
});

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    // bufferLogs: false,
    // logger: new LoggerService(),
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useWebSocketAdapter(new SocketIoAdapter(app));

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  const port = process.env.CHAT_PORT || 3000;
  await app
    .listen(port)
    .then(() => console.log(`Listening on http://localhost:${port}`));
}
bootstrap();
