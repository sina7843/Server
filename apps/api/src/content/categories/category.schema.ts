import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

@Schema({ collection: 'content_categories', timestamps: true })
export class Category {
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare name: string;

  @Prop({ required: true, trim: true })
  declare slug: string;

  @Prop({ required: true, trim: true, lowercase: true })
  declare slugNormalized: string;

  @Prop({ trim: true })
  declare description?: string;

  @Prop({ type: SchemaTypes.ObjectId })
  declare parentId?: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  declare sortOrder: number;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ slugNormalized: 1 }, { unique: true });
