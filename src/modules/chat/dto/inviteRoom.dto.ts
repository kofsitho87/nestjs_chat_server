import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { JoinUserDto } from './joinUser.dto';

export class InviteRoomDto {
  @IsNotEmpty()
  readonly roomId: string;

  //added
  @IsArray()
  @ArrayMinSize(1)
  @IsNotEmpty({
    message: 'JOIN_USERS_IS_REQUIRED',
  })
  @ValidateNested({ each: true })
  @Type(() => JoinUserDto)
  readonly joinUsers: [JoinUserDto];
}
