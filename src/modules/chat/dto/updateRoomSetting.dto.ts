import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RoomRuleDto } from './roomRule.dto';

export class UpdateRoomSettingData {
  @IsString()
  @IsOptional()
  readonly name?: string;

  @IsOptional()
  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => RoomRuleDto)
  rules?: RoomRuleDto;
}

export class UpdateRoomSettingDto {
  @IsString()
  @IsNotEmpty()
  readonly roomId: string;

  @IsNotEmpty()
  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => UpdateRoomSettingData)
  updateData: UpdateRoomSettingData;
}
