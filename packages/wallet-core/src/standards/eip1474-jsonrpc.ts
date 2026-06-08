/**
 * EIP-1474: Remote procedure call specification
 * https://eips.ethereum.org/EIPS/eip-1474
 *
 * Specifies the JSON-RPC 2.0 specification for Ethereum nodes
 * Defines standard methods and parameter validation
 */

export interface JSONRPC2Request {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
  id: string | number | null;
}

export interface JSONRPC2Response<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  error?: JSONRPC2Error;
  id: string | number | null;
}

export interface JSONRPC2Error {
  code: number;
  message: string;
  data?: unknown;
}

export interface JSONRPC2BatchRequest extends Array<JSONRPC2Request> {}

export interface JSONRPC2BatchResponse extends Array<JSONRPC2Response> {}

export const JSON_RPC_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR_START: -32099,
  SERVER_ERROR_END: -32000,
} as const;

export const JSON_RPC_ERROR_MESSAGES: Record<number, string> = {
  [-32700]: 'Parse error - Invalid JSON was received',
  [-32600]: 'Invalid Request - The JSON sent is not a valid Request object',
  [-32601]: 'Method not found - The method does not exist / is not available',
  [-32602]: 'Invalid params - Invalid method parameter(s)',
  [-32603]: 'Internal error - Internal JSON-RPC error',
  [0]: 'Server error - Reserved for implementation-defined server errors',
};

export const ETHEREUM_JSON_RPC_METHODS = {
  web3: {
    clientVersion: 'web3_clientVersion',
    sha3: 'web3_sha3',
  },
  net: {
    version: 'net_version',
    listening: 'net_listening',
    peerCount: 'net_peerCount',
  },
  eth: {
    protocolVersion: 'eth_protocolVersion',
    syncing: 'eth_syncing',
    coinbase: 'eth_coinbase',
    mining: 'eth_mining',
    hashrate: 'eth_hashrate',
    gasPrice: 'eth_gasPrice',
    accounts: 'eth_accounts',
    blockNumber: 'eth_blockNumber',
    getBalance: 'eth_getBalance',
    getStorageAt: 'eth_getStorageAt',
    getTransactionCount: 'eth_getTransactionCount',
    getBlockTransactionCountByHash: 'eth_getBlockTransactionCountByHash',
    getBlockTransactionCountByNumber: 'eth_getBlockTransactionCountByNumber',
    getUncleCountByBlockHash: 'eth_getUncleCountByBlockHash',
    getUncleCountByBlockNumber: 'eth_getUncleCountByBlockNumber',
    getCode: 'eth_getCode',
    sign: 'eth_sign',
    signTransaction: 'eth_signTransaction',
    sendTransaction: 'eth_sendTransaction',
    sendRawTransaction: 'eth_sendRawTransaction',
    call: 'eth_call',
    estimateGas: 'eth_estimateGas',
    getBlockByHash: 'eth_getBlockByHash',
    getBlockByNumber: 'eth_getBlockByNumber',
    getTransactionByHash: 'eth_getTransactionByHash',
    getTransactionByBlockHashAndIndex: 'eth_getTransactionByBlockHashAndIndex',
    getTransactionByBlockNumberAndIndex: 'eth_getTransactionByBlockNumberAndIndex',
    getTransactionReceipt: 'eth_getTransactionReceipt',
    getUncleByBlockHashAndIndex: 'eth_getUncleByBlockHashAndIndex',
    getUncleByBlockNumberAndIndex: 'eth_getUncleByBlockNumberAndIndex',
    getCompilers: 'eth_getCompilers',
    compileSolidity: 'eth_compileSolidity',
    compileLLL: 'eth_compileLLL',
    compileSerpent: 'eth_compileSerpent',
    newFilter: 'eth_newFilter',
    newBlockFilter: 'eth_newBlockFilter',
    newPendingTransactionFilter: 'eth_newPendingTransactionFilter',
    uninstallFilter: 'eth_uninstallFilter',
    getFilterChanges: 'eth_getFilterChanges',
    getFilterLogs: 'eth_getFilterLogs',
    getLogs: 'eth_getLogs',
  },
  db: {
    putString: 'db_putString',
    getString: 'db_getString',
    putHex: 'db_putHex',
    getHex: 'db_getHex',
  },
  shh: {
    post: 'shh_post',
    newIdentity: 'shh_newIdentity',
    hasIdentity: 'shh_hasIdentity',
    newGroup: 'shh_newGroup',
    addToGroup: 'shh_addToGroup',
    newFilter: 'shh_newFilter',
    uninstallFilter: 'shh_uninstallFilter',
    getFilterChanges: 'shh_getFilterChanges',
    getMessages: 'shh_getMessages',
  },
} as const;

export interface JSONRPCMethodSpec {
  name: string;
  params: number | 'variable';
  description?: string;
}

