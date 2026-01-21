'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from "@/components/common/Header/Header";
import { useQuery, useMutation } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
import { subscriptionApi } from '@/lib/api/subscriptions'
import { PropertyFormData, FileDraft } from '@/lib/types/property'
import { useAuthStore } from '@/lib/store/authStore'
import { useLocale, useTranslations } from 'next-intl'
import toast from 'react-hot-toast'
import debounce from 'lodash/debounce'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import {
  PROPERTY_TYPES,
  LISTING_TYPES,
  FURNISHING_TYPES,
  BEDROOM_OPTIONS,
  BATHROOM_OPTIONS,
  USD_TO_ETB_RATE
} from '@/lib/utils/constants'
import {
  Home,
  MapPin,
  Building,
  DollarSign,
  Image as ImageIcon,
  Upload,
  X,
  ChevronRight,
  Plus,
  Trash2,
  Video,
  FileText,
  CheckCircle,
  Info,
  AlertCircle,
  Save,
  Star,
  Clock,
  CheckSquare,
  Square,
  Compass,
  Wrench,
  Eye,
  Globe,
  Calculator,
  Search,
  Navigation,
  Zap,
  TrendingUp,
  Crown,
  CreditCard,
  ChevronLeft,
  ChevronDown,
  Maximize2,
  Minimize2,
  Grid,
  List,
  Moon,
  Sun,
  Wifi,
  Car,
  Shield,
  Droplets,
  Flame,
  Snowflake,
  Dumbbell,
  Tv,
  Microwave,
  Refrigerator,
  Wind,
  Fan,
  Coffee,
  Utensils,
  Bath,
  Bed,
  Sofa,
  Table,
  Lamp,
  Camera,
  Bell,
  Lock,
  Key,
  Printer,
  Phone,
  Mail,
  Users,
  Briefcase,
  Globe2,
  Palette,
  Type,
  Volume2,
  ShieldCheck,
  Award,
  Target,
  Rocket,
  ZapOff,
  Battery,
  Power,
  Cloud,
  Database,
  Server,
  Cpu,
  HardDrive,
  Router,
  Satellite,
  Bluetooth,
  WifiOff,
  Network,
  SatelliteDish,
  Radio,
  Speaker,
  Headphones,
  Gamepad,
  MonitorPlay,
  Projector,
  Film,
  Music,
  Book,
  BookOpen,
  Library,
  School,
  GraduationCap,
  Banknote,
  Wallet,
  PiggyBank,
  CreditCard as CreditCardIcon,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Store,
  Building2,
  Factory,
  WarehouseIcon,
  Ship,
  Plane,
  Train,
  Bus,
  Bike,
  CarTaxiFront,
  ParkingSquare,
  TrafficCone,
  Lightbulb,
  Flashlight,
  SunDim,
  Thermometer,
  ThermometerSnowflake,
  ThermometerSun,
  Droplet,
  Waves,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Sunrise,
  Sunset,
  Calendar,
  Heart,
  ThumbsUp,
  Trophy as TrophyIcon,
  Target as TargetIcon,
  Check,
  XCircle,
  AlertTriangle,
  HelpCircle,
  MessageCircle,
  MessageSquare,
  PhoneCall,
  Video as VideoIcon,
  Camera as CameraIcon,
  Mic,
  File,
  Truck,
  Trees,
  RefreshCw,
  Package,
  Layers,
  RotateCcw,
  RotateCw,
  GlassWater,
  ArrowUpDown,
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Checkbox } from '@/components/ui/Checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { Badge } from '@/components/ui/Badge'
import { Label } from '@/components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { ScrollArea } from '@/components/ui/Scroll-area'
import { Switch } from '@/components/ui/Switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/Sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/Radio-group'
import { Slider } from '@/components/ui/Slider'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'

// Enhanced amenities and features
const AMENITIES_CATEGORIES = {
  essentials: [
    { id: 1, name: 'Parking', key: 'has_parking', icon: Car, description: 'Dedicated parking space' },
    { id: 2, name: 'Security', key: 'has_security', icon: Shield, description: '24/7 security' },
    { id: 3, name: 'Water Backup', key: 'has_backup_water', icon: Droplets, description: 'Water storage' },
    { id: 4, name: 'Generator', key: 'has_generator', icon: Zap, description: 'Backup power' },
    { id: 5, name: 'Fire Safety', key: 'has_fire_safety', icon: Flame, description: 'Fire extinguishers' },
    { id: 6, name: 'CCTV', key: 'has_cctv', icon: Camera, description: 'Security cameras' },
    { id: 7, name: 'Intercom', key: 'has_intercom', icon: Phone, description: 'Intercom system' },
    { id: 8, name: 'Guard House', key: 'has_guard_house', icon: Home, description: 'Security guard house' },
  ],
  comfort: [
    { id: 9, name: 'Air Conditioning', key: 'has_air_conditioning', icon: Snowflake, description: 'AC units' },
    { id: 10, name: 'Heating', key: 'has_heating', icon: Flame, description: 'Heating system' },
    { id: 11, name: 'Elevator', key: 'has_elevator', icon: ArrowUpDown, description: 'Elevator access' },
    { id: 12, name: 'Furnished', key: 'has_furniture', icon: Sofa, description: 'Fully furnished' },
    { id: 13, name: 'WiFi', key: 'has_internet', icon: Wifi, description: 'High-speed internet' },
    { id: 14, name: 'Satellite TV', key: 'has_satellite_tv', icon: Satellite, description: 'Satellite television' },
    { id: 15, name: 'Central Heating', key: 'has_central_heating', icon: Thermometer, description: 'Central heating' },
    { id: 16, name: 'Central Cooling', key: 'has_central_cooling', icon: Wind, description: 'Central cooling' },
  ],
  appliances: [
    { id: 17, name: 'Refrigerator', key: 'has_refrigerator', icon: Refrigerator, description: 'Refrigerator included' },
    { id: 18, name: 'Washing Machine', key: 'has_washing_machine', icon: RefreshCw, description: 'Washing machine' },
    { id: 19, name: 'Dishwasher', key: 'has_dishwasher', icon: Droplets, description: 'Dishwasher' },
    { id: 20, name: 'Microwave', key: 'has_microwave', icon: Microwave, description: 'Microwave oven' },
    { id: 21, name: 'Oven', key: 'has_oven', icon: Flame, description: 'Electric/gas oven' },
    { id: 22, name: 'Stove', key: 'has_stove', icon: Flame, description: 'Cooking stove' },
    { id: 23, name: 'Coffee Maker', key: 'has_coffee_maker', icon: Coffee, description: 'Coffee machine' },
    { id: 24, name: 'Water Dispenser', key: 'has_water_dispenser', icon: Droplet, description: 'Water dispenser' },
  ],
  lifestyle: [
    { id: 25, name: 'Swimming Pool', key: 'has_swimming_pool', icon: Waves, description: 'Swimming pool' },
    { id: 26, name: 'Gym', key: 'has_gym', icon: Dumbbell, description: 'Fitness center' },
    { id: 27, name: 'Garden', key: 'has_garden', icon: Trees, description: 'Private garden' },
    { id: 28, name: 'Balcony', key: 'has_balcony', icon: Maximize2, description: 'Balcony/terrace' },
    { id: 29, name: 'Pet Friendly', key: 'is_pet_friendly', icon: Heart, description: 'Pets allowed' },
    { id: 30, name: 'Smoking Allowed', key: 'is_smoking_allowed', icon: Flame, description: 'Smoking permitted' },
    { id: 31, name: 'Wheelchair Access', key: 'is_wheelchair_accessible', icon: HelpCircle, description: 'Accessible' },
    { id: 32, name: 'Kids Play Area', key: 'has_play_area', icon: Users, description: 'Children play area' },
  ],
  technology: [
    { id: 33, name: 'Smart Home', key: 'has_smart_home', icon: Cpu, description: 'Smart home system' },
    { id: 34, name: 'Home Theater', key: 'has_home_theater', icon: Tv, description: 'Home theater setup' },
    { id: 35, name: 'Electric Car Charging', key: 'has_car_charging', icon: Zap, description: 'EV charging' },
    { id: 36, name: 'Solar Panels', key: 'has_solar_panels', icon: Sun, description: 'Solar power' },
    { id: 37, name: 'Backup Internet', key: 'has_backup_internet', icon: Wifi, description: 'Redundant internet' },
    { id: 38, name: 'Automated Lighting', key: 'has_automated_lighting', icon: Lightbulb, description: 'Smart lighting' },
    { id: 39, name: 'Security System', key: 'has_security_system', icon: ShieldCheck, description: 'Advanced security' },
    { id: 40, name: 'Voice Control', key: 'has_voice_control', icon: Mic, description: 'Voice assistants' },
  ],
  services: [
    { id: 41, name: 'Cleaning Service', key: 'has_cleaning_service', icon: Trash2, description: 'Regular cleaning' },
    { id: 42, name: 'Maintenance', key: 'has_maintenance', icon: Wrench, description: 'On-call maintenance' },
    { id: 43, name: 'Concierge', key: 'has_concierge', icon: Bell, description: 'Concierge service' },
    { id: 44, name: 'Laundry Service', key: 'has_laundry_service', icon: RefreshCw, description: 'Laundry service' },
    { id: 45, name: 'Room Service', key: 'has_room_service', icon: Truck, description: 'Room service' },
    { id: 46, name: 'Valet Parking', key: 'has_valet_parking', icon: Car, description: 'Valet parking' },
    { id: 47, name: '24/7 Reception', key: 'has_reception', icon: Building, description: '24-hour reception' },
    { id: 48, name: 'Package Handling', key: 'has_package_handling', icon: Package, description: 'Package reception' },
  ],
  community: [
    { id: 49, name: 'Club House', key: 'has_club_house', icon: Home, description: 'Community club house' },
    { id: 50, name: 'Conference Room', key: 'has_conference_room', icon: Users, description: 'Meeting rooms' },
    { id: 51, name: 'Business Center', key: 'has_business_center', icon: Briefcase, description: 'Business facilities' },
    { id: 52, name: 'Library', key: 'has_library', icon: Book, description: 'Library access' },
    { id: 53, name: 'Party Hall', key: 'has_party_hall', icon: GlassWater, description: 'Party/event space' },
    { id: 54, name: 'BBQ Area', key: 'has_bbq_area', icon: Flame, description: 'Barbecue area' },
    { id: 55, name: 'Playground', key: 'has_playground', icon: Gamepad, description: 'Children playground' },
    { id: 56, name: 'Tennis Court', key: 'has_tennis_court', icon: Dumbbell, description: 'Tennis court' },
  ]
}

const DOCUMENTS = [
  { id: 1, name: 'Title Deed', key: 'has_title_deed', description: 'Proof of property ownership' },
  { id: 2, name: 'Construction Permit', key: 'has_construction_permit', description: 'Building approval documents' },
  { id: 3, name: 'Occupancy Certificate', key: 'has_occupancy_certificate', description: 'Certificate for habitation' },
  { id: 4, name: 'Tax Clearance', key: 'has_tax_clearance', description: 'Property tax clearance' },
  { id: 5, name: 'Land Certificate', key: 'has_land_certificate', description: 'Land ownership certificate' },
  { id: 6, name: 'Building Plans', key: 'has_building_plans', description: 'Architectural plans' },
  { id: 7, name: 'Insurance', key: 'has_insurance', description: 'Property insurance' },
  { id: 8, name: 'Utility Bills', key: 'has_utility_bills', description: 'Recent utility bills' },
]

const DURATION_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' }
]

// Interface for geocoding results
interface GeocodeResult {
  city?: string;
  subcity?: string;
  address?: string;
  country?: string;
  formatted_address?: string;
  street?: string;
  suburb?: string;
  town?: string;
  municipality?: string;
  county?: string;
  state?: string;
  state_district?: string;
}

