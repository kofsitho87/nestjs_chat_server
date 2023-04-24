import { IsNotEmpty } from 'class-validator';

export class SendFileMessageDto {
  @IsNotEmpty()
  readonly syncKey: string;

  @IsNotEmpty()
  readonly data: ArrayBuffer;

  @IsNotEmpty()
  readonly roomId: string;

  @IsNotEmpty()
  readonly name: string;

  // @IsNotEmpty()
  // @IsEnum(MessageType)
  // readonly type: MessageType;

  @IsNotEmpty()
  readonly size: number;
}
