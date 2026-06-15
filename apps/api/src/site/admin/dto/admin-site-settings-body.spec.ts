import { BadRequestException } from '@nestjs/common';
import { parseUpdateSiteSettingsBody } from './admin-site-settings-body';

describe('parseUpdateSiteSettingsBody', () => {
  it('parses a full valid body', () => {
    const result = parseUpdateSiteSettingsBody({
      about: { title: 'About', bodyJson: { type: 'doc' }, bodyHtml: '<p>a</p>' },
      contact: {
        email: 'a@b.c',
        phone: '0911',
        address: 'Tehran',
        mapEmbedUrl: 'https://maps',
        socials: [{ platform: 'instagram', url: 'https://ig/x' }],
      },
    });
    expect(result.about.title).toBe('About');
    expect(result.contact.socials).toHaveLength(1);
  });

  it('defaults socials to empty array when omitted', () => {
    const result = parseUpdateSiteSettingsBody({
      about: { title: 'A', bodyJson: {}, bodyHtml: '' },
      contact: {},
    });
    expect(result.contact.socials).toEqual([]);
  });

  it('rejects a non-object body', () => {
    expect(() => parseUpdateSiteSettingsBody(null)).toThrow(BadRequestException);
  });

  it('rejects malformed social entries', () => {
    expect(() =>
      parseUpdateSiteSettingsBody({
        about: { title: 'A', bodyJson: {}, bodyHtml: '' },
        contact: { socials: [{ platform: '', url: '' }] },
      }),
    ).toThrow(BadRequestException);
  });
});
