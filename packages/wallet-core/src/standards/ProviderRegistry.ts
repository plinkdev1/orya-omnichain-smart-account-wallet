/**
 * Provider Registry
 * Unified registry for all wallet standards implementations
 * Enables dApps to discover and use ORYA across multiple blockchains
 */

import { EIP6963StandardAdapter, EthereumJSONRPCProvider } from './eip6963';
import { SUIStandardAdapter } from './sui-standard';
import { AptosStandardAdapter } from './aptos-standard';
import { MovementStandardAdapter } from './movement-standard';
import { SolanaStandardAdapter } from './solana-standard';
import { CosmosStandardAdapter } from './cosmos-standard';

export type BlockchainStandard = 'eip6963' | 'sui' | 'solana' | 'aptos' | 'movement' | 'cosmos';

export interface ProviderInfo {
  name: string;
  icon: string;
  standard: BlockchainStandard;
  chainId?: string;
}

export interface RegisteredProvider {
  info: ProviderInfo;
  instance: any;
}

export class ProviderRegistry {
  private providers: Map<BlockchainStandard, RegisteredProvider[]> = new Map();
  private eip6963Adapter: EIP6963StandardAdapter | null = null;
  private suiAdapter: SUIStandardAdapter | null = null;
  private solanaAdapter: SolanaStandardAdapter | null = null;
  private aptosAdapter: AptosStandardAdapter | null = null;
  private movementAdapter: MovementStandardAdapter | null = null;
  private cosmosAdapter: CosmosStandardAdapter | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.providers.set('eip6963', []);
    this.providers.set('sui', []);
    this.providers.set('solana', []);
    this.providers.set('aptos', []);
    this.providers.set('movement', []);
    this.providers.set('cosmos', []);
  }

  registerEIP6963Provider(rpcUrl: string, chainId: number): EIP6963StandardAdapter {
    if (!this.eip6963Adapter) {
      const provider = new EthereumJSONRPCProvider(rpcUrl, chainId);
      this.eip6963Adapter = new EIP6963StandardAdapter(
        {
          name: 'ORYA',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSI2IiBmaWxsPSIjMDAwIi8+PC9zdmc+',
          rdns: 'com.orya.wallet',
        },
        provider
      );

      const registeredProvider: RegisteredProvider = {
        info: {
          name: 'ORYA',
          icon: this.eip6963Adapter.getProviderInfo().icon,
          standard: 'eip6963',
          chainId: `0x${chainId.toString(16)}`,
        },
        instance: this.eip6963Adapter,
      };

      this.providers.get('eip6963')!.push(registeredProvider);
    }

    return this.eip6963Adapter;
  }

  registerSUIProvider(accounts: string[], chain?: string): SUIStandardAdapter {
    if (!this.suiAdapter) {
      this.suiAdapter = new SUIStandardAdapter(accounts, chain || 'sui:mainnet');

      const registeredProvider: RegisteredProvider = {
        info: {
          name: 'ORYA',
          icon: this.suiAdapter.icon,
          standard: 'sui',
          chainId: chain,
        },
        instance: this.suiAdapter,
      };

      this.providers.get('sui')!.push(registeredProvider);
    }

    return this.suiAdapter;
  }

  registerSolanaProvider(accounts: any[], chain?: any): SolanaStandardAdapter {
    if (!this.solanaAdapter) {
      this.solanaAdapter = new SolanaStandardAdapter(
        accounts,
        chain || { chainId: 'mainnet-beta', name: 'Mainnet Beta' }
      );

      const registeredProvider: RegisteredProvider = {
        info: {
          name: 'ORYA',
          icon: this.solanaAdapter.icon,
          standard: 'solana',
          chainId: this.solanaAdapter.chain.chainId,
        },
        instance: this.solanaAdapter,
      };

      this.providers.get('solana')!.push(registeredProvider);
    }

    return this.solanaAdapter;
  }

  registerAptosProvider(accounts: any[], chain?: any): AptosStandardAdapter {
    if (!this.aptosAdapter) {
      this.aptosAdapter = new AptosStandardAdapter(
        accounts,
        chain || { chainId: '1', name: 'mainnet' }
      );

      const registeredProvider: RegisteredProvider = {
        info: {
          name: 'ORYA',
          icon: this.aptosAdapter.icon,
          standard: 'aptos',
          chainId: chain?.chainId || '1',
        },
        instance: this.aptosAdapter,
      };

      this.providers.get('aptos')!.push(registeredProvider);
    }

    return this.aptosAdapter;
  }

  registerMovementProvider(accounts: any[], chain?: any): MovementStandardAdapter {
    if (!this.movementAdapter) {
      this.movementAdapter = new MovementStandardAdapter(
        accounts,
        chain || { chainId: '1', name: 'mainnet' }
      );

      const registeredProvider: RegisteredProvider = {
        info: {
          name: 'ORYA',
          icon: this.movementAdapter.icon,
          standard: 'movement',
          chainId: chain?.chainId || '1',
        },
        instance: this.movementAdapter,
      };

      this.providers.get('movement')!.push(registeredProvider);
    }

    return this.movementAdapter;
  }

  registerCosmosProvider(accounts: any[], chain?: any): CosmosStandardAdapter {
    if (!this.cosmosAdapter) {
      this.cosmosAdapter = new CosmosStandardAdapter(
        accounts,
        chain || { chainId: 'cosmoshub-4', chainName: 'Cosmos Hub', prefix: 'cosmos' }
      );

      const registeredProvider: RegisteredProvider = {
        info: {
          name: 'ORYA',
          icon: this.cosmosAdapter.icon,
          standard: 'cosmos',
          chainId: this.cosmosAdapter.chain.chainId,
        },
        instance: this.cosmosAdapter,
      };

      this.providers.get('cosmos')!.push(registeredProvider);
    }

    return this.cosmosAdapter;
  }

  getProvider(standard: BlockchainStandard): RegisteredProvider | null {
    const providers = this.providers.get(standard);
    if (!providers || providers.length === 0) {
      return null;
    }
    return providers[0];
  }

  getAllProviders(): RegisteredProvider[] {
    const allProviders: RegisteredProvider[] = [];
    this.providers.forEach((providers) => {
      allProviders.push(...providers);
    });
    return allProviders;
  }

  getProvidersByStandard(standard: BlockchainStandard): RegisteredProvider[] {
    return this.providers.get(standard) || [];
  }

  getProviderByName(name: string, standard?: BlockchainStandard): RegisteredProvider | null {
    if (standard) {
      const providers = this.providers.get(standard);
      if (!providers) return null;
      return providers.find((p) => p.info.name === name) || null;
    }

    for (const providers of this.providers.values()) {
      const found = providers.find((p) => p.info.name === name);
      if (found) return found;
    }
    return null;
  }

  unregisterProvider(standard: BlockchainStandard, name?: string): boolean {
    const providers = this.providers.get(standard);
    if (!providers) return false;

    if (!name) {
      if (standard === 'eip6963') this.eip6963Adapter = null;
      if (standard === 'sui') this.suiAdapter = null;
      if (standard === 'solana') this.solanaAdapter = null;
      if (standard === 'aptos') this.aptosAdapter = null;
      if (standard === 'movement') this.movementAdapter = null;
      if (standard === 'cosmos') this.cosmosAdapter = null;

      this.providers.set(standard, []);
      return true;
    }

    const index = providers.findIndex((p) => p.info.name === name);
    if (index !== -1) {
      providers.splice(index, 1);
      return true;
    }

    return false;
  }

  clear(): void {
    this.providers.forEach((_, key) => {
      this.unregisterProvider(key as BlockchainStandard);
    });
  }

  listStandards(): BlockchainStandard[] {
    return Array.from(this.providers.keys()).filter((key) => this.providers.get(key)!.length > 0);
  }

  isSupported(standard: BlockchainStandard): boolean {
    const providers = this.providers.get(standard);
    return providers !== undefined && providers.length > 0;
  }
}

let globalRegistry: ProviderRegistry | null = null;

export function getProviderRegistry(): ProviderRegistry {
  if (!globalRegistry) {
    globalRegistry = new ProviderRegistry();
  }
  return globalRegistry;
}

export function resetProviderRegistry(): void {
  if (globalRegistry) {
    globalRegistry.clear();
    globalRegistry = null;
  }
}
