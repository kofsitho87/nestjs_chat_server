import { IsNotEmpty, IsString } from 'class-validator';

export class KickOutUserDto {
  @IsNotEmpty()
  readonly roomId: string;

  @IsString({ each: true })
  @IsNotEmpty()
  readonly targetUserIds: [string];
}
