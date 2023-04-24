import { MessageType } from '@/enums/enums';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class ReadMessagesByRoomDto {
  userId: string;
  createdAt: Date;

  @IsNotEmpty()
  readonly roomId: string;

  @IsOptional()
  readonly lastMessageId: string;

  @IsInt()
  @IsNotEmpty()
  readonly count: number = 10;

  @IsOptional()
  readonly messageType: MessageType;
}
