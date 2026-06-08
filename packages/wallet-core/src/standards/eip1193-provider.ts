/**
 * EIP-1193: Ethereum Provider API
 * https://eips.ethereum.org/EIPS/eip-1193
 *
 * Specifies a JavaScript provider API for interacting with Ethereum nodes
 * Defines the JSON-RPC request/response interface and event system
 */

export interface EIP1193RequestArguments {
  method: string;
  params?: unknown[];
}

export interface EIP1193RpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface EIP1193EventMap {
  connect: { chainId: string };
  disconnect: { code: number; reason: string };
  chainChanged: string;
  accountsChanged: string[];
  message: { type: string; data: unknown };
}

export type EIP1193EventName = keyof EIP1193EventMap;

export interface EIP1193Provider {
  request(args: EIP1193RequestArguments): Promise<unknown>;
  on<K extends EIP1193EventName>(event: K, listener: (data: EIP1193EventMap[K]) => void): void;
  removeListener<K extends EIP1193EventName>(
    event: K,
    listener: (data: EIP1193EventMap[K]) => void
  ): void;
  off<K extends EIP1193EventName>(event: K, listener: (data: EIP1193EventMap[K]) => void): void;
}

export const EIP1193_STANDARD_METHODS = {
  eth_chainId: 'eth_chainId',
  eth_accounts: 'eth_accounts',
  eth_requestAccounts: 'eth_requestAccounts',
  eth_sign: 'eth_sign',
  personal_sign: 'personal_sign',
  eth_signTypedData_v3: 'eth_signTypedData_v3',
  eth_signTypedData_v4: 'eth_signTypedData_v4',
  eth_sendTransaction: 'eth_sendTransaction',
  eth_signTransaction: 'eth_signTransaction',
  eth_call: 'eth_call',
  eth_estimateGas: 'eth_estimateGas',
  eth_getBalance: 'eth_getBalance',
  eth_getCode: 'eth_getCode',
  eth_getStorageAt: 'eth_getStorageAt',
  eth_getTransactionCount: 'eth_getTransactionCount',
  eth_getTransactionByHash: 'eth_getTransactionByHash',
  eth_getBlockByNumber: 'eth_getBlockByNumber',
  eth_getBlockByHash: 'eth_getBlockByHash',
  eth_newFilter: 'eth_newFilter',
  eth_getFilterChanges: 'eth_getFilterChanges',
  eth_uninstallFilter: 'eth_uninstallFilter',
  wallet_switchEthereumChain: 'wallet_switchEthereumChain',
  wallet_addEthereumChain: 'wallet_addEthereumChain',
  wallet_watchAsset: 'wallet_watchAsset',
} as const;

export type EIP1193Method = typeof EIP1193_STANDARD_METHODS[keyof typeof EIP1193_STANDARD_METHODS];

export interface EIP1193BaseProvider {
  request(args: EIP1193RequestArguments): Promise<unknown>;
}

export class EIP1193EventEmitter {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    this.listeners.get(event)?.delete(listener);
  }

  removeListener(event: string, listener: Function): void {
    this.off(event, listener);
  }

  emit(event: string, data: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          (listener as Function)(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

export class EIP1193ProviderBase extends EIP1193EventEmitter implements EIP1193Provider {
  protected rpcUrl: string;
  protected chainId: string;

  constructor(rpcUrl: string, chainId: number | string) {
    super();
    this.rpcUrl = rpcUrl;
    this.chainId = typeof chainId === 'number' ? `0x${chainId.toString(16)}` : chainId;
  }

  async request(args: EIP1193RequestArguments): Promise<unknown> {
    if (!args.method) {
      throw new Error('Missing method in request');
    }

    switch (args.method) {
      case 'eth_chainId':
        return this.chainId;
      case 'eth_accounts':
        return this.getAccounts();
      case 'eth_requestAccounts':
        return this.requestAccounts();
      default:
        return this.callRPC(args.method, args.params || []);
    }
  }

  protected async getAccounts(): Promise<string[]> {
    return [];
  }

  protected async requestAccounts(): Promise<string[]> {
    return [];
  }

  protected async callRPC(method: string, params: unknown[]): Promise<unknown> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: this.generateId(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      result?: unknown;
      error?: { code: number; message: string; data?: unknown };
    };

    if (data.error) {
      const error = new Error(data.error.message) as Error & { code?: number };
      error.code = data.error.code;
      throw error;
    }

    return data.result;
  }

  protected generateId(): number {
    return Date.now();
  }

  setChainId(chainId: number | string): void {
    this.chainId = typeof chainId === 'number' ? `0x${chainId.toString(16)}` : chainId;
    this.emit('chainChanged', this.chainId);
  }

  getChainId(): string {
    return this.chainId;
  }
}

export const EIP1193_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR_START: -32099,
  SERVER_ERROR_END: -32000,
  USER_REJECTION: 4001,
  UNAUTHORIZED: 4100,
  UNSUPPORTED_METHOD: 4200,
  DISCONNECTED: 4900,
  CHAIN_DISCONNECTED: 4901,
} as const;

export class EIP1193ProviderError extends Error {
  code: number;
  data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'EIP1193ProviderError';
    this.code = code;
    this.data = data;
  }
}
