import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ContentState } from './types';

interface ContentActions {
  setContents: (contents: any[]) => void;
  setCurrentContent: (content: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setFilters: (filters: Partial<ContentState['filters']>) => void;
  addContent: (content: any) => void;
  updateContent: (id: string, updates: Partial<any>) => void;
  deleteContent: (id: string) => void;
}

export const useContentStore = create<ContentState & ContentActions>()(
  devtools(
    (set, get) => ({
      contents: [],
      currentContent: null,
      loading: false,
      error: null,
      filters: {},
      
      setContents: (contents) => set({ contents }),
      setCurrentContent: (currentContent) => set({ currentContent }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      
      addContent: (content) =>
        set((state) => ({
          contents: [...state.contents, content],
        })),
      
      updateContent: (id, updates) =>
        set((state) => ({
          contents: state.contents.map((content) =>
            content.id === id ? { ...content, ...updates } : content
          ),
        })),
      
      deleteContent: (id) =>
        set((state) => ({
          contents: state.contents.filter((content) => content.id !== id),
          currentContent: state.currentContent?.id === id ? null : state.currentContent,
        })),
    }),
    { name: 'content-store' }
  )
);