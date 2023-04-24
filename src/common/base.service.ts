import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { OptionalPagination, OptionalSelection } from './types';
import { clone } from 'lodash';

@Injectable()
export abstract class BaseService<T> {
  constructor(private readonly model: Model<T>) {}

  async exists(matchFields: any): Promise<boolean> {
    return this.model.exists(matchFields);
  }

  async findById(
    id: Types.ObjectId | string,
    selection?: OptionalSelection,
  ): Promise<T> {
    let promise = this.model.findById(id);
    if (selection) {
      if (typeof selection == 'object') {
        if (selection?.select) promise = promise.select(selection.select);
        if (selection?.populate) promise = promise.populate(selection.populate);
      } else if (typeof selection == 'string') {
        promise = promise.select(selection);
      }
    }
    return promise.lean();
  }

  async findOne(filter?: any, selection?: OptionalSelection): Promise<T> {
    let promise: any = this.model.findOne(filter);
    if (selection) {
      if (typeof selection == 'object') {
        if (selection?.select) promise = promise.select(selection.select);
        if (selection?.populate) promise = promise.populate(selection.populate);
      } else if (typeof selection == 'string') {
        promise = promise.select(selection);
      }
    }
    return promise.lean();
  }

  async findLastOne(filter?: any, selection?: OptionalSelection): Promise<T> {
    let promise: any = this.model.findOne(filter, [], {
      sort: { _id: -1 },
    });
    if (selection) {
      if (typeof selection == 'object') {
        if (selection?.select) promise = promise.select(selection.select);
        if (selection?.populate) promise = promise.populate(selection.populate);
      } else if (typeof selection == 'string') {
        promise = promise.select(selection);
      }
    }
    return promise.lean();
  }

  async find(filter?: any, selection?: OptionalSelection): Promise<T[]> {
    let promise: any = this.model.find(filter);
    if (selection) {
      if (typeof selection == 'object') {
        if (selection?.select) promise = promise.select(selection.select);
        if (selection?.populate) promise = promise.populate(selection.populate);
      } else if (typeof selection == 'string') {
        promise = promise.select(selection);
      }
    }
    return promise.lean();
    // return this.model.find(filter).lean();
  }

  async updateOne(filter: any, data: any): Promise<boolean> {
    const { nModified } = await this.model.updateOne(filter, data);
    return nModified > 0;
  }

  async deleteOne(filter: any): Promise<boolean> {
    const { deletedCount } = await this.model.deleteOne(filter);
    return deletedCount > 0;
  }

  // async deleteMany(filter: any): Promise<boolean> {
  //   const { deletedCount } = await this.model.deleteMany(filter);
  //   return deletedCount > 0;
  // }

  async countByAggregate(pipeline: any[]): Promise<number> {
    const p = clone(pipeline);

    p.push({
      $group: {
        _id: 0,
        count: { $sum: 1 },
      },
    });

    const result = await this.model.aggregate(p).exec();
    return result[0]?.count || 0;
  }

  // async countByAggregateOfOtherModel(
  //   model: ReturnModelType<any>,
  //   pipeline: any[],
  // ): Promise<number> {
  //   const p = clone(pipeline);
  //   p.push({
  //     $group: {
  //       _id: 0,
  //       count: { $sum: 1 },
  //     },
  //   });

  //   // Only aggregation start is other model
  //   const result = await model.aggregate(p).exec();
  //   return result[0]?.count || 0;
  // }

  // async searchByAggregate(
  //   pipeline: any[],
  //   sorts: OptionalSort | OptionalSort[] = DefaultSort,
  //   pagination?: OptionalPagination,
  //   selection?: OptionalSelection,
  // ): Promise<T[]> {
  //   const p = clone(pipeline);

  //   this.appendPipelineSorts(p, sorts);

  //   this.appendPipelinePagination(p, pagination);

  //   this.appendPipelineSelection(p, selection);

  //   let result = await this.model.aggregate(p).exec();

  //   if (typeof selection == 'object') {
  //     if (selection?.populate) {
  //       result = await this.model.populate(result, selection.populate as any);
  //     }
  //   }

  //   return result;
  // }

  // appendPipelineSorts(
  //   pipeline: any[],
  //   sorts: OptionalSort | OptionalSort[] = DefaultSort,
  // ): void {
  //   if (sorts) {
  //     sorts = sorts instanceof Array ? sorts : [sorts];
  //     const sortField = {} as any;
  //     sorts.forEach((sort) => {
  //       if (sort && sort.fieldName) {
  //         sortField[sort.fieldName] = sort.orderBy == OrderBy.ASC ? 1 : -1;
  //       }
  //     });
  //     pipeline.push({ $sort: sortField });
  //   }
  // }

  appendPipelinePagination(
    pipeline: any[],
    pagination?: OptionalPagination,
  ): void {
    if (pagination) {
      if (typeof pagination == 'object') {
        pipeline.push({ $skip: (pagination.page - 1) * pagination.count });
        pipeline.push({ $limit: pagination.count });
      } else if (typeof pagination == 'number') {
        pipeline.push({ $limit: pagination });
      }
    }
  }

  appendPipelineSelection(
    pipeline: any[],
    selection?: OptionalSelection,
  ): void {
    if (typeof selection == 'object') {
      if (selection?.select) {
        const projectFields = selection.select
          .split(' ')
          .reduce((result: any, field: string) => {
            result[field] = 1;
            return result;
          }, {} as any);
        pipeline.push({ $project: projectFields });
      }
    }
  }
}
