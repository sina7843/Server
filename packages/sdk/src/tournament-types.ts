import type {
  PublicTournamentDto,
  TournamentDto,
  AdminTournamentDto,
  TournamentListQueryDto,
  TournamentListResponseDto,
  TournamentLifecycleActionDto,
  TournamentRegistrationInputDto,
  MyTournamentRegistrationDto,
  UpdateTournamentRegistrationDto,
  TournamentStandingsDto,
  BracketProjectionDto,
} from '@dragon/types';
import type { AdminTournamentParticipantListResponseDto } from './admin-tournament-participants-types';
import type { AdminTournamentMatchListResponseDto } from './admin-tournament-matches-types';
import type { TournamentMatchResultDto } from '@dragon/types';

export type TournamentListParams = TournamentListQueryDto;

export interface TournamentsClient {
  list(params?: TournamentListParams): Promise<TournamentListResponseDto>;
  getBySlug(slug: string): Promise<PublicTournamentDto>;
  register(
    slug: string,
    input: TournamentRegistrationInputDto,
  ): Promise<MyTournamentRegistrationDto>;
  getMyRegistration(slug: string): Promise<MyTournamentRegistrationDto>;
  updateMyRegistration(
    slug: string,
    input: UpdateTournamentRegistrationDto,
  ): Promise<MyTournamentRegistrationDto>;
  withdrawMyRegistration(slug: string): Promise<void>;
  getParticipants(slug: string): Promise<AdminTournamentParticipantListResponseDto>;
  getMatches(slug: string): Promise<AdminTournamentMatchListResponseDto>;
  getResults(slug: string): Promise<readonly TournamentMatchResultDto[]>;
  getStandings(slug: string): Promise<TournamentStandingsDto>;
  getBracket(slug: string): Promise<BracketProjectionDto>;
}

export interface AdminTournamentsClient {
  list(params?: TournamentListParams): Promise<TournamentListResponseDto>;
  get(id: string): Promise<AdminTournamentDto>;
  create(
    input: Omit<TournamentDto, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'cancelledAt'>,
  ): Promise<AdminTournamentDto>;
  update(
    id: string,
    input: Partial<Omit<TournamentDto, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<AdminTournamentDto>;
  publish(id: string, input?: TournamentLifecycleActionDto): Promise<AdminTournamentDto>;
  cancel(id: string, input?: TournamentLifecycleActionDto): Promise<AdminTournamentDto>;
  archive(id: string, input?: TournamentLifecycleActionDto): Promise<AdminTournamentDto>;
  delete(id: string): Promise<void>;
  openRegistration(id: string): Promise<AdminTournamentDto>;
  closeRegistration(id: string): Promise<AdminTournamentDto>;
  start(id: string): Promise<AdminTournamentDto>;
  complete(id: string): Promise<AdminTournamentDto>;
}
