/* global describe, expect, it, jest */

import { ApiClientError, createApiClient } from './client';

describe('createApiClient', () => {
  it('uses a caller-provided fetch implementation with normalized base URL and merged headers', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ value: 'ok' }),
    } as Response);

    const client = createApiClient({
      baseUrl: 'https://api.example.test/',
      fetch: fetchMock,
      headers: {
        'x-default': 'default',
      },
    });

    const result = await client.request<{ value: string }>({
      path: 'generic-path',
      method: 'GET',
      headers: {
        'x-request': 'request',
      },
    });

    expect(result).toEqual({ value: 'ok' });
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/generic-path', {
      method: 'GET',
      headers: {
        'x-default': 'default',
        'x-request': 'request',
      },
    });
  });

  it('normalizes non-OK responses into ApiClientError', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetch: jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response),
    });

    await expect(client.request({ path: 'generic-path' })).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 500,
    });
  });

  it('requires a non-empty base URL', () => {
    expect(() => createApiClient({ baseUrl: ' ' })).toThrow(ApiClientError);
  });

  it('forwards credentials: include to fetch for cookie-based auth', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'tok', tokenType: 'Bearer', expiresIn: 900 }),
    } as Response);

    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetch: fetchMock,
      credentials: 'include',
    });

    await client.request({ path: '/api/v1/auth/login', method: 'POST', body: '{}' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/auth/login',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('token response from login does not contain refreshToken', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: 'tok', tokenType: 'Bearer', expiresIn: 900 }),
    } as Response);

    const client = createApiClient({ baseUrl: 'https://api.example.test', fetch: fetchMock });
    const response = await client.request<{
      accessToken: string;
      tokenType: string;
      expiresIn: number;
    }>({
      path: '/api/v1/auth/login',
      method: 'POST',
    });

    expect(JSON.stringify(response)).not.toContain('refreshToken');
  });
});
