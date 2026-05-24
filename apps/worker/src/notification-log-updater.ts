import mongoose from 'mongoose';
import type { NotificationLogStatusUpdater } from './processors/processor-types';

let connection: mongoose.Connection | null = null;

export async function connectNotificationLogMongo(uri: string): Promise<void> {
  connection = mongoose.createConnection(uri);
  await connection.asPromise();
}

export async function disconnectNotificationLogMongo(): Promise<void> {
  if (connection) {
    await connection.close();
    connection = null;
  }
}

export const mongoNotificationLogStatusUpdater: NotificationLogStatusUpdater = async (
  notificationLogId,
  status,
  updates = {},
) => {
  if (!connection) return;

  const set: Record<string, unknown> = { status, updatedAt: new Date() };
  if (updates.providerMessageId !== undefined) set.providerMessageId = updates.providerMessageId;
  if (updates.errorCode !== undefined) set.errorCode = updates.errorCode;
  if (updates.errorMessage !== undefined) set.errorMessage = updates.errorMessage;

  try {
    await connection
      .collection('notification_logs')
      .updateOne({ _id: new mongoose.Types.ObjectId(notificationLogId) }, { $set: set });
  } catch (err) {
    console.error(
      `[NotificationLogUpdater] Failed to update NotificationLog ${notificationLogId} to ${status}:`,
      err,
    );
  }
};

export function createNoopNotificationLogStatusUpdater(): NotificationLogStatusUpdater {
  return async () => {
    // No-op: used when MongoDB is not configured
  };
}
