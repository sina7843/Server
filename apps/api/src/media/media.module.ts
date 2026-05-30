import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from '../audit/audit.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { STORAGE_CONFIG, getStorageConfig } from '../config/storage.config';
import { STORAGE_SERVICE } from '../storage/storage.service';
import { LocalStorageAdapter } from '../storage/local/local-storage.adapter';
import { MinioStorageAdapter } from '../storage/s3/minio-storage.adapter';
import { ArvanS3StorageAdapter } from '../storage/s3/arvan-s3-storage.adapter';
import type { StorageConfig } from '../config/storage.config';
import { MediaAsset, MediaAssetSchema } from './media-asset.schema';
import { MediaAssetRepository } from './media-asset.repository';
import { MediaAssetService } from './media-asset.service';
import { AdminMediaController } from './admin-media.controller';
import { AdminMediaService } from './admin-media.service';
import { ImageProcessorService } from './image-processor.service';
import { MediaUploadPipeline } from './media-upload-pipeline.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MediaAsset.name, schema: MediaAssetSchema }]),
    AuditModule,
    AnalyticsModule,
    forwardRef(() => AuthModule),
    forwardRef(() => RbacModule),
  ],
  controllers: [AdminMediaController],
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
        throw new Error(`Unknown storage provider: ${String(config.provider)}`);
      },
      inject: [STORAGE_CONFIG],
    },
    MediaAssetRepository,
    MediaAssetService,
    ImageProcessorService,
    MediaUploadPipeline,
    AdminMediaService,
  ],
  exports: [MediaAssetService, MediaAssetRepository, STORAGE_SERVICE, MediaUploadPipeline],
})
export class MediaModule {}
