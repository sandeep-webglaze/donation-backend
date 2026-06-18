import {
  Injectable as InjectableDecorator,
  NestInterceptor as NestInterceptorInterface,
  ExecutionContext as ExecContext,
  CallHandler as Handler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable as Obs, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@InjectableDecorator()
export class TimeoutInterceptor implements NestInterceptorInterface {
  intercept(_context: ExecContext, next: Handler): Obs<any> {
    return next.handle().pipe(
      timeout(30000), // 30 seconds
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  }
}