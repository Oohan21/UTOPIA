'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
import { useAuthStore } from '@/lib/store/authStore'
import { useSearchStore } from '@/lib/store/searchStore'
import SearchHistory from '@/components/listings/SearchHistory'
import { useComparisonStore } from '@/lib/store/comparisonStore'
import { Property, City, SubCity, PropertyFilters as PropertyFiltersType, ApiResponse } from '@/lib/types/property'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import Header from '@/components/common/Header/Header'
import PropertyCard from '@/components/listings/PropertyCard'
import { ComparisonFloatingButton } from '@/components/properties/ComparisonFloatingButton'
import { ComparisonModal } from '@/components/properties/ComparisonModal'
import {
  Search,
  Filter,
  MapPin,
  Building,
  DollarSign,
  Home,
  Bath,
  Bed,
  Eye,
  Star,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal,
  Grid2X2,
  List,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  Shield,
  Award,
  Plus,
  Grid3X3,
  Building2,
  Warehouse,
  Hotel,
  Briefcase,
  Trees,
  Store,
  ExternalLink,
  BarChart3,
  AlertTriangle,
  Loader2,
  Maximize2,
  Minimize2,
  Layers,
  Clock,
  Save,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Checkbox } from '@/components/ui/Checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { Badge } from '@/components/ui/Badge'
import { Label } from '@/components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'
import dynamic from 'next/dynamic'

// Import next-intl hooks
import { useTranslations, useLocale } from 'next-intl'

// Dynamically import MapView with loading state
const MapView = dynamic(() => import('@/components/properties/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full flex items-center justify-center bg-muted rounded-lg">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    </div>
  )
})

