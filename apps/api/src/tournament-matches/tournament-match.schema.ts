import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { TournamentMatchStatus } from '@dragon/types';

const MATCH_STATUSES: TournamentMatchStatus[] = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
];

@Schema({ collection: 'tournament_matches', timestamps: true })
export class TournamentMatch {
  declare _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, index: true })
  declare tournamentId: Types.ObjectId;

  @Prop({ required: true, type: Number, min: 1 })
  declare round: number;

  @Prop({ required: true, type: Number, min: 1 })
  declare matchNumber: number;

  @Prop({ required: true, enum: MATCH_STATUSES, default: 'scheduled' })
  declare status: TournamentMatchStatus;

  // Participant IDs are registration (ObjectId) references.
  // A match may have 0, 1, or 2 participants (bye matches excluded — bye status is forbidden).
  @Prop({ type: Types.ObjectId })
  declare participant1Id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  declare participant2Id?: Types.ObjectId;

  // Set by result recording. winnerId must be participant1Id or participant2Id.
  @Prop({ type: Types.ObjectId })
  declare winnerId?: Types.ObjectId;

  @Prop()
  declare scheduledAt?: Date;

  @Prop()
  declare completedAt?: Date;

  // Admin-only internal notes (match-level).
  @Prop({ trim: true })
  declare notes?: string;

  // ─── Embedded result fields (set by result recording, Task 7.2+) ──────────
  //
  // Result is embedded to keep match + result state consistent in one document.
  // One result per match; void clears all result fields.

  @Prop({ type: Number })
  declare participant1Score?: number;

  @Prop({ type: Number })
  declare participant2Score?: number;

  // Admin-only notes specific to the result (e.g. correction reason).
  @Prop({ trim: true })
  declare resultNotes?: string;

  // Timestamp when the result was first recorded (preserved through updates).
  @Prop()
  declare resultRecordedAt?: Date;

  // Set when matches are auto-generated via the generate endpoint.
  @Prop()
  declare generatedAt?: Date;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export type TournamentMatchDocument = HydratedDocument<TournamentMatch>;
export const TournamentMatchSchema = SchemaFactory.createForClass(TournamentMatch);

// Compound unique index for per-tournament listing and duplicate prevention.
TournamentMatchSchema.index({ tournamentId: 1, round: 1, matchNumber: 1 }, { unique: true });
// Default sort order.
TournamentMatchSchema.index({ createdAt: -1 });
