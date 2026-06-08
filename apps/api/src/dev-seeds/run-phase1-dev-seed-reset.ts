import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Phase1DevSeedModule } from './phase1-dev-seed.module';
import { Phase1DevSeedService } from './phase1-dev-seed.service';
import { loadLocalEnv } from './load-local-env';

interface SeedResetServiceLike {
  resetSeed(): Promise<{
    usersDeleted: number;
    profilesDeleted: number;
    userRolesDeleted: number;
    gamesDeleted: number;
    tournamentsDeleted: number;
    registrationsDeleted: number;
    matchesDeleted: number;
    notificationLogsDeleted: number;
    [key: string]: number;
  }>;
}
interface ConsoleLike {
  log(msg: string): void;
  error(msg: string): void;
}

export async function runPhase1DevSeedResetCommand(
  seedService: SeedResetServiceLike,
  out: ConsoleLike,
): Promise<number> {
  try {
    const result = await seedService.resetSeed();
    out.log('Seed reset completed.');
    out.log(`- users: ${result.usersDeleted}`);
    out.log(`- profiles: ${result.profilesDeleted}`);
    out.log(`- userRoles: ${result.userRolesDeleted}`);
    out.log(`- games: ${result.gamesDeleted}`);
    out.log(`- tournaments: ${result.tournamentsDeleted}`);
    out.log(`- registrations: ${result.registrationsDeleted}`);
    out.log(`- matches: ${result.matchesDeleted}`);
    out.log(`- notificationLogs: ${result.notificationLogsDeleted}`);
    return 0;
  } catch (err) {
    out.error(err instanceof Error ? err.message : String(err));
    return 1;
  }
}

async function main(): Promise<void> {
  loadLocalEnv();

  const logger = new Logger('Phase1DevSeedReset');
  const app = await NestFactory.createApplicationContext(Phase1DevSeedModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const service = app.get(Phase1DevSeedService);
    const result = await service.resetSeed();

    logger.log('Seed reset completed.');
    logger.log('Deleted:');
    logger.log(`- users: ${result.usersDeleted}`);
    logger.log(`- profiles: ${result.profilesDeleted}`);
    logger.log(`- userRoles: ${result.userRolesDeleted}`);
    logger.log(`- games: ${result.gamesDeleted}`);
    logger.log(`- tournaments: ${result.tournamentsDeleted}`);
    logger.log(`- registrations: ${result.registrationsDeleted}`);
    logger.log(`- matches: ${result.matchesDeleted}`);
    logger.log(`- notificationLogs: ${result.notificationLogsDeleted}`);
    logger.log(`- notificationTemplates: ${result.notificationTemplatesDeleted}`);
    logger.log(`- auditLogs: ${result.auditLogsDeleted}`);
    logger.log(`- analyticsEvents: ${result.analyticsEventsDeleted}`);
    logger.log(`- contentCategories: ${result.categoriesDeleted}`);
    logger.log(`- contentTags: ${result.tagsDeleted}`);
    logger.log(`- posts: ${result.postsDeleted}`);
    logger.log(`- pages: ${result.pagesDeleted}`);
    logger.log(`- mediaAssets: ${result.mediaAssetsDeleted}`);
    logger.log(`- jobLogs: ${result.jobLogsDeleted}`);
    logger.log(`- backupLogs: ${result.backupLogsDeleted}`);
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  const logger = new Logger('Phase1DevSeedReset');
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
