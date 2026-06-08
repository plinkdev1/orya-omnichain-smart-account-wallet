export type WalletEventType = 'accountsChanged' | 'chainChanged' | 'featuresChanged';

export interface WalletEvent {
  type: WalletEventType;
  data?: Record<string, any>;
}

export class WalletEventEmitter {
  private listeners: Map<WalletEventType, Set<(event: WalletEvent) => void>> = new Map();

  on(eventType: WalletEventType, callback: (event: WalletEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off(eventType: WalletEventType, callback: (event: WalletEvent) => void): void {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType)!.delete(callback);
    }
  }

  emit(eventType: WalletEventType, data?: Record<string, any>): void {
    const event: WalletEvent = { type: eventType, data };
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in ${eventType} listener:`, error);
        }
      });
    }
  }

  emitAccountsChanged(accounts: any[]): void {
    this.emit('accountsChanged', { accounts });
  }

  emitChainChanged(chain: string): void {
    this.emit('chainChanged', { chain });
  }

  emitFeaturesChanged(features: Record<string, any>): void {
    this.emit('featuresChanged', { features });
  }

  clear(): void {
    this.listeners.clear();
  }
}
