import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, type SessionDocument } from './session.schema';
import type { CreateSessionInput, SessionObjectId, SessionRevocationReason } from './session.types';

@Injectable()
export class SessionRepository {
  constructor(@InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>) {}

  async createSession(input: CreateSessionInput): Promise<SessionDocument> {
    const created = await this.sessionModel.create({
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      accessTokenJti: input.accessTokenJti,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      ip: input.ip,
      userAgent: input.userAgent,
      expiresAt: input.expiresAt,
    });

    return created as SessionDocument;
  }

  findByRefreshTokenHash(refreshTokenHash: string): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({ refreshTokenHash }).exec();
  }

  findActiveByRefreshTokenHash(
    refreshTokenHash: string,
    now = new Date(),
  ): Promise<SessionDocument | null> {
    return this.sessionModel
      .findOne({
        refreshTokenHash,
        revokedAt: { $exists: false },
        expiresAt: { $gt: now },
      })
      .exec();
  }

  findActiveById(sessionId: SessionObjectId, now = new Date()): Promise<SessionDocument | null> {
    return this.sessionModel
      .findOne({
        _id: sessionId,
        revokedAt: { $exists: false },
        expiresAt: { $gt: now },
      })
      .exec();
  }

  findActiveByUserId(userId: SessionObjectId, now = new Date()): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({
        userId,
        revokedAt: { $exists: false },
        expiresAt: { $gt: now },
      })
      .exec();
  }

  findByUserId(userId: SessionObjectId): Promise<SessionDocument[]> {
    return this.sessionModel.find({ userId }).exec();
  }

  findByIdAndUserId(
    sessionId: SessionObjectId,
    userId: SessionObjectId,
  ): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({ _id: sessionId, userId }).exec();
  }

  updateRefreshTokenHash(
    sessionId: SessionObjectId,
    refreshTokenHash: string,
    accessTokenJti?: string,
  ): Promise<SessionDocument | null> {
    const updatedFields: Record<string, string> = { refreshTokenHash };

    if (accessTokenJti) {
      updatedFields.accessTokenJti = accessTokenJti;
    }

    return this.sessionModel
      .findByIdAndUpdate(sessionId, { $set: updatedFields }, { new: true })
      .exec();
  }

  touchLastUsedAt(
    sessionId: SessionObjectId,
    lastUsedAt = new Date(),
  ): Promise<SessionDocument | null> {
    return this.sessionModel
      .findByIdAndUpdate(sessionId, { $set: { lastUsedAt } }, { new: true })
      .exec();
  }

  revokeSession(
    sessionId: SessionObjectId,
    revokedReason: SessionRevocationReason,
    revokedAt = new Date(),
  ): Promise<SessionDocument | null> {
    return this.sessionModel
      .findByIdAndUpdate(
        sessionId,
        {
          $set: {
            revokedAt,
            revokedReason,
          },
        },
        { new: true },
      )
      .exec();
  }

  revokeSessionForUser(
    sessionId: SessionObjectId,
    userId: SessionObjectId,
    revokedReason: SessionRevocationReason,
    revokedAt = new Date(),
  ): Promise<SessionDocument | null> {
    return this.sessionModel
      .findOneAndUpdate(
        {
          _id: sessionId,
          userId,
          revokedAt: { $exists: false },
        },
        {
          $set: {
            revokedAt,
            revokedReason,
          },
        },
        { new: true },
      )
      .exec();
  }

  revokeAllForUser(
    userId: SessionObjectId,
    revokedReason: SessionRevocationReason,
    revokedAt = new Date(),
  ) {
    return this.sessionModel
      .updateMany(
        {
          userId,
          revokedAt: { $exists: false },
        },
        {
          $set: {
            revokedAt,
            revokedReason,
          },
        },
      )
      .exec();
  }

  revokeAllForUserExceptCurrent(
    userId: SessionObjectId,
    currentSessionId: SessionObjectId,
    revokedReason: SessionRevocationReason,
    revokedAt = new Date(),
  ) {
    return this.sessionModel
      .updateMany(
        {
          userId,
          _id: { $ne: currentSessionId },
          revokedAt: { $exists: false },
        },
        {
          $set: {
            revokedAt,
            revokedReason,
          },
        },
      )
      .exec();
  }
}
