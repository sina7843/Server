import type { Job } from 'bullmq';
import { sendSmsDirectly } from '../sms/sms-sender';
import type { JobStatusUpdater, NotificationLogStatusUpdater } from './processor-types';

export async function processSmsJob(
  job: Job,
  updateJobStatus: JobStatusUpdater,
  updateNotificationLog: NotificationLogStatusUpdater,
): Promise<void> {
  const jobLogId = typeof job.data?.jobLogId === 'string' ? job.data.jobLogId : null;

  if (jobLogId) {
    await updateJobStatus(jobLogId, 'processing', {
      attempts: job.attemptsMade + 1,
      startedAt: new Date(),
    });
  }

  try {
    switch (job.name) {
      case 'sms.send': {
        await handleSmsSend(job, updateNotificationLog);
        break;
      }
      default:
        throw new Error(`Unknown SMS job: ${job.name}`);
    }

    if (jobLogId) {
      await updateJobStatus(jobLogId, 'completed', {
        attempts: job.attemptsMade + 1,
        completedAt: new Date(),
      });
    }
  } catch (err) {
    if (jobLogId) {
      await updateJobStatus(jobLogId, 'failed', {
        attempts: job.attemptsMade + 1,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    throw err;
  }
}

async function handleSmsSend(
  job: Job,
  updateNotificationLog: NotificationLogStatusUpdater,
): Promise<void> {
  const notificationLogId =
    typeof job.data?.notificationLogId === 'string' ? job.data.notificationLogId : null;
  const phone =
    typeof job.data?.recipientPhoneNormalized === 'string' ? job.data.recipientPhoneNormalized : '';
  const message = typeof job.data?.smsBody === 'string' ? job.data.smsBody : '';
  const purpose = typeof job.data?.purpose === 'string' ? job.data.purpose : undefined;

  const result = await sendSmsDirectly({ recipientPhoneNormalized: phone, message, purpose });

  if (notificationLogId) {
    if (result.status === 'sent') {
      await updateNotificationLog(
        notificationLogId,
        'sent',
        result.providerMessageId !== undefined ? { providerMessageId: result.providerMessageId } : {},
      );
    } else {
      await updateNotificationLog(notificationLogId, 'failed', {
        errorCode: result.errorCode ?? 'provider_error',
        errorMessage: result.errorMessage ?? 'SMS provider failed.',
      });
    }
  }
}
