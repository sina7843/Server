import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { EsportsSeedService } from './esports-seed.service';
import type { EsportsSeedResult } from './esports-seed.service';

interface SafeSeedLogger {
  readonly log: (message: string) => void;
  readonly error: (message: string) => void;
}

export async function runEsportsSeedCommand(
  seedService: Pick<EsportsSeedService, 'runEsportsSeed'>,
  logger: SafeSeedLogger = console,
): Promise<number> {
  try {
    const result: EsportsSeedResult = await seedService.runEsportsSeed();
    logger.log(JSON.stringify(result, null, 2));
    return 0;
  } catch {
    logger.error('Esports seed failed.');
    return 1;
  }
}

async function bootstrap(): Promise<void> {
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    process.exitCode = await runEsportsSeedCommand(appContext.get(EsportsSeedService));
  } finally {
    await appContext.close();
  }
}

if (require.main === module) {
  void bootstrap();
}
