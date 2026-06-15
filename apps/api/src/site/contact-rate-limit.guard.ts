import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class ContactRateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit = 5,
    private readonly windowMs = 60_000,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    }>();
    const ip = this.clientIp(req);
    const now = Date.now();
    const recent = (this.hits.get(ip) ?? []).filter((t) => now - t < this.windowMs);

    if (recent.length >= this.limit) {
      throw new HttpException('Too many requests. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    recent.push(now);
    this.hits.set(ip, recent);
    return true;
  }

  private clientIp(req: {
    ip?: string;
    headers: Record<string, string | string[] | undefined>;
  }): string {
    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0]?.trim() ?? 'unknown';
    return req.ip ?? 'unknown';
  }
}
