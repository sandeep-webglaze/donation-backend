import {
  Injectable as InjectableDec,
  NestInterceptor as NestInt,
  ExecutionContext as ExContext,
  CallHandler as CHandler,
  Logger as Log,
} from '@nestjs/common';
import { Observable as Obser } from 'rxjs';
import { tap } from 'rxjs/operators';

@InjectableDec()
export class LoggingInterceptor implements NestInt {
  private readonly logger = new Log(LoggingInterceptor.name);

  intercept(context: ExContext, next: CHandler): Obser<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const { method, url } = request;
    const now = Date.now();

    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      this.logger.log(`→ ${method} ${url}`);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const time = Date.now() - now;
          const status = ctx.getResponse().statusCode;
          const emoji = status >= 500 ? '🔴' : status >= 400 ? '🟡' : '🟢';
          this.logger.log(`${emoji} ${method} ${url} | ${status} | ${time}ms`);
        },
        error: () => {
          const time = Date.now() - now;
          if (isDev) {
            this.logger.debug(`⏱️  ${method} ${url} | Failed | ${time}ms`);
          }
        },
      }),
    );
  }
}
