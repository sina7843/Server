import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { RbacSeedService } from './rbac-seed.service';
import type { RbacSeedResult } from './rbac-seed.types';

interface SafeSeedLogger {
  readonly log: (message: string) => void;
  readonly error: (message: string) => void;
}

export function formatRbacSeedSummary(result: RbacSeedResult): RbacSeedResult {
  return {
    permissionsCreated: result.permissionsCreated,
    permissionsUpdated: result.permissionsUpdated,
    rolesCreated: result.rolesCreated,
    rolesUpdated: result.rolesUpdated,
    rolePermissionsAttached: result.rolePermissionsAttached,
    superAdminAssignmentCreated: result.superAdminAssignmentCreated,
    skipped: [...result.skipped],
  };
}

export async function runRbacSeedCommand(
  seedService: Pick<RbacSeedService, 'runRbacSeed'>,
  logger: SafeSeedLogger = console,
): Promise<number> {
  try {
    const result = await seedService.runRbacSeed();
    logger.log(JSON.stringify(formatRbacSeedSummary(result), null, 2));

    return 0;
  } catch {
    logger.error('RBAC seed failed.');

    return 1;
  }
}

async function bootstrap(): Promise<void> {
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    process.exitCode = await runRbacSeedCommand(appContext.get(RbacSeedService));
  } finally {
    await appContext.close();
  }
}

if (require.main === module) {
  void bootstrap();
}
