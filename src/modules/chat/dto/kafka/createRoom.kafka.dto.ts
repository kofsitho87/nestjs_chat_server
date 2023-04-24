import { MessageTemplateType, RoomType } from '@/enums/enums';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  AuthorDto,
  MessageContentDto,
  MessageDataDto,
} from '../createMessage.dto';
import { JoinUserDto } from '../joinUser.dto';

class LinkDto {
  @IsNotEmpty()
  @IsString()
  readonly sid: string;

  @IsNotEmpty()
  @IsString()
  readonly name: string;
}

class MessageDto {
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => AuthorDto)
  author: AuthorDto;

  @IsEnum(MessageTemplateType)
  template: MessageTemplateType;

  @IsNotEmpty()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => MessageContentDto)
  content: MessageContentDto;
}

export class CreateRoomWithMessageKafkaDto {
  @IsEnum(RoomType)
  @IsNotEmpty()
  readonly roomType: RoomType;

  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly profileUrl: string;

  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  readonly link: LinkDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => JoinUserDto)
  readonly joinUsers: [JoinUserDto];

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  readonly message: MessageDto;

  @IsOptional()
  @IsObject()
  readonly meta: Record<string, any>;
}
