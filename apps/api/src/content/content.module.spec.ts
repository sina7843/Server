import { ContentModule } from './content.module';

describe('ContentModule — no controllers registered', () => {
  it('ContentModule has no controllers array', () => {
    const metadata = Reflect.getMetadata('controllers', ContentModule);
    expect(metadata == null || (Array.isArray(metadata) && metadata.length === 0)).toBe(true);
  });
});
