import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { MessageContentDto } from './createMessage.dto';

export class UpdateMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly messageId: string;

  @IsNotEmpty()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => MessageContentDto)
  data: MessageContentDto;
}
