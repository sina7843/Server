import { SecurityHeadersMiddleware } from './security-headers.middleware';

function makeResponse() {
  const headers: Record<string, string | undefined> = { 'x-powered-by': 'Express' };
  return {
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
    },
    removeHeader(name: string) {
      delete headers[name.toLowerCase()];
    },
    _headers: headers,
  };
}

describe('SecurityHeadersMiddleware', () => {
  let middleware: SecurityHeadersMiddleware;
  let res: ReturnType<typeof makeResponse>;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new SecurityHeadersMiddleware();
    res = makeResponse();
    next = jest.fn();
  });

  it('calls next()', () => {
    middleware.use({} as never, res as never, next);
    expect(next).toHaveBeenCalled();
  });

  it('sets X-Content-Type-Options: nosniff', () => {
    middleware.use({} as never, res as never, next);
    expect(res._headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options: DENY', () => {
    middleware.use({} as never, res as never, next);
    expect(res._headers['x-frame-options']).toBe('DENY');
  });

  it('sets Strict-Transport-Security with long max-age', () => {
    middleware.use({} as never, res as never, next);
    const hsts = res._headers['strict-transport-security'] ?? '';
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
  });

  it('sets Content-Security-Policy', () => {
    middleware.use({} as never, res as never, next);
    expect(res._headers['content-security-policy']).toBeDefined();
  });

  it('sets Referrer-Policy: no-referrer', () => {
    middleware.use({} as never, res as never, next);
    expect(res._headers['referrer-policy']).toBe('no-referrer');
  });

  it('sets Permissions-Policy', () => {
    middleware.use({} as never, res as never, next);
    expect(res._headers['permissions-policy']).toBeDefined();
  });

  it('removes X-Powered-By', () => {
    middleware.use({} as never, res as never, next);
    expect(res._headers['x-powered-by']).toBeUndefined();
  });
});
