import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../domain-exceptions';

// https://docs.nestjs.com/exception-filters#exception-filters-1
// Handles custom DomainException errors.
@Catch(DomainException)
export class DomainHttpExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainHttpExceptionsFilter.name);

  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const statusCode = Number(exception.code);

    this.logger.warn(
      `${request.method} ${request.url} -> ${statusCode}; message="${exception.message}"; details=${exception.extensions.length}`,
    );

    if (statusCode === 400) {
      const responseBody = this.buildResponseBody(exception);
      response.status(statusCode).json(responseBody);
      return;
    }

    response.sendStatus(statusCode);
  }

  private buildResponseBody(exception: DomainException): ErrorResponse {
    return {
      errorsMessages: exception.extensions.map((item) => ({
        message: item.message,
        field: item.field,
      })),
    };
  }
}

export type ErrorMessage = {
  message: string;
  field: string;
};

export type ErrorResponse = {
  errorsMessages: ErrorMessage[];
};
