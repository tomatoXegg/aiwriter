import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MaterialState } from './types';

interface MaterialActions {
  setMaterials: (materials: any[]) => void;
  setCurrentMaterial: (material: any | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setFilters: (filters: Partial<MaterialState['filters']>) => void;
  addMaterial: (material: any) => void;
  updateMaterial: (id: string, updates: Partial<any>) => void;
  deleteMaterial: (id: string) => void;
}

export const useMaterialStore = create<MaterialState & MaterialActions>()(
  devtools(
    (set, get) => ({
      materials: [],
      currentMaterial: null,
      loading: false,
      error: null,
      filters: {},
      
      setMaterials: (materials) => set({ materials }),
      setCurrentMaterial: (currentMaterial) => set({ currentMaterial }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      
      addMaterial: (material) =>
        set((state) => ({
          materials: [...state.materials, material],
        })),
      
      updateMaterial: (id, updates) =>
        set((state) => ({
          materials: state.materials.map((material) =>
            material.id === id ? { ...material, ...updates } : material
          ),
        })),
      
      deleteMaterial: (id) =>
        set((state) => ({
          materials: state.materials.filter((material) => material.id !== id),
          currentMaterial: state.currentMaterial?.id === id ? null : state.currentMaterial,
        })),
    }),
    { name: 'material-store' }
  )
);