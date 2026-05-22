import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'content_tags', timestamps: true })
export class Tag {
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare name: string;

  @Prop({ required: true, trim: true })
  declare slug: string;

  @Prop({ required: true, trim: true, lowercase: true })
  declare slugNormalized: string;

  declare createdAt: Date;
  declare updatedAt: Date;

  @Prop()
  declare deletedAt?: Date;
}

export type TagDocument = HydratedDocument<Tag>;
export const TagSchema = SchemaFactory.createForClass(Tag);

TagSchema.index({ slugNormalized: 1 }, { unique: true });
