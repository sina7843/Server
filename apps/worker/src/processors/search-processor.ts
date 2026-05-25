import type { Job } from 'bullmq';
import type { JobStatusUpdater } from './processor-types';

export async function processSearchJob(job: Job, updateStatus: JobStatusUpdater): Promise<void> {
  const jobLogId = typeof job.data?.jobLogId === 'string' ? job.data.jobLogId : null;

  if (jobLogId) {
    await updateStatus(jobLogId, 'processing', {
      attempts: job.attemptsMade + 1,
      startedAt: new Date(),
    });
  }

  try {
    switch (job.name) {
      case 'search.reindex_all':
      case 'search.index_content':
      case 'search.remove_content':
        // Phase 0: MongoSearchAdapter reads directly from source collections at query time.
        // No external search index to maintain. These jobs are no-ops in Phase 0.
        break;
      default:
        throw new Error(`Unknown search job: ${job.name}`);
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
