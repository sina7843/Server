import type { Types } from 'mongoose';

export type TagId = Types.ObjectId | string;

export interface CreateTagInput {
  readonly name: string;
  readonly slug: string;
  readonly slugNormalized: string;
}

export interface UpdateTagInput {
  readonly name?: string;
}
