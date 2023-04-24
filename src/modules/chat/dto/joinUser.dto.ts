import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class JoinUserDto {
  @IsMongoId()
  @IsString()
  @IsNotEmpty()
  readonly _id: string;

  @IsString()
  @IsNotEmpty()
  readonly nickName: string;

  @IsBoolean()
  readonly master: boolean;

  readonly profileUrl: string = null;

  @IsOptional()
  @IsObject()
  readonly meta: Record<string, any> = null;
}
