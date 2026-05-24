import type { Job } from 'bullmq';
import type { JobStatusUpdater } from './processor-types';

export async function processSmsJob(job: Job, updateStatus: JobStatusUpdater): Promise<void> {
  const jobLogId = typeof job.data?.jobLogId === 'string' ? job.data.jobLogId : null;

  if (jobLogId) {
    await updateStatus(jobLogId, 'processing', {
      attempts: job.attemptsMade + 1,
      startedAt: new Date(),
    });
  }

  try {
    switch (job.name) {
      case 'sms.send':
        // SMS queued sending is Task 0.8.4
        break;
      default:
        throw new Error(`Unknown SMS job: ${job.name}`);
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
