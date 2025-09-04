import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AccountState } from './types';

interface AccountActions {
  setAccounts: (accounts: any[]) => void;
  setCurrentAccount: (account: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  addAccount: (account: any) => void;
  updateAccount: (id: string, updates: Partial<any>) => void;
  deleteAccount: (id: string) => void;
}

export const useAccountStore = create<AccountState & AccountActions>()(
  devtools(
    (set, get) => ({
      accounts: [],
      currentAccount: null,
      loading: false,
      error: null,
      
      setAccounts: (accounts) => set({ accounts }),
      setCurrentAccount: (currentAccount) => set({ currentAccount }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      addAccount: (account) =>
        set((state) => ({
          accounts: [...state.accounts, account],
        })),
      
      updateAccount: (id, updates) =>
        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.id === id ? { ...account, ...updates } : account
          ),
        })),
      
      deleteAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((account) => account.id !== id),
          currentAccount: state.currentAccount?.id === id ? null : state.currentAccount,
        })),
    }),
    { name: 'account-store' }
  )
);