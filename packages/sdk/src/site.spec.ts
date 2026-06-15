import { createSiteClient } from './site';
import { createAdminSiteClient } from './admin-site';

function fakeClient() {
  const calls: { method: string; path: string; body?: unknown }[] = [];
  return {
    calls,
    request: async <T>(opts: { method: string; path: string; body?: unknown }): Promise<T> => {
      calls.push(opts);
      return {} as T;
    },
  };
}

describe('site SDK clients', () => {
  it('public getSettings hits the public settings path', async () => {
    const client = fakeClient();
    await createSiteClient(client as never).getSettings();
    expect(client.calls[0]).toEqual({ method: 'GET', path: '/api/v1/site/settings' });
  });

  it('public submitContactMessage posts the body', async () => {
    const client = fakeClient();
    await createSiteClient(client as never).submitContactMessage({
      name: 'A',
      email: 'a@b.c',
      message: 'hi',
    });
    expect(client.calls[0]!.method).toBe('POST');
    expect(client.calls[0]!.path).toBe('/api/v1/site/contact-messages');
    expect(JSON.parse(client.calls[0]!.body as string)).toMatchObject({ name: 'A' });
  });

  it('admin getSettings hits the admin path', async () => {
    const client = fakeClient();
    await createAdminSiteClient(client as never).getSettings();
    expect(client.calls[0]!.path).toBe('/admin/v1/site/settings');
  });

  it('admin listMessages builds a paged query', async () => {
    const client = fakeClient();
    await createAdminSiteClient(client as never).listMessages({ page: 2, limit: 10 });
    expect(client.calls[0]!.path).toBe('/admin/v1/site/contact-messages?page=2&limit=10');
  });

  it('admin deleteMessage hits the message path', async () => {
    const client = fakeClient();
    await createAdminSiteClient(client as never).deleteMessage('abc');
    expect(client.calls[0]).toEqual({ method: 'DELETE', path: '/admin/v1/site/contact-messages/abc' });
  });
});
