import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { SignedUrlOptions, StorageUploadInput, StoredObject } from '@dragon/types';
import type { S3CompatibleStorageConfig } from '../../config/storage.config';
import type { StorageService } from '../storage.service';
import { assertSafeObjectKey } from '../storage-object-key';

export abstract class S3BaseAdapter implements StorageService {
  protected readonly client: S3Client;

  constructor(protected readonly config: S3CompatibleStorageConfig) {
    this.client = new S3Client({
      endpoint: config.s3Endpoint,
      region: config.s3Region,
      credentials: {
        accessKeyId: config.s3AccessKeyId,
        secretAccessKey: config.s3SecretAccessKey,
      },
      forcePathStyle: config.s3ForcePathStyle,
    });
  }

  async upload(input: StorageUploadInput): Promise<StoredObject> {
    assertSafeObjectKey(input.objectKey);

    const commandInput: PutObjectCommandInput = {
      Bucket: this.config.bucket,
      Key: input.objectKey,
      Body: input.body as Buffer | Uint8Array,
      ContentType: input.mimeType,
      ...(input.sizeBytes !== undefined ? { ContentLength: input.sizeBytes } : {}),
      ...(input.metadata ? { Metadata: input.metadata } : {}),
      ...(input.visibility === 'public' ? { ACL: 'public-read' } : {}),
    };

    const result = await this.client.send(new PutObjectCommand(commandInput));

    return {
      provider: this.config.provider,
      bucket: this.config.bucket,
      objectKey: input.objectKey,
      mimeType: input.mimeType,
      ...(input.sizeBytes !== undefined ? { sizeBytes: input.sizeBytes } : {}),
      ...(result.ETag ? { etag: result.ETag.replace(/"/g, '') } : {}),
      ...(input.visibility === 'public' ? { publicUrl: this.getPublicUrl(input.objectKey) } : {}),
    };
  }

  async delete(objectKey: string): Promise<void> {
    assertSafeObjectKey(objectKey);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: objectKey }));
  }

  getPublicUrl(objectKey: string): string {
    assertSafeObjectKey(objectKey);
    const base = this.config.publicBaseUrl.replace(/\/$/, '');
    return `${base}/${objectKey}`;
  }

  async getSignedUrl(objectKey: string, options?: SignedUrlOptions): Promise<string> {
    assertSafeObjectKey(objectKey);
    const expiresIn = options?.expiresInSeconds ?? this.config.signedUrlTtlSeconds;
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: objectKey,
      ...(options?.responseContentDisposition
        ? { ResponseContentDisposition: options.responseContentDisposition }
        : {}),
      ...(options?.responseContentType ? { ResponseContentType: options.responseContentType } : {}),
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }
}
