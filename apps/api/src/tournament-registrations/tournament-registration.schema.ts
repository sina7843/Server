import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import type { TournamentRegistrationStatus, TournamentRegistrationType } from '@dragon/types';

const REGISTRATION_STATUSES: TournamentRegistrationStatus[] = [
  'submitted',
  'approved',
  'rejected',
  'waitlisted',
  'withdrawn',
  'cancelled',
];

const REGISTRATION_TYPES: TournamentRegistrationType[] = ['individual', 'team'];

// Embedded sub-document — no separate Team model.
@Schema({ _id: false })
export class RegistrationMember {
  @Prop({ required: true, trim: true })
  declare userId: string;

  @Prop({ required: true, trim: true })
  declare displayName: string;

  @Prop({ trim: true })
  declare role?: string;
}

export const RegistrationMemberSchema = SchemaFactory.createForClass(RegistrationMember);

@Schema({ collection: 'tournament_registrations', timestamps: true })
export class TournamentRegistration {
  declare _id: Types.ObjectId;

  @Prop({ required: true, type: SchemaTypes.ObjectId })
  declare tournamentId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  declare userId: string;

  @Prop({ required: true, enum: REGISTRATION_TYPES })
  declare type: TournamentRegistrationType;

  @Prop({ required: true, enum: REGISTRATION_STATUSES, default: 'submitted' })
  declare status: TournamentRegistrationStatus;

  // Team data — only populated for team registrations.
  @Prop({ trim: true })
  declare teamName?: string;

  @Prop({ type: [RegistrationMemberSchema], default: undefined })
  declare members?: RegistrationMember[];

  @Prop({ required: true })
  declare submittedAt: Date;

  @Prop()
  declare approvedAt?: Date;

  @Prop()
  declare rejectedAt?: Date;

  @Prop()
  declare withdrawnAt?: Date;

  @Prop()
  declare cancelledAt?: Date;

  // Internal only — not exposed in public/user-facing DTOs.
  @Prop({ trim: true })
  declare rejectedReason?: string;

  // ─── Participant-specific fields (derived projection — no separate collection) ─
  //
  // These are set only on approved registrations.
  // participantDisplayName: admin override; projection falls back to userId if absent.
  // seed: admin-settable seeding number.
  // participantRemovedAt / participantDisqualifiedAt: track explicit admin actions.
  // Registration status remains 'approved' after remove/disqualify; participant
  // status is derived from these timestamps in the projection layer.

  @Prop({ trim: true })
  declare participantDisplayName?: string;

  @Prop({ type: Number })
  declare seed?: number;

  @Prop()
  declare participantRemovedAt?: Date;

  @Prop()
  declare participantDisqualifiedAt?: Date;

  declare createdAt: Date;
  declare updatedAt: Date;
}

export type TournamentRegistrationDocument = HydratedDocument<TournamentRegistration>;
export const TournamentRegistrationSchema = SchemaFactory.createForClass(TournamentRegistration);

// Compound index: duplicate-prevention and per-user queries.
TournamentRegistrationSchema.index({ tournamentId: 1, userId: 1 });
// Capacity counting and admin list by status.
TournamentRegistrationSchema.index({ tournamentId: 1, status: 1 });
// User-own registration lookups.
TournamentRegistrationSchema.index({ userId: 1 });
// Default sort order.
TournamentRegistrationSchema.index({ createdAt: -1 });
