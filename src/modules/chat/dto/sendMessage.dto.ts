import { IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  readonly syncKey: string;

  @IsNotEmpty()
  readonly roomId: string;

  @IsNotEmpty()
  readonly content: string;
}
