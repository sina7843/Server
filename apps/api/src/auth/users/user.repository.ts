import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, type UserDocument } from './user.schema';
import type { CreatePendingUserInput } from './user.types';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  findByPhoneNormalized(phoneNormalized: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phoneNormalized }).exec();
  }

  findById(userId: Types.ObjectId | string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  findNonDeletedByPhoneNormalized(phoneNormalized: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        phoneNormalized,
        status: { $ne: 'deleted' },
        deletedAt: { $exists: false },
      })
      .exec();
  }

  findActiveByPhoneNormalized(phoneNormalized: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        phoneNormalized,
        status: 'active',
        deletedAt: { $exists: false },
      })
      .exec();
  }

  async createPendingUser(input: CreatePendingUserInput): Promise<UserDocument> {
    const created = await this.userModel.create({
      phone: input.phone,
      phoneNormalized: input.phoneNormalized,
      email: input.email,
      emailNormalized: input.emailNormalized,
      passwordHash: input.passwordHash,
      metadata: input.metadata,
      status: 'pending_verification',
      failedLoginCount: 0,
    });

    return created as UserDocument;
  }

  markPhoneVerified(
    userId: Types.ObjectId | string,
    verifiedAt = new Date(),
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            phoneVerifiedAt: verifiedAt,
            status: 'active',
          },
          $unset: {
            statusReason: '',
          },
        },
        { new: true },
      )
      .exec();
  }

  updateLoginSuccessMetadata(
    userId: Types.ObjectId | string,
    ipAddress?: string,
    loggedInAt = new Date(),
  ): Promise<UserDocument | null> {
    const loginMetadata: Record<string, Date | string | number> = {
      lastLoginAt: loggedInAt,
      failedLoginCount: 0,
    };

    if (ipAddress) {
      loginMetadata.lastLoginIp = ipAddress;
    }

    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: loginMetadata,
          $unset: {
            lockedUntil: '',
          },
        },
        { new: true },
      )
      .exec();
  }

  incrementFailedLogin(
    userId: Types.ObjectId | string,
    lockedUntil?: Date,
  ): Promise<UserDocument | null> {
    const update: {
      $inc: { failedLoginCount: number };
      $set?: { lockedUntil: Date };
    } = {
      $inc: { failedLoginCount: 1 },
    };

    if (lockedUntil) {
      update.$set = { lockedUntil };
    }

    return this.userModel.findByIdAndUpdate(userId, update, { new: true }).exec();
  }

  updatePasswordHash(
    userId: Types.ObjectId | string,
    passwordHash: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: { passwordHash },
        },
        { new: true },
      )
      .exec();
  }

  resetFailedLoginState(userId: Types.ObjectId | string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            failedLoginCount: 0,
          },
          $unset: {
            lockedUntil: '',
          },
        },
        { new: true },
      )
      .exec();
  }

  softDelete(
    userId: Types.ObjectId | string,
    deletedAt = new Date(),
    statusReason?: string,
  ): Promise<UserDocument | null> {
    const deletedFields: Record<string, Date | string> = {
      deletedAt,
      status: 'deleted',
    };

    if (statusReason) {
      deletedFields.statusReason = statusReason;
    }

    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: deletedFields,
        },
        { new: true },
      )
      .exec();
  }
}
