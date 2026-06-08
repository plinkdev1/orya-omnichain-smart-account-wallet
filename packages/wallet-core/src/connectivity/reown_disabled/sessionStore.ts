import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface WalletSession {
  id: string;
  topic: string;
  peerName: string;
  peerMetadata: {
    name: string;
    description?: string;
    url?: string;
    icons?: string[];
  };
  chainId: string;
  chainNamespace: 'eip155' | 'solana' | 'cosmos' | 'sui' | 'other';
  accounts: string[];
  isApproved: boolean;
  createdAt: number;
  expiresAt?: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface SigningRequest {
  id: string;
  sessionId: string;
  method: string;
  params: any;
  chainId: string;
  peerName: string;
  chainNamespace?: 'eip155' | 'solana' | 'cosmos' | 'sui' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'signed' | 'broadcasted' | 'confirmed' | 'failed';
  createdAt: number;
  resolvedAt?: number;
  error?: string;
  signature?: string;
  publicKey?: string;
  rawTransaction?: string;
  txHash?: string;
  confirmations?: number;
  broadcastedAt?: number;
  completedAt?: number;
  metadata?: Record<string, any>;
  result?: {
    signature: string;
    publicKey?: string;
    rawTransaction?: string;
    txHash?: string;
    metadata?: Record<string, any>;
  };
}

export interface SessionStoreState {
  sessions: Map<string, WalletSession>;
  signingQueue: Map<string, SigningRequest>;
  activeSessionId: string | null;
  pendingApprovals: string[];

  addSession: (session: WalletSession) => void;
  updateSession: (id: string, updates: Partial<WalletSession>) => void;
  removeSession: (id: string) => void;
  getSession: (id: string) => WalletSession | undefined;
  getAllSessions: () => WalletSession[];
  setActiveSession: (id: string | null) => void;
  getActiveSession: () => WalletSession | null;

  addSigningRequest: (request: SigningRequest) => void;
  updateSigningRequest: (id: string, updates: Partial<SigningRequest>) => void;
  getSigningRequest: (id: string) => SigningRequest | undefined;
  getPendingSigningRequests: () => SigningRequest[];
  removeSigningRequest: (id: string) => void;

  addPendingApproval: (sessionId: string) => void;
  removePendingApproval: (sessionId: string) => void;
  getPendingApprovals: () => string[];

  clearSessions: () => void;
  clearSigningQueue: () => void;
  reset: () => void;
}

const createSessionStore = () =>
  create<SessionStoreState>()(
    persist(
      (set, get) => ({
        sessions: new Map(),
        signingQueue: new Map(),
        activeSessionId: null,
        pendingApprovals: [],

        addSession: (session: WalletSession) => {
          set(state => {
            const newSessions = new Map(state.sessions);
            newSessions.set(session.id, session);
            return { sessions: newSessions };
          });
        },

        updateSession: (id: string, updates: Partial<WalletSession>) => {
          set(state => {
            const existing = state.sessions.get(id);
            if (!existing) return state;
            const newSessions = new Map(state.sessions);
            newSessions.set(id, { ...existing, ...updates });
            return { sessions: newSessions };
          });
        },

        removeSession: (id: string) => {
          set(state => {
            const newSessions = new Map(state.sessions);
            newSessions.delete(id);
            const newActiveId = state.activeSessionId === id ? null : state.activeSessionId;
            return { 
              sessions: newSessions,
              activeSessionId: newActiveId
            };
          });
        },

        getSession: (id: string) => {
          return get().sessions.get(id);
        },

        getAllSessions: () => {
          return Array.from(get().sessions.values());
        },

        setActiveSession: (id: string | null) => {
          set({ activeSessionId: id });
        },

        getActiveSession: () => {
          const activeId = get().activeSessionId;
          if (!activeId) return null;
          return get().sessions.get(activeId) || null;
        },

        addSigningRequest: (request: SigningRequest) => {
          set(state => {
            const newQueue = new Map(state.signingQueue);
            newQueue.set(request.id, request);
            return { signingQueue: newQueue };
          });
        },

        updateSigningRequest: (id: string, updates: Partial<SigningRequest>) => {
          set(state => {
            const existing = state.signingQueue.get(id);
            if (!existing) return state;
            const newQueue = new Map(state.signingQueue);
            newQueue.set(id, { ...existing, ...updates });
            return { signingQueue: newQueue };
          });
        },

        getSigningRequest: (id: string) => {
          return get().signingQueue.get(id);
        },

        getPendingSigningRequests: () => {
          return Array.from(get().signingQueue.values()).filter(
            req => req.status === 'pending'
          );
        },

        removeSigningRequest: (id: string) => {
          set(state => {
            const newQueue = new Map(state.signingQueue);
            newQueue.delete(id);
            return { signingQueue: newQueue };
          });
        },

        addPendingApproval: (sessionId: string) => {
          set(state => ({
            pendingApprovals: [...new Set([...state.pendingApprovals, sessionId])]
          }));
        },

        removePendingApproval: (sessionId: string) => {
          set(state => ({
            pendingApprovals: state.pendingApprovals.filter(id => id !== sessionId)
          }));
        },

        getPendingApprovals: () => {
          return get().pendingApprovals;
        },

        clearSessions: () => {
          set({ sessions: new Map(), activeSessionId: null });
        },

        clearSigningQueue: () => {
          set({ signingQueue: new Map() });
        },

        reset: () => {
          set({
            sessions: new Map(),
            signingQueue: new Map(),
            activeSessionId: null,
            pendingApprovals: []
          });
        }
      }),
      {
        name: 'orya-wallet-sessions',
        storage: createJSONStorage(() => {
          return {
            getItem: (key: string) => {
              if (typeof window === 'undefined') return null;
              try {
                const data = localStorage.getItem(key);
                if (!data) return null;
                const parsed = JSON.parse(data);
                return {
                  ...parsed,
                  state: {
                    ...parsed.state,
                    sessions: new Map(parsed.state.sessions || []),
                    signingQueue: new Map(parsed.state.signingQueue || [])
                  }
                };
              } catch {
                return null;
              }
            },
            setItem: (key: string, value: any) => {
              if (typeof window === 'undefined') return;
              try {
                const serialized = {
                  ...value,
                  state: {
                    ...value.state,
                    sessions: Array.from(value.state.sessions.entries()),
                    signingQueue: Array.from(value.state.signingQueue.entries())
                  }
                };
                localStorage.setItem(key, JSON.stringify(serialized));
              } catch (e) {
                console.error('Failed to persist session state:', e);
              }
            },
            removeItem: (key: string) => {
              if (typeof window === 'undefined') return;
              localStorage.removeItem(key);
            }
          };
        }),
        partialize: (state) => ({
          sessions: Array.from(state.sessions.entries()),
          signingQueue: Array.from(state.signingQueue.entries()),
          activeSessionId: state.activeSessionId,
          pendingApprovals: state.pendingApprovals
        })
      }
    )
  );

export const useSessionStore = createSessionStore();
