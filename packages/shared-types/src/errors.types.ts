/**
 * Error types and custom error classes
 */

import { ErrorCode } from './common.types';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly timestamp: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.context = context;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

export class WalletError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.WALLET_ERROR,
    context?: Record<string, any>
  ) {
    super(message, code, 400, context);
    this.name = 'WalletError';
    Object.setPrototypeOf(this, WalletError.prototype);
  }
}

export class TransactionError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.TRANSACTION_ERROR,
    context?: Record<string, any>
  ) {
    super(message, code, 400, context);
    this.name = 'TransactionError';
    Object.setPrototypeOf(this, TransactionError.prototype);
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.NETWORK_ERROR,
    context?: Record<string, any>
  ) {
    super(message, code, 503, context);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.UNAUTHORIZED, 401, context);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, context);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.NOT_FOUND, 404, context);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter: number = 60,
    context?: Record<string, any>
  ) {
    super(message, ErrorCode.RATE_LIMIT, 429, context);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function createErrorFromCode(
  code: ErrorCode,
  message: string,
  context?: Record<string, any>
): AppError {
  switch (code) {
    case ErrorCode.WALLET_ERROR:
      return new WalletError(message, code, context);
    case ErrorCode.TRANSACTION_ERROR:
      return new TransactionError(message, code, context);
    case ErrorCode.NETWORK_ERROR:
      return new NetworkError(message, code, context);
    case ErrorCode.UNAUTHORIZED:
      return new AuthenticationError(message, context);
    case ErrorCode.VALIDATION_ERROR:
      return new ValidationError(message, context);
    case ErrorCode.NOT_FOUND:
      return new NotFoundError(message, context);
    case ErrorCode.RATE_LIMIT:
      return new RateLimitError(message, 60, context);
    default:
      return new AppError(message, code, 500, context);
  }
}