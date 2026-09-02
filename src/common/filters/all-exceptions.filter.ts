import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (res.headersSent) {
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      res.status(status).json(
        typeof payload === 'string'
          ? { statusCode: status, message: payload }
          : payload,
      );
      return;
    }

    const err = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(err.stack || err.message);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: err.message || 'Internal server error',
    });
  }
}
