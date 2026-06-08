import { bytesToHex, hexToBytes } from './user-keys.service';

export class KeyStorageService {
  private readonly STORAGE_KEY = 'orya_ika_user_keys_encrypted';
  private readonly SALT_KEY = 'orya_ika_salt';

  public async storeKeys(serializedKeys: Uint8Array, password: string): Promise<void> {
    try {
      let salt = localStorage.getItem(this.SALT_KEY);
      if (!salt) {
        const saltBytes = new Uint8Array(16);
        crypto.getRandomValues(saltBytes);
        salt = bytesToHex(saltBytes);
        localStorage.setItem(this.SALT_KEY, salt);
      }

      const encryptionKey = await this.deriveKey(password, hexToBytes(salt));
      const encrypted = await this.encrypt(serializedKeys, encryptionKey);
      localStorage.setItem(this.STORAGE_KEY, bytesToHex(encrypted));
      console.log('KeyStorageService: keys stored securely');
    } catch (error) {
      console.error('KeyStorageService: storage failed', error);
      throw new Error(`Failed to store keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async retrieveKeys(password: string): Promise<Uint8Array | null> {
    try {
      const encrypted = localStorage.getItem(this.STORAGE_KEY);
      const salt = localStorage.getItem(this.SALT_KEY);

      if (!encrypted || !salt) {
        return null;
      }

      const decryptionKey = await this.deriveKey(password, hexToBytes(salt));
      const decrypted = await this.decrypt(hexToBytes(encrypted), decryptionKey);
      console.log('KeyStorageService: keys retrieved successfully');
      return decrypted;
    } catch (error) {
      console.error('KeyStorageService: retrieval failed', error);
      throw new Error(`Failed to retrieve keys: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public hasStoredKeys(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  public clearKeys(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.SALT_KEY);
    console.log('KeyStorageService: keys cleared from storage');
  }

  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async encrypt(data: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data as BufferSource);

    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);

    return result;
  }

  private async decrypt(data: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);

    return new Uint8Array(decrypted);
  }
}

export const keyStorageService = new KeyStorageService();
