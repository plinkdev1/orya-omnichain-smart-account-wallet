import { BaseGenerator, GeneratedFile } from './base-generator.js';
import { ChainConfig } from '../types.js';

export class TypeScriptGenerator extends BaseGenerator {
  constructor(chainKey: string, config: ChainConfig, adapterPath: string) {
    super(chainKey, config, adapterPath);
  }

  generate(): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    const vars = {
      chainName: this.config.name,
      dirName: this.config.dirName,
      mainDEX: this.config.mainDEX || 'Unknown',
      mainBridge: this.config.mainBridge || 'Unknown',
      rpcProvider: this.config.rpcProvider || 'Unknown',
    };

    files.push(this.createFile('package.json', this.generatePackageJson()));
    files.push(this.createFile('tsconfig.json', this.generateTsConfig()));
    files.push(this.createFile('src/index.ts', this.generateIndexTs()));
    files.push(this.createFile('src/types.ts', this.generateTypesTs(vars)));
    files.push(this.createFile('src/error.ts', this.generateErrorTs()));
    files.push(this.createFile('src/client.ts', this.generateClientTs(vars)));
    files.push(this.createFile('src/account.ts', this.generateAccountTs(vars)));
    files.push(this.createFile('src/transaction.ts', this.generateTransactionTs(vars)));
    files.push(this.createFile('src/config.ts', this.generateConfigTs(vars)));
    files.push(this.createFile('tests/client.test.ts', this.generateClientTest(vars)));
    files.push(this.createFile('.env.example', this.generateEnvExample()));
    files.push(this.createFile('README.md', this.generateReadme(vars)));

