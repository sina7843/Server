import mongoose from 'mongoose';
import type { JobStatusUpdater } from './processors/processor-types';

let connection: mongoose.Connection | null = null;

export async function connectJobLogMongo(uri: string): Promise<void> {
  connection = mongoose.createConnection(uri);
  await connection.asPromise();
}

export async function disconnectJobLogMongo(): Promise<void> {
  if (connection) {
    await connection.close();
    connection = null;
  }
}

export const mongoJobStatusUpdater: JobStatusUpdater = async (jobLogId, status, updates = {}) => {
  if (!connection) return;

  const update: Record<string, unknown> = { status, updatedAt: new Date() };
  if (updates.attempts !== undefined) update.attempts = updates.attempts;
  if (updates.error !== undefined) update.error = updates.error;
  if (updates.startedAt !== undefined) update.startedAt = updates.startedAt;
  if (updates.completedAt !== undefined) update.completedAt = updates.completedAt;

  try {
    await connection
      .collection('job_logs')
      .updateOne({ _id: new mongoose.Types.ObjectId(jobLogId) }, { $set: update });
  } catch (err) {
    console.error(`[JobLogUpdater] Failed to update JobLog ${jobLogId} to ${status}:`, err);
  }
};

export function createNoopStatusUpdater(): JobStatusUpdater {
  return async () => {
    // No-op: used when MongoDB is not configured
  };
}
