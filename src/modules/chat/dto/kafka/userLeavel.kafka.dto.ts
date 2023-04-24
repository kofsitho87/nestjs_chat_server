import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class UserLeaveKafkaDto {
  @IsString()
  @IsMongoId()
  readonly userId: string;

  @IsOptional()
  @IsString()
  readonly linkSid?: string;
}
