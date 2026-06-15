import { model } from 'mongoose';
import { SiteSettings, SiteSettingsSchema, SITE_SETTINGS_KEY } from './site-settings.schema';

describe('SiteSettings schema', () => {
  const SiteSettingsModel = model(SiteSettings.name, SiteSettingsSchema);

  it('defaults key to global and socials to empty array', () => {
    const doc = new SiteSettingsModel({});
    expect(doc.key).toBe(SITE_SETTINGS_KEY);
    expect(doc.contact.socials).toEqual([]);
    expect(doc.about.title).toBe('');
  });

  it('stores socials as platform/url pairs', () => {
    const doc = new SiteSettingsModel({
      contact: { socials: [{ platform: 'telegram', url: 'https://t.me/x' }] },
    });
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    expect(doc.contact.socials[0]!.platform).toBe('telegram');
    expect(doc.contact.socials[0]!.url).toBe('https://t.me/x');
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
  });
});
