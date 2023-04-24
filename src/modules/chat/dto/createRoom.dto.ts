import { RoomType } from '@/enums/enums';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { JoinUserDto } from './joinUser.dto';
import { RoomRuleDto } from './roomRule.dto';

class CreateLinkDto {
  @IsNotEmpty()
  @IsString()
  readonly sid: string;

  @IsNotEmpty()
  @IsString()
  readonly name: string;
}
export class CreateRoomDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly profileUrl: string;

  @IsNotEmpty()
  @IsEnum(RoomType)
  readonly roomType: RoomType;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => RoomRuleDto)
  readonly rules: RoomRuleDto;

  @MinLength(1, {
    each: true,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => JoinUserDto)
  readonly joinUsers: [JoinUserDto];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateLinkDto)
  readonly link: CreateLinkDto;

  @IsOptional()
  @IsObject()
  readonly meta: Record<string, any>;
}
