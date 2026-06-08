import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Phase1DevSeedModule } from './phase1-dev-seed.module';
import { Phase1DevSeedService } from './phase1-dev-seed.service';
import { loadLocalEnv } from './load-local-env';
import { DEV_TEST_ACCOUNTS, DEFAULT_DEV_SEED_PASSWORD } from './phase1-dev-seed.constants';

interface SeedServiceLike {
  runSeed(): Promise<unknown>;
}
interface ConsoleLike {
  log(msg: string): void;
  error(msg: string): void;
}

export async function runPhase1DevSeedCommand(
  seedService: SeedServiceLike,
  out: ConsoleLike,
  env: Partial<Record<string, string>>,
): Promise<number> {
  try {
    await seedService.runSeed();
    out.log('Development seed completed.');

    const password = env.DRAGON_DEV_SEED_PASSWORD ?? DEFAULT_DEV_SEED_PASSWORD;
    const suppress = env.CI === 'true' && env.DRAGON_PRINT_SEED_CREDENTIALS !== 'true';

    if (suppress) {
      out.log('Credentials suppressed in CI. Set DRAGON_PRINT_SEED_CREDENTIALS=true to print.');
    } else {
      for (const account of DEV_TEST_ACCOUNTS) {
        out.log(`   Email: ${account.email}`);
        out.log(`   Phone: ${account.phone}`);
        out.log(`   Password: ${password}`);
      }
    }
    return 0;
  } catch (err) {
    out.error(err instanceof Error ? err.message : String(err));
    return 1;
  }
}

async function main(): Promise<void> {
  loadLocalEnv();

  const logger = new Logger('Phase1DevSeed');
  const app = await NestFactory.createApplicationContext(Phase1DevSeedModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const service = app.get(Phase1DevSeedService);
    const result = await service.runSeed();

    logger.log(`Phase 1 dev seed completed. batch=${result.batch}`);
    logger.log('Seeded collections:');
    for (const [name, count] of Object.entries(result.counts)) {
      logger.log(`- ${name}: ${count}`);
    }

    if (process.env.CI === 'true') {
      logger.log('Local test credentials were not printed because CI=true.');
    } else {
      logger.log('Local test credentials:');
      for (const credential of result.credentials) {
        logger.log(
          `- ${credential.purpose}: email=${credential.email} phone=${credential.phone} password=${credential.password} roles=${credential.roles.join(',')} status=${credential.status}`,
        );
      }
    }
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  const logger = new Logger('Phase1DevSeed');
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
