import type {
  PublicSiteSettingsResponse,
  AdminSiteSettingsResponse,
  ContactMessageListResponse,
} from './site';

describe('site contracts', () => {
  it('builds a public settings response', () => {
    const res: PublicSiteSettingsResponse = {
      settings: {
        about: { title: 'About', bodyHtml: '<p>hi</p>' },
        contact: { socials: [{ platform: 'instagram', url: 'https://x' }] },
      },
    };
    expect(res.settings.contact.socials).toHaveLength(1);
  });

  it('builds an admin settings response', () => {
    const res: AdminSiteSettingsResponse = {
      settings: {
        about: { title: 'About', bodyJson: {}, bodyHtml: '' },
        contact: { socials: [] },
        updatedAt: new Date().toISOString(),
      },
    };
    expect(res.settings.about.title).toBe('About');
  });

  it('builds a message list response', () => {
    const res: ContactMessageListResponse = { items: [], total: 0, page: 1, limit: 20 };
    expect(res.total).toBe(0);
  });
});
