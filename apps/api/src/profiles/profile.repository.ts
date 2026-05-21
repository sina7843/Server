import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserProfile, type UserProfileDocument } from './profile.schema';
import type {
  CreateUserProfileRepositoryInput,
  UpdateUserProfileRepositoryInput,
} from './profile.types';

@Injectable()
export class UserProfileRepository {
  constructor(
    @InjectModel(UserProfile.name)
    private readonly profileModel: Model<UserProfileDocument>,
  ) {}

  findByUserId(userId: Types.ObjectId | string): Promise<UserProfileDocument | null> {
    return this.profileModel.findOne({ userId }).exec();
  }

  findByUsernameNormalized(usernameNormalized: string): Promise<UserProfileDocument | null> {
    return this.profileModel.findOne({ usernameNormalized }).exec();
  }

  async createProfile(input: CreateUserProfileRepositoryInput): Promise<UserProfileDocument> {
    const createInput: Record<string, unknown> = {
      userId: typeof input.userId === 'string' ? new Types.ObjectId(input.userId) : input.userId,
      username: input.username,
      usernameNormalized: input.usernameNormalized,
      displayName: input.displayName,
      visibility: input.visibility,
      publicUrl: input.publicUrl,
    };

    if (input.avatarMediaId !== undefined) {
      createInput.avatarMediaId =
        typeof input.avatarMediaId === 'string'
          ? new Types.ObjectId(input.avatarMediaId)
          : input.avatarMediaId;
    }

    if (input.bio !== undefined) {
      createInput.bio = input.bio;
    }

    const created = await this.profileModel.create(createInput);

    return created as UserProfileDocument;
  }

  updateProfile(
    userId: Types.ObjectId | string,
    input: UpdateUserProfileRepositoryInput,
  ): Promise<UserProfileDocument | null> {
    const set: Record<string, unknown> = {};
    const unset: Record<string, ''> = {};

    if (input.username !== undefined) {
      set.username = input.username;
    }

    if (input.usernameNormalized !== undefined) {
      set.usernameNormalized = input.usernameNormalized;
    }

    if (input.displayName !== undefined) {
      set.displayName = input.displayName;
    }

    if (input.publicUrl !== undefined) {
      set.publicUrl = input.publicUrl;
    }

    if (input.visibility !== undefined) {
      set.visibility = input.visibility;
    }

    if (input.avatarMediaId === null) {
      unset.avatarMediaId = '';
    } else if (input.avatarMediaId !== undefined) {
      set.avatarMediaId =
        typeof input.avatarMediaId === 'string'
          ? new Types.ObjectId(input.avatarMediaId)
          : input.avatarMediaId;
    }

    if (input.bio === null) {
      unset.bio = '';
    } else if (input.bio !== undefined) {
      set.bio = input.bio;
    }

    return this.profileModel
      .findOneAndUpdate(
        { userId },
        {
          ...(Object.keys(set).length > 0 ? { $set: set } : {}),
          ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
        },
        { new: true },
      )
      .exec();
  }

  findManyByUserIds(userIds: string[]): Promise<UserProfileDocument[]> {
    return this.profileModel.find({ userId: { $in: userIds } }).exec();
  }

  findByUsernamePrefix(prefix: string, limit = 20): Promise<UserProfileDocument[]> {
    const safe = prefix.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return this.profileModel
      .find({ usernameNormalized: { $regex: `^${safe}` } })
      .limit(limit)
      .exec();
  }

  async isUsernameTaken(
    usernameNormalized: string,
    excludeUserId?: Types.ObjectId | string,
  ): Promise<boolean> {
    const query: Record<string, unknown> = { usernameNormalized };

    if (excludeUserId) {
      query.userId = { $ne: excludeUserId };
    }

    const existing = await this.profileModel.exists(query).exec();

    return Boolean(existing);
  }
}
