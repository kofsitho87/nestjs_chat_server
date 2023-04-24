import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdateRoomAlaramSettingDto {
  @IsString()
  @IsNotEmpty()
  readonly roomId: string;

  @IsBoolean()
  @IsNotEmpty()
  readonly turnOn: boolean;
}
