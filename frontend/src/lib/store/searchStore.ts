// searchStore.ts - enhanced version
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PropertyFilters } from '@/lib/types/property'

interface SearchHistoryItem {
  id: number
  query?: string
  filters: PropertyFilters
  results_count?: number
  created_at: string
  search_type: 'manual' | 'saved_search' | 'quick_filter'
}

interface SearchState {
  filters: PropertyFilters
  savedSearches: any[]
  searchHistory: SearchHistoryItem[]
  popularSearches: any[]
  recentSearches: SearchHistoryItem[]
  isLoading: boolean

  setFilters: (filters: Partial<PropertyFilters>) => void
  resetFilters: () => void

  // Search history methods
  addToHistory: (searchData: {
    query?: string;
    filters?: PropertyFilters;
    results_count?: number;
    search_type?: 'manual' | 'saved_search' | 'quick_filter'; // Added search_type
  }) => Promise<void>

  loadSearchHistory: () => Promise<void>
  clearSearchHistory: () => Promise<void>
  deleteSearchHistoryItem: (id: number) => Promise<void>

  // Saved searches
  saveSearch: (name: string) => Promise<void>
  removeSavedSearch: (id: number) => Promise<void>
  loadSavedSearches: () => Promise<void>

  // Popular searches
  loadPopularSearches: () => Promise<void>

  // Suggestions
  getSearchSuggestions: (query: string) => Promise<string[]>
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
      searchHistory: [],
      popularSearches: [],
      recentSearches: [],
      isLoading: false,

      setFilters: (newFilters) => {
        const state = get()
        const updatedFilters = { ...state.filters, ...newFilters, page: 1 }

        // Auto-save to history after a delay
        const saveToHistory = async () => {
          if (newFilters.search || Object.keys(newFilters).some(key =>
            key !== 'page' && key !== 'page_size' &&
            newFilters[key] !== undefined && newFilters[key] !== ''
          )) {
            try {
              await get().addToHistory({
                query: newFilters.search,
                filters: updatedFilters,
                results_count: 0,
                search_type: 'manual' as const
              })
            } catch (error) {
              console.error('Failed to save to search history:', error)
            }
          }
        }

        // Debounce history saving
        setTimeout(saveToHistory, 1000)

        set({ filters: updatedFilters })
      },

      resetFilters: () => set({ filters: defaultFilters }),

      addToHistory: async (searchData) => {
        try {
          const { listingsApi } = await import('@/lib/api/listings')
          const response = await listingsApi.saveSearchToHistory(searchData)

          // Create a properly typed history item with fallbacks
          const historyItem: SearchHistoryItem = {
            id: response.id || Date.now(),
            query: response.query || searchData.query || '',
            filters: response.filters || searchData.filters || {},
            results_count: response.results_count || searchData.results_count || 0,
            created_at: response.created_at || new Date().toISOString(),
            search_type: response.search_type || searchData.search_type || 'manual'
          }

          set((state) => ({
            searchHistory: [historyItem, ...(Array.isArray(state.searchHistory) ? state.searchHistory.slice(0, 49) : [])],
            recentSearches: [historyItem, ...(Array.isArray(state.recentSearches) ? state.recentSearches.slice(0, 9) : [])]
          }))
        } catch (error) {
          console.error('Failed to add to search history:', error)
          // Fallback to local storage if API fails
          const historyItem: SearchHistoryItem = {
            id: Date.now(),
            query: searchData.query || '',
            filters: searchData.filters || {},
            results_count: searchData.results_count || 0,
            created_at: new Date().toISOString(),
            search_type: searchData.search_type || 'manual'
          }

          set((state) => ({
            searchHistory: [historyItem, ...(Array.isArray(state.searchHistory) ? state.searchHistory.slice(0, 49) : [])],
            recentSearches: [historyItem, ...(Array.isArray(state.recentSearches) ? state.recentSearches.slice(0, 9) : [])]
          }))
        }
      },

