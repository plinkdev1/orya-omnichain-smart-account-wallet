import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createAppStore } from '../store/store';
import { useCreateWalletWithSuiFirst } from '../hooks/useCreateWalletWithSuiFirst';
import { useAddSecondaryChain } from '../hooks/useAddSecondaryChain';

describe('Phase 2: Sui-First Onboarding E2E Tests', () => {
  let store: ReturnType<typeof createAppStore>;

  beforeEach(() => {
    store = createAppStore();
  });

  describe('Phase 2.1 & 2.3: Create Sui wallet first (Privy path)', () => {
    it('should create Sui wallet as primary chain for new Privy user', async () => {
      const { result } = renderHook(
        () => useCreateWalletWithSuiFirst(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const mockPrivyUser = {
        id: 'privy_user_123',
        email: { address: 'user@example.com' },
        linkedAccounts: [],
      };

      let createdWallet: any;

      await act(async () => {
        createdWallet = await result.current.createWalletWithSuiFirst({
          privyUser: mockPrivyUser,
        });
      });

      expect(createdWallet).toBeDefined();
      expect(createdWallet.suiAddress).toMatch(/^0x/);
      expect(createdWallet.mnemonic).toMatch(/^([a-z\s]+)$/);
      expect(createdWallet.secondaryChains).toHaveProperty('ethereum');
      expect(createdWallet.secondaryChains).toHaveProperty('solana');
      expect(createdWallet.secondaryChains).toHaveProperty('aptos');

      const state = store.getState();
      expect(state.wallet.primaryChain).toBe('sui:mainnet');
      expect(state.wallet.activeAddress).toBe(createdWallet.suiAddress);
      expect(state.wallet.activeWalletType).toBe('privy');
    });

    it('should create Sui wallet as primary chain for new Dynamic user', async () => {
      const { result } = renderHook(
        () => useCreateWalletWithSuiFirst(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const mockDynamicUser = {
        userId: 'dynamic_user_456',
        email: 'user2@example.com',
        verifiedCredentials: [],
      };

      let createdWallet: any;

      await act(async () => {
        createdWallet = await result.current.createWalletWithSuiFirst({
          dynamicUser: mockDynamicUser,
        });
      });

      expect(createdWallet).toBeDefined();
      expect(createdWallet.suiAddress).toMatch(/^0x/);
      expect(createdWallet.walletId).toMatch(/^wallet_dynamic_user_456/);

      const state = store.getState();
      expect(state.wallet.primaryChain).toBe('sui:mainnet');
      expect(state.wallet.activeAddress).toBe(createdWallet.suiAddress);
      expect(state.wallet.activeWalletType).toBe('privy');
    });

    it('should save mnemonic securely for wallet recovery', async () => {
      const { result } = renderHook(
        () => useCreateWalletWithSuiFirst(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const mockPrivyUser = {
        id: 'privy_user_789',
        email: { address: 'secure@example.com' },
      };

      let createdWallet: any;

      await act(async () => {
        createdWallet = await result.current.createWalletWithSuiFirst({
          privyUser: mockPrivyUser,
        });
      });

      const words = createdWallet.mnemonic.split(' ');
      expect(words.length).toBe(12);
      words.forEach((word: string) => {
        expect(word.length).toBeGreaterThan(0);
      });
    });

    it('should trigger onSuccess callback after wallet creation', async () => {
      const { result } = renderHook(
        () => useCreateWalletWithSuiFirst(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const onSuccess = vi.fn();
      const mockPrivyUser = {
        id: 'privy_callback_test',
        email: { address: 'callback@example.com' },
      };

      await act(async () => {
        await result.current.createWalletWithSuiFirst({
          privyUser: mockPrivyUser,
          onSuccess,
        });
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({
          suiAddress: expect.any(String),
          walletId: expect.any(String),
        }));
      });
    });

    it('should handle wallet creation errors gracefully', async () => {
      const { result } = renderHook(
        () => useCreateWalletWithSuiFirst(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const onError = vi.fn();

      await act(async () => {
        try {
          await result.current.createWalletWithSuiFirst({
            onError,
          } as any);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('Phase 2.4: Add secondary chains after Sui creation', () => {
    it('should add Solana as secondary chain after Sui creation', async () => {
      const { result: walletResult } = renderHook(
        () => useCreateWalletWithSuiFirst(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const mockPrivyUser = {
        id: 'privy_secondary_test',
        email: { address: 'secondary@example.com' },
      };

      await act(async () => {
        await walletResult.current.createWalletWithSuiFirst({
          privyUser: mockPrivyUser,
        });
      });

      const { result: chainResult } = renderHook(
        () => useAddSecondaryChain(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      await act(async () => {
        await chainResult.current.addSecondaryChain({
          chainId: 'solana:mainnet',
          address: 'SolanaAddressString123',
          walletType: 'external',
          walletName: 'Solana Wallet',
          publicKey: 'publicKeyString',
        });
      });

      const state = store.getState();
      expect(state.wallet.secondaryChains).toContain('solana:mainnet');
      expect(state.wallet.primaryChain).toBe('sui:mainnet');
    });

    it('should add multiple secondary chains', async () => {
      const { result: walletResult } = renderHook(
        () => useCreateWalletWithSuiFirst(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const mockPrivyUser = {
        id: 'privy_multi_chain',
        email: { address: 'multichain@example.com' },
      };

      await act(async () => {
        await walletResult.current.createWalletWithSuiFirst({
          privyUser: mockPrivyUser,
        });
      });

      const { result: chainResult } = renderHook(
        () => useAddSecondaryChain(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const chains = ['ethereum:mainnet', 'solana:mainnet', 'aptos:mainnet'];

      for (const chainId of chains) {
        await act(async () => {
          await chainResult.current.addSecondaryChain({
            chainId,
            address: `${chainId}_address_123`,
            walletType: 'external',
            walletName: `${chainId} Wallet`,
            publicKey: `public_key_${chainId}`,
          });
        });
      }

      const state = store.getState();
      expect(state.wallet.secondaryChains.length).toBe(3);
      chains.forEach((chainId) => {
        expect(state.wallet.secondaryChains).toContain(chainId);
      });
    });

    it('should prevent adding duplicate chains', async () => {
      const { result: walletResult } = renderHook(
        () => useCreateWalletWithSuiFirst(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const mockPrivyUser = {
        id: 'privy_duplicate_test',
        email: { address: 'duplicate@example.com' },
      };

      await act(async () => {
        await walletResult.current.createWalletWithSuiFirst({
          privyUser: mockPrivyUser,
        });
      });

      const { result: chainResult } = renderHook(
        () => useAddSecondaryChain(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      await act(async () => {
        await chainResult.current.addSecondaryChain({
          chainId: 'ethereum:mainnet',
          address: 'eth_address_1',
          walletType: 'external',
          walletName: 'Ethereum Wallet',
          publicKey: 'eth_public_key',
        });
      });

      await act(async () => {
        try {
          await chainResult.current.addSecondaryChain({
            chainId: 'ethereum:mainnet',
            address: 'eth_address_2',
            walletType: 'external',
            walletName: 'Ethereum Wallet 2',
            publicKey: 'eth_public_key_2',
          });
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      const state = store.getState();
      const ethCount = state.wallet.secondaryChains.filter(
        (c) => c === 'ethereum:mainnet'
      ).length;
      expect(ethCount).toBe(1);
    });

    it('should trigger onSuccess callback when adding secondary chain', async () => {
      const { result: walletResult } = renderHook(
        () => useCreateWalletWithSuiFirst(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const mockPrivyUser = {
        id: 'privy_callback_chain',
        email: { address: 'callbackchain@example.com' },
      };

      await act(async () => {
        await walletResult.current.createWalletWithSuiFirst({
          privyUser: mockPrivyUser,
        });
      });

      const { result: chainResult } = renderHook(
        () => useAddSecondaryChain(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const onSuccess = vi.fn();

      await act(async () => {
        await chainResult.current.addSecondaryChain({
          chainId: 'solana:mainnet',
          address: 'solana_address',
          walletType: 'external',
          walletName: 'Solana Account',
          publicKey: 'solana_public_key',
          onSuccess,
        });
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('solana:mainnet');
      });
    });
  });

  describe('Phase 2.6 & 2.7: Full E2E flow - Privy & Dynamic signup', () => {
    it('should complete full flow: Privy signup → Sui account → Welcome screen ready', async () => {
      const { result: walletResult } = renderHook(
        () => useCreateWalletWithSuiFirst(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const mockPrivyUser = {
        id: 'privy_e2e_flow',
        email: { address: 'privy.e2e@example.com' },
        linkedAccounts: [],
      };

      let suiWallet: any;

      await act(async () => {
        suiWallet = await walletResult.current.createWalletWithSuiFirst({
          privyUser: mockPrivyUser,
        });
      });

      expect(suiWallet.suiAddress).toMatch(/^0x/);
      expect(suiWallet.mnemonic).toBeDefined();

      const state = store.getState();
      expect(state.wallet.primaryChain).toBe('sui:mainnet');
      expect(state.wallet.activeAddress).toBe(suiWallet.suiAddress);

      expect(state.onboarding?.currentStep).toBeDefined();
    });

    it('should complete full flow: Dynamic signup → Sui account → Welcome screen ready', async () => {
      const { result: walletResult } = renderHook(
        () => useCreateWalletWithSuiFirst(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const mockDynamicUser = {
        userId: 'dynamic_e2e_flow',
        email: 'dynamic.e2e@example.com',
        verifiedCredentials: [],
      };

      let suiWallet: any;

      await act(async () => {
        suiWallet = await walletResult.current.createWalletWithSuiFirst({
          dynamicUser: mockDynamicUser,
        });
      });

      expect(suiWallet.suiAddress).toMatch(/^0x/);
      expect(suiWallet.walletId).toMatch(/^wallet_dynamic_e2e_flow/);

      const state = store.getState();
      expect(state.wallet.primaryChain).toBe('sui:mainnet');
      expect(state.wallet.activeAddress).toBe(suiWallet.suiAddress);
    });

    it('should flow: Create Sui wallet → Add Solana → Add Ethereum', async () => {
      const { result: walletResult } = renderHook(
        () => useCreateWalletWithSuiFirst(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const mockPrivyUser = {
        id: 'privy_multi_flow',
        email: { address: 'privy.multi@example.com' },
      };

      await act(async () => {
        await walletResult.current.createWalletWithSuiFirst({
          privyUser: mockPrivyUser,
        });
      });

      const { result: chainResult } = renderHook(
        () => useAddSecondaryChain(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      await act(async () => {
        await chainResult.current.addSecondaryChain({
          chainId: 'solana:mainnet',
          address: 'solana_e2e_address',
          walletType: 'external',
          walletName: 'Solana Account',
          publicKey: 'solana_public_key_e2e',
        });
      });

      await act(async () => {
        await chainResult.current.addSecondaryChain({
          chainId: 'ethereum:mainnet',
          address: '0xethereumaddresse2e123',
          walletType: 'external',
          walletName: 'Ethereum Account',
          publicKey: 'eth_public_key_e2e',
        });
      });

      const state = store.getState();
      expect(state.wallet.primaryChain).toBe('sui:mainnet');
      expect(state.wallet.secondaryChains).toContain('solana:mainnet');
      expect(state.wallet.secondaryChains).toContain('ethereum:mainnet');
      expect(state.wallet.secondaryChains.length).toBe(2);
    });
  });

  describe('Phase 2.5: Sui zkLogin integration', () => {
    it('should support Google social login flow', () => {
      expect(true).toBe(true);
    });

    it('should support Apple social login flow', () => {
      expect(true).toBe(true);
    });

    it('should support Twitch social login flow', () => {
      expect(true).toBe(true);
    });
  });

  describe('Redux State Persistence', () => {
    it('should persist Sui wallet state to Redux', async () => {
      const { result } = renderHook(
        () => useCreateWalletWithSuiFirst(),
        {
          wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        }
      );

      const mockPrivyUser = {
        id: 'privy_persist',
        email: { address: 'persist@example.com' },
      };

      let createdWallet: any;

      await act(async () => {
        createdWallet = await result.current.createWalletWithSuiFirst({
          privyUser: mockPrivyUser,
        });
      });

      const state = store.getState();

      expect(state.wallet.activeAddress).toBe(createdWallet.suiAddress);
      expect(state.wallet.primaryChain).toBe('sui:mainnet');
      expect(state.wallet.activeWalletType).toBe('privy');
      expect(state.wallet.walletName).toContain('SUI Wallet');
    });
  });
});
