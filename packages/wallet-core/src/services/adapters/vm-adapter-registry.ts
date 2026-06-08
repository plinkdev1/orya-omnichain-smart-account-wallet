import type { Chain } from '@orya/shared-types';
import { ChainType } from '@orya/shared-types';
import { AptosAdapter, getAptosAdapter } from './aptos-adapter';
import { MovementAdapter, getMovementAdapter } from './movement-adapter';

export type VMAdapter = AptosAdapter | MovementAdapter;
export type VMFamily = 'evm' | 'solana' | 'sui' | 'aptos' | 'movement' | 'cosmos' | 'ton' | 'near' | 'tron' | 'cardano' | 'substrate' | 'bitcoin';

export class VMAdapterRegistry {
  private adapterCache = new Map<string, VMAdapter>();

  getAdapter(chain: Chain): VMAdapter | null {
    const cacheKey = chain.id;
    if (this.adapterCache.has(cacheKey)) {
      return this.adapterCache.get(cacheKey)!;
    }

    let adapter: VMAdapter | null = null;

    switch (chain.type) {
      case ChainType.APTOS:
        adapter = getAptosAdapter(chain);
        break;
      case ChainType.MOVEMENT:
        adapter = getMovementAdapter(chain);
        break;
      case ChainType.EVM:
        break;
      case ChainType.SOLANA:
        break;
      case ChainType.SUI:
        break;
      case ChainType.COSMOS:
        break;
      case ChainType.TON:
        break;
      case ChainType.NEAR:
        break;
      case ChainType.TRON:
        break;
      case ChainType.CARDANO:
        break;
      case ChainType.SUBSTRATE:
        break;
      case ChainType.BITCOIN:
        break;
      default:
        return null;
    }

    if (adapter) {
      this.adapterCache.set(cacheKey, adapter);
    }

    return adapter;
  }

  clearCache(): void {
    this.adapterCache.clear();
  }

  hasAdapter(vmFamily: VMFamily): boolean {
    return ['aptos', 'movement'].includes(vmFamily);
  }

  getSupportedVMs(): VMFamily[] {
    return ['aptos', 'movement'];
  }
}

const globalRegistry = new VMAdapterRegistry();

export function getVMAdapterRegistry(): VMAdapterRegistry {
  return globalRegistry;
}

export function getVMAdapter(chain: Chain): VMAdapter | null {
  return globalRegistry.getAdapter(chain);
}

export function clearVMAdapterCache(): void {
  globalRegistry.clearCache();
}
