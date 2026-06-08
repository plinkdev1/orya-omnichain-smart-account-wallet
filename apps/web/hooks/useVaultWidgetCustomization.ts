/**
 * useVaultWidgetCustomization Hook
 * Manages vault action button customization (visibility, order, arrangement)
 * Persists preferences per wallet type
 */

import { useCallback, useEffect, useState } from 'react';

export interface VaultAction {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
  position?: number;
}

export type WalletType = 'standard' | 'multi-sig' | 'smart-contract';

interface VaultWidgetPreferences {
  actions: VaultAction[];
  rowLayout: 'two' | 'three'; // Number of buttons per row
  lastUpdated: number;
}

const DEFAULT_ACTIONS: VaultAction[] = [
  { id: 'add-money', label: 'Add Money', icon: 'ArrowDownLeft', visible: true, position: 0 },
  { id: 'pay', label: 'Pay / Fast Payment', icon: 'Send', visible: true, position: 1 },
  { id: 'vault-info', label: 'Vault Info', icon: 'Info', visible: true, position: 2 },
  { id: 'sub-vaults', label: 'Sub-Vaults', icon: 'Layers', visible: true, position: 3 },
  { id: 'extract', label: 'Extract / Export', icon: 'Download', visible: true, position: 4 },
  { id: 'conversor', label: 'Conversor', icon: 'Repeat', visible: true, position: 5 },
  { id: 'more', label: 'More', icon: 'MoreHorizontal', visible: true, position: 6 },
];

const STORAGE_KEY = 'orya-vault-widget-prefs';

export function useVaultWidgetCustomization(walletType: WalletType = 'standard') {
  const [preferences, setPreferences] = useState<VaultWidgetPreferences>({
    actions: DEFAULT_ACTIONS,
    rowLayout: 'three',
    lastUpdated: Date.now(),
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}:${walletType}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
      } catch {
        setPreferences({
          actions: DEFAULT_ACTIONS,
          rowLayout: 'three',
          lastUpdated: Date.now(),
        });
      }
    } else {
      setPreferences({
        actions: DEFAULT_ACTIONS,
        rowLayout: 'three',
        lastUpdated: Date.now(),
      });
    }
    setIsLoaded(true);
  }, [walletType]);

  const savePreferences = useCallback((newPrefs: VaultWidgetPreferences) => {
    localStorage.setItem(`${STORAGE_KEY}:${walletType}`, JSON.stringify(newPrefs));
    setPreferences(newPrefs);
  }, [walletType]);

  const toggleActionVisibility = useCallback(
    (actionId: string) => {
      setPreferences((prev) => ({
        ...prev,
        actions: prev.actions.map((action) =>
          action.id === actionId ? { ...action, visible: !action.visible } : action
        ),
        lastUpdated: Date.now(),
      }));
    },
    []
  );

  const reorderActions = useCallback(
    (actions: VaultAction[]) => {
      const newPrefs = {
        ...preferences,
        actions: actions.map((action, index) => ({ ...action, position: index })),
        lastUpdated: Date.now(),
      };
      savePreferences(newPrefs);
    },
    [preferences, savePreferences]
  );

  const setRowLayout = useCallback(
    (layout: 'two' | 'three') => {
      const newPrefs = {
        ...preferences,
        rowLayout: layout,
        lastUpdated: Date.now(),
      };
      savePreferences(newPrefs);
    },
    [preferences, savePreferences]
  );

  const resetToDefaults = useCallback(() => {
    const newPrefs = {
      actions: DEFAULT_ACTIONS,
      rowLayout: 'three' as const,
      lastUpdated: Date.now(),
    };
    savePreferences(newPrefs);
  }, [savePreferences]);

  const getVisibleActions = useCallback(() => {
    return preferences.actions
      .filter((action) => action.visible)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [preferences.actions]);

  const commitChanges = useCallback(() => {
    const newPrefs = {
      ...preferences,
      lastUpdated: Date.now(),
    };
    savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  return {
    preferences,
    isLoaded,
    toggleActionVisibility,
    reorderActions,
    setRowLayout,
    resetToDefaults,
    getVisibleActions,
    commitChanges,
  };
}
