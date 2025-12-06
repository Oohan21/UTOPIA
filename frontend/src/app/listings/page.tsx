// app/listings/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/common/Header/Header'
import SearchFilters from '@/components/listings/SearchFilters'
import PropertyCard from '@/components/listings/PropertyCard'
import { listingsApi } from '@/lib/api/listings'
import { useAuthStore } from '@/lib/store/authStore'
import {
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Star,
  CheckCircle,
  TrendingUp,
  MapPin,
  Home,
  Building,
  RefreshCw,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/DropdownMenu'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { PropertyFilters } from '@/lib/types/property'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/Tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { Label } from '@/components/ui/Label'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

// Sort options matching backend ordering_fields
const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest First' },
  { value: 'created_at', label: 'Oldest First' },
  { value: '-price_etb', label: 'Price: High to Low' },
  { value: 'price_etb', label: 'Price: Low to High' },
  { value: '-total_area', label: 'Area: Large to Small' },
  { value: 'total_area', label: 'Area: Small to Large' },
  { value: '-bedrooms', label: 'Bedrooms: High to Low' },
  { value: 'bedrooms', label: 'Bedrooms: Low to High' },
  { value: '-views_count', label: 'Most Viewed' },
  { value: 'views_count', label: 'Least Viewed' },
  { value: '-save_count', label: 'Most Saved' },
]

const PROPERTY_TYPE_COUNTS = {
  'house': { label: 'Houses', count: 0, icon: <Home className="h-4 w-4" /> },
  'apartment': { label: 'Apartments', count: 0, icon: <Building className="h-4 w-4" /> },
  'villa': { label: 'Villas', count: 0, icon: <Home className="h-4 w-4" /> },
  'commercial': { label: 'Commercial', count: 0, icon: <Building className="h-4 w-4" /> },
  'land': { label: 'Land', count: 0, icon: <MapPin className="h-4 w-4" /> },
}

// Helper function for calculating averages
const calculateAverage = (items: any[], key: string): string => {
  const validItems = items.filter(item => item[key] !== undefined && item[key] !== null && item[key] > 0);
  if (validItems.length === 0) return 'N/A';
  
  const sum = validItems.reduce((acc, item) => acc + item[key], 0);
  const avg = sum / validItems.length;
  
  if (key === 'price_etb' || key === 'price_per_sqm') {
    return formatCurrency(avg);
  } else if (key === 'total_area') {
    return Math.round(avg) + ' m²';
  } else if (key === 'bedrooms') {
    return avg.toFixed(1);
  }
  
  return avg.toFixed(2);
};

