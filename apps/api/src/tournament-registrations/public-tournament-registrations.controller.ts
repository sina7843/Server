import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Optional,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { MyTournamentRegistrationDto, TournamentRegistrationContextDto } from '@dragon/types';
import { AnalyticsService } from '../analytics/analytics.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../auth/guards/authenticated-request';
import { TournamentService } from '../tournaments/tournament.service';
import { isPubliclyVisible } from '../tournaments/tournament-projection';
import { TournamentRegistrationService } from './tournament-registration.service';
import { toMyRegistrationDto } from './tournament-registration-projection';
import { parseRegisterBody, parseUpdateMyRegistrationBody } from './dto/registration-body';

// ─── Public tournament registration endpoints ─────────────────────────────────
//
// registration-context is public (no auth needed — just checks visibility).
// All other routes require authentication (AccessTokenGuard).
// Slug-based lookup — no phone/email in URL.
// Draft, deleted, and archived tournaments return 404 (safe, no state leak).

@Controller('api/v1/tournaments')
export class PublicTournamentRegistrationsController {
  constructor(
    private readonly tournamentService: TournamentService,
    private readonly registrationService: TournamentRegistrationService,
    @Optional() private readonly analyticsService?: AnalyticsService,
  ) {}

  // GET /api/v1/tournaments/:slug/registration-context
  // Minimal safe signal: confirms the tournament is publicly visible.
  // Returns 404 for draft/deleted/archived tournaments — safe to show the
  // registration form only when this returns 200.
  @Get(':slug/registration-context')
  async getRegistrationContext(
    @Param('slug') slug: string,
  ): Promise<TournamentRegistrationContextDto> {
    const tournament = await this.requirePubliclyVisibleTournament(slug);

    this.analyticsService?.track({
      type: 'tournament.registration_started',
      resourceType: 'tournament',
      resourceId: String(tournament._id),
      metadata: { slug: tournament.slug },
    });

    return {
      tournamentTitle: tournament.title,
      registrationOpen: tournament.status === 'registration_open',
    };
  }

  // POST /api/v1/tournaments/:slug/register
  @Post(':slug/register')
  @UseGuards(AccessTokenGuard)
  async register(
    @Param('slug') slug: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<MyTournamentRegistrationDto> {
    const userId = this.requireUserId(req);
    const tournament = await this.requirePubliclyRegisteableTournament(slug);
    const input = parseRegisterBody(body);
    const registration = await this.registrationService.register(tournament, userId, input);
    return toMyRegistrationDto(registration);
  }

  // GET /api/v1/tournaments/:slug/my-registration
  @Get(':slug/my-registration')
  @UseGuards(AccessTokenGuard)
  async getMyRegistration(
    @Param('slug') slug: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<MyTournamentRegistrationDto> {
    const userId = this.requireUserId(req);
    const tournament = await this.requirePubliclyVisibleTournament(slug);
    const registration = await this.registrationService.findMyRegistration(tournament._id, userId);
    if (!registration) throw new NotFoundException('Registration not found.');
    return toMyRegistrationDto(registration);
  }

  // PATCH /api/v1/tournaments/:slug/my-registration
  @Patch(':slug/my-registration')
  @UseGuards(AccessTokenGuard)
  async updateMyRegistration(
    @Param('slug') slug: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<MyTournamentRegistrationDto> {
    const userId = this.requireUserId(req);
    const tournament = await this.requirePubliclyVisibleTournament(slug);
    const input = parseUpdateMyRegistrationBody(body);
    const registration = await this.registrationService.updateMyRegistration(
      tournament._id,
      userId,
      input,
    );
    return toMyRegistrationDto(registration);
  }

  // POST /api/v1/tournaments/:slug/my-registration/withdraw
  @Post(':slug/my-registration/withdraw')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async withdraw(
    @Param('slug') slug: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<MyTournamentRegistrationDto> {
    const userId = this.requireUserId(req);
    const tournament = await this.requirePubliclyVisibleTournament(slug);
    const registration = await this.registrationService.withdraw(tournament._id, userId);
    return toMyRegistrationDto(registration);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private requireUserId(req: AuthenticatedRequest): string {
    const userId = req.auth?.userId;
    if (!userId) throw new UnauthorizedException('Authentication required.');
    return userId;
  }

  // For registration: tournament must be publicly visible (not draft/archived/deleted).
  // The service separately validates status === registration_open.
  private async requirePubliclyVisibleTournament(slug: string) {
    const tournament = await this.tournamentService.findBySlug(slug);
    if (!tournament || !isPubliclyVisible(tournament)) {
      throw new NotFoundException('Tournament not found.');
    }
    return tournament;
  }

  // Alias with clearer intent for routes where registration must be possible.
  // The service enforces status === registration_open as an additional gate.
  private async requirePubliclyRegisteableTournament(slug: string) {
    return this.requirePubliclyVisibleTournament(slug);
  }
}
