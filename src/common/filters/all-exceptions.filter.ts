// File: src/common/filters/all-exceptions.filter.ts
// ============================================================================

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  stack?: string;
  details?: any; // ✅ Added for extra info
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isDevelopment = process.env.NODE_ENV === 'development';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any; // ✅ Added

    // ✅ HTTP Exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || error;
        details = (exceptionResponse as any).details; // ✅ Added
      } else {
        message = exceptionResponse;
      }
    }
    // ✅ Database & Other Errors
    else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;

      // MongoDB duplicate key
      if ((exception as any).code === 11000) {
        status = HttpStatus.CONFLICT;
        message = 'Duplicate entry found';
        error = 'Duplicate Key Error';
        // ✅ Extract duplicate key details
        details = this.extractDuplicateKeyDetails(exception);
      }

      // PostgreSQL duplicate key
      if ((exception as any).code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'Duplicate entry';
        error = 'Unique Constraint Violation';
      }

      // MongoDB validation error
      if (exception.name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        error = 'Validation Error';
      }

      // JWT errors
      if (exception.name === 'JsonWebTokenError') {
        status = HttpStatus.UNAUTHORIZED;
        error = 'Invalid Token';
        message = 'Invalid authentication token';
      }

      if (exception.name === 'TokenExpiredError') {
        status = HttpStatus.UNAUTHORIZED;
        error = 'Token Expired';
        message = 'Authentication token has expired';
      }

      // Timeout errors
      if (exception.name === 'RequestTimeoutException') {
        status = HttpStatus.REQUEST_TIMEOUT;
        error = 'Request Timeout';
        message = 'Request took too long to process';
      }
    }

    // Build error response
    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: (request as any).id,
    };

    // ✅ Add details if available
    if (details) {
      errorResponse.details = details;
    }

    // ✅ Add stack trace only in development
    if (this.isDevelopment && exception instanceof Error) {
      errorResponse.stack = this.formatStackTrace(exception.stack);
    }

    // ✅ Log error
    this.logError(request, errorResponse, exception);

    // ✅ Send response
    response.status(status).json(errorResponse);
  }

  /**
   * ✅ NEW: Extract duplicate key details
   */
  private extractDuplicateKeyDetails(exception: any): any {
    try {
      const keyValue = exception.keyValue;
      if (keyValue) {
        return {
          duplicateField: Object.keys(keyValue)[0],
          duplicateValue: Object.values(keyValue)[0],
        };
      }
    } catch {
      return undefined;
    }
  }

  /**
   * ✅ Format stack trace - Remove node_modules noise
   */
  private formatStackTrace(stack?: string): string {
    if (!stack) return '';

    const lines = stack.split('\n').filter((line) => {
      // Keep only app code and NestJS core traces
      return (
        !line.includes('node_modules') ||
        line.includes('node_modules/@nestjs')
      );
    });

    return lines.slice(0, 10).join('\n'); // Limit to 10 lines
  }

  /**
   * ✅ Enhanced Error Logging
   */
  private logError(
    request: Request,
    errorResponse: ErrorResponse,
    exception: unknown,
  ) {
    if (this.isDevelopment) {
      // ✅ DEVELOPMENT MODE - Detailed logs
      this.logDevelopmentError(request, errorResponse, exception);
    } else {
      // ✅ PRODUCTION MODE - Concise logs
      this.logProductionError(request, errorResponse);
    }
  }

  /**
   * ✅ Development Mode Logging - Detailed with colors
   */
  private logDevelopmentError(
    request: Request,
    errorResponse: ErrorResponse,
    exception: unknown,
  ) {
    const colors = {
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      reset: '\x1b[0m',
      bold: '\x1b[1m',
      dim: '\x1b[2m',
    };

    const logLines: string[] = [];

    logLines.push('');
    logLines.push(
      `${colors.bold}${colors.red}╔════════════════════════════════════════════════════════════╗${colors.reset}`,
    );
    logLines.push(
      `${colors.bold}${colors.red}║                     ERROR OCCURRED                         ║${colors.reset}`,
    );
    logLines.push(
      `${colors.bold}${colors.red}╚════════════════════════════════════════════════════════════╝${colors.reset}`,
    );
    logLines.push('');

    // Request Info
    logLines.push(`${colors.bold}${colors.cyan}📍 Request:${colors.reset}`);
    logLines.push(
      `   ${colors.blue}Method:${colors.reset}      ${errorResponse.method}`,
    );
    logLines.push(
      `   ${colors.blue}Path:${colors.reset}        ${errorResponse.path}`,
    );
    logLines.push(
      `   ${colors.blue}Request ID:${colors.reset}  ${errorResponse.requestId || 'N/A'}`,
    );
    logLines.push(`   ${colors.blue}IP:${colors.reset}          ${request.ip}`);
    logLines.push('');

    // Error Info
    logLines.push(`${colors.bold}${colors.red}❌ Error:${colors.reset}`);
    logLines.push(
      `   ${colors.blue}Status:${colors.reset}      ${errorResponse.statusCode}`,
    );
    logLines.push(
      `   ${colors.blue}Type:${colors.reset}        ${errorResponse.error}`,
    );
    logLines.push(
      `   ${colors.blue}Message:${colors.reset}     ${errorResponse.message}`,
    );

    // ✅ Show details if available
    if (errorResponse.details) {
      logLines.push(
        `   ${colors.blue}Details:${colors.reset}     ${JSON.stringify(errorResponse.details)}`,
      );
    }
    logLines.push('');

    // User Info
    if ((request as any).user) {
      logLines.push(`${colors.bold}${colors.cyan}👤 User:${colors.reset}`);
      logLines.push(
        `   ${colors.blue}ID:${colors.reset}          ${(request as any).user.id}`,
      );
      logLines.push(
        `   ${colors.blue}Email:${colors.reset}       ${(request as any).user.email || 'N/A'}`,
      );
      logLines.push('');
    }

    // Stack Trace
    if (exception instanceof Error && exception.stack) {
      logLines.push(
        `${colors.bold}${colors.yellow}📚 Stack Trace:${colors.reset}`,
      );
      const cleanStack = this.formatStackTrace(exception.stack);
      const stackLines = cleanStack.split('\n');

      stackLines.forEach((line) => {
        if (line.includes('node_modules/@nestjs')) {
          logLines.push(`   ${colors.dim}${line}${colors.reset}`);
        } else {
          logLines.push(`   ${colors.yellow}${line}${colors.reset}`);
        }
      });
      logLines.push('');
    }

    // Hint
    const hint = this.getErrorHint(errorResponse);
    if (hint) {
      logLines.push(`${colors.bold}${colors.cyan}💡 Hint:${colors.reset}`);
      logLines.push(`   ${colors.cyan}${hint}${colors.reset}`);
      logLines.push('');
    }

    logLines.push(
      `${colors.dim}───────────────────────────────────────────────────────────${colors.reset}`,
    );
    logLines.push('');

    const fullMessage = logLines.join('\n');

    // Log based on severity
    if (errorResponse.statusCode >= 500) {
      this.logger.error(fullMessage);
    } else if (errorResponse.statusCode >= 400) {
      this.logger.warn(fullMessage);
    } else {
      this.logger.log(fullMessage);
    }
  }

  /**
   * ✅ Production Mode Logging - Concise, JSON format
   */
  private logProductionError(
    request: Request,
    errorResponse: ErrorResponse,
  ) {
    const logData = {
      level: errorResponse.statusCode >= 500 ? 'ERROR' : 'WARN',
      timestamp: errorResponse.timestamp,
      requestId: errorResponse.requestId,
      method: errorResponse.method,
      path: errorResponse.path,
      statusCode: errorResponse.statusCode,
      error: errorResponse.error,
      message: errorResponse.message,
      details: errorResponse.details, // ✅ Added
      ip: request.ip,
      userAgent: request.get('user-agent'),
      userId: (request as any).user?.id,
    };

    // JSON log for production (easier to parse by log aggregators)
    if (errorResponse.statusCode >= 500) {
      this.logger.error(JSON.stringify(logData));
    } else {
      this.logger.warn(JSON.stringify(logData));
    }
  }

  /**
   * ✅ Provide helpful hints for common errors (Development only)
   */
  private getErrorHint(errorResponse: ErrorResponse): string | null {
    const { statusCode, error, message } = errorResponse;

    if (statusCode === 404) {
      return 'Check if the route exists in your controller. Verify the URL spelling.';
    }

    if (statusCode === 401) {
      return 'Verify JWT token is valid and not expired. Check JwtAuthGuard.';
    }

    if (statusCode === 403) {
      return 'User lacks required permissions. Check RolesGuard or permissions.';
    }

    if (statusCode === 400 && typeof message === 'object') {
      return 'Request validation failed. Check DTO class and validation decorators.';
    }

    if (error === 'Duplicate Key Error') {
      return 'Unique constraint violated. Check if record already exists in database.';
    }

    if (
      message.toString().toLowerCase().includes('connect') ||
      message.toString().toLowerCase().includes('timeout')
    ) {
      return 'Connection issue detected. Verify MongoDB/Redis is running.';
    }

    if (statusCode === 408) {
      return 'Request timeout. Operation took longer than 30 seconds.';
    }

    return null;
  }
}