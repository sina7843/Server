import type { S3CompatibleStorageConfig } from '../../config/storage.config';
import { S3BaseAdapter } from './s3-base.adapter';

export class MinioStorageAdapter extends S3BaseAdapter {
  constructor(config: S3CompatibleStorageConfig) {
    if (config.provider !== 'minio') {
      throw new Error('MinioStorageAdapter requires provider=minio.');
    }
    super(config);
  }
}
