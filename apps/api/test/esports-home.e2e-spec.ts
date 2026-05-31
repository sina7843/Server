/* global afterEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EsportsController } from '../src/esports/esports.controller';
import { EsportsService } from '../src/esports/esports.service';
import type { EsportsHomeDto } from '@dragon/types';

const EMPTY_HOME_DTO: EsportsHomeDto = {
  featuredPosts: [],
  latestNews: [],
  activeTournaments: [],
  upcomingTournaments: [],
  topContent: [],
};

describe('GET /api/v1/esports/home', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
    jest.clearAllMocks();
  });

  async function createApp(dto: EsportsHomeDto = EMPTY_HOME_DTO): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({
      controllers: [EsportsController],
      providers: [
        {
          provide: EsportsService,
          useValue: {
            getHome: jest.fn().mockResolvedValue(dto),
          },
        },
      ],
    }).compile();

    const testApp = moduleRef.createNestApplication();
    await testApp.init();
    await testApp.listen(0);
    return testApp;
  }

  it('returns 200', async () => {
    app = await createApp();
    const res = await fetch(`${await app.getUrl()}/api/v1/esports/home`);
    expect(res.status).toBe(200);
  });

  it('response has EsportsHomeDto shape', async () => {
    app = await createApp();
    const res = await fetch(`${await app.getUrl()}/api/v1/esports/home`);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body['featuredPosts'])).toBe(true);
    expect(Array.isArray(body['latestNews'])).toBe(true);
    expect(Array.isArray(body['activeTournaments'])).toBe(true);
    expect(Array.isArray(body['upcomingTournaments'])).toBe(true);
    expect(Array.isArray(body['topContent'])).toBe(true);
  });

  it('returns empty activeTournaments while tournament data is unavailable', async () => {
    app = await createApp();
    const res = await fetch(`${await app.getUrl()}/api/v1/esports/home`);
    const body = (await res.json()) as EsportsHomeDto;
    expect(body.activeTournaments).toEqual([]);
  });

  it('returns empty upcomingTournaments while tournament data is unavailable', async () => {
    app = await createApp();
    const res = await fetch(`${await app.getUrl()}/api/v1/esports/home`);
    const body = (await res.json()) as EsportsHomeDto;
    expect(body.upcomingTournaments).toEqual([]);
  });

  it('returns real post data in featuredPosts when service provides it', async () => {
    const dto: EsportsHomeDto = {
      ...EMPTY_HOME_DTO,
      featuredPosts: [
        {
          id: 'post-1',
          type: 'article',
          title: 'Featured Article',
          slug: 'featured-article',
          bodyHtml: '<p>Content</p>',
          categoryIds: [],
          tagIds: [],
          seo: {},
          publishedAt: '2024-01-01T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    };
    app = await createApp(dto);
    const res = await fetch(`${await app.getUrl()}/api/v1/esports/home`);
    const body = (await res.json()) as EsportsHomeDto;
    expect(body.featuredPosts).toHaveLength(1);
    expect(body.featuredPosts[0]?.slug).toBe('featured-article');
  });

  it('response does not contain fake tournament names', async () => {
    app = await createApp();
    const res = await fetch(`${await app.getUrl()}/api/v1/esports/home`);
    const text = await res.text();
    expect(text).not.toContain('Dragon Cup 2024');
    expect(text).not.toContain('Test Tournament');
    expect(text).not.toContain('Fake Tournament');
  });

  it('response does not contain draft or archived posts', async () => {
    app = await createApp();
    const res = await fetch(`${await app.getUrl()}/api/v1/esports/home`);
    const text = await res.text();
    expect(text).not.toContain('"status":"draft"');
    expect(text).not.toContain('"status":"archived"');
  });
});
