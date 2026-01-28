// components/listings/SearchHistory.tsx
import React, { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { useSearchStore } from '@/lib/store/searchStore'
import { useQuery } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
import {
  History,
  TrendingUp,
  X,
  Search,
  Clock,
  Star,
  Trash2,
  ChevronRight,
  Filter,
  Bookmark
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { ScrollArea } from '@/components/ui/Scroll-area'
import { Skeleton } from '@/components/ui/Skeleton'
import { PropertyFilters } from '@/lib/types/property'

interface SearchHistoryProps {
  onSelectSearch: (filters: PropertyFilters) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function SearchHistory({
  onSelectSearch,
  searchQuery,
  onSearchChange
}: SearchHistoryProps) {
  const searchStore = useSearchStore()
  const [showHistory, setShowHistory] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load search history and saved searches on mount
  useEffect(() => {
    searchStore.loadSearchHistory()
    searchStore.loadPopularSearches()
    searchStore.loadSavedSearches()
  }, [])

  // Load suggestions when query changes
  useEffect(() => {
    const loadSuggestions = async () => {
      if (searchQuery.length >= 2) {
        setIsLoadingSuggestions(true)
        try {
          const suggestions = await searchStore.getSearchSuggestions(searchQuery)
          setSuggestions(suggestions)
        } catch (error) {
          console.error('Failed to load suggestions:', error)
        } finally {
          setIsLoadingSuggestions(false)
        }
      } else {
        setSuggestions([])
      }
    }

    const timeoutId = setTimeout(loadSuggestions, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSelect = (searchItem: any) => {
    onSelectSearch(searchItem.filters)
    setShowHistory(false)

    // Save to history if not already there
    if (!searchStore.recentSearches.some(item => item.id === searchItem.id)) {
      searchStore.addToHistory({
        query: searchItem.query,
        filters: searchItem.filters,
        results_count: searchItem.results_count,
        search_type: 'manual'
      })
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onSearchChange(suggestion)
    setShowHistory(false)
  }

  const handleClearHistory = async () => {
    await searchStore.clearSearchHistory()
  }

  const handleDeleteHistoryItem = async (id: number) => {
    await searchStore.deleteSearchHistoryItem(id)
  }

  // Load popular searches
  const { data: popularSearches = [] } = useQuery({
    queryKey: ['popular-searches'],
    queryFn: () => listingsApi.getPopularSearches(5),
    staleTime: 5 * 60 * 1000,
  })

  // Load promoted recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['promoted-recommendations'],
    queryFn: async () => {
      const response = await listingsApi.getProperties({ is_promoted: true, page_size: 3 })
      return Array.isArray(response.results) ? response.results : []
    },
    staleTime: 10 * 60 * 1000,
  })

  // Helper to generate descriptive text for filter-only searches
  const getFilterSummary = (filters: PropertyFilters) => {
    const parts = []

    if (filters.property_type) {
      const type = filters.property_type.charAt(0).toUpperCase() + filters.property_type.slice(1)
      parts.push(type)
    } else {
      parts.push('Properties')
    }

    if (filters.listing_type) {
      parts.push(filters.listing_type === 'for_sale' ? 'for Sale' : 'for Rent')
    }

    if (filters.city) {
      // Note: city is ID in filters, ideally we'd have the name. 
      // For now we'll use generic indicators or just skip if name isn't handy
      parts.push('in selected location')
    }

    if (parts.length === 1 && parts[0] === 'Properties') {
      return 'Advanced Search'
    }

    return parts.join(' ')
  }

  // Recent searches and saved searches from store with safety guards
  const recentSearches = Array.isArray(searchStore.recentSearches) ? searchStore.recentSearches.slice(0, 5) : []
  const savedSearches = Array.isArray(searchStore.savedSearches) ? searchStore.savedSearches.slice(0, 5) : []

  return (
    <div className="relative w-full">
      <div className="relative" ref={suggestionsRef}>
        <Input
          ref={inputRef}
          placeholder="Search properties, locations, keywords..."
          value={searchQuery}
          onChange={(e) => {
            onSearchChange(e.target.value)
            setShowHistory(true)
          }}
          onFocus={() => setShowHistory(true)}
          className="h-11 pl-10 pr-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
          startIcon={<Search className="h-4 w-4 text-muted-foreground" />}
          endIcon={
            searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('')
                  setShowHistory(false)
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
            )
          }
        />

        {showHistory && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-2xl border-muted bg-popover/95 backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <CardContent className="p-2">
              <ScrollArea className="max-h-[70vh]">
                {/* Search Suggestions */}
                {searchQuery.length >= 2 && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between px-3 py-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        Suggestions
                      </h4>
                      {isLoadingSuggestions && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {Array.isArray(suggestions) && suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-3 py-2.5 hover:bg-accent rounded-md flex items-center justify-between text-sm transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                            <span className="font-medium">{suggestion}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Saved Searches */}
                {!searchQuery && savedSearches.length > 0 && (
                  <div className="mb-4 pt-2 border-t border-muted/30">
                    <div className="flex items-center justify-between px-3 py-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Bookmark className="h-3 w-3" />
                        Saved Searches
                      </h4>
                    </div>
                    <div className="space-y-0.5">
                      {savedSearches.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSearchSelect(item)}
                          className="w-full text-left px-3 py-2.5 hover:bg-accent rounded-md flex items-center gap-3 text-sm transition-colors group"
                        >
                          <Bookmark className="h-4 w-4 text-blue-500" />
                          <div className="flex-1">
                            <div className="font-medium group-hover:text-primary transition-colors">{item.name}</div>
                            {item.filter_summary && (
                              <div className="text-[11px] text-muted-foreground truncate">{item.filter_summary}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-2 pt-2 border-t border-muted/30">
                    <div className="flex items-center justify-between px-3 py-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        Recent History
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearHistory}
                        className="h-7 px-2 text-[10px] uppercase font-bold text-muted-foreground hover:text-destructive"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-0.5">
                      {recentSearches.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-accent rounded-md group transition-colors"
                        >
                          <button
                            onClick={() => handleSearchSelect(item)}
                            className="flex-1 text-left text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium truncate">
                                    {item.query || getFilterSummary(item.filters)}
                                  </span>
                                  {item.results_count !== undefined && (
                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      {item.results_count}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteHistoryItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded-full transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(popularSearches.length > 0 || searchStore.popularSearches.length > 0) && (
                  <div className="pt-2 border-t border-muted/30">
                    <div className="px-3 py-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" />
                        Popular Right Now
                      </h4>
                    </div>
                    <div className="px-3 pb-3 flex flex-wrap gap-2">
                      {(popularSearches.length > 0 ? popularSearches : searchStore.popularSearches)
                        .slice(0, 8)
                        .map((search: any, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-300 py-1.5 px-3 rounded-full border-none bg-muted/50"
                            onClick={() => handleSuggestionClick(search.query || search.name)}
                          >
                            <TrendingUp className="h-3 w-3 mr-1.5 opacity-50" />
                            {search.query || search.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {/* Promoted Recommendations */}
                {!searchQuery && (Array.isArray(recommendations) && recommendations.length > 0) && (
                  <div className="pt-2 border-t border-muted/30 pb-2">
                    <div className="px-3 py-2 flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        Promoted for You
                      </h4>
                    </div>
                    <div className="px-2 space-y-1">
                      {recommendations.map((property: any) => (
                        <button
                          key={property.id}
                          onClick={() => {
                            window.location.href = `/listings/${property.id}`
                            setShowHistory(false)
                          }}
                          className="w-full text-left p-2 hover:bg-accent rounded-md flex gap-3 transition-colors group"
                        >
                          <div className="h-12 w-16 rounded overflow-hidden flex-shrink-0 bg-muted">
                            {property.images?.[0] && (
                              <img
                                src={property.images[0].image}
                                alt={property.title}
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {property.title}
                            </div>
                            <div className="text-xs text-primary font-bold">
                              {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(property.price_etb)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No History State */}
                {recentSearches.length === 0 && suggestions.length === 0 && (
                  <div className="text-center py-6">
                    <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Your search history will appear here
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}