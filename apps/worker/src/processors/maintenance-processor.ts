import type { Job } from 'bullmq';
import type { JobStatusUpdater } from './processor-types';

export async function processMaintenanceJob(
  job: Job,
  updateStatus: JobStatusUpdater,
): Promise<void> {
  const jobLogId = typeof job.data?.jobLogId === 'string' ? job.data.jobLogId : null;

  if (jobLogId) {
    await updateStatus(jobLogId, 'processing', {
      attempts: job.attemptsMade + 1,
      startedAt: new Date(),
    });
  }

  try {
    switch (job.name) {
      case 'maintenance.cleanup_expired_sessions':
      case 'maintenance.cleanup_expired_otps':
      case 'maintenance.cleanup_unverified_users':
        // Maintenance cleanup logic is implemented in future tasks
        break;
      default:
        throw new Error(`Unknown maintenance job: ${job.name}`);
    }

    if (jobLogId) {
      await updateStatus(jobLogId, 'completed', {
        attempts: job.attemptsMade + 1,
        completedAt: new Date(),
      });
    }
  } catch (err) {
    if (jobLogId) {
      await updateStatus(jobLogId, 'failed', {
        attempts: job.attemptsMade + 1,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    throw err;
  }
}
