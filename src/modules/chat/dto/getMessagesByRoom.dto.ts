import { CompareOperator, MessageType, OrderbyOperator } from '@/enums/enums';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class GetMessagesByRoomDto {
  createdAt: Date;

  @IsNotEmpty()
  readonly roomId: string;

  @IsOptional()
  readonly message: {
    _id: string;
    operator: CompareOperator;
  };

  @IsOptional()
  readonly sort?: {
    fieldName: string;
    orderBy: OrderbyOperator;
  };

  @IsInt()
  @IsNotEmpty()
  readonly count: number = 10;

  @IsOptional()
  readonly messageType: MessageType;
}
