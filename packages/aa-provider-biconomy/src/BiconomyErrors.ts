/**
 * Biconomy Custom Error Classes
 * Error handling for Biconomy integration
 */

export class BiconomyError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'BICONOMY_ERROR',
    statusCode?: number,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'BiconomyError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    Object.setPrototypeOf(this, BiconomyError.prototype);
  }
}

export class BiconomyNotInitializedError extends BiconomyError {
  constructor(message: string = 'Biconomy provider not initialized') {
    super(message, 'BICONOMY_NOT_INITIALIZED');
    this.name = 'BiconomyNotInitializedError';
    Object.setPrototypeOf(this, BiconomyNotInitializedError.prototype);
  }
}

export class BiconomyInvalidConfigError extends BiconomyError {
  constructor(message: string = 'Invalid Biconomy configuration') {
    super(message, 'BICONOMY_INVALID_CONFIG');
    this.name = 'BiconomyInvalidConfigError';
    Object.setPrototypeOf(this, BiconomyInvalidConfigError.prototype);
  }
}

export class BiconomyAPIError extends BiconomyError {
  constructor(
    message: string,
    statusCode?: number,
    details?: Record<string, any>
  ) {
    super(message, 'BICONOMY_API_ERROR', statusCode, details);
    this.name = 'BiconomyAPIError';
    Object.setPrototypeOf(this, BiconomyAPIError.prototype);
  }
}

export class BiconomyTransactionError extends BiconomyError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, 'BICONOMY_TRANSACTION_ERROR', undefined, details);
    this.name = 'BiconomyTransactionError';
    Object.setPrototypeOf(this, BiconomyTransactionError.prototype);
  }
}

export class BiconomySmartAccountError extends BiconomyError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, 'BICONOMY_SMART_ACCOUNT_ERROR', undefined, details);
    this.name = 'BiconomySmartAccountError';
    Object.setPrototypeOf(this, BiconomySmartAccountError.prototype);
  }
}

export class BiconomyPaymasterError extends BiconomyError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, 'BICONOMY_PAYMASTER_ERROR', undefined, details);
    this.name = 'BiconomyPaymasterError';
    Object.setPrototypeOf(this, BiconomyPaymasterError.prototype);
  }
}

export class BiconomyGasEstimationError extends BiconomyError {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, 'BICONOMY_GAS_ESTIMATION_ERROR', undefined, details);
    this.name = 'BiconomyGasEstimationError';
    Object.setPrototypeOf(this, BiconomyGasEstimationError.prototype);
  }
}
