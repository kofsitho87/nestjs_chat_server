import { IsNotEmpty } from 'class-validator';

export class ReadMessageDto {
  userId: string;

  @IsNotEmpty()
  readonly roomId: string;

  @IsNotEmpty()
  readonly messageId: string;
}