const isFileDraft = (item: any): item is FileDraft => {
  return item && typeof item === 'object' && item.isPlaceholder === true
}

const isFile = (image: any): image is File => {
  if (!image || typeof image !== 'object') return false
  
  // Check if it has File-like properties
  const isFileLike = 
    'name' in image && typeof image.name === 'string' &&
    'size' in image && typeof image.size === 'number' &&
    'type' in image && typeof image.type === 'string'
  
  // Try to use instanceof safely
  try {
    if (typeof File !== 'undefined' && File.prototype && image instanceof File) {
      return true
    }
  } catch (error) {
    // instanceof failed, fall back to property check
    console.log('instanceof check failed, using property check')
  }
  
  return isFileLike
}

const getImageUrl = (image: any): string | null => {
  if (!image) return null

  if (isFile(image)) {
    try {
      return URL.createObjectURL(image)
    } catch (error) {
      console.error('Error creating object URL:', error)
      return null
    }
  }

  if (isFileDraft(image) && image.url) {
    return image.url
  }

  if (isFileDraft(image)) {
    return null
  }

  if (image.dataUrl && typeof image.dataUrl === 'string') {
    return image.dataUrl
  }

  if (image.preview && typeof image.preview === 'string') {
    return image.preview
  }

  return null
}

const logFormData = (formData: FormData) => {
  const entries: Record<string, any> = {}
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      entries[key] = {
        name: value.name,
        size: `${(value.size / 1024 / 1024).toFixed(2)} MB`,
        type: value.type
      }
    } else {
      entries[key] = value
    }
  }
  console.log('FormData entries:', JSON.stringify(entries, null, 2))
  return entries
}

