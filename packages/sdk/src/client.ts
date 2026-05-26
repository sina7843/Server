export type ApiFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface ApiClientOptions {
  baseUrl: string;
  fetch?: ApiFetch;
  headers?: HeadersInit;
  /** Set to 'include' for browser clients that need to send/receive HttpOnly cookies (e.g. refresh token). */
  credentials?: RequestCredentials;
}

export interface ApiRequestOptions extends RequestInit {
  path: string;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface ApiClient {
  request<TResponse = unknown>(requestOptions: ApiRequestOptions): Promise<TResponse>;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImplementation = options.fetch ?? globalThis.fetch;

  if (typeof fetchImplementation !== 'function') {
    throw new ApiClientError('No fetch implementation is available.');
  }

  return {
    async request<TResponse = unknown>(requestOptions: ApiRequestOptions): Promise<TResponse> {
      const { path, headers, ...init } = requestOptions;

      try {
        const response = await fetchImplementation(joinUrl(baseUrl, path), {
          ...(options.credentials !== undefined ? { credentials: options.credentials } : {}),
          ...init,
          headers: mergeHeaders(options.headers, headers),
        });

        if (!response.ok) {
          throw new ApiClientError(
            `Request failed with status ${response.status}.`,
            response.status,
          );
        }

        return (await response.json()) as TResponse;
      } catch (error) {
        if (error instanceof ApiClientError) {
          throw error;
        }

        throw new ApiClientError(error instanceof Error ? error.message : 'Request failed.');
      }
    },
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmedBaseUrl = baseUrl.trim();

  if (trimmedBaseUrl.length === 0) {
    throw new ApiClientError('API client baseUrl is required.');
  }

  return trimmedBaseUrl.replace(/\/+$/, '');
}

function joinUrl(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

function mergeHeaders(defaultHeaders?: HeadersInit, requestHeaders?: HeadersInit): HeadersInit {
  return {
    ...headersToRecord(defaultHeaders),
    ...headersToRecord(requestHeaders),
  };
}

function headersToRecord(headers?: HeadersInit): Record<string, string> {
  if (headers === undefined) {
    return {};
  }

  if (isHeaders(headers)) {
    const record: Record<string, string> = {};

    headers.forEach((value, key) => {
      record[key] = value;
    });

    return record;
  }

  if (Array.isArray(headers)) {
    const record: Record<string, string> = {};

    for (const [key, value] of headers) {
      record[key] = value;
    }

    return record;
  }

  const record: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    record[key] = value;
  }

  return record;
}

function isHeaders(headers: HeadersInit): headers is Headers {
  return typeof Headers !== 'undefined' && headers instanceof Headers;
}
