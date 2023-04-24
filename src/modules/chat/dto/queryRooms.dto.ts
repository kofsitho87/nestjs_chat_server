import { RoomType } from '@/enums/enums';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class QueryRoomsDto {
  @IsOptional()
  @IsEnum(RoomType)
  readonly roomType?: RoomType;

  @IsOptional()
  @IsArray()
  readonly roomTypes?: RoomType[];

  @IsOptional()
  @IsString()
  readonly linkSid?: string;

  @IsOptional()
  @IsBoolean()
  readonly masterUser?: boolean;
}
