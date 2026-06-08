/**
 * EIP-6963: Multi-Injected Provider Discovery
 * https://eips.ethereum.org/EIPS/eip-6963
 *
 * Enables external dApps to discover and connect to ORYA wallet
 * Implements Ethereum JSON-RPC provider interface (EIP-1193)
 */

export const EIP6963_ANNOUNCEMENT_EVENT = 'eip6963:announceProvider';
export const EIP6963_REQUEST_EVENT = 'eip6963:requestProvider';

// ============================================================================
// TYPES
// ============================================================================

export interface EIP6963ProviderInfo {
  uuid: string; // Unique identifier (UUID v4)
  name: string; // Display name
  icon: string; // Icon URL or base64 data:image
  rdns: string; // Reverse DNS: "com.orya.wallet"
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP1193Provider {
  request(args: {
    method: string;
    params?: unknown[];
  }): Promise<unknown>;

  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

export interface EIP1193RequestArguments {
  method: string;
  params?: unknown[];
}

// ============================================================================
// EIP-6963 STANDARD ADAPTER
// ============================================================================

export class EIP6963StandardAdapter {
  private providerInfo: EIP6963ProviderInfo;
  private provider: EIP1193Provider;
  private isAnnounced = false;

  constructor(info: Omit<EIP6963ProviderInfo, 'uuid'>, provider: EIP1193Provider) {
    this.providerInfo = {
      uuid: this.generateUUID(),
      name: info.name,
      icon: info.icon,
      rdns: info.rdns,
    };
    this.provider = provider;
  }

  /**
   * Announce provider to the window (broadcast event)
   * Called on page load to make wallet discoverable
   */
  announce(): void {
    if (this.isAnnounced) {
      console.warn('Provider already announced');
      return;
    }

    const detail: EIP6963ProviderDetail = {
      info: this.providerInfo,
      provider: this.provider,
    };

    window.dispatchEvent(
      new CustomEvent(EIP6963_ANNOUNCEMENT_EVENT, {
        detail,
      })
    );

    this.isAnnounced = true;
    console.log(`[${this.providerInfo.name}] EIP-6963 provider announced`);
  }

  /**
   * Listen for dApp requests for provider
   */
  listenForRequests(callback?: (detail: EIP6963ProviderDetail) => void): void {
    window.addEventListener(EIP6963_REQUEST_EVENT, () => {
      this.announce();
      callback?.({
        info: this.providerInfo,
        provider: this.provider,
      });
    });
  }

  /**
   * Inject as window.ethereum (backwards compatibility)
   */
  injectAsWindowEthereum(): void {
    if ((window as any).ethereum) {
      console.warn('[EIP-6963] window.ethereum already exists');
      // Keep existing, but announce our provider too
      this.announce();
      return;
    }

    (window as any).ethereum = this.provider;
    this.announce();
    console.log('[EIP-6963] Injected as window.ethereum');
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  getProviderInfo(): EIP6963ProviderInfo {
    return this.providerInfo;
  }
}

// ============================================================================
// ETHEREUM JSON-RPC PROVIDER IMPLEMENTATION
// ============================================================================

export class EthereumJSONRPCProvider implements EIP1193Provider {
  private rpcUrl: string;
  private chainId: string;
  private accounts: string[] = [];
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(rpcUrl: string, chainId: number) {
    this.rpcUrl = rpcUrl;
    this.chainId = `0x${chainId.toString(16)}`;
  }

  async request(args: EIP1193RequestArguments): Promise<unknown> {
    const { method, params = [] } = args;

    switch (method) {
      case 'eth_chainId':
        return this.chainId;
      case 'eth_accounts':
        return this.accounts;
      case 'eth_requestAccounts':
        return this.requestAccounts();
      case 'eth_getBalance':
        return this.getBalance(params as string[]);
      case 'eth_sendTransaction':
        return this.sendTransaction(params as Array<{ to: string; value: string; data?: string }>);
      case 'personal_sign':
        return this.personalSign(params as [string, string]);
      case 'eth_signTypedData_v4':
        return this.signTypedDataV4(params as [string, string]);
      default:
        return this.callRPC(method, params);
    }
  }

  private async requestAccounts(): Promise<string[]> {
    if (this.accounts.length === 0) {
      throw new Error('No accounts available');
    }
    return this.accounts;
  }

  setAccounts(accounts: string[]): void {
    this.accounts = accounts;
  }

  private async getBalance(params: string[]): Promise<string> {
    const result = await this.callRPC('eth_getBalance', params);
    return String(result);
  }

  private async sendTransaction(params: Array<{ to: string; value: string; data?: string }>): Promise<string> {
    const result = await this.callRPC('eth_sendTransaction', params);
    return String(result);
  }

  private async personalSign(params: [string, string]): Promise<string> {
    const result = await this.callRPC('personal_sign', params);
    return String(result);
  }

  private async signTypedDataV4(params: [string, string]): Promise<string> {
    const result = await this.callRPC('eth_signTypedData_v4', params);
    return String(result);
  }

  private async callRPC(method: string, params: unknown[]): Promise<unknown> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      }),
    });

    const data = (await response.json()) as { result?: unknown; error?: { message: string } };

    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.result;
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  removeListener(event: string, listener: (...args: unknown[]) => void): void {
    this.listeners.get(event)?.delete(listener);
  }
}
