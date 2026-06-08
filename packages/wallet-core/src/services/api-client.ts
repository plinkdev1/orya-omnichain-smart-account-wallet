/**
 * API Client Service - GraphQL/REST Client Abstraction
 * Pure business logic layer for API communication
 */

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

/**
 * Abstract API Client for GraphQL/REST requests
 */
export abstract class ApiClient {
  protected config: ApiClientConfig;
  protected headers: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.headers = {
      'Content-Type': 'application/json',
      ...(config.headers || {}),
    };
  }

  abstract get<T>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>>;

  abstract post<T>(
    endpoint: string,
    data: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>>;

  abstract put<T>(
    endpoint: string,
    data: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>>;

  abstract delete<T>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>>;

  abstract mutation<T>(
    query: string,
    variables?: Record<string, any>,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>>;

  abstract query<T>(
    query: string,
    variables?: Record<string, any>,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>>;

  setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  removeHeader(key: string): void {
    delete this.headers[key];
  }

  getHeaders(): Record<string, string> {
    return { ...this.headers };
  }
}

/**
 * REST API Client Implementation
 */
export class RestApiClient extends ApiClient {
  async get<T>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.headers,
        signal: this.createAbortSignal(options?.timeout),
      });

      return {
        data: (await response.json()) as T,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  async post<T>(
    endpoint: string,
    data: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { ...this.headers, ...options?.headers },
        body: JSON.stringify(data),
        signal: this.createAbortSignal(options?.timeout),
      });

      return {
        data: (await response.json()) as T,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  async put<T>(
    endpoint: string,
    data: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: { ...this.headers, ...options?.headers },
        body: JSON.stringify(data),
        signal: this.createAbortSignal(options?.timeout),
      });

      return {
        data: (await response.json()) as T,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  async delete<T>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: { ...this.headers, ...options?.headers },
        signal: this.createAbortSignal(options?.timeout),
      });

      return {
        data: (await response.json()) as T,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500,
      };
    }
  }

  async mutation<T>(
    query: string,
    variables?: Record<string, any>,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.post<T>('/graphql', { query, variables }, options);
  }

  async query<T>(
    query: string,
    variables?: Record<string, any>,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.post<T>('/graphql', { query, variables }, options);
  }

  private createAbortSignal(timeoutMs?: number): AbortSignal | undefined {
    const timeout = timeoutMs || this.config.timeout || 30000;
    return AbortSignal.timeout(timeout);
  }
}

/**
 * API Client factory
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new RestApiClient(config);
}