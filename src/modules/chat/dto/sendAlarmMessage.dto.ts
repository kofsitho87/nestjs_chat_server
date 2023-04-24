import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { MessageCardType, MessageType } from '@/enums/enums';
import { JoinUserDto } from './joinUser.dto';

class RawData {
  @IsNotEmpty()
  @IsEnum(MessageCardType)
  readonly cardType: MessageCardType;

  @IsNotEmpty()
  readonly content: any;
}

export class SendAlarmMessageDto {
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => JoinUserDto)
  readonly from: JoinUserDto;

  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => JoinUserDto)
  readonly to: JoinUserDto;

  @IsNotEmpty()
  @IsEnum(MessageType)
  readonly messageType: MessageType;

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => RawData)
  readonly rawData?: RawData = null;
}
