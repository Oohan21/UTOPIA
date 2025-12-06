'use client'

import React, { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/Switch'
import { 
  Building2, 
  Upload, 
  Save, 
  X, 
  Home, 
  MapPin, 
  DollarSign, 
  Bed,
  Bath,
  Ruler,
  Calendar,
  Check,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Land' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'farm', label: 'Farm' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'other', label: 'Other' },
]

const LISTING_TYPES = [
  { value: 'for_sale', label: 'For Sale' },
  { value: 'for_rent', label: 'For Rent' },
  { value: 'sale_or_rent', label: 'Sale or Rent' },
]

const PROPERTY_STATUS = [
  { value: 'available', label: 'Available' },
  { value: 'pending', label: 'Pending' },
  { value: 'sold', label: 'Sold' },
  { value: 'rented', label: 'Rented' },
]

const FURNISHING_TYPES = [
  { value: 'furnished', label: 'Furnished' },
  { value: 'semi_furnished', label: 'Semi-Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
]

export default function AddPropertyPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    title_amharic: '',
    description: '',
    description_amharic: '',
    property_type: 'house',
    listing_type: 'for_sale',
    property_status: 'available',
    
    // Location
    city_id: '',
    sub_city_id: '',
    specific_location: '',
    address_line_1: '',
    address_line_2: '',
    latitude: '',
    longitude: '',
    
    // Details
    bedrooms: 3,
    bathrooms: 2,
    total_area: '',
    plot_size: '',
    built_year: new Date().getFullYear(),
    floors: 1,
    furnishing_type: 'unfurnished',
    
    // Pricing
    price_etb: '',
    price_negotiable: true,
    monthly_rent: '',
    security_deposit: '',
    maintenance_fee: '',
    property_tax: '',
    
    // Features
    has_parking: false,
    has_garden: false,
    has_security: true,
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
    
    // Documentation
    has_title_deed: false,
    has_construction_permit: false,
    has_occupancy_certificate: false,
    
    // Images
    images: [] as File[],
  })

  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [activeStep, setActiveStep] = useState(1)

  // Fetch cities for selection
  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: () => fetch('/api/cities/').then(res => res.json()),
  })

  // Fetch sub-cities based on selected city
  const { data: subCitiesData, isLoading: subCitiesLoading } = useQuery({
    queryKey: ['sub-cities', formData.city_id],
    queryFn: () => 
      formData.city_id 
        ? fetch(`/api/sub-cities/?city=${formData.city_id}`).then(res => res.json())
        : Promise.resolve({ results: [] }),
    enabled: !!formData.city_id,
  })

  const addPropertyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/properties/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: data,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to add property')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      toast.success('Property added successfully!')
      router.push(`/admin/properties/${data.id}`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add property')
    },
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validate file types
    const validFiles = files.filter(file => 
      file.type.startsWith('image/')
    )
    
    if (validFiles.length !== files.length) {
      toast.error('Only image files are allowed')
    }
    
    // Limit to 10 images
    const newFiles = [...formData.images, ...validFiles].slice(0, 10)
    setFormData(prev => ({ ...prev, images: newFiles }))
    
    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 10))
  }

  const removeImage = (index: number) => {
    const newImages = [...formData.images]
    const newPreviews = [...imagePreviews]
    
    // Revoke object URL
    URL.revokeObjectURL(newPreviews[index])
    
    newImages.splice(index, 1)
    newPreviews.splice(index, 1)
    
    setFormData(prev => ({ ...prev, images: newImages }))
    setImagePreviews(newPreviews)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.title || !formData.city_id || !formData.price_etb) {
      toast.error('Please fill in all required fields')
      return
    }

    // Create FormData for file upload
    const formDataToSend = new FormData()
    
    // Append all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'images') {
        // Append each image file
        formData.images.forEach((file, index) => {
          formDataToSend.append(`images`, file)
        })
      } else if (Array.isArray(value)) {
        // Skip arrays (except images handled above)
      } else if (value !== null && value !== undefined) {
        formDataToSend.append(key, String(value))
      }
    })

    addPropertyMutation.mutate(formDataToSend)
  }

  const steps = [
    { number: 1, title: 'Basic Info', icon: <Home className="h-4 w-4" /> },
    { number: 2, title: 'Location', icon: <MapPin className="h-4 w-4" /> },
    { number: 3, title: 'Details', icon: <Building2 className="h-4 w-4" /> },
    { number: 4, title: 'Pricing', icon: <DollarSign className="h-4 w-4" /> },
    { number: 5, title: 'Features', icon: <Check className="h-4 w-4" /> },
    { number: 6, title: 'Images', icon: <Upload className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Add New Property</h1>
          <p className="text-muted-foreground">
            Create a new property listing
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  activeStep === step.number 
                    ? 'bg-primary text-primary-foreground' 
                    : activeStep > step.number
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {activeStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  activeStep >= step.number ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-0.5 w-8 ${
                    activeStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{steps[activeStep - 1].title}</CardTitle>
            <CardDescription>
              {activeStep === 1 && 'Enter basic property information'}
              {activeStep === 2 && 'Specify property location details'}
              {activeStep === 3 && 'Add property specifications'}
              {activeStep === 4 && 'Set pricing information'}
              {activeStep === 5 && 'Select property features and amenities'}
              {activeStep === 6 && 'Upload property images'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Basic Info */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Property Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Beautiful Villa in Bole"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title_amharic">Title in Amharic</Label>
                    <Input
                      id="title_amharic"
                      placeholder="አማርኛ አርዕስት"
                      value={formData.title_amharic}
                      onChange={(e) => handleInputChange('title_amharic', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the property in detail..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_amharic">Description in Amharic</Label>
                  <Textarea
                    id="description_amharic"
                    placeholder="አማርኛ መግለጫ..."
                    value={formData.description_amharic}
                    onChange={(e) => handleInputChange('description_amharic', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="property_type">Property Type *</Label>
                    <Select
                      options={PROPERTY_TYPES}
                      value={formData.property_type}
                      onValueChange={(value) => handleInputChange('property_type', value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="listing_type">Listing Type *</Label>
                    <Select
                      options={LISTING_TYPES}
                      value={formData.listing_type}
                      onValueChange={(value) => handleInputChange('listing_type', value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="property_status">Status *</Label>
                    <Select
                      options={PROPERTY_STATUS}
                      value={formData.property_status}
                      onValueChange={(value) => handleInputChange('property_status', value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city_id">City *</Label>
                    <Select
                      options={citiesLoading ? [] : (citiesData?.results || []).map((city: any) => ({
                        value: city.id,
                        label: city.name
                      }))}
                      value={formData.city_id}
                      onValueChange={(value) => handleInputChange('city_id', value)}
                      disabled={citiesLoading}
                      placeholder={citiesLoading ? "Loading cities..." : "Select city"}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sub_city_id">Sub-City</Label>
                    <Select
                      options={subCitiesLoading ? [] : (subCitiesData?.results || []).map((subCity: any) => ({
                        value: subCity.id,
                        label: subCity.name
                      }))}
                      value={formData.sub_city_id}
                      onValueChange={(value) => handleInputChange('sub_city_id', value)}
                      disabled={!formData.city_id || subCitiesLoading}
                      placeholder={!formData.city_id ? "Select city first" : "Select sub-city"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specific_location">Specific Location *</Label>
                  <Input
                    id="specific_location"
                    placeholder="e.g., Bole Road, near Edna Mall"
                    value={formData.specific_location}
                    onChange={(e) => handleInputChange('specific_location', e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="address_line_1">Address Line 1</Label>
                    <Input
                      id="address_line_1"
                      placeholder="Street address"
                      value={formData.address_line_1}
                      onChange={(e) => handleInputChange('address_line_1', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_line_2">Address Line 2</Label>
                    <Input
                      id="address_line_2"
                      placeholder="Apartment, suite, unit, etc."
                      value={formData.address_line_2}
                      onChange={(e) => handleInputChange('address_line_2', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 9.0320"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 38.7460"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4" />
                        Bedrooms
                      </div>
                    </Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="0"
                      value={formData.bedrooms}
                      onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">
                      <div className="flex items-center gap-2">
                        <Bath className="h-4 w-4" />
                        Bathrooms
                      </div>
                    </Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      min="0"
                      value={formData.bathrooms}
                      onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total_area">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Total Area (m²) *
                      </div>
                    </Label>
                    <Input
                      id="total_area"
                      type="number"
                      min="0"
                      placeholder="e.g., 150"
                      value={formData.total_area}
                      onChange={(e) => handleInputChange('total_area', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="floors">Floors</Label>
                    <Input
                      id="floors"
                      type="number"
                      min="0"
                      value={formData.floors}
                      onChange={(e) => handleInputChange('floors', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="plot_size">Plot Size (m²)</Label>
                    <Input
                      id="plot_size"
                      type="number"
                      min="0"
                      placeholder="For land or houses with plot"
                      value={formData.plot_size}
                      onChange={(e) => handleInputChange('plot_size', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="built_year">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Year Built
                      </div>
                    </Label>
                    <Input
                      id="built_year"
                      type="number"
                      min="1800"
                      max={new Date().getFullYear()}
                      placeholder={new Date().getFullYear().toString()}
                      value={formData.built_year}
                      onChange={(e) => handleInputChange('built_year', parseInt(e.target.value) || new Date().getFullYear())}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="furnishing_type">Furnishing Type</Label>
                  <Select
                    options={FURNISHING_TYPES}
                    value={formData.furnishing_type}
                    onValueChange={(value) => handleInputChange('furnishing_type', value)}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Pricing */}
            {activeStep === 4 && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price_etb">Price (ETB) *</Label>
                    <Input
                      id="price_etb"
                      type="number"
                      min="0"
                      placeholder="e.g., 5000000"
                      value={formData.price_etb}
                      onChange={(e) => handleInputChange('price_etb', e.target.value)}
                      required
                    />
                  </div>

                  {formData.listing_type === 'for_rent' && (
                    <div className="space-y-2">
                      <Label htmlFor="monthly_rent">Monthly Rent (ETB)</Label>
                      <Input
                        id="monthly_rent"
                        type="number"
                        min="0"
                        placeholder="e.g., 15000"
                        value={formData.monthly_rent}
                        onChange={(e) => handleInputChange('monthly_rent', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="security_deposit">Security Deposit (ETB)</Label>
                    <Input
                      id="security_deposit"
                      type="number"
                      min="0"
                      placeholder="For rental properties"
                      value={formData.security_deposit}
                      onChange={(e) => handleInputChange('security_deposit', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maintenance_fee">Monthly Maintenance (ETB)</Label>
                    <Input
                      id="maintenance_fee"
                      type="number"
                      min="0"
                      placeholder="For apartments"
                      value={formData.maintenance_fee}
                      onChange={(e) => handleInputChange('maintenance_fee', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="property_tax">Annual Property Tax (ETB)</Label>
                    <Input
                      id="property_tax"
                      type="number"
                      min="0"
                      value={formData.property_tax}
                      onChange={(e) => handleInputChange('property_tax', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="price_negotiable"
                    checked={formData.price_negotiable}
                    onCheckedChange={(checked) => handleInputChange('price_negotiable', checked)}
                  />
                  <Label htmlFor="price_negotiable">Price is negotiable</Label>
                </div>
              </div>
            )}

            {/* Step 5: Features */}
            {activeStep === 5 && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_parking"
                      checked={formData.has_parking}
                      onCheckedChange={(checked) => handleInputChange('has_parking', checked)}
                    />
                    <Label htmlFor="has_parking">Parking Available</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_garden"
                      checked={formData.has_garden}
                      onCheckedChange={(checked) => handleInputChange('has_garden', checked)}
                    />
                    <Label htmlFor="has_garden">Garden</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_security"
                      checked={formData.has_security}
                      onCheckedChange={(checked) => handleInputChange('has_security', checked)}
                    />
                    <Label htmlFor="has_security">Security</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_furniture"
                      checked={formData.has_furniture}
                      onCheckedChange={(checked) => handleInputChange('has_furniture', checked)}
                    />
                    <Label htmlFor="has_furniture">Furnished</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_air_conditioning"
                      checked={formData.has_air_conditioning}
                      onCheckedChange={(checked) => handleInputChange('has_air_conditioning', checked)}
                    />
                    <Label htmlFor="has_air_conditioning">Air Conditioning</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_internet"
                      checked={formData.has_internet}
                      onCheckedChange={(checked) => handleInputChange('has_internet', checked)}
                    />
                    <Label htmlFor="has_internet">Internet</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_generator"
                      checked={formData.has_generator}
                      onCheckedChange={(checked) => handleInputChange('has_generator', checked)}
                    />
                    <Label htmlFor="has_generator">Generator</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_elevator"
                      checked={formData.has_elevator}
                      onCheckedChange={(checked) => handleInputChange('has_elevator', checked)}
                    />
                    <Label htmlFor="has_elevator">Elevator</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_pet_friendly"
                      checked={formData.is_pet_friendly}
                      onCheckedChange={(checked) => handleInputChange('is_pet_friendly', checked)}
                    />
                    <Label htmlFor="is_pet_friendly">Pet Friendly</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_wheelchair_accessible"
                      checked={formData.is_wheelchair_accessible}
                      onCheckedChange={(checked) => handleInputChange('is_wheelchair_accessible', checked)}
                    />
                    <Label htmlFor="is_wheelchair_accessible">Wheelchair Accessible</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_backup_water"
                      checked={formData.has_backup_water}
                      onCheckedChange={(checked) => handleInputChange('has_backup_water', checked)}
                    />
                    <Label htmlFor="has_backup_water">Backup Water</Label>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="mb-4 text-lg font-medium">Documentation</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_title_deed"
                        checked={formData.has_title_deed}
                        onCheckedChange={(checked) => handleInputChange('has_title_deed', checked)}
                      />
                      <Label htmlFor="has_title_deed">Title Deed</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_construction_permit"
                        checked={formData.has_construction_permit}
                        onCheckedChange={(checked) => handleInputChange('has_construction_permit', checked)}
                      />
                      <Label htmlFor="has_construction_permit">Construction Permit</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_occupancy_certificate"
                        checked={formData.has_occupancy_certificate}
                        onCheckedChange={(checked) => handleInputChange('has_occupancy_certificate', checked)}
                      />
                      <Label htmlFor="has_occupancy_certificate">Occupancy Certificate</Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Images */}
            {activeStep === 6 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="images">Property Images *</Label>
                  <p className="text-sm text-muted-foreground">
                    Upload up to 10 images. First image will be used as the main thumbnail.
                  </p>
                  
                  <div className="mt-4">
                    <input
                      type="file"
                      id="images"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="images"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 hover:border-primary"
                    >
                      <Upload className="mb-4 h-12 w-12 text-gray-400" />
                      <p className="mb-2 text-sm font-medium">Click to upload images</p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, JPEG up to 5MB each
                      </p>
                    </label>
                  </div>
                </div>

                {imagePreviews.length > 0 && (
                  <div>
                    <Label>Preview ({imagePreviews.length}/10 images)</Label>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <div className="overflow-hidden rounded-lg border">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="h-32 w-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 rounded bg-blue-500 px-2 py-1 text-xs text-white">
                              Main
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {activeStep < steps.length ? (
              <Button
                type="button"
                onClick={() => setActiveStep(prev => Math.min(steps.length, prev + 1))}
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={addPropertyMutation.isPending}
              >
                {addPropertyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Property...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Add Property
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}