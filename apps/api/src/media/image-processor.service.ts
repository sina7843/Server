import sharp from 'sharp';
import { Injectable } from '@nestjs/common';

export interface ProcessedVariant {
  readonly type: 'thumbnail' | 'medium';
  readonly buffer: Buffer;
  readonly mimeType: string;
  readonly width: number;
  readonly height: number;
  readonly sizeBytes: number;
}

export interface ImageProcessResult {
  readonly variants: ProcessedVariant[];
  readonly originalWidth?: number;
  readonly originalHeight?: number;
}

const THUMBNAIL_MAX_PX = 320;
const MEDIUM_MAX_PX = 1280;

@Injectable()
export class ImageProcessorService {
  async process(buffer: Buffer, mimeType: string): Promise<ImageProcessResult> {
    if (mimeType === 'image/gif') {
      return { variants: [] };
    }

    const meta = await sharp(buffer).metadata();
    const originalWidth = meta.width;
    const originalHeight = meta.height;
    const maxDim = Math.max(originalWidth ?? 0, originalHeight ?? 0);

    const variants: ProcessedVariant[] = [];

    if (maxDim > THUMBNAIL_MAX_PX) {
      variants.push({
        type: 'thumbnail',
        ...(await this.resize(buffer, mimeType, THUMBNAIL_MAX_PX)),
      });
    }

    if (maxDim > MEDIUM_MAX_PX) {
      variants.push({
        type: 'medium',
        ...(await this.resize(buffer, mimeType, MEDIUM_MAX_PX)),
      });
    }

    return { variants, originalWidth, originalHeight };
  }

  private async resize(
    buffer: Buffer,
    mimeType: string,
    maxPx: number,
  ): Promise<Omit<ProcessedVariant, 'type'>> {
    const result = await sharp(buffer)
      .resize(maxPx, maxPx, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: result.data,
      mimeType,
      width: result.info.width,
      height: result.info.height,
      sizeBytes: result.data.length,
    };
  }
}
