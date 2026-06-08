export enum WalletType {
  NORMIE = 'normie',
  POWER_USER = 'power_user',
  EOA = 'eoa',
  INSTITUTIONAL = 'institutional',
}

export enum WalletProvider {
  PRIVY = 'privy',
  DYNAMIC = 'dynamic',
}

export interface WalletFeature {
  id: string;
  name: string;
  enabled: boolean;
  optional: boolean;
}

export interface UserWalletConfig {
  type: WalletType;
  provider: WalletProvider;
  features: WalletFeature[];
  requiresKYB: boolean;
  enableMPC: boolean;
  enableSmartAccount: boolean;
  description: string;
  icon: string;
}

export class WalletRouter {
  static getWalletConfig(userType: WalletType): UserWalletConfig {
    switch (userType) {
      case WalletType.NORMIE:
        return {
          type: WalletType.NORMIE,
          provider: WalletProvider.PRIVY,
          description: 'Perfect for beginners',
          icon: 'sparkles',
          features: [
            { id: 'social_login', name: 'Social Media Login', enabled: true, optional: false },
            { id: 'embedded_wallet', name: 'Embedded Wallet', enabled: true, optional: false },
            { id: 'fiat_onramp', name: 'Buy Crypto with Card', enabled: true, optional: true },
            { id: 'apple_pay', name: 'Apple Pay', enabled: true, optional: true },
            { id: 'google_pay', name: 'Google Pay', enabled: true, optional: true },
            { id: 'human_passport', name: 'Human Network Passport', enabled: true, optional: true },
            { id: 'simple_interface', name: 'Simple Interface', enabled: true, optional: false },
          ],
          requiresKYB: false,
          enableMPC: false,
          enableSmartAccount: false,
        };

      case WalletType.POWER_USER:
        return {
          type: WalletType.POWER_USER,
          provider: WalletProvider.DYNAMIC,
          description: 'For experienced users',
          icon: 'zap',
          features: [
            { id: 'mpc', name: 'MPC Key Management', enabled: true, optional: true },
            { id: 'smart_account', name: 'Smart Account (ERC-4337)', enabled: true, optional: true },
            { id: 'multichain', name: 'Multi-Chain Support (9 chains)', enabled: true, optional: false },
            { id: 'sui_native', name: 'SUI Native Features', enabled: true, optional: false },
            { id: 'hardware_wallet', name: 'Hardware Wallet Support', enabled: true, optional: true },
            { id: 'zklogin', name: 'zkLogin', enabled: true, optional: true },
            { id: 'zktrust', name: 'zkTrust Security', enabled: true, optional: true },
            { id: 'human_passport', name: 'Human Network Passport', enabled: true, optional: true },
            { id: 'wallet_connect', name: 'WalletConnect Support', enabled: true, optional: false },
            { id: 'deep_linking', name: 'Deep Linking', enabled: true, optional: false },
            { id: 'advanced_defi', name: 'Advanced DeFi Features', enabled: true, optional: true },
          ],
          requiresKYB: false,
          enableMPC: true,
          enableSmartAccount: true,
        };

      case WalletType.EOA:
        return {
          type: WalletType.EOA,
          provider: WalletProvider.DYNAMIC,
          description: 'Import & enhance existing',
          icon: 'link',
          features: [
            { id: 'import_wallet', name: 'Import Existing Wallet', enabled: true, optional: false },
            { id: 'multichain', name: 'Multi-Chain Support', enabled: true, optional: false },
            { id: 'wallet_connect', name: 'WalletConnect Support', enabled: true, optional: false },
            { id: 'upgrade_to_smart', name: 'Upgrade to Smart Account', enabled: true, optional: true },
            { id: 'mpc_upgrade', name: 'Enable MPC Security', enabled: true, optional: true },
            { id: 'human_passport', name: 'Human Network Passport', enabled: true, optional: true },
            { id: 'advanced_defi', name: 'Advanced DeFi Features', enabled: true, optional: true },
          ],
          requiresKYB: false,
          enableMPC: false,
          enableSmartAccount: false,
        };

      case WalletType.INSTITUTIONAL:
        return {
          type: WalletType.INSTITUTIONAL,
          provider: WalletProvider.DYNAMIC,
          description: 'For teams & enterprises',
          icon: 'building-2',
          features: [
            { id: 'kyb', name: 'KYB Verification', enabled: true, optional: false },
            { id: 'kyc', name: 'KYC for Team Members', enabled: true, optional: false },
            { id: 'multi_sig', name: 'Multi-Signature Wallet', enabled: true, optional: false },
            { id: 'team_management', name: 'Team Member Management', enabled: true, optional: false },
            { id: 'compliance', name: 'Compliance Dashboard', enabled: true, optional: false },
            { id: 'advanced_policies', name: 'Advanced Spend Policies', enabled: true, optional: true },
            { id: 'audit_logs', name: 'Detailed Audit Logs', enabled: true, optional: false },
            { id: 'mpc', name: 'MPC Key Management', enabled: true, optional: false },
            { id: 'smart_account', name: 'Smart Account (ERC-4337)', enabled: true, optional: false },
            { id: 'multichain', name: 'Multi-Chain Support', enabled: true, optional: false },
          ],
          requiresKYB: true,
          enableMPC: true,
          enableSmartAccount: true,
        };

      default:
        throw new Error(`Unknown wallet type: ${userType}`);
    }
  }

  static getProvider(userType: WalletType): WalletProvider {
    return this.getWalletConfig(userType).provider;
  }

  static hasFeature(userType: WalletType, featureId: string): boolean {
    const config = this.getWalletConfig(userType);
    return config.features.some(f => f.id === featureId && f.enabled);
  }

  static getProviders(userType: WalletType): string[] {
    const provider = this.getProvider(userType);
    if (provider === WalletProvider.PRIVY) {
      return ['PrivyWalletProvider'];
    } else {
      return ['DynamicWalletProvider', 'WalletConnectProvider'];
    }
  }

  static getAllFeatures(userType: WalletType): WalletFeature[] {
    return this.getWalletConfig(userType).features;
  }

  static getEnabledFeatures(userType: WalletType): WalletFeature[] {
    return this.getWalletConfig(userType).features.filter(f => f.enabled);
  }
}
