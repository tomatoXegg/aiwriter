import { create } from 'zustand';
import type { Account, Material, Topic, Content, Review } from '../types';

interface AppState {
  // Accounts
  accounts: Account[];
  currentAccount: Account | null;
  
  // Materials
  materials: Material[];
  currentMaterial: Material | null;
  
  // Topics
  topics: Topic[];
  selectedTopic: Topic | null;
  
  // Content
  contents: Content[];
  currentContent: Content | null;
  
  // Reviews
  reviews: Review[];
  currentReview: Review | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentAccount: (account: Account | null) => void;
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  
  setCurrentMaterial: (material: Material | null) => void;
  setMaterials: (materials: Material[]) => void;
  addMaterial: (material: Material) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  
  setTopics: (topics: Topic[]) => void;
  setSelectedTopic: (topic: Topic | null) => void;
  addTopic: (topic: Topic) => void;
  updateTopic: (id: string, updates: Partial<Topic>) => void;
  
  setCurrentContent: (content: Content | null) => void;
  setContents: (contents: Content[]) => void;
  addContent: (content: Content) => void;
  updateContent: (id: string, updates: Partial<Content>) => void;
  deleteContent: (id: string) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  accounts: [],
  currentAccount: null,
  materials: [],
  currentMaterial: null,
  topics: [],
  selectedTopic: null,
  contents: [],
  currentContent: null,
  reviews: [],
  currentReview: null,
  isLoading: false,
  error: null,
  
  // Actions
  setCurrentAccount: (account) => set({ currentAccount: account }),
  
  setAccounts: (accounts) => set({ accounts }),
  
  addAccount: (account) => set((state) => ({
    accounts: [...state.accounts, account]
  })),
  
  updateAccount: (id, updates) => set((state) => ({
    accounts: state.accounts.map(account =>
      account.id === id ? { ...account, ...updates } : account
    )
  })),
  
  deleteAccount: (id) => set((state) => ({
    accounts: state.accounts.filter(account => account.id !== id),
    currentAccount: state.currentAccount?.id === id ? null : state.currentAccount
  })),
  
  setCurrentMaterial: (material) => set({ currentMaterial: material }),
  
  setMaterials: (materials) => set({ materials }),
  
  addMaterial: (material) => set((state) => ({
    materials: [...state.materials, material]
  })),
  
  updateMaterial: (id, updates) => set((state) => ({
    materials: state.materials.map(material =>
      material.id === id ? { ...material, ...updates } : material
    )
  })),
  
  deleteMaterial: (id) => set((state) => ({
    materials: state.materials.filter(material => material.id !== id),
    currentMaterial: state.currentMaterial?.id === id ? null : state.currentMaterial
  })),
  
  setTopics: (topics) => set({ topics }),
  
  setSelectedTopic: (topic) => set({ selectedTopic: topic }),
  
  addTopic: (topic) => set((state) => ({
    topics: [...state.topics, topic]
  })),
  
  updateTopic: (id, updates) => set((state) => ({
    topics: state.topics.map(topic =>
      topic.id === id ? { ...topic, ...updates } : topic
    )
  })),
  
  setCurrentContent: (content) => set({ currentContent: content }),
  
  setContents: (contents) => set({ contents }),
  
  addContent: (content) => set((state) => ({
    contents: [...state.contents, content]
  })),
  
  updateContent: (id, updates) => set((state) => ({
    contents: state.contents.map(content =>
      content.id === id ? { ...content, ...updates } : content
    )
  })),
  
  deleteContent: (id) => set((state) => ({
    contents: state.contents.filter(content => content.id !== id),
    currentContent: state.currentContent?.id === id ? null : state.currentContent
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null })
}));