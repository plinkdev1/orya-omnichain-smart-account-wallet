import { Alchemy, Network } from 'alchemy-sdk';
import { CacheManager, CACHE_TTL } from '../utils/cache';
import logger from '../utils/logger';

const CHAIN_TO_NETWORK: Record<string, Network> = {
  ethereum: Network.ETH_MAINNET,
  base: Network.BASE_MAINNET,
  polygon: Network.MATIC_MAINNET,
  arbitrum: Network.ARB_MAINNET,
  optimism: Network.OPT_MAINNET,
  bsc: Network.POLYGON_MAINNET,
};

export class NFTService {
  private alchemyClients: Map<string, Alchemy> = new Map();

  constructor(private cacheManager: CacheManager, private prisma: any) {
    this.initializeClients();
  }

  private initializeClients(): void {
    for (const [chain, network] of Object.entries(CHAIN_TO_NETWORK)) {
      const settings = {
        apiKey: process.env.ALCHEMY_NFT_API_KEY || process.env.ALCHEMY_API_KEY,
        network,
      };
      this.alchemyClients.set(chain, new Alchemy(settings));
    }
  }

  async fetchNFTs(walletId: string, address: string, chainId: string): Promise<any[]> {
    const cacheKey = this.cacheManager.getNFTsCacheKey(walletId, chainId);
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = this.alchemyClients.get(chainId);
      if (!client) {
        throw new Error(`No Alchemy client configured for chain: ${chainId}`);
      }

      const response = await client.nft.getNftsForOwner(address);
      const nfts = response.ownedNfts || [];

      const savedNFTs = [];
      for (const nft of nfts) {
        const saved = await this.prisma.nft.upsert({
          where: {
            walletId_contractAddress_tokenId: {
              walletId,
              contractAddress: nft.contract.address,
              tokenId: nft.tokenId,
            },
          },
          update: {
            name: nft.title,
            description: nft.description,
            imageUrl: nft.image?.cachedUrl || nft.image?.thumbnailUrl,
            metadata: nft.rawMetadata,
          },
          create: {
            walletId,
            chainId,
            contractAddress: nft.contract.address,
            tokenId: nft.tokenId,
            name: nft.title,
            description: nft.description,
            imageUrl: nft.image?.cachedUrl || nft.image?.thumbnailUrl,
            metadata: nft.rawMetadata,
          },
        });

        savedNFTs.push(saved);
      }

      await this.cacheManager.set(cacheKey, savedNFTs, CACHE_TTL.NFTS);

      logger.info('NFTs fetched successfully', {
        walletId,
        chainId,
        count: savedNFTs.length,
      });

      return savedNFTs;
    } catch (error) {
      logger.error('Failed to fetch NFTs', {
        walletId,
        chainId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async fetchAllNFTs(walletId: string, address: string): Promise<any[]> {
    const allNFTs = [];

    const supportedChains = [
      'ethereum',
      'base',
      'polygon',
      'arbitrum',
      'optimism',
    ];

    for (const chain of supportedChains) {
      try {
        const nfts = await this.fetchNFTs(walletId, address, chain);
        allNFTs.push(...nfts);
      } catch (error) {
        logger.warn(`Failed to fetch NFTs from ${chain}`, {
          error: (error as Error).message,
        });
      }
    }

    return allNFTs;
  }
}
