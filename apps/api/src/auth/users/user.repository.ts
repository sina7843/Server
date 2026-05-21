import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, type UserDocument } from './user.schema';
import type { CreatePendingUserInput, UserStatus } from './user.types';

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

  async markExpiredPendingUsersDeleted(cutoff: Date, deletedAt = new Date()): Promise<number> {
    const result = await this.userModel
      .updateMany(
        {
          status: 'pending_verification',
          phoneVerifiedAt: { $exists: false },
          deletedAt: { $exists: false },
          createdAt: { $lt: cutoff },
        },
        {
          $set: {
            status: 'deleted',
            deletedAt,
            statusReason: 'pending_verification_expired',
          },
        },
      )
      .exec();

    return result?.modifiedCount ?? 0;
  }

  async findManyForAdmin(params: {
    status?: UserStatus;
    userIds?: string[];
    page: number;
    limit: number;
  }): Promise<{ users: UserDocument[]; total: number }> {
    const filter: Record<string, unknown> = {};

    if (params.status) {
      filter.status = params.status;
    }

    if (params.userIds !== undefined) {
      filter._id = { $in: params.userIds.map((id) => new Types.ObjectId(id)) };
    }

    const skip = (params.page - 1) * params.limit;
    const [users, total] = await Promise.all([
      this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(params.limit).exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return { users, total };
  }

  async countAllByStatus(): Promise<{ total: number; active: number; pending: number }> {
    const [total, active, pending] = await Promise.all([
      this.userModel.countDocuments({ status: { $ne: 'deleted' } }).exec(),
      this.userModel.countDocuments({ status: 'active' }).exec(),
      this.userModel.countDocuments({ status: 'pending_verification' }).exec(),
    ]);
    return { total, active, pending };
  }

  updateStatus(
    userId: Types.ObjectId | string,
    status: UserStatus,
    statusReason?: string,
  ): Promise<UserDocument | null> {
    const update: Record<string, unknown> = { status };

    if (statusReason !== undefined && statusReason.trim().length > 0) {
      update.statusReason = statusReason.trim();
    }

    if (status === 'deleted') {
      update.deletedAt = new Date();
    }

    return this.userModel.findByIdAndUpdate(userId, { $set: update }, { new: true }).exec();
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