export default function ListingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  const searchStore = useSearchStore()
  const locale = useLocale()

  // Translation hooks
  const t = useTranslations('listings')
  const tCommon = useTranslations('common')

  // Comparison store
  const comparisonStore = useComparisonStore() as any
  const comparisonProperties = comparisonStore.comparisonProperties || []

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [showFilters, setShowFilters] = useState(true)
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [showComparisonModal, setShowComparisonModal] = useState(false)
  const [isComparisonBarVisible, setIsComparisonBarVisible] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [selectedMapProperty, setSelectedMapProperty] = useState<Property | null>(null)

  // Search history state
  const [showSearchHistory, setShowSearchHistory] = useState(false)

  // Search input with debounce
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)

  // Simplified filters state
  const [filters, setFilters] = useState<PropertyFiltersType>({
    page: 1,
    page_size: 12,
    ordering: '-promotion_priority,-created_at',
  })

  // Refs for timeouts
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Constants with translations
  const PROPERTY_TYPES = [
    { value: 'all', label: t('propertyTypes.all'), icon: <Grid3X3 className="h-4 w-4" /> },
    { value: 'house', label: t('propertyTypes.house'), icon: <Home className="h-4 w-4" /> },
    { value: 'apartment', label: t('propertyTypes.apartment'), icon: <Building className="h-4 w-4" /> },
    { value: 'villa', label: t('propertyTypes.villa'), icon: <Building2 className="h-4 w-4" /> },
    { value: 'commercial', label: t('propertyTypes.commercial'), icon: <Store className="h-4 w-4" /> },
    { value: 'land', label: t('propertyTypes.land'), icon: <Trees className="h-4 w-4" /> },
    { value: 'office', label: t('propertyTypes.office'), icon: <Briefcase className="h-4 w-4" /> },
    { value: 'warehouse', label: t('propertyTypes.warehouse'), icon: <Warehouse className="h-4 w-4" /> },
    { value: 'farm', label: t('propertyTypes.farm'), icon: <Trees className="h-4 w-4" /> },
    { value: 'hotel', label: t('propertyTypes.hotel'), icon: <Hotel className="h-4 w-4" /> },
  ]

  const LISTING_TYPES = [
    { value: 'all', label: t('listingTypes.all') },
    { value: 'for_sale', label: t('listingTypes.for_sale') },
    { value: 'for_rent', label: t('listingTypes.for_rent') },
  ]

  const BEDROOM_OPTIONS = [
    { value: 'any', label: t('bedrooms.any') },
    { value: '1', label: t('bedrooms.1') },
    { value: '2', label: t('bedrooms.2') },
    { value: '3', label: t('bedrooms.3') },
    { value: '4', label: t('bedrooms.4') },
    { value: '5', label: t('bedrooms.5') },
  ]

  const BATHROOM_OPTIONS = [
    { value: 'any', label: t('bathrooms.any') },
    { value: '1', label: '1+ Bathrooms' },
    { value: '2', label: '2+ Bathrooms' },
    { value: '3', label: '3+ Bathrooms' },
  ]

  const SORT_OPTIONS = [
    { value: '-promotion_priority,-created_at', label: t('sortOptions.recommended') },
    { value: '-created_at', label: t('sortOptions.newest') },
    { value: 'price_etb', label: t('sortOptions.priceLowToHigh') },
    { value: '-price_etb', label: t('sortOptions.priceHighToLow') },
    { value: '-total_area', label: t('sortOptions.largest') },
    { value: '-views_count', label: t('sortOptions.mostViewed') },
    { value: '-is_featured', label: t('sortOptions.featured') },
  ]

  // Custom debounce hook
  function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedValue(value)
      }, delay)

      return () => {
        clearTimeout(timer)
      }
    }, [value, delay])

    return debouncedValue
  }

  // Initialize from URL params
  useEffect(() => {
    if (!searchParams || isInitialized) return

    const params = new URLSearchParams(searchParams.toString())
    const updates: Partial<PropertyFiltersType> = {}

    params.forEach((value, key) => {
      if (key === 'page' || key === 'page_size') {
        const numValue = parseInt(value)
        if (!isNaN(numValue)) {
          updates[key] = numValue
        }
      } else if (key === 'search' && value) {
        updates[key] = value
        setSearchInput(value)
      } else if (key === 'city' || key === 'sub_city') {
        const numValue = parseInt(value)
        if (!isNaN(numValue)) {
          updates[key] = numValue
        }
      } else if (['min_price', 'max_price', 'min_bedrooms', 'max_bedrooms',
        'min_bathrooms', 'built_year', 'min_area', 'max_area'].includes(key)) {
        const numValue = parseInt(value)
        if (!isNaN(numValue)) {
          updates[key] = numValue
        }
      } else if (['property_type', 'listing_type', 'furnishing_type', 'ordering'].includes(key)) {
        updates[key] = value
      } else if (['is_promoted', 'is_featured', 'is_verified', 'has_parking',
        'has_garden', 'has_security', 'has_furniture'].includes(key)) {
        updates[key] = value === 'true'
      }
    })

    setFilters(prev => ({ ...prev, ...updates }))
    setIsInitialized(true)
  }, [searchParams, isInitialized])

  // Update URL when filters change
  useEffect(() => {
    if (!isInitialized) return

    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current)
    }

    urlUpdateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (key === 'ordering' && value === '-promotion_priority,-created_at') {
            return
          }
          if (key === 'page_size' && value === 12) {
            return
          }
          params.set(key, String(value))
        }
      })

      const newUrl = `/listings${params.toString() ? `?${params.toString()}` : ''}`
      const currentUrl = window.location.pathname + window.location.search

      if (newUrl !== currentUrl) {
        router.replace(newUrl, { scroll: false })
      }
    }, 300)

    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current)
      }
    }
  }, [filters, router, isInitialized])

  // Update search filter from debounced search
  useEffect(() => {
    if (!isInitialized) return

    const currentSearch = filters.search
    const newSearch = debouncedSearch || undefined

    if (currentSearch !== newSearch) {
      setFilters(prev => ({
        ...prev,
        search: newSearch,
        page: 1
      }))
    }
  }, [debouncedSearch, isInitialized])

  // Show comparison bar
  useEffect(() => {
    setIsComparisonBarVisible(comparisonProperties.length > 0)
  }, [comparisonProperties])

  // Fetch cities
  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      try {
        const data = await listingsApi.getCities()
        return Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Error fetching cities:', error)
        return []
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  // Fetch sub-cities
  const { data: subCitiesData } = useQuery({
    queryKey: ['subCities', filters.city],
    queryFn: async () => {
      if (!filters.city) return []

      try {
        const data = await listingsApi.getSubCities(filters.city)
        return Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Error fetching sub-cities:', error)
        return []
      }
    },
    enabled: !!filters.city,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch properties
  const {
    data: propertiesData,
    isLoading: isLoadingProperties,
    error: propertiesError
  } = useQuery({
    queryKey: ['properties', filters],
    queryFn: () => listingsApi.getProperties(filters),
    staleTime: 30 * 1000,
    retry: 1,
    enabled: isInitialized,
  })

  // Fetch featured properties
  const { data: featuredProperties } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => listingsApi.getFeaturedProperties(),
    staleTime: 2 * 60 * 1000,
  })

  // Load search history on mount
  useEffect(() => {
    searchStore.loadSearchHistory()
    searchStore.loadPopularSearches()
  }, [])

  // Process data
  const properties = (propertiesData as ApiResponse<Property>)?.results || []
  const totalCount = (propertiesData as ApiResponse<Property>)?.count || 0
  const totalPages = Math.ceil(totalCount / (filters.page_size || 12))
  const cities: City[] = Array.isArray(citiesData) ? citiesData : []
  const subCities: SubCity[] = Array.isArray(subCitiesData) ? subCitiesData : []

  // Save search to history when filters change and results are loaded
  useEffect(() => {
    if (isInitialized && !isLoadingProperties && totalCount > 0) {
      const timeoutId = setTimeout(() => {
        saveCurrentSearchToHistory()
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [isInitialized, isLoadingProperties, totalCount])

  // Filter properties with valid coordinates for map view
  const mapProperties = useMemo(() => {
    return properties.filter(p =>
      p.latitude &&
      p.longitude &&
      Math.abs(p.latitude) <= 90 &&
      Math.abs(p.longitude) <= 180
    )
  }, [properties])

  // Calculate map center
  const mapCenter = useMemo((): [number, number] => {
    if (mapProperties.length > 0) {
      const firstProp = mapProperties[0]
      return [firstProp.latitude!, firstProp.longitude!]
    }
    // Default to Addis Ababa
    return [9.02497, 38.74689]
  }, [mapProperties])

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    const excludeKeys = ['page', 'page_size', 'ordering']
    return Object.entries(filters).filter(([key, value]) => {
      return !excludeKeys.includes(key) && value !== undefined && value !== '' && value !== null
    }).length
  }, [filters])

  // Function to save search to history
  const saveCurrentSearchToHistory = useCallback(async () => {
    try {
      await searchStore.addToHistory({
        query: filters.search,
        filters: filters,
        results_count: totalCount,
        search_type: 'manual' as const
      })
    } catch (error) {
      console.error('Failed to save search to history:', error)
    }
  }, [filters, totalCount, searchStore])

  // Function to handle search history selection
  const handleSearchHistorySelect = useCallback((searchFilters: PropertyFiltersType) => {
    setFilters(prev => ({
      ...prev,
      ...searchFilters,
      page: 1
    }))

    if (searchFilters.search) {
      setSearchInput(searchFilters.search)
    }

    setShowSearchHistory(false)
  }, [])

  // Function to clear search history
  const handleClearSearchHistory = useCallback(async () => {
    await searchStore.clearSearchHistory()
    toast.success('Search history cleared')
  }, [searchStore])

  // Function to save promotion search to history
  const savePromotionSearchToHistory = useCallback(async (promotionType: string) => {
    try {
      // Use 'manual' type for now since searchStore doesn't have 'promotion_search'
      await searchStore.addToHistory({
        query: `${promotionType} properties`,
        filters: {
          ...filters,
          is_promoted: true,
          promotion_tier: promotionType as any
        },
        results_count: totalCount,
        search_type: 'manual' as const
      })
    } catch (error) {
      console.error('Failed to save promotion search to history:', error)
    }
  }, [filters, totalCount, searchStore])

  // Filter handler
  const handleFilterChange = useCallback((updates: Partial<PropertyFiltersType>) => {
    setFilters(prev => {
      const newFilters = { ...prev }

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          delete newFilters[key as keyof PropertyFiltersType]
        } else {
          newFilters[key as keyof PropertyFiltersType] = value as any
        }
      })

      if (Object.keys(updates).some(key => key !== 'page')) {
        newFilters.page = 1
      }

      return newFilters
    })
  }, [])

  const handleResetFilters = useCallback(() => {
    setFilters({
      page: 1,
      page_size: 12,
      ordering: '-promotion_priority,-created_at',
    })
    setSearchInput('')
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handlePropertySelect = useCallback((property: Property) => {
    router.push(`/listings/${property.id}`)
  }, [router])

  const handleViewModeChange = useCallback((mode: 'grid' | 'list' | 'map') => {
    setViewMode(mode)
    if (mode !== 'map' && isMapFullscreen) {
      setIsMapFullscreen(false)
    }
  }, [isMapFullscreen])

  const handlePopularSearchClick = useCallback((search: any) => {
    const searchFilters: PropertyFiltersType = {
      search: search.query || search.name,
      page: 1
    }
    handleSearchHistorySelect(searchFilters)
  }, [handleSearchHistorySelect])

  // Helper function to format property type
  const formatPropertyType = useCallback((type: string): string => {
    if (!type) return ''
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }, [])

  // Simple Accordion Component
  const SimpleAccordion: React.FC<{
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState<boolean>(defaultOpen)

    return (
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-4 flex items-center justify-between bg-muted hover:bg-muted/80 transition-colors"
        >
          <span className="font-medium">{title}</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {isOpen && (
          <div className="p-4 border-t">
            {children}
          </div>
        )}
      </div>
    )
  }

  // Pagination Component
  const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
  }> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
  }) => {
      const renderPageNumbers = () => {
        const pages = []
        const maxVisible = 5

        if (totalPages <= maxVisible) {
          for (let i = 1; i <= totalPages; i++) {
            pages.push(i)
          }
        } else {
          if (currentPage <= 3) {
            for (let i = 1; i <= 4; i++) {
              pages.push(i)
            }
            pages.push('...')
            pages.push(totalPages)
          } else if (currentPage >= totalPages - 2) {
            pages.push(1)
            pages.push('...')
            for (let i = totalPages - 3; i <= totalPages; i++) {
              pages.push(i)
            }
          } else {
            pages.push(1)
            pages.push('...')
            pages.push(currentPage - 1)
            pages.push(currentPage)
            pages.push(currentPage + 1)
            pages.push('...')
            pages.push(totalPages)
          }
        }

        return pages
      }

      const startItem = (currentPage - 1) * itemsPerPage + 1
      const endItem = Math.min(currentPage * itemsPerPage, totalItems)

      return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t">
          <div className="text-sm text-muted-foreground">
            {t('results.showing', { start: startItem.toLocaleString(), end: endItem.toLocaleString(), total: totalItems.toLocaleString() })}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {renderPageNumbers().map((page, idx) => (
              <Button
                key={idx}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...'}
                className="h-8 w-8 p-0"
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )
    }

  // Map Property Card Component for Map Sidebar
  const MapPropertyCard: React.FC<{
    property: Property;
    onClick: () => void;
  }> = ({ property, onClick }) => {
    const primaryImage = property.images?.find(img => img.is_primary) || property.images?.[0]

    return (
      <Card
        className="w-full cursor-pointer hover:shadow-lg transition-shadow border-l-2 border-primary"
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex gap-3">
            <div className="w-20 h-16 flex-shrink-0 rounded-md overflow-hidden">
              {primaryImage ? (
                <img
                  src={primaryImage.image}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Building className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate mb-1">{property.title}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {property.sub_city?.name || 'Location not specified'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-primary">
                  {formatCurrency(property.price_etb)}
                  {property.listing_type === 'for_rent' && '/mo'}
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {property.listing_type.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Search History Sidebar Component
  const SearchHistorySidebar: React.FC<{
    recentSearches: any[];
    cities: City[];
    isLoading: boolean;
    onSelectSearch: (filters: PropertyFiltersType) => void;
    onClearHistory: () => Promise<void>;
  }> = ({ recentSearches, cities, isLoading, onSelectSearch, onClearHistory }) => {

    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      )
    }

    if (recentSearches.length === 0) {
      return (
        <div className="text-center py-8">
          <Clock className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('searchHistory.historyEmpty')}</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">{t('searchHistory.recentSearches')}</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            className="text-xs h-7 px-2"
          >
            {t('searchHistory.clearAll')}
          </Button>
        </div>

        {recentSearches.map((item) => (
          <Card
            key={item.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onSelectSearch(item.filters)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.query ? (
                      <span className="font-medium truncate">{item.query}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Filtered Search</span>
                    )}
                    {item.results_count !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {item.results_count}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    {item.filters?.property_type && (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        <span>{formatPropertyType(item.filters.property_type)}</span>
                      </div>
                    )}

                    {item.filters?.city && cities.find(c => c.id === item.filters.city) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{cities.find(c => c.id === item.filters.city)?.name}</span>
                      </div>
                    )}

                    {(item.filters?.min_price || item.filters?.max_price) && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span>
                          {item.filters.min_price && formatCurrency(item.filters.min_price)}
                          {item.filters.min_price && item.filters.max_price && ' - '}
                          {item.filters.max_price && formatCurrency(item.filters.max_price)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground pl-2">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Popular Searches Component
  const PopularSearches: React.FC<{
    popularSearches: any[];
    onPopularSearchClick: (search: any) => void;
  }> = ({ popularSearches, onPopularSearchClick }) => {
    const safePopularSearches = Array.isArray(popularSearches)
      ? popularSearches
      : []

    if (safePopularSearches.length === 0) return null

    return (
      <div className="mt-6">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {t('searchHistory.popularSearches')}
        </h4>
        <div className="flex flex-wrap gap-2">
          {safePopularSearches.slice(0, 8).map((search, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-primary/10"
              onClick={() => onPopularSearchClick(search)}
            >
              {search.query || search.name || `Search ${index + 1}`}
              {search.count && (
                <span className="ml-1 text-xs opacity-75">({search.count})</span>
              )}
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array.from({ length: filters.page_size || 12 }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="aspect-video bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-6 bg-muted rounded w-1/4" />
            <div className="flex gap-2">
              <div className="h-8 bg-muted rounded flex-1" />
              <div className="h-8 bg-muted rounded flex-1" />
            </div>
          </div>
        </div>
      </div>
    ))
  }

  // Handle API errors
  if (propertiesError && isInitialized) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12">
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-red-800 dark:text-red-300">
                {t('errors.unableToLoad')}
              </h2>
              <p className="mb-6 text-red-600 dark:text-red-400">
                {t('errors.errorLoading')}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900"
                >
                  {t('actions.refreshPage')}
                </Button>
                <Button
                  onClick={handleResetFilters}
                  variant="default"
                >
                  {t('actions.resetFilters')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Comparison Floating Button */}
      <ComparisonFloatingButton />

      {/* Comparison Modal */}
      <ComparisonModal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
      />

      {/* Comparison Bar */}
      {isComparisonBarVisible && (
        <div className="fixed bottom-4 right-4 left-4 z-50 md:left-auto md:w-auto">
          <Card className="shadow-lg border-primary">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="gap-2">
                    <TrendingUp className="h-3 w-3" />
                    {comparisonProperties.length} in comparison
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Select 2-4 properties for best comparison
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsComparisonBarVisible(false)}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    {t('actions.hide')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowComparisonModal(true)}
                    disabled={comparisonProperties.length < 2}
                    className="gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {t('actions.compareNow')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Search Dialog */}
      <Dialog open={showSaveSearchModal} onOpenChange={setShowSaveSearchModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCommon('save')} Current Search</DialogTitle>
            <DialogDescription>
              Save your search criteria to get notifications when new matching properties are listed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                placeholder="e.g., 3-bedroom apartments in Bole"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>

            {/* Display current filters summary */}
            {activeFiltersCount > 0 && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium mb-2">Current Search Criteria:</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  {filters.search && (
                    <p>Search: "{filters.search}"</p>
                  )}
                  {filters.property_type && (
                    <p>Type: {formatPropertyType(filters.property_type)}</p>
                  )}
                  {filters.city && cities.find(c => c.id === filters.city) && (
                    <p>Location: {cities.find(c => c.id === filters.city)?.name}</p>
                  )}
                  {(filters.min_price || filters.max_price) && (
                    <p>
                      Price:
                      {filters.min_price && ` from ${formatCurrency(filters.min_price)}`}
                      {filters.max_price && ` up to ${formatCurrency(filters.max_price)}`}
                    </p>
                  )}
                  {filters.min_bedrooms && (
                    <p>Bedrooms: {filters.min_bedrooms}+</p>
                  )}
                  {filters.is_promoted && (
                    <p className="text-amber-600">✓ Promoted only</p>
                  )}
                  {filters.is_featured && (
                    <p className="text-amber-600">✓ Featured only</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowSaveSearchModal(false)}>
                {tCommon('cancel')}
              </Button>
              <Button onClick={async () => {
                try {
                  await searchStore.saveSearch(searchName)
                  toast.success('Search saved successfully!')
                  setShowSaveSearchModal(false)
                } catch (error) {
                  toast.error('Failed to save search. Please try again.')
                }
              }}>
                {t('actions.saveSearch')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container py-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                {filters.search ? `Search: "${filters.search}"` : t('title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isLoadingProperties ? t('results.loading') : t('results.propertiesFound', { count: totalCount.toLocaleString() })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Save Search Button */}
              {isAuthenticated && activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSaveSearchModal(true)
                    setSearchName(
                      filters.search
                        ? `Search: ${filters.search}`
                        : `Property Search ${new Date().toLocaleDateString()}`
                    )
                  }}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {t('actions.saveSearch')}
                </Button>
              )}

              {/* Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {showFilters ? t('hideFilters') : t('showFilters')}
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {/* View Toggle */}
              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn("rounded-r-none border-r", viewMode === 'grid' && "bg-primary")}
                  onClick={() => handleViewModeChange('grid')}
                >
                  <Grid2X2 className="h-4 w-4" />
                  <span className="sr-only">{t('viewMode.grid')}</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn("rounded-none border-r", viewMode === 'list' && "bg-primary")}
                  onClick={() => handleViewModeChange('list')}
                >
                  <List className="h-4 w-4" />
                  <span className="sr-only">{t('viewMode.list')}</span>
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  className={cn("rounded-l-none", viewMode === 'map' && "bg-primary")}
                  onClick={() => handleViewModeChange('map')}
                >
                  <MapIcon className="h-4 w-4" />
                  <span className="sr-only">{t('viewMode.map')}</span>
                </Button>
              </div>

              {/* Sort */}
              <Select
                value={filters.ordering || '-promotion_priority,-created_at'}
                onValueChange={(value) => handleFilterChange({ ordering: value })}
                placeholder={t('sortBy')}
              >
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* List Property Button */}
              {isAuthenticated && (
                <Button onClick={() => router.push(`/${locale}/listings/create`)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('actions.listProperty')}
                </Button>
              )}
            </div>
          </div>

          {/* Property Type Tabs */}
          <Tabs
            value={filters.property_type || 'all'}
            onValueChange={(value) => handleFilterChange({ property_type: value === 'all' ? undefined : value })}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
              {PROPERTY_TYPES.map((type) => (
                <TabsTrigger
                  key={type.value}
                  value={type.value}
                  className="gap-2"
                >
                  {type.icon}
                  <span className="hidden sm:inline">{type.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* FILTERS */}
          {showFilters && viewMode !== 'map' && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>{t('filter')}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {t('actions.resetAll')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-6">
                  {/* Search */}
                  <div className="space-y-4">
                    <div className="relative">
                      <SearchHistory
                        searchQuery={searchInput}
                        onSearchChange={(query) => {
                          setSearchInput(query)
                          setShowSearchHistory(true)
                        }}
                        onSelectSearch={(searchFilters) => {
                          handleSearchHistorySelect(searchFilters)
                        }}
                      />

                      {/* Search history toggle button */}
                      {searchInput.length >= 2 && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSearchHistory(!showSearchHistory)}
                            className="h-8 w-8 p-0"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Search History and Popular Searches Section */}
                    {(showSearchHistory && searchInput.length < 2) && (
                      <Card className="mt-2">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Searches */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {t('searchHistory.recentSearches')}
                                </h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowSearchHistory(false)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <SearchHistorySidebar
                                recentSearches={searchStore.recentSearches}
                                cities={cities}
                                isLoading={searchStore.isLoading}
                                onSelectSearch={handleSearchHistorySelect}
                                onClearHistory={handleClearSearchHistory}
                              />
                            </div>

                            {/* Popular Searches */}
                            <div className="space-y-4">
                              <h4 className="font-semibold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                {t('searchHistory.popularSearches')}
                              </h4>
                              <PopularSearches
                                popularSearches={searchStore.popularSearches}
                                onPopularSearchClick={handlePopularSearchClick}
                              />

                              {/* Search Tips */}
                              <div className="pt-4 border-t">
                                <h4 className="font-semibold mb-2">{t('searchHistory.searchTips')}</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  <li className="flex items-start gap-2">
                                    <div className="mt-0.5">•</div>
                                    <span>Use quotation marks for exact phrases</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <div className="mt-0.5">•</div>
                                    <span>Try different property type combinations</span>
                                  </li>
                                  <li className="flex items-start gap-2">
                                    <div className="mt-0.5">•</div>
                                    <span>Filter by promoted properties for premium listings</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Select
                        value={filters.property_type || 'all'}
                        onValueChange={(value) => handleFilterChange({ property_type: value === 'all' ? undefined : value })}
                        placeholder={t('propertyTypes.all')}
                      >
                        <SelectContent>
                          <SelectItem value="all">{t('propertyTypes.all')}</SelectItem>
                          {PROPERTY_TYPES.filter(t => t.value !== 'all').map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={filters.listing_type || 'all'}
                        onValueChange={(value) => handleFilterChange({ listing_type: value === 'all' ? undefined : value })}
                        placeholder={t('listingTypes.all')}
                      >
                        <SelectContent>
                          <SelectItem value="all">{t('listingTypes.all')}</SelectItem>
                          {LISTING_TYPES.filter(t => t.value !== 'all').map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={filters.min_bedrooms?.toString() || 'any'}
                        onValueChange={(value) => handleFilterChange({
                          min_bedrooms: value === 'any' ? undefined : parseInt(value)
                        })}
                        placeholder={t('bedrooms.any')}
                      >
                        <SelectContent>
                          <SelectItem value="any">{t('bedrooms.any')}</SelectItem>
                          {BEDROOM_OPTIONS.filter(b => b.value !== 'any').map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={filters.min_bathrooms?.toString() || 'any'}
                        onValueChange={(value) => handleFilterChange({
                          min_bathrooms: value === 'any' ? undefined : parseInt(value)
                        })}
                        placeholder={t('bathrooms.any')}
                      >
                        <SelectContent>
                          <SelectItem value="any">{t('bathrooms.any')}</SelectItem>
                          {BATHROOM_OPTIONS.filter(b => b.value !== 'any').map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Advanced Filters */}
                  <SimpleAccordion title={t('filters.advancedFilters')} defaultOpen={false}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                      {/* Location */}
                      <div className="space-y-3">
                        <Label>{t('filters.location')}</Label>
                        <Select
                          value={filters.city?.toString() || 'all'}
                          onValueChange={(value) => handleFilterChange({
                            city: value === 'all' ? undefined : parseInt(value),
                            sub_city: undefined
                          })}
                          placeholder={t('filters.selectCity')}
                        >
                          <SelectContent>
                            <SelectItem value="all">{t('filters.allCities')}</SelectItem>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.id.toString()}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={filters.sub_city?.toString() || 'all'}
                          onValueChange={(value) => handleFilterChange({
                            sub_city: value === 'all' ? undefined : parseInt(value)
                          })}
                          disabled={!filters.city}
                          placeholder={t('filters.selectArea')}
                        >
                          <SelectContent>
                            <SelectItem value="all">{t('filters.allAreas')}</SelectItem>
                            {subCities.map((subCity) => (
                              <SelectItem key={subCity.id} value={subCity.id.toString()}>
                                {subCity.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Price Range */}
                      <div className="space-y-3">
                        <Label>{t('filters.priceRange')}</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder={t('filters.min')}
                            value={filters.min_price || ''}
                            onChange={(e) => handleFilterChange({
                              min_price: e.target.value ? parseInt(e.target.value) : undefined
                            })}
                          />
                          <Input
                            type="number"
                            placeholder={t('filters.max')}
                            value={filters.max_price || ''}
                            onChange={(e) => handleFilterChange({
                              max_price: e.target.value ? parseInt(e.target.value) : undefined
                            })}
                          />
                        </div>
                      </div>

                      {/* Area Range */}
                      <div className="space-y-3">
                        <Label>{t('filters.areaRange')}</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder={t('filters.min')}
                            value={filters.min_area || ''}
                            onChange={(e) => handleFilterChange({
                              min_area: e.target.value ? parseInt(e.target.value) : undefined
                            })}
                          />
                          <Input
                            type="number"
                            placeholder={t('filters.max')}
                            value={filters.max_area || ''}
                            onChange={(e) => handleFilterChange({
                              max_area: e.target.value ? parseInt(e.target.value) : undefined
                            })}
                          />
                        </div>
                      </div>

                      {/* Quick Filters */}
                      <div className="space-y-3">
                        <Label>{t('filters.quickFilters')}</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="is_promoted"
                              checked={!!filters.is_promoted}
                              onCheckedChange={(checked) => handleFilterChange({
                                is_promoted: checked ? true : undefined
                              })}
                            />
                            <Label htmlFor="is_promoted" className="cursor-pointer">
                              {t('filters.promotedOnly')}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="is_featured"
                              checked={!!filters.is_featured}
                              onCheckedChange={(checked) => handleFilterChange({
                                is_featured: checked ? true : undefined
                              })}
                            />
                            <Label htmlFor="is_featured" className="cursor-pointer">
                              {t('filters.featuredOnly')}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="is_verified"
                              checked={!!filters.is_verified}
                              onCheckedChange={(checked) => handleFilterChange({
                                is_verified: checked ? true : undefined
                              })}
                            />
                            <Label htmlFor="is_verified" className="cursor-pointer">
                              {t('filters.verifiedOnly')}
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SimpleAccordion>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Featured Properties */}
          {!filters.search && activeFiltersCount === 0 && featuredProperties && Array.isArray(featuredProperties) && featuredProperties.length > 0 && viewMode !== 'map' && (
            <section className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <h2 className="text-xl font-bold">{t('featured.title')}</h2>
                  <Badge variant="outline" className="ml-2">
                    {t('featured.featuredCount', { count: featuredProperties.length })}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange({ is_featured: true })}
                  className="gap-2"
                >
                  {t('actions.viewAllFeatured')}
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredProperties.slice(0, 3).map((property: Property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    viewMode="grid"
                    showComparisonButton={true}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Promotion Banner */}
          {!filters.search && activeFiltersCount === 0 && viewMode !== 'map' && (
            <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-blue-600 p-2">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        {t('promotion.title')}
                      </h3>
                    </div>
                    <p className="text-blue-800 dark:text-blue-300 mb-4">
                      {t('promotion.description')}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-white p-1.5 dark:bg-blue-800">
                          <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-300" />
                        </div>
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {t('promotion.benefits.topPosition')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-white p-1.5 dark:bg-blue-800">
                          <Star className="h-3 w-3 text-blue-600 dark:text-blue-300" />
                        </div>
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {t('promotion.benefits.featuredBadge')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-white p-1.5 dark:bg-blue-800">
                          <CheckCircle className="h-3 w-3 text-blue-600 dark:text-blue-300" />
                        </div>
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {t('promotion.benefits.prioritySupport')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-white p-1.5 dark:bg-blue-800">
                          <BarChart3 className="h-3 w-3 text-blue-600 dark:text-blue-300" />
                        </div>
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          {t('promotion.benefits.analytics')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    onClick={async () => {
                      router.push('/promotions')
                      // Save promotion search to history
                      await savePromotionSearchToHistory('all')
                    }}
                    className="whitespace-nowrap"
                  >
                    {t('promotion.viewPlans')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Properties View */}
          <div>
            {/* Results Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {viewMode === 'map' ? t('viewMode.map') : filters.search ? 'Search Results' : t('subtitle')}
                </h2>
                {!isLoadingProperties && properties.length > 0 && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {viewMode === 'map' ? (
                      t('results.mapViewCount', { count: mapProperties.length })
                    ) : (
                      <>
                        {t('results.showing', {
                          start: ((filters.page || 1) - 1) * (filters.page_size || 12) + 1,
                          end: Math.min((filters.page || 1) * (filters.page_size || 12), totalCount),
                          total: totalCount
                        })}
                        {activeFiltersCount > 0 && (
                          <span className="ml-2">
                            • <span className="font-medium">
                              {t('results.activeFilters', { count: activeFiltersCount })}
                            </span>
                          </span>
                        )}
                      </>
                    )}
                  </p>
                )}
              </div>

              {viewMode === 'map' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMapFullscreen(!isMapFullscreen)}
                    className="gap-2"
                  >
                    {isMapFullscreen ? (
                      <>
                        <Minimize2 className="h-4 w-4" />
                        {t('actions.exitFullscreen')}
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-4 w-4" />
                        {t('actions.fullscreen')}
                      </>
                    )}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Layers className="h-4 w-4 mr-2" />
                        {t('map.layers')}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        Satellite View
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Street Names
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {isLoadingProperties ? (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
                {renderSkeletons()}
              </div>
            ) : properties.length === 0 ? (
              <Card className="border-border">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto max-w-md">
                    <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t('results.noProperties')}</h3>
                    <p className="text-muted-foreground mb-6">
                      {filters.search
                        ? t('results.noMatch', { search: filters.search })
                        : t('results.adjustFilters')}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={handleResetFilters}>
                        {t('actions.resetFilters')}
                      </Button>
                      {isAuthenticated && (
                        <Button onClick={() => router.push(`/${locale}/listings/create`)}>
                          <Plus className="mr-2 h-4 w-4" />
                          {t('actions.listProperty')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : viewMode === 'map' ? (
              <div className={cn(
                "relative rounded-lg overflow-hidden border bg-background",
                isMapFullscreen ? "fixed inset-0 z-50" : "h-[600px]"
              )}>
                {isMapFullscreen && (
                  <div className="absolute top-4 right-4 z-50">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsMapFullscreen(false)}
                      className="gap-2 bg-white/90 backdrop-blur-sm"
                    >
                      <Minimize2 className="h-4 w-4" />
                      {t('actions.exitFullscreen')}
                    </Button>
                  </div>
                )}

                <MapView
                  properties={mapProperties}
                  center={mapCenter}
                  zoom={12}
                  onPropertySelect={handlePropertySelect}
                  onViewModeChange={handleViewModeChange}
                  currentViewMode={viewMode}
                  className="h-full"
                  showControls={true}
                  showHeatmap={true}
                  showLegend={!isMapFullscreen}
                  showNearbyPlaces={true}
                  clusteringEnabled={true}
                  filters={{
                    property_type: filters.property_type,
                    min_price: filters.min_price,
                    max_price: filters.max_price,
                    is_promoted: filters.is_promoted,
                    is_featured: filters.is_featured
                  }}
                  onFiltersChange={(mapFilters) => {
                    handleFilterChange({
                      property_type: mapFilters.property_type,
                      min_price: mapFilters.min_price,
                      max_price: mapFilters.max_price,
                      is_promoted: mapFilters.is_promoted,
                      is_featured: mapFilters.is_featured
                    })
                  }}
                />

                {/* Map Sidebar */}
                {!isMapFullscreen && mapProperties.length > 0 && (
                  <div className="absolute left-4 top-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto bg-background rounded-lg shadow-lg border hidden md:block">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">{t('map.propertiesOnMap')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('results.mapViewCount', { count: mapProperties.length })}
                      </p>
                    </div>
                    <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                      {mapProperties.slice(0, 10).map((property) => (
                        <MapPropertyCard
                          key={property.id}
                          property={property}
                          onClick={() => handlePropertySelect(property)}
                        />
                      ))}
                      {mapProperties.length > 10 && (
                        <div className="text-center p-2">
                          <Button variant="ghost" size="sm" className="w-full">
                            View {mapProperties.length - 10} more properties
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Map Legend */}
                {!isMapFullscreen && (
                  <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border text-sm hidden md:block">
                    <div className="font-medium mb-2">{t('map.legend')}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>{t('map.standard')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>{t('map.promoted')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span>{t('map.featured')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
                  {properties.map((property: Property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      viewMode={viewMode}
                      showComparisonButton={true}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (viewMode === 'grid' || viewMode === 'list') && (
                  <Pagination
                    currentPage={filters.page || 1}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={totalCount}
                    itemsPerPage={filters.page_size || 12}
                  />
                )}
              </>
            )}
          </div>

          {/* Tips for Buyers */}
          {viewMode !== 'map' && (
            <div className="mt-12">
              <h3 className="text-xl font-bold mb-6">{t('tips.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                        <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h4 className="font-semibold">{t('tips.verifyDocuments')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('tips.verifyDocumentsDesc')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                        <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h4 className="font-semibold">{t('tips.promoteListing')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('tips.promoteListingDesc')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                        <Award className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <h4 className="font-semibold">{t('tips.compareOptions')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('tips.compareOptionsDesc')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}