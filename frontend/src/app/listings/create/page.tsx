// app/listings/create/page.tsx - FIXED VERSION
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
import { subscriptionApi } from '@/lib/api/subscriptions' // ADD THIS IMPORT
import { PropertyFormData } from '@/lib/types/property'
import { UserSubscription } from '@/lib/types/subscription' // ADD THIS IMPORT
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'
import Header from '@/components/common/Header/Header'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import {
  PROPERTY_TYPES,
  LISTING_TYPES,
  FURNISHING_TYPES,
  BEDROOM_OPTIONS,
  BATHROOM_OPTIONS
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
  Square
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

const PROMOTION_TIERS = [
  {
    id: 'basic',
    name: 'Basic (Free)',
    description: 'Limited visibility - hidden after page 3 in search',
    price: 0,
    features: [
      'Appears in general search results',
      'Standard property card',
      'No priority placement',
      'Hidden after 3rd page in search'
    ],
    warning: 'Your property will have very low visibility',
    recommended: false
  },
  {
    id: 'standard',
    name: 'Standard Promotion',
    description: 'Good visibility for serious sellers',
    prices: {
      '7_days': 2500,
      '30_days': 5000,
      '90_days': 12000
    },
    features: [
      'Top 20 in search results',
      'Email notification to matching buyers',
      'Basic analytics',
      '30-day visibility guarantee'
    ],
    recommended: true,
    popular: true,
    discount_30_days: 17 // ADD THIS: (2500*4 - 5000) / (2500*4) * 100 ≈ 17%
  },
  {
    id: 'featured',
    name: 'Featured Listing',
    description: 'Maximum exposure for fast selling',
    prices: {
      '7_days': 7500,
      '30_days': 15000,
      '90_days': 35000
    },
    features: [
      'Top 5 in search results',
      'Featured badge',
      'Homepage carousel',
      'Priority email blasts',
      'Social media mention',
      'Detailed analytics'
    ],
    recommended: false,
    popular: false,
    discount_30_days: 50 // ADD THIS: (7500*4 - 15000) / (7500*4) * 100 = 50%
  },
  {
    id: 'premium',
    name: 'Premium Package',
    description: 'All-in-one marketing solution',
    prices: {
      '7_days': 15000,
      '30_days': 30000,
      '90_days': 70000
    },
    features: [
      'TOP position in search',
      'Homepage featured section',
      'Dedicated email campaign',
      'Social media advertising',
      'Professional photography included',
      'Virtual tour creation',
      'Priority 24/7 support'
    ],
    recommended: false,
    popular: false,
    discount_30_days: 50 // ADD THIS: (15000*4 - 30000) / (15000*4) * 100 = 50%
  }
];

export default function CreateListingPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('basic')
  const [listingType, setListingType] = useState<'for_sale' | 'for_rent'>('for_sale')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    promotionTier: 'basic',  // Default to basic
    promotionDuration: 30,  // Default 30 days
    promotionPrice: 0,
    promotionFeatures: [],
  })

  // Fetch cities and amenities
  const { data: citiesData, isLoading: isLoadingCities, error: citiesError } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      try {
        const data = await listingsApi.getCities()
        console.log('Cities fetched:', data)
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
        console.log('SubCities fetched:', data)
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

  // ADD THIS: Fetch user subscription
  const { data: userSubscription, isLoading: isLoadingSubscription } = useQuery<UserSubscription | null>({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      try {
        const data = await subscriptionApi.getCurrentSubscription()
        return data
      } catch (error) {
        // If no subscription found, return null
        return null
      }
    },
    enabled: isAuthenticated,
  })

  const cities = Array.isArray(citiesData) ? citiesData : []
  const subCities = Array.isArray(subCitiesData) ? subCitiesData : []
  const amenitiesList = Array.isArray(amenitiesData) ? amenitiesData : []

  // Create property mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => listingsApi.createProperty(data),
    onMutate: () => {
      setIsSubmitting(true)
    },
    onSuccess: (data) => {
      toast.success('Property listed successfully!')
      router.push(`/listings/${data.id}`)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.detail ||
        'Failed to list property'
      toast.error(errorMessage)
      console.error('Create property error:', error)
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/listings/create')
    }
  }, [isAuthenticated, router])

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }))

    // Clear subcity when city changes
    if (field === 'city' && value !== formData.city) {
      setFormData(prevData => ({ ...prevData, sub_city: undefined }))
    }
    
    if (field === 'promotionTier' && value) {
      const duration = formData.promotionDuration || 30;
      const price = calculatePrice(value, duration);
      setFormData(prevData => ({
        ...prevData,
        promotionPrice: price
      }));
    }

    // When duration changes, update price
    if (field === 'promotionDuration' && value) {
      const tier = formData.promotionTier || 'basic';
      const price = calculatePrice(tier, value);
      setFormData(prevData => ({
        ...prevData,
        promotionPrice: price
      }));
    }
  }

  const calculatePrice = (tier: string, duration: number): number => {
    const tierData = PROMOTION_TIERS.find(t => t.id === tier);
    
    // Handle basic (free) tier
    if (!tierData || tier === 'basic') return 0;

    // Handle free tier case - no prices object
    if (!tierData.prices) return 0;

    const durationKey =
      duration <= 7 ? '7_days' :
      duration <= 30 ? '30_days' : '90_days';

    let price = tierData.prices[durationKey];

    // Apply subscription discount
    if (userSubscription?.is_active && userSubscription.plan) {
      const discount = userSubscription.plan.property_discount / 100;
      price = price * (1 - discount);
    }

    return Math.round(price);
  };

  const handleFileUpload = (field: 'images' | 'documents' | 'property_video', file: File) => {
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
  }

  const handleRemoveFile = (field: 'images' | 'documents' | 'property_video', index?: number) => {
    if (field === 'property_video') {
      setFormData(prev => ({ ...prev, property_video: undefined }))
    } else if (field === 'images' && index !== undefined) {
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
  }

  const handleBooleanToggle = (field: keyof PropertyFormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const validateForm = (): boolean => {
    const errors: string[] = []

    if (!formData.title?.trim()) errors.push('Property title is required')
    if (!formData.description?.trim()) errors.push('Description is required')
    if (!formData.city) errors.push('Please select a city')
    if (!formData.sub_city) errors.push('Please select a sub-city')
    if (!formData.specific_location?.trim()) errors.push('Specific location is required')
    if (!formData.total_area || formData.total_area <= 0) errors.push('Valid total area is required')

    if (listingType === 'for_sale') {
      if (!formData.price_etb || formData.price_etb <= 0) errors.push('Valid price is required')
    } else {
      if (!formData.monthly_rent || formData.monthly_rent <= 0) errors.push('Valid monthly rent is required')
    }

    if ((formData.images?.length || 0) === 0) errors.push('At least one image is required')

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      // Create FormData
      const formDataObj = new FormData()

      // Basic information
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

      // Location
      formDataObj.append('city', formData.city!.toString())
      formDataObj.append('sub_city', formData.sub_city!.toString())
      formDataObj.append('specific_location', formData.specific_location!)
      if (formData.address_line_1) {
        formDataObj.append('address_line_1', formData.address_line_1)
      }
      if (formData.address_line_2) {
        formDataObj.append('address_line_2', formData.address_line_2)
      }

      // Specifications
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

      // Pricing
      if (listingType === 'for_sale') {
        formDataObj.append('price_etb', formData.price_etb!.toString())
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

      // Features
      AMENITIES.forEach(amenity => {
        const value = formData[amenity.key as keyof PropertyFormData]
        if (typeof value === 'boolean') {
          formDataObj.append(amenity.key, value ? 'true' : 'false')
        }
      })

      // Amenities
      formData.amenities?.forEach(amenityId => {
        formDataObj.append('amenities', amenityId.toString())
      })

      // Documentation
      DOCUMENTS.forEach(doc => {
        const value = formData[doc.key as keyof PropertyFormData]
        if (typeof value === 'boolean') {
          formDataObj.append(doc.key, value ? 'true' : 'false')
        }
      })

      // Media - Images
      formData.images?.forEach((image, index) => {
        formDataObj.append(`images`, image)
      })

      // Video
      if (formData.property_video) {
        formDataObj.append('property_video', formData.property_video)
      }

      if (formData.virtual_tour_url) {
        formDataObj.append('virtual_tour_url', formData.virtual_tour_url)
      }

      // Additional files
      formData.documents?.forEach((doc, index) => {
        formDataObj.append(`documents`, doc)
      })

      // Status
      formDataObj.append('is_premium', formData.is_premium ? 'true' : 'false')

      // Promotion data - FIXED: Check if promotionTier exists and is not 'basic'
      if (formData.promotionTier && formData.promotionTier !== 'basic') {
        formDataObj.append('promotion_tier', formData.promotionTier);
        formDataObj.append('promotion_duration', (formData.promotionDuration || 30).toString());
        formDataObj.append('promotion_price', (formData.promotionPrice || 0).toString());
        formDataObj.append('is_premium', 'true');
      } else {
        formDataObj.append('is_premium', formData.is_premium ? 'true' : 'false');
      }

      // Submit
      createMutation.mutate(formDataObj)

    } catch (error) {
      console.error('Error preparing form data:', error)
      toast.error('Error preparing form data. Please try again.')
    }
  }

  const handleSaveDraft = () => {
    // Save form data to localStorage
    localStorage.setItem('property_draft', JSON.stringify(formData))
    toast.success('Draft saved successfully!')
  }

  const handleLoadDraft = () => {
    const draft = localStorage.getItem('property_draft')
    if (draft) {
      setFormData(JSON.parse(draft))
      toast.success('Draft loaded successfully!')
    } else {
      toast.error('No draft found')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner fullScreen />
      </div>
    )
  }

  // Calculate progress
  const progress = {
    basic: formData.title && formData.description && formData.property_type ? 100 : 0,
    location: formData.city && formData.sub_city && formData.specific_location ? 100 : 0,
    details: formData.bedrooms && formData.total_area ? 100 : 0,
    pricing: (listingType === 'for_sale' ? formData.price_etb : formData.monthly_rent) ? 100 : 0,
    features: true,
    media: (formData.images?.length || 0) > 0 ? 100 : 0,
    promotion: formData.promotionTier ? 100 : 0,
  }

  const totalProgress = Math.round(
    Object.values(progress).filter(p => typeof p === 'number').reduce((a, b) => a + b, 0) / 7
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      <div className="container max-w-7xl py-6 px-4 sm:px-6">
        {/* Progress Header */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {listingType === 'for_sale' ? 'Sell Your Property' : 'Rent Your Property'}
              </h1>
              <p className="text-gray-600 mt-1">
                Fill in the details below to list your property
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadDraft}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Load Draft
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Completion: {totalProgress}%
              </span>
              <span className="text-sm text-gray-500">
                {Object.values(progress).filter(p => p === 100).length}/7 sections
              </span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all duration-500 ease-out"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-7 gap-2 text-xs text-gray-500">
              {['Basic', 'Location', 'Details', 'Pricing', 'Features', 'Media', 'Promotion'].map((label, index) => (
                <div
                  key={label}
                  className={`text-center ${progress[Object.keys(progress)[index] as keyof typeof progress] === 100
                    ? 'text-green-600 font-semibold'
                    : ''
                    }`}
                >
                  {label}
                </div>
              ))}
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
              <div className="sticky top-0 z-10 bg-white border-b pb-2">
                <TabsList className="grid w-full grid-cols-7 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger
                    value="basic"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Basic
                  </TabsTrigger>
                  <TabsTrigger
                    value="location"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Location
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="pricing"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger
                    value="features"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Features
                  </TabsTrigger>
                  <TabsTrigger
                    value="media"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    Media
                  </TabsTrigger>

                  <TabsTrigger value="promotion" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Promotion
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-gray-200 shadow-sm">
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
                      <Label className="mb-3 block">What do you want to do? *</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={listingType === 'for_sale' ? 'default' : 'outline'}
                          className="h-16 text-base"
                          onClick={() => {
                            setListingType('for_sale')
                            handleInputChange('listing_type', 'for_sale')
                          }}
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
                        >
                          <Home className="mr-2 h-5 w-5" />
                          Rent Property
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="title" className="font-medium">
                          Property Title *
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Modern 3-bedroom apartment in Bole"
                          className="h-12"
                        />
                        <p className="text-xs text-gray-500">
                          Be descriptive and specific
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="title_amharic" className="font-medium">
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
                      <Label htmlFor="property_type" className="font-medium">
                        Property Type *
                      </Label>
                      <div className="relative" ref={citySelectRef}>
                        <Select
                          value={formData.property_type}
                          onValueChange={(value) => handleInputChange('property_type', value)}
                        >
                          <SelectTrigger className="h-12 w-full">
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                          <SelectContent
                            className="w-full max-h-60 overflow-auto"
                            position="popper"
                            align="start"
                            sideOffset={5}
                          >
                            {PROPERTY_TYPES.map((type) => (
                              <SelectItem
                                key={type.value}
                                value={type.value}
                                className="py-3"
                              >
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description" className="font-medium">
                        Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your property in detail. Include key features, condition, nearby amenities, and what makes it special..."
                        className="min-h-32"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Be as detailed as possible</span>
                        <span>{formData.description?.length || 0}/2000 characters</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description_amharic" className="font-medium">
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

              {/* Location */}
              <TabsContent value="location" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Location Details
                    </CardTitle>
                    <CardDescription>
                      Tell us where your property is located
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* City and SubCity Select */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3 relative" ref={citySelectRef}>
                        <Label htmlFor="city" className="font-medium">
                          City *
                        </Label>
                        <Select
                          value={formData.city?.toString() || ''}
                          onValueChange={(value) => {
                            handleInputChange('city', parseInt(value))
                          }}
                          disabled={isLoadingCities}
                        >
                          <SelectTrigger className="h-12 w-full">
                            <SelectValue placeholder={
                              isLoadingCities ? "Loading cities..." : "Select city"
                            } />
                          </SelectTrigger>
                          <SelectContent
                            className="w-full max-h-60 overflow-auto"
                            position="popper"
                            align="start"
                            sideOffset={5}
                          >
                            {/* FIX: Use proper values for disabled items */}
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
                                  className="py-3"
                                >
                                  <div className="flex flex-col">
                                    <span>{city.name}</span>
                                    <span className="text-xs text-gray-500">{city.name_amharic}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {isLoadingCities && (
                          <div className="absolute right-3 top-10">
                            <LoadingSpinner className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 relative" ref={subCitySelectRef}>
                        <Label htmlFor="sub_city" className="font-medium">
                          Sub-City *
                        </Label>
                        <Select
                          value={formData.sub_city?.toString() || ''}
                          onValueChange={(value) => {
                            handleInputChange('sub_city', parseInt(value))
                          }}
                          disabled={!formData.city || isLoadingSubCities}
                        >
                          <SelectTrigger className="h-12 w-full">
                            <SelectValue placeholder={
                              !formData.city
                                ? "Select city first"
                                : isLoadingSubCities
                                  ? "Loading..."
                                  : "Select sub-city"
                            } />
                          </SelectTrigger>
                          <SelectContent
                            className="w-full max-h-60 overflow-auto"
                            position="popper"
                            align="start"
                            sideOffset={5}
                          >
                            {/* FIX: Use proper values for disabled items */}
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
                                  className="py-3"
                                >
                                  <div className="flex flex-col">
                                    <span>{subCity.name}</span>
                                    <span className="text-xs text-gray-500">{subCity.name_amharic}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {formData.city && isLoadingSubCities && (
                          <div className="absolute right-3 top-10">
                            <LoadingSpinner className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="specific_location" className="font-medium">
                        Specific Location *
                      </Label>
                      <Input
                        id="specific_location"
                        value={formData.specific_location || ''}
                        onChange={(e) => handleInputChange('specific_location', e.target.value)}
                        placeholder="e.g., Bole Road, near Edna Mall, opposite Friendship Center"
                        className="h-12"
                      />
                      <p className="text-xs text-gray-500">
                        Be specific to help potential buyers find your property
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="address_line_1" className="font-medium">
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
                        <Label htmlFor="address_line_2" className="font-medium">
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

                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">Location Privacy</AlertTitle>
                      <AlertDescription className="text-blue-700">
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
                <Card className="border-gray-200 shadow-sm">
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
                        <Label htmlFor="bedrooms" className="font-medium">
                          Bedrooms
                        </Label>
                        <Select
                          value={formData.bedrooms?.toString() || '1'}
                          onValueChange={(value) => handleInputChange('bedrooms', parseInt(value))}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select bedrooms" />
                          </SelectTrigger>
                          <SelectContent
                            className="max-h-60 overflow-auto"
                            position="popper"
                            align="start"
                            sideOffset={5}
                          >
                            {BEDROOM_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="bathrooms" className="font-medium">
                          Bathrooms
                        </Label>
                        <Select
                          value={formData.bathrooms?.toString() || '1'}
                          onValueChange={(value) => handleInputChange('bathrooms', parseInt(value))}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select bathrooms" />
                          </SelectTrigger>
                          <SelectContent
                            className="max-h-60 overflow-auto"
                            position="popper"
                            align="start"
                            sideOffset={5}
                          >
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
                        <Label htmlFor="total_area" className="font-medium">
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
                          />
                          <div className="absolute left-3 top-0 h-12 flex items-center text-gray-500">
                            m²
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="plot_size" className="font-medium">
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
                          <div className="absolute left-3 top-0 h-12 flex items-center text-gray-500">
                            m²
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="built_year" className="font-medium">
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
                        <Label htmlFor="floors" className="font-medium">
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
                      <Label htmlFor="furnishing_type" className="font-medium">
                        Furnishing Type
                      </Label>
                      <Select
                        value={formData.furnishing_type}
                        onValueChange={(value) => handleInputChange('furnishing_type', value)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select furnishing type" />
                        </SelectTrigger>
                        <SelectContent
                          className="max-h-60 overflow-auto"
                          position="popper"
                          align="start"
                          sideOffset={5}
                        >
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
                <Card className="border-gray-200 shadow-sm">
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
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-3">
                            <Label htmlFor="price_etb" className="font-medium">
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
                              />
                              <div className="absolute left-3 top-0 h-12 flex items-center font-medium">
                                ETB
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="price_usd" className="font-medium">
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
                              />
                              <div className="absolute left-3 top-0 h-12 flex items-center font-medium">
                                $
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="property_tax" className="font-medium">
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
                            <Label htmlFor="monthly_rent" className="font-medium">
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
                              />
                              <div className="absolute left-3 top-0 h-12 flex items-center font-medium">
                                ETB
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label htmlFor="security_deposit" className="font-medium">
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
                            <Label htmlFor="maintenance_fee" className="font-medium">
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
                            <Label htmlFor="property_tax" className="font-medium">
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

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Switch
                        id="price_negotiable"
                        checked={formData.price_negotiable}
                        onCheckedChange={(checked) => handleInputChange('price_negotiable', checked)}
                      />
                      <div>
                        <Label htmlFor="price_negotiable" className="font-medium cursor-pointer">
                          Price is negotiable
                        </Label>
                        <p className="text-sm text-gray-500">
                          Allow potential buyers/renters to negotiate the price
                        </p>
                      </div>
                    </div>

                    <Alert className="bg-amber-50 border-amber-200">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800">Pricing Tips</AlertTitle>
                      <AlertDescription className="text-amber-700">
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
                <Card className="border-gray-200 shadow-sm">
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
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Basic Features</h3>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                        {AMENITIES.map((amenity) => (
                          <div
                            key={amenity.id}
                            className={cn(
                              "relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary hover:bg-primary/5",
                              formData[amenity.key as keyof PropertyFormData]
                                ? "border-primary bg-primary/10"
                                : "border-gray-200"
                            )}
                            onClick={() => handleBooleanToggle(amenity.key as keyof PropertyFormData)}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-2xl">{amenity.icon}</span>
                              <span className="text-center text-sm font-medium">
                                {amenity.name}
                              </span>
                            </div>
                            {formData[amenity.key as keyof PropertyFormData] && (
                              <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center">
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
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Additional Amenities</h3>
                      <p className="mb-4 text-sm text-gray-600">
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
                                  ? "border-primary bg-primary text-white"
                                  : "border-gray-300"
                              )}
                            >
                              {formData.amenities?.includes(amenity.id) && (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                            <Label className="cursor-pointer">
                              <div className="font-medium">{amenity.name}</div>
                              {amenity.name_amharic && (
                                <div className="text-sm text-gray-500">{amenity.name_amharic}</div>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Documentation */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Property Documents</h3>
                      <p className="mb-4 text-sm text-gray-600">
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
                                : "border-gray-200"
                            )}
                            onClick={() => handleBooleanToggle(doc.key as keyof PropertyFormData)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full",
                                formData[doc.key as keyof PropertyFormData]
                                  ? "bg-primary text-white"
                                  : "bg-gray-100"
                              )}>
                                <CheckCircle className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium">{doc.name}</div>
                                <div className="text-sm text-gray-500">{doc.description}</div>
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
                <Card className="border-gray-200 shadow-sm">
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
                          <h3 className="text-lg font-semibold text-gray-900">Property Photos *</h3>
                          <p className="text-sm text-gray-600">
                            Upload at least 5 high-quality photos. First image will be the cover.
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {formData.images?.length || 0}/20 photos
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Image Upload Area */}
                        <div className="border-3 border-dashed border-gray-300 rounded-xl p-8 text-center transition-colors hover:border-primary">
                          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="mb-2 text-lg font-medium">Drag & drop images here</p>
                          <p className="text-sm text-gray-600 mb-6">
                            or click to browse files (PNG, JPG, WEBP up to 10MB each)
                          </p>

                          {/* FIXED: Proper file input setup */}
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
                          <label htmlFor="images">
                            <div className="cursor-pointer">
                              <Button type="button" variant="outline" className="gap-2">
                                <Upload className="h-4 w-4" />
                                Select Images
                              </Button>
                            </div>
                          </label>

                          {/* Optional: Add direct click handler for the entire area */}
                          <div
                            className="cursor-pointer mt-4"
                            onClick={() => document.getElementById('images')?.click()}
                          >
                            <span className="text-sm text-primary hover:underline">Click here to select images</span>
                          </div>
                        </div>

                        {/* Image Previews */}
                        {formData.images && formData.images.length > 0 && (
                          <div>
                            <h4 className="mb-3 font-medium">Uploaded Photos</h4>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                              {formData.images.map((image, index) => (
                                <div key={index} className="relative group">
                                  <div className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                                    <img
                                      src={URL.createObjectURL(image)}
                                      alt={`Property image ${index + 1}`}
                                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                    />
                                  </div>
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                    onClick={() => handleRemoveFile('images', index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  {index === 0 && (
                                    <Badge className="absolute top-2 left-2 bg-primary">
                                      Cover
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Video Upload */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Video Tour</h3>
                      <p className="mb-4 text-sm text-gray-600">
                        Upload a video tour of your property (optional, up to 100MB)
                      </p>

                      {formData.property_video ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                              <Video className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">{formData.property_video.name}</p>
                                <p className="text-sm text-gray-500">
                                  {(formData.property_video.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile('property_video')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <video
                            src={URL.createObjectURL(formData.property_video)}
                            controls
                            className="w-full rounded-lg"
                          />
                        </div>
                      ) :
                        (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="mb-2 font-medium">Upload property video tour</p>
                            <p className="text-sm text-gray-600 mb-6">
                              MP4, MOV up to 100MB
                            </p>

                            {/* FIXED: Video file input */}
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
                            <label htmlFor="property_video">
                              <div className="cursor-pointer">
                                <Button type="button" variant="outline" className="gap-2">
                                  <Upload className="h-4 w-4" />
                                  Select Video
                                </Button>
                              </div>
                            </label>

                            <div
                              className="cursor-pointer mt-4"
                              onClick={() => document.getElementById('property_video')?.click()}
                            >
                              <span className="text-sm text-primary hover:underline">Click here to select video</span>
                            </div>
                          </div>
                        )}
                    </div>

                    <Separator />

                    {/* Virtual Tour */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Virtual Tour Link</h3>
                      <p className="mb-4 text-sm text-gray-600">
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
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">Additional Documents</h3>
                      <p className="mb-4 text-sm text-gray-600">
                        Upload floor plans, contracts, or other documents (optional)
                      </p>

                      {formData.documents && formData.documents.length > 0 && (
                        <div className="mb-4 space-y-3">
                          {formData.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <div>
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-sm text-gray-500">
                                    {(doc.size / 1024).toFixed(2)} KB
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile('documents', index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="mb-2 font-medium">Upload additional documents</p>
                        <p className="text-sm text-gray-600 mb-6">
                          PDF, DOC, XLS up to 20MB each
                        </p>

                        {/* FIXED: Document file input */}
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
                        <label htmlFor="documents">
                          <div className="cursor-pointer">
                            <Button type="button" variant="outline" className="gap-2">
                              <Upload className="h-4 w-4" />
                              Select Documents
                            </Button>
                          </div>
                        </label>

                        <div
                          className="cursor-pointer mt-4"
                          onClick={() => document.getElementById('documents')?.click()}
                        >
                          <span className="text-sm text-primary hover:underline">Click here to select documents</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* In the media tab, replace the submit buttons with: */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('features')}
                    className="gap-2"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setActiveTab('promotion')}
                    className="gap-2"
                  >
                    Next: Promotion
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="promotion" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Boost Your Listing</CardTitle>
                    <CardDescription>
                      Choose a promotion package to get more visibility
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {PROMOTION_TIERS.map((tier) => (
                        <div
                          key={tier.id}
                          className={cn(
                            "border-2 rounded-lg p-6 cursor-pointer transition-all",
                            formData.promotionTier === tier.id
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => handleInputChange('promotionTier', tier.id)}
                        >
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold">{tier.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                          </div>

                          {tier.prices ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">7 days</span>
                                <span className="font-semibold">{tier.prices['7_days'].toLocaleString()} ETB</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm">
                                  30 days
                                  {tier.discount_30_days && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Save {tier.discount_30_days}%
                                    </Badge>
                                  )}
                                </span>
                                <span className="font-semibold">{tier.prices['30_days'].toLocaleString()} ETB</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-green-600">FREE</div>
                          )}

                          <div className="mt-6 space-y-2">
                            {tier.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Duration selection */}
                    {formData.promotionTier && formData.promotionTier !== 'basic' && (
                      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-4">Select Duration</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {[7, 30, 90].map((days) => (
                            <Button
                              key={days}
                              variant={formData.promotionDuration === days ? "default" : "outline"}
                              onClick={() => handleInputChange('promotionDuration', days)}
                              className="h-16"
                            >
                              <div>
                                <div className="font-bold">{days} days</div>
                                <div className="text-xs">
                                  {calculatePrice(formData.promotionTier || 'basic', days).toLocaleString()} ETB
                                </div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {userSubscription && userSubscription.is_active && userSubscription.plan && (
                      <Alert className="bg-green-50 border-green-200 mb-6">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <AlertTitle className="text-green-800">
                              Subscription Discount Active! ({userSubscription.plan.property_discount}% off)
                            </AlertTitle>
                            <AlertDescription className="text-green-700">
                              Your {userSubscription.plan.name} subscription gives you discounts on all property promotions.
                              Discount automatically applied at checkout.
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('media')}
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
                    >
                      <Save className="h-4 w-4" />
                      Save Draft
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner className="h-4 w-4" />
                          Listing Property...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          List Property
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
            <Card className="sticky top-6 border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Listing Preview</CardTitle>
                <CardDescription>
                  This is how your property will appear to buyers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                  {formData.images && formData.images.length > 0 ? (
                    <img
                      src={URL.createObjectURL(formData.images[0])}
                      alt="Property preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-500">No images uploaded</p>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg truncate">
                    {formData.title || 'Your property title'}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {formData.specific_location || 'Location will appear here'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold">{formData.bedrooms || 0}</div>
                    <div className="text-xs text-gray-500">Bedrooms</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold">{formData.bathrooms || 0}</div>
                    <div className="text-xs text-gray-500">Bathrooms</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold">{formData.total_area || 0}</div>
                    <div className="text-xs text-gray-500">m²</div>
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
                  <>
                    {formData.promotionTier && formData.promotionTier !== 'basic' && (
                      <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">
                            {PROMOTION_TIERS.find(t => t.id === formData.promotionTier)?.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {formData.promotionDuration} days • {formData.promotionPrice?.toLocaleString()} ETB
                        </div>
                      </div>
                    )}
                  </>

                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">
                    {formData.property_type?.replace('_', ' ') || 'house'}
                  </Badge>
                  <Badge variant="outline">
                    {listingType === 'for_sale' ? 'For Sale' : 'For Rent'}
                  </Badge>
                  {formData.is_premium && (
                    <Badge className="bg-yellow-100 text-yellow-800">Premium</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-blue-100 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Listing Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">Use natural daylight for photos</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">Clean and declutter before taking photos</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">Highlight unique features in description</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">Be responsive to inquiries</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">Price competitively based on market</p>
                </div>
              </CardContent>
            </Card>

            {/* Premium Badge */}
            <Card className="border-amber-100 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800">Premium Listing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-700">Get 5x More Views</p>
                    <p className="text-sm text-amber-600">
                      Top placement, priority visibility
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_premium}
                    onCheckedChange={(checked) => handleInputChange('is_premium', checked)}
                    className="data-[state=checked]:bg-amber-600"
                  />
                </div>
                <ul className="space-y-2 text-sm text-amber-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Featured at top of search results
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Highlighted with premium badge
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Priority in email alerts
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}