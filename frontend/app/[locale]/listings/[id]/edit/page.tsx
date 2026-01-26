'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from "@/components/common/Header/Header";
import { useQuery, useMutation } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
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
  Warehouse as WarehouseIcon,
  Ship,
  Plane,
  Train,
  Bus,
  Bike,
  Car as CarTaxiFront,
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
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Clock4,
  Clock8,
  Clock12,
  Timer,
  TimerReset,
  Hourglass,
  Watch,
  AlarmClock,
  BellRing,
  Megaphone,
  RadioTower,
  TowerControl,
  Satellite as SatelliteIcon,
  Map,
  MapPinned,
  Navigation2,
  Compass as CompassIcon,
  Route,
  Signpost,
  Flag,
  FlagTriangleLeft,
  FlagTriangleRight,
  Trophy,
  Medal,
  Crown as CrownIcon,
  Award as AwardIcon,
  Gem,
  Diamond,
  Sparkles,
  Star as StarIcon,
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
  Save as SaveIcon2,
  Scissors as ScissorsIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Server as ServerIcon3,
  Settings,
  Share as ShareIcon,
  Share2 as Share2Icon,
  Shield as ShieldIcon,
  ShieldCheck as ShieldCheckIcon,
  ShieldOff,
  ShoppingBag as ShoppingBagIcon2,
  ShoppingCart as ShoppingCartIcon2,
  Shuffle,
  Sidebar as SidebarIcon,
  SkipBack,
  SkipForward,
  Slack,
  Slash,
  Sliders as SlidersIcon,
  Smartphone as SmartphoneIcon2,
  Smile,
  Speaker as SpeakerIcon2,
  Square as SquareIcon,
  Star as StarIcon2,
  StopCircle,
  Sun as SunIcon2,
  Sunrise as SunriseIcon,
  Sunset as SunsetIcon,
  Tablet as TabletIcon2,
  Tag as TagIcon,
  Target as TargetIcon2,
  Terminal as TerminalIcon2,
  Thermometer as ThermometerIcon2,
  ThumbsDown,
  ThumbsUp as ThumbsUpIcon,
  Ticket,
  Timer as TimerIcon,
  Trash2 as Trash2Icon,
  Trello,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  Triangle,
  Truck as TruckIcon,
  Tv as TvIcon3,
  Twitch,
  Twitter,
  Type as TypeIcon2,
  Umbrella as UmbrellaIcon,
  Unlock,
  Upload as UploadIcon2,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  UserX,
  Users as UsersIcon,
  Video as VideoIcon3,
  VideoOff,
  Voicemail as VoicemailIcon,
  Volume as VolumeIcon,
  Volume1,
  Volume2 as Volume2Icon,
  VolumeX,
  Watch as WatchIcon2,
  Wifi as WifiIcon2,
  Wind as WindIcon2,
  X as XIcon2,
  XCircle as XCircleIcon,
  XOctagon,
  XSquare,
  Youtube,
  Zap as ZapIcon2,
  ZoomIn,
  ZoomOut,
  Languages,
  Palette as PaletteIcon2,
  Smartphone as SmartphoneIcon3,
  Laptop,
  Monitor as MonitorIcon3,
  SunMoon,
  Contrast,
  Settings2,
  ToggleLeft as ToggleLeftIcon,
  ToggleRight as ToggleRightIcon,
  CheckCheck,
  ChevronsUpDown,
  ChevronsLeftRight,
  ChevronsUp,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Receipt,
  Search as SearchIcon2,
  Send as SendIcon2,
  Server as ServerIcon6,
  Settings as SettingsIcon,
  Share as ShareIcon2,
  Share2 as Share2Icon2,
  Shield as ShieldIcon3,
  ShieldCheck as ShieldCheckIcon3,
  ShieldOff as ShieldOffIcon,
  ShoppingBag as ShoppingBagIcon3,
  ShoppingCart as ShoppingCartIcon3,
  Shuffle as ShuffleIcon,
  Sidebar as SidebarIcon2,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  Slack as SlackIcon,
  Slash as SlashIcon,
  Sliders as SlidersIcon2,
  Smartphone as SmartphoneIcon5,
  Smile as SmileIcon,
  Speaker as SpeakerIcon3,
  Square as SquareIcon2,
  Star as StarIcon3,
  StopCircle as StopCircleIcon,
  Sun as SunIcon4,
  Sunrise as SunriseIcon2,
  Sunset as SunsetIcon2,
  Tablet as TabletIcon4,
  Tag as TagIcon2,
  Target as TargetIcon3,
  Terminal as TerminalIcon5,
  Thermometer as ThermometerIcon5,
  ThumbsDown as ThumbsDownIcon,
  ThumbsUp as ThumbsUpIcon2,
  Ticket as TicketIcon,
  Timer as TimerIcon2,
  Trash2 as Trash2Icon2,
  Trello as TrelloIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon2,
  Triangle as TriangleIcon,
  Truck as TruckIcon2,
  Tv as TvIcon5,
  Twitch as TwitchIcon,
  Twitter as TwitterIcon,
  Type as TypeIcon3,
  Umbrella as UmbrellaIcon3,
  Unlock as UnlockIcon,
  Upload as UploadIcon3,
  User as UserIcon,
  UserCheck as UserCheckIcon,
  UserMinus as UserMinusIcon,
  UserPlus as UserPlusIcon,
  UserX as UserXIcon,
  Users as UsersIcon2,
  Video as VideoIcon4,
  VideoOff as VideoOffIcon,
  Voicemail as VoicemailIcon2,
  Volume as VolumeIcon2,
  Volume1 as Volume1Icon,
  Volume2 as Volume2Icon2,
  VolumeX as VolumeXIcon,
  Watch as WatchIcon4,
  Wifi as WifiIcon5,
  Wind as WindIcon4,
  X as XIcon3,
  XCircle as XCircleIcon2,
  XOctagon as XOctagonIcon,
  XSquare as XSquareIcon2,
  Youtube as YoutubeIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
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

