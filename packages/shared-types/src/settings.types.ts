export interface NetworkConfig {  chainId: string;  name: string;  symbol: string;  rpcUrl: string;  isCustom: boolean;  blockExplorerUrl?: string;  nativeCurrency?: {    name: string;    symbol: string;    decimals: number;  };  }

export interface GasConfig {  standard: {    gasLimit: string;    gasPrice: string;  };  fast: {    gasLimit: string;    gasPrice: string;  };  custom: {    gasLimit: string;    gasPrice: string;  };  usePreset: 'standard' | 'fast' | 'custom';  }

export interface SlippageSettings {  value: number;  isCustom: boolean;  }

export interface NetworkSettings {  selectedChains: string[];  customRPCs: NetworkConfig[];  gasConfigs: Record<string, GasConfig>;  slippageTolerance: SlippageSettings;  autoSwitchNetwork: boolean;  }

export interface TwoFactorConfig {  enabled: boolean;  method: '2fa_code' | 'biometric' | 'none';  backup_codes?: string[];  verified: boolean;  }

export interface BackupConfig {  seedPhraseBackedUp: boolean;  lastBackupDate?: string;  backupMethod: 'local' | 'cloud' | 'none';  }

export interface MultiSigSettings {  enabled: boolean;  requiredSignatures: number;  signers: Array<{    address: string;    name: string;  }>;  createdAt?: string;  }

export interface SecuritySettings {  twoFactor: TwoFactorConfig;  backup: BackupConfig;  multiSig: MultiSigSettings;  passwordExpiresIn: number;  autoLockTimeout: number;  biometricEnabled: boolean;  }

export interface APIKeyConfig {  id: string;  name: string;  key: string;  createdAt: string;  lastUsed?: string;  permissions: string[];  isActive: boolean;  }

export interface TransactionPreferences {  confirmationThreshold: number;  defaultGasSpeed: 'standard' | 'fast' | 'custom';  enableAlerts: boolean;  alertThreshold: number;  transactionTimeout: number;  }

export interface BudgetSettings {  dailyLimit?: number;  monthlyLimit?: number;  enableLimits: boolean;  }

export interface TransactionSettings {  apiKeys: APIKeyConfig[];  preferences: TransactionPreferences;  budget: BudgetSettings;  customSpeeds: Record<string, string>;  }

export interface UserSettings {  id: string;  userId: string;  networkSettings: NetworkSettings;  securitySettings: SecuritySettings;  transactionSettings: TransactionSettings;  lastUpdated: string;  createdAt: string;  }

export interface SettingsUpdatePayload {  networkSettings?: Partial<NetworkSettings>;  securitySettings?: Partial<SecuritySettings>;  transactionSettings?: Partial<TransactionSettings>;  }

export enum SettingsSection {  NETWORK = 'network',  SECURITY = 'security',  TRANSACTIONS = 'transactions',  }