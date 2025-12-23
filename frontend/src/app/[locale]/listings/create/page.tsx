// app/listings/create/page.tsx - UPDATED to use real promotion tiers
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
import { subscriptionApi } from '@/lib/api/subscriptions'
import { PropertyFormData, FileDraft } from '@/lib/types/property'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'
import debounce from 'lodash/debounce'
import Header from '@/components/common/Header/Header'
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
  Locate,
  GripVertical,
  Eye,
  Download,
  Globe,
  Calculator,
  Search,
  Navigation,
  Zap,
  TrendingUp,
  Crown,
  CreditCard
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { Badge } from '@/components/ui/Badge'
import { Label } from '@/components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { ScrollArea } from '@/components/ui/Scroll-area'
import { Switch } from '@/components/ui/Switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { cn } from '@/lib/utils'

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

const AMENITIES = [
  { id: 1, name: 'Parking', key: 'has_parking', icon: '🚗' },
  { id: 2, name: 'Garden', key: 'has_garden', icon: '🌳' },
  { id: 3, name: 'Security', key: 'has_security', icon: '🔒' },
  { id: 4, name: 'Furniture', key: 'has_furniture', icon: '🛋️' },
  { id: 5, name: 'Air Conditioning', key: 'has_air_conditioning', icon: '❄️' },
  { id: 6, name: 'Heating', key: 'has_heating', icon: '🔥' },
  { id: 7, name: 'Internet', key: 'has_internet', icon: '🌐' },
  { id: 8, name: 'Generator', key: 'has_generator', icon: '⚡' },
  { id: 9, name: 'Elevator', key: 'has_elevator', icon: '🔼' },
  { id: 10, name: 'Swimming Pool', key: 'has_swimming_pool', icon: '🏊' },
  { id: 11, name: 'Gym', key: 'has_gym', icon: '💪' },
  { id: 12, name: 'Conference Room', key: 'has_conference_room', icon: '💼' },
  { id: 13, name: 'Pet Friendly', key: 'is_pet_friendly', icon: '🐾' },
  { id: 14, name: 'Wheelchair Accessible', key: 'is_wheelchair_accessible', icon: '♿' },
  { id: 15, name: 'Backup Water', key: 'has_backup_water', icon: '💧' },
]

const DOCUMENTS = [
  { id: 1, name: 'Title Deed', key: 'has_title_deed', description: 'Proof of property ownership' },
  { id: 2, name: 'Construction Permit', key: 'has_construction_permit', description: 'Building approval documents' },
  { id: 3, name: 'Occupancy Certificate', key: 'has_occupancy_certificate', description: 'Certificate for habitation' },
]

const DURATION_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' }
]

const isFileDraft = (item: any): item is FileDraft => {
  return item && typeof item === 'object' && item.isPlaceholder === true
}

