import { SiteSettingsService } from './site-settings.service';

function emptyDoc() {
  return {
    about: { title: '', bodyJson: {}, bodyHtml: '' },
    contact: { socials: [] },
    updatedAt: new Date('2026-06-15T00:00:00Z'),
  };
}

describe('SiteSettingsService', () => {
  it('returns existing settings when present', async () => {
    const repo = {
      findSingleton: jest.fn().mockResolvedValue({
        about: { title: 'About us', bodyJson: {}, bodyHtml: '<p>hi</p>' },
        contact: { email: 'a@b.c', socials: [] },
        updatedAt: new Date(),
      }),
      upsert: jest.fn(),
    };
    const sanitizer = { sanitize: (html: string) => html };
    const service = new SiteSettingsService(repo as never, sanitizer as never);
    const result = await service.getSettings();
    expect(result.about.title).toBe('About us');
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('returns empty defaults when no doc exists (no throw)', async () => {
    const repo = { findSingleton: jest.fn().mockResolvedValue(null), upsert: jest.fn() };
    const sanitizer = { sanitize: (html: string) => html };
    const service = new SiteSettingsService(repo as never, sanitizer as never);
    const result = await service.getSettings();
    expect(result.about.title).toBe('');
    expect(result.contact.socials).toEqual([]);
  });

  it('sanitizes bodyHtml before upserting', async () => {
    const repo = { findSingleton: jest.fn(), upsert: jest.fn().mockResolvedValue(emptyDoc()) };
    const sanitizer = { sanitize: jest.fn().mockReturnValue('<p>clean</p>') };
    const service = new SiteSettingsService(repo as never, sanitizer as never);
    await service.updateSettings(
      {
        about: { title: 'T', bodyJson: {}, bodyHtml: '<script>x</script><p>clean</p>' },
        contact: { socials: [] },
      },
      'user-1',
    );
    expect(sanitizer.sanitize).toHaveBeenCalled();
    expect(repo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        about: expect.objectContaining({ bodyHtml: '<p>clean</p>' }),
        updatedBy: 'user-1',
      }),
    );
  });
});
