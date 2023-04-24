import { Types } from 'mongoose';
import { IPaginationInput, ISelection, ISortInput } from './interfaces';

export type ObjectId = Types.ObjectId;
export type OptionalSort = ISortInput | null | undefined;
export type OptionalPagination = IPaginationInput | number | null | undefined;
export type OptionalSelection = ISelection | string | null | undefined;
