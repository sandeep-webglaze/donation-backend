// ============================================================================
// SIMPLE RESPONSE INTERCEPTOR - For Success Responses
// ============================================================================
// File: src/common/interceptors/response.interceptor.ts
// ============================================================================

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: any;
  timestamp: string;
  //   path: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        // ✅ Already formatted? Return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return { ...data, path: request.url };
        }

        // ✅ Null/undefined = 204 No Content
        if (data === null || data === undefined) {
          response.status(204);
          return {
            success: true,
            statusCode: 204,
            message: 'No Content',
            timestamp: new Date().toISOString(),
            // path: request.url,
          };
        }

        // ✅ Pagination auto-detection
        const isPaginated =
          data &&
          typeof data === 'object' &&
          ('items' in data || 'data' in data) &&
          'total' in data &&
          'page' in data;

        if (isPaginated) {
          return {
            success: true,
            statusCode: response.statusCode,
            message: data.message || 'Success',
            data: data.data || data.items,
            meta: {
              page: data.page,
              limit: data.limit,
              total: data.total,
              totalPages: data.totalPages || Math.ceil(data.total / data.limit),
            },
            timestamp: new Date().toISOString(),
            // path: request.url,
          };
        }

        // ✅ Standard response
        const statusCode = response.statusCode;
        const message =
          data?.message ||
          (statusCode === 201 ? 'Created successfully' : 'Success');
        const actualData = data?.data !== undefined ? data.data : data;

        return {
          success: true,
          statusCode,
          message,
          data: actualData,
          timestamp: new Date().toISOString(),
          //   path: request.url,
        };
      }),
    );
  }
}
