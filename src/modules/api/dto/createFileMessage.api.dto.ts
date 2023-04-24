import { IsNotEmpty, IsString } from 'class-validator';

export class createFileMessageDto {
  @IsNotEmpty()
  @IsString()
  readonly roomId: string;

  @IsNotEmpty()
  @IsString()
  readonly syncKey: string;
}
