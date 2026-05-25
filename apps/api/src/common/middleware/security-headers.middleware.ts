import { Injectable, NestMiddleware } from '@nestjs/common';

interface ResponseWithHeaders {
  setHeader(name: string, value: string): void;
  removeHeader(name: string): void;
}

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(_req: unknown, res: ResponseWithHeaders, next: () => void): void {
    // Prevent MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // HTTP Strict Transport Security (1 year, includeSubDomains, preload-ready)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    // Minimal Content-Security-Policy for a pure JSON API
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    // No referrer information leaked to third parties
    res.setHeader('Referrer-Policy', 'no-referrer');
    // Disable browser features that have no relevance to an API
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    // Remove Express fingerprint header
    res.removeHeader('X-Powered-By');
    next();
  }
}
