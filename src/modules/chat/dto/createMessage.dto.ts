import { MessageTemplateType, MessageType } from '@/enums/enums';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class MessageDataDto {
  @IsEnum(MessageType)
  type: MessageType;

  @IsNotEmpty()
  @IsObject()
  content: any;
}

export class MessageTemplateFileDto {
  path: string;
  size: number;
  name?: string;
  thumbnail?: string;
  duration?: number;
  frameSize?: { width: number; height: number };
}

export class MessageContentDto {
  title?: string;
  text?: string;
  files?: MessageTemplateFileDto[];
}

export class AuthorDto {
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @IsOptional({ always: false })
  @IsString()
  nickName?: string = null;

  @IsOptional({ always: false })
  @IsString()
  profileUrl?: string = null;
}
export class CreateMessageDto {
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => AuthorDto)
  author: AuthorDto;

  @IsNotEmpty()
  roomId: string;

  @IsNotEmpty()
  syncKey: string;

  // @IsNotEmpty()
  // data: MessageDataDto;

  @IsNotEmpty()
  @IsEnum(MessageTemplateType)
  template: MessageTemplateType;

  @IsNotEmpty()
  content: MessageContentDto;

  @IsOptional()
  @IsObject()
  readonly meta?: Record<string, any>;
}

// export class DeleteMessageDto {
//   @IsNotEmpty()
//   room: Room;

//   @IsString()
//   @IsNotEmpty()
//   authorId: string;

//   @IsNotEmpty()
//   @IsString()
//   messageId: string;
// }
