import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface HttpRequest {
  method: string;
  url: string;
  requestId?: string;
}

interface HttpResponse {
  statusCode: number;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<HttpRequest>();
    const { method, url, requestId } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<HttpResponse>();
          this.logger.log(
            JSON.stringify({
              requestId,
              method,
              url,
              status: res.statusCode,
              ms: Date.now() - start,
            }),
          );
        },
        error: (err: unknown) => {
          const status =
            err !== null && typeof err === 'object' && 'status' in err
              ? (err as { status: number }).status
              : 500;
          this.logger.error(
            JSON.stringify({
              requestId,
              method,
              url,
              status,
              ms: Date.now() - start,
            }),
          );
        },
      }),
    );
  }
}
