import { Module } from '@nestjs/common';
import { STORAGE_CONFIG, getStorageConfig } from '../config/storage.config';
import { STORAGE_SERVICE } from './storage.service';
import { LocalStorageAdapter } from './local/local-storage.adapter';
import { MinioStorageAdapter } from './s3/minio-storage.adapter';
import { ArvanS3StorageAdapter } from './s3/arvan-s3-storage.adapter';
import type { StorageConfig } from '../config/storage.config';

@Module({
  providers: [
    {
      provide: STORAGE_CONFIG,
      useFactory: () => getStorageConfig(),
    },
    {
      provide: STORAGE_SERVICE,
      useFactory: (config: StorageConfig) => {
        if (config.provider === 'local') return new LocalStorageAdapter(config);
        if (config.provider === 'minio') return new MinioStorageAdapter(config);
        if (config.provider === 'arvan') return new ArvanS3StorageAdapter(config);
        throw new Error(`Unknown storage provider: ${String((config as StorageConfig).provider)}`);
      },
      inject: [STORAGE_CONFIG],
    },
  ],
  exports: [STORAGE_SERVICE, STORAGE_CONFIG],
})
export class StorageModule {}
