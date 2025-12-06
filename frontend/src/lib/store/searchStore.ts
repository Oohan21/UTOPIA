import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PropertyFilters } from '@/lib/types/property'

interface SearchState {
  filters: PropertyFilters
  savedSearches: any[]
  setFilters: (filters: Partial<PropertyFilters>) => void
  resetFilters: () => void
  saveSearch: (name: string) => Promise<void>
  removeSavedSearch: (id: number) => Promise<void>
}

const defaultFilters: PropertyFilters = {
  search: '',
  min_price: undefined,
  max_price: undefined,
  min_bedrooms: undefined,
  max_bedrooms: undefined,
  min_area: undefined,
  max_area: undefined,
  listing_type: undefined,
  property_type: undefined,
  city: undefined,
  sub_city: undefined,
  has_parking: undefined,
  has_garden: undefined,
  has_air_conditioning: undefined,
  has_security: undefined,
  is_featured: undefined,
  is_verified: undefined,
  sort_by: '-created_at',
  order: 'desc',
  page: 1,
  page_size: 20,
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      filters: defaultFilters,
      savedSearches: [],
      
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters, page: 1 }, // Reset to page 1 on filter change
        }))
      },
      
      resetFilters: () => set({ filters: defaultFilters }),
      
      saveSearch: async (name: string) => {
        const { filters, savedSearches } = get()
        
        // Call API to save search
        try {
          const { listingsApi } = await import('@/lib/api/listings')
          const response = await listingsApi.createSavedSearch({
            name,
            filters,
          })
          
          set({
            savedSearches: [...savedSearches, response],
          })
        } catch (error) {
          console.error('Failed to save search:', error)
        }
      },
      
      removeSavedSearch: async (id: number) => {
        try {
          const { listingsApi } = await import('@/lib/api/listings')
          await listingsApi.deleteSavedSearch(id)
          
          set((state) => ({
            savedSearches: state.savedSearches.filter((search) => search.id !== id),
          }))
        } catch (error) {
          console.error('Failed to remove saved search:', error)
        }
      },
    }),
    {
      name: 'search-store',
      partialize: (state) => ({
        savedSearches: state.savedSearches,
      }),
    }
  )
)