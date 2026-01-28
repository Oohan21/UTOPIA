'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from "@/components/common/Header/Header";
import { useQuery } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
import { useAuthStore } from '@/lib/store/authStore'
import { useSearchStore } from '@/lib/store/searchStore'
import { useComparisonStore } from '@/lib/store/comparisonStore'
import { Property, City, SubCity, PropertyFilters as PropertyFiltersType, ApiResponse, Amenity } from '@/lib/types/property'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import PropertyCard from '@/components/listings/PropertyCard'
import SearchHistory from '@/components/listings/SearchHistory'
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
  Zap,
  Ruler,
  Settings,
  Bookmark,
  RefreshCw,
  FilterX,
  ArrowDownUp,
  Sparkles,
  Calendar,
  Heart,
  Target,
  Tag,
  Timer,
  Dumbbell,
  Droplets,
  Thermometer,
  Wifi,
  Car,
  Accessibility,
  ShieldCheck,
  Users,
  Users as UsersIcon,
  FileText,
  Crown,
  Calendar as CalendarIcon,
  ShieldAlert,
  Award,
  Gem,
  Home as HomeIcon,
  Building as BuildingIcon,
  Store as StoreIcon,
  LandPlot,
  Factory,
  Castle,
  Warehouse as WarehouseIcon,
  School,
  Hotel as HotelIcon,
  Wind,
  Waves,
  Sun,
  Snowflake,
  Shield,
  Key,
  Sofa,
  Bath as BathIcon,
  Armchair,
  Tractor,
  ThermometerSun,
  Fan,
  Smartphone,
  Tv as TvIcon,
  Monitor,
  Headphones,
  Printer,
  Router,
  Battery,
  Plug,
  Lightbulb,
  Lock,
  Video,
  Bell,
  Siren,
  Fingerprint,
  Camera,
  ShieldOff,
  AlarmClock,
  ClipboardCheck,
  FileCheck,
  Award as AwardIcon,
  BadgeCheck,
  Crown as CrownIcon,
  Medal,
  Trophy,
  Target as TargetIcon,
  Zap as ZapIcon,
  Clock as ClockIcon,
  CalendarDays,
  Sunrise,
  Sunset,
  Moon,
  CloudRain,
  Wind as WindIcon,
  ThermometerSnowflake,
  FireExtinguisher,
  Car as CarIcon,
  Bike,
  Bus,
  Train,
  Ship,
  Plane,
  Navigation,
  Compass,
  Globe,
  Map,
  Navigation2,
  Locate,
  NavigationOff,
  MapPinned,
  Pin,
  PinOff,
  Route,
  GitBranch,
  Globe2,
  Map as MapIcon2,
  Navigation as NavigationIcon,
  Leaf,
  Wine,
  SquareParking,
  Armchair as ArmchairIcon,
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
import { ScrollArea } from '@/components/ui/Scroll-area'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Label } from '@/components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu'
import { Slider } from '@/components/ui/Slider'
import { Switch } from '@/components/ui/Switch'
import dynamic from 'next/dynamic'

// Import next-intl hooks
import { useTranslations, useLocale } from 'next-intl'

// Dynamically import MapView with loading state
const MapView = dynamic(() => import('@/components/properties/MapView'), {
  ssr: false,
  loading: () => {
    const t = useTranslations('listings.map');
    return (
      <div className="h-[400px] md:h-[600px] w-full flex items-center justify-center bg-muted dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin mx-auto mb-2 md:mb-4 text-primary" />
          <p className="text-muted-foreground dark:text-gray-400 text-sm md:text-base">
            {t('loadingMap')}
          </p>
        </div>
      </div>
    )
  }
})

