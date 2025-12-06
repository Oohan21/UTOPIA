// lib/store/comparisonStore.ts
import { create } from 'zustand'
import { Property } from '@/lib/types/property'

interface ComparisonStore {
  properties: Property[]
  addToComparison: (property: Property) => void
  removeFromComparison: (propertyId: number) => void
  clearComparison: () => void
  isInComparison: (propertyId: number) => boolean
}

export const useComparisonStore = create<ComparisonStore>((set, get) => ({
  properties: [],
  addToComparison: (property) => {
    if (get().properties.length >= 10) {
      alert('Cannot compare more than 10 properties')
      return
    }
    if (!get().isInComparison(property.id)) {
      set((state) => ({
        properties: [...state.properties, property]
      }))
    }
  },
  removeFromComparison: (propertyId) => {
    set((state) => ({
      properties: state.properties.filter(p => p.id !== propertyId)
    }))
  },
  clearComparison: () => set({ properties: [] }),
  isInComparison: (propertyId) => {
    return get().properties.some(p => p.id === propertyId)
  }
}))