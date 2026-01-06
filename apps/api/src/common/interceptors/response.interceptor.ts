import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PaginationMeta {
  page?: number;
  per_page?: number;
  total_count?: number;
  total_pages?: number;
  has_previous_page?: boolean;
  has_next_page?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  meta?: PaginationMeta;
  timestamp: string;
  path: string;
  statusCode: number;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map(data => {
        // Check if the controller already returned a properly formatted response
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data &&
          'message' in data
        ) {
          // Already formatted, just add metadata if missing
          return {
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
            path: data.path || request.url,
            statusCode: data.statusCode || response.statusCode,
          };
        }

        // Check if response contains pagination metadata
        const hasMeta = data && typeof data === 'object' && 'meta' in data;
        const meta = hasMeta ? (data as any).meta : undefined;

        // Format new response
        return {
          success: true,
          message: 'Request successful',
          data: hasMeta && data?.data ? data.data : data,
          ...(meta && { meta }),
          timestamp: new Date().toISOString(),
          path: request.url,
          statusCode: response.statusCode,
        };
      })
    );
  }
}