export default function ListingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user } = useAuthStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [isSaveSearchOpen, setIsSaveSearchOpen] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [mounted, setMounted] = useState(false)

  // Initialize filters from URL
  const [filters, setFilters] = useState<PropertyFilters>({
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    page_size: searchParams.get('page_size') ? parseInt(searchParams.get('page_size')!) : 20,
    sort_by: searchParams.get('sort_by') || '-created_at',
    search: searchParams.get('search') || undefined,
    property_type: searchParams.get('property_type') || undefined,
    listing_type: searchParams.get('listing_type') || undefined,
    city: searchParams.get('city') ? parseInt(searchParams.get('city')!) : undefined,
    sub_city: searchParams.get('sub_city') ? parseInt(searchParams.get('sub_city')!) : undefined,
    min_price: searchParams.get('min_price') ? parseInt(searchParams.get('min_price')!) : undefined,
    max_price: searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : undefined,
    min_bedrooms: searchParams.get('min_bedrooms') ? parseInt(searchParams.get('min_bedrooms')!) : undefined,
    max_bedrooms: searchParams.get('max_bedrooms') ? parseInt(searchParams.get('max_bedrooms')!) : undefined,
    min_area: searchParams.get('min_area') ? parseInt(searchParams.get('min_area')!) : undefined,
    max_area: searchParams.get('max_area') ? parseInt(searchParams.get('max_area')!) : undefined,
    min_bathrooms: searchParams.get('min_bathrooms') ? parseInt(searchParams.get('min_bathrooms')!) : undefined,
    furnishing_type: searchParams.get('furnishing_type') || undefined,
    has_parking: searchParams.get('has_parking') === 'true' || undefined,
    has_garden: searchParams.get('has_garden') === 'true' || undefined,
    has_security: searchParams.get('has_security') === 'true' || undefined,
    has_furniture: searchParams.get('has_furniture') === 'true' || undefined,
    has_air_conditioning: searchParams.get('has_air_conditioning') === 'true' || undefined,
    is_featured: searchParams.get('is_featured') === 'true' || undefined,
    is_verified: searchParams.get('is_verified') === 'true' || undefined,
    built_year: searchParams.get('built_year') ? parseInt(searchParams.get('built_year')!) : undefined,
  })

  // Wait for mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch featured properties
  const { data: featuredProperties, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => listingsApi.getFeaturedProperties(),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch saved searches
  const { data: savedSearches, refetch: refetchSavedSearches } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => listingsApi.getSavedSearches(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch properties with filters
  const {
    data: propertiesData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['properties', filters],
    queryFn: () => listingsApi.getProperties(filters),
    staleTime: 5 * 60 * 1000,
  })

  const properties = propertiesData?.results || []
  const totalCount = propertiesData?.count || 0
  const totalPages = propertiesData?.total_pages || 1
  const currentPage = propertiesData?.current_page || 1

  // Calculate property type counts
  useEffect(() => {
    if (properties.length > 0) {
      const counts = { ...PROPERTY_TYPE_COUNTS }
      properties.forEach(property => {
        if (counts[property.property_type as keyof typeof counts]) {
          counts[property.property_type as keyof typeof counts].count++
        }
      })
      // Update counts in UI (this would need state management)
    }
  }, [properties])

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    toast.success(`Exporting ${totalCount} properties as ${format.toUpperCase()}...`)
    // Implement actual export logic
  }

  const handleFilterChange = (newFilters: Partial<PropertyFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      page_size: 20,
      sort_by: '-created_at',
    })
    setShowFilters(false)
  }

  const handleCreateListing = () => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/listings/create')
      return
    }
    router.push('/listings/create')
  }

  const handleSaveSearch = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to save searches')
      return
    }

    if (!searchName.trim()) {
      toast.error('Please enter a name for your search')
      return
    }

    try {
      await listingsApi.createSavedSearch({
        name: searchName,
        filters: filters
      })
      toast.success('Search saved successfully!')
      setIsSaveSearchOpen(false)
      setSearchName('')
      refetchSavedSearches()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save search')
    }
  }

  const handleLoadSavedSearch = (search: any) => {
    setFilters(prev => ({
      ...prev,
      ...search.filters,
      page: 1
    }))
    toast.success(`Loaded search: ${search.name}`)
  }

  const handleDeleteSavedSearch = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      await listingsApi.deleteSavedSearch(id)
      toast.success('Search deleted')
      refetchSavedSearches()
    } catch (error: any) {
      toast.error('Failed to delete search')
    }
  }

  const handleQuickFilter = (type: string) => {
    handleFilterChange({
      property_type: type,
      page: 1
    })
  }

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length === 0 || value.length >= 3) {
      handleFilterChange({ search: value || undefined })
    }
  }

  // Count active filters (excluding pagination and sort)
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => {
      if (['page', 'page_size', 'sort_by'].includes(key)) return false
      return value !== undefined && value !== '' && value !== null
    }
  ).length

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
            <CardContent className="p-6">
              <h2 className="mb-2 text-xl font-semibold text-red-800 dark:text-red-300">Error Loading Properties</h2>
              <p className="text-red-600 dark:text-red-400">
                {error instanceof Error ? error.message : 'An error occurred while loading properties.'}
              </p>
              <Button
                variant="outline"
                className="mt-4 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
                onClick={() => refetch()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Don't render theme-dependent content until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <LoadingSpinner fullScreen={false} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8">
        {/* Hero Section */}
        <div className="mb-8 rounded-xl bg-gradient-to-r from-primary to-primary/90 dark:from-primary/90 dark:to-primary/80 p-8 text-white">
          <div className="max-w-2xl">
            
            <p className="mb-6 text-lg opacity-90">
              Browse thousands of properties for sale and rent across Ethiopia
            </p>

            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                type="search"
                placeholder="Search by location, property type, or keyword..."
                className="h-14 rounded-full pl-12 pr-4 text-lg shadow-lg bg-white dark:bg-gray-900 border-0 focus-visible:ring-2 focus-visible:ring-white/30"
                defaultValue={filters.search}
                onChange={handleSearchInput}
                onKeyDown={(e) => e.key === 'Enter' && handleFilterChange({ search: e.currentTarget.value || undefined })}
              />
              <Button
                size="lg"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-6 bg-white dark:bg-gray-900 text-primary hover:bg-white/90 dark:hover:bg-gray-800"
                onClick={() => handleFilterChange({ search: (document.querySelector('input[type="search"]') as HTMLInputElement)?.value || undefined })}
              >
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Property Type Quick Filters */}
        <div className="mb-8">
          <Tabs defaultValue="all" className="w-full">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-bold text-foreground">Browse Properties</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-border hover:bg-accent"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                {isAuthenticated && (
                  <Button
                    onClick={handleCreateListing}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    List Property
                  </Button>
                )}
              </div>
            </div>

            <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-6 bg-muted dark:bg-gray-800 p-1">
              <TabsTrigger
                value="all"
                onClick={() => handleFilterChange({ property_type: undefined })}
                className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900"
              >
                All Properties
              </TabsTrigger>
              <TabsTrigger
                value="house"
                onClick={() => handleQuickFilter('house')}
                className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900"
              >
                Houses
              </TabsTrigger>
              <TabsTrigger
                value="apartment"
                onClick={() => handleQuickFilter('apartment')}
                className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900"
              >
                Apartments
              </TabsTrigger>
              <TabsTrigger
                value="commercial"
                onClick={() => handleQuickFilter('commercial')}
                className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900"
              >
                Commercial
              </TabsTrigger>
              <TabsTrigger
                value="villa"
                onClick={() => handleQuickFilter('villa')}
                className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900"
              >
                Villas
              </TabsTrigger>
              <TabsTrigger
                value="land"
                onClick={() => handleQuickFilter('land')}
                className="data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900"
              >
                Land
              </TabsTrigger>
            </TabsList>

            {/* Active Filters & Controls */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">View:</span>
                    <div className="flex rounded-lg border border-border">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        className={cn(
                          "rounded-r-none border-r border-border",
                          viewMode === 'grid' && "bg-primary"
                        )}
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        className={cn(
                          "rounded-l-none",
                          viewMode === 'list' && "bg-primary"
                        )}
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                    <Select
                      value={filters.sort_by || '-created_at'}
                      onValueChange={(value) => handleFilterChange({ sort_by: value })}
                    >
                      <SelectTrigger className="w-40 bg-background border-border">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="focus:bg-accent"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Select
                    value={filters.page_size?.toString() || '20'}
                    onValueChange={(value) => handleFilterChange({ page_size: parseInt(value) })}
                  >
                    <SelectTrigger className="w-32 bg-background border-border">
                      <SelectValue placeholder="Items per page" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="12">12 per page</SelectItem>
                      <SelectItem value="20">20 per page</SelectItem>
                      <SelectItem value="40">40 per page</SelectItem>
                      <SelectItem value="60">60 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  {isAuthenticated && activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSaveSearchOpen(true)}
                      className="border-border hover:bg-accent"
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Save Search
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32 bg-popover border-border">
                      <DropdownMenuItem
                        onClick={() => handleExport('csv')}
                        className="focus:bg-accent"
                      >
                        CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleExport('pdf')}
                        className="focus:bg-accent"
                      >
                        PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {Object.entries(filters)
                    .filter(([key, value]) => {
                      if (['page', 'page_size', 'sort_by'].includes(key)) return false
                      return value !== undefined && value !== '' && value !== null
                    })
                    .map(([key, value]) => (
                      <Badge
                        key={key}
                        variant="outline"
                        className="gap-1 capitalize border-border bg-secondary"
                      >
                        {key.replace(/_/g, ' ')}: {String(value)}
                        <button
                          onClick={() => handleFilterChange({ [key]: undefined })}
                          className="ml-1 rounded-full hover:bg-muted"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="hover:bg-accent"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </Tabs>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mb-8">
            <SearchFilters
              filters={filters}
              onChange={handleFilterChange}
            />
          </div>
        )}

        {/* Saved Searches */}
        {isAuthenticated && savedSearches && savedSearches.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Your Saved Searches</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {savedSearches.map((search: any) => (
                <Card
                  key={search.id}
                  className="cursor-pointer hover:border-primary transition-colors border-border bg-card"
                  onClick={() => handleLoadSavedSearch(search)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{search.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {search.match_count} properties match
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(search.filters)
                            .filter(([key, value]) =>
                              !['page', 'page_size', 'sort_by'].includes(key) &&
                              value !== undefined && value !== '' && value !== null
                            )
                            .slice(0, 3)
                            .map(([key, value]) => (
                              <Badge
                                key={key}
                                variant="secondary"
                                className="text-xs bg-secondary text-secondary-foreground"
                              >
                                {key.replace(/_/g, ' ')}: {String(value)}
                              </Badge>
                            ))}
                          {Object.keys(search.filters).filter(key =>
                            !['page', 'page_size', 'sort_by'].includes(key) &&
                            search.filters[key] !== undefined &&
                            search.filters[key] !== '' &&
                            search.filters[key] !== null
                          ).length > 3 && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-secondary text-secondary-foreground"
                            >
                              +{Object.keys(search.filters).filter(key =>
                                !['page', 'page_size', 'sort_by'].includes(key) &&
                                search.filters[key] !== undefined &&
                                search.filters[key] !== '' &&
                                search.filters[key] !== null
                              ).length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => handleDeleteSavedSearch(search.id, e)}
                      >
                        ×
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Featured Properties */}
        {!filters.search && !activeFiltersCount && featuredProperties && featuredProperties.length > 0 && (
          <section className="mb-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500 dark:text-yellow-400 dark:fill-yellow-400" />
                <h2 className="text-2xl font-bold text-foreground">Featured Properties</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange({ is_featured: true })}
                className="hover:bg-accent"
              >
                View All Featured
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredProperties.slice(0, 3).map((property: any) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  showComparisonButton={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Verified Properties */}
        {!filters.search && !activeFiltersCount && properties.filter(p => p.is_verified).length > 0 && (
          <section className="mb-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500 fill-green-500 dark:text-green-400 dark:fill-green-400" />
                <h2 className="text-2xl font-bold text-foreground">Verified Properties</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange({ is_verified: true })}
                className="hover:bg-accent"
              >
                View All Verified
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties
                .filter(p => p.is_verified)
                .slice(0, 3)
                .map((property: any) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    showComparisonButton={false}
                  />
                ))}
            </div>
          </section>
        )}

        {/* Main Properties Grid/List */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {filters.search ? 'Search Results' : 'All Properties'}
              </h2>
              <p className="text-muted-foreground">
                {isLoading ? 'Loading...' : `${totalCount.toLocaleString()} properties found`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner fullScreen={false} />
              <p className="mt-4 text-center text-muted-foreground">
                Loading properties...
              </p>
            </div>
          ) : properties.length > 0 ? (
            <>
              <div className={`grid gap-6 ${viewMode === 'grid'
                ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
                }`}>
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    viewMode={viewMode}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-border hover:bg-accent"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={cn(
                              "min-w-[40px] border-border",
                              currentPage !== pageNum && "hover:bg-accent"
                            )}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border-border hover:bg-accent"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * (filters.page_size || 20) + 1} to{' '}
                    {Math.min(currentPage * (filters.page_size || 20), totalCount)} of{' '}
                    {totalCount.toLocaleString()} properties
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 rounded-full bg-muted p-6">
                <SlidersHorizontal className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">No properties found</h3>
              <p className="mb-6 text-center text-muted-foreground">
                {filters.search ?
                  `No properties match "${filters.search}". Try adjusting your search criteria.` :
                  'Try adjusting your filters or search criteria'
                }
              </p>
              <div className="flex gap-3">
                <Button onClick={handleClearFilters}>
                  Clear All Filters
                </Button>
                <Button variant="outline" onClick={() => setShowFilters(true)} className="border-border hover:bg-accent">
                  Adjust Filters
                </Button>
                {isAuthenticated && (
                  <Button onClick={handleCreateListing}>
                    <Plus className="mr-2 h-4 w-4" />
                    List Your Property
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Search Dialog */}
      <Dialog open={isSaveSearchOpen} onOpenChange={setIsSaveSearchOpen}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Save This Search</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Save your current search criteria to get notified about new matching properties
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-name" className="text-foreground">Search Name</Label>
              <Input
                id="search-name"
                placeholder="e.g., 3-bedroom apartments in Bole"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Current Filters</Label>
              <div className="rounded-lg border border-border p-3 bg-card">
                {activeFiltersCount > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(filters)
                      .filter(([key, value]) => {
                        if (['page', 'page_size', 'sort_by'].includes(key)) return false
                        return value !== undefined && value !== '' && value !== null
                      })
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="capitalize text-muted-foreground">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-medium text-foreground">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No filters applied</p>
                )}
              </div>
            </div>
            <Button className="w-full" onClick={handleSaveSearch}>
              Save Search
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}