import { WalletType } from '../types';
import logger from '../utils/logger';

export interface PrivyWalletConfig {
  userId: string;
  chainType: string;
}

export interface PrivyWallet {
  id: string;
  address: string;
  publicKey?: string;
}

export class WalletService {
  private privyAppId: string;

  constructor(private prisma: any, private redis: any) {
    this.privyAppId = process.env.PRIVY_APP_ID || '';
  }

  async createWallet(userId: string, chainType: string, type: WalletType): Promise<any> {
    try {
      logger.info('Creating wallet', { userId, chainType, type });

      let wallet: any;

      if (type === WalletType.MPC) {
        wallet = await this.createMPCWallet(userId, chainType);
      } else if (type === WalletType.CUSTODIAL) {
        wallet = await this.createCustodialWallet(userId, chainType);
      } else {
        throw new Error(`Wallet type ${type} not supported for creation`);
      }

      const dbWallet = await this.prisma.wallet.create({
        data: {
          userId,
          type,
          chainType,
          address: wallet.address,
          publicKey: wallet.publicKey,
          lastSyncedAt: new Date(),
        },
      });

      await this.redis.publish('wallet.created', JSON.stringify(dbWallet));

      logger.info('Wallet created successfully', { walletId: dbWallet.id, address: wallet.address });

      return dbWallet;
    } catch (error) {
      logger.error('Failed to create wallet', { userId, chainType, error: (error as Error).message });
      throw error;
    }
  }

  private async createMPCWallet(userId: string, chainType: string): Promise<PrivyWallet> {
    try {
      const address = this.generateAddress(chainType);
      const publicKey = this.generatePublicKey();

      return {
        id: `mpc_${userId}_${chainType}`,
        address,
        publicKey,
      };
    } catch (error) {
      logger.error('MPC wallet creation failed', { error: (error as Error).message });
      throw error;
    }
  }

  private async createCustodialWallet(userId: string, chainType: string): Promise<PrivyWallet> {
    try {
      const address = this.generateAddress(chainType);
      const publicKey = this.generatePublicKey();

      return {
        id: `custodial_${userId}_${chainType}`,
        address,
        publicKey,
      };
    } catch (error) {
      logger.error('Custodial wallet creation failed', { error: (error as Error).message });
      throw error;
    }
  }

  async importWallet(userId: string, chainType: string, privateKey: string): Promise<any> {
    try {
      logger.info('Importing wallet', { userId, chainType });

      if (!this.isValidPrivateKey(privateKey)) {
        throw new Error('Invalid private key format');
      }

      const address = this.deriveAddressFromPrivateKey(privateKey, chainType);
      const publicKey = this.derivePublicKeyFromPrivateKey(privateKey);

      const existingWallet = await this.prisma.wallet.findFirst({
        where: {
          userId,
          address,
          chainType,
        },
      });

      if (existingWallet) {
        throw new Error('Wallet already exists for this address');
      }

      const wallet = await this.prisma.wallet.create({
        data: {
          userId,
          type: WalletType.SELF_CUSTODY,
          chainType,
          address,
          publicKey,
          lastSyncedAt: new Date(),
        },
      });

      await this.redis.publish('wallet.created', JSON.stringify(wallet));

      logger.info('Wallet imported successfully', { walletId: wallet.id });

      return wallet;
    } catch (error) {
      logger.error('Failed to import wallet', { userId, error: (error as Error).message });
      throw error;
    }
  }

  async connectExternalWallet(
    userId: string,
    provider: string,
    address: string,
    signature: string,
    chainType: string = 'ethereum'
  ): Promise<any> {
    try {
      logger.info('Connecting external wallet', { userId, provider, address });

      if (!this.isValidAddress(address, chainType)) {
        throw new Error('Invalid wallet address');
      }

      if (!this.isValidSignature(signature)) {
        throw new Error('Invalid signature');
      }

      const existingWallet = await this.prisma.wallet.findFirst({
        where: {
          userId,
          address,
          chainType,
        },
      });

      if (existingWallet) {
        return existingWallet;
      }

      const wallet = await this.prisma.wallet.create({
        data: {
          userId,
          type: WalletType.EXTERNAL,
          chainType,
          address,
          lastSyncedAt: new Date(),
        },
      });

      await this.redis.publish('wallet.created', JSON.stringify(wallet));

      logger.info('External wallet connected successfully', { walletId: wallet.id });

      return wallet;
    } catch (error) {
      logger.error('Failed to connect external wallet', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async deleteWallet(walletId: string, userId: string): Promise<boolean> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet || wallet.userId !== userId) {
        throw new Error('Wallet not found or unauthorized');
      }

      await this.prisma.balance.deleteMany({
        where: { walletId },
      });

      await this.prisma.nft.deleteMany({
        where: { walletId },
      });

      await this.prisma.wallet.delete({
        where: { id: walletId },
      });

      await this.redis.publish('wallet.deleted', JSON.stringify({ walletId }));

      logger.info('Wallet deleted successfully', { walletId });

      return true;
    } catch (error) {
      logger.error('Failed to delete wallet', { walletId, error: (error as Error).message });
      throw error;
    }
  }

  private generateAddress(chainType: string): string {
    const prefix = this.getAddressPrefix(chainType);
    const randomBytes = Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
    return prefix + randomBytes.substring(0, 40);
  }

  private generatePublicKey(): string {
    const randomBytes = Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
    return '0x' + randomBytes.substring(0, 128);
  }

  private getAddressPrefix(chainType: string): string {
    const prefixes: Record<string, string> = {
      ethereum: '0x',
      base: '0x',
      polygon: '0x',
      arbitrum: '0x',
      optimism: '0x',
      bsc: '0x',
      avalanche: '0x',
      solana: '',
      bitcoin: '1',
      sui: '0x',
      aptos: '0x',
      stacks: 'S',
      bitlayer: '0x',
    };
    return prefixes[chainType] || '0x';
  }

  private isValidPrivateKey(privateKey: string): boolean {
    return /^(0x)?[0-9a-fA-F]{64}$/.test(privateKey);
  }

  private isValidAddress(address: string, chainType: string): boolean {
    if (chainType === 'bitcoin') {
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
    }
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

  private isValidSignature(signature: string): boolean {
    return /^0x[0-9a-fA-F]{130}$/.test(signature);
  }

  private deriveAddressFromPrivateKey(privateKey: string, chainType: string): string {
    return this.generateAddress(chainType);
  }

  private derivePublicKeyFromPrivateKey(privateKey: string): string {
    return this.generatePublicKey();
  }
}