      loadSearchHistory: async () => {
        set({ isLoading: true })
        try {
          const { listingsApi } = await import('@/lib/api/listings')
          const history = await listingsApi.getSearchHistory()

          // Transform API response to SearchHistoryItem type
          const typedHistory: SearchHistoryItem[] = history.map((item: any) => ({
            id: item.id,
            query: item.query,
            filters: item.filters || {},
            results_count: item.results_count || 0,
            created_at: item.created_at,
            search_type: item.search_type || 'manual'
          }))

          const recent = typedHistory.slice(0, 10)
          set({
            searchHistory: typedHistory,
            recentSearches: recent,
            isLoading: false
          })
        } catch (error) {
          console.error('Failed to load search history:', error)
          set({ isLoading: false })
        }
      },

      clearSearchHistory: async () => {
        try {
          const { listingsApi } = await import('@/lib/api/listings')
          await listingsApi.clearSearchHistory()
          set({ searchHistory: [], recentSearches: [] })
        } catch (error) {
          console.error('Failed to clear search history:', error)
          set({ searchHistory: [], recentSearches: [] })
        }
      },

      deleteSearchHistoryItem: async (id: number) => {
        try {
          const { listingsApi } = await import('@/lib/api/listings')
          await listingsApi.deleteSearchHistory(id)

          set((state) => ({
            searchHistory: Array.isArray(state.searchHistory) ? state.searchHistory.filter(item => item.id !== id) : [],
            recentSearches: Array.isArray(state.recentSearches) ? state.recentSearches.filter(item => item.id !== id) : []
          }))
        } catch (error) {
          console.error('Failed to delete search history item:', error)
          set((state) => ({
            searchHistory: Array.isArray(state.searchHistory) ? state.searchHistory.filter(item => item.id !== id) : [],
            recentSearches: Array.isArray(state.recentSearches) ? state.recentSearches.filter(item => item.id !== id) : []
          }))
        }
      },

      saveSearch: async (name: string) => {
        const { filters } = get()

        try {
          const { listingsApi } = await import('@/lib/api/listings')
          const response = await listingsApi.createSavedSearch({
            name,
            filters,
          })

          // Also add to history
          await get().addToHistory({
            query: filters.search,
            filters,
            results_count: 0,
            search_type: 'saved_search' as const
          })

          set((state) => ({
            savedSearches: Array.isArray(state.savedSearches) ? [...state.savedSearches, response] : [response],
          }))
        } catch (error) {
          console.error('Failed to save search:', error)
          throw error
        }
      },

      removeSavedSearch: async (id: number) => {
        try {
          const { listingsApi } = await import('@/lib/api/listings')
          await listingsApi.deleteSavedSearch(id)

          set((state) => ({
            savedSearches: Array.isArray(state.savedSearches)
              ? state.savedSearches.filter((search) => search.id !== id)
              : [],
          }))
        } catch (error) {
          console.error('Failed to remove saved search:', error)
          throw error
        }
      },

      loadSavedSearches: async () => {
        try {
          const { listingsApi } = await import('@/lib/api/listings')
          const savedSearches = await listingsApi.getSavedSearches()
          set({ savedSearches: Array.isArray(savedSearches) ? savedSearches : [] })
        } catch (error) {
          console.error('Failed to load saved searches:', error)
          set({ savedSearches: [] })
        }
      },

      loadPopularSearches: async () => {
        try {
          const { listingsApi } = await import('@/lib/api/listings')
          const popularSearches = await listingsApi.getPopularSearches(10)
          set({ popularSearches: Array.isArray(popularSearches) ? popularSearches : [] })
        } catch (error) {
          console.error('Failed to load popular searches:', error)
          set({ popularSearches: [] })
        }
      },

      getSearchSuggestions: async (query: string): Promise<string[]> => {
        if (!query.trim()) return []

        try {
          const { listingsApi } = await import('@/lib/api/listings')
          const suggestions = await listingsApi.getSearchSuggestions(query)
          return Array.isArray(suggestions) ? suggestions : []
        } catch (error) {
          console.error('Failed to get search suggestions:', error)

          // Fallback: get suggestions from recent searches
          const { recentSearches } = get()
          const recentQueries = recentSearches
            .map(item => item.query)
            .filter((query): query is string => !!query && query.toLowerCase().includes(query.toLowerCase()))

          return [...new Set(recentQueries)].slice(0, 5)
        }
      },
    }),
    {
      name: 'search-store',
      partialize: (state) => ({
        savedSearches: state.savedSearches || [],
        recentSearches: (state.recentSearches || []).slice(0, 10), // Store only 10 recent
        filters: state.filters,
      }),
    }
  )
)