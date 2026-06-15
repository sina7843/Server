import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'contact_messages', timestamps: { createdAt: true, updatedAt: false } })
export class ContactMessage {
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare name: string;

  @Prop({ required: true, trim: true })
  declare email: string;

  @Prop({ trim: true })
  declare subject?: string;

  @Prop({ required: true, trim: true })
  declare message: string;

  @Prop()
  declare ipHash?: string;

  declare createdAt: Date;
}

export type ContactMessageDocument = HydratedDocument<ContactMessage>;
export const ContactMessageSchema = SchemaFactory.createForClass(ContactMessage);

ContactMessageSchema.index({ createdAt: -1 });
