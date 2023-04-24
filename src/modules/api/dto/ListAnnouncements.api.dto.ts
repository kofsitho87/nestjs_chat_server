import { IsMongoId } from 'class-validator';

export class ListAnnouncementsApiDto {
  @IsMongoId()
  readonly roomId: string;
}
