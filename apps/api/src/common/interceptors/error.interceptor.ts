import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { ApiResponse } from './response.interceptor';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorInterceptor.name);

  private requestIdFrom(request: any): string {
    const header = request?.headers?.['x-request-id'];
    if (typeof header === 'string' && /^[A-Za-z0-9-]{1,128}$/.test(header.trim())) {
      return header.trim();
    }
    return randomUUID();
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      catchError((error) => {
        const requestId = this.requestIdFrom(request);
        let status = 500;
        let message = 'Internal server error';
        let code = 'INTERNAL_SERVER_ERROR';
        let errorDetails: any = null;

        // Handle NestJS HttpExceptions: their messages are intentional client-facing text.
        if (error instanceof HttpException) {
          status = error.getStatus();
          const errorResponse = error.getResponse();
          code = `HTTP_${status}`;

          if (typeof errorResponse === 'object') {
            const err = errorResponse as any;
            message = err.message || error.message;
            if (typeof err.code === 'string' && err.code) {
              code = err.code;
            }
            errorDetails = err;
          } else {
            message = errorResponse as string;
          }
        }
        // Anything else (plain Error, driver errors, ...) is never echoed back to the client.

        // Log full details server-side only, correlated by requestId
        this.logger.error(
          `[${requestId}] [${request.method}] ${request.url} - Status: ${status} - Code: ${code}`,
          error instanceof Error ? error.stack : String(error),
        );

        // Format error response
        const apiResponse: ApiResponse & { code: string; requestId: string } = {
          success: false,
          message,
          code,
          requestId,
          error: errorDetails,
          timestamp: new Date().toISOString(),
          path: request.url,
          statusCode: status,
        };

        // Set response status and send the error response
        response.status(status).json(apiResponse);

        // Return empty observable since we already sent the response
        return new Observable((subscriber) => {
          subscriber.complete();
        });
      })
    );
  }
}
