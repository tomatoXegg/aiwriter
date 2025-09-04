import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AccountState } from './types';
import type { Account, AccountFilters, AccountsStats, AccountActivity } from '../types';
import { apiClient } from '../services/api';
import { message } from 'antd';

interface AccountActions {
  setAccounts: (accounts: Account[]) => void;
  setCurrentAccount: (account: Account | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setFilters: (filters: Partial<AccountFilters>) => void;
  setStats: (stats: AccountsStats | null) => void;
  setActivity: (activity: AccountActivity | null) => void;
  
  // Actions
  fetchAccounts: (filters?: AccountFilters) => Promise<void>;
  fetchAccountById: (id: string) => Promise<void>;
  createAccount: (account: any) => Promise<void>;
  updateAccount: (id: string, updates: any) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  activateAccount: (id: string) => Promise<void>;
  deactivateAccount: (id: string) => Promise<void>;
  bulkUpdateStatus: (accountIds: string[], status: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchActivity: () => Promise<void>;
}

export const useAccountStore = create<AccountState & AccountActions>()(
  devtools(
    (set, get) => ({
      accounts: [],
      currentAccount: null,
      loading: false,
      error: null,
      filters: {},
      stats: null,
      activity: null,
      
      setAccounts: (accounts) => set({ accounts }),
      setCurrentAccount: (currentAccount) => set({ currentAccount }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
      setStats: (stats) => set({ stats }),
      setActivity: (activity) => set({ activity }),
      
      fetchAccounts: async (filters?: AccountFilters) => {
        try {
          set({ loading: true, error: null });
          const response = await apiClient.getAccounts(filters);
          set({ 
            accounts: response.accounts || [],
            filters: filters || {}
          });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '获取账号列表失败' });
        } finally {
          set({ loading: false });
        }
      },
      
      fetchAccountById: async (id: string) => {
        try {
          set({ loading: true, error: null });
          const response = await apiClient.getAccountById(id);
          set({ currentAccount: response.data });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '获取账号详情失败' });
        } finally {
          set({ loading: false });
        }
      },
      
      createAccount: async (account: any) => {
        try {
          set({ loading: true, error: null });
          const response = await apiClient.createAccount(account);
          set((state) => ({
            accounts: [...state.accounts, response.data],
          }));
          message.success('账号创建成功');
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '创建账号失败' });
          message.error('创建账号失败');
        } finally {
          set({ loading: false });
        }
      },
      
      updateAccount: async (id: string, updates: any) => {
        try {
          set({ loading: true, error: null });
          const response = await apiClient.updateAccount(id, updates);
          set((state) => ({
            accounts: state.accounts.map((account) =>
              account.id === id ? response.data : account
            ),
            currentAccount: state.currentAccount?.id === id ? response.data : state.currentAccount,
          }));
          message.success('账号更新成功');
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '更新账号失败' });
          message.error('更新账号失败');
        } finally {
          set({ loading: false });
        }
      },
      
      deleteAccount: async (id: string) => {
        try {
          set({ loading: true, error: null });
          await apiClient.deleteAccount(id);
          set((state) => ({
            accounts: state.accounts.filter((account) => account.id !== id),
            currentAccount: state.currentAccount?.id === id ? null : state.currentAccount,
          }));
          message.success('账号删除成功');
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '删除账号失败' });
          message.error('删除账号失败');
        } finally {
          set({ loading: false });
        }
      },
      
      activateAccount: async (id: string) => {
        try {
          set({ loading: true, error: null });
          const response = await apiClient.activateAccount(id);
          set((state) => ({
            accounts: state.accounts.map((account) =>
              account.id === id ? response.data : account
            ),
          }));
          message.success('账号激活成功');
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '激活账号失败' });
          message.error('激活账号失败');
        } finally {
          set({ loading: false });
        }
      },
      
      deactivateAccount: async (id: string) => {
        try {
          set({ loading: true, error: null });
          const response = await apiClient.deactivateAccount(id);
          set((state) => ({
            accounts: state.accounts.map((account) =>
              account.id === id ? response.data : account
            ),
          }));
          message.success('账号停用成功');
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '停用账号失败' });
          message.error('停用账号失败');
        } finally {
          set({ loading: false });
        }
      },
      
      bulkUpdateStatus: async (accountIds: string[], status: string) => {
        try {
          set({ loading: true, error: null });
          await apiClient.bulkUpdateStatus({ accountIds, status: status as any });
          // 重新获取账号列表
          await get().fetchAccounts(get().filters);
          message.success('批量状态更新成功');
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '批量状态更新失败' });
          message.error('批量状态更新失败');
        } finally {
          set({ loading: false });
        }
      },
      
      fetchStats: async () => {
        try {
          set({ loading: true, error: null });
          const response = await apiClient.getAllAccountsStats();
          set({ stats: response.data });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '获取统计数据失败' });
        } finally {
          set({ loading: false });
        }
      },
      
      fetchActivity: async () => {
        try {
          set({ loading: true, error: null });
          const response = await apiClient.getAccountsActivity();
          set({ activity: response.data });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '获取活跃度数据失败' });
        } finally {
          set({ loading: false });
        }
      },
    }),
    { name: 'account-store' }
  )
);