import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAnnouncementDto {
  @IsNotEmpty()
  @IsString()
  readonly roomId: string;

  @IsNotEmpty()
  @IsString()
  readonly messageId: string;

  @IsNotEmpty()
  @IsString()
  readonly content: string;
}