const isFile = (image: any): image is File => {
  return image instanceof File
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
  // Add missing state variables
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  // Add promotion tier state
  const [selectedPromotionTier, setSelectedPromotionTier] = useState<'basic' | 'standard' | 'premium'>('basic')
  const [selectedDuration, setSelectedDuration] = useState<number>(30)
  const [promotionPrice, setPromotionPrice] = useState<number>(0)

  const citySelectRef = useRef<HTMLDivElement>(null)
  const subCitySelectRef = useRef<HTMLDivElement>(null)

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
    // Add promotion fields
    promotionTier: 'basic',
    is_promoted: false,
  })

  // Fetch promotion tiers from API
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
      case 'basic': return 'bg-green-100 text-green-800 border-green-200'
      case 'standard': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

      // Using OpenStreetMap Nominatim API
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
        // Redirect to payment page for promoted properties
        router.push(`/listings/${data.id}/promote?from_create=true`)
      } else if (user?.is_staff || user?.is_superuser) {
        toast.success('Property listed successfully! It is now live.')
        router.push(`/listings/${data.id}?created=true`)
      } else {
        toast.success(
          'Property submitted successfully! It is now pending admin approval. ' +
          'You will be notified once it is approved and goes live.'
        )

        // Show promotion suggestion
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

    // Load auto-saved draft on mount
    const savedDraft = localStorage.getItem('property_draft_autosave')
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        const draftAge = new Date().getTime() - new Date(draft.timestamp).getTime()
        // Only load drafts less than 24 hours old
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

    // Clear subcity when city changes
    if (field === 'city' && value !== formData.city) {
      setFormData(prevData => ({ ...prevData, sub_city: undefined }))
    }

    // Clear geocode results when coordinates change
    if (field === 'latitude' || field === 'longitude') {
      setGeocodeResult(null)
      setGeocodeError(null)
    }

    // Clear error for field when user starts typing
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

      console.log('=== FORM DATA DEBUG ===')
      console.log('Form state:', formData)
      console.log('Listing type:', listingType)
      console.log('Promotion tier:', selectedPromotionTier)
      console.log('Promotion duration:', selectedDuration)

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

      AMENITIES.forEach(amenity => {
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

      // Append images
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

      // Append documents
      formData.documents?.forEach((doc) => {
        if (isFile(doc)) {
          formDataObj.append('documents', doc)
        }
      })

      formDataObj.append('is_premium', 'false');

      // Add promotion data
      formDataObj.append('promotionTier', selectedPromotionTier)
      formDataObj.append('is_promoted', selectedPromotionTier !== 'basic' ? 'true' : 'false')

      // Auto-approve for staff/superusers OR promoted properties
      if (user?.is_staff || user?.is_superuser || selectedPromotionTier !== 'basic') {
        formDataObj.append('approval_status', 'approved')
        formDataObj.append('is_active', 'true')
        formDataObj.append('approved_by', user?.id?.toString() || '')
        formDataObj.append('approved_at', new Date().toISOString())
      } else {
        formDataObj.append('approval_status', 'pending')
        formDataObj.append('is_active', 'true')
      }

      console.log('FormData being sent:')
      for (let [key, value] of formDataObj.entries()) {
        console.log(`${key}:`, value)
      }

      // If paid promotion, create the listing then redirect to Chapa
      if (selectedPromotionTier !== 'basic') {
        setIsSubmitting(true)
        toast.loading('Creating your listing...')

        try {
          // Create the property first
          const response = await listingsApi.createProperty(formDataObj, selectedPromotionTier)
          toast.dismiss()
          toast.success('Listing created! Redirecting to payment...')

          // Store property info for payment
          localStorage.setItem('last_payment_attempt', JSON.stringify({
            propertyId: response.id,
            tierType: selectedPromotionTier,
            duration: selectedDuration,
            timestamp: new Date().toISOString()
          }))

          // Try API payment first
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

          // Fallback to direct Chapa
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

          // Redirect to Chapa
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
        // For basic tier, use the normal mutation
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

  // Calculate progress
  const progress = {
    basic: formData.title && formData.description && formData.property_type ? 100 : 0,
    location: formData.city && formData.sub_city && formData.specific_location ? 100 : 0,
    details: formData.bedrooms && formData.total_area ? 100 : 0,
    pricing: (listingType === 'for_sale' ? formData.price_etb : formData.monthly_rent) ? 100 : 0,
    features: true,
    media: (formData.images?.filter(img => isFile(img)).length || 0) > 0 ? 100 : 0,
  }

  const totalProgress = Math.round(
    Object.values(progress).filter(p => typeof p === 'number').reduce((a, b) => a + b, 0) / 6
  )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner fullScreen />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />

      <div className="container max-w-7xl py-6 px-4 sm:px-6">
        {/* Progress Header */}
        <div className="mb-8 bg-card rounded-xl shadow-sm border p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {listingType === 'for_sale' ? 'Sell Your Property' : 'Rent Your Property'}
              </h1>
              <p className="text-muted-foreground mt-1">
                Fill in the details below to list your property (Free)
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <Clock className="h-3 w-3 mr-1" />
                  Unsaved changes
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadDraft}
                className="gap-2"
                aria-label="Load draft"
              >
                <Clock className="h-4 w-4" />
                Load Draft
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="gap-2"
                aria-label="Save draft"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Completion: {totalProgress}%
              </span>
              <span className="text-sm text-muted-foreground">
                {Object.values(progress).filter(p => p === 100).length}/6 sections
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-6 gap-2 text-xs text-muted-foreground">
              {['Basic', 'Location', 'Details', 'Pricing', 'Features', 'Media'].map((label, index) => (
                <div
                  key={label}
                  className={`text-center ${progress[Object.keys(progress)[index] as keyof typeof progress] === 100
                    ? 'text-primary font-semibold'
                    : ''
                    }`}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Promotion Selection Section - MATCHING PROMOTION PAGE DESIGN */}
        <Card className="mb-6 border-border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Boost Your Listing Visibility
            </CardTitle>
            <CardDescription>
              Choose a promotion package to get more views and faster approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingPromotionTiers ? (
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner className="h-8 w-8" />
                <span className="ml-3">Loading promotion options...</span>
              </div>
            ) : promotionTiers && promotionTiers.length > 0 ? (
              <>
                {/* Promotion tier selection */}
                <div>
                  <h3 className="font-semibold mb-4 text-foreground">Select Promotion Tier</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {promotionTiers.map((tier) => (
                      <div
                        key={tier.id}
                        className={cn(
                          "border-2 rounded-lg p-5 cursor-pointer transition-all h-full",
                          selectedPromotionTier === tier.tier_type
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setSelectedPromotionTier(tier.tier_type as any)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedPromotionTier(tier.tier_type as any)
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          {getTierIcon(tier.tier_type)}
                          <h4 className="font-bold text-lg text-foreground">{tier.name}</h4>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>

                        {tier.tier_type !== 'basic' ? (
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-foreground">7 days</span>
                              <span className="font-semibold text-foreground">{tier.price_7?.toLocaleString()} ETB</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-foreground">30 days</span>
                              <span className="font-semibold text-foreground">{tier.price_30?.toLocaleString()} ETB</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-foreground">60 days</span>
                              <span className="font-semibold text-foreground">{tier.price_60?.toLocaleString()} ETB</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-2xl font-bold text-green-600 mb-4">FREE</div>
                        )}

                        <div className="space-y-2">
                          {tier.features && tier.features.slice(0, 3).map((feature: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-foreground">{feature}</span>
                            </div>
                          ))}
                          {tier.features && tier.features.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              + {tier.features.length - 3} more features
                            </p>
                          )}
                        </div>

                        {selectedPromotionTier === tier.tier_type && (
                          <div className="mt-4 flex items-center justify-center">
                            <Badge className={cn("gap-1", getTierColor(tier.tier_type))}>
                              <CheckCircle className="h-3 w-3" />
                              Selected
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Duration selection for paid tiers */}
                {selectedPromotionTier !== 'basic' && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-4 text-foreground">Select Duration</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {DURATION_OPTIONS.map((duration) => (
                        <Button
                          key={duration.value}
                          variant={selectedDuration === duration.value ? "default" : "outline"}
                          onClick={() => setSelectedDuration(duration.value)}
                          className="h-16"
                        >
                          <div>
                            <div className="font-bold text-foreground">{duration.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {calculatePrice(selectedPromotionTier, duration.value).toLocaleString()} ETB
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Unable to load promotion options. Please try again later.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <div className="sticky top-0 z-10 bg-background border-b pb-2">
                <TabsList className="grid w-full grid-cols-6 bg-muted p-1 rounded-lg">
                  {['basic', 'location', 'details', 'pricing', 'features', 'media'].map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      onKeyDown={(e) => handleKeyDown(e, tab)}
                      tabIndex={0}
                      role="tab"
                      aria-label={`${tab} tab`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-primary" />
                      Basic Information
                    </CardTitle>
                    <CardDescription>
                      Start by providing the basic details about your property
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Listing Type */}
                    <div>
                      <Label className="mb-3 block text-foreground">What do you want to do? *</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={listingType === 'for_sale' ? 'default' : 'outline'}
                          className="h-16 text-base"
                          onClick={() => {
                            setListingType('for_sale')
                            handleInputChange('listing_type', 'for_sale')
                          }}
                          aria-label="Sell property"
                        >
                          <DollarSign className="mr-2 h-5 w-5" />
                          Sell Property
                        </Button>
                        <Button
                          type="button"
                          variant={listingType === 'for_rent' ? 'default' : 'outline'}
                          className="h-16 text-base"
                          onClick={() => {
                            setListingType('for_rent')
                            handleInputChange('listing_type', 'for_rent')
                          }}
                          aria-label="Rent property"
                        >
                          <Home className="mr-2 h-5 w-5" />
                          Rent Property
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="title" className="font-medium text-foreground">
                          Property Title *
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Modern 3-bedroom apartment in Bole"
                          className="h-12"
                          aria-describedby={formErrors.title ? "title-error" : undefined}
                        />
                        {formErrors.title && (
                          <p id="title-error" className="text-sm text-destructive">
                            {formErrors.title}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Be descriptive and specific
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="title_amharic" className="font-medium text-foreground">
                          Property Title (Amharic)
                        </Label>
                        <Input
                          id="title_amharic"
                          value={formData.title_amharic || ''}
                          onChange={(e) => handleInputChange('title_amharic', e.target.value)}
                          placeholder="አዲስ ዘመናዊ 3 አልጋ አፓርትመንት ቦሌ"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="property_type" className="font-medium text-foreground">
                        Property Type *
                      </Label>
                      <div className="relative" ref={citySelectRef}>
                        <Select
                          value={formData.property_type}
                          onValueChange={(value) => handleInputChange('property_type', value)}
                          placeholder="Select property type"
                          aria-label="Property type"
                        >
                          <SelectContent>
                            {PROPERTY_TYPES.map((type) => (
                              <SelectItem
                                key={type.value}
                                value={type.value}
                                aria-label={`Select ${type.label}`}
                              >
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description" className="font-medium text-foreground">
                        Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your property in detail. Include key features, condition, nearby amenities, and what makes it special..."
                        className="min-h-32"
                        aria-describedby={formErrors.description ? "description-error" : undefined}
                      />
                      {formErrors.description && (
                        <p id="description-error" className="text-sm text-destructive">
                          {formErrors.description}
                        </p>
                      )}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Be as detailed as possible</span>
                        <span>{formData.description?.length || 0}/2000 characters</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description_amharic" className="font-medium text-foreground">
                        Description (Amharic)
                      </Label>
                      <Textarea
                        id="description_amharic"
                        value={formData.description_amharic || ''}
                        onChange={(e) => handleInputChange('description_amharic', e.target.value)}
                        placeholder="የንብረትዎን ዝርዝር መረጃ ይጻፉ..."
                        className="min-h-32"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/listings')}
                    className="gap-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setActiveTab('location')}
                    className="gap-2"
                  >
                    Next: Location
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Location - ENHANCED WITH AUTO-FILL */}
              <TabsContent value="location" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Location Details
                    </CardTitle>
                    <CardDescription>
                      Tell us where your property is located. Enter coordinates to auto-fill details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* City and SubCity Select */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3 relative" ref={citySelectRef}>
                        <Label htmlFor="city" className="font-medium text-foreground">
                          City *
                        </Label>
                        <Select
                          value={formData.city?.toString() || ''}
                          onValueChange={(value) => {
                            handleInputChange('city', parseInt(value))
                          }}
                          disabled={isLoadingCities}
                          placeholder={
                            isLoadingCities ? "Loading cities..." : "Select city"
                          }
                          aria-describedby={formErrors.city ? "city-error" : undefined}
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
                                <SelectItem
                                  key={city.id}
                                  value={city.id.toString()}
                                >
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
                          <p id="city-error" className="text-sm text-destructive">
                            {formErrors.city}
                          </p>
                        )}
                        {isLoadingCities && (
                          <div className="absolute right-3 top-10">
                            <LoadingSpinner className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 relative" ref={subCitySelectRef}>
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
                          aria-describedby={formErrors.sub_city ? "subcity-error" : undefined}
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
                                <SelectItem
                                  key={subCity.id}
                                  value={subCity.id.toString()}
                                >
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
                          <p id="subcity-error" className="text-sm text-destructive">
                            {formErrors.sub_city}
                          </p>
                        )}
                        {formData.city && isLoadingSubCities && (
                          <div className="absolute right-3 top-10">
                            <LoadingSpinner className="h-4 w-4" />
                          </div>
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
                        placeholder="e.g., Bole Road, near Edna Mall, opposite Friendship Center"
                        className="h-12"
                        aria-describedby={formErrors.specific_location ? "location-error" : undefined}
                      />
                      {formErrors.specific_location && (
                        <p id="location-error" className="text-sm text-destructive">
                          {formErrors.specific_location}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Be specific to help potential buyers find your property
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
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
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Navigation className="h-5 w-5 text-primary" />
                          Exact Coordinates (Auto-Fill Location)
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
                      <p className="text-sm text-muted-foreground mb-4">
                        Enter coordinates to automatically fill city, sub-city, and location fields.
                        This information is only shown to verified buyers upon inquiry.
                      </p>

                      <div className="grid gap-6 md:grid-cols-2">
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
                              min="-90"
                              max="90"
                              value={formData.latitude || ''}
                              onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : undefined
                                handleInputChange('latitude', value)
                              }}
                              placeholder="e.g., 9.0320"
                              className="h-12"
                            />
                            <div className="absolute right-3 top-0 h-12 flex items-center text-muted-foreground">
                              °
                            </div>
                          </div>
                          {isGeocoding && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <LoadingSpinner className="h-3 w-3" />
                              Detecting location...
                            </p>
                          )}
                          {geocodeError && (
                            <p className="text-xs text-destructive">{geocodeError}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Between -90 (South) and 90 (North). Ethiopia is around 9°
                          </p>
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
                              min="-180"
                              max="180"
                              value={formData.longitude || ''}
                              onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : undefined
                                handleInputChange('longitude', value)
                              }}
                              placeholder="e.g., 38.7460"
                              className="h-12"
                            />
                            <div className="absolute right-3 top-0 h-12 flex items-center text-muted-foreground">
                              °
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Between -180 (West) and 180 (East). Ethiopia is around 39°
                          </p>
                        </div>
                      </div>

                      {/* Geocoding Results */}
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
                                  {geocodeResult.state && `, ${geocodeResult.state}`}
                                </p>
                              )}
                              {geocodeResult.subcity && (
                                <p className="text-xs text-green-700 dark:text-green-400">
                                  <span className="font-medium">Area:</span> {geocodeResult.subcity}
                                </p>
                              )}
                              {geocodeResult.street && (
                                <p className="text-xs text-green-700 dark:text-green-400">
                                  <span className="font-medium">Street:</span> {geocodeResult.street}
                                </p>
                              )}
                              {geocodeResult.country && (
                                <p className="text-xs text-green-700 dark:text-green-400">
                                  <span className="font-medium">Country:</span> {geocodeResult.country}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleInputChange('latitude', 9.0320)
                            handleInputChange('longitude', 38.7460)
                            setTimeout(() => {
                              autoFillLocationFromCoordinates(9.0320, 38.7460)
                            }, 100)
                          }}
                          className="flex-1 text-xs"
                        >
                          Use Addis Ababa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleInputChange('latitude', undefined)
                            handleInputChange('longitude', undefined)
                            setGeocodeResult(null)
                            setGeocodeError(null)
                          }}
                          className="flex-1 text-xs"
                        >
                          Clear Coordinates
                        </Button>
                      </div>
                    </div>

                    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-800 dark:text-blue-300">Location Privacy</AlertTitle>
                      <AlertDescription className="text-blue-700 dark:text-blue-400">
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
                    className="gap-2"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setActiveTab('details')}
                    className="gap-2"
                  >
                    Next: Details
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Property Details */}
              <TabsContent value="details" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      Property Specifications
                    </CardTitle>
                    <CardDescription>
                      Provide detailed specifications of your property
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="bedrooms" className="font-medium text-foreground">
                          Bedrooms
                        </Label>
                        <Select
                          value={formData.bedrooms?.toString() || '1'}
                          onValueChange={(value) => handleInputChange('bedrooms', parseInt(value))}
                          placeholder="Select bedrooms"
                          aria-label="Number of bedrooms"
                        >
                          <SelectContent>
                            {BEDROOM_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="bathrooms" className="font-medium text-foreground">
                          Bathrooms
                        </Label>
                        <Select
                          value={formData.bathrooms?.toString() || '1'}
                          onValueChange={(value) => handleInputChange('bathrooms', parseInt(value))}
                          placeholder="Select bathrooms"
                          aria-label="Number of bathrooms"
                        >
                          <SelectContent>
                            {BATHROOM_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="total_area" className="font-medium text-foreground">
                          Total Area (m²) *
                        </Label>
                        <div className="relative">
                          <Input
                            id="total_area"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.total_area || ''}
                            onChange={(e) => handleInputChange('total_area', parseFloat(e.target.value) || 0)}
                            placeholder="e.g., 150"
                            className="h-12 pl-12"
                            aria-describedby={formErrors.total_area ? "area-error" : undefined}
                          />
                          <div className="absolute left-3 top-0 h-12 flex items-center text-muted-foreground">
                            m²
                          </div>
                        </div>
                        {formErrors.total_area && (
                          <p id="area-error" className="text-sm text-destructive">
                            {formErrors.total_area}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="plot_size" className="font-medium text-foreground">
                          Plot Size (m²)
                        </Label>
                        <div className="relative">
                          <Input
                            id="plot_size"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.plot_size || ''}
                            onChange={(e) => handleInputChange('plot_size', parseFloat(e.target.value) || 0)}
                            placeholder="For houses and land"
                            className="h-12 pl-12"
                          />
                          <div className="absolute left-3 top-0 h-12 flex items-center text-muted-foreground">
                            m²
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="built_year" className="font-medium text-foreground">
                          Built Year
                        </Label>
                        <Input
                          id="built_year"
                          type="number"
                          min="1800"
                          max={new Date().getFullYear()}
                          value={formData.built_year || ''}
                          onChange={(e) => handleInputChange('built_year', parseInt(e.target.value))}
                          placeholder="e.g., 2020"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="floors" className="font-medium text-foreground">
                          Number of Floors
                        </Label>
                        <Input
                          id="floors"
                          type="number"
                          min="1"
                          value={formData.floors || 1}
                          onChange={(e) => handleInputChange('floors', parseInt(e.target.value))}
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="furnishing_type" className="font-medium text-foreground">
                        Furnishing Type
                      </Label>
                      <Select
                        value={formData.furnishing_type}
                        onValueChange={(value) => handleInputChange('furnishing_type', value)}
                        placeholder="Select furnishing type"
                        aria-label="Furnishing type"
                      >
                        <SelectContent>
                          {FURNISHING_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('location')}
                    className="gap-2"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setActiveTab('pricing')}
                    className="gap-2"
                  >
                    Next: Pricing
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Pricing */}
              <TabsContent value="pricing" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      {listingType === 'for_sale' ? 'Sale Price' : 'Rental Information'}
                    </CardTitle>
                    <CardDescription>
                      Set your asking price and additional costs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {listingType === 'for_sale' ? (
                      <>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium text-foreground">
                              Price Calculation
                            </Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={priceCalculationMode === 'etb' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPriceCalculationMode('etb')}
                              >
                                Enter ETB
                              </Button>
                              <Button
                                type="button"
                                variant={priceCalculationMode === 'usd' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPriceCalculationMode('usd')}
                              >
                                Enter USD
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-3">
                              <Label htmlFor="price_etb" className="font-medium text-foreground">
                                Price (ETB) *
                              </Label>
                              <div className="relative">
                                <Input
                                  id="price_etb"
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={formData.price_etb || ''}
                                  onChange={(e) => handleInputChange('price_etb', parseFloat(e.target.value) || 0)}
                                  placeholder="e.g., 5,000,000"
                                  className="h-12 pl-12"
                                  aria-describedby={formErrors.price_etb ? "price-error" : undefined}
                                  disabled={priceCalculationMode === 'usd'}
                                />
                                <div className="absolute left-3 top-0 h-12 flex items-center font-medium">
                                  ETB
                                </div>
                                {priceCalculationMode === 'usd' && (
                                  <div className="absolute right-3 top-0 h-12 flex items-center">
                                    <Calculator className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              {formErrors.price_etb && (
                                <p id="price-error" className="text-sm text-destructive">
                                  {formErrors.price_etb}
                                </p>
                              )}
                            </div>

                            <div className="space-y-3">
                              <Label htmlFor="price_usd" className="font-medium text-foreground">
                                Price (USD)
                              </Label>
                              <div className="relative">
                                <Input
                                  id="price_usd"
                                  type="number"
                                  min="0"
                                  step="100"
                                  value={formData.price_usd || ''}
                                  onChange={(e) => handleInputChange('price_usd', parseFloat(e.target.value) || 0)}
                                  placeholder="e.g., 90,000"
                                  className="h-12 pl-12"
                                  disabled={priceCalculationMode === 'etb'}
                                />
                                <div className="absolute left-3 top-0 h-12 flex items-center font-medium">
                                  $
                                </div>
                                {priceCalculationMode === 'etb' && (
                                  <div className="absolute right-3 top-0 h-12 flex items-center">
                                    <Calculator className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Exchange rate: 1 USD = {USD_TO_ETB_RATE} ETB
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="property_tax" className="font-medium text-foreground">
                            Annual Property Tax (ETB)
                          </Label>
                          <div className="relative">
                            <Input
                              id="property_tax"
                              type="number"
                              min="0"
                              step="100"
                              value={formData.property_tax || ''}
                              onChange={(e) => handleInputChange('property_tax', parseFloat(e.target.value) || 0)}
                              placeholder="e.g., 10,000"
                              className="h-12 pl-12"
                            />
                            <div className="absolute left-3 top-0 h-12 flex items-center font-medium">
                              ETB
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-3">
                            <Label htmlFor="monthly_rent" className="font-medium text-foreground">
                              Monthly Rent (ETB) *
                            </Label>
                            <div className="relative">
                              <Input
                                id="monthly_rent"
                                type="number"
                                min="0"
                                step="1000"
                                value={formData.monthly_rent || ''}
                                onChange={(e) => handleInputChange('monthly_rent', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 15,000"
                                className="h-12 pl-12"
                                aria-describedby={formErrors.monthly_rent ? "rent-error" : undefined}
                              />
                              <div className="absolute left-3 top-0 h-12 flex items-center font-medium">
                                ETB
                              </div>
                            </div>
                            {formErrors.monthly_rent && (
                              <p id="rent-error" className="text-sm text-destructive">
                                {formErrors.monthly_rent}
                              </p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="security_deposit" className="font-medium text-foreground">
                              Security Deposit (ETB)
                            </Label>
                            <div className="relative">
                              <Input
                                id="security_deposit"
                                type="number"
                                min="0"
                                step="1000"
                                value={formData.security_deposit || ''}
                                onChange={(e) => handleInputChange('security_deposit', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 30,000"
                                className="h-12 pl-12"
                              />
                              <div className="absolute left-3 top-0 h-12 flex items-center font-medium">
                                ETB
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-3">
                            <Label htmlFor="maintenance_fee" className="font-medium text-foreground">
                              Monthly Maintenance (ETB)
                            </Label>
                            <div className="relative">
                              <Input
                                id="maintenance_fee"
                                type="number"
                                min="0"
                                step="100"
                                value={formData.maintenance_fee || ''}
                                onChange={(e) => handleInputChange('maintenance_fee', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 2,000"
                                className="h-12 pl-12"
                              />
                              <div className="absolute left-3 top-0 h-12 flex items-center font-medium">
                                ETB
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="property_tax" className="font-medium text-foreground">
                              Property Tax (ETB/year)
                            </Label>
                            <div className="relative">
                              <Input
                                id="property_tax"
                                type="number"
                                min="0"
                                step="100"
                                value={formData.property_tax || ''}
                                onChange={(e) => handleInputChange('property_tax', parseFloat(e.target.value) || 0)}
                                placeholder="e.g., 10,000"
                                className="h-12 pl-12"
                              />
                              <div className="absolute left-3 top-0 h-12 flex items-center font-medium">
                                ETB
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {formErrors.price && (
                      <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertTitle className="text-amber-800 dark:text-amber-300">Price Check</AlertTitle>
                        <AlertDescription className="text-amber-700 dark:text-amber-400">
                          {formErrors.price}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                      <Switch
                        id="price_negotiable"
                        checked={formData.price_negotiable}
                        onCheckedChange={(checked) => handleInputChange('price_negotiable', checked)}
                        aria-label="Price negotiable"
                      />
                      <div>
                        <Label htmlFor="price_negotiable" className="font-medium cursor-pointer text-foreground">
                          Price is negotiable
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Allow potential buyers/renters to negotiate the price
                        </p>
                      </div>
                    </div>

                    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle className="text-blue-800 dark:text-blue-300">Pricing Tips</AlertTitle>
                      <AlertDescription className="text-blue-700 dark:text-blue-400">
                        {listingType === 'for_sale'
                          ? 'Research similar properties in your area for competitive pricing. Consider market trends and property condition.'
                          : 'Include all monthly costs. Security deposit is typically 1-2 months rent.'}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('details')}
                    className="gap-2"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setActiveTab('features')}
                    className="gap-2"
                  >
                    Next: Features
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Features & Amenities */}
              <TabsContent value="features" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-primary" />
                      Features & Amenities
                    </CardTitle>
                    <CardDescription>
                      Select all the features and amenities your property offers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Basic Features */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-foreground">Basic Features</h3>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                        {AMENITIES.map((amenity) => (
                          <div
                            key={amenity.id}
                            className={cn(
                              "relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary hover:bg-primary/5",
                              formData[amenity.key as keyof PropertyFormData]
                                ? "border-primary bg-primary/10"
                                : "border-border"
                            )}
                            onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleBooleanToggle(amenity.key as keyof PropertyFormData)
                              }
                            }}
                            aria-label={`${amenity.name} - ${formData[amenity.key as keyof PropertyFormData] ? 'Selected' : 'Not selected'}`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-2xl" aria-hidden="true">{amenity.icon}</span>
                              <span className="text-center text-sm font-medium text-foreground">
                                {amenity.name}
                              </span>
                            </div>
                            {formData[amenity.key as keyof PropertyFormData] && (
                              <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                <CheckCircle className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Additional Amenities */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-foreground">Additional Amenities</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Select amenities available in your property or building complex
                      </p>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                        {amenitiesList.map((amenity) => (
                          <div key={amenity.id} className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => handleAmenityToggle(amenity.id)}
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded border",
                                formData.amenities?.includes(amenity.id)
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border"
                              )}
                              aria-label={`Toggle ${amenity.name}`}
                            >
                              {formData.amenities?.includes(amenity.id) && (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                            <Label className="cursor-pointer text-foreground">
                              <div className="font-medium">{amenity.name}</div>
                              {amenity.name_amharic && (
                                <div className="text-sm text-muted-foreground">{amenity.name_amharic}</div>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Documentation */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-foreground">Property Documents</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Indicate which documents are available (increases buyer confidence)
                      </p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {DOCUMENTS.map((doc) => (
                          <div
                            key={doc.id}
                            className={cn(
                              "cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary hover:bg-primary/5",
                              formData[doc.key as keyof PropertyFormData]
                                ? "border-primary bg-primary/10"
                                : "border-border"
                            )}
                            onClick={() => handleBooleanToggle(doc.key as keyof PropertyFormData)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleBooleanToggle(doc.key as keyof PropertyFormData)
                              }
                            }}
                            aria-label={`${doc.name} - ${formData[doc.key as keyof PropertyFormData] ? 'Available' : 'Not available'}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full",
                                formData[doc.key as keyof PropertyFormData]
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              )}>
                                <CheckCircle className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{doc.name}</div>
                                <div className="text-sm text-muted-foreground">{doc.description}</div>
                              </div>
                            </div>
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
                    className="gap-2"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setActiveTab('media')}
                    className="gap-2"
                  >
                    Next: Media
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Media */}
              <TabsContent value="media" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      Photos & Videos
                    </CardTitle>
                    <CardDescription>
                      Upload high-quality media to showcase your property
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Images Upload */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Property Photos *</h3>
                          <p className="text-sm text-muted-foreground">
                            Upload at least 5 high-quality photos. First image will be the cover.
                          </p>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {formData.images?.filter(img => isFile(img)).length || 0}/20 photos
                        </span>
                      </div>

                      {formErrors.images && (
                        <p className="text-sm text-destructive mb-4">
                          {formErrors.images}
                        </p>
                      )}

                      <div className="space-y-4">
                        {/* Image Upload Area */}
                        <div className="border-3 border-dashed border-border rounded-xl p-8 text-center transition-colors hover:border-primary">
                          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="mb-2 text-lg font-medium text-foreground">Drag & drop images here</p>
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

                          <div
                            className="cursor-pointer mt-4"
                            onClick={() => document.getElementById('images')?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                document.getElementById('images')?.click()
                              }
                            }}
                          >
                            <span className="text-sm text-primary hover:underline">Click here to select images</span>
                          </div>
                        </div>

                        {/* Image Previews */}
                        {formData.images && formData.images.length > 0 && (
                          <div>
                            <h4 className="mb-3 font-medium text-foreground">Uploaded Photos</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Drag to reorder images. First image will be used as cover.
                            </p>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                              {formData.images.map((image, index) => {
                                const imageUrl = getImageUrl(image)
                                const isFileImage = isFile(image)

                                return (
                                  <div
                                    key={index}
                                    className="relative group"
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
                                    <div className="aspect-square overflow-hidden rounded-lg border border-border bg-muted/30">
                                      {imageUrl ? (
                                        <img
                                          src={imageUrl}
                                          alt={`Property image ${index + 1}`}
                                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                        />
                                      ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="absolute top-2 left-2 flex gap-1">
                                      {isFileImage && (
                                        <div
                                          className="h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center cursor-move"
                                          draggable
                                          onDragStart={() => setDraggedIndex(index)}
                                          aria-label="Drag to reorder"
                                        >
                                          <GripVertical className="h-3 w-3" />
                                        </div>
                                      )}
                                      {index === 0 && (
                                        <Badge className="bg-primary">
                                          Cover
                                        </Badge>
                                      )}
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="destructive"
                                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                      onClick={() => handleRemoveFile('images', index)}
                                      aria-label={`Remove image ${index + 1}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>

                                    {!isFileImage && image.isPlaceholder && (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                                        <span className="text-xs text-white text-center p-2">
                                          Re-upload needed
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Video Upload */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-foreground">Video Tour</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Upload a video tour of your property (optional, up to 100MB)
                      </p>

                      {formData.property_video ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted">
                            <div className="flex items-center gap-3">
                              <Video className="h-5 w-5 text-primary" />
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile('property_video')}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label="Remove video"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {isFile(formData.property_video) && (
                            <video
                              src={URL.createObjectURL(formData.property_video)}
                              controls
                              className="w-full rounded-lg"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                          <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <p className="mb-2 font-medium text-foreground">Upload property video tour</p>
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

                          <div
                            className="cursor-pointer mt-4"
                            onClick={() => document.getElementById('property_video')?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                document.getElementById('property_video')?.click()
                              }
                            }}
                          >
                            <span className="text-sm text-primary hover:underline">Click here to select video</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Virtual Tour */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-foreground">Virtual Tour Link</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Add a link to 3D virtual tour (Matterport, Kuula, etc.)
                      </p>
                      <Input
                        type="url"
                        value={formData.virtual_tour_url || ''}
                        onChange={(e) => handleInputChange('virtual_tour_url', e.target.value)}
                        placeholder="https://my.matterport.com/show/..."
                        className="h-12"
                      />
                    </div>

                    <Separator />

                    {/* Document Upload */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-foreground">Additional Documents</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Upload floor plans, contracts, or other documents (optional)
                      </p>

                      {formData.documents && formData.documents.length > 0 && (
                        <div className="mb-4 space-y-3">
                          {formData.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-foreground">{doc.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {(doc.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile('documents', index)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                aria-label={`Remove document ${doc.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="mb-2 font-medium text-foreground">Upload additional documents</p>
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

                        <div
                          className="cursor-pointer mt-4"
                          onClick={() => document.getElementById('documents')?.click()}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              document.getElementById('documents')?.click()
                            }
                          }}
                        >
                          <span className="text-sm text-primary hover:underline">Click here to select documents</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* In the Media tab footer - Update the submit button section */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('features')}
                    className="gap-2"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Previous
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      className="gap-2"
                      aria-label="Save draft"
                    >
                      <Save className="h-4 w-4" />
                      Save Draft
                    </Button>
                    {/* Update the submit button text */}
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={cn(
                        "gap-2 min-w-[200px]",
                        selectedPromotionTier !== 'basic' && "bg-green-600 hover:bg-green-700"
                      )}
                      aria-label={
                        isSubmitting
                          ? "Processing..."
                          : selectedPromotionTier === 'basic'
                            ? "List property for free"
                            : `Create & Pay - ${promotionPrice.toLocaleString()} ETB`
                      }
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
                          Create & Pay Now
                          <span className="ml-2 font-bold">{promotionPrice.toLocaleString()} ETB</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Preview & Tips */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="top-6 border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Listing Preview</CardTitle>
                <CardDescription>
                  This is how your property will appear to buyers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {formData.images && formData.images.length > 0 ? (
                    <img
                      src={getImageUrl(formData.images[0]) || ''}
                      alt="Property preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg truncate text-foreground">
                    {formData.title || 'Your property title'}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {formData.specific_location || 'Location will appear here'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-xl font-bold text-foreground">{formData.bedrooms || 0}</div>
                    <div className="text-xs text-muted-foreground">Bedrooms</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-xl font-bold text-foreground">{formData.bathrooms || 0}</div>
                    <div className="text-xs text-muted-foreground">Bathrooms</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-xl font-bold text-foreground">{formData.total_area || 0}</div>
                    <div className="text-xs text-muted-foreground">m²</div>
                  </div>
                </div>

                <div className="text-2xl font-bold text-primary">
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
                  <Badge variant="outline" className="capitalize">
                    {formData.property_type?.replace('_', ' ') || 'house'}
                  </Badge>
                  <Badge variant="outline">
                    {listingType === 'for_sale' ? 'For Sale' : 'For Rent'}
                  </Badge>
                  {selectedPromotionTier !== 'basic' && (
                    <Badge className={cn(getTierColor(selectedPromotionTier))}>
                      {selectedPromotionTier === 'standard' ? 'Promoted' : 'Premium'}
                    </Badge>
                  )}
                </div>

                {selectedPromotionTier !== 'basic' ? (
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900 mt-4">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-300">Auto-Approval</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      Your listing will be automatically approved and go live immediately.
                    </AlertDescription>
                  </Alert>
                ) : (user?.is_staff || user?.is_superuser) ? (
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900 mt-4">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-300">Admin Listing</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      Your listing will be immediately published as an admin.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900 mt-4">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-800 dark:text-amber-300">Pending Approval</AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-400">
                      Your listing requires admin approval before going live (usually within 24 hours).
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
              <CardHeader>
                <CardTitle className="text-blue-800 dark:text-blue-300">Listing Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Use natural daylight for photos',
                  'Clean and declutter before taking photos',
                  'Highlight unique features in description',
                  'Be responsive to inquiries',
                  'Price competitively based on market'
                ].map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-400">{tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}