import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { TournamentStatus, TournamentFormat, TournamentParticipantType } from '@dragon/types';

const TOURNAMENT_STATUSES: TournamentStatus[] = [
  'draft',
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'cancelled',
  'archived',
];
const TOURNAMENT_FORMATS: TournamentFormat[] = ['single_elimination', 'round_robin', 'manual'];
const PARTICIPANT_TYPES: TournamentParticipantType[] = ['individual', 'team', 'both'];

@Schema({ collection: 'tournaments', timestamps: true })
export class Tournament {
  declare _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare title: string;

  @Prop({ required: true, trim: true })
  declare slug: string;

  @Prop({ required: true, trim: true, lowercase: true })
  declare slugNormalized: string;

  @Prop({ trim: true })
  declare description?: string;

  @Prop({ required: true })
  declare gameId: string;

  @Prop({ required: true, enum: TOURNAMENT_FORMATS })
  declare format: TournamentFormat;

  @Prop({ required: true, default: 'draft', enum: TOURNAMENT_STATUSES })
  declare status: TournamentStatus;

  @Prop({ required: true, enum: PARTICIPANT_TYPES, default: 'individual' })
  declare participantType: TournamentParticipantType;

  @Prop({ required: true, min: 0 })
  declare capacity: number;

  @Prop()
  declare registrationOpenAt?: Date;

  @Prop()
  declare registrationCloseAt?: Date;

  @Prop()
  declare startsAt?: Date;

  @Prop()
  declare endsAt?: Date;

  @Prop({ trim: true })
  declare rules?: string;

  @Prop()
  declare publishedAt?: Date;

  @Prop()
  declare cancelledAt?: Date;

  declare createdAt: Date;
  declare updatedAt: Date;

  @Prop()
  declare deletedAt?: Date;
}

export type TournamentDocument = HydratedDocument<Tournament>;
export const TournamentSchema = SchemaFactory.createForClass(Tournament);

TournamentSchema.index({ slugNormalized: 1 }, { unique: true });
TournamentSchema.index({ gameId: 1 });
TournamentSchema.index({ status: 1 });
TournamentSchema.index({ format: 1 });
TournamentSchema.index({ deletedAt: 1 });
TournamentSchema.index({ createdAt: -1 });
