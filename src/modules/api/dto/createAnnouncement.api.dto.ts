import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAnnouncementDto {
  @IsNotEmpty()
  @IsString()
  readonly roomId: string;

  @IsNotEmpty()
  @IsString()
  readonly content: string;
}
