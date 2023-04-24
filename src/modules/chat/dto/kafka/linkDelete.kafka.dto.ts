import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

class Link {
  @IsString()
  readonly linkSid: string;
}

export class LinkDeleteKafkaDto {
  @IsNotEmpty()
  @IsObject()
  @Type(() => Link)
  readonly link: Link;
}
