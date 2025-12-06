// app/listings/[id]/edit/page.tsx - FIXED VERSION
'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  ChevronLeft,
  Plus,
  Trash2,
  Video,
  FileText,
  CheckCircle,
  Info,
  AlertCircle,
  Save,
  ArrowLeft,
  Eye,
  Clock,
  Shield,
  Star,
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
    name: 'Basic Listing',
    description: 'Standard listing visibility',
    price: 0,
    features: ['Appears in search results', 'Basic property card'],
  },
  {
    id: 'top',
    name: 'TOP Points',
    description: 'Priority placement in search results',
    prices: {
      '7_days': 5000,
      '30_days': 15000,
      '90_days': 35000,
    },
    discount_30_days: 20,
    features: ['Top 3 positions in search', 'Highlighted card', 'Urgent badge'],
  },
  {
    id: 'board_premium',
    name: 'Board Premium',
    description: 'Maximum visibility across all platforms',
    prices: {
      '7_days': 10000,
      '30_days': 28000,
      '90_days': 65000,
    },
    discount_30_days: 53, // (10000*4 - 28000) / (10000*4) * 100 ≈ 53%
    features: [
      'Homepage featured section',
      'Email newsletter inclusion',
      'Social media promotion',
      'Priority customer support',
    ],
  },
]

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = parseInt(params.id as string)
  const { isAuthenticated, user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('basic')
  const [listingType, setListingType] = useState<'for_sale' | 'for_rent'>('for_sale')
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([])

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

  // Fetch property data
  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => listingsApi.getPropertyById(propertyId),
    enabled: !!propertyId,
  })

  // Fetch cities and amenities
  const { data: citiesData, isLoading: isLoadingCities } = useQuery({
    queryKey: ['cities'],
    queryFn: () => listingsApi.getCities(),
  })

  const { data: subCitiesData, isLoading: isLoadingSubCities } = useQuery({
    queryKey: ['subCities', formData.city],
    queryFn: () => {
      if (!formData.city) return [];
      return listingsApi.getSubCities(formData.city);
    },
    enabled: !!formData.city,
  })

  const { data: amenitiesData, isLoading: isLoadingAmenities } = useQuery({
    queryKey: ['amenities'],
    queryFn: () => listingsApi.getAmenities(),
  })

  // ADD: Fetch user subscription
  const { data: userSubscription, isLoading: isLoadingSubscription } = useQuery<UserSubscription | null>({
    queryKey: ['user-subscription'],
    queryFn: () => subscriptionApi.getCurrentSubscription(),
    enabled: isAuthenticated,
  })

  const cities = Array.isArray(citiesData) ? citiesData : []
  const subCities = Array.isArray(subCitiesData) ? subCitiesData : []
  const amenitiesList = Array.isArray(amenitiesData) ? amenitiesData : []

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
        promotionTier: property?.promotion_tier || 'basic',
        promotionDuration: 30, // Default duration
        promotionPrice: 0,
        promotionFeatures: [],
      })
    }
  }, [property])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: FormData) => listingsApi.updateProperty(propertyId, data),
    onSuccess: (data) => {
      toast.success('Property updated successfully!')
      router.push(`/listings/${data.id}`)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.detail ||
        'Failed to update property'
      toast.error(errorMessage)
      console.error('Update property error:', error)
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

  const calculatePrice = (tier: string | undefined, duration: number): number => {
    const safeTier = tier || 'basic';
    
    const tierPrices: Record<string, Record<string, number>> = {
      basic: {
        '7_days': 0,
        '30_days': 0,
        '90_days': 0,
      },
      top: {
        '7_days': 5000,
        '30_days': 15000,
        '90_days': 35000,
      },
      board_premium: {
        '7_days': 10000,
        '30_days': 28000,
        '90_days': 65000,
      },
    };

    const durationKey =
      duration <= 7 ? '7_days' :
        duration <= 30 ? '30_days' :
          '90_days';

    let price = tierPrices[safeTier]?.[durationKey] || 0;

    // Apply subscription discount if user has active subscription
    if (userSubscription?.is_active && userSubscription.plan?.property_discount) {
      const discount = userSubscription.plan.property_discount / 100;
      price = price * (1 - discount);
    }

    return Math.round(price);
  };

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear subcity when city changes
    if (field === 'city' && value !== formData.city) {
      setFormData(prev => ({ ...prev, sub_city: undefined }))
    }

    if (field === 'promotionTier' && value) {
      const duration = formData.promotionDuration || 30;
      const price = calculatePrice(value, duration);
      setFormData(prev => ({
        ...prev,
        promotionPrice: price
      }));
    }

    // When duration changes, update price
    if (field === 'promotionDuration' && value) {
      const tier = formData.promotionTier || 'basic';
      const price = calculatePrice(tier, value);
      setFormData(prev => ({
        ...prev,
        promotionPrice: price
      }));
    }
  }

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

  const handleRemoveFile = (field: 'images' | 'documents', index: number) => {
    if (field === 'images') {
      setFormData(prev => ({
        ...prev,
        images: prev.images?.filter((_, i) => i !== index) || []
      }))
    } else if (field === 'documents') {
      setFormData(prev => ({
        ...prev,
        documents: prev.documents?.filter((_, i) => i !== index) || []
      }))
    }
  }

  const handleRemoveExistingImage = (imageId: number) => {
    setDeletedImageIds(prev => [...prev, imageId])
    setExistingImages(prev => prev.filter(img => img.id !== imageId))
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

    if ((formData.images?.length || 0) + existingImages.length === 0) errors.push('At least one image is required')

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
      formDataObj.append('property_status', formData.property_status || 'available')

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

      // Media - New Images
      formData.images?.forEach((image) => {
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
      formData.documents?.forEach((doc) => {
        formDataObj.append(`documents`, doc)
      })

      // Status
      formDataObj.append('is_premium', formData.is_premium ? 'true' : 'false')

      // Deleted images
      deletedImageIds.forEach(imageId => {
        formDataObj.append('deleted_images', imageId.toString())
      })

      // Promotion data
      if (formData.promotionTier && formData.promotionTier !== 'basic') {
        formDataObj.append('promotion_tier', formData.promotionTier);
        formDataObj.append('promotion_duration', (formData.promotionDuration || 30).toString());
        formDataObj.append('promotion_price', (formData.promotionPrice || 0).toString());
        formDataObj.append('is_premium', 'true'); // Automatically set premium to true for promotions
      } else {
        formDataObj.append('is_premium', formData.is_premium ? 'true' : 'false');
      }

      // Submit
      updateMutation.mutate(formDataObj)

    } catch (error) {
      console.error('Error preparing form data:', error)
      toast.error('Error preparing form data. Please try again.')
    }
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      deleteMutation.mutate()
    }
  }

  if (!isAuthenticated) {
    return <LoadingSpinner fullScreen />
  }

  if (isLoadingProperty) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-8">
          <LoadingSpinner fullScreen={false} />
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Property not found</h1>
            <p className="mb-6 text-muted-foreground">
              The property you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/listings')}>
              Browse Properties
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
      <div className="min-h-screen">
        <Header />
        <div className="container py-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">Access Denied</h1>
            <p className="mb-6 text-muted-foreground">
              You don't have permission to edit this property.
            </p>
            <Button onClick={() => router.push('/listings')}>
              Browse Properties
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/listings/${propertyId}`)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Property
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Edit Property Listing</h1>
                <p className="text-muted-foreground">
                  Update your property information
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Property'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-7">
              <TabsList className="grid w-full grid-cols-7 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="basic" className="data-[state=active]:bg-white">
                  Basic
                </TabsTrigger>
                <TabsTrigger value="location" className="data-[state=active]:bg-white">
                  Location
                </TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-white">
                  Details
                </TabsTrigger>
                <TabsTrigger value="pricing" className="data-[state=active]:bg-white">
                  Pricing
                </TabsTrigger>
                <TabsTrigger value="features" className="data-[state=active]:bg-white">
                  Features
                </TabsTrigger>
                <TabsTrigger value="media" className="data-[state=active]:bg-white">
                  Media
                </TabsTrigger>
                <TabsTrigger value="promotion" className="data-[state=active]:bg-white">
                  Promotion
                </TabsTrigger>
              </TabsList>

              {/* Basic Information */}
              <TabsContent value="basic" className="space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-primary" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Listing Type */}
                    <div>
                      <Label className="mb-3 block">Listing Type</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          type="button"
                          variant={listingType === 'for_sale' ? 'default' : 'outline'}
                          className="h-12"
                          onClick={() => {
                            setListingType('for_sale')
                            handleInputChange('listing_type', 'for_sale')
                          }}
                        >
                          <DollarSign className="mr-2 h-5 w-5" />
                          For Sale
                        </Button>
                        <Button
                          type="button"
                          variant={listingType === 'for_rent' ? 'default' : 'outline'}
                          className="h-12"
                          onClick={() => {
                            setListingType('for_rent')
                            handleInputChange('listing_type', 'for_rent')
                          }}
                        >
                          <Home className="mr-2 h-5 w-5" />
                          For Rent
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="title">Property Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Modern 3-bedroom apartment"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="title_amharic">Property Title (Amharic)</Label>
                        <Input
                          id="title_amharic"
                          value={formData.title_amharic || ''}
                          onChange={(e) => handleInputChange('title_amharic', e.target.value)}
                          placeholder="አዲስ ዘመናዊ 3 አልጋ አፓርትመንት"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="property_type">Property Type *</Label>
                      <Select
                        value={formData.property_type}
                        onValueChange={(value) => handleInputChange('property_type', value)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROPERTY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="property_status">Property Status</Label>
                      <Select
                        value={formData.property_status}
                        onValueChange={(value) => handleInputChange('property_status', value)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="rented">Rented</SelectItem>
                          <SelectItem value="off_market">Off Market</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your property in detail..."
                        className="min-h-32"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description_amharic">Description (Amharic)</Label>
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

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/listings/${propertyId}`)}
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
              <TabsContent value="location" className="space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Location Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="city">City *</Label>
                        <Select
                          value={formData.city?.toString() || ''}
                          onValueChange={(value) => handleInputChange('city', parseInt(value))}
                          disabled={isLoadingCities}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder={isLoadingCities ? "Loading..." : "Select city"} />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.id.toString()}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="sub_city">Sub-City *</Label>
                        <Select
                          value={formData.sub_city?.toString() || ''}
                          onValueChange={(value) => handleInputChange('sub_city', parseInt(value))}
                          disabled={!formData.city || isLoadingSubCities}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder={
                              !formData.city ? "Select city first" :
                                isLoadingSubCities ? "Loading..." : "Select sub-city"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {subCities.map((subCity) => (
                              <SelectItem key={subCity.id} value={subCity.id.toString()}>
                                {subCity.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="specific_location">Specific Location *</Label>
                      <Input
                        id="specific_location"
                        value={formData.specific_location || ''}
                        onChange={(e) => handleInputChange('specific_location', e.target.value)}
                        placeholder="e.g., Bole Road, near Edna Mall"
                        className="h-12"
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="address_line_1">Address Line 1</Label>
                        <Input
                          id="address_line_1"
                          value={formData.address_line_1 || ''}
                          onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                          placeholder="House number, building name"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="address_line_2">Address Line 2</Label>
                        <Input
                          id="address_line_2"
                          value={formData.address_line_2 || ''}
                          onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                          placeholder="Additional address details"
                          className="h-12"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('basic')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
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
              <TabsContent value="details" className="space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      Property Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Select
                          value={formData.bedrooms?.toString() || '1'}
                          onValueChange={(value) => handleInputChange('bedrooms', parseInt(value))}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select bedrooms" />
                          </SelectTrigger>
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
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Select
                          value={formData.bathrooms?.toString() || '1'}
                          onValueChange={(value) => handleInputChange('bathrooms', parseInt(value))}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select bathrooms" />
                          </SelectTrigger>
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
                        <Label htmlFor="total_area">Total Area (m²) *</Label>
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
                        <Label htmlFor="plot_size">Plot Size (m²)</Label>
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
                        <Label htmlFor="built_year">Built Year</Label>
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
                        <Label htmlFor="floors">Number of Floors</Label>
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
                      <Label htmlFor="furnishing_type">Furnishing Type</Label>
                      <Select
                        value={formData.furnishing_type}
                        onValueChange={(value) => handleInputChange('furnishing_type', value)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select furnishing type" />
                        </SelectTrigger>
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

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('location')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
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
              <TabsContent value="pricing" className="space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      {listingType === 'for_sale' ? 'Sale Price' : 'Rental Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {listingType === 'for_sale' ? (
                      <>
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-3">
                            <Label htmlFor="price_etb">Price (ETB) *</Label>
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
                            <Label htmlFor="price_usd">Price (USD)</Label>
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
                      </>
                    ) : (
                      <>
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-3">
                            <Label htmlFor="monthly_rent">Monthly Rent (ETB) *</Label>
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
                            <Label htmlFor="security_deposit">Security Deposit (ETB)</Label>
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
                      </>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label htmlFor="maintenance_fee">Monthly Maintenance (ETB)</Label>
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
                        <Label htmlFor="property_tax">Property Tax (ETB/year)</Label>
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
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('details')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
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
              <TabsContent value="features" className="space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      Features & Amenities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Basic Features */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold">Basic Features</h3>
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
                      <h3 className="mb-4 text-lg font-semibold">Additional Amenities</h3>
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
                      <h3 className="mb-4 text-lg font-semibold">Property Documents</h3>
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

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('pricing')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
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
              <TabsContent value="media" className="space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      Photos & Videos
                    </CardTitle>
                    <CardDescription>
                      {existingImages.length + (formData.images?.length || 0)} images uploaded
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Images Upload */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Property Photos *</h3>
                          <p className="text-sm text-gray-600">
                            Upload additional photos (Maximum 20 total)
                          </p>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {existingImages.length + (formData.images?.length || 0)}/20 photos
                        </span>
                      </div>

                      {/* Existing Images */}
                      {existingImages.length > 0 && (
                        <div className="mb-6">
                          <h4 className="mb-3 font-medium">Existing Photos</h4>
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                            {existingImages.map((image) => (
                              <div key={image.id} className="relative group">
                                <div className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                                  <img
                                    src={image.image}
                                    alt={image.caption || 'Property image'}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                  />
                                </div>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                  onClick={() => handleRemoveExistingImage(image.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                {image.is_primary && (
                                  <Badge className="absolute top-2 left-2 bg-primary">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New Images Upload */}
                      <div className="space-y-4">
                        <div className="border-3 border-dashed border-gray-300 rounded-xl p-8 text-center transition-colors hover:border-primary">
                          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="mb-2 text-lg font-medium">Upload Additional Photos</p>
                          <p className="text-sm text-gray-600 mb-6">
                            PNG, JPG, WEBP up to 10MB each
                          </p>

                          <input
                            id="new-images"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || [])
                              files.forEach(file => handleFileUpload('images', file))
                            }}
                          />
                          <label htmlFor="new-images">
                            <div className="cursor-pointer">
                              <Button type="button" variant="outline" className="gap-2">
                                <Upload className="h-4 w-4" />
                                Add More Images
                              </Button>
                            </div>
                          </label>
                        </div>

                        {/* New Image Previews */}
                        {formData.images && formData.images.length > 0 && (
                          <div>
                            <h4 className="mb-3 font-medium">New Photos to Upload</h4>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                              {formData.images.map((image, index) => (
                                <div key={index} className="relative group">
                                  <div className="aspect-square overflow-hidden rounded-lg border border-gray-200">
                                    <img
                                      src={URL.createObjectURL(image)}
                                      alt={`New image ${index + 1}`}
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
                      <h3 className="mb-4 text-lg font-semibold">Video Tour</h3>
                      <p className="mb-4 text-sm text-gray-600">
                        Upload or replace property video tour (optional)
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
                              onClick={() => setFormData(prev => ({ ...prev, property_video: undefined }))}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <p className="mb-2 font-medium">Upload property video tour</p>
                          <p className="text-sm text-gray-600 mb-6">
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
                          <label htmlFor="property_video">
                            <div className="cursor-pointer">
                              <Button type="button" variant="outline" className="gap-2">
                                <Upload className="h-4 w-4" />
                                {property.property_video ? 'Replace Video' : 'Add Video'}
                              </Button>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Virtual Tour */}
                    <div>
                      <h3 className="mb-4 text-lg font-semibold">Virtual Tour Link</h3>
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
                      <h3 className="mb-4 text-lg font-semibold">Additional Documents</h3>
                      <p className="mb-4 text-sm text-gray-600">
                        Upload additional documents (optional)
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
                              Add Documents
                            </Button>
                          </div>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('features')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/listings/${propertyId}`)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setActiveTab('promotion')}
                      className="gap-2"
                    >
                      Next: Promotion
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Promotion Tab */}
              <TabsContent value="promotion" className="space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Boost Your Listing
                    </CardTitle>
                    <CardDescription>
                      Choose a promotion package to get more visibility
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                          onClick={() => {
                            handleInputChange('promotionTier', tier.id);
                            // Also set default duration when tier changes
                            if (tier.id !== 'basic') {
                              handleInputChange('promotionDuration', 30);
                              handleInputChange('promotionPrice', calculatePrice(tier.id, 30));
                            } else {
                              handleInputChange('promotionDuration', undefined);
                              handleInputChange('promotionPrice', 0);
                            }
                          }}
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
                              onClick={() => {
                                handleInputChange('promotionDuration', days);
                                handleInputChange('promotionPrice', calculatePrice(formData.promotionTier, days));
                              }}
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

                    {/* Subscription discount alert */}
                    {userSubscription?.is_active && userSubscription?.plan && (
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
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/listings/${propertyId}`)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={updateMutation.isPending}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="sticky top-6 border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                  {existingImages.length > 0 ? (
                    <img
                      src={existingImages[0]?.image}
                      alt="Property preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-sm text-gray-500">No images</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg truncate">
                    {formData.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {formData.specific_location || 'No location'}
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
                        : 'No price'}
                    </>
                  ) : (
                    <>
                      {formData.monthly_rent
                        ? `ETB ${formData.monthly_rent.toLocaleString()}/month`
                        : 'No rent'}
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
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Property ID</p>
                    <p className="text-sm text-gray-500">{property.property_id}</p>
                  </div>
                  <Badge variant="outline">{property.property_id}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Listed</p>
                    <p className="text-sm text-gray-500">{new Date(property.created_at).toLocaleDateString()}</p>
                  </div>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Views</p>
                    <p className="text-sm text-gray-500">{property.views_count.toLocaleString()}</p>
                  </div>
                  <Eye className="h-5 w-5 text-gray-400" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Premium</p>
                    <p className="text-sm text-gray-500">Feature your listing</p>
                  </div>
                  <Switch
                    checked={formData.is_premium}
                    onCheckedChange={(checked) => handleInputChange('is_premium', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Views</span>
                  <span className="font-medium">{property.views_count.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inquiries</span>
                  <span className="font-medium">{property.inquiry_count}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saves</span>
                  <span className="font-medium">{property.save_count}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Listed</span>
                  <span className="font-medium">{property.days_on_market || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle>Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Verified</span>
                  </div>
                  <Badge variant={property.is_verified ? "default" : "outline"}>
                    {property.is_verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>Featured</span>
                  </div>
                  <Badge variant={property.is_featured ? "default" : "outline"}>
                    {property.is_featured ? 'Featured' : 'Standard'}
                  </Badge>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Verified properties get 3x more inquiries
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}