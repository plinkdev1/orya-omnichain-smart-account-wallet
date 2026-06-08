import { AppKit, AppKitNetwork } from '@reown/appkit';
import { 
  mainnet as ethereumMainnet, 
  sepolia as ethereumSepolia,
  polygonMainnet,
  polygonAmoy,
  arbitrumMainnet,
  arbitrumSepolia,
  optimismMainnet,
  optimismSepolia
} from '@reown/appkit-networks/evm';
import { solanaMainnet, solanaDevnet, solanaTestnet } from '@reown/appkit-networks/solana';

export interface ReOwnProjectConfig {
  projectId: string;
  name: string;
  description: string;
  url: string;
  icons: string[];
}

export interface ReOwnChainConfig {
  chains: AppKitNetwork[];
  defaultChain?: AppKitNetwork;
}

export class ReOwnConfigManager {
  private projectId: string;
  private projectName: string;
  private projectDescription: string;
  private projectUrl: string;
  private projectIcons: string[];

  private enabledChains: AppKitNetwork[] = [];
  private defaultChain: AppKitNetwork | undefined;

  private static instance: ReOwnConfigManager;

  private constructor(config: ReOwnProjectConfig) {
    this.projectId = config.projectId;
    this.projectName = config.name;
    this.projectDescription = config.description;
    this.projectUrl = config.url;
    this.projectIcons = config.icons;
  }

  static getInstance(config?: ReOwnProjectConfig): ReOwnConfigManager {
    if (!ReOwnConfigManager.instance) {
      if (!config) {
        throw new Error('ReOwnConfigManager must be initialized with config on first call');
      }
      ReOwnConfigManager.instance = new ReOwnConfigManager(config);
    }
    return ReOwnConfigManager.instance;
  }

  static initialize(config: ReOwnProjectConfig): ReOwnConfigManager {
    ReOwnConfigManager.instance = new ReOwnConfigManager(config);
    return ReOwnConfigManager.instance;
  }

  getProjectId(): string {
    return this.projectId;
  }

  getProjectMetadata() {
    return {
      name: this.projectName,
      description: this.projectDescription,
      url: this.projectUrl,
      icons: this.projectIcons
    };
  }

  enableEVMChains(networks?: 'mainnet' | 'testnet' | 'all'): this {
    const defaultNetworks = networks || 'mainnet';
    
    if (defaultNetworks === 'mainnet' || defaultNetworks === 'all') {
      this.enabledChains.push(ethereumMainnet, polygonMainnet, arbitrumMainnet, optimismMainnet);
      if (!this.defaultChain) {
        this.defaultChain = ethereumMainnet;
      }
    }
    
    if (defaultNetworks === 'testnet' || defaultNetworks === 'all') {
      this.enabledChains.push(ethereumSepolia, polygonAmoy, arbitrumSepolia, optimismSepolia);
    }

    return this;
  }

  enableSolanaChains(networks?: 'mainnet' | 'testnet' | 'all'): this {
    const defaultNetworks = networks || 'mainnet';
    
    if (defaultNetworks === 'mainnet' || defaultNetworks === 'all') {
      this.enabledChains.push(solanaMainnet);
      if (!this.defaultChain) {
        this.defaultChain = solanaMainnet;
      }
    }
    
    if (defaultNetworks === 'testnet' || defaultNetworks === 'all') {
      this.enabledChains.push(solanaDevnet, solanaTestnet);
    }

    return this;
  }

  addCustomChain(chain: AppKitNetwork): this {
    this.enabledChains.push(chain);
    return this;
  }

  removeChain(chainId: string): this {
    this.enabledChains = this.enabledChains.filter(chain => chain.id !== chainId);
    if (this.defaultChain?.id === chainId) {
      this.defaultChain = this.enabledChains[0];
    }
    return this;
  }

  setDefaultChain(chain: AppKitNetwork): this {
    if (!this.enabledChains.find(c => c.id === chain.id)) {
      this.enabledChains.push(chain);
    }
    this.defaultChain = chain;
    return this;
  }

  getEnabledChains(): AppKitNetwork[] {
    return [...this.enabledChains];
  }

  getDefaultChain(): AppKitNetwork | undefined {
    return this.defaultChain;
  }

  getChainConfig(): ReOwnChainConfig {
    return {
      chains: this.getEnabledChains(),
      defaultChain: this.getDefaultChain()
    };
  }

  validateConfiguration(): boolean {
    if (!this.projectId) {
      console.error('ReOwn Project ID is not configured');
      return false;
    }
    if (this.enabledChains.length === 0) {
      console.warn('No chains are enabled in ReOwn configuration');
      return false;
    }
    return true;
  }
}
