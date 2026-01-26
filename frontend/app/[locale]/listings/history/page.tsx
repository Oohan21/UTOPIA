// app/listings/history/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useSearchStore } from '@/lib/store/searchStore'
import { useRouter } from 'next/navigation'
import { 
  History, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp,
  Clock,
  BarChart3,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ScrollArea } from '@/components/ui/Scroll-area'
import { Skeleton } from '@/components/ui/Skeleton'
import Header from '@/components/common/Header/Header'
import { formatDistanceToNow } from 'date-fns'

export default function SearchHistoryPage() {
  const router = useRouter()
  const searchStore = useSearchStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    await Promise.all([
      searchStore.loadSearchHistory(),
      searchStore.loadPopularSearches(),
      searchStore.loadSavedSearches()
    ])
    setIsLoading(false)
  }

  const handleSearchClick = (filters: any) => {
    const queryParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })
    
    router.push(`/listings?${queryParams.toString()}`)
  }

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to clear all search history?')) {
      await searchStore.clearSearchHistory()
    }
  }

  const handleDeleteItem = async (id: number) => {
    await searchStore.deleteSearchHistoryItem(id)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <History className="h-8 w-8 text-primary" />
                Search History
              </h1>
              <p className="text-muted-foreground mt-2">
                Track and revisit your previous property searches
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleClearHistory}
              disabled={searchStore.searchHistory.length === 0}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All History
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main History List */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Searches ({searchStore.searchHistory.length})
                    </h2>
                  </div>

                  <ScrollArea className="h-[600px]">
                    {searchStore.searchHistory.length > 0 ? (
                      <div className="space-y-4">
                        {searchStore.searchHistory.map((item) => (
                          <Card key={item.id} className="border hover:border-primary transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    {item.search_type === 'saved_search' ? (
                                      <Badge variant="outline" className="gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        Saved
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="gap-1">
                                        <Search className="h-3 w-3" />
                                        Search
                                      </Badge>
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  
                                  <div className="mb-3">
                                    {item.query ? (
                                      <h3 className="font-medium text-lg">{item.query}</h3>
                                    ) : (
                                      <h3 className="font-medium text-lg flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        Filtered Search
                                      </h3>
                                    )}
                                  </div>

                                  {/* Filters Summary */}
                                  {item.filters && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                      {item.filters.property_type && (
                                        <Badge variant="outline">{item.filters.property_type}</Badge>
                                      )}
                                      {item.filters.city && (
                                        <Badge variant="outline">City: {item.filters.city}</Badge>
                                      )}
                                      {item.filters.listing_type && (
                                        <Badge variant="outline">
                                          {item.filters.listing_type.replace('_', ' ')}
                                        </Badge>
                                      )}
                                      {item.filters.min_price && item.filters.max_price && (
                                        <Badge variant="outline">
                                          Price: {item.filters.min_price} - {item.filters.max_price}
                                        </Badge>
                                      )}
                                      {item.results_count !== undefined && (
                                        <Badge variant="secondary">
                                          {item.results_count} results
                                        </Badge>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex gap-3">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSearchClick(item.filters)}
                                      className="gap-2"
                                    >
                                      <Search className="h-4 w-4" />
                                      Search Again
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="gap-2"
                                    >
                                      <X className="h-4 w-4" />
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No search history yet</h3>
                        <p className="text-muted-foreground mb-6">
                          Your search history will appear here as you search for properties
                        </p>
                        <Button onClick={() => router.push('/listings')}>
                          Start Searching
                        </Button>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar with Stats */}
            <div className="space-y-6">
              {/* Stats Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Search Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Searches</span>
                      <span className="font-semibold">{searchStore.searchHistory.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Saved Searches</span>
                      <span className="font-semibold">{searchStore.savedSearches.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Last Search</span>
                      <span className="text-sm text-muted-foreground">
                        {searchStore.searchHistory[0] 
                          ? formatDistanceToNow(new Date(searchStore.searchHistory[0].created_at), { addSuffix: true })
                          : 'Never'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Popular Searches */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Popular Searches
                  </h3>
                  <div className="space-y-3">
                    {(searchStore.popularSearches.length > 0 
                      ? searchStore.popularSearches 
                      : []
                    ).slice(0, 5).map((search: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                        <span className="text-sm font-medium">{search.query || search.name}</span>
                        <Badge variant="outline">{search.count || 0}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => router.push('/listings')}
                    >
                      <Search className="h-4 w-4" />
                      New Search
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => router.push('/listings/saved')}
                    >
                      <TrendingUp className="h-4 w-4" />
                      View Saved Searches
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}