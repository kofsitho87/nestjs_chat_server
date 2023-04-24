import { MessageTemplateType, RoomType } from '@/enums/enums';
import {
  AuthorDto,
  MessageContentDto,
} from '@/modules/chat/dto/createMessage.dto';
import { JoinUserDto } from '@/modules/chat/dto/joinUser.dto';
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

class MessageDto {
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => AuthorDto)
  author: AuthorDto;

  @IsNotEmpty()
  @IsEnum(MessageTemplateType)
  template!: MessageTemplateType;

  @IsNotEmpty()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => MessageContentDto)
  content: MessageContentDto;
}

class CreateLinkDto {
  @IsNotEmpty()
  @IsString()
  readonly sid: string;

  @IsNotEmpty()
  @IsString()
  readonly name: string;
}
export class CreateRoomApiDto {
  @IsNotEmpty({
    message: 'NAME_IS_REQUIRED',
  })
  @IsString({
    message: 'NAME_IS_STRING',
  })
  readonly name: string;

  @IsOptional()
  @IsString({
    message: 'PROFILE_URL_IS_STRING',
  })
  readonly profileUrl?: string;

  @IsNotEmpty({
    message: 'ROOM_TYPE_IS_REQUIRED',
  })
  @IsEnum(RoomType, {
    message: 'ROOM_TYPE_IS_ENUM',
  })
  readonly roomType: RoomType;

  @IsArray()
  @ArrayMinSize(1)
  @IsNotEmpty({
    message: 'JOIN_USERS_IS_REQUIRED',
  })
  @ValidateNested({ each: true })
  @Type(() => JoinUserDto)
  readonly joinUsers: [JoinUserDto];

  @IsNotEmpty({
    message: 'LINK_IS_REQUIRED',
  })
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => CreateLinkDto)
  readonly link: CreateLinkDto;

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  readonly message?: MessageDto;

  @IsOptional()
  @IsObject()
  readonly meta?: Record<string, any>;
}
