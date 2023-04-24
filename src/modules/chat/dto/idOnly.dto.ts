import {
    IsNotEmpty,
    IsString,
} from 'class-validator';

export class IdOnlyDto {
    @IsString()
    @IsNotEmpty()
    id: string;
}
