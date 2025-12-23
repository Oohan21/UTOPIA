// components/listings/SearchHistory.tsx
import React, { useState, useEffect, useRef } from 'react'
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
  Filter
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

  // Load search history on mount
  useEffect(() => {
    searchStore.loadSearchHistory()
    searchStore.loadPopularSearches()
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

  // Recent searches from store
  const recentSearches = searchStore.recentSearches.slice(0, 5)

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
          className="h-11 pl-10 pr-10"
          startIcon={<Search className="h-4 w-4" />}
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
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border">
            <CardContent className="p-4">
              <ScrollArea className="max-h-80">
                {/* Search Suggestions */}
                {searchQuery.length >= 2 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Search className="h-3 w-3" />
                        Suggestions
                      </h4>
                      {isLoadingSuggestions && (
                        <span className="text-xs text-muted-foreground">Loading...</span>
                      )}
                    </div>
                    {suggestions.length > 0 ? (
                      <div className="space-y-1">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left p-2 hover:bg-muted rounded flex items-center justify-between text-sm"
                          >
                            <span>{suggestion}</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    ) : !isLoadingSuggestions && (
                      <p className="text-sm text-muted-foreground p-2">
                        No suggestions found
                      </p>
                    )}
                  </div>
                )}

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Recent Searches
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearHistory}
                        className="h-6 px-2 text-xs"
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 hover:bg-muted rounded group"
                        >
                          <button
                            onClick={() => handleSearchSelect(item)}
                            className="flex-1 text-left text-sm"
                          >
                            <div className="flex items-center gap-2">
                              {item.query ? (
                                <span className="font-medium">{item.query}</span>
                              ) : (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Filter className="h-3 w-3" />
                                  <span>Filtered search</span>
                                </span>
                              )}
                              {item.results_count !== undefined && (
                                <Badge variant="outline" className="text-xs">
                                  {item.results_count} results
                                </Badge>
                              )}
                            </div>
                            {item.filters.property_type && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {item.filters.property_type}
                                {item.filters.city && ' • '}
                                {item.filters.city && `City: ${item.filters.city}`}
                              </div>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteHistoryItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                {(popularSearches.length > 0 || searchStore.popularSearches.length > 0) && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Popular Searches
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(popularSearches.length > 0 ? popularSearches : searchStore.popularSearches)
                        .slice(0, 6)
                        .map((search: any, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary/10"
                            onClick={() => handleSuggestionClick(search.query || search.name)}
                          >
                            {search.query || search.name}
                            {search.count && (
                              <span className="ml-1 text-xs opacity-75">
                                ({search.count})
                              </span>
                            )}
                          </Badge>
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