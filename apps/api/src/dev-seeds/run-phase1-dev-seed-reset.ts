import { NestFactory } from '@nestjs/core';
import { Phase1DevSeedModule } from './phase1-dev-seed.module';
import { Phase1DevSeedService } from './phase1-dev-seed.service';

interface SafeLogger {
  readonly log: (message: string) => void;
  readonly error: (message: string) => void;
}

export async function runPhase1DevSeedResetCommand(
  service: Pick<Phase1DevSeedService, 'resetSeed'>,
  logger: SafeLogger = console,
): Promise<number> {
  try {
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
    return 0;
  } catch (error) {
    logger.error(error instanceof Error ? error.message : 'Seed reset failed.');
    return 1;
  }
}

async function bootstrap(): Promise<void> {
  const appContext = await NestFactory.createApplicationContext(Phase1DevSeedModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    process.exitCode = await runPhase1DevSeedResetCommand(appContext.get(Phase1DevSeedService));
  } finally {
    await appContext.close();
  }
}

if (require.main === module) {
  void bootstrap();
}
