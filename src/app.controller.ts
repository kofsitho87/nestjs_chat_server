import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessageType } from './enums/enums';
import { ChatGateway } from './modules/chat/chat.gateway';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('/')
  ok() {
    return 'ok';
  }
}
