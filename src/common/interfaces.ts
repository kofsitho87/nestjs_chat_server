import { OrderBy } from '@/enums/enums';

export interface IDatabase {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export interface IPaginationInput {
  page: number;
  count: number;
}

export interface ISortInput {
  fieldName: string;
  orderBy: OrderBy;
}

export interface ISelection {
  path?: string;
  select?: string;
  // match?: Map<string, any>;
  populate?: ISelection[] | string[];
}