// Enhanced Price Range Slider
const EnhancedPriceRangeSlider: React.FC<{
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  currency?: string;
}> = ({ min, max, value, onChange, currency = 'ETB' }) => {
  const t = useTranslations('listings');
  const [localValue, setLocalValue] = useState<number[]>(value)

  const steps = useMemo(() => {
    const diff = max - min
    if (diff > 10000000) return 100000
    if (diff > 1000000) return 50000
    if (diff > 100000) return 10000
    return 1000
  }, [min, max])

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M ${currency}`
    if (price >= 1000) return `${(price / 1000).toFixed(0)}K ${currency}`
    return `${price} ${currency}`
  }

  const handleSliderChange = (value: number[]) => {
    setLocalValue(value)
  }

  const handleSliderCommit = (value: number[]) => {
    onChange([value[0], value[1]])
  }

  return (
    <div className="space-y-3 md:space-y-4 p-2">
      <div className="flex justify-between items-center">
        <Label className="text-xs md:text-sm font-medium">
          {t('filters.priceRange')}
        </Label>
        <Badge variant="outline" className="text-xs">
          {formatPrice(localValue[0])} - {formatPrice(localValue[1])}
        </Badge>
      </div>
      <Slider
        min={min}
        max={max}
        step={steps}
        value={localValue}
        onValueChange={handleSliderChange}
        onValueCommit={handleSliderCommit}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground dark:text-gray-400">
        <span className="font-medium">
          {t('filters.min')}: {formatPrice(min)}
        </span>
        <span className="font-medium">
          {t('filters.max')}: {formatPrice(max)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="min-price" className="text-xs">
            {t('filters.min')} Price
          </Label>
          <Input
            id="min-price"
            type="number"
            value={localValue[0]}
            onChange={(e) => {
              const newMin = Math.min(Number(e.target.value), localValue[1])
              setLocalValue([newMin, localValue[1]])
            }}
            onBlur={() => onChange([localValue[0], localValue[1]])}
            className="h-7 md:h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="max-price" className="text-xs">
            {t('filters.max')} Price
          </Label>
          <Input
            id="max-price"
            type="number"
            value={localValue[1]}
            onChange={(e) => {
              const newMax = Math.max(Number(e.target.value), localValue[0])
              setLocalValue([localValue[0], newMax])
            }}
            onBlur={() => onChange([localValue[0], localValue[1]])}
            className="h-7 md:h-8 text-sm"
          />
        </div>
      </div>
    </div>
  )
}

// Enhanced Area Range Slider
const EnhancedAreaRangeSlider: React.FC<{
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}> = ({ min, max, value, onChange }) => {
  const t = useTranslations('listings');
  const [localValue, setLocalValue] = useState<number[]>(value)

  const formatArea = (area: number) => {
    if (area >= 10000) return `${(area / 10000).toFixed(1)} hectare`
    if (area >= 1000) return `${(area / 1000).toFixed(1)} thousand m²`
    return `${area} m²`
  }

  const handleSliderChange = (value: number[]) => {
    setLocalValue(value)
  }

  const handleSliderCommit = (value: number[]) => {
    onChange([value[0], value[1]])
  }

  return (
    <div className="space-y-3 md:space-y-4 p-2">
      <div className="flex justify-between items-center">
        <Label className="text-xs md:text-sm font-medium">
          {t('filters.areaRange')}
        </Label>
        <Badge variant="outline" className="text-xs">
          {formatArea(localValue[0])} - {formatArea(localValue[1])}
        </Badge>
      </div>
      <Slider
        min={min}
        max={max}
        step={10}
        value={localValue}
        onValueChange={handleSliderChange}
        onValueCommit={handleSliderCommit}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground dark:text-gray-400">
        <span className="font-medium">
          {t('filters.min')}: {formatArea(min)}
        </span>
        <span className="font-medium">
          {t('filters.max')}: {formatArea(max)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="min-area" className="text-xs">
            {t('filters.min')} Area (m²)
          </Label>
          <Input
            id="min-area"
            type="number"
            value={localValue[0]}
            onChange={(e) => {
              const newMin = Math.min(Number(e.target.value), localValue[1])
              setLocalValue([newMin, localValue[1]])
            }}
            onBlur={() => onChange([localValue[0], localValue[1]])}
            className="h-7 md:h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="max-area" className="text-xs">
            {t('filters.max')} Area (m²)
          </Label>
          <Input
            id="max-area"
            type="number"
            value={localValue[1]}
            onChange={(e) => {
              const newMax = Math.max(Number(e.target.value), localValue[0])
              setLocalValue([localValue[0], newMax])
            }}
            onBlur={() => onChange([localValue[0], localValue[1]])}
            className="h-7 md:h-8 text-sm"
          />
        </div>
      </div>
    </div>
  )
}

// Featured Properties Carousel Component
const FeaturedPropertiesCarousel: React.FC<{
  featuredProperties: Property[];
  onPropertyClick: (property: Property) => void;
}> = ({ featuredProperties, onPropertyClick }) => {
  const t = useTranslations('listings.featured');
  const tProperty = useTranslations('property');
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-rotate featured properties
  useEffect(() => {
    if (featuredProperties.length <= 1 || isPaused) return

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === featuredProperties.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [featuredProperties.length, isPaused])

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === featuredProperties.length - 1 ? 0 : prevIndex + 1
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? featuredProperties.length - 1 : prevIndex - 1
    )
  }

  if (!featuredProperties || featuredProperties.length === 0) {
    return null
  }

  const currentProperty = featuredProperties[currentIndex]

  return (
    <Card className="mb-6 md:mb-8 border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/30 dark:to-yellow-950/30 overflow-hidden">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 p-2 md:p-3">
              <Star className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-bold text-amber-900 dark:text-amber-100">
                {t('title')}
              </h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm md:text-base">
                {t('subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              className="rounded-full border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 h-8 w-8 md:h-10 md:w-10"
              disabled={featuredProperties.length <= 1}
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <div className="text-center">
              <span className="text-xs md:text-sm text-amber-700 dark:text-amber-300">
                {currentIndex + 1} of {featuredProperties.length}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={nextSlide}
              className="rounded-full border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 h-8 w-8 md:h-10 md:w-10"
              disabled={featuredProperties.length <= 1}
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-lg md:rounded-xl bg-gradient-to-br from-white to-amber-50 dark:from-gray-900 dark:to-amber-950/20 shadow-lg"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Featured Property Display */}
          <div className="flex flex-col lg:flex-row">
            {/* Image */}
            <div className="lg:w-2/5">
              <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
                {currentProperty.images?.[0] && (
                  <img
                    src={currentProperty.images[0].image}
                    alt={currentProperty.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                {/* Featured Badge */}
                <div className="absolute top-2 left-2 md:top-4 md:left-4">
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 font-bold text-xs md:text-sm">
                    <Star className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
                    {t('featuredCount', { count: 1 })}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="lg:w-3/5 p-4 md:p-6 lg:p-8">
              <div className="mb-3 md:mb-4">
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2 line-clamp-2">
                  {currentProperty.title}
                </h3>
                <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2 md:mb-3 text-sm md:text-base">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="truncate">{currentProperty.specific_location}, {currentProperty.sub_city?.name}</span>
                </div>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
                {currentProperty.bedrooms > 0 && (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-1.5 md:p-2">
                      <Bed className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                        {currentProperty.bedrooms}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {tProperty('bedrooms')}
                      </div>
                    </div>
                  </div>
                )}
                {currentProperty.bathrooms > 0 && (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="rounded-full bg-green-100 dark:bg-green-900 p-1.5 md:p-2">
                      <Bath className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                        {currentProperty.bathrooms}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {tProperty('bathrooms')}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-1.5 md:p-2">
                    <Ruler className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                      {currentProperty.total_area}m²
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {tProperty('area')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-1.5 md:p-2">
                    <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                      {formatCurrency(currentProperty.price_etb)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {currentProperty.listing_type === 'for_rent' ? tProperty('perMonth') : tProperty('price')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-4 md:mb-6 line-clamp-2 text-sm md:text-base">
                {currentProperty.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                <Button
                  onClick={() => onPropertyClick(currentProperty)}
                  className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-sm md:text-base py-2 md:py-3"
                >
                  {tProperty('viewDetails')}
                  <ExternalLink className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900 text-sm md:text-base py-2 md:py-3"
                >
                  <Heart className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                  {tProperty('saveProperty')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Property Indicators */}
        {featuredProperties.length > 1 && (
          <div className="flex justify-center gap-1.5 md:gap-2 mt-4 md:mt-6">
            {featuredProperties.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${index === currentIndex
                  ? 'bg-amber-500 w-4 md:w-6'
                  : 'bg-amber-300 dark:bg-amber-700 hover:bg-amber-400 dark:hover:bg-amber-600'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Simplified Filters Panel Component
const SimplifiedFiltersPanel: React.FC<{
  filters: PropertyFiltersType;
  onFilterChange: (updates: Partial<PropertyFiltersType>) => void;
  onResetFilters: () => void;
  cities: City[];
  subCities: SubCity[];
  amenities: Amenity[];
  isOpen: boolean;
  onClose: () => void;
}> = ({ filters, onFilterChange, onResetFilters, cities, subCities, amenities, isOpen, onClose }) => {
  const t = useTranslations('listings');
  const tProperty = useTranslations('property');
  const [activeTab, setActiveTab] = useState('basic')
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.min_price || 0,
    filters.max_price || 100000000
  ])
  const [areaRange, setAreaRange] = useState<[number, number]>([
    filters.min_area || 0,
    filters.max_area || 10000
  ])

  // Updated property types
  const PROPERTY_TYPES = [
    { value: 'house', label: t('propertyTypes.house'), icon: <Home className="h-4 w-4" /> },
    { value: 'apartment', label: t('propertyTypes.apartment'), icon: <Building className="h-4 w-4" /> },
    { value: 'villa', label: t('propertyTypes.villa'), icon: <Castle className="h-4 w-4" /> },
    { value: 'commercial', label: t('propertyTypes.commercial'), icon: <Store className="h-4 w-4" /> },
    { value: 'land', label: t('propertyTypes.land'), icon: <LandPlot className="h-4 w-4" /> },
    { value: 'office', label: t('propertyTypes.office'), icon: <Briefcase className="h-4 w-4" /> },
    { value: 'warehouse', label: t('propertyTypes.warehouse'), icon: <WarehouseIcon className="h-4 w-4" /> },
    { value: 'farm', label: t('propertyTypes.farm'), icon: <Tractor className="h-4 w-4" /> },
    { value: 'hotel', label: t('propertyTypes.hotel'), icon: <HotelIcon className="h-4 w-4" /> },
    { value: 'other', label: t('propertyTypes.other'), icon: <HomeIcon className="h-4 w-4" /> },
  ]

  // Amenity categories
  const amenityCategories = [
    {
      category: t('filters.essentials'),
      amenities: [
        { key: 'has_parking', label: tProperty('features.parking'), icon: <Car className="h-4 w-4" /> },
        { key: 'has_security', label: tProperty('features.security'), icon: <Shield className="h-4 w-4" /> },
        { key: 'has_backup_water', label: tProperty('features.waterBackup'), icon: <Droplets className="h-4 w-4" /> },
        { key: 'has_generator', label: tProperty('features.generator'), icon: <Zap className="h-4 w-4" /> },
      ]
    },
    {
      category: t('filters.comfort'),
      amenities: [
        { key: 'has_air_conditioning', label: tProperty('features.ac'), icon: <ThermometerSun className="h-4 w-4" /> },
        { key: 'has_heating', label: tProperty('features.heating'), icon: <Thermometer className="h-4 w-4" /> },
        { key: 'has_elevator', label: tProperty('features.elevator'), icon: <ArrowDownUp className="h-4 w-4" /> },
        { key: 'has_furniture', label: tProperty('features.furnished'), icon: <Sofa className="h-4 w-4" /> },
      ]
    },
    {
      category: t('filters.lifestyle'),
      amenities: [
        { key: 'has_swimming_pool', label: tProperty('features.swimmingPool'), icon: <Waves className="h-4 w-4" /> },
        { key: 'has_gym', label: tProperty('features.gym'), icon: <Dumbbell className="h-4 w-4" /> },
        { key: 'has_garden', label: tProperty('features.garden'), icon: <Trees className="h-4 w-4" /> },
        { key: 'has_conference_room', label: tProperty('features.conferenceRoom'), icon: <Users className="h-4 w-4" /> },
      ]
    }
  ]

  if (!isOpen) return null

  return (
    <Card className="mb-4 md:mb-6 border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20 dark:from-gray-900 dark:to-gray-800/20">
      <CardContent className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
              <Filter className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold">{t('filter')}</h3>
              <p className="text-xs md:text-sm text-muted-foreground dark:text-gray-400">
                Refine your search with detailed criteria
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="gap-1 md:gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs md:text-sm"
          >
            <RefreshCw className="h-3 w-3 md:h-4 md:w-4" />
            {t('actions.resetAll')}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 md:mb-6">
            <TabsTrigger value="basic" className="gap-1 md:gap-2 text-xs md:text-sm">
              <Home className="h-3 w-3 md:h-4 md:w-4" />
              {t('filters.advancedFilters')}
            </TabsTrigger>
            <TabsTrigger value="location" className="gap-1 md:gap-2 text-xs md:text-sm">
              <MapPin className="h-3 w-3 md:h-4 md:w-4" />
              {t('filters.location')}
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-1 md:gap-2 text-xs md:text-sm">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
              {t('features')}
            </TabsTrigger>
          </TabsList>

          {/* Basic Filters Tab */}
          <TabsContent value="basic" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="space-y-2 md:space-y-3">
                <Label className="font-semibold text-sm md:text-base">
                  {t('filters.propertyType')}
                </Label>
                <div className="space-y-1.5 md:space-y-2">
                  {PROPERTY_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.value}`}
                        checked={filters.property_type === type.value}
                        onCheckedChange={(checked) => {
                          if (checked === true) {
                            onFilterChange({ property_type: type.value })
                          } else {
                            onFilterChange({ property_type: undefined })
                          }
                        }}
                      />
                      <Label htmlFor={`type-${type.value}`} className="flex items-center gap-1 md:gap-2 cursor-pointer text-sm">
                        {type.icon}
                        <span>{type.label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <Label className="font-semibold text-sm md:text-base">
                  {t('listingTypes.all')}
                </Label>
                <div className="space-y-1.5 md:space-y-2">
                  {[
                    { value: 'for_sale', label: t('listingTypes.for_sale'), color: 'bg-green-500' },
                    { value: 'for_rent', label: t('listingTypes.for_rent'), color: 'bg-blue-500' },
                  ].map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`listing-${type.value}`}
                        checked={filters.listing_type === type.value}
                        onCheckedChange={(checked) => {
                          if (checked === true) {
                            onFilterChange({ listing_type: type.value })
                          } else {
                            onFilterChange({ listing_type: undefined })
                          }
                        }}
                      />
                      <Label htmlFor={`listing-${type.value}`} className="cursor-pointer text-sm">
                        <div className="flex items-center gap-1 md:gap-2">
                          <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${type.color}`} />
                          <span>{type.label}</span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 md:space-y-3 mt-4 md:mt-6">
                  <Label className="font-semibold text-sm md:text-base">
                    Rooms
                  </Label>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="bedrooms" className="text-xs">
                        {tProperty('bedrooms')}
                      </Label>
                      <Select
                        value={filters.min_bedrooms?.toString() || t('bedrooms.any')}
                        onValueChange={(value) => onFilterChange({
                          min_bedrooms: value === t('bedrooms.any') ? undefined : parseInt(value)
                        })}
                        placeholder={t('bedrooms.any')}
                      >
                        <SelectContent>
                          <SelectItem value={t('bedrooms.any')}>{t('bedrooms.any')}</SelectItem>
                          <SelectItem value="1">{t('bedrooms.1')}</SelectItem>
                          <SelectItem value="2">{t('bedrooms.2')}</SelectItem>
                          <SelectItem value="3">{t('bedrooms.3')}</SelectItem>
                          <SelectItem value="4">{t('bedrooms.4')}</SelectItem>
                          <SelectItem value="5">{t('bedrooms.5')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bathrooms" className="text-xs">
                        {tProperty('bathrooms')}
                      </Label>
                      <Select
                        value={filters.min_bathrooms?.toString() || t('bathrooms.any')}
                        onValueChange={(value) => onFilterChange({
                          min_bathrooms: value === t('bathrooms.any') ? undefined : parseInt(value)
                        })}
                        placeholder={t('bathrooms.any')}
                      >
                        <SelectContent>
                          <SelectItem value={t('bathrooms.any')}>{t('bathrooms.any')}</SelectItem>
                          <SelectItem value="1">{t('bathrooms.1')}</SelectItem>
                          <SelectItem value="2">{t('bathrooms.2')}</SelectItem>
                          <SelectItem value="3">{t('bathrooms.3')}</SelectItem>
                          <SelectItem value="4">{t('bathrooms.4')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <Label className="font-semibold text-sm md:text-base">
                  {t('filters.propertyStatus')}
                </Label>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="verified"
                      checked={!!filters.is_verified}
                      onCheckedChange={(checked) => onFilterChange({ is_verified: checked === true ? true : undefined })}
                    />
                    <Label htmlFor="verified" className="flex items-center gap-1 md:gap-2 cursor-pointer text-sm">
                      <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                      <span>{t('filters.verifiedOnly')}</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={!!filters.is_featured}
                      onCheckedChange={(checked) => onFilterChange({ is_featured: checked === true ? true : undefined })}
                    />
                    <Label htmlFor="featured" className="flex items-center gap-1 md:gap-2 cursor-pointer text-sm">
                      <Star className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
                      <span>{t('filters.featuredOnly')}</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="promoted"
                      checked={!!filters.is_promoted}
                      onCheckedChange={(checked) => onFilterChange({ is_promoted: checked === true ? true : undefined })}
                    />
                    <Label htmlFor="promoted" className="flex items-center gap-1 md:gap-2 cursor-pointer text-sm">
                      <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                      <span>{t('filters.promotedOnly')}</span>
                    </Label>
                  </div>
                </div>

                <div className="space-y-2 md:space-y-3 mt-4 md:mt-6">
                  <Label className="font-semibold text-sm md:text-base">
                    Price & Area
                  </Label>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                    <Card className="border dark:border-gray-800">
                      <CardHeader className="pb-2 md:pb-3">
                        <CardTitle className="text-xs md:text-sm font-semibold flex items-center gap-1 md:gap-2">
                          <DollarSign className="h-3 w-3 md:h-4 md:w-4" />
                          {t('filters.priceRange')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <EnhancedPriceRangeSlider
                          min={0}
                          max={100000000}
                          value={priceRange}
                          onChange={(value) => {
                            setPriceRange(value)
                            onFilterChange({
                              min_price: value[0],
                              max_price: value[1]
                            })
                          }}
                        />
                      </CardContent>
                    </Card>

                    <Card className="border dark:border-gray-800">
                      <CardHeader className="pb-2 md:pb-3">
                        <CardTitle className="text-xs md:text-sm font-semibold flex items-center gap-1 md:gap-2">
                          <Ruler className="h-3 w-3 md:h-4 md:w-4" />
                          {t('filters.areaRange')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <EnhancedAreaRangeSlider
                          min={0}
                          max={10000}
                          value={areaRange}
                          onChange={(value) => {
                            setAreaRange(value)
                            onFilterChange({
                              min_area: value[0],
                              max_area: value[1]
                            })
                          }}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="font-semibold text-sm md:text-base">
                    {t('filters.selectCity')}
                  </Label>
                  <Select
                    value={filters.city?.toString() || ''}
                    onValueChange={(value) => onFilterChange({
                      city: value ? parseInt(value) : undefined,
                      sub_city: undefined
                    })}
                    placeholder={t('filters.selectCity')}
                  >
                    <SelectContent>
                      <SelectItem value="all">{t('filters.allCities')}</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          <div className="flex items-center gap-1 md:gap-2">
                            <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                            {city.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {filters.city && (
                  <div className="space-y-1.5 md:space-y-2">
                    <Label className="font-semibold text-sm md:text-base">
                      {t('filters.selectArea')}
                    </Label>
                    <Select
                      value={filters.sub_city?.toString() || ''}
                      onValueChange={(value) => onFilterChange({
                        sub_city: value ? parseInt(value) : undefined
                      })}
                      placeholder={t('filters.selectArea')}
                    >
                      <SelectContent>
                        <SelectItem value="all">{t('filters.allAreas')}</SelectItem>
                        {subCities.map((subCity) => (
                          <SelectItem key={subCity.id} value={subCity.id.toString()}>
                            <div className="flex items-center gap-1 md:gap-2">
                              <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                              {subCity.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-3 md:space-y-4">
                <div className="space-y-1.5 md:space-y-2">
                  <Label className="font-semibold text-sm md:text-base">
                    Additional Filters
                  </Label>
                  <div className="space-y-2 md:space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="furnishing_type" className="text-xs md:text-sm">
                        {t('filters.furnishingType')}
                      </Label>
                      <Select
                        value={filters.furnishing_type || t('furnishingTypes.any')}
                        onValueChange={(value) => onFilterChange({
                          furnishing_type: value === t('furnishingTypes.any') ? undefined : value
                        })}
                        placeholder={t('furnishingTypes.any')}
                      >
                        <SelectContent>
                          <SelectItem value={t('furnishingTypes.any')}>{t('furnishingTypes.any')}</SelectItem>
                          <SelectItem value="furnished">{t('furnishingTypes.furnished')}</SelectItem>
                          <SelectItem value="semi_furnished">{t('furnishingTypes.semi_furnished')}</SelectItem>
                          <SelectItem value="unfurnished">{t('furnishingTypes.unfurnished')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="built_year" className="text-xs md:text-sm">
                        {t('filters.yearBuilt')}
                      </Label>
                      <Select
                        value={filters.built_year?.toString() || 'any'}
                        onValueChange={(value) => onFilterChange({
                          built_year: value === 'any' ? undefined : parseInt(value)
                        })}
                        placeholder="Any Year"
                      >
                        <SelectContent>
                          <SelectItem value="any">Any Year</SelectItem>
                          <SelectItem value="2023">2023+</SelectItem>
                          <SelectItem value="2020">2020+</SelectItem>
                          <SelectItem value="2015">2015+</SelectItem>
                          <SelectItem value="2010">2010+</SelectItem>
                          <SelectItem value="2000">2000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {amenityCategories.map((category) => (
                <div key={category.category} className="space-y-2 md:space-y-3">
                  <Label className="font-semibold text-sm md:text-base">{category.category}</Label>
                  <div className="space-y-1.5 md:space-y-2">
                    {category.amenities.map((amenity) => (
                      <div key={amenity.key} className="flex items-center space-x-2">
                        <Switch
                          id={amenity.key}
                          checked={!!filters[amenity.key as keyof PropertyFiltersType]}
                          onCheckedChange={(checked) => onFilterChange({ [amenity.key]: checked === true ? true : undefined })}
                        />
                        <Label htmlFor={amenity.key} className="flex items-center gap-1 md:gap-2 cursor-pointer text-sm">
                          {amenity.icon}
                          <span>{amenity.label}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 md:pt-6 border-t dark:border-gray-800 gap-3">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Badge variant="outline" className="gap-1 md:gap-2 text-xs">
              <Filter className="h-2.5 w-2.5 md:h-3 md:w-3" />
              {Object.keys(filters).filter(key =>
                !['page', 'page_size', 'ordering'].includes(key) &&
                filters[key] !== undefined &&
                filters[key] !== '' &&
                typeof filters[key] !== 'object'
              ).length} {t('results.activeFilters', {
                count: Object.keys(filters).filter(key =>
                  !['page', 'page_size', 'ordering'].includes(key) &&
                  filters[key] !== undefined &&
                  filters[key] !== '' &&
                  typeof filters[key] !== 'object'
                ).length
              })}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPriceRange([0, 100000000])
                setAreaRange([0, 10000])
                onResetFilters()
              }}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              <X className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              {t('actions.clearAll')}
            </Button>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            <Button variant="outline" onClick={onClose} className="text-xs md:text-sm">
              {t('actions.applyClose')}
            </Button>
            <Button onClick={() => setActiveTab('basic')} className="bg-gradient-to-r from-primary to-secondary text-xs md:text-sm">
              {t('actions.applyFilters')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Active Filters Display
const EnhancedActiveFilters: React.FC<{
  filters: PropertyFiltersType;
  onRemoveFilter: (key: string) => void;
  onResetFilters: () => void;
  cities: City[];
  subCities: SubCity[];
}> = ({ filters, onRemoveFilter, onResetFilters, cities, subCities }) => {
  const t = useTranslations('listings');
  const tProperty = useTranslations('property');

  const getFilterValueDisplay = (key: string, value: any): string => {
    switch (key) {
      case 'property_type':
        const propType = t(`propertyTypes.${value}`);
        return propType || value.replace('_', ' ').charAt(0).toUpperCase() + value.replace('_', ' ').slice(1);
      case 'listing_type':
        return value === 'for_sale' ? t('listingTypes.for_sale') : t('listingTypes.for_rent');
      case 'min_bedrooms':
        return t('bedrooms.' + value) || `${value}+ bedrooms`;
      case 'min_bathrooms':
        return t('bathrooms.' + value) || `${value}+ bathrooms`;
      case 'city':
        return cities.find(c => c.id === value)?.name || `City ${value}`;
      case 'sub_city':
        return subCities.find(sc => sc.id === value)?.name || `Area ${value}`;
      case 'min_price':
        return `${t('filters.min')} ${formatCurrency(value)}`;
      case 'max_price':
        return `${t('filters.max')} ${formatCurrency(value)}`;
      case 'min_area':
        return `${t('filters.min')} ${value}m²`;
      case 'max_area':
        return `${t('filters.max')} ${value}m²`;
      case 'is_verified':
        return t('filters.verifiedOnly');
      case 'is_featured':
        return t('filters.featuredOnly');
      case 'is_promoted':
        return t('filters.promotedOnly');
      case 'has_parking':
        return tProperty('features.parking');
      case 'has_garden':
        return tProperty('features.garden');
      case 'has_security':
        return tProperty('features.security');
      case 'has_air_conditioning':
        return tProperty('features.ac');
      case 'has_furniture':
        return tProperty('features.furnished');
      case 'furnishing_type':
        return t(`furnishingTypes.${value}`) || value.charAt(0).toUpperCase() + value.slice(1);
      case 'condition':
        return value.charAt(0).toUpperCase() + value.slice(1);
      default:
        return String(value);
    }
  }

  const getFilterIcon = (key: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      property_type: <Home className="h-3 w-3" />,
      listing_type: <Tag className="h-3 w-3" />,
      min_bedrooms: <Bed className="h-3 w-3" />,
      min_bathrooms: <Bath className="h-3 w-3" />,
      city: <MapPin className="h-3 w-3" />,
      sub_city: <MapPin className="h-3 w-3" />,
      min_price: <DollarSign className="h-3 w-3" />,
      max_price: <DollarSign className="h-3 w-3" />,
      min_area: <Ruler className="h-3 w-3" />,
      max_area: <Ruler className="h-3 w-3" />,
      is_verified: <CheckCircle className="h-3 w-3" />,
      is_featured: <Star className="h-3 w-3" />,
      is_promoted: <TrendingUp className="h-3 w-3" />,
      has_parking: <Car className="h-3 w-3" />,
      has_garden: <Trees className="h-3 w-3" />,
      has_security: <Shield className="h-3 w-3" />,
      has_air_conditioning: <Thermometer className="h-3 w-3" />,
      has_furniture: <Sofa className="h-3 w-3" />,
      furnishing_type: <Armchair className="h-3 w-3" />,
      condition: <Award className="h-3 w-3" />,
    }
    return iconMap[key] || <Filter className="h-3 w-3" />;
  }

  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => {
      const excludeKeys = ['page', 'page_size', 'ordering', 'search'];
      return !excludeKeys.includes(key) && value !== undefined && value !== '' && value !== null;
    })
    .slice(0, 10) // Limit to 10 displayed filters

  if (activeFilters.length === 0) return null

  return (
    <Card className="mb-4 md:mb-6 border-l-4 border-primary/50 dark:border-primary/30">
      <CardContent className="p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 md:mb-3 gap-2">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
            <h4 className="font-semibold text-sm md:text-base">
              Active Filters
            </h4>
            <Badge variant="outline" className="ml-1 md:ml-2 text-xs">
              {activeFilters.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-6 md:h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" />
            {t('actions.clearAll')}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {activeFilters.map(([key, value]) => (
            <Badge
              key={key}
              variant="secondary"
              className="gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 hover:bg-muted cursor-pointer transition-all text-xs"
              onClick={() => onRemoveFilter(key)}
            >
              <span className="text-muted-foreground">{getFilterIcon(key)}</span>
              <span className="font-medium hidden sm:inline">{key.replace('_', ' ')}:</span>
              <span className="font-medium sm:hidden">{key.replace('_', ' ').slice(0, 3)}:</span>
              <span className="text-foreground dark:text-white truncate max-w-[80px] md:max-w-[120px]">
                {getFilterValueDisplay(key, value)}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFilter(key);
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-2.5 w-2.5 md:h-3 md:w-3" />
              </button>
            </Badge>
          ))}
          {activeFilters.length > 10 && (
            <Badge variant="outline" className="px-2 md:px-3 py-1 md:py-1.5 text-xs">
              +{activeFilters.length - 10} more
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Pagination Component
const PaginationComponent: React.FC<{
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, totalCount, pageSize, onPageChange }) => {
  const t = useTranslations('listings');

  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 border-t dark:border-gray-800">
      <div className="text-sm text-muted-foreground dark:text-gray-400">
        {t('results.showing', {
          start: startItem,
          end: endItem,
          total: totalCount
        })}
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

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(page as number)}
              >
                {page}
              </Button>
            )
          ))}
        </div>

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

      <div className="flex items-center gap-2">

      </div>
    </div>
  );
};

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Main Page Component - WITH PAGINATION
export default function ListingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const searchStore = useSearchStore();
  const locale = useLocale();

  // Translations
  const t = useTranslations('listings');
  const tCommon = useTranslations('common');
  const tProperty = useTranslations('property');
  const tHome = useTranslations('home');

  // Comparison store
  const comparisonStore = useComparisonStore() as any;
  const comparisonProperties = comparisonStore.comparisonProperties || [];

  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [isComparisonBarVisible, setIsComparisonBarVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  // PAGINATION STATE
  const [filters, setFilters] = useState<PropertyFiltersType>({
    page: 1,
    page_size: 12,
    ordering: '-promotion_priority,-created_at',
  });

  // Search input with debounce
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  // Refs
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from URL params
  useEffect(() => {
    if (!searchParams || isInitialized) return;

    const params = new URLSearchParams(searchParams.toString());
    const updates: Partial<PropertyFiltersType> = {};

    params.forEach((value, key) => {
      if (key === 'page' || key === 'page_size') {
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
          updates[key] = numValue;
        }
      } else if (key === 'search' && value) {
        updates[key] = value;
        setSearchInput(value);
      } else if (key === 'city' || key === 'sub_city') {
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
          updates[key] = numValue;
        }
      } else if (['min_price', 'max_price', 'min_bedrooms', 'max_bedrooms',
        'min_bathrooms', 'built_year', 'min_area', 'max_area', 'radius'].includes(key)) {
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
          updates[key] = numValue;
        }
      } else if (['property_type', 'listing_type', 'furnishing_type', 'ordering',
        'condition', 'price_per_sqm'].includes(key)) {
        updates[key] = value;
      } else if (['is_promoted', 'is_featured', 'is_verified', 'has_parking',
        'has_garden', 'has_security', 'has_furniture', 'has_air_conditioning',
        'has_internet', 'has_generator', 'has_elevator', 'has_swimming_pool',
        'has_gym', 'has_conference_room', 'is_pet_friendly', 'is_wheelchair_accessible',
        'has_backup_water', 'near_school', 'near_hospital', 'near_mall', 'near_park',
        'green_certified', 'energy_efficient', 'award_winning', 'historic',
        'has_view', 'corner_unit', 'penthouse', 'ground_floor', 'top_floor',
        'private_entrance', 'separate_kitchen', 'maid_room', 'has_fireplace',
        'has_sauna', 'has_wine_cellar', 'has_cinema', 'has_smart_home',
        'has_balcony', 'has_terrace', 'has_basement', 'has_concierge'].includes(key)) {
        updates[key] = value === 'true';
      }
    });

    setFilters(prev => ({ ...prev, ...updates }));
    setIsInitialized(true);
  }, [searchParams, isInitialized]);

  // Update URL when filters change
  useEffect(() => {
    if (!isInitialized) return;

    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }

    urlUpdateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (key === 'ordering' && value === '-promotion_priority,-created_at') {
            return;
          }
          params.set(key, String(value));
        }
      });

      const newUrl = `/listings${params.toString() ? `?${params.toString()}` : ''}`;
      const currentUrl = window.location.pathname + window.location.search;

      if (newUrl !== currentUrl) {
        router.replace(newUrl, { scroll: false });
      }
    }, 300);

    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, [filters, router, isInitialized]);

  // Update search filter from debounced search
  useEffect(() => {
    if (!isInitialized) return;

    const currentSearch = filters.search;
    const newSearch = debouncedSearch || undefined;

    if (currentSearch !== newSearch) {
      handleFilterChange({ search: newSearch, page: 1 });
    }
  }, [debouncedSearch, isInitialized]);

  // Show comparison bar
  useEffect(() => {
    setIsComparisonBarVisible(comparisonProperties.length > 0);
  }, [comparisonProperties]);

  // Fetch cities
  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      try {
        const data = await listingsApi.getCities();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching cities:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch sub-cities
  const { data: subCitiesData } = useQuery({
    queryKey: ['subCities', filters.city],
    queryFn: async () => {
      if (!filters.city) return [];

      try {
        const data = await listingsApi.getSubCities(filters.city);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching sub-cities:', error);
        return [];
      }
    },
    enabled: !!filters.city,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch amenities
  const { data: amenitiesData } = useQuery({
    queryKey: ['amenities'],
    queryFn: async () => {
      try {
        const data = await listingsApi.getAmenities();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching amenities:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch properties with pagination
  const {
    data: propertiesData,
    isLoading: isLoadingProperties,
    error: propertiesError,
    refetch,
  } = useQuery({
    queryKey: ['properties', { ...filters }],
    queryFn: () => listingsApi.getProperties(filters),
    staleTime: 30 * 1000,
    retry: 1,
    enabled: isInitialized,
  });

  // Fetch featured properties
  const { data: featuredProperties = [] } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => listingsApi.getFeaturedProperties(),
    staleTime: 2 * 60 * 1000,
  });

  // Load search history on mount
  useEffect(() => {
    searchStore.loadSearchHistory();
    searchStore.loadPopularSearches();
  }, []);

  // Process data
  const properties = (propertiesData as ApiResponse<Property>)?.results || [];
  const totalCount = (propertiesData as ApiResponse<Property>)?.count || 0;
  const totalPages = Math.ceil(totalCount / (filters.page_size || 12));
  const cities: City[] = Array.isArray(citiesData) ? citiesData : [];
  const subCities: SubCity[] = Array.isArray(subCitiesData) ? subCitiesData : [];
  const amenities: Amenity[] = Array.isArray(amenitiesData) ? amenitiesData : [];

  // Filter properties with valid coordinates for map view
  const mapProperties = useMemo(() => {
    return properties.filter(p =>
      p.latitude &&
      p.longitude &&
      Math.abs(p.latitude) <= 90 &&
      Math.abs(p.longitude) <= 180
    );
  }, [properties]);

  // Calculate map center
  const mapCenter = useMemo((): [number, number] => {
    if (mapProperties.length > 0) {
      const firstProp = mapProperties[0];
      return [firstProp.latitude!, firstProp.longitude!];
    }
    // Default to Addis Ababa
    return [9.02497, 38.74689];
  }, [mapProperties]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    const excludeKeys = ['page', 'page_size', 'ordering'];
    return Object.entries(filters).filter(([key, value]) => {
      return !excludeKeys.includes(key) && value !== undefined && value !== '' && value !== null;
    }).length;
  }, [filters]);

  // Filter handler
  const handleFilterChange = useCallback((updates: Partial<PropertyFiltersType>) => {
    console.log('🔧 Filter change:', updates);
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };

      // Remove undefined values
      Object.keys(newFilters).forEach(key => {
        if (newFilters[key as keyof PropertyFiltersType] === undefined ||
          newFilters[key as keyof PropertyFiltersType] === '') {
          delete newFilters[key as keyof PropertyFiltersType];
        }
      });

      return newFilters;
    });
  }, []);

  // Page change handler
  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    handleFilterChange({ page });

    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalPages, handleFilterChange]);

  const handleResetFilters = useCallback(() => {
    console.log('🗑️ Resetting filters');
    setFilters({
      page: 1,
      page_size: 12,
      ordering: '-promotion_priority,-created_at',
    });
    setSearchInput('');
  }, []);

  const handleRemoveFilter = useCallback((filterKey: string) => {
    console.log('❌ Removing filter:', filterKey);
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterKey as keyof PropertyFiltersType];
      return { ...newFilters, page: 1 };
    });
  }, []);

  const handleViewAllFeatured = useCallback(() => {
    handleFilterChange({ is_featured: true, page: 1 });
  }, [handleFilterChange]);

  const handlePropertySelect = useCallback((property: Property) => {
    router.push(`/listings/${property.id}`);
  }, [router]);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list' | 'map') => {
    setViewMode(mode);
    if (mode !== 'map' && isMapFullscreen) {
      setIsMapFullscreen(false);
    }
  }, [isMapFullscreen]);

  // Sort options
  const SORT_OPTIONS = [
    { value: '-promotion_priority,-created_at', label: t('sortOptions.recommended'), icon: <Sparkles className="h-4 w-4" /> },
    { value: '-created_at', label: t('sortOptions.newest'), icon: <Calendar className="h-4 w-4" /> },
    { value: '-views_count', label: t('sortOptions.mostViewed'), icon: <Eye className="h-4 w-4" /> },
    { value: 'price_etb', label: t('sortOptions.priceLowToHigh'), icon: <ArrowDownUp className="h-4 w-4" /> },
    { value: '-price_etb', label: t('sortOptions.priceHighToLow'), icon: <ArrowDownUp className="h-4 w-4" /> },
    { value: '-total_area', label: t('sortOptions.areaLargeToSmall'), icon: <Ruler className="h-4 w-4" /> },
    { value: '-price_per_sqm', label: t('sortOptions.pricePerSqmLow'), icon: <DollarSign className="h-4 w-4" /> },
    { value: 'price_per_sqm', label: t('sortOptions.pricePerSqmHigh'), icon: <DollarSign className="h-4 w-4" /> },
    { value: '-is_featured', label: t('sortOptions.featured'), icon: <Star className="h-4 w-4" /> },
    { value: '-is_promoted', label: t('sortOptions.promoted'), icon: <TrendingUp className="h-4 w-4" /> },
  ];

  // Property type tabs for top navigation
  const PROPERTY_TYPE_TABS = [
    { value: 'all', label: t('propertyTypes.all'), icon: <Grid3X3 className="h-4 w-4" /> },
    { value: 'house', label: t('propertyTypes.house'), icon: <Home className="h-4 w-4" /> },
    { value: 'apartment', label: t('propertyTypes.apartment'), icon: <Building className="h-4 w-4" /> },
    { value: 'villa', label: t('propertyTypes.villa'), icon: <Building2 className="h-4 w-4" /> },
    { value: 'commercial', label: t('propertyTypes.commercial'), icon: <Store className="h-4 w-4" /> },
    { value: 'land', label: t('propertyTypes.land'), icon: <Trees className="h-4 w-4" /> },
    { value: 'office', label: t('propertyTypes.office'), icon: <Briefcase className="h-4 w-4" /> },
    { value: 'warehouse', label: t('propertyTypes.warehouse'), icon: <Warehouse className="h-4 w-4" /> },
    { value: 'farm', label: t('propertyTypes.farm'), icon: <Tractor className="h-4 w-4" /> },
    { value: 'hotel', label: t('propertyTypes.hotel'), icon: <Hotel className="h-4 w-4" /> },
  ];

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array.from({ length: filters.page_size || 12 }).map((_, index) => (
      <Card key={index} className="overflow-hidden animate-pulse dark:border-gray-800">
        <div className="aspect-video bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700" />
        <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
          <div className="h-3 md:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-2.5 md:h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-4 md:h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="flex gap-1.5 md:gap-2">
            <div className="h-7 md:h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
            <div className="h-7 md:h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Handle API errors
  if (propertiesError && isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/10 dark:from-gray-900 dark:to-gray-800/10">
        <Header />
        <div className="container py-6 md:py-12">
          <Card className="border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950">
            <CardContent className="p-4 md:p-8 text-center">
              <div className="mx-auto mb-3 md:mb-4 h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900 dark:to-rose-900 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="mb-1.5 md:mb-2 text-lg md:text-xl font-semibold text-red-800 dark:text-red-300">
                {t('errors.unableToLoad')}
              </h2>
              <p className="mb-4 md:mb-6 text-red-600 dark:text-red-400 text-sm md:text-base">
                {t('errors.errorLoading')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 text-sm md:text-base"
                >
                  {t('actions.refreshPage')}
                </Button>
                <Button
                  onClick={handleResetFilters}
                  variant="default"
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-sm md:text-base"
                >
                  {t('actions.resetFilters')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/10">
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
          <Card className="shadow-xl border-primary/50 bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur-sm dark:from-primary/10 dark:to-secondary/10 dark:border-primary/30">
            <CardContent className="p-2 md:p-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <Badge variant="default" className="gap-1 md:gap-2 bg-gradient-to-r from-primary to-secondary text-xs md:text-sm">
                    <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    {t('comparison.inComparison', { count: comparisonProperties.length })}
                  </Badge>
                  <span className="text-xs text-muted-foreground dark:text-gray-400 hidden sm:inline">
                    {t('comparison.selectForComparison')}
                  </span>
                </div>
                <div className="flex gap-1.5 md:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsComparisonBarVisible(false)}
                    className="gap-1 md:gap-2 border-primary/20 hover:bg-primary/10 dark:border-gray-700 dark:hover:bg-gray-800 text-xs md:text-sm h-7 md:h-9"
                  >
                    <X className="h-3 w-3 md:h-4 md:w-4" />
                    {t('comparison.hide')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowComparisonModal(true)}
                    disabled={comparisonProperties.length < 2}
                    className="gap-1 md:gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-xs md:text-sm h-7 md:h-9"
                  >
                    <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
                    {t('comparison.compareNow')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Search Dialog */}
      <Dialog open={showSaveSearchModal} onOpenChange={setShowSaveSearchModal}>
        <DialogContent className="sm:max-w-md mx-2 md:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1 md:gap-2 text-lg md:text-xl">
              <Save className="h-4 w-4 md:h-5 md:w-5" />
              {t('saveSearch.title')}
            </DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              {t('saveSearch.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 md:space-y-4 py-3 md:py-4">
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="search-name" className="text-sm md:text-base">
                {t('saveSearch.searchName')}
              </Label>
              <Input
                id="search-name"
                placeholder={t('saveSearch.searchNamePlaceholder')}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="text-sm md:text-base"
              />
            </div>

            {/* Display current filters summary */}
            {activeFiltersCount > 0 && (
              <div className="rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 dark:from-gray-800/50 dark:to-gray-800/30 p-3 md:p-4 border dark:border-gray-700">
                <p className="text-sm font-medium mb-1.5 md:mb-2 flex items-center gap-1 md:gap-2">
                  <Filter className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  {t('searchHistory.currentSearchCriteria')}:
                </p>
                <div className="text-xs md:text-sm text-muted-foreground dark:text-gray-400 space-y-1">
                  {Object.entries(filters)
                    .filter(([key]) => !['page', 'page_size', 'ordering'].includes(key))
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <p key={key} className="flex items-center gap-1 md:gap-2">
                        <span className="font-medium">{key.replace('_', ' ')}:</span>
                        <span>{String(value)}</span>
                      </p>
                    ))}
                  {activeFiltersCount > 3 && (
                    <p className="text-primary text-xs md:text-sm">
                      {t('saveSearch.moreFilters', { count: activeFiltersCount - 3 })}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 md:gap-3 justify-end pt-3 md:pt-4">
              <Button
                variant="outline"
                onClick={() => setShowSaveSearchModal(false)}
                className="border-muted-foreground/20 text-sm md:text-base"
              >
                {tCommon('cancel')}
              </Button>
              <Button
                onClick={async () => {
                  try {
                    // Save search logic here
                    toast.success('Search saved successfully!');
                    setShowSaveSearchModal(false);
                  } catch (error) {
                    toast.error('Failed to save search. Please try again.');
                  }
                }}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-sm md:text-base"
              >
                {t('saveSearch.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="container py-4 md:py-8 px-3 md:px-4">
        {/* Hero Section */}
        <div className="mb-4 md:mb-8 text-center">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-2 md:mb-4">
            {filters.search ? `"${filters.search}"` : t('title')}
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground dark:text-gray-400 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Main Search Bar */}
        <Card className="mb-4 md:mb-6 border-2 border-primary/20 shadow-lg md:shadow-xl dark:border-primary/30">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <div className="flex-1 relative">
                <SearchHistory
                  searchQuery={searchInput}
                  onSearchChange={setSearchInput}
                  onSelectSearch={(filters) => {
                    handleFilterChange(filters);
                    if (filters.search !== undefined) {
                      setSearchInput(filters.search);
                    }
                  }}
                />
              </div>
              <div className="flex gap-2 md:gap-3">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-11 md:h-14 px-3 md:px-6 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg text-sm md:text-base"
                >
                  <SlidersHorizontal className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                  {showFilters ? t('hideFilters') : t('showFilters')}
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5 md:ml-2 bg-white/20 text-white text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg" className="h-11 md:h-14 border md:border-2 dark:border-gray-700">
                      <ArrowDownUp className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">{t('sortBy')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 md:w-56 dark:border-gray-800 dark:bg-gray-900">
                    <DropdownMenuLabel className="text-sm">{t('sortBy')}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="dark:bg-gray-800" />
                    {SORT_OPTIONS.map(option => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleFilterChange({ ordering: option.value, page: 1 })}
                        className={`text-sm ${filters.ordering === option.value ? 'bg-muted dark:bg-gray-800' : ''}`}
                      >
                        {option.icon}
                        <span className="ml-2">{option.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Active Filters Display */}
        <EnhancedActiveFilters
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onResetFilters={handleResetFilters}
          cities={cities}
          subCities={subCities}
        />

        {/* Property Type Tabs */}
        <Tabs
          value={filters.property_type || 'all'}
          onValueChange={(value) => handleFilterChange({ property_type: value === 'all' ? undefined : value, page: 1 })}
          className="w-full mb-4 md:mb-6"
        >
          <ScrollArea className="w-full pb-2">
            <TabsList className="inline-flex w-max space-x-1 p-1">
              {PROPERTY_TYPE_TABS.map((type) => (
                <TabsTrigger
                  key={type.value}
                  value={type.value}
                  className="gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4 py-1.5 md:py-2"
                >
                  {type.icon}
                  <span className="hidden sm:inline">{type.label}</span>
                  <span className="sm:hidden">{type.label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
        </Tabs>

        {/* Featured Properties Carousel */}
        {featuredProperties && featuredProperties.length > 0 && (
          <FeaturedPropertiesCarousel
            featuredProperties={featuredProperties}
            onPropertyClick={handlePropertySelect}
          />
        )}

        {/* Simplified Filters Panel */}
        <SimplifiedFiltersPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          cities={cities}
          subCities={subCities}
          amenities={amenities}
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
        />

        {/* Main Content Area */}
        <div className={cn(viewMode === 'map' ? '' : '')}>
          {/* View Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3 md:gap-4">
            <div>
              <h2 className="text-lg md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 dark:from-white dark:to-white/80 bg-clip-text text-transparent">
                {isLoadingProperties && filters.page === 1
                  ? t('results.loading')
                  : totalCount > 0
                    ? `Top 20 Search Results (${totalCount} total found)`
                    : t('results.propertiesFound', { count: totalCount })}
              </h2>
              {!isLoadingProperties && properties.length > 0 && (
                <p className="text-muted-foreground dark:text-gray-400 mt-0.5 md:mt-1 text-sm md:text-base">
                  {t('results.showing', {
                    start: ((filters.page || 1) - 1) * (filters.page_size || 12) + 1,
                    end: Math.min((filters.page || 1) * (filters.page_size || 12), totalCount),
                    total: totalCount
                  })}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              {/* View Mode Toggle */}
              <div className="flex rounded-lg border dark:border-gray-800 bg-card">
                <Button
                  variant={viewMode === 'grid' ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-r-none border-r dark:border-gray-800 h-8 w-8 md:h-10 md:w-10"
                  onClick={() => handleViewModeChange('grid')}
                >
                  <Grid2X2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="sr-only">{tCommon('gridView')}</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-none border-r dark:border-gray-800 h-8 w-8 md:h-10 md:w-10"
                  onClick={() => handleViewModeChange('list')}
                >
                  <List className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="sr-only">{tCommon('listView')}</span>
                </Button>
                <Button
                  variant={viewMode === 'map' ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-l-none h-8 w-8 md:h-10 md:w-10"
                  onClick={() => handleViewModeChange('map')}
                >
                  <MapIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="sr-only">{t('viewMode.map')}</span>
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-1.5 md:gap-2">
                {isAuthenticated && activeFiltersCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSaveSearchModal(true);
                      setSearchName(filters.search || 'My Saved Search');
                    }}
                    className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-10"
                  >
                    <Bookmark className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">{t('actions.saveSearch')}</span>
                  </Button>
                )}

                {isAuthenticated && (
                  <Button
                    onClick={() => router.push(`/${locale}/listings/create`)}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-10"
                  >
                    <Plus className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden sm:inline">{t('actions.listProperty')}</span>
                    <span className="sm:hidden">{tCommon('list')}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Properties Grid/List/Map */}
          {isLoadingProperties && filters.page === 1 ? (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4 md:gap-6`}>
              {renderSkeletons()}
            </div>
          ) : properties.length === 0 ? (
            <Card className="border-2 border-dashed dark:border-gray-800">
              <CardContent className="p-6 md:p-12 text-center">
                <div className="mx-auto max-w-md">
                  <div className="mx-auto h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-r from-muted to-muted/50 dark:from-gray-800 dark:to-gray-800/50 flex items-center justify-center mb-4 md:mb-6">
                    <Search className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground dark:text-gray-600" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold mb-2 md:mb-3 dark:text-white">
                    {t('results.noProperties')}
                  </h3>
                  <p className="text-muted-foreground dark:text-gray-400 mb-4 md:mb-6 text-base md:text-lg">
                    {filters.search
                      ? t('results.noMatch', { search: filters.search })
                      : t('results.adjustFilters')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
                    <Button variant="outline" onClick={handleResetFilters} size="lg" className="text-sm md:text-base">
                      <RefreshCw className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                      {t('actions.resetFilters')}
                    </Button>
                    {isAuthenticated && (
                      <Button
                        onClick={() => router.push(`/${locale}/listings/create`)}
                        size="lg"
                        className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-sm md:text-base"
                      >
                        <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                        {t('actions.listProperty')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'map' ? (
            <div className={cn(
              "relative rounded-lg overflow-hidden border bg-background dark:border-gray-800",
              isMapFullscreen ? "fixed inset-0 z-50" : "h-[400px] md:h-[600px] rounded-xl"
            )}>
              {isMapFullscreen && (
                <div className="absolute top-2 right-2 md:top-4 md:right-4 z-50">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsMapFullscreen(false)}
                    className="gap-1 md:gap-2 bg-white/90 backdrop-blur-sm text-xs md:text-sm"
                  >
                    <Minimize2 className="h-3 w-3 md:h-4 md:w-4" />
                    {t('actions.exitFullscreen')}
                  </Button>
                </div>
              )}

              {/* MAP VIEW */}
              <div className="h-full w-full">
                <MapView
                  properties={mapProperties}
                  center={mapCenter}
                  zoom={12}
                  onPropertySelect={handlePropertySelect}
                  onViewModeChange={handleViewModeChange}
                  currentViewMode={viewMode}
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
                      is_featured: mapFilters.is_featured,
                      page: 1
                    });
                  }}
                />
              </div>

              {/* Map Sidebar */}
              {!isMapFullscreen && mapProperties.length > 0 && (
                <div className="absolute left-2 top-2 md:left-4 md:top-4 w-64 md:w-80 max-h-[calc(100%-1rem)] md:max-h-[calc(100%-2rem)] overflow-y-auto bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border dark:border-gray-800 dark:bg-gray-900/95 hidden md:block">
                  <div className="p-2 md:p-4 border-b dark:border-gray-800">
                    <h3 className="font-semibold text-sm md:text-base">
                      {t('map.propertiesOnMap')}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground dark:text-gray-400">
                      {t('results.mapViewCount', { count: mapProperties.length })}
                    </p>
                  </div>
                  <div className="p-1 md:p-2 space-y-1 md:space-y-2 max-h-80 md:max-h-96 overflow-y-auto">
                    {mapProperties.slice(0, 10).map((property) => (
                      <div
                        key={property.id}
                        className="cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-800/50 p-2 md:p-3 rounded-lg transition-colors"
                        onClick={() => handlePropertySelect(property)}
                      >
                        <div className="flex gap-2 md:gap-3">
                          <div className="w-12 h-10 md:w-16 md:h-12 rounded-md overflow-hidden flex-shrink-0">
                            {property.images?.[0] && (
                              <img
                                src={property.images[0].image}
                                alt={property.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-xs md:text-sm truncate dark:text-white">{property.title}</h4>
                            <p className="text-xs md:text-sm text-primary font-bold">
                              {formatCurrency(property.price_etb)}
                              {property.listing_type === 'for_rent' && tProperty('perMonth')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4 md:gap-6`}>
                {properties.map((property: Property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    viewMode={viewMode === 'list' ? 'list' : 'grid'}
                    showComparisonButton={true}
                    className="hover:shadow-xl md:hover:shadow-2xl transition-all duration-300"
                  />
                ))}
              </div>

              {/* PAGINATION COMPONENT */}
              <PaginationComponent
                currentPage={filters.page || 1}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={filters.page_size || 12}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}