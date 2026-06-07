import { NestFactory } from '@nestjs/core';
import { PHASE1_DEV_SEED_ACCOUNTS, PHASE1_DEV_SEED_PASSWORD } from './phase1-dev-seed.constants';
import { Phase1DevSeedModule } from './phase1-dev-seed.module';
import { Phase1DevSeedService } from './phase1-dev-seed.service';

interface SafeLogger {
  readonly log: (message: string) => void;
  readonly error: (message: string) => void;
}

interface SeedCommandEnv {
  readonly CI?: string;
  readonly DRAGON_DEV_SEED_PASSWORD?: string;
  readonly DRAGON_PRINT_SEED_CREDENTIALS?: string;
}

export async function runPhase1DevSeedCommand(
  service: Pick<Phase1DevSeedService, 'runSeed'>,
  logger: SafeLogger = console,
  // process.env is compatible at runtime even though exactOptionalPropertyTypes
  // prevents a direct structural assignment — we assert here for the default only.
  env: SeedCommandEnv = process.env as SeedCommandEnv,
): Promise<number> {
  try {
    const result = await service.runSeed();

    // Resolve effective password: env override takes precedence over compile-time default.
    // This lets developers set DRAGON_DEV_SEED_PASSWORD without rebuilding the image.
    const effectivePassword = env.DRAGON_DEV_SEED_PASSWORD ?? PHASE1_DEV_SEED_PASSWORD;

    // In CI environments, suppress credential printing by default to avoid leaking test
    // passwords into shared build logs. Set DRAGON_PRINT_SEED_CREDENTIALS=true to override.
    const isCI = Boolean(env.CI);
    const printCredentials = !isCI || env.DRAGON_PRINT_SEED_CREDENTIALS === 'true';

    logger.log('Development seed completed.');
    logger.log('');
    logger.log('Test accounts:');

    if (printCredentials) {
      PHASE1_DEV_SEED_ACCOUNTS.forEach((account, index) => {
        logger.log(`${index + 1}. ${account.label}`);
        logger.log(`   Email: ${account.email}`);
        logger.log(`   Phone: ${account.phone}`);
        logger.log(`   Password: ${effectivePassword}`);
        logger.log('');
      });
    } else {
      PHASE1_DEV_SEED_ACCOUNTS.forEach((account, index) => {
        logger.log(`${index + 1}. ${account.label} — ${account.email} / ${account.phone}`);
      });
      logger.log('');
      logger.log('Credential printing suppressed in CI. Set DRAGON_PRINT_SEED_CREDENTIALS=true to show passwords.');
      logger.log('');
    }

    logger.log('Seed summary:');
    logger.log(JSON.stringify(result, null, 2));
    return 0;
  } catch (error) {
    logger.error(error instanceof Error ? error.message : 'Development seed failed.');
    return 1;
  }
}

async function bootstrap(): Promise<void> {
  const appContext = await NestFactory.createApplicationContext(Phase1DevSeedModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    process.exitCode = await runPhase1DevSeedCommand(appContext.get(Phase1DevSeedService));
  } finally {
    await appContext.close();
  }
}

if (require.main === module) {
  void bootstrap();
}
