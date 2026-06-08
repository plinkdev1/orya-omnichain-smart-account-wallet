/**
 * NOT a React hook - Utility function for UI event bridging
 * Framework-agnostic UI event interface for modals, toasts, and biometrics
 * 
 * PROMPT C4: Optional UI Event Bridge
 * 
 * @example
 * // In apps/web/hooks/useUIBridge.ts
 * import { useUIBridge as getUIBridgeLogic } from '@orya/wallet-core/hooks';
 * 
 * export function useUIBridge() {
 *   const [toasts, setToasts] = useState([]);
 *   const [modal, setModal] = useState(null);
 *   const logic = getUIBridgeLogic();
 *   
 *   return {
 *     ...logic,
 *     toast: (message, type) => setToasts([...toasts, { message, type }]),
 *     showModal: (content) => setModal(content),
 *   };
 * }
 */

import type React from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type BiometricType = 'fingerprint' | 'face' | 'iris';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface ModalConfig {
  id: string;
  title: string;
  content: string | React.ReactNode;
  buttons: Array<{
    label: string;
    action: 'confirm' | 'cancel' | 'custom';
    onClick: () => void;
  }>;
}

export interface BiometricOptions {
  reason: string;
  fallbackToPasscode?: boolean;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export interface UIBridgeLogic {
  // Toast notifications
  toast: (message: string, type: ToastType, duration?: number) => string; // returns toast ID
  dismissToast: (toastId: string) => void;
  clearAllToasts: () => void;

  // Modal dialogs
  showModal: (config: ModalConfig) => Promise<boolean>; // returns whether confirmed
  showConfirm: (title: string, message: string) => Promise<boolean>;
  showAlert: (title: string, message: string) => Promise<void>;
  dismissModal: (modalId: string) => void;

  // Biometric authentication
  isBiometricAvailable: () => Promise<boolean>;
  getBiometricType: () => Promise<BiometricType | null>;
  authenticate: (options: BiometricOptions) => Promise<void>;

  // Share & Copy
  copyToClipboard: (text: string, label?: string) => Promise<void>;
  shareText: (text: string, title?: string) => Promise<void>;

  // Haptic feedback
  haptic: (type: 'light' | 'medium' | 'heavy') => void;
}

/**
 * Core UI bridge logic
 * Pure business logic - no React or platform dependencies
 * Designed to be called from platform-specific hooks in app layer
 */
export function useUIBridge(): UIBridgeLogic {
  return {
    toast(message: string, type: ToastType, duration?: number): string {
      // Phase 3 Implementation:
      // - Create toast message
      // - Queue in global UI state
      // - Auto-dismiss after duration
      // - Return toast ID for dismissal
      console.log('[wallet-core] UIBridge.toast stub:', { message, type, duration });
      return `toast-${Date.now()}`;
    },

    dismissToast(toastId: string): void {
      // Phase 3 Implementation:
      // - Remove from toast queue
      console.log('[wallet-core] UIBridge.dismissToast stub:', { toastId });
    },

    clearAllToasts(): void {
      // Phase 3 Implementation:
      // - Clear all toasts
      console.log('[wallet-core] UIBridge.clearAllToasts stub');
    },

    async showModal(config: ModalConfig): Promise<boolean> {
      // Phase 3 Implementation:
      // - Display modal dialog
      // - Wait for user interaction
      // - Return confirmation result
      console.log('[wallet-core] UIBridge.showModal stub:', config);
      return false;
    },

    async showConfirm(title: string, message: string): Promise<boolean> {
      // Phase 3 Implementation:
      // - Show confirm dialog
      // - Return user choice
      console.log('[wallet-core] UIBridge.showConfirm stub:', { title, message });
      return false;
    },

    async showAlert(title: string, message: string): Promise<void> {
      // Phase 3 Implementation:
      // - Show alert dialog
      console.log('[wallet-core] UIBridge.showAlert stub:', { title, message });
    },

    dismissModal(modalId: string): void {
      // Phase 3 Implementation:
      // - Close modal
      console.log('[wallet-core] UIBridge.dismissModal stub:', { modalId });
    },

    async isBiometricAvailable(): Promise<boolean> {
      // Phase 3 Implementation (Mobile):
      // - Check device capabilities
      // - Return availability
      console.log('[wallet-core] UIBridge.isBiometricAvailable stub');
      return false;
    },

    async getBiometricType(): Promise<BiometricType | null> {
      // Phase 3 Implementation (Mobile):
      // - Detect available biometric
      // - Return type or null
      console.log('[wallet-core] UIBridge.getBiometricType stub');
      return null;
    },

    async authenticate(options: BiometricOptions): Promise<void> {
      // Phase 3 Implementation (Mobile):
      // - Trigger biometric prompt
      // - Call success or error handler
      console.log('[wallet-core] UIBridge.authenticate stub:', options);
      throw new Error('Biometric authentication not implemented in Phase 0');
    },

    async copyToClipboard(text: string, label?: string): Promise<void> {
      // Phase 2 Implementation:
      // - Copy to system clipboard
      // - Show toast confirmation
      console.log('[wallet-core] UIBridge.copyToClipboard stub:', { text, label });
    },

    async shareText(text: string, title?: string): Promise<void> {
      // Phase 3 Implementation (Mobile):
      // - Show share sheet
      // - Handle sharing
      console.log('[wallet-core] UIBridge.shareText stub:', { text, title });
    },

    haptic(type: 'light' | 'medium' | 'heavy'): void {
      // Phase 3 Implementation (Mobile):
      // - Trigger haptic feedback
      console.log('[wallet-core] UIBridge.haptic stub:', { type });
    },
  };
}