export default function CreateListingPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('createListing')
  const tc = useTranslations('common')
  const { isAuthenticated, user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('basic')
  const [listingType, setListingType] = useState<'for_sale' | 'for_rent'>('for_sale')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [priceCalculationMode, setPriceCalculationMode] = useState<'etb' | 'usd'>('etb')
  const [objectUrls, setObjectUrls] = useState<string[]>([])
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [selectedPromotionTier, setSelectedPromotionTier] = useState<'basic' | 'standard' | 'premium'>('basic')
  const [selectedDuration, setSelectedDuration] = useState<number>(30)
  const [promotionPrice, setPromotionPrice] = useState<number>(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const citySelectRef = useRef<HTMLDivElement>(null)
  const subCitySelectRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<Partial<PropertyFormData>>({
    title: '',
    title_amharic: '',
    description: '',
    description_amharic: '',
    property_type: 'house',
    listing_type: 'for_sale',
    property_status: 'available',
    city: undefined,
    sub_city: undefined,
    specific_location: '',
    address_line_1: '',
    address_line_2: '',
    latitude: undefined,
    longitude: undefined,
    bedrooms: 1,
    bathrooms: 1,
    total_area: 0,
    plot_size: undefined,
    built_year: undefined,
    floors: 1,
    furnishing_type: 'unfurnished',
    price_etb: 0,
    price_usd: undefined,
    price_negotiable: false,
    monthly_rent: undefined,
    security_deposit: undefined,
    maintenance_fee: undefined,
    property_tax: undefined,
    amenities: [],
    has_parking: false,
    has_garden: false,
    has_security: false,
    has_furniture: false,
    has_air_conditioning: false,
    has_heating: false,
    has_internet: false,
    has_generator: false,
    has_elevator: false,
    has_swimming_pool: false,
    has_gym: false,
    has_conference_room: false,
    is_pet_friendly: false,
    is_wheelchair_accessible: false,
    has_backup_water: false,
    virtual_tour_url: '',
    video_url: '',
    has_title_deed: false,
    has_construction_permit: false,
    has_occupancy_certificate: false,
    is_premium: false,
    images: [],
    property_video: undefined,
    documents: [],
    promotionTier: 'basic',
    is_promoted: false,
  })

  // Fetch promotion tiers from API isFile
  const { data: promotionTiers, isLoading: isLoadingPromotionTiers } = useQuery({
    queryKey: ['promotion-tiers'],
    queryFn: async () => {
      try {
        const data = await subscriptionApi.getPromotionTiers()
        return Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Error fetching promotion tiers:', error)
        return []
      }
    },
  })

  // Calculate price based on tier and duration
  const calculatePrice = (tierType: string, duration: number): number => {
    if (!promotionTiers || tierType === 'basic') return 0

    const tier = promotionTiers.find(t => t.tier_type === tierType)
    if (!tier) return 0

    switch (duration) {
      case 7: return tier.price_7 || 0
      case 30: return tier.price_30 || 0
      case 60: return tier.price_60 || tier.price_30 * 2 || 0
      case 90: return tier.price_90 || tier.price_30 * 3 || 0
      default: return tier.price_30 || 0
    }
  }

  // Update price when tier or duration changes
  useEffect(() => {
    const price = calculatePrice(selectedPromotionTier, selectedDuration)
    setPromotionPrice(price)
  }, [selectedPromotionTier, selectedDuration, promotionTiers])

  const getTierIcon = (tierType: string) => {
    switch (tierType) {
      case 'basic': return <Zap className="h-5 w-5" />
      case 'standard': return <TrendingUp className="h-5 w-5" />
      case 'premium': return <Crown className="h-5 w-5" />
      default: return <Star className="h-5 w-5" />
    }
  }

  const getTierColor = (tierType: string) => {
    switch (tierType) {
      case 'basic': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
      case 'standard': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700'
      case 'premium': return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
    }
  }

  const formatDuration = (days: number): string => {
    if (days === 7) return '1 Week'
    if (days === 30) return '1 Month'
    if (days === 60) return '2 Months'
    if (days === 90) return '3 Months'
    return `${days} days`
  }

  // Clean up object URLs
  useEffect(() => {
    return () => {
      objectUrls.forEach(url => {
        try {
          URL.revokeObjectURL(url)
        } catch (error) {
          // Ignore errors
        }
      })
    }
  }, [objectUrls])

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        try {
          const autoSaveData = { ...formData }

          if (autoSaveData.images) {
            autoSaveData.images = autoSaveData.images.map((image) => {
              if (isFile(image)) {
                return {
                  name: image.name,
                  size: image.size,
                  type: image.type,
                  lastModified: image.lastModified,
                  isPlaceholder: true
                }
              }
              return image
            })
          }
          if (isFile(autoSaveData.property_video)) {
            autoSaveData.property_video = {
              name: autoSaveData.property_video.name,
              size: autoSaveData.property_video.size,
              isPlaceholder: true
            }
          }
          if (autoSaveData.documents) {
            autoSaveData.documents = autoSaveData.documents.map((doc) => {
              if (isFile(doc)) {
                return {
                  name: doc.name,
                  size: doc.size,
                  type: doc.type,
                  lastModified: doc.lastModified,
                  isPlaceholder: true
                }
              }
              return doc
            })
          }

          localStorage.setItem('property_draft_autosave', JSON.stringify({
            ...autoSaveData,
            timestamp: new Date().toISOString()
          }))
        } catch (error) {
          console.log('Auto-save skipped due to size constraints')
        }
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [formData, hasUnsavedChanges])

  // Auto-convert between ETB and USD
  useEffect(() => {
    if (priceCalculationMode === 'etb' && formData.price_etb && formData.price_etb > 0) {
      const usdPrice = Math.round(formData.price_etb / USD_TO_ETB_RATE)
      setFormData(prev => ({ ...prev, price_usd: usdPrice }))
    } else if (priceCalculationMode === 'usd' && formData.price_usd && formData.price_usd > 0) {
      const etbPrice = Math.round(formData.price_usd * USD_TO_ETB_RATE)
      setFormData(prev => ({ ...prev, price_etb: etbPrice }))
    }
  }, [formData.price_etb, formData.price_usd, priceCalculationMode])

  // Fetch cities and amenities
  const { data: citiesData, isLoading: isLoadingCities, error: citiesError } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      try {
        const data = await listingsApi.getCities()
        return data
      } catch (error) {
        console.error('Error fetching cities:', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })

  const { data: subCitiesData, isLoading: isLoadingSubCities, error: subCitiesError } = useQuery({
    queryKey: ['subCities', formData.city],
    queryFn: async () => {
      if (!formData.city) return []
      try {
        const data = await listingsApi.getSubCities(formData.city)
        return data
      } catch (error) {
        console.error('Error fetching subcities:', error)
        throw error
      }
    },
    enabled: !!formData.city,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })

  const { data: amenitiesData, isLoading: isLoadingAmenities } = useQuery({
    queryKey: ['amenities'],
    queryFn: () => listingsApi.getAmenities(),
    staleTime: 5 * 60 * 1000,
  })

  const cities = Array.isArray(citiesData) ? citiesData : []
  const subCities = Array.isArray(subCitiesData) ? subCitiesData : []
  const amenitiesList = Array.isArray(amenitiesData) ? amenitiesData : []

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number): Promise<GeocodeResult> => {
    try {
      setIsGeocoding(true)
      setGeocodeError(null)
      setGeocodeResult(null)

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=en`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch location data')
      }

      const data = await response.json()

      const result: GeocodeResult = {
        city: data.address?.city || data.address?.town || data.address?.municipality || data.address?.county,
        subcity: data.address?.suburb || data.address?.neighbourhood || data.address?.city_district,
        address: data.display_name,
        country: data.address?.country,
        formatted_address: data.display_name,
        street: data.address?.road || data.address?.street,
        suburb: data.address?.suburb,
        town: data.address?.town,
        municipality: data.address?.municipality,
        county: data.address?.county,
        state: data.address?.state,
        state_district: data.address?.state_district
      }

      setGeocodeResult(result)
      return result

    } catch (error) {
      console.error('Geocoding error:', error)
      setGeocodeError('Could not fetch location details. Please enter manually.')
      throw error
    } finally {
      setIsGeocoding(false)
    }
  }

  // Auto-fill location based on coordinates
  const autoFillLocationFromCoordinates = useCallback(
    debounce(async (lat: number, lng: number) => {
      try {
        const result = await reverseGeocode(lat, lng)

        // Update city if found and matches our cities list
        if (result.city && cities && cities.length > 0) {
          // Try exact match first
          let matchingCity = cities.find(city =>
            city.name.toLowerCase() === result.city!.toLowerCase()
          )

          // Try partial match
          if (!matchingCity) {
            matchingCity = cities.find(city =>
              city.name.toLowerCase().includes(result.city!.toLowerCase()) ||
              result.city!.toLowerCase().includes(city.name.toLowerCase())
            )
          }

          // Try state/district as fallback for Ethiopia
          if (!matchingCity && result.state && cities) {
            matchingCity = cities.find(city =>
              city.name.toLowerCase().includes(result.state!.toLowerCase()) ||
              result.state!.toLowerCase().includes(city.name.toLowerCase())
            )
          }

          if (matchingCity) {
            handleInputChange('city', matchingCity.id)

            // Also try to find matching subcity
            if (result.subcity && subCities && subCities.length > 0) {
              let matchingSubCity = subCities.find(subCity =>
                subCity.name.toLowerCase() === result.subcity!.toLowerCase()
              )

              if (!matchingSubCity) {
                matchingSubCity = subCities.find(subCity =>
                  subCity.name.toLowerCase().includes(result.subcity!.toLowerCase()) ||
                  result.subcity!.toLowerCase().includes(subCity.name.toLowerCase())
                )
              }

              // Try suburb or neighbourhood
              if (!matchingSubCity && result.suburb) {
                matchingSubCity = subCities.find(subCity =>
                  subCity.name.toLowerCase().includes(result.suburb!.toLowerCase()) ||
                  result.suburb!.toLowerCase().includes(subCity.name.toLowerCase())
                )
              }

              if (matchingSubCity) {
                handleInputChange('sub_city', matchingSubCity.id)
              }
            }
          }
        }

        // Update specific location with formatted address
        if (result.address) {
          // Extract just the relevant parts
          const addressParts = result.address.split(',').slice(0, 4).join(', ').trim()
          handleInputChange('specific_location', addressParts)

          // Update address lines
          if (result.street && !formData.address_line_1) {
            handleInputChange('address_line_1', result.street)
          }

          if (result.suburb && !formData.address_line_2) {
            handleInputChange('address_line_2', result.suburb)
          }
        }

        toast.success('Location details auto-filled!')

      } catch (error) {
        // Error is already set in reverseGeocode
      }
    }, 1500),
    [cities, subCities, formData.address_line_1, formData.address_line_2]
  )

  // Trigger geocoding when coordinates change
  useEffect(() => {
    const lat = formData.latitude
    const lng = formData.longitude

    if (lat && lng && Math.abs(lat) > 0 && Math.abs(lng) > 0) {
      // Validate coordinates are within Ethiopia roughly
      if (lat >= 3 && lat <= 15 && lng >= 33 && lng <= 48) {
        autoFillLocationFromCoordinates(lat, lng)
      } else {
        setGeocodeError('Coordinates appear to be outside Ethiopia')
      }
    }
  }, [formData.latitude, formData.longitude, autoFillLocationFromCoordinates])

  // Create property mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => listingsApi.createProperty(data, selectedPromotionTier),
    onMutate: () => {
      setIsSubmitting(true)
      toast.loading('Creating your listing...')
    },
    onSuccess: (data) => {
      toast.dismiss()

      const isPromoted = selectedPromotionTier !== 'basic'

      if (isPromoted) {
        toast.success('Property listed successfully with promotion! It is now live.')
        router.push(`/listings/${data.id}/promote?from_create=true`)
      } else if (user?.is_staff || user?.is_superuser) {
        toast.success('Property listed successfully! It is now live.')
        router.push(`/listings/${data.id}?created=true`)
      } else {
        toast.success(
          'Property submitted successfully! It is now pending admin approval. ' +
          'You will be notified once it is approved and goes live.'
        )

        setTimeout(() => {
          localStorage.setItem('new_property_id', data.id.toString())
          localStorage.setItem('new_property_title', formData.title || '')
          router.push(`/listings?created=true`)
        }, 1500)
      }

      localStorage.removeItem('property_draft_autosave')
    },
    onError: (error: any) => {
      toast.dismiss()

      if (error.response?.status === 400) {
        const errors = error.response.data
        if (typeof errors === 'object') {
          Object.entries(errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => toast.error(`${field}: ${msg}`))
            } else {
              toast.error(`${field}: ${messages}`)
            }
          })
          return
        }
      }

      const errorMessage = error.response?.data?.error ||
        error.response?.data?.detail ||
        'Failed to list property. Please try again.'
      toast.error(errorMessage)
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/listings/create')
    }

    const savedDraft = localStorage.getItem('property_draft_autosave')
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        const draftAge = new Date().getTime() - new Date(draft.timestamp).getTime()
        if (draftAge < 24 * 60 * 60 * 1000) {
          if (draft.images) {
            draft.images = draft.images.map((img: any) => {
              if (img && typeof img === 'object' && !img.isPlaceholder) {
                return {
                  ...img,
                  isPlaceholder: true
                }
              }
              return img
            })
          }
          setFormData(draft)
          setHasUnsavedChanges(true)
          toast.success('Auto-saved draft loaded')
        }
      } catch (error) {
        console.error('Error loading auto-saved draft:', error)
      }
    }
  }, [isAuthenticated, router])

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }))
    setHasUnsavedChanges(true)

    if (field === 'city' && value !== formData.city) {
      setFormData(prevData => ({ ...prevData, sub_city: undefined }))
    }

    if (field === 'latitude' || field === 'longitude') {
      setGeocodeResult(null)
      setGeocodeError(null)
    }

    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleFileUpload = (field: 'images' | 'documents' | 'property_video', file: File) => {
    if (!file || !isFile(file)) {
      toast.error('Invalid file selected')
      return
    }

    if (field === 'property_video') {
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Video file must be less than 100MB')
        return
      }
      if (!file.type.startsWith('video/')) {
        toast.error('Please upload a valid video file')
        return
      }
      setFormData(prev => ({ ...prev, [field]: file }))
    } else if (field === 'images') {
      if ((formData.images?.length || 0) >= 20) {
        toast.error('Maximum 20 images allowed')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image file must be less than 10MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file')
        return
      }
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), file]
      }))

      try {
        const url = URL.createObjectURL(file)
        setObjectUrls(prev => [...prev, url])
      } catch (error) {
        console.error('Error creating object URL:', error)
      }
    } else if (field === 'documents') {
      if (file.size > 20 * 1024 * 1024) {
        toast.error('Document file must be less than 20MB')
        return
      }
      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), file]
      }))
    }
    setHasUnsavedChanges(true)
  }

  const handleRemoveFile = (field: 'images' | 'documents' | 'property_video', index?: number) => {
    if (field === 'property_video') {
      if (isFile(formData.property_video)) {
        try {
          const url = getImageUrl(formData.property_video)
          if (url) URL.revokeObjectURL(url)
        } catch (error) {
          // Ignore errors
        }
      }
      setFormData(prev => ({ ...prev, property_video: undefined }))
    } else if (field === 'images' && index !== undefined) {
      const imageToRemove = formData.images?.[index]
      if (imageToRemove) {
        try {
          const url = getImageUrl(imageToRemove)
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url)
            setObjectUrls(prev => prev.filter(u => u !== url))
          }
        } catch (error) {
          // Ignore errors
        }
      }
      setFormData(prev => ({
        ...prev,
        images: prev.images?.filter((_, i) => i !== index) || []
      }))
    } else if (field === 'documents' && index !== undefined) {
      setFormData(prev => ({
        ...prev,
        documents: prev.documents?.filter((_, i) => i !== index) || []
      }))
    }
    setHasUnsavedChanges(true)
  }

  const handleImageReorder = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const newImages = [...(prev.images || [])]
      const [movedImage] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, movedImage)
      return { ...prev, images: newImages }
    })
    setHasUnsavedChanges(true)
  }

  const handleAmenityToggle = (amenityId: number) => {
    setFormData(prev => {
      const currentAmenities = prev.amenities || []
      if (currentAmenities.includes(amenityId)) {
        return {
          ...prev,
          amenities: currentAmenities.filter(id => id !== amenityId)
        }
      } else {
        return {
          ...prev,
          amenities: [...currentAmenities, amenityId]
        }
      }
    })
    setHasUnsavedChanges(true)
  }

  const handleBooleanToggle = (field: keyof PropertyFormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
    setHasUnsavedChanges(true)
  }

  const validatePrice = (): string | null => {
    if (listingType === 'for_sale') {
      if (formData.price_etb && formData.price_etb < 10000) {
        return 'Price seems too low. Please check the amount.'
      }
    } else {
      if (formData.monthly_rent && formData.monthly_rent < 1000) {
        return 'Monthly rent seems too low. Please check the amount.'
      }
    }
    return null
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.title?.trim()) errors.title = 'Property title is required'
    if (!formData.description?.trim()) errors.description = 'Description is required'
    if (!formData.city) errors.city = 'Please select a city'
    if (!formData.sub_city) errors.sub_city = 'Please select a sub-city'
    if (!formData.specific_location?.trim()) errors.specific_location = 'Specific location is required'
    if (!formData.total_area || formData.total_area <= 0) errors.total_area = 'Valid total area is required'

    if (listingType === 'for_sale') {
      if (!formData.price_etb || formData.price_etb <= 0) {
        errors.price_etb = 'Valid price is required'
      }
    } else {
      if (!formData.monthly_rent || formData.monthly_rent <= 0) {
        errors.monthly_rent = 'Valid monthly rent is required'
      }
    }

    const validImages = formData.images?.filter(img => isFile(img)) || []
    if (validImages.length === 0) errors.images = 'At least one image is required'

    const priceError = validatePrice()
    if (priceError) errors.price = priceError

    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach(error => toast.error(error))
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      const formDataObj = new FormData()

      const now = new Date().toISOString()
      formDataObj.append('created_at', now)
      formDataObj.append('listed_date', now)

      formDataObj.append('title', formData.title!)
      if (formData.title_amharic) {
        formDataObj.append('title_amharic', formData.title_amharic)
      }
      formDataObj.append('description', formData.description!)

      if (formData.description_amharic) {
        formDataObj.append('description_amharic', formData.description_amharic)
      }

      formDataObj.append('property_type', formData.property_type || 'house')
      formDataObj.append('listing_type', listingType)
      formDataObj.append('property_status', 'available')

      formDataObj.append('city', formData.city!.toString())
      formDataObj.append('sub_city', formData.sub_city!.toString())
      formDataObj.append('specific_location', formData.specific_location!)

      if (formData.address_line_1) {
        formDataObj.append('address_line_1', formData.address_line_1)
      }
      if (formData.address_line_2) {
        formDataObj.append('address_line_2', formData.address_line_2)
      }

      if (formData.bedrooms) {
        formDataObj.append('bedrooms', formData.bedrooms.toString())
      }
      if (formData.bathrooms) {
        formDataObj.append('bathrooms', formData.bathrooms.toString())
      }
      formDataObj.append('total_area', formData.total_area!.toString())
      if (formData.plot_size) {
        formDataObj.append('plot_size', formData.plot_size.toString())
      }
      if (formData.built_year) {
        formDataObj.append('built_year', formData.built_year.toString())
      }
      formDataObj.append('floors', (formData.floors || 1).toString())
      formDataObj.append('furnishing_type', formData.furnishing_type || 'unfurnished')

      const priceEtbValue = listingType === 'for_sale'
        ? formData.price_etb!
        : (formData.monthly_rent! || 0)

      formDataObj.append('price_etb', priceEtbValue.toString())

      if (listingType === 'for_sale') {
        if (formData.price_usd) {
          formDataObj.append('price_usd', formData.price_usd.toString())
        }
      } else {
        formDataObj.append('monthly_rent', formData.monthly_rent!.toString())
        if (formData.security_deposit) {
          formDataObj.append('security_deposit', formData.security_deposit.toString())
        }
      }

      formDataObj.append('price_negotiable', formData.price_negotiable ? 'true' : 'false')

      if (formData.maintenance_fee) {
        formDataObj.append('maintenance_fee', formData.maintenance_fee.toString())
      }
      if (formData.property_tax) {
        formDataObj.append('property_tax', formData.property_tax.toString())
      }

      Object.values(AMENITIES_CATEGORIES).flat().forEach(amenity => {
        const value = formData[amenity.key as keyof PropertyFormData]
        if (typeof value === 'boolean') {
          formDataObj.append(amenity.key, value ? 'true' : 'false')
        }
      })

      formData.amenities?.forEach(amenityId => {
        formDataObj.append('amenities', amenityId.toString())
      })

      DOCUMENTS.forEach(doc => {
        const value = formData[doc.key as keyof PropertyFormData]
        if (typeof value === 'boolean') {
          formDataObj.append(doc.key, value ? 'true' : 'false')
        }
      })

      const validImages = formData.images?.filter(img => isFile(img)) || []
      validImages.forEach((image) => {
        if (isFile(image)) {
          formDataObj.append('images', image)
        }
      })

      if (isFile(formData.property_video)) {
        formDataObj.append('property_video', formData.property_video)
      }

      if (formData.virtual_tour_url) {
        formDataObj.append('virtual_tour_url', formData.virtual_tour_url)
      }

      formData.documents?.forEach((doc) => {
        if (isFile(doc)) {
          formDataObj.append('documents', doc)
        }
      })

      formDataObj.append('is_premium', 'false');

      formDataObj.append('promotionTier', selectedPromotionTier)
      formDataObj.append('is_promoted', selectedPromotionTier !== 'basic' ? 'true' : 'false')

      if (user?.is_staff || user?.is_superuser || selectedPromotionTier !== 'basic') {
        formDataObj.append('approval_status', 'approved')
        formDataObj.append('is_active', 'true')
        formDataObj.append('approved_by', user?.id?.toString() || '')
        formDataObj.append('approved_at', new Date().toISOString())
      } else {
        formDataObj.append('approval_status', 'pending')
        formDataObj.append('is_active', 'true')
      }

      if (selectedPromotionTier !== 'basic') {
        setIsSubmitting(true)
        toast.loading('Creating your listing...')

        try {
          const response = await listingsApi.createProperty(formDataObj, selectedPromotionTier)
          toast.dismiss()
          toast.success('Listing created! Redirecting to payment...')

          localStorage.setItem('last_payment_attempt', JSON.stringify({
            propertyId: response.id,
            tierType: selectedPromotionTier,
            duration: selectedDuration,
            timestamp: new Date().toISOString()
          }))

          try {
            const paymentResponse = await subscriptionApi.initiatePromotionPayment({
              property_id: response.id,
              tier_type: selectedPromotionTier,
              duration_days: selectedDuration,
            })

            if (paymentResponse.checkout_url) {
              window.location.href = paymentResponse.checkout_url
              return
            }
          } catch (paymentError) {
            console.log('API payment failed, trying direct Chapa...', paymentError)
          }

          const txRef = `utopia-promo-${response.id}-${Date.now()}`
          const chapaPaymentUrl = `https://api.chapa.co/v1/hosted/pay?` + new URLSearchParams({
            public_key: process.env.NEXT_PUBLIC_CHAPA_PUBLIC_KEY || 'chapa_test_XXX',
            amount: promotionPrice.toString(),
            currency: 'ETB',
            email: user?.email || 'customer@example.com',
            first_name: user?.first_name || 'Customer',
            last_name: user?.last_name || 'Name',
            tx_ref: txRef,
            callback_url: `${window.location.origin}/api/payment/callback?property_id=${response.id}&tier=${selectedPromotionTier}&duration=${selectedDuration}`,
            return_url: `${window.location.origin}/listings/${response.id}?promotion=success`,
            'customization[title]': 'Property Promotion Payment',
            'customization[description]': `Promotion for ${formData.title || 'Property'}`,
          }).toString()

          localStorage.setItem('chapa_payment_data', JSON.stringify({
            propertyId: response.id,
            tierType: selectedPromotionTier,
            duration: selectedDuration,
            txRef,
            amount: promotionPrice,
            timestamp: new Date().toISOString()
          }))

          setTimeout(() => {
            window.location.href = chapaPaymentUrl
          }, 1000)

        } catch (error: any) {
          toast.dismiss()
          console.error('Error creating property:', error)

          if (error.response?.status === 400) {
            const errors = error.response.data
            console.error('Validation errors:', errors)

            if (typeof errors === 'object') {
              Object.entries(errors).forEach(([field, messages]) => {
                if (Array.isArray(messages)) {
                  messages.forEach(msg => toast.error(`${field}: ${msg}`))
                } else {
                  toast.error(`${field}: ${messages}`)
                }
              })
              return
            }

            toast.error(`Validation error: ${JSON.stringify(errors)}`)
          } else {
            const errorMessage = error.response?.data?.error ||
              error.response?.data?.detail ||
              error.message ||
              'Failed to create listing. Please try again.'
            toast.error(errorMessage)
          }
        } finally {
          setIsSubmitting(false)
        }
      } else {
        createMutation.mutate(formDataObj)
      }

    } catch (error) {
      console.error('Error preparing form data:', error)
      toast.error('Error preparing form data. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    try {
      const draftData = {
        ...formData,
        images: formData.images?.map((image) => {
          if (isFile(image)) {
            return {
              name: image.name,
              size: image.size,
              type: image.type,
              lastModified: image.lastModified,
              isPlaceholder: true
            }
          }
          return image
        }),
        property_video: isFile(formData.property_video) ? {
          name: formData.property_video.name,
          size: formData.property_video.size,
          type: formData.property_video.type,
          lastModified: formData.property_video.lastModified,
          isPlaceholder: true
        } : formData.property_video,
        documents: formData.documents?.map((doc) => {
          if (isFile(doc)) {
            return {
              name: doc.name,
              size: doc.size,
              type: doc.type,
              lastModified: doc.lastModified,
              isPlaceholder: true
            }
          }
          return doc
        }),
        timestamp: new Date().toISOString()
      }

      localStorage.setItem('property_draft', JSON.stringify(draftData))
      setHasUnsavedChanges(false)
      toast.success('Draft saved successfully!')
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft. File may be too large.')
    }
  }

  const handleLoadDraft = () => {
    try {
      const draft = localStorage.getItem('property_draft')
      if (draft) {
        const parsedDraft = JSON.parse(draft)

        if (parsedDraft.images) {
          parsedDraft.images = parsedDraft.images.map((img: any) => {
            return {
              name: img.name || 'uploaded-image.jpg',
              size: img.size || 0,
              type: img.type || 'image/jpeg',
              isPlaceholder: true
            }
          })
        }

        setFormData(parsedDraft)
        setHasUnsavedChanges(true)
        toast.success('Draft loaded successfully! Note: Please re-upload any images.')
      } else {
        toast.error('No draft found')
      }
    } catch (error) {
      console.error('Error loading draft:', error)
      toast.error('Failed to load draft. File may be corrupted.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, tabValue: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setActiveTab(tabValue)
    }
  }

  const progress = {
    basic: formData.title && formData.description && formData.property_type ? 100 : 0,
    location: formData.city && formData.sub_city && formData.specific_location ? 100 : 0,
    details: formData.bedrooms && formData.total_area ? 100 : 0,
    pricing: (listingType === 'for_sale' ? formData.price_etb : formData.monthly_rent) ? 100 : 0,
    features: Object.values(AMENITIES_CATEGORIES).flat().some(amenity =>
      formData[amenity.key as keyof PropertyFormData]
    ) ? 100 : 0,
    media: (formData.images?.filter(img => isFile(img)).length || 0) > 0 ? 100 : 0,
    promotion: 100,
  };

  const totalProgress = Math.round(
    Object.values(progress).reduce((a, b) => a + b, 0) / 7
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner fullScreen />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
      <Header />
      <div className="container max-w-7xl py-6 px-4 sm:px-6">
        {/* Mobile Header */}
        <div className="md:hidden mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-10 w-10 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {listingType === 'for_sale' ? t('titles.sellProperty') : t('titles.rentProperty')}
            </h1>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadDraft}
              className="flex-1 gap-2 border-primary/20 hover:border-primary/40"
            >
              <Clock className="h-4 w-4" />
              {t('buttons.loadDraft')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className="flex-1 gap-2 border-primary/20 hover:border-primary/40"
            >
              <Save className="h-4 w-4" />
              {t('buttons.saveDraft')}
            </Button>
          </div>
        </div>

        {/* Progress Header */}
        <div className="mb-8 bg-card rounded-2xl shadow-lg border border-border/50 dark:border-border/30 p-6 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {listingType === 'for_sale' ? t('titles.sellYourProperty') : t('titles.rentYourProperty')}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm md:text-base flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {locale.toUpperCase()}
                </span>
                <span>•</span>
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 animate-pulse">
                  <Clock className="h-3 w-3 mr-1" />
                  {t('badges.unsavedChanges')}
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadDraft}
                className="gap-2 border-primary/20 hover:border-primary/40"
              >
                <Clock className="h-4 w-4" />
                {t('buttons.loadDraft')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="gap-2 border-primary/20 hover:border-primary/40"
              >
                <Save className="h-4 w-4" />
                {t('buttons.saveDraft')}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {t('progress.completion', { percentage: totalProgress })}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {Object.values(progress).filter(p => p === 100).length}/7
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground hidden md:inline">
                {t('progress.sections', { completed: Object.values(progress).filter(p => p === 100).length, total: 7 })}
              </span>
            </div>
            <Progress value={totalProgress} className="h-3 bg-muted/50" />
            <div className="hidden md:grid grid-cols-7 gap-2 text-xs text-muted-foreground">
              {['basic', 'location', 'details', 'pricing', 'features', 'media', 'promotion'].map((key, index) => {
                const sectionKey = Object.keys(progress)[index] as keyof typeof progress;
                const sectionProgress = progress[sectionKey];
                const label = t(`progress.${key}`);

                return (
                  <div
                    key={key}
                    className={`text-center font-medium transition-colors ${sectionProgress >= 100
                      ? 'text-primary font-semibold'
                      : sectionProgress > 0
                        ? 'text-primary/70'
                        : 'text-muted-foreground'
                      }`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              {/* Mobile Tabs Trigger */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full md:hidden mb-4 border-primary/20 hover:border-primary/40">
                    <div className="flex items-center justify-between w-full">
                      <span className="capitalize font-medium">{activeTab} Information</span>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
                  <SheetHeader className="mb-4">
                    <SheetTitle className="text-lg font-bold">Navigate Sections</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100%-80px)]">
                    <div className="space-y-1">
                      {['basic', 'location', 'details', 'pricing', 'features', 'media', 'promotion'].map((tab) => (
                        <Button
                          key={tab}
                          variant={activeTab === tab ? "default" : "ghost"}
                          className="w-full justify-start capitalize h-12 rounded-lg"
                          onClick={() => {
                            setActiveTab(tab)
                            setIsMobileMenuOpen(false)
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {tab === 'basic' && <Home className="h-4 w-4" />}
                            {tab === 'location' && <MapPin className="h-4 w-4" />}
                            {tab === 'details' && <Building className="h-4 w-4" />}
                            {tab === 'pricing' && <DollarSign className="h-4 w-4" />}
                            {tab === 'features' && <CheckSquare className="h-4 w-4" />}
                            {tab === 'media' && <ImageIcon className="h-4 w-4" />}
                            {tab === 'promotion' && <TrendingUp className="h-4 w-4" />}
                            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-2 hidden md:block">
                <TabsList className="grid w-full grid-cols-7 bg-muted/50 p-1 rounded-xl border">
                  {['basic', 'location', 'details', 'pricing', 'features', 'media', 'promotion'].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary text-xs md:text-sm rounded-lg transition-all duration-300"
                      onKeyDown={(e) => handleKeyDown(e, tab)}
                      tabIndex={0}
                      role="tab"
                      aria-label={`${tab} tab`}
                    >
                      {tab === 'basic' && <Home className="h-3 w-3 mr-2 hidden sm:inline" />}
                      {tab === 'location' && <MapPin className="h-3 w-3 mr-2 hidden sm:inline" />}
                      {tab === 'details' && <Building className="h-3 w-3 mr-2 hidden sm:inline" />}
                      {tab === 'pricing' && <DollarSign className="h-3 w-3 mr-2 hidden sm:inline" />}
                      {tab === 'features' && <CheckSquare className="h-3 w-3 mr-2 hidden sm:inline" />}
                      {tab === 'media' && <ImageIcon className="h-3 w-3 mr-2 hidden sm:inline" />}
                      {tab === 'promotion' && <TrendingUp className="h-3 w-3 mr-2 hidden sm:inline" />}
                      <span className="hidden sm:inline">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                      <span className="sm:hidden">{tab.charAt(0).toUpperCase()}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-b from-card to-card/95">
                  <CardHeader className="p-6 border-b border-border/50">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Home className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <span className="text-foreground">{t('sections.basic.title')}</span>
                        <CardDescription className="mt-1">
                          {t('sections.basic.subtitle')}
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {/* Listing Type */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold text-foreground">
                        {t('sections.basic.listingType')} *
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={listingType === 'for_sale' ? 'default' : 'outline'}
                          className="h-16 text-base border-2 transition-all duration-300 hover:scale-[1.02]"
                          onClick={() => {
                            setListingType('for_sale')
                            handleInputChange('listing_type', 'for_sale')
                          }}
                        >
                          <DollarSign className="mr-3 h-5 w-5" />
                          <div className="text-left">
                            <div className="font-semibold">{t('sections.basic.sell')}</div>
                            <div className="text-xs opacity-80">Sell your property</div>
                          </div>
                        </Button>
                        <Button
                          type="button"
                          variant={listingType === 'for_rent' ? 'default' : 'outline'}
                          className="h-16 text-base border-2 transition-all duration-300 hover:scale-[1.02]"
                          onClick={() => {
                            setListingType('for_rent')
                            handleInputChange('listing_type', 'for_rent')
                          }}
                        >
                          <Home className="mr-3 h-5 w-5" />
                          <div className="text-left">
                            <div className="font-semibold">{t('sections.basic.rent')}</div>
                            <div className="text-xs opacity-80">Rent your property</div>
                          </div>
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="title" className="font-semibold text-foreground">
                          {t('sections.basic.propertyTitle')} *
                        </Label>
                        <Input
                          id="title"
                          value={formData.title || ""}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder={t('sections.basic.titlePlaceholder')}
                          className="h-14 text-base border-2 focus:border-primary"
                        />
                        {formErrors.title && (
                          <p className="text-sm text-destructive animate-in fade-in">
                            {formErrors.title}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          {t('sections.basic.titleTip')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="title_amharic" className="font-semibold text-foreground">
                          {t('sections.basic.propertyTitle')} (አማርኛ)
                        </Label>
                        <Input
                          id="title_amharic"
                          value={formData.title_amharic || ''}
                          onChange={(e) => handleInputChange('title_amharic', e.target.value)}
                          placeholder="አዲስ ዘመናዊ 3 አልጋ አፓርትመንት ቦሌ"
                          className="h-14 text-base border-2 focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="property_type" className="font-semibold text-foreground">
                        {t('sections.basic.propertyType')} *
                      </Label>
                      <div className="relative">
                        <Select
                          value={formData.property_type}
                          onValueChange={(value) => handleInputChange('property_type', value)}
                          placeholder={t('sections.basic.propertyTypePlaceholder')}
                        >
                          <SelectContent>
                            {PROPERTY_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value} className="h-12">
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description" className="font-semibold text-foreground">
                        {t('sections.basic.description')} *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your property in detail. Include features, condition, and unique selling points..."
                        className="min-h-48 text-base border-2 focus:border-primary resize-none"
                        rows={6}
                      />
                      {formErrors.description && (
                        <p className="text-sm text-destructive animate-in fade-in">
                          {formErrors.description}
                        </p>
                      )}
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Type className="h-4 w-4" />
                          Be descriptive and detailed
                        </span>
                        <span>{formData.description?.length || 0}/2000 characters</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description_amharic" className="font-semibold text-foreground">
                        {t('sections.basic.description')} (አማርኛ)
                      </Label>
                      <Textarea
                        id="description_amharic"
                        value={formData.description_amharic || ''}
                        onChange={(e) => handleInputChange('description_amharic', e.target.value)}
                        placeholder="የንብረትዎን ዝርዝር መረጃ ይጻፉ። ባህሪያት፣ ሁኔታና ልዩ ማሻሻያዎችን ያካትቱ..."
                        className="min-h-48 text-base border-2 focus:border-primary resize-none"
                        rows={6}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/listings')}
                    className="gap-2 border-primary/20 hover:border-primary/40 h-11"
                  >
                    {tc('cancel')}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('location')}
                    className="gap-2 h-11 px-8"
                  >
                    {t('buttons.next')}: Location
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Location - Updated from second file */}
              <TabsContent value="location" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-sm">
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <MapPin className="h-5 w-5 text-primary" />
                      Location Details
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Tell us where your property is located. Enter coordinates to auto-fill details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-4 md:p-6">
                    <div className="grid gap-6">
                      <div className="space-y-3 relative">
                        <Label htmlFor="city" className="font-medium text-foreground">
                          City *
                        </Label>
                        <Select
                          value={formData.city?.toString() || ''}
                          onValueChange={(value) => {
                            handleInputChange('city', parseInt(value))
                          }}
                          placeholder={isLoadingCities ? "Loading cities..." : "Select city"}
                          disabled={isLoadingCities}
                        >
                          <SelectContent>
                            {citiesError ? (
                              <SelectItem value="error" disabled>
                                Failed to load cities
                              </SelectItem>
                            ) : cities.length === 0 ? (
                              <SelectItem value="empty" disabled>
                                No cities available
                              </SelectItem>
                            ) : (
                              cities.map((city) => (
                                <SelectItem key={city.id} value={city.id.toString()}>
                                  <div className="flex flex-col">
                                    <span>{city.name}</span>
                                    <span className="text-xs text-muted-foreground">{city.name_amharic}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {formErrors.city && (
                          <p className="text-sm text-destructive">
                            {formErrors.city}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 relative">
                        <Label htmlFor="sub_city" className="font-medium text-foreground">
                          Sub-City *
                        </Label>
                        <Select
                          value={formData.sub_city?.toString() || ''}
                          onValueChange={(value) => {
                            handleInputChange('sub_city', parseInt(value))
                          }}
                          disabled={!formData.city || isLoadingSubCities}
                          placeholder={
                              !formData.city
                                ? "Select city first"
                                : isLoadingSubCities
                                  ? "Loading..."
                                  : "Select sub-city"
                            } 
                        >
                          <SelectContent>
                            {!formData.city ? (
                              <SelectItem value="select_city_first" disabled>
                                Please select a city first
                              </SelectItem>
                            ) : subCitiesError ? (
                              <SelectItem value="error" disabled>
                                Failed to load sub-cities
                              </SelectItem>
                            ) : subCities.length === 0 ? (
                              <SelectItem value="no_subcities" disabled>
                                No sub-cities available for this city
                              </SelectItem>
                            ) : (
                              subCities.map((subCity) => (
                                <SelectItem key={subCity.id} value={subCity.id.toString()}>
                                  <div className="flex flex-col">
                                    <span>{subCity.name}</span>
                                    <span className="text-xs text-muted-foreground">{subCity.name_amharic}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {formErrors.sub_city && (
                          <p className="text-sm text-destructive">
                            {formErrors.sub_city}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="specific_location" className="font-medium text-foreground">
                        Specific Location *
                      </Label>
                      <Input
                        id="specific_location"
                        value={formData.specific_location || ''}
                        onChange={(e) => handleInputChange('specific_location', e.target.value)}
                        placeholder="e.g., Bole Road, near Edna Mall"
                        className="h-12"
                      />
                      {formErrors.specific_location && (
                        <p className="text-sm text-destructive">
                          {formErrors.specific_location}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="address_line_1" className="font-medium text-foreground">
                          Address Line 1
                        </Label>
                        <Input
                          id="address_line_1"
                          value={formData.address_line_1 || ''}
                          onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                          placeholder="House number, building name"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="address_line_2" className="font-medium text-foreground">
                          Address Line 2
                        </Label>
                        <Input
                          id="address_line_2"
                          value={formData.address_line_2 || ''}
                          onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                          placeholder="Additional address details"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                          <Navigation className="h-5 w-5 text-primary" />
                          Exact Coordinates
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (navigator.geolocation) {
                              toast.loading('Detecting your location...')
                              navigator.geolocation.getCurrentPosition(
                                async (position) => {
                                  toast.dismiss()
                                  handleInputChange('latitude', position.coords.latitude)
                                  handleInputChange('longitude', position.coords.longitude)
                                  toast.success('Location detected! Auto-filling details...')
                                },
                                (error) => {
                                  toast.dismiss()
                                  toast.error('Unable to detect location. Please enter manually.')
                                }
                              )
                            } else {
                              toast.error('Geolocation is not supported by your browser')
                            }
                          }}
                          className="gap-1 h-7 text-xs"
                          disabled={isGeocoding}
                        >
                          <Compass className="h-3 w-3" />
                          {isGeocoding ? 'Detecting...' : 'Auto-detect'}
                        </Button>
                      </div>

                      <div className="grid gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="latitude" className="font-medium text-foreground">
                              Latitude
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (formData.latitude && formData.longitude) {
                                  try {
                                    await autoFillLocationFromCoordinates(formData.latitude, formData.longitude)
                                  } catch (error) {
                                    toast.error('Could not fetch location details')
                                  }
                                } else {
                                  toast.error('Please enter coordinates first')
                                }
                              }}
                              disabled={!formData.latitude || !formData.longitude || isGeocoding}
                              className="gap-1 h-7 text-xs"
                            >
                              <Search className="h-3 w-3" />
                              {isGeocoding ? 'Looking up...' : 'Look up'}
                            </Button>
                          </div>
                          <div className="relative">
                            <Input
                              id="latitude"
                              type="number"
                              step="any"
                              value={formData.latitude || ''}
                              onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : undefined
                                handleInputChange('latitude', value)
                              }}
                              placeholder="e.g., 9.0320"
                              className="h-12"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="longitude" className="font-medium text-foreground">
                            Longitude
                          </Label>
                          <div className="relative">
                            <Input
                              id="longitude"
                              type="number"
                              step="any"
                              value={formData.longitude || ''}
                              onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : undefined
                                handleInputChange('longitude', value)
                              }}
                              placeholder="e.g., 38.7460"
                              className="h-12"
                            />
                          </div>
                        </div>
                      </div>

                      {geocodeResult && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                                Location detected:
                              </p>
                              {geocodeResult.city && (
                                <p className="text-xs text-green-700 dark:text-green-400">
                                  <span className="font-medium">City:</span> {geocodeResult.city}
                                </p>
                              )}
                              {geocodeResult.subcity && (
                                <p className="text-xs text-green-700 dark:text-green-400">
                                  <span className="font-medium">Area:</span> {geocodeResult.subcity}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-800 dark:text-blue-300">Location Privacy</AlertTitle>
                      <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
                        Exact coordinates are only shared with verified buyers after inquiry approval.
                        Public listings show only the general area.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('basic')}
                    className="gap-2 border-primary/20 hover:border-primary/40 h-11"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    {t('buttons.previous')}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('details')}
                    className="gap-2 h-11 px-8"
                  >
                    {t('buttons.next')}: Details
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Property Details - Enhanced */}
              <TabsContent value="details" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-b from-card to-card/95">
                  <CardHeader className="p-6 border-b border-border/50">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-full bg-purple-500/10">
                        <Building className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <span className="text-foreground">Property Specifications</span>
                        <CardDescription className="mt-1">
                          Provide detailed specifications of your property
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {/* Room Counts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label htmlFor="bedrooms" className="font-semibold text-foreground">
                          Bedrooms
                        </Label>
                        <div className="relative">
                          <Bed className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Select
                            value={formData.bedrooms?.toString() || '1'}
                            onValueChange={(value) => handleInputChange('bedrooms', parseInt(value))}
                            placeholder="Select bedrooms"
                          >
                            <SelectContent>
                              {BEDROOM_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="h-12">
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="bathrooms" className="font-semibold text-foreground">
                          Bathrooms
                        </Label>
                        <div className="relative">
                          <Bath className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Select
                            value={formData.bathrooms?.toString() || '1'}
                            onValueChange={(value) => handleInputChange('bathrooms', parseInt(value))}
                            placeholder="Select bathrooms"
                          >
                            <SelectContent>
                              {BATHROOM_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="h-12">
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Area Measurements */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label htmlFor="total_area" className="font-semibold text-foreground">
                          Total Area (m²) *
                        </Label>
                        <div className="relative">
                          <Maximize2 className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="total_area"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.total_area || ''}
                            onChange={(e) => handleInputChange('total_area', parseFloat(e.target.value) || 0)}
                            placeholder="e.g., 150"
                            className="h-14 text-base border-2 pl-12 focus:border-purple-500"
                          />
                        </div>
                        {formErrors.total_area && (
                          <p className="text-sm text-destructive mt-2 animate-in fade-in">
                            {formErrors.total_area}
                          </p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="plot_size" className="font-semibold text-foreground">
                          Plot Size (m²)
                        </Label>
                        <div className="relative">
                          <Square className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="plot_size"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.plot_size || ''}
                            onChange={(e) => handleInputChange('plot_size', parseFloat(e.target.value) || 0)}
                            placeholder="For houses and land"
                            className="h-14 text-base border-2 pl-12 focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Year & Floors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label htmlFor="built_year" className="font-semibold text-foreground">
                          Built Year
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="built_year"
                            type="number"
                            min="1800"
                            max={new Date().getFullYear()}
                            value={formData.built_year || ''}
                            onChange={(e) => handleInputChange('built_year', parseInt(e.target.value))}
                            placeholder="e.g., 2020"
                            className="h-14 text-base border-2 pl-12 focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="floors" className="font-semibold text-foreground">
                          Number of Floors
                        </Label>
                        <div className="relative">
                          <Layers className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="floors"
                            type="number"
                            min="1"
                            value={formData.floors || 1}
                            onChange={(e) => handleInputChange('floors', parseInt(e.target.value))}
                            className="h-14 text-base border-2 pl-12 focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Furnishing Type */}
                    <div className="space-y-4">
                      <Label htmlFor="furnishing_type" className="font-semibold text-foreground">
                        Furnishing Type
                      </Label>
                      <div className="relative">
                        <Sofa className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Select
                          value={formData.furnishing_type}
                          onValueChange={(value) => handleInputChange('furnishing_type', value)}
                          placeholder="Select furnishing type"
                        >
                          <SelectContent>
                            {FURNISHING_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value} className="h-12">
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('location')}
                    className="gap-2 border-primary/20 hover:border-primary/40 h-11"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    {t('buttons.previous')}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('pricing')}
                    className="gap-2 h-11 px-8"
                  >
                    {t('buttons.next')}: Pricing
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Pricing - Enhanced */}
              <TabsContent value="pricing" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-b from-card to-card/95">
                  <CardHeader className="p-6 border-b border-border/50">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-full bg-green-500/10">
                        <DollarSign className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <span className="text-foreground">
                          {listingType === 'for_sale' ? 'Sale Price' : 'Rental Information'}
                        </span>
                        <CardDescription className="mt-1">
                          Set your asking price and additional costs
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {listingType === 'for_sale' ? (
                      <>
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <Label className="text-lg font-semibold text-foreground">
                              Price Calculation
                            </Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={priceCalculationMode === 'etb' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPriceCalculationMode('etb')}
                                className="gap-2"
                              >
                                <span>ETB</span>
                              </Button>
                              <Button
                                type="button"
                                variant={priceCalculationMode === 'usd' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPriceCalculationMode('usd')}
                                className="gap-2"
                              >
                                <span>USD</span>
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <Label htmlFor="price_etb" className="font-semibold text-foreground">
                                Price (ETB) *
                              </Label>
                              <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                  id="price_etb"
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={formData.price_etb || ''}
                                  onChange={(e) => handleInputChange('price_etb', parseFloat(e.target.value) || 0)}
                                  placeholder="e.g., 5,000,000"
                                  className="h-14 text-base border-2 pl-12 focus:border-green-500"
                                  disabled={priceCalculationMode === 'usd'}
                                />
                              </div>
                              {formErrors.price_etb && (
                                <p className="text-sm text-destructive mt-2 animate-in fade-in">
                                  {formErrors.price_etb}
                                </p>
                              )}
                            </div>

                            <div className="space-y-4">
                              <Label htmlFor="price_usd" className="font-semibold text-foreground">
                                Price (USD)
                              </Label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground">$</span>
                                <Input
                                  id="price_usd"
                                  type="number"
                                  min="0"
                                  step="100"
                                  value={formData.price_usd || ''}
                                  onChange={(e) => handleInputChange('price_usd', parseFloat(e.target.value) || 0)}
                                  placeholder="e.g., 90,000"
                                  className="h-14 text-base border-2 pl-12 focus:border-green-500"
                                  disabled={priceCalculationMode === 'etb'}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label htmlFor="property_tax" className="font-semibold text-foreground">
                            Annual Property Tax (ETB)
                          </Label>
                          <div className="relative">
                            <Receipt className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="property_tax"
                              type="number"
                              min="0"
                              step="100"
                              value={formData.property_tax || ''}
                              onChange={(e) => handleInputChange('property_tax', parseFloat(e.target.value) || 0)}
                              placeholder="e.g., 10,000"
                              className="h-14 text-base border-2 pl-12 focus:border-green-500"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <Label htmlFor="monthly_rent" className="font-semibold text-foreground">
                              Monthly Rent (ETB) *
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                id="monthly_rent"
                                type="number"
                                min="0"
                                step="1000"
                                value={formData.monthly_rent || ''}
                                onChange={(e) => handleInputChange('monthly_rent', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 15,000"
                                className="h-14 text-base border-2 pl-12 focus:border-green-500"
                              />
                            </div>
                            {formErrors.monthly_rent && (
                              <p className="text-sm text-destructive mt-2 animate-in fade-in">
                                {formErrors.monthly_rent}
                              </p>
                            )}
                          </div>

                          <div className="space-y-4">
                            <Label htmlFor="security_deposit" className="font-semibold text-foreground">
                              Security Deposit (ETB)
                            </Label>
                            <div className="relative">
                              <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                id="security_deposit"
                                type="number"
                                min="0"
                                step="1000"
                                value={formData.security_deposit || ''}
                                onChange={(e) => handleInputChange('security_deposit', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 30,000"
                                className="h-14 text-base border-2 pl-12 focus:border-green-500"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <Label htmlFor="maintenance_fee" className="font-semibold text-foreground">
                              Monthly Maintenance (ETB)
                            </Label>
                            <div className="relative">
                              <Wrench className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                id="maintenance_fee"
                                type="number"
                                min="0"
                                step="100"
                                value={formData.maintenance_fee || ''}
                                onChange={(e) => handleInputChange('maintenance_fee', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 2,000"
                                className="h-14 text-base border-2 pl-12 focus:border-green-500"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label htmlFor="property_tax" className="font-semibold text-foreground">
                              Property Tax (ETB/year)
                            </Label>
                            <div className="relative">
                              <Receipt className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                id="property_tax"
                                type="number"
                                min="0"
                                step="100"
                                value={formData.property_tax || ''}
                                onChange={(e) => handleInputChange('property_tax', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 10,000"
                                className="h-14 text-base border-2 pl-12 focus:border-green-500"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {formErrors.price && (
                      <Alert variant="destructive" className="animate-in fade-in">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Price Check Required</AlertTitle>
                        <AlertDescription>{formErrors.price}</AlertDescription>
                      </Alert>
                    )}

                    {/* Negotiable Switch */}
                    <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                      <Switch
                        id="price_negotiable"
                        checked={formData.price_negotiable}
                        onCheckedChange={(checked) => handleInputChange('price_negotiable', checked)}
                        className="data-[state=checked]:bg-green-500"
                      />
                      <div className="flex-1">
                        <Label htmlFor="price_negotiable" className="font-semibold cursor-pointer text-foreground">
                          Price is negotiable
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Allow potential buyers/renters to negotiate the price
                        </p>
                      </div>
                      {formData.price_negotiable && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                          Negotiable
                        </Badge>
                      )}
                    </div>

                    {/* Pricing Tips */}
                    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900 rounded-xl">
                      <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-800 dark:text-blue-300">Pricing Tips</AlertTitle>
                      <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm space-y-2">
                        <p className="font-medium">
                          {listingType === 'for_sale'
                            ? '💡 Research similar properties in your area for competitive pricing.'
                            : '💡 Include all monthly costs. Security deposit is typically 1-2 months rent.'}
                        </p>
                        <p>📊 Check market trends for accurate pricing</p>
                        <p>🎯 Competitive pricing attracts more buyers/renters</p>
                        <p>💰 Consider including utilities in rent for better value</p>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('details')}
                    className="gap-2 border-primary/20 hover:border-primary/40 h-11"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    {t('buttons.previous')}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('features')}
                    className="gap-2 h-11 px-8"
                  >
                    {t('buttons.next')}: Features
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Features & Amenities - Enhanced with categories */}
              <TabsContent value="features" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-b from-card to-card/95">
                  <CardHeader className="p-6 border-b border-border/50">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-full bg-yellow-500/10">
                        <CheckSquare className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div>
                        <span className="text-foreground">Features & Amenities</span>
                        <CardDescription className="mt-1">
                          Select all the features and amenities your property offers
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-8">
                        {/* View Mode Toggle */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="text-sm text-muted-foreground">
                            Select amenities by category
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant={viewMode === 'grid' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setViewMode('grid')}
                              className="h-8 w-8 p-0"
                            >
                              <Grid className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={viewMode === 'list' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setViewMode('list')}
                              className="h-8 w-8 p-0"
                            >
                              <List className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Essentials Category */}
                        <Collapsible defaultOpen className="space-y-4">
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-red-500/10">
                                <Shield className="h-5 w-5 text-red-500" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground">Essentials</h3>
                                <p className="text-sm text-muted-foreground">Basic safety and utility features</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4">
                            <div className={cn(
                              "grid gap-3",
                              viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
                            )}>
                              {AMENITIES_CATEGORIES.essentials.map((amenity) => (
                                <div
                                  key={amenity.id}
                                  className={cn(
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-red-500 bg-red-500/10"
                                      : "border-border hover:border-red-500/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-red-500 text-white"
                                        : "bg-muted"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Comfort Category */}
                        <Collapsible defaultOpen className="space-y-4">
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-500/10">
                                <Snowflake className="h-5 w-5 text-blue-500" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground">Comfort</h3>
                                <p className="text-sm text-muted-foreground">Climate control and living comforts</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4">
                            <div className={cn(
                              "grid gap-3",
                              viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
                            )}>
                              {AMENITIES_CATEGORIES.comfort.map((amenity) => (
                                <div
                                  key={amenity.id}
                                  className={cn(
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-blue-500 bg-blue-500/10"
                                      : "border-border hover:border-blue-500/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-blue-500 text-white"
                                        : "bg-muted"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Appliances Category */}
                        <Collapsible defaultOpen className="space-y-4">
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-green-500/10">
                                <Refrigerator className="h-5 w-5 text-green-500" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground">Appliances</h3>
                                <p className="text-sm text-muted-foreground">Kitchen and laundry appliances</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4">
                            <div className={cn(
                              "grid gap-3",
                              viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
                            )}>
                              {AMENITIES_CATEGORIES.appliances.map((amenity) => (
                                <div
                                  key={amenity.id}
                                  className={cn(
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-green-500 bg-green-500/10"
                                      : "border-border hover:border-green-500/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-green-500 text-white"
                                        : "bg-muted"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Lifestyle Category */}
                        <Collapsible defaultOpen className="space-y-4">
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-purple-500/10">
                                <Waves className="h-5 w-5 text-purple-500" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground">Lifestyle</h3>
                                <p className="text-sm text-muted-foreground">Recreational and lifestyle amenities</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4">
                            <div className={cn(
                              "grid gap-3",
                              viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
                            )}>
                              {AMENITIES_CATEGORIES.lifestyle.map((amenity) => (
                                <div
                                  key={amenity.id}
                                  className={cn(
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-purple-500 bg-purple-500/10"
                                      : "border-border hover:border-purple-500/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-purple-500 text-white"
                                        : "bg-muted"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Technology Category */}
                        <Collapsible defaultOpen className="space-y-4">
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-indigo-500/10">
                                <Cpu className="h-5 w-5 text-indigo-500" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground">Technology</h3>
                                <p className="text-sm text-muted-foreground">Smart home and tech features</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4">
                            <div className={cn(
                              "grid gap-3",
                              viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
                            )}>
                              {AMENITIES_CATEGORIES.technology.map((amenity) => (
                                <div
                                  key={amenity.id}
                                  className={cn(
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-indigo-500 bg-indigo-500/10"
                                      : "border-border hover:border-indigo-500/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-indigo-500 text-white"
                                        : "bg-muted"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Services Category */}
                        <Collapsible defaultOpen className="space-y-4">
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-amber-500/10">
                                <Bell className="h-5 w-5 text-amber-500" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground">Services</h3>
                                <p className="text-sm text-muted-foreground">Additional services included</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4">
                            <div className={cn(
                              "grid gap-3",
                              viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
                            )}>
                              {AMENITIES_CATEGORIES.services.map((amenity) => (
                                <div
                                  key={amenity.id}
                                  className={cn(
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-amber-500 bg-amber-500/10"
                                      : "border-border hover:border-amber-500/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-amber-500 text-white"
                                        : "bg-muted"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Community Category */}
                        <Collapsible defaultOpen className="space-y-4">
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-pink-500/10">
                                <Users className="h-5 w-5 text-pink-500" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground">Community</h3>
                                <p className="text-sm text-muted-foreground">Shared community facilities</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4">
                            <div className={cn(
                              "grid gap-3",
                              viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
                            )}>
                              {AMENITIES_CATEGORIES.community.map((amenity) => (
                                <div
                                  key={amenity.id}
                                  className={cn(
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-pink-500 bg-pink-500/10"
                                      : "border-border hover:border-pink-500/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-pink-500 text-white"
                                        : "bg-muted"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-pink-500 text-white flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Additional Amenities from API */}
                        <Collapsible className="space-y-4">
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-500/10">
                                <Plus className="h-5 w-5 text-gray-500" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground">Additional Amenities</h3>
                                <p className="text-sm text-muted-foreground">Custom amenities from database</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4">
                            {isLoadingAmenities ? (
                              <div className="flex items-center justify-center p-8">
                                <LoadingSpinner className="h-8 w-8" />
                                <span className="ml-3">Loading amenities...</span>
                              </div>
                            ) : amenitiesList.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {amenitiesList.map((amenity) => (
                                  <div key={amenity.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
                                    <button
                                      type="button"
                                      onClick={() => handleAmenityToggle(amenity.id)}
                                      className={cn(
                                        "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                                        formData.amenities?.includes(amenity.id)
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border hover:border-primary"
                                      )}
                                    >
                                      {formData.amenities?.includes(amenity.id) && (
                                        <CheckCircle className="h-3 w-3" />
                                      )}
                                    </button>
                                    <Label className="cursor-pointer flex-1">
                                      <div className="font-medium text-foreground">{amenity.name}</div>
                                      {amenity.name_amharic && (
                                        <div className="text-xs text-muted-foreground">{amenity.name_amharic}</div>
                                      )}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-8 text-muted-foreground">
                                No additional amenities available
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </ScrollArea>

                    {/* Documentation */}
                    <Separator className="my-8" />

                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-foreground">Property Documents</h3>
                      <p className="text-sm text-muted-foreground">
                        Select all relevant documents available for this property
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {DOCUMENTS.map((doc) => (
                          <div
                            key={doc.id}
                            className={cn(
                              "cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                              formData[doc.key as keyof PropertyFormData]
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => handleBooleanToggle(doc.key as keyof PropertyFormData)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                formData[doc.key as keyof PropertyFormData]
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              )}>
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{doc.name}</div>
                                <div className="text-xs text-muted-foreground">{doc.description}</div>
                              </div>
                            </div>
                            {formData[doc.key as keyof PropertyFormData] && (
                              <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                <CheckCircle className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('pricing')}
                    className="gap-2 border-primary/20 hover:border-primary/40 h-11"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    {t('buttons.previous')}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('media')}
                    className="gap-2 h-11 px-8"
                  >
                    {t('buttons.next')}: Media
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Media - Enhanced */}
              <TabsContent value="media" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-b from-card to-card/95">
                  <CardHeader className="p-6 border-b border-border/50">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-full bg-pink-500/10">
                        <ImageIcon className="h-6 w-6 text-pink-500" />
                      </div>
                      <div>
                        <span className="text-foreground">Photos & Videos</span>
                        <CardDescription className="mt-1">
                          Upload high-quality media to showcase your property
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {/* Images Upload */}
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">Property Photos *</h3>
                          <p className="text-sm text-muted-foreground">
                            Upload at least 5 high-quality photos for better visibility
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-foreground">
                            {formData.images?.filter(img => isFile(img)).length || 0}/20 photos
                          </span>
                          <Badge variant="outline" className="bg-primary/10 text-primary">
                            Required
                          </Badge>
                        </div>
                      </div>

                      {formErrors.images && (
                        <Alert variant="destructive" className="animate-in fade-in">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Images Required</AlertTitle>
                          <AlertDescription>{formErrors.images}</AlertDescription>
                        </Alert>
                      )}

                      {/* Image Upload Area */}
                      <div className="border-3 border-dashed border-border rounded-2xl p-8 text-center transition-all duration-300 hover:border-pink-500 hover:bg-pink-500/5 hover:shadow-lg group">
                        <div className="mb-6">
                          <div className="inline-flex p-4 rounded-full bg-pink-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Upload className="h-8 w-8 text-pink-500" />
                          </div>
                          <h4 className="text-lg font-bold text-foreground mb-2">Drag & drop images here</h4>
                          <p className="text-sm text-muted-foreground mb-6">
                            or click to browse files (PNG, JPG, WEBP up to 10MB each)
                          </p>

                          <input
                            id="images"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || [])
                              files.forEach(file => handleFileUpload('images', file))
                            }}
                          />

                          <Button
                            onClick={() => document.getElementById('images')?.click()}
                            className="mt-2 md:mt-4"
                          >
                            <ImageIcon className="h-5 w-5" />
                            Select Images
                          </Button>
                        </div>

                        {/* Upload Tips */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Camera className="h-3 w-3" />
                            <span>Use good lighting</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Maximize2 className="h-3 w-3" />
                            <span>Show all rooms</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-3 w-3" />
                            <span>Clean and tidy</span>
                          </div>
                        </div>
                      </div>

                      {/* Image Previews */}
                      {formData.images && formData.images.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-foreground">Uploaded Photos</h4>
                            <p className="text-sm text-muted-foreground">
                              Drag to reorder (first image is cover)
                            </p>
                          </div>
                          <div className={cn(
                            "gap-4",
                            viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "flex flex-col"
                          )}>
                            {formData.images.map((image, index) => {
                              const imageUrl = getImageUrl(image)
                              const isFileImage = isFile(image)

                              return (
                                <div
                                  key={index}
                                  className={cn(
                                    "relative group rounded-xl overflow-hidden border-2 border-transparent hover:border-pink-500 transition-all duration-300",
                                    viewMode === 'list' && "flex items-center gap-4 p-4 bg-muted/30"
                                  )}
                                  draggable={isFileImage}
                                  onDragStart={() => isFileImage && setDraggedIndex(index)}
                                  onDragOver={(e) => {
                                    e.preventDefault()
                                  }}
                                  onDrop={() => {
                                    if (draggedIndex !== null && draggedIndex !== index && isFileImage) {
                                      handleImageReorder(draggedIndex, index)
                                    }
                                    setDraggedIndex(null)
                                  }}
                                >
                                  <div className={cn(
                                    "overflow-hidden bg-muted/30",
                                    viewMode === 'grid' ? "aspect-square" : "h-20 w-20 rounded-lg flex-shrink-0"
                                  )}>
                                    {imageUrl ? (
                                      <img
                                        src={imageUrl}
                                        alt={`Property image ${index + 1}`}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                      />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center">
                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <div className={cn(
                                    "absolute top-2 left-2 flex gap-1",
                                    viewMode === 'list' && "top-4 left-24"
                                  )}>
                                    {index === 0 && (
                                      <Badge className="bg-pink-500 text-xs border-0">
                                        Cover
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="bg-black/70 text-white border-0 text-xs">
                                      {index + 1}
                                    </Badge>
                                  </div>
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="icon"
                                      variant="destructive"
                                      className="h-7 w-7 bg-destructive/90 hover:bg-destructive"
                                      onClick={() => handleRemoveFile('images', index)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  {viewMode === 'list' && (
                                    <div className="flex-1 p-2">
                                      <p className="font-medium text-foreground truncate">
                                        {isFile(image) ? image.name : `Image ${index + 1}`}
                                      </p>
                                      {isFile(image) && (
                                        <p className="text-xs text-muted-foreground">
                                          {(image.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Video Upload */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-foreground">Video Tour</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload a video tour of your property (optional, up to 100MB)
                      </p>

                      {formData.property_video ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border-2 border-green-500/20 rounded-xl bg-green-500/5">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-green-500/10">
                                <Video className="h-5 w-5 text-green-500" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {formData.property_video.name || 'Video file'}
                                </p>
                                {formData.property_video.size && (
                                  <p className="text-sm text-muted-foreground">
                                    {(formData.property_video.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const url = getImageUrl(formData.property_video)
                                  if (url) window.open(url, '_blank')
                                }}
                                className="gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                Preview
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile('property_video')}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border-3 border-dashed border-border rounded-2xl p-8 text-center transition-all duration-300 hover:border-green-500 hover:bg-green-500/5 hover:shadow-lg group">
                          <div className="mb-6">
                            <div className="inline-flex p-4 rounded-full bg-green-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                              <Video className="h-8 w-8 text-green-500" />
                            </div>
                            <h4 className="text-lg font-bold text-foreground mb-2">Upload property video tour</h4>
                            <p className="text-sm text-muted-foreground mb-6">
                              MP4, MOV up to 100MB
                            </p>

                            <input
                              id="property_video"
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload('property_video', file)
                              }}
                            />

                            <Button
                              onClick={() => document.getElementById('property_video')?.click()}
                              variant="outline"
                              className="gap-2 h-12 px-6 border-green-500/20 hover:border-green-500/40"
                            >
                              <Video className="h-5 w-5" />
                              Select Video
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Virtual Tour */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-foreground">Virtual Tour Link</h3>
                      <p className="text-sm text-muted-foreground">
                        Add a link to 3D virtual tour (Matterport, Kuula, etc.)
                      </p>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          type="url"
                          value={formData.virtual_tour_url || ''}
                          onChange={(e) => handleInputChange('virtual_tour_url', e.target.value)}
                          placeholder="https://my.matterport.com/show/..."
                          className="h-14 text-base border-2 pl-12 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Document Upload */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-foreground">Additional Documents</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload floor plans, contracts, or other documents (optional)
                      </p>

                      {formData.documents && formData.documents.length > 0 && (
                        <div className="space-y-3">
                          {formData.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                  <FileText className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{doc.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {(doc.size / 1024).toFixed(2)} KB • {doc.type || 'Document'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile('documents', index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-3 border-dashed border-border rounded-2xl p-8 text-center transition-all duration-300 hover:border-blue-500 hover:bg-blue-500/5 hover:shadow-lg group">
                        <div className="mb-6">
                          <div className="inline-flex p-4 rounded-full bg-blue-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <FileText className="h-8 w-8 text-blue-500" />
                          </div>
                          <h4 className="text-lg font-bold text-foreground mb-2">Upload additional documents</h4>
                          <p className="text-sm text-muted-foreground mb-6">
                            PDF, DOC, XLS up to 20MB each
                          </p>

                          <input
                            id="documents"
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || [])
                              files.forEach(file => handleFileUpload('documents', file))
                            }}
                          />

                          <Button
                            onClick={() => document.getElementById('documents')?.click()}
                            variant="outline"
                            className="gap-2 h-12 px-6 border-blue-500/20 hover:border-blue-500/40"
                          >
                            <FileText className="h-5 w-5" />
                            Select Documents
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('features')}
                    className="gap-2 border-primary/20 hover:border-primary/40 h-11"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    {t('buttons.previous')}
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      className="gap-2 border-primary/20 hover:border-primary/40 h-11"
                    >
                      <Save className="h-4 w-4" />
                      {t('buttons.saveDraft')}
                    </Button>
                    <Button
                      onClick={() => setActiveTab('promotion')}
                      className="gap-2 h-11 px-8"
                    >
                      {t('buttons.next')}: Promotion
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Promotion - Enhanced */}
              <TabsContent value="promotion" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-b from-card to-card/95">
                  <CardHeader className="p-6 border-b border-border/50">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-full bg-orange-500/10">
                        <TrendingUp className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <span className="text-foreground">Boost Your Listing Visibility</span>
                        <CardDescription className="mt-1">
                          Choose a promotion package to get more views and faster approval
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {isLoadingPromotionTiers ? (
                      <div className="flex items-center justify-center p-12">
                        <div className="text-center space-y-4">
                          <LoadingSpinner className="h-12 w-12 mx-auto" />
                          <p className="text-muted-foreground">Loading promotion options...</p>
                        </div>
                      </div>
                    ) : promotionTiers && promotionTiers.length > 0 ? (
                      <>
                        {/* Promotion tier selection */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-bold text-foreground mb-2">Select Promotion Tier</h3>
                            <p className="text-sm text-muted-foreground">
                              Choose the promotion level that best fits your needs
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {promotionTiers.map((tier) => (
                              <div
                                key={tier.id}
                                className={cn(
                                  "border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl h-full",
                                  selectedPromotionTier === tier.tier_type
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                    : "border-border hover:border-primary/50"
                                )}
                                onClick={() => setSelectedPromotionTier(tier.tier_type as any)}
                              >
                                <div className="flex items-center gap-3 mb-4">
                                  <div className={cn(
                                    "p-3 rounded-xl",
                                    selectedPromotionTier === tier.tier_type
                                      ? "bg-primary/10"
                                      : "bg-muted"
                                  )}>
                                    {getTierIcon(tier.tier_type)}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-xl text-foreground">{tier.name}</h4>
                                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                                  </div>
                                </div>

                                <p className="text-sm text-muted-foreground mb-6">{tier.description}</p>

                                {tier.tier_type !== 'basic' ? (
                                  <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                      <span className="text-foreground">7 days</span>
                                      <span className="font-bold text-foreground">{tier.price_7?.toLocaleString()} ETB</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                      <span className="text-foreground">30 days</span>
                                      <span className="font-bold text-foreground">{tier.price_30?.toLocaleString()} ETB</span>
                                    </div>
                                    {tier.price_60 && (
                                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                        <span className="text-foreground">60 days</span>
                                        <span className="font-bold text-foreground">{tier.price_60?.toLocaleString()} ETB</span>
                                      </div>
                                    )}
                                    {tier.price_90 && (
                                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                        <span className="text-foreground">90 days</span>
                                        <span className="font-bold text-foreground">{tier.price_90?.toLocaleString()} ETB</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-3xl font-bold text-green-600 mb-6">FREE</div>
                                )}

                                <div className="space-y-2 mb-6">
                                  {tier.features && tier.features.slice(0, 4).map((feature: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-sm text-foreground">{feature}</span>
                                    </div>
                                  ))}
                                </div>

                                {selectedPromotionTier === tier.tier_type && (
                                  <div className="mt-4 flex items-center justify-center">
                                    <Badge className={cn("gap-2 px-4 py-2 text-sm", getTierColor(tier.tier_type))}>
                                      <CheckCircle className="h-4 w-4" />
                                      Currently Selected
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Duration selection for paid tiers */}
                        {selectedPromotionTier !== 'basic' && (
                          <div className="p-6 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 rounded-2xl border border-orange-500/20">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                              <div>
                                <h4 className="font-bold text-lg text-foreground">Select Duration</h4>
                                <p className="text-sm text-muted-foreground">
                                  Choose how long you want to promote your listing
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20">
                                Total: {promotionPrice.toLocaleString()} ETB
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {DURATION_OPTIONS.map((duration) => (
                                <Button
                                  key={duration.value}
                                  variant={selectedDuration === duration.value ? "default" : "outline"}
                                  onClick={() => setSelectedDuration(duration.value)}
                                  className={cn(
                                    "h-16 flex-col gap-1",
                                    selectedDuration === duration.value && "bg-gradient-to-r from-orange-500 to-yellow-500"
                                  )}
                                >
                                  <div className="font-bold text-foreground text-sm md:text-base">{duration.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {calculatePrice(selectedPromotionTier, duration.value).toLocaleString()} ETB
                                  </div>
                                </Button>
                              ))}
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                              <Info className="h-4 w-4" />
                              <span>Longer durations provide better value per day</span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <Alert variant="destructive" className="animate-in fade-in">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Loading Promotion Options</AlertTitle>
                        <AlertDescription>
                          Unable to load promotion options. Please try again later or contact support.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Promotion Benefits */}
                    <Alert className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20 dark:border-blue-500/20 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <Rocket className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <AlertTitle className="text-blue-800 dark:text-blue-300 text-lg font-bold">
                            Promotion Benefits
                          </AlertTitle>
                          <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm space-y-3 mt-2">
                            {selectedPromotionTier === 'basic' ? (
                              <>
                                <p className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">Free listings require admin approval (usually within 24 hours)</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  <span>Standard visibility in search results</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span>Perfect for testing the platform</span>
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-yellow-500" />
                                  <span className="font-medium">Promoted listings are automatically approved immediately</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                  <span>Get 3-5x more views than regular listings</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <Crown className="h-4 w-4 text-purple-500" />
                                  <span>Priority placement in search results</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-red-500" />
                                  <span>Featured badge attracts more clicks</span>
                                </p>
                              </>
                            )}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('media')}
                    className="gap-2 border-primary/20 hover:border-primary/40 h-11"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    {t('buttons.previous')}
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      className="gap-2 border-primary/20 hover:border-primary/40 h-11"
                    >
                      <Save className="h-4 w-4" />
                      {t('buttons.saveDraft')}
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={cn(
                        "gap-2 h-11 px-8 min-w-[160px] md:min-w-[200px] transition-all duration-300 hover:scale-[1.02]",
                        selectedPromotionTier !== 'basic'
                          ? "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                          : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner className="h-4 w-4" />
                          Processing...
                        </>
                      ) : selectedPromotionTier === 'basic' ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          List Property (FREE)
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          <div className="flex flex-col items-center">
                            <span>Create & Pay</span>
                            <span className="text-xs font-bold">{promotionPrice.toLocaleString()} ETB</span>
                          </div>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Preview & Tips */}
          <div className="space-y-6 hidden lg:block">
            {/* Preview Card */}
            <Card className="border-border shadow-xl rounded-2xl overflow-hidden sticky top-24 bg-gradient-to-b from-card to-card/95">
              <CardHeader className="p-6 border-b border-border/50">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Listing Preview
                </CardTitle>
                <CardDescription>
                  This is how your property will appear to buyers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="aspect-video rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden group relative">
                  {formData.images && formData.images.length > 0 ? (
                    <>
                      <img
                        src={getImageUrl(formData.images[0]) || ''}
                        alt="Property preview"
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No images yet</p>
                    </div>
                  )}
                  {formData.images && formData.images.length > 0 && (
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      {formData.images.length} photos
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-xl text-foreground truncate">
                    {formData.title || 'Your property title'}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {formData.specific_location || 'Location will appear here'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20">
                    <div className="text-2xl font-bold text-foreground">{formData.bedrooms || 0}</div>
                    <div className="text-xs text-muted-foreground">Bedrooms</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20">
                    <div className="text-2xl font-bold text-foreground">{formData.bathrooms || 0}</div>
                    <div className="text-xs text-muted-foreground">Bathrooms</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
                    <div className="text-2xl font-bold text-foreground">{formData.total_area || 0}</div>
                    <div className="text-xs text-muted-foreground">m²</div>
                  </div>
                </div>

                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {listingType === 'for_sale' ? (
                    <>
                      {formData.price_etb
                        ? `ETB ${formData.price_etb.toLocaleString()}`
                        : 'Add price'}
                    </>
                  ) : (
                    <>
                      {formData.monthly_rent
                        ? `ETB ${formData.monthly_rent.toLocaleString()}/month`
                        : 'Add rent'}
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize bg-gradient-to-r from-gray-500/10 to-gray-500/5">
                    {formData.property_type?.replace('_', ' ') || 'house'}
                  </Badge>
                  <Badge variant="outline" className="bg-gradient-to-r from-blue-500/10 to-blue-500/5">
                    {listingType === 'for_sale' ? 'For Sale' : 'For Rent'}
                  </Badge>
                  {selectedPromotionTier !== 'basic' && (
                    <Badge className={cn("gap-1", getTierColor(selectedPromotionTier))}>
                      {getTierIcon(selectedPromotionTier)}
                      {selectedPromotionTier === 'standard' ? 'Promoted' : 'Premium'}
                    </Badge>
                  )}
                  {formData.price_negotiable && (
                    <Badge variant="outline" className="bg-gradient-to-r from-green-500/10 to-green-500/5">
                      Negotiable
                    </Badge>
                  )}
                </div>

                {/* Status Alert */}
                {selectedPromotionTier !== 'basic' ? (
                  <Alert className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-green-500/20 rounded-xl">
                    <Rocket className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-800 dark:text-green-300">Auto-Approval Active</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
                      Your listing will be automatically approved and go live immediately after payment.
                    </AlertDescription>
                  </Alert>
                ) : (user?.is_staff || user?.is_superuser) ? (
                  <Alert className="bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border-blue-500/20 rounded-xl">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                    <AlertTitle className="text-blue-800 dark:text-blue-300">Admin Listing</AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
                      Your listing will be immediately published as an admin user.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border-amber-500/20 rounded-xl">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <AlertTitle className="text-amber-800 dark:text-amber-300">Pending Approval</AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                      Your listing requires admin approval before going live (usually within 24 hours).
                    </AlertDescription>
                  </Alert>
                )}

                {/* Quick Stats */}
                <div className="pt-4 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Progress</div>
                      <div className="font-semibold text-foreground">{totalProgress}% Complete</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Sections</div>
                      <div className="font-semibold text-foreground">
                        {Object.values(progress).filter(p => p === 100).length}/7
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
              <CardHeader className="p-6">
                <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Listing Tips & Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  {[
                    {
                      icon: <Camera className="h-4 w-4" />,
                      title: 'High-Quality Photos',
                      description: 'Use natural daylight and clean spaces'
                    },
                    {
                      icon: <Type className="h-4 w-4" />,
                      title: 'Detailed Description',
                      description: 'Include all features and unique selling points'
                    },
                    {
                      icon: <Calculator className="h-4 w-4" />,
                      title: 'Competitive Pricing',
                      description: 'Research similar properties in your area'
                    },
                    {
                      icon: <CheckCircle className="h-4 w-4" />,
                      title: 'Accurate Information',
                      description: 'Verify all details before submission'
                    },
                    {
                      icon: <MessageCircle className="h-4 w-4" />,
                      title: 'Quick Responses',
                      description: 'Be responsive to buyer inquiries'
                    },
                  ].map((tip, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/50">
                      <div className="p-2 rounded-full bg-blue-500/10">
                        {tip.icon}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{tip.title}</div>
                        <div className="text-sm text-muted-foreground">{tip.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button variant="outline" className="w-full gap-2 border-blue-500/20 hover:border-blue-500/40">
                  <Info className="h-4 w-4" />
                  View Complete Guide
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}