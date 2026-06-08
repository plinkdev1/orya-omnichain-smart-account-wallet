import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { ChainConfig } from '../types.js';

export class ConfigLoader {
  private chainsCache: Record<string, ChainConfig> | null = null;
  private configPath: string;

  constructor() {
    const __dirname = new URL('.', import.meta.url).pathname;
    this.configPath = path.join(__dirname, '../../config/chains.yaml');
  }

  loadChains(): Record<string, ChainConfig> {
    if (this.chainsCache) {
      return this.chainsCache;
    }

    try {
      const fileContent = fs.readFileSync(this.configPath, 'utf-8');
      const parsed = yaml.load(fileContent) as { chains: Record<string, ChainConfig> };

      if (!parsed.chains) {
        throw new Error('Invalid chains configuration: missing "chains" key');
      }

      this.chainsCache = parsed.chains;
      return this.chainsCache;
    } catch (error) {
      throw new Error(`Failed to load chains configuration: ${error}`);
    }
  }

  getChain(chainKey: string): ChainConfig | null {
    const chains = this.loadChains();
    return chains[chainKey] || null;
  }

  getAllChains(): Record<string, ChainConfig> {
    return this.loadChains();
  }

  listChains(): Array<{ key: string; config: ChainConfig }> {
    const chains = this.loadChains();
    return Object.entries(chains).map(([key, config]) => ({ key, config }));
  }
}
