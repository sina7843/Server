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
  TournamentBracketDto,
  TournamentMatchResultDto,
  TournamentParticipantListResponseDto,
  TournamentMatchListResponseDto,
} from '@dragon/types';

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
  getParticipants(slug: string): Promise<TournamentParticipantListResponseDto>;
  getMatches(slug: string): Promise<TournamentMatchListResponseDto>;
  getResults(slug: string): Promise<readonly TournamentMatchResultDto[]>;
  getStandings(slug: string): Promise<TournamentStandingsDto>;
  getBracket(slug: string): Promise<TournamentBracketDto>;
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
