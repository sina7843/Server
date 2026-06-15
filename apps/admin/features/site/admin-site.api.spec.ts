import { ApiClientError, createAdminSiteClient, createApiClient } from '@dragon/sdk';
import {
  getSiteSettings,
  updateSiteSettings,
  listContactMessages,
  getContactMessage,
  deleteContactMessage,
} from './admin-site.api';

const mockFetch = jest.fn();
Object.assign(globalThis, { fetch: mockFetch });

function mockJson(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => data });
}

beforeEach(() => {
  mockFetch.mockReset();
});

const MSG_ID = 'abc';

const mockSettings = {
  settings: {
    about: { title: 'About Us', bodyHtml: '<p>About</p>', bodyJson: {} },
    contact: { socials: [] },
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
};

const mockMessageDto = {
  id: MSG_ID,
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'Hello',
  message: 'Test message',
  createdAt: '2025-01-01T00:00:00.000Z',
};

describe('admin-site.api — getSiteSettings', () => {
  function makeClient() {
    return createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } });
  }

  it('getSiteSettings sends GET /admin/v1/site/settings', async () => {
    mockJson(mockSettings);

    const result = await getSiteSettings(makeClient());

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/site/settings'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.settings.about.title).toBe('About Us');
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);

    await expect(getSiteSettings(makeClient())).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('admin-site.api — updateSiteSettings', () => {
  function makeClient() {
    return createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } });
  }

  it('updateSiteSettings sends PUT /admin/v1/site/settings', async () => {
    mockJson(mockSettings);

    const input = {
      about: { title: 'Updated', bodyHtml: '<p>Updated</p>', bodyJson: {} },
      contact: { socials: [] },
    };

    const result = await updateSiteSettings(makeClient(), input);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/site/settings'),
      expect.objectContaining({ method: 'PUT' }),
    );
    expect(result.settings).toBeDefined();
  });

  it('updateSiteSettings sends the body as JSON', async () => {
    mockJson(mockSettings);

    const input = {
      about: { title: 'New Title', bodyHtml: '<p>New</p>', bodyJson: { type: 'doc' } },
      contact: { socials: [{ platform: 'twitter', url: 'https://twitter.com/example' }] },
    };

    await updateSiteSettings(makeClient(), input);

    const [[, opts]] = mockFetch.mock.calls;
    const body = JSON.parse(opts.body as string);
    expect(body.about.title).toBe('New Title');
    expect(body.contact.socials).toHaveLength(1);
  });
});

describe('admin-site.api — listContactMessages', () => {
  function makeClient() {
    return createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } });
  }

  it('listContactMessages sends GET /admin/v1/site/contact-messages', async () => {
    mockJson({ items: [mockMessageDto], total: 1, page: 1, limit: 20 });

    const result = await listContactMessages(makeClient());

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/site/contact-messages'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.items).toHaveLength(1);
  });

  it('listContactMessages passes page and limit query params', async () => {
    mockJson({ items: [], total: 0, page: 2, limit: 10 });

    await listContactMessages(makeClient(), { page: 2, limit: 10 });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/page=2.*limit=10|limit=10.*page=2/),
      expect.anything(),
    );
  });
});

describe('admin-site.api — getContactMessage', () => {
  function makeClient() {
    return createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } });
  }

  it('getContactMessage sends GET /admin/v1/site/contact-messages/:id', async () => {
    mockJson({ message: mockMessageDto });

    const result = await getContactMessage(makeClient(), MSG_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/site/contact-messages/${MSG_ID}`),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.message.id).toBe(MSG_ID);
  });
});

describe('admin-site.api — deleteContactMessage', () => {
  function makeClient() {
    return createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } });
  }

  it('deleteContactMessage sends DELETE /admin/v1/site/contact-messages/:id', async () => {
    mockJson({ success: true, message: 'Message deleted.' });

    const result = await deleteContactMessage(makeClient(), MSG_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/site/contact-messages/${MSG_ID}`),
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(result.success).toBe(true);
  });

  it('throws ApiClientError on 404', async () => {
    mockJson({ message: 'Not Found' }, 404);

    await expect(deleteContactMessage(makeClient(), 'nonexistent')).rejects.toBeInstanceOf(
      ApiClientError,
    );
  });
});

describe('admin-site.api — createAdminSiteClient direct', () => {
  function makeClient() {
    return createAdminSiteClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );
  }

  it('has getSettings method', () => {
    const client = makeClient();
    expect(typeof client.getSettings).toBe('function');
  });

  it('has updateSettings method', () => {
    const client = makeClient();
    expect(typeof client.updateSettings).toBe('function');
  });

  it('has listMessages method', () => {
    const client = makeClient();
    expect(typeof client.listMessages).toBe('function');
  });

  it('has getMessage method', () => {
    const client = makeClient();
    expect(typeof client.getMessage).toBe('function');
  });

  it('has deleteMessage method', () => {
    const client = makeClient();
    expect(typeof client.deleteMessage).toBe('function');
  });
});
