import { UserShareEncryptionKeys, Curve } from '@ika.xyz/sdk';

export class UserKeysService {
  private userKeys: UserShareEncryptionKeys | null = null;
  private curve: Curve = Curve.SECP256K1;

  public async initializeFromSeed(rootSeedKey: Uint8Array): Promise<UserShareEncryptionKeys> {
    if (rootSeedKey.length !== 32) {
      throw new Error('Root seed key must be exactly 32 bytes');
    }

    try {
      this.userKeys = UserShareEncryptionKeys.fromRootSeedKey(rootSeedKey, this.curve);
      console.log('UserKeysService: initialized successfully');
      console.log('UserKeysService: Sui address:', this.userKeys.getSuiAddress());
      return this.userKeys;
    } catch (error) {
      console.error('UserKeysService: initialization failed', error);
      throw new Error(`Failed to initialize user keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async initializeFromBytes(serializedBytes: Uint8Array): Promise<UserShareEncryptionKeys> {
    try {
      this.userKeys = UserShareEncryptionKeys.fromShareEncryptionKeysBytes(serializedBytes);
      console.log('UserKeysService: restored from bytes');
      console.log('UserKeysService: Sui address:', this.userKeys.getSuiAddress());
      return this.userKeys;
    } catch (error) {
      console.error('UserKeysService: restoration failed', error);
      throw new Error(`Failed to restore user keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public serializeKeys(): Uint8Array {
    if (!this.userKeys) {
      throw new Error('UserKeysService: keys not initialized');
    }

    return this.userKeys.toShareEncryptionKeysBytes();
  }

  public getKeys(): UserShareEncryptionKeys {
    if (!this.userKeys) {
      throw new Error('UserKeysService: keys not initialized');
    }

    return this.userKeys;
  }

  public getSuiAddress(): string {
    if (!this.userKeys) {
      throw new Error('UserKeysService: keys not initialized');
    }

    return this.userKeys.getSuiAddress();
  }

  public getPublicKeyBytes(): Uint8Array {
    if (!this.userKeys) {
      throw new Error('UserKeysService: keys not initialized');
    }

    return this.userKeys.getSigningPublicKeyBytes();
  }

  public async verifySignature(message: Uint8Array, signature: Uint8Array): Promise<boolean> {
    if (!this.userKeys) {
      throw new Error('UserKeysService: keys not initialized');
    }

    return this.userKeys.verifySignature(message, signature);
  }

  public clear(): void {
    this.userKeys = null;
    console.log('UserKeysService: keys cleared');
  }

  public isInitialized(): boolean {
    return this.userKeys !== null;
  }
}

export const generateSecureRandomSeed = (): Uint8Array => {
  const seed = new Uint8Array(32);
  crypto.getRandomValues(seed);
  return seed;
};

export const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
};

export const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};