export const JSON_RPC_METHODS_SPEC: Record<string, JSONRPCMethodSpec> = {
  web3_clientVersion: { name: 'web3_clientVersion', params: 0 },
  web3_sha3: { name: 'web3_sha3', params: 1 },
  net_version: { name: 'net_version', params: 0 },
  net_listening: { name: 'net_listening', params: 0 },
  net_peerCount: { name: 'net_peerCount', params: 0 },
  eth_protocolVersion: { name: 'eth_protocolVersion', params: 0 },
  eth_syncing: { name: 'eth_syncing', params: 0 },
  eth_coinbase: { name: 'eth_coinbase', params: 0 },
  eth_mining: { name: 'mining', params: 0 },
  eth_hashrate: { name: 'eth_hashrate', params: 0 },
  eth_gasPrice: { name: 'eth_gasPrice', params: 0 },
  eth_accounts: { name: 'eth_accounts', params: 0 },
  eth_blockNumber: { name: 'eth_blockNumber', params: 0 },
  eth_getBalance: { name: 'eth_getBalance', params: 2 },
  eth_getStorageAt: { name: 'eth_getStorageAt', params: 3 },
  eth_getTransactionCount: { name: 'eth_getTransactionCount', params: 2 },
  eth_getBlockTransactionCountByHash: {
    name: 'eth_getBlockTransactionCountByHash',
    params: 1,
  },
  eth_getBlockTransactionCountByNumber: {
    name: 'eth_getBlockTransactionCountByNumber',
    params: 1,
  },
  eth_getUncleCountByBlockHash: { name: 'eth_getUncleCountByBlockHash', params: 1 },
  eth_getUncleCountByBlockNumber: { name: 'eth_getUncleCountByBlockNumber', params: 1 },
  eth_getCode: { name: 'eth_getCode', params: 2 },
  eth_sign: { name: 'eth_sign', params: 2 },
  eth_sendTransaction: { name: 'eth_sendTransaction', params: 1 },
  eth_sendRawTransaction: { name: 'eth_sendRawTransaction', params: 1 },
  eth_call: { name: 'eth_call', params: 2 },
  eth_estimateGas: { name: 'eth_estimateGas', params: 2 },
  eth_getBlockByHash: { name: 'eth_getBlockByHash', params: 2 },
  eth_getBlockByNumber: { name: 'eth_getBlockByNumber', params: 2 },
  eth_getTransactionByHash: { name: 'eth_getTransactionByHash', params: 1 },
  eth_getTransactionByBlockHashAndIndex: {
    name: 'eth_getTransactionByBlockHashAndIndex',
    params: 2,
  },
  eth_getTransactionByBlockNumberAndIndex: {
    name: 'eth_getTransactionByBlockNumberAndIndex',
    params: 2,
  },
  eth_getTransactionReceipt: { name: 'eth_getTransactionReceipt', params: 1 },
  eth_getUncleByBlockHashAndIndex: { name: 'eth_getUncleByBlockHashAndIndex', params: 2 },
  eth_getUncleByBlockNumberAndIndex: { name: 'eth_getUncleByBlockNumberAndIndex', params: 2 },
  eth_newFilter: { name: 'eth_newFilter', params: 1 },
  eth_newBlockFilter: { name: 'eth_newBlockFilter', params: 0 },
  eth_newPendingTransactionFilter: { name: 'eth_newPendingTransactionFilter', params: 0 },
  eth_uninstallFilter: { name: 'eth_uninstallFilter', params: 1 },
  eth_getFilterChanges: { name: 'eth_getFilterChanges', params: 1 },
  eth_getFilterLogs: { name: 'eth_getFilterLogs', params: 1 },
  eth_getLogs: { name: 'eth_getLogs', params: 1 },
  eth_chainId: { name: 'eth_chainId', params: 0 },
  eth_signTypedData_v4: { name: 'eth_signTypedData_v4', params: 2 },
  personal_sign: { name: 'personal_sign', params: 2 },
  eth_requestAccounts: { name: 'eth_requestAccounts', params: 0 },
  wallet_switchEthereumChain: { name: 'wallet_switchEthereumChain', params: 1 },
  wallet_addEthereumChain: { name: 'wallet_addEthereumChain', params: 1 },
  wallet_watchAsset: { name: 'wallet_watchAsset', params: 1 },
};

export class JSONRPC2RequestBuilder {
  static create(
    method: string,
    params?: unknown,
    id: string | number | null = null
  ): JSONRPC2Request {
    return {
      jsonrpc: '2.0',
      method,
      params,
      id,
    };
  }

  static batch(requests: JSONRPC2Request[]): JSONRPC2BatchRequest {
    if (requests.length === 0) {
      throw new Error('Batch request cannot be empty');
    }
    return requests;
  }
}

export class JSONRPC2Validator {
  static validateRequest(request: unknown): request is JSONRPC2Request {
    if (typeof request !== 'object' || request === null) {
      return false;
    }

    const req = request as Record<string, unknown>;
    return (
      req.jsonrpc === '2.0' &&
      typeof req.method === 'string' &&
      req.method.length > 0 &&
      (typeof req.id === 'string' || typeof req.id === 'number' || req.id === null)
    );
  }

  static validateResponse(response: unknown): response is JSONRPC2Response {
    if (typeof response !== 'object' || response === null) {
      return false;
    }

    const res = response as Record<string, unknown>;
    return (
      res.jsonrpc === '2.0' &&
      (typeof res.id === 'string' || typeof res.id === 'number' || res.id === null)
    );
  }

  static validateError(error: unknown): error is JSONRPC2Error {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const err = error as Record<string, unknown>;
    return typeof err.code === 'number' && typeof err.message === 'string';
  }
}

export class JSONRPC2ResponseBuilder {
  static success<T>(result: T, id: string | number | null): JSONRPC2Response<T> {
    return {
      jsonrpc: '2.0',
      result,
      id,
    };
  }

  static error(code: number, message: string, id: string | number | null, data?: unknown): JSONRPC2Response {
    return {
      jsonrpc: '2.0',
      error: {
        code,
        message,
        data,
      },
      id,
    };
  }
}
