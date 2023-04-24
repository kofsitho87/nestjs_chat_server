import { MessageType } from '@/enums/enums';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchMessagesByRoomDto {
  @IsNotEmpty()
  readonly roomId!: string;

  @IsString()
  @IsOptional()
  readonly keyword?: string;

  @IsEnum(MessageType)
  @IsOptional()
  readonly messageType?: MessageType;
}
