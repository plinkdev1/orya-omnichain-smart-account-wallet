import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VaultActionId = 
  | 'send' 
  | 'receive' 
  | 'swap' 
  | 'bridge' 
  | 'stake' 
  | 'borrow' 
  | 'lend' 
  | 'yield'
  | 'nft'
  | 'portfolio'
  | 'defi'
  | 'dapp';

export interface VaultAction {
  id: VaultActionId;
  label: string;
  icon: string;
  visible: boolean;
  order: number;
}

export interface VaultCustomizationState {
  actions: Record<VaultActionId, VaultAction>;
  visibleActions: VaultActionId[];
  actionOrder: VaultActionId[];
  toggleAction: (id: VaultActionId) => void;
  reorderActions: (newOrder: VaultActionId[]) => void;
  resetToDefault: () => void;
  getVisibleActions: () => VaultAction[];
  moveAction: (id: VaultActionId, direction: 'up' | 'down') => void;
}

const DEFAULT_ACTIONS: Record<VaultActionId, VaultAction> = {
  send: { id: 'send', label: 'Send', icon: '📤', visible: true, order: 0 },
  receive: { id: 'receive', label: 'Receive', icon: '📥', visible: true, order: 1 },
  swap: { id: 'swap', label: 'Swap', icon: '🔄', visible: true, order: 2 },
  bridge: { id: 'bridge', label: 'Bridge', icon: '🌉', visible: true, order: 3 },
  stake: { id: 'stake', label: 'Stake', icon: '🏛️', visible: true, order: 4 },
  borrow: { id: 'borrow', label: 'Borrow', icon: '💰', visible: false, order: 5 },
  lend: { id: 'lend', label: 'Lend', icon: '💸', visible: false, order: 6 },
  yield: { id: 'yield', label: 'Yield', icon: '📈', visible: false, order: 7 },
  nft: { id: 'nft', label: 'NFT', icon: '🎨', visible: false, order: 8 },
  portfolio: { id: 'portfolio', label: 'Portfolio', icon: '📊', visible: true, order: 9 },
  defi: { id: 'defi', label: 'DeFi', icon: '🔗', visible: false, order: 10 },
  dapp: { id: 'dapp', label: 'dApp', icon: '🌐', visible: false, order: 11 },
};

export const useVaultCustomizationStore = create<VaultCustomizationState>()(
  persist(
    (set, get) => {
      const defaultVisibleActions: VaultActionId[] = Object.entries(DEFAULT_ACTIONS)
        .filter(([_, action]) => action.visible)
        .map(([id, _]) => id as VaultActionId)
        .sort((a, b) => DEFAULT_ACTIONS[a].order - DEFAULT_ACTIONS[b].order);

      return {
        actions: DEFAULT_ACTIONS,
        visibleActions: defaultVisibleActions,
        actionOrder: Object.keys(DEFAULT_ACTIONS) as VaultActionId[],

        toggleAction: (id: VaultActionId) => {
          set((state) => {
            const action = state.actions[id];
            const newAction = { ...action, visible: !action.visible };

            let newVisibleActions = state.visibleActions;
            if (newAction.visible) {
              newVisibleActions = [...newVisibleActions, id].sort(
                (a, b) => state.actions[a].order - state.actions[b].order
              );
            } else {
              newVisibleActions = newVisibleActions.filter((aid) => aid !== id);
            }

            return {
              actions: { ...state.actions, [id]: newAction },
              visibleActions: newVisibleActions,
            };
          });
        },

        reorderActions: (newOrder: VaultActionId[]) => {
          set((state) => {
            const updatedActions = { ...state.actions };
            newOrder.forEach((id, index) => {
              if (updatedActions[id]) {
                updatedActions[id] = { ...updatedActions[id], order: index };
              }
            });

            return {
              actions: updatedActions,
              actionOrder: newOrder,
              visibleActions: newOrder.filter((id) => updatedActions[id]?.visible),
            };
          });
        },

        moveAction: (id: VaultActionId, direction: 'up' | 'down') => {
          const state = get();
          const currentIndex = state.visibleActions.indexOf(id);

          if (currentIndex === -1) return;

          const newOrder = [...state.visibleActions];
          if (direction === 'up' && currentIndex > 0) {
            [newOrder[currentIndex], newOrder[currentIndex - 1]] = [
              newOrder[currentIndex - 1],
              newOrder[currentIndex],
            ];
          } else if (direction === 'down' && currentIndex < newOrder.length - 1) {
            [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
              newOrder[currentIndex + 1],
              newOrder[currentIndex],
            ];
          }

          get().reorderActions(newOrder);
        },

        getVisibleActions: () => {
          const state = get();
          return state.visibleActions
            .map((id) => state.actions[id])
            .sort((a, b) => a.order - b.order);
        },

        resetToDefault: () => {
          const defaultVisibleActions: VaultActionId[] = Object.entries(DEFAULT_ACTIONS)
            .filter(([_, action]) => action.visible)
            .map(([id, _]) => id as VaultActionId)
            .sort((a, b) => DEFAULT_ACTIONS[a].order - DEFAULT_ACTIONS[b].order);

          set({
            actions: DEFAULT_ACTIONS,
            visibleActions: defaultVisibleActions,
            actionOrder: Object.keys(DEFAULT_ACTIONS) as VaultActionId[],
          });
        },
      };
    },
    {
      name: 'vault-customization-store',
      partialize: (state) => ({
        visibleActions: state.visibleActions,
        actionOrder: state.actionOrder,
        actions: state.actions,
      }),
    }
  )
);
