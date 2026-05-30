import type {
  PublicTournamentDto,
  TournamentDto,
  AdminTournamentDto,
  TournamentListQueryDto,
  TournamentListResponseDto,
  TournamentLifecycleActionDto,
  TournamentRegistrationInputDto,
  MyTournamentRegistrationDto,
  TournamentStandingsDto,
  BracketProjectionDto,
} from '@dragon/types';

export type TournamentListParams = TournamentListQueryDto;

export interface TournamentsClient {
  list(params?: TournamentListParams): Promise<TournamentListResponseDto>;
  getBySlug(slug: string): Promise<PublicTournamentDto>;
  getStandings(slug: string): Promise<TournamentStandingsDto>;
  getBracket(slug: string): Promise<BracketProjectionDto>;
  register(
    slug: string,
    input: TournamentRegistrationInputDto,
  ): Promise<MyTournamentRegistrationDto>;
  getMyRegistration(slug: string): Promise<MyTournamentRegistrationDto>;
  withdrawRegistration(slug: string): Promise<void>;
}

export interface AdminTournamentsClient {
  list(params?: TournamentListParams): Promise<TournamentListResponseDto>;
  getById(id: string): Promise<AdminTournamentDto>;
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
  openRegistration(id: string): Promise<AdminTournamentDto>;
  closeRegistration(id: string): Promise<AdminTournamentDto>;
  start(id: string): Promise<AdminTournamentDto>;
  complete(id: string): Promise<AdminTournamentDto>;
}
