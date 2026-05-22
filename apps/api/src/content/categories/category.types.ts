import type { Types } from 'mongoose';

export type CategoryId = Types.ObjectId | string;

export interface CreateCategoryInput {
  readonly name: string;
  readonly slug: string;
  readonly slugNormalized: string;
  readonly description?: string;
  readonly parentId?: Types.ObjectId | string;
  readonly sortOrder?: number;
}

export interface UpdateCategoryInput {
  readonly name?: string;
  readonly description?: string;
  readonly parentId?: Types.ObjectId | string;
  readonly sortOrder?: number;
}
