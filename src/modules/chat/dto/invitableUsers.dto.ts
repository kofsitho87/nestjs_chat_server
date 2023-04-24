import { IsInt, IsOptional, IsString } from 'class-validator';

export class InviteableUsersDto {
  @IsOptional()
  @IsString()
  readonly roomId?: string;

  @IsOptional()
  @IsInt()
  readonly page?: number = 1;

  @IsOptional()
  @IsInt()
  readonly count?: number = 10;
}
