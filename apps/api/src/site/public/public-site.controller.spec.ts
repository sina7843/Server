import { PublicSiteController } from './public-site.controller';

function makeReq(ip = '9.9.9.9') {
  return { ip, headers: {} } as never;
}

describe('PublicSiteController', () => {
  const view = {
    about: { title: 'About', bodyJson: {}, bodyHtml: '<p>a</p>' },
    contact: { email: 'a@b.c', socials: [] },
    updatedAt: new Date(),
  };

  it('returns public settings', async () => {
    const settings = { getSettings: jest.fn().mockResolvedValue(view), updateSettings: jest.fn() };
    const messages = { submit: jest.fn() };
    const controller = new PublicSiteController(settings as never, messages as never);
    const res = await controller.getSettings();
    expect(res.settings.about.title).toBe('About');
  });

  it('stores a valid contact message and returns success', async () => {
    const settings = { getSettings: jest.fn() };
    const messages = { submit: jest.fn().mockResolvedValue({ _id: '1' }) };
    const controller = new PublicSiteController(settings as never, messages as never);
    const res = await controller.submitContactMessage(
      { name: 'Ali', email: 'a@b.c', message: 'hi' },
      makeReq(),
    );
    expect(res).toEqual({ success: true });
    expect(messages.submit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ali', email: 'a@b.c', message: 'hi', ipHash: expect.any(String) }),
    );
  });

  it('silently drops honeypot submissions without storing', async () => {
    const settings = { getSettings: jest.fn() };
    const messages = { submit: jest.fn() };
    const controller = new PublicSiteController(settings as never, messages as never);
    const res = await controller.submitContactMessage(
      { name: 'Bot', email: 'b@b.c', message: 'spam', website: 'http://x' },
      makeReq(),
    );
    expect(res).toEqual({ success: true });
    expect(messages.submit).not.toHaveBeenCalled();
  });
});
