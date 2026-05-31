import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { GameStatus } from '@dragon/types';

const GAME_STATUSES: GameStatus[] = ['active', 'inactive', 'archived'];

@Schema({ collection: 'games', timestamps: true })
export class Game {
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare name: string;

  @Prop({ required: true, trim: true })
  declare slug: string;

  @Prop({ required: true, trim: true, lowercase: true })
  declare slugNormalized: string;

  @Prop({ trim: true })
  declare description?: string;

  @Prop({ required: true, default: 'active', enum: GAME_STATUSES })
  declare status: GameStatus;

  @Prop()
  declare coverMediaId?: string;

  @Prop()
  declare iconMediaId?: string;

  declare createdAt: Date;
  declare updatedAt: Date;

  @Prop()
  declare deletedAt?: Date;
}

export type GameDocument = HydratedDocument<Game>;
export const GameSchema = SchemaFactory.createForClass(Game);

GameSchema.index({ slugNormalized: 1 }, { unique: true });
GameSchema.index({ status: 1 });
GameSchema.index({ createdAt: -1 });
