import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TopicState } from './types';

interface TopicActions {
  setTopics: (topics: any[]) => void;
  setCurrentTopic: (topic: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setFilters: (filters: Partial<TopicState['filters']>) => void;
  addTopic: (topic: any) => void;
  updateTopic: (id: string, updates: Partial<any>) => void;
  deleteTopic: (id: string) => void;
}

export const useTopicStore = create<TopicState & TopicActions>()(
  devtools(
    (set, get) => ({
      topics: [],
      currentTopic: null,
      loading: false,
      error: null,
      filters: {},
      
      setTopics: (topics) => set({ topics }),
      setCurrentTopic: (currentTopic) => set({ currentTopic }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      
      addTopic: (topic) =>
        set((state) => ({
          topics: [...state.topics, topic],
        })),
      
      updateTopic: (id, updates) =>
        set((state) => ({
          topics: state.topics.map((topic) =>
            topic.id === id ? { ...topic, ...updates } : topic
          ),
        })),
      
      deleteTopic: (id) =>
        set((state) => ({
          topics: state.topics.filter((topic) => topic.id !== id),
          currentTopic: state.currentTopic?.id === id ? null : state.currentTopic,
        })),
    }),
    { name: 'topic-store' }
  )
);