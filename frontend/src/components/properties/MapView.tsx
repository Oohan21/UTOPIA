// components/properties/MapView.tsx - FIXED WITH TOOLTIPS
'use client'

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { Property } from '@/lib/types/property'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { 
  Home, 
  Building, 
  MapPin, 
  Star, 
  Award, 
  Shield,
  Bed,
  Bath,
  Square,
  Navigation,
  Maximize2,
  Minimize2,
  Target,
  Plus,
  Minus,
  Filter,
  Layers,
  Map as MapIcon,
  Globe,
  Moon,
  Share2,
  X,
  Grid2X2,
  List,
  CheckCircle,
  TrendingUp,
  Car,
  Users,
  Wifi,
  Droplets,
  Thermometer,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'
import { Slider } from '@/components/ui/Slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'
import '@/lib/leaflet-fix'
import './MapView.css'

// Property type configurations
const PROPERTY_TYPE_CONFIG = {
  house: { color: '#3B82F6', icon: '🏠', label: 'House' },
  apartment: { color: '#10B981', icon: '🏢', label: 'Apartment' },
  villa: { color: '#F59E0B', icon: '🏰', label: 'Villa' },
  commercial: { color: '#8B5CF6', icon: '🏪', label: 'Commercial' },
  land: { color: '#84CC16', icon: '🌱', label: 'Land' },
  office: { color: '#EC4899', icon: '💼', label: 'Office' },
  warehouse: { color: '#6366F1', icon: '🏭', label: 'Warehouse' },
  hotel: { color: '#EF4444', icon: '🏨', label: 'Hotel' },
  farm: { color: '#22C55E', icon: '🚜', label: 'Farm' }
} as const

interface MapViewProps {
  properties: Property[]
  center: [number, number]
  zoom: number
  onPropertySelect: (property: Property) => void
  onViewModeChange?: (mode: 'grid' | 'list' | 'map') => void
  className?: string
  showControls?: boolean
  showHeatmap?: boolean
  showLegend?: boolean
  showNearbyPlaces?: boolean
  clusteringEnabled?: boolean
  currentViewMode?: 'grid' | 'list' | 'map'
  // Add filter props
  filters?: {
    property_type?: string
    min_price?: number
    max_price?: number
    is_promoted?: boolean
    is_featured?: boolean
  }
  onFiltersChange?: (filters: {
    property_type?: string
    min_price?: number
    max_price?: number
    is_promoted?: boolean
    is_featured?: boolean
  }) => void
}

// Map controls component
function MapControls({ onZoomIn, onZoomOut, onReset, onLocate }: {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onLocate: () => void
}) {
  return (
    <div className="leaflet-top leaflet-right space-y-2 mt-12 mr-2">
      <div className="leaflet-control leaflet-bar bg-white dark:bg-gray-800 rounded-lg shadow-lg border overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          className="h-10 w-10 rounded-none border-b hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          className="h-10 w-10 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      <div className="leaflet-control leaflet-bar bg-white dark:bg-gray-800 rounded-lg shadow-lg border overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          className="h-10 w-10 rounded-none border-b hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Reset view"
        >
          <Target className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onLocate}
          className="h-10 w-10 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Locate me"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Map legend component
function MapLegend() {
  return (
    <div className="leaflet-bottom leaflet-right mb-4 mr-2">
      <div className="leaflet-control leaflet-bar bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4 max-w-xs">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Map Legend
        </h4>
        <div className="space-y-2">
          {Object.entries(PROPERTY_TYPE_CONFIG).map(([type, config]) => (
            <div key={type} className="flex items-center gap-2 text-sm">
              <div 
                className="w-4 h-4 rounded-full border border-white"
                style={{ backgroundColor: config.color }}
              />
              <span>{config.label}</span>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded-full bg-yellow-500 border border-yellow-600" />
              <span>Promoted Property</span>
              <Star className="h-3 w-3 text-yellow-500" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded-full bg-purple-500 border border-purple-600" />
              <span>Featured Property</span>
              <Award className="h-3 w-3 text-purple-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Individual Property Marker with Tooltip
const PropertyMarker: React.FC<{
  property: Property
  onSelect: (property: Property) => void
  getIcon: (property: Property) => L.DivIcon
}> = ({ property, onSelect, getIcon }) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)

  if (!property.latitude || !property.longitude) return null

  return (
    <Marker
      position={[property.latitude, property.longitude]}
      icon={getIcon(property)}
      eventHandlers={{
        click: () => {
          onSelect(property)
        },
        mouseover: () => {
          setIsTooltipOpen(true)
        },
        mouseout: () => {
          setIsTooltipOpen(false)
        }
      }}
    >
      {/* Tooltip on hover */}
      <Tooltip 
        direction="top" 
        offset={[0, -20]} 
        opacity={1}
        permanent={false}
        interactive={true}
        className="leaflet-tooltip property-tooltip"
      >
        <div className="min-w-[200px] p-3">
          <div className="font-semibold text-sm mb-1 line-clamp-1">
            {property.title}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">
              {property.sub_city?.name || property.specific_location || 'Location'}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-primary text-sm">
              {formatCurrency(property.price_etb)}
              {property.listing_type === 'for_rent' && '/mo'}
            </div>
            <Badge variant="outline" className="text-xs capitalize">
              {property.listing_type.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {property.bedrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bed className="h-3 w-3" />
                <span>{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="h-3 w-3" />
                <span>{property.bathrooms}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Square className="h-3 w-3" />
              <span>{property.total_area}m²</span>
            </div>
          </div>
        </div>
      </Tooltip>

      {/* Popup on click */}
      <Popup>
        <div className="property-popup p-0 min-w-[280px] max-w-sm">
          <div className="relative">
            {property.images?.[0] && (
              <div className="h-40 overflow-hidden rounded-t-lg">
                <img
                  src={property.images[0].image}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  {property.is_promoted && (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Promoted
                    </Badge>
                  )}
                  {property.is_featured && (
                    <Badge className="bg-purple-500 hover:bg-purple-600 text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-base mb-1 line-clamp-1">{property.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">
                      {property.sub_city?.name || property.specific_location || 'Location not specified'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="text-xl font-bold text-primary">
                  {formatCurrency(property.price_etb)}
                  {property.listing_type === 'for_rent' && '/mo'}
                </div>
                <Badge variant="outline" className="capitalize text-xs">
                  {property.listing_type.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="flex items-center gap-1.5">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{property.bedrooms}</span>
                  <span className="text-xs text-muted-foreground">Beds</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{property.bathrooms}</span>
                  <span className="text-xs text-muted-foreground">Baths</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Square className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{property.total_area}</span>
                  <span className="text-xs text-muted-foreground">m²</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  className="flex-1 text-sm"
                  onClick={() => {
                    // This will be handled by the parent through onPropertySelect
                    const event = new CustomEvent('property-click', { detail: property })
                    window.dispatchEvent(event)
                  }}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (!property.latitude || !property.longitude) return
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`
                    window.open(url, '_blank')
                  }}
                  title="Get Directions"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

const MapView: React.FC<MapViewProps> = ({
  properties,
  center,
  zoom,
  onPropertySelect,
  onViewModeChange,
  className = 'h-[600px]',
  showControls = true,
  showHeatmap = false,
  showLegend = true,
  showNearbyPlaces = false,
  clusteringEnabled = true,
  currentViewMode = 'map',
  filters = {},
  onFiltersChange
}) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [mapLayers, setMapLayers] = useState({
    heatmap: false,
    traffic: false,
    transit: false,
    places: false,
    priceRange: false
  })
  // Initialize price range from filters or defaults
  const [priceRange, setPriceRange] = useState<number[]>([
    filters.min_price || 0,
    filters.max_price || 10000000
  ])
  const [currentTileLayer, setCurrentTileLayer] = useState<'standard' | 'satellite' | 'dark'>('standard')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isLayersOpen, setIsLayersOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState({
    property_type: filters.property_type || 'all',
    min_price: filters.min_price,
    max_price: filters.max_price,
    is_promoted: filters.is_promoted || false,
    is_featured: filters.is_featured || false
  })
  
  const mapRef = useRef<L.Map>(null)

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters({
      property_type: filters.property_type || 'all',
      min_price: filters.min_price,
      max_price: filters.max_price,
      is_promoted: filters.is_promoted || false,
      is_featured: filters.is_featured || false
    })
    setPriceRange([
      filters.min_price || 0,
      filters.max_price || 10000000
    ])
  }, [filters])

  // Filter properties based on current filters
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Filter by property type
      if (localFilters.property_type !== 'all' && 
          localFilters.property_type !== property.property_type) {
        return false
      }
      
      // Filter by price range
      if (localFilters.min_price && property.price_etb < localFilters.min_price) {
        return false
      }
      if (localFilters.max_price && property.price_etb > localFilters.max_price) {
        return false
      }
      
      // Filter by promoted status
      if (localFilters.is_promoted && !property.is_promoted) {
        return false
      }
      
      // Filter by featured status
      if (localFilters.is_featured && !property.is_featured) {
        return false
      }
      
      return true
    })
  }, [properties, localFilters])

  // Filter properties with valid coordinates
  const mapProperties = useMemo(() => {
    return filteredProperties.filter(p => 
      p.latitude && 
      p.longitude && 
      Math.abs(p.latitude) <= 90 && 
      Math.abs(p.longitude) <= 180
    )
  }, [filteredProperties])

  // Handle filter changes
  const handleFilterChange = useCallback((updates: Partial<typeof localFilters>) => {
    const newFilters = { ...localFilters, ...updates }
    setLocalFilters(newFilters)
    
    // Apply price range to min/max price
    if (updates.min_price !== undefined || updates.max_price !== undefined) {
      onFiltersChange?.({
        property_type: newFilters.property_type === 'all' ? undefined : newFilters.property_type,
        min_price: newFilters.min_price,
        max_price: newFilters.max_price,
        is_promoted: newFilters.is_promoted || undefined,
        is_featured: newFilters.is_featured || undefined
      })
    }
  }, [localFilters, onFiltersChange])

  // Handle price range change
  const handlePriceRangeChange = useCallback((range: number[]) => {
    setPriceRange(range)
    // Debounce the filter update
    const timer = setTimeout(() => {
      handleFilterChange({
        min_price: range[0] || undefined,
        max_price: range[1] || undefined
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [handleFilterChange])

  // Get property icon
  const getPropertyIcon = useCallback((property: Property) => {
    const config = PROPERTY_TYPE_CONFIG[property.property_type as keyof typeof PROPERTY_TYPE_CONFIG] || 
                  PROPERTY_TYPE_CONFIG.house
    
    let iconColor = config.color
    if (property.is_promoted) iconColor = '#F59E0B'
    if (property.is_featured) iconColor = '#8B5CF6'
    
    const svgString = `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: ${iconColor};
        color: white;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        font-size: 20px;
        cursor: pointer;
        transition: transform 0.3s ease;
      ">
        ${config.icon}
        ${property.is_promoted ? `
          <div style="
            position: absolute;
            top: -4px;
            right: -4px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: #F59E0B;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            font-size: 8px;
            color: white;
            animation: pulse 2s infinite;
          ">
            ★
          </div>
        ` : ''}
        ${property.is_featured ? `
          <div style="
            position: absolute;
            bottom: -4px;
            right: -4px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: #8B5CF6;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            font-size: 8px;
            color: white;
          ">
            ✓
          </div>
        ` : ''}
      </div>
    `
    
    return L.divIcon({
      html: svgString,
      className: 'custom-property-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    })
  }, [])

  // Get tile layer URL
  const getTileLayerUrl = () => {
    switch (currentTileLayer) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    }
  }

  // Handle fullscreen
  const handleFullscreen = () => {
    if (!isFullscreen) {
      const elem = document.documentElement
      if (elem.requestFullscreen) {
        elem.requestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  // Handle escape fullscreen
  const handleEscapeFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
    setIsFullscreen(false)
  }

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Map control handlers
  const handleZoomIn = () => {
    mapRef.current?.zoomIn()
  }

  const handleZoomOut = () => {
    mapRef.current?.zoomOut()
  }

  const handleResetView = () => {
    mapRef.current?.setView(center, zoom)
  }

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          mapRef.current?.flyTo(
            [position.coords.latitude, position.coords.longitude],
            15,
            { duration: 1 }
          )
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  // Reset filters
  const handleResetFilters = () => {
    const resetFilters = {
      property_type: 'all',
      min_price: undefined,
      max_price: undefined,
      is_promoted: false,
      is_featured: false
    }
    setLocalFilters(resetFilters)
    setPriceRange([0, 10000000])
    onFiltersChange?.(resetFilters)
  }

  // Listen for property click events from popup
  useEffect(() => {
    const handlePropertyClick = (event: Event) => {
      const customEvent = event as CustomEvent<Property>
      if (customEvent.detail) {
        onPropertySelect(customEvent.detail)
        setSelectedProperty(customEvent.detail)
      }
    }

    window.addEventListener('property-click', handlePropertyClick as EventListener)
    return () => {
      window.removeEventListener('property-click', handlePropertyClick as EventListener)
    }
  }, [onPropertySelect])

  return (
    <div className={cn("relative rounded-lg overflow-hidden border", className, isFullscreen && "fixed inset-0 z-50")}>
      {/* Top Left: View Mode Toggle */}
      <div className="absolute top-4 left-4 z-[1000]">
        <Card className="p-1 shadow-lg">
          <div className="flex rounded-lg overflow-hidden">
            <Button
              variant={currentViewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none border-r"
              onClick={() => onViewModeChange?.('grid')}
              title="Grid View"
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={currentViewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none border-r"
              onClick={() => onViewModeChange?.('list')}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={currentViewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => onViewModeChange?.('map')}
              title="Map View"
            >
              <MapIcon className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Top Center: Quick Actions */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
        <Card className="p-2 shadow-lg">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {(localFilters.property_type !== 'all' || 
                      localFilters.min_price || 
                      localFilters.max_price || 
                      localFilters.is_promoted || 
                      localFilters.is_featured) && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0">
                        !
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter properties</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLayersOpen(!isLayersOpen)}
                    className="gap-2"
                  >
                    <Layers className="h-4 w-4" />
                    Layers
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Map layers</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
        </Card>
      </div>

      {/* Top Right: Fullscreen & Share */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Card className="p-2 shadow-lg">
          <div className="flex items-center gap-2">
            {isFullscreen ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEscapeFullscreen}
                className="gap-2"
              >
                <Minimize2 className="h-4 w-4" />
                Exit Fullscreen
              </Button>
            ) : (
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleFullscreen}
                      className="h-10 w-10"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fullscreen</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const mapCenter = mapRef.current?.getCenter()
                      const mapZoom = mapRef.current?.getZoom()
                      const url = `${window.location.origin}${window.location.pathname}?lat=${mapCenter?.lat}&lng=${mapCenter?.lng}&zoom=${mapZoom}`
                      navigator.clipboard.writeText(url)
                      toast.success('Map link copied to clipboard!')
                    }}
                    className="h-10 w-10"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share map</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
        </Card>
      </div>

      {/* Filters Panel */}
      {isFiltersOpen && (
        <div className="absolute top-20 left-4 z-[1000]">
          <Card className="w-80 shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Map Filters</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="text-xs"
                  >
                    Reset
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFiltersOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Property Type</Label>
                  <Select
                    value={localFilters.property_type}
                    onValueChange={(value) => handleFilterChange({ property_type: value })}
                    placeholder="All types"
                  >
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(PROPERTY_TYPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Price Range (ETB)</Label>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{formatCurrency(priceRange[0])}</span>
                    <span className="text-sm">-</span>
                    <span className="text-sm">{formatCurrency(priceRange[1])}</span>
                  </div>
                  <Slider
                    value={priceRange}
                    min={0}
                    max={10000000}
                    step={100000}
                    onValueChange={handlePriceRangeChange}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="promoted-only" className="cursor-pointer">
                      Promoted Only
                    </Label>
                    <Switch
                      id="promoted-only"
                      checked={localFilters.is_promoted}
                      onCheckedChange={(checked) => handleFilterChange({ is_promoted: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="featured-only" className="cursor-pointer">
                      Featured Only
                    </Label>
                    <Switch
                      id="featured-only"
                      checked={localFilters.is_featured}
                      onCheckedChange={(checked) => handleFilterChange({ is_featured: checked })}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs text-muted-foreground">
                    Showing {mapProperties.length} of {properties.length} properties
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Layers Panel */}
      {isLayersOpen && (
        <div className="absolute top-20 right-4 z-[1000]">
          <Card className="w-64 shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Map Layers</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsLayersOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="mb-2 block">Base Map</Label>
                  <Tabs value={currentTileLayer} onValueChange={(value) => setCurrentTileLayer(value as any)}>
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="standard" className="text-xs">
                        <Globe className="h-3 w-3" />
                      </TabsTrigger>
                      <TabsTrigger value="satellite" className="text-xs">
                        <MapIcon className="h-3 w-3" />
                      </TabsTrigger>
                      <TabsTrigger value="dark" className="text-xs">
                        <Moon className="h-3 w-3" />
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="heatmap" className="cursor-pointer">
                      Heatmap
                    </Label>
                    <Switch
                      id="heatmap"
                      checked={mapLayers.heatmap}
                      onCheckedChange={(checked) => setMapLayers(prev => ({ ...prev, heatmap: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="places" className="cursor-pointer">
                      Nearby Places
                    </Label>
                    <Switch
                      id="places"
                      checked={mapLayers.places}
                      onCheckedChange={(checked) => setMapLayers(prev => ({ ...prev, places: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Left: Map Type & Zoom */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <Card className="p-2 shadow-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <MapPin className="h-3 w-3" />
              {mapProperties.length} properties
              {mapProperties.length !== properties.length && (
                <span className="text-xs text-muted-foreground">
                  (filtered)
                </span>
              )}
            </Badge>
            
            <Separator orientation="vertical" className="h-4" />
            
            <div className="text-xs text-muted-foreground">
              Zoom: {mapRef.current?.getZoom() || zoom}
            </div>
          </div>
        </Card>
      </div>

      {/* Map Container */}
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={true}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={getTileLayerUrl()}
        />
        
        {/* Property markers */}
        {mapProperties.map((property) => (
          <PropertyMarker
            key={property.id}
            property={property}
            onSelect={onPropertySelect}
            getIcon={getPropertyIcon}
          />
        ))}

        {/* Map Controls */}
        {showControls && (
          <MapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleResetView}
            onLocate={handleLocateUser}
          />
        )}
        
        {/* Legend */}
        {showLegend && <MapLegend />}
      </MapContainer>

      {/* Selected Property Details */}
      {selectedProperty && (
        <div className="absolute top-20 right-4 bottom-4 w-80 z-[1000] overflow-hidden">
          <Card className="h-full shadow-xl">
            <div className="h-full overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-bold text-lg">Property Details</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedProperty(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-0">
                <div className="relative">
                  {selectedProperty.images?.[0] && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={selectedProperty.images[0].image}
                        alt={selectedProperty.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        {selectedProperty.is_promoted && (
                          <Badge className="bg-yellow-500 hover:bg-yellow-600">
                            <Star className="h-3 w-3 mr-1" />
                            Promoted
                          </Badge>
                        )}
                        {selectedProperty.is_featured && (
                          <Badge className="bg-purple-500 hover:bg-purple-600">
                            <Award className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {selectedProperty.is_verified && (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1 line-clamp-1">{selectedProperty.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span>{selectedProperty.sub_city?.name || selectedProperty.specific_location || 'Location not specified'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(selectedProperty.price_etb)}
                        {selectedProperty.listing_type === 'for_rent' && '/mo'}
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {selectedProperty.listing_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedProperty.bedrooms}</span>
                        <span className="text-sm text-muted-foreground">Beds</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bath className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedProperty.bathrooms}</span>
                        <span className="text-sm text-muted-foreground">Baths</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Square className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedProperty.total_area}</span>
                        <span className="text-sm text-muted-foreground">m²</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => onPropertySelect(selectedProperty)}
                      >
                        View Full Details
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!selectedProperty.latitude || !selectedProperty.longitude) return
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedProperty.latitude},${selectedProperty.longitude}`
                          window.open(url, '_blank')
                        }}
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Fullscreen Overlay Message */}
      {isFullscreen && (
        <div className="absolute bottom-20 right-4 z-[1000]">
          <Card className="p-3 shadow-lg bg-black/80 text-white">
            <div className="flex items-center gap-2 text-sm">
              <Maximize2 className="h-4 w-4" />
              Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">ESC</kbd> to exit fullscreen
            </div>
          </Card>
        </div>
      )}

      {/* Quick Stats */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <Card className="p-3 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xl font-bold">{mapProperties.length}</div>
              <div className="text-xs text-muted-foreground">Properties</div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <div className="text-lg font-bold">
                {mapProperties.filter(p => p.is_promoted).length}
              </div>
              <div className="text-xs text-muted-foreground">Promoted</div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <div className="text-lg font-bold">
                {mapProperties.filter(p => p.is_featured).length}
              </div>
              <div className="text-xs text-muted-foreground">Featured</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default React.memo(MapView)