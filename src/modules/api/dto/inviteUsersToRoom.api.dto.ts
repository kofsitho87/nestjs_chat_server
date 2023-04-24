import { JoinUserDto } from '@/modules/chat/dto/joinUser.dto';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class InviteUsersToRoomApiDto {
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  readonly roomId: string;

  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  readonly inviterId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsNotEmpty({
    message: 'JOIN_USERS_IS_REQUIRED',
  })
  @ValidateNested({ each: true })
  @Type(() => JoinUserDto)
  readonly joinUsers: [JoinUserDto];
}
