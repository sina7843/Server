import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';

interface RequestWithId {
  headers: Record<string, string | string[] | undefined>;
  requestId?: string;
}

interface ResponseWithHeader {
  setHeader(name: string, value: string): void;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: ResponseWithHeader, next: () => void): void {
    const requestId =
      (req.headers['x-request-id'] as string | undefined) ??
      (req.headers['x-correlation-id'] as string | undefined) ??
      randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
