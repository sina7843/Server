import type {
  MyUserProfileDto,
  PublicProfileResponseDto,
  UpdateMyProfileDto,
} from './profile.types';

export interface ProfileApiOptions {
  readonly baseUrl?: string;
  readonly token?: string | null;
  readonly fetcher?: typeof fetch;
}

function joinUrl(baseUrl: string | undefined, path: string): string {
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function parseJsonResponse<TResponse>(
  response: Response,
): Promise<TResponse> {
  if (!response.ok) {
    throw new Error(`Profile request failed with ${response.status}.`);
  }

  return (await response.json()) as TResponse;
}

export function createProfileApi(options: ProfileApiOptions = {}) {
  const fetcher = options.fetcher ?? fetch;

  async function get<TResponse>(path: string): Promise<TResponse> {
    const response = await fetcher(joinUrl(options.baseUrl, path), {
      headers: options.token
        ? { authorization: `Bearer ${options.token}` }
        : undefined,
    });

    return parseJsonResponse<TResponse>(response);
  }

  async function patch<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
  ): Promise<TResponse> {
    const response = await fetcher(joinUrl(options.baseUrl, path), {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    return parseJsonResponse<TResponse>(response);
  }

  return {
    getPublicProfile(username: string): Promise<PublicProfileResponseDto> {
      return get<PublicProfileResponseDto>(
        `/api/v1/u/${encodeURIComponent(username)}`,
      );
    },

    getMyProfile(): Promise<MyUserProfileDto> {
      return get<MyUserProfileDto>('/api/v1/me/profile');
    },

    updateMyProfile(input: UpdateMyProfileDto): Promise<MyUserProfileDto> {
      return patch<MyUserProfileDto, UpdateMyProfileDto>(
        '/api/v1/me/profile',
        input,
      );
    },
  };
}
