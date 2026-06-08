/**
 * Biconomy NEXUS Smart Account Manager
 * Handles smart account creation, deployment, and lifecycle management
 */

import { ethers } from 'ethers';
import type { Address, SmartAccountType } from '@orya/shared-types';
import {
  BiconomySmartAccountError,
  BiconomyNotInitializedError,
} from './BiconomyErrors';
import type { NexusSmartAccount } from './BiconomyTypes';
import { BiconomyConfig } from './BiconomyConfig';

export interface NexusAccountConfig {
  factory: Address;
  implementation: Address;
  owner: Address;
  chainId: number;
}

export interface DeploymentData {
  factory: Address;
  factoryData: string;
}

export class NexusAccountManager {
  private config: BiconomyConfig;
  private provider: ethers.Provider | null = null;
  private accounts: Map<string, NexusSmartAccount> = new Map();

  constructor(config: BiconomyConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
  }

  /**
   * Create or get a NEXUS smart account
   */
  async createAccount(
    ownerAddress: Address,
    factoryAddress: Address,
    implementation?: Address
  ): Promise<NexusSmartAccount> {
    try {
      if (!this.provider) {
        throw new BiconomyNotInitializedError();
      }

      const accountAddress = await this.computeAccountAddress(
        ownerAddress,
        factoryAddress
      );

      let existingAccount = this.accounts.get(accountAddress);
      if (existingAccount) {
        return existingAccount;
      }

      const isDeployed = await this.isAccountDeployed(accountAddress);

      const account: NexusSmartAccount = {
        address: accountAddress,
        owner: ownerAddress,
        chainId: this.config.chainId,
        isDeployed,
        createdAt: new Date().toISOString(),
      };

      this.accounts.set(accountAddress, account);
      return account;
    } catch (error) {
      throw new BiconomySmartAccountError(
        `Failed to create smart account: ${error instanceof Error ? error.message : String(error)}`,
        { ownerAddress, factoryAddress }
      );
    }
  }

  /**
   * Get or compute smart account address
   */
  async computeAccountAddress(
    ownerAddress: Address,
    factoryAddress: Address
  ): Promise<Address> {
    try {
      if (!this.provider) {
        throw new BiconomyNotInitializedError();
      }

      const salt = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [ownerAddress, 0])
      );

      const NEXUS_FACTORY_ABI = [
        'function getAddress(address implementation, address initializer, bytes calldata data, uint256 salt) public view returns (address)',
      ];

      const factoryContract = new ethers.Contract(
        factoryAddress,
        NEXUS_FACTORY_ABI,
        this.provider
      );

      const initializerData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address'],
        [ownerAddress]
      );

      const implementationAddress = factoryAddress;
      const getAddressFunction = factoryContract.getFunction('getAddress');
      const accountAddress = await getAddressFunction(
        implementationAddress,
        factoryAddress,
        initializerData,
        salt
      );

      return accountAddress as Address;
    } catch (error) {
      throw new BiconomySmartAccountError(
        `Failed to compute account address: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if account is deployed
   */
  async isAccountDeployed(accountAddress: Address): Promise<boolean> {
    try {
      if (!this.provider) {
        throw new BiconomyNotInitializedError();
      }

      const code = await this.provider.getCode(accountAddress);
      return code !== '0x';
    } catch (error) {
      throw new BiconomySmartAccountError(
        `Failed to check account deployment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get deployment data for account initialization
   */
  async getDeploymentData(
    ownerAddress: Address,
    factoryAddress: Address,
    implementation: Address
  ): Promise<DeploymentData> {
    try {
      const salt = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [ownerAddress, 0])
      );

      const initializerData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['address'],
        [ownerAddress]
      );

      const NEXUS_FACTORY_ABI = [
        'function createAccount(address implementation, address initializer, bytes calldata data, uint256 salt) external returns (address)',
      ];

      const factoryIface = new ethers.Interface(NEXUS_FACTORY_ABI);
      const factoryData = factoryIface.encodeFunctionData('createAccount', [
        implementation,
        factoryAddress,
        initializerData,
        salt,
      ]);

      return {
        factory: factoryAddress,
        factoryData,
      };
    } catch (error) {
      throw new BiconomySmartAccountError(
        `Failed to get deployment data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get account nonce for UserOperation
   */
  async getAccountNonce(accountAddress: Address): Promise<string> {
    try {
      if (!this.provider) {
        throw new BiconomyNotInitializedError();
      }

      const ENTRY_POINT_ABI = [
        'function getNonce(address sender, uint192 key) external view returns (uint256)',
      ];

      const entryPointAddress = this.config.getEntryPointAddress();
      const entryPoint = new ethers.Contract(
        entryPointAddress,
        ENTRY_POINT_ABI,
        this.provider
      );

      const nonce = await entryPoint.getNonce(accountAddress, 0);
      return nonce.toString();
    } catch (error) {
      throw new BiconomySmartAccountError(
        `Failed to get account nonce: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validate account ownership
   */
  async validateOwnership(
    accountAddress: Address,
    expectedOwner: Address
  ): Promise<boolean> {
    try {
      if (!this.provider) {
        throw new BiconomyNotInitializedError();
      }

      const NEXUS_ACCOUNT_ABI = [
        'function owner() public view returns (address)',
        'function isOwner(address account) public view returns (bool)',
      ];

      const account = new ethers.Contract(
        accountAddress,
        NEXUS_ACCOUNT_ABI,
        this.provider
      );

      const owner = await account.owner();
      return owner.toLowerCase() === expectedOwner.toLowerCase();
    } catch (error) {
      throw new BiconomySmartAccountError(
        `Failed to validate ownership: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Clear cached accounts
   */
  clearCache(): void {
    this.accounts.clear();
  }

  /**
   * Get cached account
   */
  getCachedAccount(accountAddress: Address): NexusSmartAccount | undefined {
    return this.accounts.get(accountAddress);
  }
}

export default NexusAccountManager;