// Enhanced amenities and features matching create page
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
    // Check if value has File-like properties
    if (
      value &&
      typeof value === 'object' &&
      'name' in value &&
      'size' in value &&
      'type' in value &&
      typeof value.name === 'string' &&
      typeof value.size === 'number' &&
      typeof value.type === 'string'
    ) {
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

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('createListing')
  const tc = useTranslations('common')
  const propertyId = parseInt(params.id as string)
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
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

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
  })

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

  // Fetch property data
  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => listingsApi.getPropertyById(propertyId),
    enabled: !!propertyId,
  })

  // Update form data when property is loaded
  useEffect(() => {
    if (property) {
      setExistingImages(property.images || [])
      setListingType(property.listing_type === 'for_rent' ? 'for_rent' : 'for_sale')

      setFormData({
        title: property.title,
        title_amharic: property.title_amharic || '',
        description: property.description,
        description_amharic: property.description_amharic || '',
        property_type: property.property_type,
        listing_type: property.listing_type,
        property_status: property.property_status,
        city: property.city?.id,
        sub_city: property.sub_city?.id,
        specific_location: property.specific_location,
        address_line_1: property.address_line_1 || '',
        address_line_2: property.address_line_2 || '',
        latitude: property.latitude,
        longitude: property.longitude,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        total_area: property.total_area,
        plot_size: property.plot_size,
        built_year: property.built_year,
        floors: property.floors,
        furnishing_type: property.furnishing_type,
        price_etb: property.price_etb,
        price_usd: property.price_usd,
        price_negotiable: property.price_negotiable,
        monthly_rent: property.monthly_rent,
        security_deposit: property.security_deposit,
        maintenance_fee: property.maintenance_fee,
        property_tax: property.property_tax,
        has_parking: property.has_parking,
        has_garden: property.has_garden,
        has_security: property.has_security,
        has_furniture: property.has_furniture || false,
        has_air_conditioning: property.has_air_conditioning || false,
        has_heating: property.has_heating || false,
        has_internet: property.has_internet || false,
        has_generator: property.has_generator || false,
        has_elevator: property.has_elevator || false,
        has_swimming_pool: property.has_swimming_pool || false,
        has_gym: property.has_gym || false,
        has_conference_room: property.has_conference_room || false,
        is_pet_friendly: property.is_pet_friendly || false,
        is_wheelchair_accessible: property.is_wheelchair_accessible || false,
        has_backup_water: property.has_backup_water || false,
        virtual_tour_url: property.virtual_tour_url || '',
        video_url: property.video_url || '',
        has_title_deed: property.has_title_deed || false,
        has_construction_permit: property.has_construction_permit || false,
        has_occupancy_certificate: property.has_occupancy_certificate || false,
        is_premium: property.is_premium || false,
        amenities: property.amenities?.map((a: any) => a.id) || [],
        images: [],
        property_video: undefined,
        documents: [],
      })
    }
  }, [property])

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

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: FormData) => listingsApi.updateProperty(propertyId, data),
    onMutate: () => {
      setIsSubmitting(true)
      toast.loading('Updating your listing...')
    },
    onSuccess: (data) => {
      toast.dismiss()
      toast.success('Property updated successfully!')
      router.push(`/listings/${data.id}?updated=true`)
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
        'Failed to update property. Please try again.'
      toast.error(errorMessage)
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => listingsApi.deleteProperty(propertyId),
    onSuccess: () => {
      toast.success('Property deleted successfully!')
      router.push('/listings')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete property')
    },
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }

    // Check if user owns the property or is admin
    if (property && user) {
      const isOwner = user.id === property.owner.id
      const isAdmin = user.user_type === 'admin'

      if (!isOwner && !isAdmin) {
        toast.error('You do not have permission to edit this property')
        router.push('/listings')
      }
    }
  }, [isAuthenticated, property, user, router])

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
      setHasUnsavedChanges(true)
    } else if (field === 'images') {
      const totalImages = (formData.images?.length || 0) + existingImages.length
      if (totalImages >= 20) {
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
      setHasUnsavedChanges(true)

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
      setHasUnsavedChanges(true)
    }
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

  const handleRemoveExistingImage = (imageId: number) => {
    setDeletedImageIds(prev => [...prev, imageId])
    setExistingImages(prev => prev.filter(img => img.id !== imageId))
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
    if (validImages.length + existingImages.length === 0) errors.images = 'At least one image is required'

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
      formDataObj.append('property_status', formData.property_status || 'available')

      formDataObj.append('city', formData.city!.toString())
      formDataObj.append('sub_city', formData.sub_city!.toString())
      formDataObj.append('specific_location', formData.specific_location!)

      if (formData.address_line_1) {
        formDataObj.append('address_line_1', formData.address_line_1)
      }
      if (formData.address_line_2) {
        formDataObj.append('address_line_2', formData.address_line_2)
      }

      if (formData.latitude !== undefined && formData.latitude !== null) {
        formDataObj.append('latitude', formData.latitude.toString())
      }
      if (formData.longitude !== undefined && formData.longitude !== null) {
        formDataObj.append('longitude', formData.longitude.toString())
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

      formDataObj.append('is_premium', formData.is_premium ? 'true' : 'false');

      // Deleted images
      deletedImageIds.forEach(imageId => {
        formDataObj.append('deleted_images', imageId.toString())
      })

      logFormData(formDataObj)

      updateMutation.mutate(formDataObj)

    } catch (error) {
      console.error('Error preparing form data:', error)
      toast.error('Error preparing form data. Please try again.')
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

      localStorage.setItem(`property_draft_${propertyId}`, JSON.stringify(draftData))
      setHasUnsavedChanges(false)
      toast.success('Draft saved successfully!')
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft. File may be too large.')
    }
  }

  const handleLoadDraft = () => {
    try {
      const draft = localStorage.getItem(`property_draft_${propertyId}`)
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

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      deleteMutation.mutate()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, tabValue: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setActiveTab(tabValue)
    }
  }

  // Calculate progress
  const progress = {
    basic: formData.title && formData.description && formData.property_type ? 100 : 0,
    location: formData.city && formData.sub_city && formData.specific_location ? 100 : 0,
    details: formData.bedrooms && formData.total_area ? 100 : 0,
    pricing: (listingType === 'for_sale' ? formData.price_etb : formData.monthly_rent) ? 100 : 0,
    features: true,
    media: (existingImages.length + (formData.images?.filter(img => isFile(img)).length || 0)) > 0 ? 100 : 0,
  }

  const totalProgress = Math.round(
    Object.values(progress).filter(p => typeof p === 'number').reduce((a, b) => a + b, 0) / 6
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-900">
        <LoadingSpinner fullScreen />
      </div>
    )
  }

  if (isLoadingProperty) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
        <div className="container max-w-7xl py-8">
          <LoadingSpinner fullScreen={false} />
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
        <div className="container max-w-7xl py-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold dark:text-white">{t('errors.propertyNotFound')}</h1>
            <p className="mb-6 text-muted-foreground dark:text-gray-400">
              {t('errors.propertyNotFoundDescription')}
            </p>
            <Button onClick={() => router.push('/listings')}>
              {t('buttons.browseProperties')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Check if user can edit
  const isOwner = user?.id === property.owner.id
  const isAdmin = user?.user_type === 'admin'
  const canEdit = isOwner || isAdmin

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
        <div className="container max-w-7xl py-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold dark:text-white">{t('errors.accessDenied')}</h1>
            <p className="mb-6 text-muted-foreground dark:text-gray-400">
              {t('errors.noEditPermission')}
            </p>
            <Button onClick={() => router.push('/listings')}>
              {t('buttons.browseProperties')}
            </Button>
          </div>
        </div>
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
              onClick={() => router.push(`/listings/${propertyId}`)}
              className="h-10 w-10 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {listingType === 'for_sale' ? t('titles.editProperty') : t('titles.editRentalProperty')}
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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
                {listingType === 'for_sale' ? t('titles.editYourProperty') : t('titles.editYourRentalProperty')}
              </h1>
              <p className="text-muted-foreground dark:text-gray-400 mt-2 text-sm md:text-base flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {locale.toUpperCase()}
                </span>
                <span>•</span>
                <span>{t('editing')}</span>
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
                <span className="text-sm font-medium text-foreground dark:text-gray-300">
                  {t('progress.completion', { percentage: totalProgress })}
                </span>
                <Badge variant="secondary" className="text-xs dark:bg-gray-800 dark:text-gray-300">
                  {Object.values(progress).filter(p => p === 100).length}/6
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground dark:text-gray-500 hidden md:inline">
                {t('progress.sections', { completed: Object.values(progress).filter(p => p === 100).length, total: 6 })}
              </span>
            </div>
            <Progress value={totalProgress} className="h-3 bg-muted/50 dark:bg-gray-800" />
            <div className="hidden md:grid grid-cols-6 gap-2 text-xs text-muted-foreground dark:text-gray-500">
              {['basic', 'location', 'details', 'pricing', 'features', 'media'].map((key, index) => {
                const sectionKey = Object.keys(progress)[index] as keyof typeof progress;
                const sectionProgress = progress[sectionKey];
                const label = t(`progress.${key}`);
                const progressValue = typeof sectionProgress === 'boolean'
                  ? (sectionProgress ? 100 : 0)
                  : sectionProgress;

                return (
                  <div
                    key={key}
                    className={`text-center font-medium transition-colors ${progressValue >= 100
                      ? 'text-primary font-semibold dark:text-blue-400'
                      : progressValue > 0
                        ? 'text-primary/70 dark:text-blue-400/70'
                        : 'text-muted-foreground dark:text-gray-500'
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
                    <SheetTitle className="text-lg font-bold dark:text-white">Navigate Sections</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100%-80px)]">
                    <div className="space-y-1">
                      {['basic', 'location', 'details', 'pricing', 'features', 'media'].map((tab) => (
                        <Button
                          key={tab}
                          variant={activeTab === tab ? "default" : "ghost"}
                          className="w-full justify-start capitalize h-12 rounded-lg dark:text-gray-300"
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
                            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-2 hidden md:block dark:bg-gray-900/95 dark:border-gray-800">
                <TabsList className="grid w-full grid-cols-6 bg-muted/50 p-1 rounded-xl border dark:bg-gray-800 dark:border-gray-700">
                  {['basic', 'location', 'details', 'pricing', 'features', 'media'].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary text-xs md:text-sm rounded-lg transition-all duration-300 dark:data-[state=active]:bg-gray-800 dark:data-[state=active]:text-blue-400"
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
                      <span className="hidden sm:inline">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                      <span className="sm:hidden">{tab.charAt(0).toUpperCase()}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-b from-card to-card/95 dark:from-gray-800 dark:to-gray-900">
                  <CardHeader className="p-6 border-b border-border/50 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                      <div className="p-2 rounded-full bg-primary/10 dark:bg-blue-500/10">
                        <Home className="h-6 w-6 text-primary dark:text-blue-400" />
                      </div>
                      <div>
                        <span className="text-foreground dark:text-white">{t('sections.basic.title')}</span>
                        <CardDescription className="mt-1 dark:text-gray-400">
                          {t('sections.basic.subtitle')}
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {/* Listing Type */}
                    <div className="space-y-4">
                      <Label className="text-lg font-semibold text-foreground dark:text-white">
                        {t('sections.basic.listingType')} *
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={listingType === 'for_sale' ? 'default' : 'outline'}
                          className="h-16 text-base border-2 transition-all duration-300 hover:scale-[1.02] dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400"
                          onClick={() => {
                            setListingType('for_sale')
                            handleInputChange('listing_type', 'for_sale')
                          }}
                        >
                          <DollarSign className="mr-3 h-5 w-5" />
                          <div className="text-left">
                            <div className="font-semibold">{t('sections.basic.sell')}</div>
                            <div className="text-xs opacity-80">{t('sections.basic.sellDescription')}</div>
                          </div>
                        </Button>
                        <Button
                          type="button"
                          variant={listingType === 'for_rent' ? 'default' : 'outline'}
                          className="h-16 text-base border-2 transition-all duration-300 hover:scale-[1.02] dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400"
                          onClick={() => {
                            setListingType('for_rent')
                            handleInputChange('listing_type', 'for_rent')
                          }}
                        >
                          <Home className="mr-3 h-5 w-5" />
                          <div className="text-left">
                            <div className="font-semibold">{t('sections.basic.rent')}</div>
                            <div className="text-xs opacity-80">{t('sections.basic.rentDescription')}</div>
                          </div>
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="title" className="font-semibold text-foreground dark:text-white">
                          {t('sections.basic.propertyTitle')} *
                        </Label>
                        <Input
                          id="title"
                          value={formData.title || ""}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder={t('sections.basic.titlePlaceholder')}
                          className="h-14 text-base border-2 focus:border-primary dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                        />
                        {formErrors.title && (
                          <p className="text-sm text-destructive animate-in fade-in dark:text-red-400">
                            {formErrors.title}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground dark:text-gray-500 flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          {t('sections.basic.titleTip')}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="title_amharic" className="font-semibold text-foreground dark:text-white">
                          {t('sections.basic.propertyTitle')} (አማርኛ)
                        </Label>
                        <Input
                          id="title_amharic"
                          value={formData.title_amharic || ''}
                          onChange={(e) => handleInputChange('title_amharic', e.target.value)}
                          placeholder="አዲስ ዘመናዊ 3 አልጋ አፓርትመንት ቦሌ"
                          className="h-14 text-base border-2 focus:border-primary dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="property_type" className="font-semibold text-foreground dark:text-white">
                        {t('sections.basic.propertyType')} *
                      </Label>
                      <div className="relative">
                        <Select
                          value={formData.property_type}
                          onValueChange={(value) => handleInputChange('property_type', value)}
                          placeholder={t('sections.basic.propertyTypePlaceholder')}
                        >
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            {PROPERTY_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value} className="h-12 dark:text-gray-300 dark:hover:bg-gray-700">
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="property_status" className="font-semibold text-foreground dark:text-white">
                        {t('sections.basic.propertyStatus')}
                      </Label>
                      <Select
                        value={formData.property_status}
                        onValueChange={(value) => handleInputChange('property_status', value)}
                        placeholder={t('sections.basic.statusPlaceholder')}
                      >
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value="available" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('status.available')}</SelectItem>
                          <SelectItem value="pending" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('status.pending')}</SelectItem>
                          <SelectItem value="sold" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('status.sold')}</SelectItem>
                          <SelectItem value="rented" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('status.rented')}</SelectItem>
                          <SelectItem value="off_market" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('status.offMarket')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description" className="font-semibold text-foreground dark:text-white">
                        {t('sections.basic.description')} *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your property in detail. Include features, condition, and unique selling points..."
                        className="min-h-48 text-base border-2 focus:border-primary resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                        rows={6}
                      />
                      {formErrors.description && (
                        <p className="text-sm text-destructive animate-in fade-in dark:text-red-400">
                          {formErrors.description}
                        </p>
                      )}
                      <div className="flex justify-between text-sm text-muted-foreground dark:text-gray-500">
                        <span className="flex items-center gap-2">
                          <Type className="h-4 w-4" />
                          {t('sections.basic.beDescriptive')}
                        </span>
                        <span>{formData.description?.length || 0}/2000 {t('characters')}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description_amharic" className="font-semibold text-foreground dark:text-white">
                        {t('sections.basic.description')} (አማርኛ)
                      </Label>
                      <Textarea
                        id="description_amharic"
                        value={formData.description_amharic || ''}
                        onChange={(e) => handleInputChange('description_amharic', e.target.value)}
                        placeholder="የንብረትዎን ዝርዝር መረጃ ይጻፉ። ባህሪያት፣ ሁኔታና ልዩ ማሻሻያዎችን ያካትቱ..."
                        className="min-h-48 text-base border-2 focus:border-primary resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                        rows={6}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/listings/${propertyId}`)}
                    className="gap-2 border-primary/20 hover:border-primary/40 h-11 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400"
                  >
                    {tc('cancel')}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('location')}
                    className="gap-2 h-11 px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  >
                    {t('buttons.next')}: {t('sections.location.title')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Location - Updated to match create page */}
              <TabsContent value="location" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-b from-card to-card/95 dark:from-gray-800 dark:to-gray-900">
                  <CardHeader className="p-6 border-b border-border/50 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                      <div className="p-2 rounded-full bg-blue-500/10">
                        <MapPin className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div>
                        <span className="text-foreground dark:text-white">{t('sections.location.title')}</span>
                        <CardDescription className="mt-1 dark:text-gray-400">
                          {t('sections.location.subtitle')}
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    <div className="grid gap-6">
                      <div className="space-y-3 relative">
                        <Label htmlFor="city" className="font-semibold text-foreground dark:text-white">
                          {t('sections.location.city')} *
                        </Label>
                        <Select
                          value={formData.city?.toString() || ''}
                          onValueChange={(value) => {
                            handleInputChange('city', parseInt(value))
                          }}
                          disabled={isLoadingCities}
                          placeholder={isLoadingCities ? t('sections.location.loadingCities') : t('sections.location.selectCity')}
                        >
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            {citiesError ? (
                              <SelectItem value="error" disabled className="dark:text-gray-500">
                                {t('sections.location.failedToLoad')}
                              </SelectItem>
                            ) : cities.length === 0 ? (
                              <SelectItem value="empty" disabled className="dark:text-gray-500">
                                {t('sections.location.noCities')}
                              </SelectItem>
                            ) : (
                              cities.map((city) => (
                                <SelectItem key={city.id} value={city.id.toString()} className="h-12 dark:text-gray-300 dark:hover:bg-gray-700">
                                  <div className="flex flex-col">
                                    <span>{city.name}</span>
                                    <span className="text-xs text-muted-foreground dark:text-gray-500">{city.name_amharic}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {formErrors.city && (
                          <p className="text-sm text-destructive animate-in fade-in dark:text-red-400">
                            {formErrors.city}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 relative">
                        <Label htmlFor="sub_city" className="font-semibold text-foreground dark:text-white">
                          {t('sections.location.subCity')} *
                        </Label>
                        <Select
                          value={formData.sub_city?.toString() || ''}
                          onValueChange={(value) => {
                            handleInputChange('sub_city', parseInt(value))
                          }}
                          disabled={!formData.city || isLoadingSubCities}
                          placeholder={
                            !formData.city
                              ? t('sections.location.selectCityFirst')
                              : isLoadingSubCities
                                ? t('sections.location.loading')
                                : t('sections.location.selectSubCity')
                          }
                        >
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            {!formData.city ? (
                              <SelectItem value="select_city_first" disabled className="dark:text-gray-500">
                                {t('sections.location.selectCityFirst')}
                              </SelectItem>
                            ) : subCitiesError ? (
                              <SelectItem value="error" disabled className="dark:text-gray-500">
                                {t('sections.location.failedToLoadSubCities')}
                              </SelectItem>
                            ) : subCities.length === 0 ? (
                              <SelectItem value="no_subcities" disabled className="dark:text-gray-500">
                                {t('sections.location.noSubCities')}
                              </SelectItem>
                            ) : (
                              subCities.map((subCity) => (
                                <SelectItem key={subCity.id} value={subCity.id.toString()} className="h-12 dark:text-gray-300 dark:hover:bg-gray-700">
                                  <div className="flex flex-col">
                                    <span>{subCity.name}</span>
                                    <span className="text-xs text-muted-foreground dark:text-gray-500">{subCity.name_amharic}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {formErrors.sub_city && (
                          <p className="text-sm text-destructive animate-in fade-in dark:text-red-400">
                            {formErrors.sub_city}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="specific_location" className="font-semibold text-foreground dark:text-white">
                        {t('sections.location.specificLocation')} *
                      </Label>
                      <Input
                        id="specific_location"
                        value={formData.specific_location || ''}
                        onChange={(e) => handleInputChange('specific_location', e.target.value)}
                        placeholder={t('sections.location.specificLocationPlaceholder')}
                        className="h-14 text-base border-2 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                      />
                      {formErrors.specific_location && (
                        <p className="text-sm text-destructive animate-in fade-in dark:text-red-400">
                          {formErrors.specific_location}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="address_line_1" className="font-semibold text-foreground dark:text-white">
                          {t('sections.location.addressLine1')}
                        </Label>
                        <Input
                          id="address_line_1"
                          value={formData.address_line_1 || ''}
                          onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                          placeholder={t('sections.location.addressLine1Placeholder')}
                          className="h-14 text-base border-2 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="address_line_2" className="font-semibold text-foreground dark:text-white">
                          {t('sections.location.addressLine2')}
                        </Label>
                        <Input
                          id="address_line_2"
                          value={formData.address_line_2 || ''}
                          onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                          placeholder={t('sections.location.addressLine2Placeholder')}
                          className="h-14 text-base border-2 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                        <h3 className="text-base md:text-lg font-semibold flex items-center gap-2 dark:text-white">
                          <Navigation className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                          {t('sections.location.exactCoordinates')}
                        </h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (navigator.geolocation) {
                              toast.loading(t('sections.location.detectingLocation'))
                              navigator.geolocation.getCurrentPosition(
                                async (position) => {
                                  toast.dismiss()
                                  handleInputChange('latitude', position.coords.latitude)
                                  handleInputChange('longitude', position.coords.longitude)
                                  toast.success(t('sections.location.locationDetected'))
                                },
                                (error) => {
                                  toast.dismiss()
                                  toast.error(t('sections.location.unableToDetect'))
                                }
                              )
                            } else {
                              toast.error(t('sections.location.geolocationNotSupported'))
                            }
                          }}
                          className="gap-1 h-7 text-xs border-blue-500/20 hover:border-blue-500/40 dark:border-blue-400/20 dark:hover:border-blue-400/40"
                          disabled={isGeocoding}
                        >
                          <Compass className="h-3 w-3" />
                          {isGeocoding ? t('sections.location.detecting') : t('sections.location.autoDetect')}
                        </Button>
                      </div>

                      <div className="grid gap-6">
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <Label htmlFor="latitude" className="font-semibold text-foreground dark:text-white">
                              {t('sections.location.latitude')}
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
                                    toast.error(t('sections.location.couldNotFetch'))
                                  }
                                } else {
                                  toast.error(t('sections.location.enterCoordinatesFirst'))
                                }
                              }}
                              disabled={!formData.latitude || !formData.longitude || isGeocoding}
                              className="gap-1 h-7 text-xs"
                            >
                              <Search className="h-3 w-3" />
                              {isGeocoding ? t('sections.location.lookingUp') : t('sections.location.lookUp')}
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
                              className="h-14 text-base border-2 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="longitude" className="font-semibold text-foreground dark:text-white">
                            {t('sections.location.longitude')}
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
                              className="h-14 text-base border-2 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
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
                                {t('sections.location.locationDetected')}
                              </p>
                              {geocodeResult.city && (
                                <p className="text-xs text-green-700 dark:text-green-400">
                                  <span className="font-medium">{t('sections.location.city')}:</span> {geocodeResult.city}
                                </p>
                              )}
                              {geocodeResult.subcity && (
                                <p className="text-xs text-green-700 dark:text-green-400">
                                  <span className="font-medium">{t('sections.location.area')}:</span> {geocodeResult.subcity}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-800 dark:text-blue-300">{t('sections.location.privacyTitle')}</AlertTitle>
                      <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
                        {t('sections.location.privacyDescription')}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('basic')}
                    className="gap-2 border-primary/20 hover:border-primary/40 h-11 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    {t('buttons.previous')}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('details')}
                    className="gap-2 h-11 px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  >
                    {t('buttons.next')}: {t('sections.details.title')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Property Details - Enhanced */}
              <TabsContent value="details" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-b from-card to-card/95 dark:from-gray-800 dark:to-gray-900">
                  <CardHeader className="p-6 border-b border-border/50 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                      <div className="p-2 rounded-full bg-purple-500/10">
                        <Building className="h-6 w-6 text-purple-500 dark:text-purple-400" />
                      </div>
                      <div>
                        <span className="text-foreground dark:text-white">{t('sections.details.title')}</span>
                        <CardDescription className="mt-1 dark:text-gray-400">
                          {t('sections.details.subtitle')}
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {/* Room Counts */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label htmlFor="bedrooms" className="font-semibold text-foreground dark:text-white">
                          {t('sections.details.bedrooms')}
                        </Label>
                        <div className="relative">
                          <Bed className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                          <Select
                            value={formData.bedrooms?.toString() || '1'}
                            onValueChange={(value) => handleInputChange('bedrooms', parseInt(value))}
                            placeholder={t('sections.details.selectBedrooms')}
                          >
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                              {BEDROOM_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="h-12 dark:text-gray-300 dark:hover:bg-gray-700">
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="bathrooms" className="font-semibold text-foreground dark:text-white">
                          {t('sections.details.bathrooms')}
                        </Label>
                        <div className="relative">
                          <Bath className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                          <Select
                            value={formData.bathrooms?.toString() || '1'}
                            onValueChange={(value) => handleInputChange('bathrooms', parseInt(value))}
                            placeholder={t('sections.details.selectBathrooms')}
                          >
                            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                              {BATHROOM_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="h-12 dark:text-gray-300 dark:hover:bg-gray-700">
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
                        <Label htmlFor="total_area" className="font-semibold text-foreground dark:text-white">
                          {t('sections.details.totalArea')} *
                        </Label>
                        <div className="relative">
                          <Maximize2 className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                          <Input
                            id="total_area"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.total_area || ''}
                            onChange={(e) => handleInputChange('total_area', parseFloat(e.target.value) || 0)}
                            placeholder="e.g., 150"
                            className="h-14 text-base border-2 pl-12 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-purple-400"
                          />
                        </div>
                        {formErrors.total_area && (
                          <p className="text-sm text-destructive mt-2 animate-in fade-in dark:text-red-400">
                            {formErrors.total_area}
                          </p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="plot_size" className="font-semibold text-foreground dark:text-white">
                          {t('sections.details.plotSize')}
                        </Label>
                        <div className="relative">
                          <Square className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                          <Input
                            id="plot_size"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.plot_size || ''}
                            onChange={(e) => handleInputChange('plot_size', parseFloat(e.target.value) || 0)}
                            placeholder={t('sections.details.plotSizePlaceholder')}
                            className="h-14 text-base border-2 pl-12 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-purple-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Year & Floors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label htmlFor="built_year" className="font-semibold text-foreground dark:text-white">
                          {t('sections.details.builtYear')}
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                          <Input
                            id="built_year"
                            type="number"
                            min="1800"
                            max={new Date().getFullYear()}
                            value={formData.built_year || ''}
                            onChange={(e) => handleInputChange('built_year', parseInt(e.target.value))}
                            placeholder="e.g., 2020"
                            className="h-14 text-base border-2 pl-12 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-purple-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label htmlFor="floors" className="font-semibold text-foreground dark:text-white">
                          {t('sections.details.numberOfFloors')}
                        </Label>
                        <div className="relative">
                          <Layers className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                          <Input
                            id="floors"
                            type="number"
                            min="1"
                            value={formData.floors || 1}
                            onChange={(e) => handleInputChange('floors', parseInt(e.target.value))}
                            className="h-14 text-base border-2 pl-12 focus:border-purple-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-purple-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Furnishing Type */}
                    <div className="space-y-4">
                      <Label htmlFor="furnishing_type" className="font-semibold text-foreground dark:text-white">
                        {t('sections.details.furnishingType')}
                      </Label>
                      <div className="relative">
                        <Sofa className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                        <Select
                          value={formData.furnishing_type}
                          onValueChange={(value) => handleInputChange('furnishing_type', value)}
                          placeholder={t('sections.details.selectFurnishingType')}
                        >
                          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            {FURNISHING_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value} className="h-12 dark:text-gray-300 dark:hover:bg-gray-700">
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
                    className="gap-2 border-primary/20 hover:border-primary/40 h-11 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    {t('buttons.previous')}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('pricing')}
                    className="gap-2 h-11 px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  >
                    {t('buttons.next')}: {t('sections.pricing.title')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Pricing - Enhanced */}
              <TabsContent value="pricing" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-b from-card to-card/95 dark:from-gray-800 dark:to-gray-900">
                  <CardHeader className="p-6 border-b border-border/50 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                      <div className="p-2 rounded-full bg-green-500/10">
                        <DollarSign className="h-6 w-6 text-green-500 dark:text-green-400" />
                      </div>
                      <div>
                        <span className="text-foreground dark:text-white">
                          {listingType === 'for_sale' ? t('sections.pricing.salePrice') : t('sections.pricing.rentalInformation')}
                        </span>
                        <CardDescription className="mt-1 dark:text-gray-400">
                          {t('sections.pricing.subtitle')}
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {listingType === 'for_sale' ? (
                      <>
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <Label className="text-lg font-semibold text-foreground dark:text-white">
                              {t('sections.pricing.priceCalculation')}
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
                              <Label htmlFor="price_etb" className="font-semibold text-foreground dark:text-white">
                                {t('sections.pricing.priceEtb')} *
                              </Label>
                              <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                                <Input
                                  id="price_etb"
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={formData.price_etb || ''}
                                  onChange={(e) => handleInputChange('price_etb', parseFloat(e.target.value) || 0)}
                                  placeholder="e.g., 5,000,000"
                                  className="h-14 text-base border-2 pl-12 focus:border-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-green-400"
                                  disabled={priceCalculationMode === 'usd'}
                                />
                              </div>
                              {formErrors.price_etb && (
                                <p className="text-sm text-destructive mt-2 animate-in fade-in dark:text-red-400">
                                  {formErrors.price_etb}
                                </p>
                              )}
                            </div>

                            <div className="space-y-4">
                              <Label htmlFor="price_usd" className="font-semibold text-foreground dark:text-white">
                                {t('sections.pricing.priceUsd')}
                              </Label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500">$</span>
                                <Input
                                  id="price_usd"
                                  type="number"
                                  min="0"
                                  step="100"
                                  value={formData.price_usd || ''}
                                  onChange={(e) => handleInputChange('price_usd', parseFloat(e.target.value) || 0)}
                                  placeholder="e.g., 90,000"
                                  className="h-14 text-base border-2 pl-12 focus:border-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-green-400"
                                  disabled={priceCalculationMode === 'etb'}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label htmlFor="property_tax" className="font-semibold text-foreground dark:text-white">
                            {t('sections.pricing.annualPropertyTax')}
                          </Label>
                          <div className="relative">
                            <Receipt className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                            <Input
                              id="property_tax"
                              type="number"
                              min="0"
                              step="100"
                              value={formData.property_tax || ''}
                              onChange={(e) => handleInputChange('property_tax', parseFloat(e.target.value) || 0)}
                              placeholder="e.g., 10,000"
                              className="h-14 text-base border-2 pl-12 focus:border-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-green-400"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <Label htmlFor="monthly_rent" className="font-semibold text-foreground dark:text-white">
                              {t('sections.pricing.monthlyRent')} *
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                              <Input
                                id="monthly_rent"
                                type="number"
                                min="0"
                                step="1000"
                                value={formData.monthly_rent || ''}
                                onChange={(e) => handleInputChange('monthly_rent', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 15,000"
                                className="h-14 text-base border-2 pl-12 focus:border-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-green-400"
                              />
                            </div>
                            {formErrors.monthly_rent && (
                              <p className="text-sm text-destructive mt-2 animate-in fade-in dark:text-red-400">
                                {formErrors.monthly_rent}
                              </p>
                            )}
                          </div>

                          <div className="space-y-4">
                            <Label htmlFor="security_deposit" className="font-semibold text-foreground dark:text-white">
                              {t('sections.pricing.securityDeposit')}
                            </Label>
                            <div className="relative">
                              <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                              <Input
                                id="security_deposit"
                                type="number"
                                min="0"
                                step="1000"
                                value={formData.security_deposit || ''}
                                onChange={(e) => handleInputChange('security_deposit', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 30,000"
                                className="h-14 text-base border-2 pl-12 focus:border-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-green-400"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <Label htmlFor="maintenance_fee" className="font-semibold text-foreground dark:text-white">
                              {t('sections.pricing.monthlyMaintenance')}
                            </Label>
                            <div className="relative">
                              <Wrench className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                              <Input
                                id="maintenance_fee"
                                type="number"
                                min="0"
                                step="100"
                                value={formData.maintenance_fee || ''}
                                onChange={(e) => handleInputChange('maintenance_fee', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 2,000"
                                className="h-14 text-base border-2 pl-12 focus:border-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-green-400"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label htmlFor="property_tax" className="font-semibold text-foreground dark:text-white">
                              {t('sections.pricing.propertyTax')}
                            </Label>
                            <div className="relative">
                              <Receipt className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                              <Input
                                id="property_tax"
                                type="number"
                                min="0"
                                step="100"
                                value={formData.property_tax || ''}
                                onChange={(e) => handleInputChange('property_tax', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 10,000"
                                className="h-14 text-base border-2 pl-12 focus:border-green-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-green-400"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {formErrors.price && (
                      <Alert variant="destructive" className="animate-in fade-in dark:bg-red-950 dark:border-red-900">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="dark:text-red-300">{t('sections.pricing.priceCheckRequired')}</AlertTitle>
                        <AlertDescription className="dark:text-red-400">{formErrors.price}</AlertDescription>
                      </Alert>
                    )}

                    {/* Negotiable Switch */}
                    <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-xl border border-border/50 dark:bg-gray-800/50 dark:border-gray-700">
                      <Switch
                        id="price_negotiable"
                        checked={formData.price_negotiable}
                        onCheckedChange={(checked) => handleInputChange('price_negotiable', checked)}
                        className="data-[state=checked]:bg-green-500 dark:data-[state=checked]:bg-green-600"
                      />
                      <div className="flex-1">
                        <Label htmlFor="price_negotiable" className="font-semibold cursor-pointer text-foreground dark:text-white">
                          {t('sections.pricing.priceNegotiable')}
                        </Label>
                        <p className="text-sm text-muted-foreground dark:text-gray-500">
                          {t('sections.pricing.priceNegotiableDescription')}
                        </p>
                      </div>
                      {formData.price_negotiable && (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                          {t('sections.pricing.negotiable')}
                        </Badge>
                      )}
                    </div>

                    {/* Pricing Tips */}
                    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900 rounded-xl">
                      <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-800 dark:text-blue-300">{t('sections.pricing.pricingTips')}</AlertTitle>
                      <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm space-y-2">
                        <p className="font-medium">
                          {listingType === 'for_sale'
                            ? t('sections.pricing.saleTip')
                            : t('sections.pricing.rentTip')}
                        </p>
                        <p>{t('sections.pricing.marketTrends')}</p>
                        <p>{t('sections.pricing.competitivePricing')}</p>
                        <p>{t('sections.pricing.includeUtilities')}</p>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('details')}
                    className="gap-2 border-primary/20 hover:border-primary/40 h-11 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    {t('buttons.previous')}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('features')}
                    className="gap-2 h-11 px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  >
                    {t('buttons.next')}: {t('sections.features.title')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Features & Amenities - Enhanced with categories */}
              <TabsContent value="features" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-b from-card to-card/95 dark:from-gray-800 dark:to-gray-900">
                  <CardHeader className="p-6 border-b border-border/50 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                      <div className="p-2 rounded-full bg-yellow-500/10">
                        <CheckSquare className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
                      </div>
                      <div>
                        <span className="text-foreground dark:text-white">{t('sections.features.title')}</span>
                        <CardDescription className="mt-1 dark:text-gray-400">
                          {t('sections.features.subtitle')}
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-8">
                        {/* View Mode Toggle */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="text-sm text-muted-foreground dark:text-gray-500">
                            {t('sections.features.selectByCategory')}
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
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors dark:bg-gray-800/50 dark:hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-red-500/10">
                                <Shield className="h-5 w-5 text-red-500 dark:text-red-400" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground dark:text-white">{t('sections.features.essentials')}</h3>
                                <p className="text-sm text-muted-foreground dark:text-gray-500">{t('sections.features.essentialsDescription')}</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180 dark:text-gray-500" />
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
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-gray-800",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-red-500 bg-red-500/10 dark:border-red-400 dark:bg-red-500/20"
                                      : "border-border hover:border-red-500/50 dark:border-gray-700 dark:hover:border-red-400/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-red-500 text-white dark:bg-red-600"
                                        : "bg-muted dark:bg-gray-700"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground dark:text-white">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground dark:text-gray-500">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center dark:bg-red-600">
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
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors dark:bg-gray-800/50 dark:hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-500/10">
                                <Snowflake className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground dark:text-white">{t('sections.features.comfort')}</h3>
                                <p className="text-sm text-muted-foreground dark:text-gray-500">{t('sections.features.comfortDescription')}</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180 dark:text-gray-500" />
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
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-gray-800",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-blue-500 bg-blue-500/10 dark:border-blue-400 dark:bg-blue-500/20"
                                      : "border-border hover:border-blue-500/50 dark:border-gray-700 dark:hover:border-blue-400/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-blue-500 text-white dark:bg-blue-600"
                                        : "bg-muted dark:bg-gray-700"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground dark:text-white">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground dark:text-gray-500">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center dark:bg-blue-600">
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
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors dark:bg-gray-800/50 dark:hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-green-500/10">
                                <Refrigerator className="h-5 w-5 text-green-500 dark:text-green-400" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground dark:text-white">{t('sections.features.appliances')}</h3>
                                <p className="text-sm text-muted-foreground dark:text-gray-500">{t('sections.features.appliancesDescription')}</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180 dark:text-gray-500" />
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
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-gray-800",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-green-500 bg-green-500/10 dark:border-green-400 dark:bg-green-500/20"
                                      : "border-border hover:border-green-500/50 dark:border-gray-700 dark:hover:border-green-400/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-green-500 text-white dark:bg-green-600"
                                        : "bg-muted dark:bg-gray-700"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground dark:text-white">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground dark:text-gray-500">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center dark:bg-green-600">
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
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors dark:bg-gray-800/50 dark:hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-purple-500/10">
                                <Waves className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground dark:text-white">{t('sections.features.lifestyle')}</h3>
                                <p className="text-sm text-muted-foreground dark:text-gray-500">{t('sections.features.lifestyleDescription')}</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180 dark:text-gray-500" />
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
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-gray-800",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-purple-500 bg-purple-500/10 dark:border-purple-400 dark:bg-purple-500/20"
                                      : "border-border hover:border-purple-500/50 dark:border-gray-700 dark:hover:border-purple-400/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-purple-500 text-white dark:bg-purple-600"
                                        : "bg-muted dark:bg-gray-700"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground dark:text-white">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground dark:text-gray-500">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center dark:bg-purple-600">
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
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors dark:bg-gray-800/50 dark:hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-indigo-500/10">
                                <Cpu className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground dark:text-white">{t('sections.features.technology')}</h3>
                                <p className="text-sm text-muted-foreground dark:text-gray-500">{t('sections.features.technologyDescription')}</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180 dark:text-gray-500" />
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
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-gray-800",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-indigo-500 bg-indigo-500/10 dark:border-indigo-400 dark:bg-indigo-500/20"
                                      : "border-border hover:border-indigo-500/50 dark:border-gray-700 dark:hover:border-indigo-400/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-indigo-500 text-white dark:bg-indigo-600"
                                        : "bg-muted dark:bg-gray-700"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground dark:text-white">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground dark:text-gray-500">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-indigo-500 text-white flex items-center justify-center dark:bg-indigo-600">
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
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors dark:bg-gray-800/50 dark:hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-amber-500/10">
                                <Bell className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground dark:text-white">{t('sections.features.services')}</h3>
                                <p className="text-sm text-muted-foreground dark:text-gray-500">{t('sections.features.servicesDescription')}</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180 dark:text-gray-500" />
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
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-gray-800",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-amber-500 bg-amber-500/10 dark:border-amber-400 dark:bg-amber-500/20"
                                      : "border-border hover:border-amber-500/50 dark:border-gray-700 dark:hover:border-amber-400/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-amber-500 text-white dark:bg-amber-600"
                                        : "bg-muted dark:bg-gray-700"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground dark:text-white">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground dark:text-gray-500">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center dark:bg-amber-600">
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
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors dark:bg-gray-800/50 dark:hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-pink-500/10">
                                <Users className="h-5 w-5 text-pink-500 dark:text-pink-400" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground dark:text-white">{t('sections.features.community')}</h3>
                                <p className="text-sm text-muted-foreground dark:text-gray-500">{t('sections.features.communityDescription')}</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180 dark:text-gray-500" />
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
                                    "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-gray-800",
                                    formData[amenity.key as keyof PropertyFormData]
                                      ? "border-pink-500 bg-pink-500/10 dark:border-pink-400 dark:bg-pink-500/20"
                                      : "border-border hover:border-pink-500/50 dark:border-gray-700 dark:hover:border-pink-400/50"
                                  )}
                                  onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "p-2 rounded-lg",
                                      formData[amenity.key as keyof PropertyFormData]
                                        ? "bg-pink-500 text-white dark:bg-pink-600"
                                        : "bg-muted dark:bg-gray-700"
                                    )}>
                                      <amenity.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground dark:text-white">{amenity.name}</div>
                                      <div className="text-xs text-muted-foreground dark:text-gray-500">{amenity.description}</div>
                                    </div>
                                  </div>
                                  {formData[amenity.key as keyof PropertyFormData] && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-pink-500 text-white flex items-center justify-center dark:bg-pink-600">
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
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors dark:bg-gray-800/50 dark:hover:bg-gray-800">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-500/10">
                                <Plus className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-lg text-foreground dark:text-white">{t('sections.features.additionalAmenities')}</h3>
                                <p className="text-sm text-muted-foreground dark:text-gray-500">{t('sections.features.additionalAmenitiesDescription')}</p>
                              </div>
                            </div>
                            <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180 dark:text-gray-500" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4">
                            {isLoadingAmenities ? (
                              <div className="flex items-center justify-center p-8">
                                <LoadingSpinner className="h-8 w-8" />
                                <span className="ml-3 dark:text-gray-300">{t('sections.features.loadingAmenities')}</span>
                              </div>
                            ) : amenitiesList.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {amenitiesList.map((amenity) => (
                                  <div key={amenity.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:border-primary/50 transition-colors dark:border-gray-700 dark:hover:border-blue-400/50">
                                    <button
                                      type="button"
                                      onClick={() => handleAmenityToggle(amenity.id)}
                                      className={cn(
                                        "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                                        formData.amenities?.includes(amenity.id)
                                          ? "border-primary bg-primary text-primary-foreground dark:border-blue-400 dark:bg-blue-600"
                                          : "border-border hover:border-primary dark:border-gray-600 dark:hover:border-blue-400"
                                      )}
                                    >
                                      {formData.amenities?.includes(amenity.id) && (
                                        <CheckCircle className="h-3 w-3" />
                                      )}
                                    </button>
                                    <Label className="cursor-pointer flex-1 dark:text-gray-300">
                                      <div className="font-medium">{amenity.name}</div>
                                      {amenity.name_amharic && (
                                        <div className="text-xs text-muted-foreground dark:text-gray-500">{amenity.name_amharic}</div>
                                      )}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center p-8 text-muted-foreground dark:text-gray-500">
                                {t('sections.features.noAdditionalAmenities')}
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </ScrollArea>

                    {/* Documentation */}
                    <Separator className="my-8 dark:bg-gray-700" />

                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-foreground dark:text-white">{t('sections.features.propertyDocuments')}</h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-500">
                        {t('sections.features.propertyDocumentsDescription')}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {DOCUMENTS.map((doc) => (
                          <div
                            key={doc.id}
                            className={cn(
                              "cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-gray-800",
                              formData[doc.key as keyof PropertyFormData]
                                ? "border-primary bg-primary/10 dark:border-blue-400 dark:bg-blue-500/20"
                                : "border-border hover:border-primary/50 dark:border-gray-700 dark:hover:border-blue-400/50"
                            )}
                            onClick={() => handleBooleanToggle(doc.key as keyof PropertyFormData)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                formData[doc.key as keyof PropertyFormData]
                                  ? "bg-primary text-primary-foreground dark:bg-blue-600"
                                  : "bg-muted dark:bg-gray-700"
                              )}>
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground dark:text-white">{doc.name}</div>
                                <div className="text-xs text-muted-foreground dark:text-gray-500">{doc.description}</div>
                              </div>
                            </div>
                            {formData[doc.key as keyof PropertyFormData] && (
                              <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center dark:bg-blue-600">
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
                    className="gap-2 border-primary/20 hover:border-primary/40 h-11 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    {t('buttons.previous')}
                  </Button>
                  <Button
                    onClick={() => setActiveTab('media')}
                    className="gap-2 h-11 px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  >
                    {t('buttons.next')}: {t('sections.media.title')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Media - Enhanced */}
              <TabsContent value="media" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-b from-card to-card/95 dark:from-gray-800 dark:to-gray-900">
                  <CardHeader className="p-6 border-b border-border/50 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                      <div className="p-2 rounded-full bg-pink-500/10">
                        <ImageIcon className="h-6 w-6 text-pink-500 dark:text-pink-400" />
                      </div>
                      <div>
                        <span className="text-foreground dark:text-white">{t('sections.media.title')}</span>
                        <CardDescription className="mt-1 dark:text-gray-400">
                          {t('sections.media.subtitle')}
                        </CardDescription>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {/* Images Upload */}
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-foreground dark:text-white">{t('sections.media.propertyPhotos')} *</h3>
                          <p className="text-sm text-muted-foreground dark:text-gray-500">
                            {t('sections.media.propertyPhotosDescription')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-foreground dark:text-white">
                            {existingImages.length + (formData.images?.filter(img => isFile(img)).length || 0)}/20 {t('sections.media.photos')}
                          </span>
                          <Badge variant="outline" className="bg-primary/10 text-primary dark:bg-blue-500/20 dark:text-blue-400">
                            {t('sections.media.required')}
                          </Badge>
                        </div>
                      </div>

                      {formErrors.images && (
                        <Alert variant="destructive" className="animate-in fade-in dark:bg-red-950 dark:border-red-900">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle className="dark:text-red-300">{t('sections.media.imagesRequired')}</AlertTitle>
                          <AlertDescription className="dark:text-red-400">{formErrors.images}</AlertDescription>
                        </Alert>
                      )}

                      {/* Existing Images */}
                      {existingImages.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-foreground dark:text-white">{t('sections.media.existingPhotos')}</h4>
                            <p className="text-sm text-muted-foreground dark:text-gray-500">
                              {t('sections.media.clickToRemove')}
                            </p>
                          </div>
                          <div className={cn(
                            "gap-4",
                            viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "flex flex-col"
                          )}>
                            {existingImages.map((image, index) => (
                              <div
                                key={image.id}
                                className={cn(
                                  "relative group rounded-xl overflow-hidden border-2 border-transparent hover:border-pink-500 transition-all duration-300 dark:hover:border-pink-400",
                                  viewMode === 'list' && "flex items-center gap-4 p-4 bg-muted/30 dark:bg-gray-800/50"
                                )}
                              >
                                <div className={cn(
                                  "overflow-hidden bg-muted/30 dark:bg-gray-700/30",
                                  viewMode === 'grid' ? "aspect-square" : "h-20 w-20 rounded-lg flex-shrink-0"
                                )}>
                                  <img
                                    src={image.image}
                                    alt={image.caption || `Property image ${index + 1}`}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  />
                                </div>
                                <div className={cn(
                                  "absolute top-2 left-2 flex gap-1",
                                  viewMode === 'list' && "top-4 left-24"
                                )}>
                                  {image.is_primary && (
                                    <Badge className="bg-pink-500 text-xs border-0 dark:bg-pink-600">
                                      {t('sections.media.cover')}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="bg-black/70 text-white border-0 text-xs dark:bg-gray-900/80">
                                    {index + 1}
                                  </Badge>
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-7 w-7 bg-destructive/90 hover:bg-destructive dark:bg-red-600 dark:hover:bg-red-700"
                                    onClick={() => handleRemoveExistingImage(image.id)}
                                    aria-label={`Remove image ${image.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                {viewMode === 'list' && (
                                  <div className="flex-1 p-2">
                                    <p className="font-medium text-foreground dark:text-white truncate">
                                      {image.caption || `Image ${index + 1}`}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Image Upload Area */}
                      <div className="border-3 border-dashed border-border rounded-2xl p-8 text-center transition-all duration-300 hover:border-pink-500 hover:bg-pink-500/5 hover:shadow-lg group dark:border-gray-700 dark:hover:border-pink-400 dark:hover:bg-pink-500/10">
                        <div className="mb-6">
                          <div className="inline-flex p-4 rounded-full bg-pink-500/10 mb-4 group-hover:scale-110 transition-transform duration-300 dark:bg-pink-500/20">
                            <Upload className="h-8 w-8 text-pink-500 dark:text-pink-400" />
                          </div>
                          <h4 className="text-lg font-bold text-foreground dark:text-white mb-2">{t('sections.media.dragDropImages')}</h4>
                          <p className="text-sm text-muted-foreground dark:text-gray-500 mb-6">
                            {t('sections.media.clickToBrowse')}
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
                            className="mt-2 md:mt-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                          >
                            <ImageIcon className="h-5 w-5" />
                            {t('sections.media.selectImages')}
                          </Button>
                        </div>

                        {/* Upload Tips */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted-foreground dark:text-gray-500">
                          <div className="flex items-center gap-2">
                            <Camera className="h-3 w-3" />
                            <span>{t('sections.media.useGoodLighting')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Maximize2 className="h-3 w-3" />
                            <span>{t('sections.media.showAllRooms')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-3 w-3" />
                            <span>{t('sections.media.cleanAndTidy')}</span>
                          </div>
                        </div>
                      </div>

                      {/* New Image Previews */}
                      {formData.images && formData.images.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-foreground dark:text-white">{t('sections.media.newPhotosToUpload')}</h4>
                            <p className="text-sm text-muted-foreground dark:text-gray-500">
                              {t('sections.media.dragToReorder')}
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
                                    "relative group rounded-xl overflow-hidden border-2 border-transparent hover:border-pink-500 transition-all duration-300 dark:hover:border-pink-400",
                                    viewMode === 'list' && "flex items-center gap-4 p-4 bg-muted/30 dark:bg-gray-800/50"
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
                                    "overflow-hidden bg-muted/30 dark:bg-gray-700/30",
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
                                        <ImageIcon className="h-8 w-8 text-muted-foreground dark:text-gray-500" />
                                      </div>
                                    )}
                                  </div>
                                  <div className={cn(
                                    "absolute top-2 left-2 flex gap-1",
                                    viewMode === 'list' && "top-4 left-24"
                                  )}>
                                    {index === 0 && (
                                      <Badge className="bg-pink-500 text-xs border-0 dark:bg-pink-600">
                                        {t('sections.media.cover')}
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="bg-black/70 text-white border-0 text-xs dark:bg-gray-900/80">
                                      {index + 1}
                                    </Badge>
                                  </div>
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="icon"
                                      variant="destructive"
                                      className="h-7 w-7 bg-destructive/90 hover:bg-destructive dark:bg-red-600 dark:hover:bg-red-700"
                                      onClick={() => handleRemoveFile('images', index)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  {viewMode === 'list' && (
                                    <div className="flex-1 p-2">
                                      <p className="font-medium text-foreground dark:text-white truncate">
                                        {isFile(image) ? image.name : `Image ${index + 1}`}
                                      </p>
                                      {isFile(image) && (
                                        <p className="text-xs text-muted-foreground dark:text-gray-500">
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

                    <Separator className="dark:bg-gray-700" />

                    {/* Video Upload */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-foreground dark:text-white">{t('sections.media.videoTour')}</h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-500">
                        {t('sections.media.videoTourDescription')}
                      </p>

                      {formData.property_video ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border-2 border-green-500/20 rounded-xl bg-green-500/5 dark:border-green-400/20 dark:bg-green-500/10">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-green-500/10 dark:bg-green-500/20">
                                <Video className="h-5 w-5 text-green-500 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground dark:text-white">
                                  {formData.property_video.name || t('sections.media.videoFile')}
                                </p>
                                {formData.property_video.size && (
                                  <p className="text-sm text-muted-foreground dark:text-gray-500">
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
                                className="gap-1 border-green-500/20 hover:border-green-500/40 dark:border-green-400/20 dark:hover:border-green-400/40"
                              >
                                <Eye className="h-3 w-3" />
                                {t('sections.media.preview')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile('property_video')}
                                className="text-destructive hover:text-destructive dark:text-red-400 dark:hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : property?.property_video ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border-2 border-green-500/20 rounded-xl bg-green-500/5 dark:border-green-400/20 dark:bg-green-500/10">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-green-500/10 dark:bg-green-500/20">
                                <Video className="h-5 w-5 text-green-500 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground dark:text-white">{t('sections.media.currentVideo')}</p>
                                <p className="text-sm text-muted-foreground dark:text-gray-500">
                                  {property.property_video.split('/').pop()}
                                </p>
                              </div>
                            </div>
                            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <AlertDescription className="text-blue-700 dark:text-blue-400">
                                {t('sections.media.uploadToReplace')}
                              </AlertDescription>
                            </Alert>
                          </div>
                        </div>
                      ) : (
                        <div className="border-3 border-dashed border-border rounded-2xl p-8 text-center transition-all duration-300 hover:border-green-500 hover:bg-green-500/5 hover:shadow-lg group dark:border-gray-700 dark:hover:border-green-400 dark:hover:bg-green-500/10">
                          <div className="mb-6">
                            <div className="inline-flex p-4 rounded-full bg-green-500/10 mb-4 group-hover:scale-110 transition-transform duration-300 dark:bg-green-500/20">
                              <Video className="h-8 w-8 text-green-500 dark:text-green-400" />
                            </div>
                            <h4 className="text-lg font-bold text-foreground dark:text-white mb-2">{t('sections.media.uploadVideoTour')}</h4>
                            <p className="text-sm text-muted-foreground dark:text-gray-500 mb-6">
                              {t('sections.media.videoFormats')}
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
                              className="gap-2 h-12 px-6 border-green-500/20 hover:border-green-500/40 dark:border-green-400/20 dark:hover:border-green-400/40"
                            >
                              <Video className="h-5 w-5" />
                              {t('sections.media.selectVideo')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator className="dark:bg-gray-700" />

                    {/* Virtual Tour */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-foreground dark:text-white">{t('sections.media.virtualTourLink')}</h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-500">
                        {t('sections.media.virtualTourDescription')}
                      </p>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground dark:text-gray-500" />
                        <Input
                          type="url"
                          value={formData.virtual_tour_url || ''}
                          onChange={(e) => handleInputChange('virtual_tour_url', e.target.value)}
                          placeholder={t('sections.media.virtualTourPlaceholder')}
                          className="h-14 text-base border-2 pl-12 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <Separator className="dark:bg-gray-700" />

                    {/* Document Upload */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-foreground dark:text-white">{t('sections.media.additionalDocuments')}</h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-500">
                        {t('sections.media.additionalDocumentsDescription')}
                      </p>

                      {formData.documents && formData.documents.length > 0 && (
                        <div className="space-y-3">
                          {formData.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                                  <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground dark:text-white">{doc.name}</p>
                                  <p className="text-sm text-muted-foreground dark:text-gray-500">
                                    {(doc.size / 1024).toFixed(2)} KB • {doc.type || t('sections.media.document')}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile('documents', index)}
                                className="text-destructive hover:text-destructive dark:text-red-400 dark:hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-3 border-dashed border-border rounded-2xl p-8 text-center transition-all duration-300 hover:border-blue-500 hover:bg-blue-500/5 hover:shadow-lg group dark:border-gray-700 dark:hover:border-blue-400 dark:hover:bg-blue-500/10">
                        <div className="mb-6">
                          <div className="inline-flex p-4 rounded-full bg-blue-500/10 mb-4 group-hover:scale-110 transition-transform duration-300 dark:bg-blue-500/20">
                            <FileText className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                          </div>
                          <h4 className="text-lg font-bold text-foreground dark:text-white mb-2">{t('sections.media.uploadAdditionalDocuments')}</h4>
                          <p className="text-sm text-muted-foreground dark:text-gray-500 mb-6">
                            {t('sections.media.documentFormats')}
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
                            className="gap-2 h-12 px-6 border-blue-500/20 hover:border-blue-500/40 dark:border-blue-400/20 dark:hover:border-blue-400/40"
                          >
                            <FileText className="h-5 w-5" />
                            {t('sections.media.selectDocuments')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/listings/${propertyId}`)}
                      className="gap-2 border-primary/20 hover:border-primary/40 h-11 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400"
                    >
                      {tc('cancel')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('features')}
                      className="gap-2 border-primary/20 hover:border-primary/40 h-11 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      {t('buttons.previous')}
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      className="gap-2 border-primary/20 hover:border-primary/40 h-11 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400"
                    >
                      <Save className="h-4 w-4" />
                      {t('buttons.saveDraft')}
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="gap-2 h-11 px-8 min-w-[160px] bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner className="h-4 w-4" />
                          {t('buttons.saving')}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          {t('buttons.saveChanges')}
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
            <Card className="border-border shadow-xl rounded-2xl overflow-hidden sticky top-24 bg-gradient-to-b from-card to-card/95 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="p-6 border-b border-border/50 dark:border-gray-700">
                <CardTitle className="text-foreground flex items-center gap-2 dark:text-white">
                  <Eye className="h-5 w-5 text-primary dark:text-blue-400" />
                  {t('preview.title')}
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  {t('preview.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="aspect-video rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden group relative dark:from-gray-700 dark:to-gray-700/50">
                  {(existingImages.length > 0 || (formData.images && formData.images.length > 0)) ? (
                    <>
                      <img
                        src={
                          existingImages.length > 0
                            ? existingImages[0]?.image
                            : getImageUrl(formData.images?.[0]) || ''
                        }
                        alt="Property preview"
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3 dark:text-gray-500" />
                      <p className="text-sm text-muted-foreground dark:text-gray-500">{t('preview.noImages')}</p>
                    </div>
                  )}
                  {(existingImages.length > 0 || (formData.images && formData.images.length > 0)) && (
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      {existingImages.length + (formData.images?.filter(img => isFile(img)).length || 0)} {t('preview.photos')}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-xl text-foreground truncate dark:text-white">
                    {formData.title || t('preview.yourPropertyTitle')}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1 dark:text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {formData.specific_location || t('preview.locationPlaceholder')}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20 dark:from-blue-500/10 dark:to-blue-500/5 dark:border-blue-500/30">
                    <div className="text-2xl font-bold text-foreground dark:text-white">{formData.bedrooms || 0}</div>
                    <div className="text-xs text-muted-foreground dark:text-gray-500">{t('preview.bedrooms')}</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl border border-green-500/20 dark:from-green-500/10 dark:to-green-500/5 dark:border-green-500/30">
                    <div className="text-2xl font-bold text-foreground dark:text-white">{formData.bathrooms || 0}</div>
                    <div className="text-xs text-muted-foreground dark:text-gray-500">{t('preview.bathrooms')}</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20 dark:from-purple-500/10 dark:to-purple-500/5 dark:border-purple-500/30">
                    <div className="text-2xl font-bold text-foreground dark:text-white">{formData.total_area || 0}</div>
                    <div className="text-xs text-muted-foreground dark:text-gray-500">m²</div>
                  </div>
                </div>

                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {listingType === 'for_sale' ? (
                    <>
                      {formData.price_etb
                        ? `ETB ${formData.price_etb.toLocaleString()}`
                        : t('preview.addPrice')}
                    </>
                  ) : (
                    <>
                      {formData.monthly_rent
                        ? `ETB ${formData.monthly_rent.toLocaleString()}/month`
                        : t('preview.addRent')}
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize bg-gradient-to-r from-gray-500/10 to-gray-500/5 dark:from-gray-700 dark:to-gray-700/50 dark:text-gray-300">
                    {formData.property_type?.replace('_', ' ') || t('preview.house')}
                  </Badge>
                  <Badge variant="outline" className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 dark:from-blue-500/10 dark:to-blue-500/5 dark:text-blue-300">
                    {listingType === 'for_sale' ? t('preview.forSale') : t('preview.forRent')}
                  </Badge>
                  {formData.price_negotiable && (
                    <Badge variant="outline" className="bg-gradient-to-r from-green-500/10 to-green-500/5 dark:from-green-500/10 dark:to-green-500/5 dark:text-green-300">
                      {t('preview.negotiable')}
                    </Badge>
                  )}
                  {formData.is_premium && (
                    <Badge className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 text-yellow-700 border-yellow-500/20 dark:from-yellow-500/10 dark:to-yellow-500/5 dark:text-yellow-300">
                      {t('preview.premium')}
                    </Badge>
                  )}
                </div>

                {/* Status Alert */}
                {(user?.is_staff || user?.is_superuser) ? (
                  <Alert className="bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border-blue-500/20 rounded-xl dark:from-blue-500/10 dark:to-cyan-500/5 dark:border-blue-500/30">
                    <ShieldCheck className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <AlertTitle className="text-blue-800 dark:text-blue-300">{t('preview.adminListing')}</AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
                      {t('preview.adminListingDescription')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border-amber-500/20 rounded-xl dark:from-amber-500/10 dark:to-yellow-500/5 dark:border-amber-500/30">
                    <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    <AlertTitle className="text-amber-800 dark:text-amber-300">{t('preview.pendingApproval')}</AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                      {t('preview.pendingApprovalDescription')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Quick Stats */}
                <div className="pt-4 border-t border-border/50 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground dark:text-gray-500">{t('preview.progress')}</div>
                      <div className="font-semibold text-foreground dark:text-white">{totalProgress}% {t('preview.complete')}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground dark:text-gray-500">{t('preview.sections')}</div>
                      <div className="font-semibold text-foreground dark:text-white">
                        {Object.values(progress).filter(p => p === 100).length}/6
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 dark:border-blue-500/30">
              <CardHeader className="p-6">
                <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  {t('tips.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  {[
                    {
                      icon: <Camera className="h-4 w-4" />,
                      title: t('tips.highQualityPhotos.title'),
                      description: t('tips.highQualityPhotos.description')
                    },
                    {
                      icon: <Type className="h-4 w-4" />,
                      title: t('tips.detailedDescription.title'),
                      description: t('tips.detailedDescription.description')
                    },
                    {
                      icon: <Calculator className="h-4 w-4" />,
                      title: t('tips.competitivePricing.title'),
                      description: t('tips.competitivePricing.description')
                    },
                    {
                      icon: <CheckCircle className="h-4 w-4" />,
                      title: t('tips.accurateInformation.title'),
                      description: t('tips.accurateInformation.description')
                    },
                    {
                      icon: <MessageCircle className="h-4 w-4" />,
                      title: t('tips.quickResponses.title'),
                      description: t('tips.quickResponses.description')
                    },
                  ].map((tip, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-gray-900/50">
                      <div className="p-2 rounded-full bg-blue-500/10 dark:bg-blue-500/20">
                        {tip.icon}
                      </div>
                      <div>
                        <div className="font-medium text-foreground dark:text-white">{tip.title}</div>
                        <div className="text-sm text-muted-foreground dark:text-gray-500">{tip.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button variant="outline" className="w-full gap-2 border-blue-500/20 hover:border-blue-500/40 dark:border-blue-400/20 dark:hover:border-blue-400/40 dark:text-gray-300">
                  <Info className="h-4 w-4" />
                  {t('tips.viewCompleteGuide')}
                </Button>
              </CardFooter>
            </Card>

            {/* Stats Card */}
            {property && (
              <Card className="border-border shadow-xl rounded-2xl overflow-hidden bg-gradient-to-b from-card to-card/95 dark:from-gray-800 dark:to-gray-900">
                <CardHeader className="p-6 border-b border-border/50 dark:border-gray-700">
                  <CardTitle className="text-foreground flex items-center gap-2 dark:text-white">
                    <TrendingUp className="h-5 w-5 text-primary dark:text-blue-400" />
                    {t('stats.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-500">{t('stats.totalViews')}</span>
                    <span className="font-medium text-foreground dark:text-white">{property.views_count.toLocaleString()}</span>
                  </div>
                  <Separator className="dark:bg-gray-700" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-500">{t('stats.inquiries')}</span>
                    <span className="font-medium text-foreground dark:text-white">{property.inquiry_count}</span>
                  </div>
                  <Separator className="dark:bg-gray-700" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-500">{t('stats.saves')}</span>
                    <span className="font-medium text-foreground dark:text-white">{property.save_count}</span>
                  </div>
                  <Separator className="dark:bg-gray-700" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-500">{t('stats.daysListed')}</span>
                    <span className="font-medium text-foreground dark:text-white">{property.days_on_market || 0}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}