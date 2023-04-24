import { ChatService } from '@/modules/chat/chat.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ApiAuthGuard implements CanActivate {
  constructor(private readonly chatService: ChatService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const headers = request.headers;
    const chatApiKey = headers['chat-api-key'];
    if (!chatApiKey) {
      throw new UnauthorizedException('API_KEY_REQUIRED');
    }

    const result = await this.findWithKey(chatApiKey);
    if (!result) {
      throw new UnauthorizedException('API_KEY_NO_EXISTS');
    }

    return true;
  }

  async findWithKey(key: string) {
    return await this.chatService.findPlatformWithKey(key);
  }
}