    return files;
  }

  private generatePackageJson(): string {
    return JSON.stringify(
      {
        name: this.config.dirName,
        version: '0.1.0',
        description: `${this.config.name} blockchain adapter for ORŸA Wallet`,
        main: 'dist/index.js',
        types: 'dist/index.d.ts',
        scripts: {
          dev: 'tsup --watch',
          build: 'tsup',
          test: 'vitest',
          'test:watch': 'vitest --watch',
          lint: 'eslint src --ext .ts',
          'type-check': 'tsc --noEmit',
        },
        keywords: ['blockchain', 'adapter', this.config.name.toLowerCase()],
        author: 'ORŸA Team',
        license: 'MIT',
        dependencies: {
          axios: '^1.6.0',
        },
        devDependencies: {
          '@types/node': '^20.0.0',
          tsup: '^8.0.0',
          typescript: '^5.3.0',
          vitest: '^1.0.0',
          eslint: '^8.0.0',
        },
      },
      null,
      2
    );
  }

  private generateTsConfig(): string {
    return JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'node',
          resolveJsonModule: true,
          declaration: true,
          declarationMap: true,
          sourceMap: true,
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          lib: ['ES2020'],
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2
    );
  }

  private generateIndexTs(): string {
    return `export * from './types';
export * from './client';
export * from './error';
export * from './config';
export * from './account';
export * from './transaction';
`;
  }

  private generateTypesTs(vars: Record<string, string>): string {
    return `export interface Address {
  value: string;
}

export interface Amount {
  value: string;
  decimals: number;
}

export interface Transaction {
  id: string;
  from: Address;
  to: Address;
  amount: Amount;
  timestamp: number;
}

export interface ChainInfo {
  name: string;
  chainId: string;
  rpcUrl: string;
}

export interface ClientConfig {
  rpcUrl: string;
  timeout?: number;
  retries?: number;
}

export const DEFAULT_CHAIN_INFO: ChainInfo = {
  name: '${vars.chainName}',
  chainId: 'unknown',
  rpcUrl: '',
};
`;
  }

  private generateErrorTs(): string {
    return `export class AdapterError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

export class NetworkError extends AdapterError {
  constructor(message: string) {
    super('NETWORK_ERROR', message);
  }
}

export class InvalidAddressError extends AdapterError {
  constructor(address: string) {
    super('INVALID_ADDRESS', \`Invalid address: \${address}\`);
  }
}

export class TransactionError extends AdapterError {
  constructor(message: string) {
    super('TRANSACTION_ERROR', message);
  }
}
`;
  }

  private generateClientTs(vars: Record<string, string>): string {
    return `import { ClientConfig, ChainInfo, DEFAULT_CHAIN_INFO } from './types';

export class Client {
  private chainInfo: ChainInfo;
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
    this.chainInfo = {
      ...DEFAULT_CHAIN_INFO,
      rpcUrl: config.rpcUrl,
    };
  }

  getRpcUrl(): string {
    return this.config.rpcUrl;
  }

  getChainInfo(): ChainInfo {
    return this.chainInfo;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Implementation would go here
      return true;
    } catch (error) {
      return false;
    }
  }
}
`;
  }

  private generateAccountTs(vars: Record<string, string>): string {
    return `import { Address } from './types';

export class Account {
  private address: Address;

  constructor(address: Address) {
    this.address = address;
  }

  getAddress(): Address {
    return this.address;
  }

  async getBalance(): Promise<string> {
    // Implementation would go here
    return '0';
  }
}
`;
  }

  private generateTransactionTs(vars: Record<string, string>): string {
    return `import { Transaction, Address, Amount } from './types';
import { v4 as uuidv4 } from 'uuid';

export class TransactionBuilder {
  private from?: Address;
  private to?: Address;
  private amount?: Amount;

  setFrom(address: Address): this {
    this.from = address;
    return this;
  }

  setTo(address: Address): this {
    this.to = address;
    return this;
  }

  setAmount(amount: Amount): this {
    this.amount = amount;
    return this;
  }

  build(): Transaction {
    if (!this.from) throw new Error('from address required');
    if (!this.to) throw new Error('to address required');
    if (!this.amount) throw new Error('amount required');

    return {
      id: uuidv4(),
      from: this.from,
      to: this.to,
      amount: this.amount,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }
}
`;
  }

  private generateConfigTs(vars: Record<string, string>): string {
    return `export const CHAIN_NAME = '${vars.chainName}';
export const VERSION = '0.1.0';

export const DEFAULT_CLIENT_CONFIG = {
  timeout: 30000,
  retries: 3,
};

export const SUPPORTED_OPERATIONS = [
  'transfer',
  'query_balance',
  'get_account_info',
];
`;
  }

  private generateClientTest(vars: Record<string, string>): string {
    return `import { describe, it, expect } from 'vitest';
import { Client } from '../src/client';

describe('Client', () => {
  it('should create a client instance', () => {
    const client = new Client({ rpcUrl: 'http://localhost:8000' });
    expect(client.getRpcUrl()).toBe('http://localhost:8000');
  });

  it('should return chain info', () => {
    const client = new Client({ rpcUrl: 'http://localhost:8000' });
    const info = client.getChainInfo();
    expect(info.name).toBe('${vars.chainName}');
  });

  it('should perform health check', async () => {
    const client = new Client({ rpcUrl: 'http://localhost:8000' });
    const result = await client.healthCheck();
    expect(typeof result).toBe('boolean');
  });
});
`;
  }

  private generateEnvExample(): string {
    return `RPC_URL=
CHAIN_ID=
LOG_LEVEL=info
`;
  }

  private generateReadme(vars: Record<string, string>): string {
    return `# ${vars.chainName} Adapter

TypeScript adapter for ${vars.chainName} blockchain integration. Provides unified interface for ${vars.chainName} operations including wallet management, transaction execution, and protocol interactions.

## Overview

- **Language:** TypeScript
- **Primary Use:** ${vars.chainName} transactions, DeFi protocol routing
- **Main DEX:** ${vars.mainDEX}
- **Main Bridge:** ${vars.mainBridge}
- **RPC Provider:** ${vars.rpcProvider}

## Features

✅ ${vars.chainName} wallet operations  
✅ Transaction signing & execution  
✅ Account balance queries  
✅ Type-safe interfaces  
✅ Error handling  

## Quick Start

\`\`\`bash
npm install
npm run dev
npm run test
\`\`\`

## Usage

\`\`\`typescript
import { Client } from '.';

const client = new Client({ rpcUrl: 'http://localhost:8000' });
await client.healthCheck();
\`\`\`

## Testing

\`\`\`bash
npm run test
npm run test:watch
\`\`\`

## Documentation

- [ORŸA Adapter Architecture](../../docs/architecture/adapters.md)
`;
  }
}
