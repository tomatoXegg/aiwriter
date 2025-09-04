import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AppState } from './types';

interface AppStore extends AppState {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        app: {
          loading: false,
          error: null,
          theme: 'light',
        },
        setLoading: (loading) =>
          set((state) => ({
            app: { ...state.app, loading },
          })),
        setError: (error) =>
          set((state) => ({
            app: { ...state.app, error },
          })),
        clearError: () =>
          set((state) => ({
            app: { ...state.app, error: null },
          })),
        setTheme: (theme) =>
          set((state) => ({
            app: { ...state.app, theme },
          })),
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({ app: state.app }),
      }
    ),
    { name: 'app-store' }
  )
);