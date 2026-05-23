import { ImageProcessorService } from './image-processor.service';

jest.mock('sharp', () => {
  const sharpMock = jest.fn();

  const makeSharpInstance = (width: number, height: number) => ({
    metadata: jest.fn().mockResolvedValue({ width, height, format: 'jpeg' }),
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue({
      data: Buffer.from('resized-data'),
      info: { width: Math.min(width, 320), height: Math.min(height, 320) },
    }),
  });

  sharpMock.mockImplementation(() => makeSharpInstance(2000, 1500));

  return sharpMock;
});

describe('ImageProcessorService', () => {
  let service: ImageProcessorService;
  let sharpMock: jest.Mock;

  beforeEach(() => {
    service = new ImageProcessorService();
    sharpMock = jest.requireMock('sharp') as jest.Mock;
    sharpMock.mockClear();
  });

  describe('GIF pass-through', () => {
    it('skips variant generation for GIFs', async () => {
      const result = await service.process(Buffer.from('gif-data'), 'image/gif');
      expect(result.variants).toHaveLength(0);
      expect(sharpMock).not.toHaveBeenCalled();
    });
  });

  describe('JPEG processing', () => {
    beforeEach(() => {
      const makeInstance = (maxPx: number) => ({
        metadata: jest.fn().mockResolvedValue({ width: 2000, height: 1500 }),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({
          data: Buffer.from('resized'),
          info: { width: maxPx, height: Math.round((maxPx * 1500) / 2000) },
        }),
      });
      sharpMock.mockImplementation(() => makeInstance(320));
    });

    it('generates thumbnail and medium for large images', async () => {
      const makeInstance = (w: number, h: number) => ({
        metadata: jest.fn().mockResolvedValue({ width: 2000, height: 1500 }),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({
          data: Buffer.from('resized'),
          info: { width: w, height: h },
        }),
      });
      sharpMock
        .mockImplementationOnce(() => makeInstance(2000, 1500))
        .mockImplementationOnce(() => makeInstance(320, 240))
        .mockImplementationOnce(() => makeInstance(2000, 1500))
        .mockImplementationOnce(() => makeInstance(1280, 960));

      const result = await service.process(Buffer.from('jpeg-data'), 'image/jpeg');

      const types = result.variants.map((v) => v.type);
      expect(types).toContain('thumbnail');
      expect(types).toContain('medium');
    });

    it('sets originalWidth and originalHeight from metadata', async () => {
      const instance = {
        metadata: jest.fn().mockResolvedValue({ width: 2000, height: 1500 }),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({
          data: Buffer.from('resized'),
          info: { width: 320, height: 240 },
        }),
      };
      sharpMock.mockImplementation(() => instance);

      const result = await service.process(Buffer.from('jpeg-data'), 'image/jpeg');
      expect(result.originalWidth).toBe(2000);
      expect(result.originalHeight).toBe(1500);
    });

    it('skips thumbnail for images already <= 320px', async () => {
      const instance = {
        metadata: jest.fn().mockResolvedValue({ width: 200, height: 150 }),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({
          data: Buffer.from('resized'),
          info: { width: 200, height: 150 },
        }),
      };
      sharpMock.mockImplementation(() => instance);

      const result = await service.process(Buffer.from('small-jpeg'), 'image/jpeg');
      expect(result.variants).toHaveLength(0);
    });

    it('generates thumbnail but not medium for images between 320px and 1280px', async () => {
      let callCount = 0;
      sharpMock.mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({
          data: Buffer.from('resized'),
          info: { width: callCount++ === 0 ? 320 : 800, height: 240 },
        }),
      }));

      const result = await service.process(Buffer.from('medium-jpeg'), 'image/jpeg');
      const types = result.variants.map((v) => v.type);
      expect(types).toContain('thumbnail');
      expect(types).not.toContain('medium');
    });

    it('each variant has mimeType, width, height, sizeBytes, buffer', async () => {
      const instance = {
        metadata: jest.fn().mockResolvedValue({ width: 2000, height: 1500 }),
        resize: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue({
          data: Buffer.from('resized-bytes'),
          info: { width: 320, height: 240 },
        }),
      };
      sharpMock.mockImplementation(() => instance);

      const result = await service.process(Buffer.from('big-jpeg'), 'image/jpeg');
      for (const v of result.variants) {
        expect(v.mimeType).toBe('image/jpeg');
        expect(typeof v.width).toBe('number');
        expect(typeof v.height).toBe('number');
        expect(typeof v.sizeBytes).toBe('number');
        expect(Buffer.isBuffer(v.buffer)).toBe(true);
      }
    });
  });
});
