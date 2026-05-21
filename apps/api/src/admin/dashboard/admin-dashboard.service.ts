import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../auth/users/user.repository';

export interface DashboardSummaryDto {
  users?: { total: number; active?: number; pending?: number };
  system?: { status: 'ok' | 'degraded' | 'unavailable' };
  unavailable?: string[];
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly userRepository: UserRepository) {}

  async getSummary(): Promise<DashboardSummaryDto> {
    const counts = await this.userRepository.countAllByStatus();

    return {
      users: {
        total: counts.total,
        active: counts.active,
        pending: counts.pending,
      },
      system: { status: 'ok' },
    };
  }
}
