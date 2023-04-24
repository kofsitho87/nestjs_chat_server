import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional } from 'class-validator';

export class SendAnnounceMessageDto {
  @IsNotEmpty()
  readonly syncKey: string;

  @IsNotEmpty()
  readonly roomId: string;

  @IsNotEmpty()
  readonly content: string;

  @IsArray()
  @Type(() => String)
  @IsOptional()
  readonly files?: string[];
}
