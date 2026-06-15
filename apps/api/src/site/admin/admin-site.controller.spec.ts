import { AdminSiteController } from './admin-site.controller';

const view = {
  about: { title: 'About', bodyJson: {}, bodyHtml: '<p>a</p>' },
  contact: { socials: [] },
  updatedAt: new Date('2026-06-15T00:00:00Z'),
};

function authReq() {
  return { auth: { userId: 'admin-1' } } as never;
}

describe('AdminSiteController', () => {
  it('returns settings', async () => {
    const settings = { getSettings: jest.fn().mockResolvedValue(view), updateSettings: jest.fn() };
    const messages = { list: jest.fn(), getById: jest.fn(), delete: jest.fn() };
    const controller = new AdminSiteController(settings as never, messages as never);
    const res = await controller.getSettings();
    expect(res.settings.about.title).toBe('About');
  });

  it('updates settings with the requesting user id', async () => {
    const settings = { getSettings: jest.fn(), updateSettings: jest.fn().mockResolvedValue(view) };
    const messages = { list: jest.fn(), getById: jest.fn(), delete: jest.fn() };
    const controller = new AdminSiteController(settings as never, messages as never);
    await controller.updateSettings(
      { about: { title: 'About', bodyJson: {}, bodyHtml: '<p>a</p>' }, contact: { socials: [] } },
      authReq(),
    );
    expect(settings.updateSettings).toHaveBeenCalledWith(expect.any(Object), 'admin-1');
  });

  it('lists contact messages', async () => {
    const settings = { getSettings: jest.fn(), updateSettings: jest.fn() };
    const messages = {
      list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      getById: jest.fn(),
      delete: jest.fn(),
    };
    const controller = new AdminSiteController(settings as never, messages as never);
    const res = await controller.listMessages({ page: '1', limit: '20' });
    expect(res.total).toBe(0);
    expect(res.page).toBe(1);
  });

  it('deletes a contact message', async () => {
    const settings = { getSettings: jest.fn(), updateSettings: jest.fn() };
    const messages = { list: jest.fn(), getById: jest.fn(), delete: jest.fn().mockResolvedValue(undefined) };
    const controller = new AdminSiteController(settings as never, messages as never);
    const res = await controller.deleteMessage('msg-1');
    expect(messages.delete).toHaveBeenCalledWith('msg-1');
    expect(res.success).toBe(true);
  });
});
