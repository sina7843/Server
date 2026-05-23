import type { S3CompatibleStorageConfig } from '../../config/storage.config';
import { S3BaseAdapter } from './s3-base.adapter';

export class ArvanS3StorageAdapter extends S3BaseAdapter {
  constructor(config: S3CompatibleStorageConfig) {
    if (config.provider !== 'arvan') {
      throw new Error('ArvanS3StorageAdapter requires provider=arvan.');
    }
    super(config);
  }
}
