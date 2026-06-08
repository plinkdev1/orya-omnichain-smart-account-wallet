/**
 * Common types used across all domains
 */

export type UUID = string & { readonly __uuid: unique symbol };
export type Address = string & { readonly __address: unique symbol };
export type Hash = string & { readonly __hash: unique symbol };

// Result types for error handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface PageInfo {
  currentPage: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface APIResponse<T> {
  data: T;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PageInfo;
}

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  WALLET_ERROR = 'WALLET_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
}