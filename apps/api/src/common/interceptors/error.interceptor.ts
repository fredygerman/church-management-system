import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiResponse } from './response.interceptor';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      catchError((error) => {
        let status = 500;
        let message = 'Internal server error';
        let errorDetails: any = null;

        // Handle NestJS HttpExceptions
        if (error instanceof HttpException) {
          status = error.getStatus();
          const errorResponse = error.getResponse();

          if (typeof errorResponse === 'object') {
            const err = errorResponse as any;
            message = err.message || error.message;
            errorDetails = err;
          } else {
            message = errorResponse as string;
          }
        } else if (error instanceof Error) {
          message = error.message;
          errorDetails = {
            name: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          };
        }

        // Log error
        this.logger.error(
          `[${request.method}] ${request.url} - Status: ${status} - Message: ${message}`,
          error instanceof Error ? error.stack : error
        );

        // Format error response
        const apiResponse: ApiResponse = {
          success: false,
          message,
          error: errorDetails,
          timestamp: new Date().toISOString(),
          path: request.url,
          statusCode: status,
        };

        // Set response status
        response.status(status);

        return throwError(() => apiResponse);
      })
    );
  }
}
