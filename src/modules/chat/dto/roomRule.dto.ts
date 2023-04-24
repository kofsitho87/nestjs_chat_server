import { IsBoolean, IsNotEmpty } from 'class-validator';

export class RoomRuleDto {
  @IsBoolean()
  canCopyMessage = true;

  @IsBoolean()
  canCaptureMessage = true;

  @IsBoolean()
  canDeleteMessage = true;

  @IsBoolean()
  canShareMessage = true;

  @IsNotEmpty()
  @IsBoolean()
  canInviteMemebrs: boolean;

  @IsNotEmpty()
  @IsBoolean()
  canLeaveOutRoom: boolean;

  @IsBoolean()
  canShowMemberList = true;

  @IsBoolean()
  isFreezed = false;

  constructor(rules) {
    Object.assign(this, rules);
  }
}
