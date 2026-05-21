import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../auth/users/user.repository';
import { SessionRepository } from '../../auth/sessions/session.repository';
import { UserProfileRepository } from '../../profiles/profile.repository';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import type { AdminUsersQueryDto } from './dto/admin-user-query';
import type { AdminUserStatusUpdateDto } from './dto/admin-user-status';
import type {
  AdminUsersListResponseDto,
  AdminUserDetailResponseDto,
  AdminUserSessionsResponseDto,
  AdminGenericResponseDto,
} from './dto/admin-user-response';
import {
  toAdminUserListItem,
  toAdminUserDetail,
  toAdminSessionDto,
} from './dto/admin-user-response';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly profileRepository: UserProfileRepository,
  ) {}

  async listUsers(query: AdminUsersQueryDto): Promise<AdminUsersListResponseDto> {
    let userIds: string[] | undefined;

    if (query.q) {
      const profiles = await this.profileRepository.findByUsernamePrefix(query.q, query.limit * 5);
      userIds = profiles.map((p) => String(p.userId));

      if (userIds.length === 0) {
        return { users: [], total: 0, page: query.page, limit: query.limit };
      }
    }

    const { users, total } = await this.userRepository.findManyForAdmin({
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(userIds !== undefined ? { userIds } : {}),
      page: query.page,
      limit: query.limit,
    });

    const userIdStrings = users.map((u) => String(u._id));
    const profiles = await this.profileRepository.findManyByUserIds(userIdStrings);
    const profileByUserId = new Map(profiles.map((p) => [String(p.userId), p]));

    return {
      users: users.map((user) =>
        toAdminUserListItem(user, profileByUserId.get(String(user._id)) ?? null),
      ),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async getUser(rawId: string): Promise<AdminUserDetailResponseDto> {
    const userId = validateObjectId(rawId, 'id');
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const profile = await this.profileRepository.findByUserId(userId);

    return { user: toAdminUserDetail(user, profile) };
  }

  async updateUserStatus(
    rawId: string,
    input: AdminUserStatusUpdateDto,
  ): Promise<AdminUserDetailResponseDto> {
    const userId = validateObjectId(rawId, 'id');
    const existing = await this.userRepository.findById(userId);

    if (!existing) {
      throw new NotFoundException('User not found.');
    }

    const updated = await this.userRepository.updateStatus(userId, input.status, input.reason);

    if (!updated) {
      throw new NotFoundException('User not found.');
    }

    const profile = await this.profileRepository.findByUserId(userId);

    return { user: toAdminUserDetail(updated, profile) };
  }

  async listUserSessions(rawId: string): Promise<AdminUserSessionsResponseDto> {
    const userId = validateObjectId(rawId, 'id');
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const sessions = await this.sessionRepository.findByUserId(userId);

    return { sessions: sessions.map((s) => toAdminSessionDto(s)) };
  }

  async revokeUserSession(
    rawUserId: string,
    rawSessionId: string,
  ): Promise<AdminGenericResponseDto> {
    const userId = validateObjectId(rawUserId, 'id');
    const sessionId = validateObjectId(rawSessionId, 'sessionId');

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const revoked = await this.sessionRepository.revokeSessionForUser(
      sessionId,
      userId,
      'admin_revoked',
    );

    if (!revoked) {
      throw new NotFoundException('Session not found or already revoked.');
    }

    return { success: true, message: 'Session revoked.' };
  }
}
