// app/listings/[id]/page.tsx
'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Header from '@/components/common/Header/Header'
import { listingsApi } from '@/lib/api/listings'
import { formatCurrency, formatPricePerSqm } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
import { 
  Bed, 
  Bath, 
  Square, 
  MapPin, 
  Calendar, 
  Car, 
  TreePine,
  Shield,
  Sofa,
  Wind,
  Wifi,
  Zap,
  Building,
  Dumbbell,
  Users,
  Heart,
  Share2,
  Phone,
  MessageSquare,
  Star,
  ChevronLeft,
  ChevronRight,
  Clock,
  Award,
  CheckCircle,
  FileText,
  ExternalLink,
  Globe,
  Waves,
  Thermometer,
  ShieldCheck,
  Coffee,
  Home,
  Layers,
  Ruler,
  DollarSign,
  Percent,
  TrendingUp,
  Eye,
  Mail,
  Edit,
  Copy,
  Facebook,
  Twitter,
  Printer,
  Download as DownloadIcon,
  Play,
  Video,
  Maximize2,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Card, CardContent } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { ScrollArea } from '@/components/ui/Scroll-area'
import PropertyCard from '@/components/listings/PropertyCard'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Textarea } from '@/components/ui/Textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog"
import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"

// Property Gallery Component
function PropertyGallery({ images, propertyTitle, propertyVideo }: { 
  images: any[], 
  propertyTitle: string,
  propertyVideo?: string 
}) {
  const [activeImage, setActiveImage] = useState(0)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [imageError, setImageError] = useState<number | null>(null)

  const primaryImage = images.find(img => img.is_primary) || images[0]

  const handlePreviousImage = () => {
    setActiveImage((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleNextImage = () => {
    setActiveImage((prev) => (prev + 1) % images.length)
  }

  const getImageUrl = (image: any) => {
    if (!image?.image) return '/placeholder-property.jpg'
    
    const imageUrl = image.image
    // If URL is relative, make it absolute
    if (imageUrl.startsWith('/')) {
      return `http://localhost:8000${imageUrl}`
    }
    return imageUrl
  }

  return (
    <div className="space-y-4">
      {/* Main Image/Video Display */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        {propertyVideo && (
          <div className="absolute right-2 top-2 z-10">
            <Badge className="bg-blue-500 text-white">
              <Video className="mr-1 h-3 w-3" />
              Video Available
            </Badge>
          </div>
        )}
        
        {images.length > 0 ? (
          <Image
            src={getImageUrl(images[activeImage] || primaryImage)}
            alt={`${propertyTitle} - ${activeImage + 1}`}
            fill
            className="object-cover"
            priority
            onError={() => setImageError(activeImage)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Home className="h-12 w-12 text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">No images available</span>
          </div>
        )}
        
        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handlePreviousImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleNextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Video Play Button */}
        {propertyVideo && (
          <Button
            variant="ghost"
            size="lg"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={() => setIsVideoModalOpen(true)}
          >
            <Play className="h-6 w-6" />
            <span className="ml-2">Watch Video</span>
          </Button>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 rounded-full bg-background/80 px-3 py-1 text-sm backdrop-blur-sm">
            {activeImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <ScrollArea>
          <div className="flex gap-2 pb-2">
            {images.map((image, index) => {
              const imageUrl = getImageUrl(image)
              return (
                <button
                  key={image.id}
                  onClick={() => setActiveImage(index)}
                  className={`relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                    activeImage === index 
                      ? 'ring-2 ring-primary ring-offset-2' 
                      : 'opacity-75 hover:opacity-100 hover:ring-1 hover:ring-muted'
                  }`}
                >
                  <Image
                    src={imageUrl}
                    alt={`${propertyTitle} - ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </button>
              )
            })}
          </div>
        </ScrollArea>
      )}

      {/* Video Modal */}
      {propertyVideo && (
        <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Property Video Tour</DialogTitle>
              <DialogDescription>
                Watch the video tour of {propertyTitle}
              </DialogDescription>
            </DialogHeader>
            <div className="relative aspect-video">
              <video
                src={propertyVideo}
                controls
                className="h-full w-full rounded-lg"
                title={propertyTitle}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = propertyVideo
                  link.download = `${propertyTitle.replace(/\s+/g, '_')}_video.mp4`
                  link.click()
                }}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download Video
              </Button>
              <Button onClick={() => setIsVideoModalOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Property Sidebar Component
function PropertySidebar({ 
  property, 
  user, 
  isSaved, 
  onSave, 
  onAddToComparison, 
  onContact, 
  onShare,
  onPrint,
  onDownload 
}: {
  property: any
  user: any
  isSaved: boolean
  onSave: () => void
  onAddToComparison: () => void
  onContact: (method: 'call' | 'message') => void
  onShare: (platform?: string) => void
  onPrint: () => void
  onDownload: () => void
}) {
  const priceDisplay = property.listing_type === 'for_rent' 
    ? `${formatCurrency(property.monthly_rent || 0)}/month`
    : formatCurrency(property.price_etb || 0)

  return (
    <div className="space-y-6">
      {/* Pricing Card */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 text-center">
            <div className="text-3xl font-bold text-primary">{priceDisplay}</div>
            {property.price_per_sqm && (
              <div className="text-sm text-muted-foreground">
                {formatPricePerSqm(property.price_per_sqm)}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full"
              onClick={() => onContact('call')}
              disabled={!property.owner?.phone_number}
            >
              <Phone className="mr-2 h-4 w-4" />
              {property.owner?.phone_number 
                ? 'Call Now' 
                : 'No Phone Number'}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => onContact('message')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Contact Information</h3>
          
          <div className="mb-6 space-y-4">
            {/* Owner */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary">
                  {property.owner?.first_name?.[0]}{property.owner?.last_name?.[0]}
                </span>
              </div>
              <div>
                <h4 className="font-medium">
                  {property.owner?.first_name} {property.owner?.last_name}
                </h4>
                <p className="text-sm text-muted-foreground capitalize">
                  {property.owner?.user_type?.replace('_', ' ') || 'Owner'}
                </p>
                {property.owner?.phone_number && (
                  <p className="text-sm text-muted-foreground">{property.owner.phone_number}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {property.owner?.email && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{property.owner.email}</span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Member Since:</span>
              <span className="font-medium">{formatDate(property.owner?.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onSave}
            >
              <Heart className={`mr-2 h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
              {isSaved ? 'Saved' : 'Save Property'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onAddToComparison}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Add to Comparison
            </Button>
            
            <div className="pt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onShare('facebook')}>
                    <Facebook className="mr-2 h-4 w-4" />
                    Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare('twitter')}>
                    <Twitter className="mr-2 h-4 w-4" />
                    Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare()}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                  <Separator className="my-1" />
                  <DropdownMenuItem onClick={onPrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDownload}>
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Stats */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Property Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property ID</span>
              <span className="font-mono font-medium">{property.property_id}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Listed</span>
              <span className="font-medium">{formatDate(property.listed_date)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Views</span>
              <span className="font-medium">{property.views_count?.toLocaleString() || 0}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inquiries</span>
              <span className="font-medium">{property.inquiry_count || 0}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saves</span>
              <span className="font-medium">{property.save_count || 0}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className="capitalize">
                {property.property_status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Inquiry Dialog Component
function InquiryDialog({ 
  isOpen, 
  onOpenChange, 
  onSubmit,
  inquiryData,
  onInquiryDataChange 
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
  inquiryData: any
  onInquiryDataChange: (data: any) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Inquiry</DialogTitle>
          <DialogDescription>
            Send a message to the property owner
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inquiry_type">Inquiry Type</Label>
            <Select
              value={inquiryData.inquiry_type}
              onValueChange={(value) => onInquiryDataChange({...inquiryData, inquiry_type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select inquiry type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Inquiry</SelectItem>
                <SelectItem value="viewing">Viewing Request</SelectItem>
                <SelectItem value="price">Price Inquiry</SelectItem>
                <SelectItem value="details">More Details</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_preference">Contact Preference</Label>
            <Select
              value={inquiryData.contact_preference}
              onValueChange={(value) => onInquiryDataChange({...inquiryData, contact_preference: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="any">Any</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message here..."
              value={inquiryData.message}
              onChange={(e) => onInquiryDataChange({...inquiryData, message: e.target.value})}
              rows={4}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={onSubmit}
            disabled={!inquiryData.message.trim()}
          >
            <Mail className="mr-2 h-4 w-4" />
            Send Inquiry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = parseInt(params.id as string)
  const { isAuthenticated, user } = useAuthStore()
  
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [inquiryData, setInquiryData] = useState({
    message: '',
    inquiry_type: 'general',
    contact_preference: 'any',
  })

  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => listingsApi.getPropertyById(propertyId),
    enabled: !!propertyId,
  })

  const { data: similarProperties, isLoading: isLoadingSimilar } = useQuery({
    queryKey: ['similar-properties', propertyId],
    queryFn: () => listingsApi.getSimilarProperties(propertyId),
    enabled: !!propertyId && !!property,
  })

  const { data: recommendedProperties } = useQuery({
    queryKey: ['recommended-properties'],
    queryFn: () => listingsApi.getRecommendations(),
    enabled: isAuthenticated,
  })

  const handleSaveProperty = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to save properties')
      return
    }

    try {
      await listingsApi.saveProperty(propertyId)
      setIsSaved(!isSaved)
      toast.success(isSaved ? 'Removed from saved' : 'Property saved!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save property')
    }
  }

  const handleShare = async (platform?: string) => {
    const url = window.location.href
    const title = property?.title || 'Check out this property'
    const text = property?.description?.substring(0, 100) || ''

    if (platform) {
      let shareUrl = ''
      switch (platform) {
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
          break
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
          break
        default:
          break
      }
      window.open(shareUrl, '_blank')
      return
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        })
      } catch (err) {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard!')
      } catch (err) {
        toast.error('Failed to copy link')
      }
    }
  }

  const handleContact = (method: 'call' | 'message') => {
    if (method === 'call' && property?.owner?.phone_number) {
      window.location.href = `tel:${property.owner.phone_number}`
    } else {
      setIsInquiryOpen(true)
    }
  }

  const handleSubmitInquiry = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to send inquiries')
      return
    }

    if (!inquiryData.message.trim()) {
      toast.error('Please enter a message')
      return
    }

    try {
      await listingsApi.createInquiry(propertyId, inquiryData)
      toast.success('Inquiry sent successfully!')
      setIsInquiryOpen(false)
      setInquiryData({
        message: '',
        inquiry_type: 'general',
        contact_preference: 'any',
      })
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send inquiry')
    }
  }

  const handleAddToComparison = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to comparison')
      return
    }

    try {
      await listingsApi.addToComparison(propertyId)
      toast.success('Added to comparison')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add to comparison')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadDetails = () => {
    toast.success('Downloading property details...')
  }

  const basicFeatures = [
    { icon: <Bed className="h-5 w-5" />, label: `${property?.bedrooms || 0} Bedrooms`, key: 'bedrooms' },
    { icon: <Bath className="h-5 w-5" />, label: `${property?.bathrooms || 0} Bathrooms`, key: 'bathrooms' },
    { icon: <Square className="h-5 w-5" />, label: `${property?.total_area || 0} m²`, key: 'total_area' },
    { icon: <Building className="h-5 w-5" />, label: `${property?.floors || 1} Floor${(property?.floors || 1) > 1 ? 's' : ''}`, key: 'floors' },
    { icon: <Calendar className="h-5 w-5" />, label: `Built ${property?.built_year || 'N/A'}`, key: 'built_year' },
  ]

  const amenities = [
    { key: 'has_parking', icon: <Car className="h-5 w-5" />, label: 'Parking', value: property?.has_parking },
    { key: 'has_garden', icon: <TreePine className="h-5 w-5" />, label: 'Garden', value: property?.has_garden },
    { key: 'has_security', icon: <Shield className="h-5 w-5" />, label: 'Security', value: property?.has_security },
    { key: 'has_furniture', icon: <Sofa className="h-5 w-5" />, label: 'Furnished', value: property?.has_furniture },
    { key: 'has_air_conditioning', icon: <Wind className="h-5 w-5" />, label: 'Air Conditioning', value: property?.has_air_conditioning },
    { key: 'has_internet', icon: <Wifi className="h-5 w-5" />, label: 'Internet', value: property?.has_internet },
    { key: 'has_generator', icon: <Zap className="h-5 w-5" />, label: 'Generator', value: property?.has_generator },
    { key: 'has_gym', icon: <Dumbbell className="h-5 w-5" />, label: 'Gym', value: property?.has_gym },
    { key: 'is_pet_friendly', icon: <Users className="h-5 w-5" />, label: 'Pet Friendly', value: property?.is_pet_friendly },
    { key: 'has_swimming_pool', icon: <Waves className="h-5 w-5" />, label: 'Swimming Pool', value: property?.has_swimming_pool },
    { key: 'has_elevator', icon: <Layers className="h-5 w-5" />, label: 'Elevator', value: property?.has_elevator },
    { key: 'is_wheelchair_accessible', icon: <Users className="h-5 w-5" />, label: 'Wheelchair Accessible', value: property?.is_wheelchair_accessible },
    { key: 'has_heating', icon: <Thermometer className="h-5 w-5" />, label: 'Heating', value: property?.has_heating },
    { key: 'has_backup_water', icon: <Coffee className="h-5 w-5" />, label: 'Backup Water', value: property?.has_backup_water },
  ].filter(item => item.value)

  const documents = [
    { key: 'has_title_deed', icon: <FileText className="h-5 w-5" />, label: 'Title Deed', value: property?.has_title_deed },
    { key: 'has_construction_permit', icon: <FileText className="h-5 w-5" />, label: 'Construction Permit', value: property?.has_construction_permit },
    { key: 'has_occupancy_certificate', icon: <FileText className="h-5 w-5" />, label: 'Occupancy Certificate', value: property?.has_occupancy_certificate },
  ].filter(item => item.value)

  const isOwner = user?.id === property?.owner?.id
  const canEdit = isOwner || user?.user_type === 'admin'

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
            <Home className="mx-auto h-12 w-12 text-muted-foreground" />
            <h1 className="mb-4 text-2xl font-bold">Property not found</h1>
            <p className="mb-6 text-muted-foreground">
              The property you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/listings')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Properties
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/listings')}
            className="inline-flex items-center"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Listings
          </Button>
          <span className="mx-2">•</span>
          <span>Properties</span>
          <span className="mx-2">•</span>
          <span>{property.city?.name}</span>
          <span className="mx-2">•</span>
          <span className="font-medium truncate max-w-xs">{property.title}</span>
        </nav>

        {/* Action Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {property.property_type.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">
              {property.listing_type.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">
              {property.furnishing_type.replace('_', ' ')}
            </Badge>
            {property.is_featured && (
              <Badge className="bg-primary text-primary-foreground">
                <Star className="mr-1 h-3 w-3" />
                Featured
              </Badge>
            )}
            {property.is_verified && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            )}
            {property.price_negotiable && (
              <Badge className="bg-blue-100 text-blue-800">
                <Percent className="mr-1 h-3 w-3" />
                Negotiable
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/listings/${propertyId}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Images Gallery */}
            <PropertyGallery 
              images={property.images || []}
              propertyTitle={property.title}
              propertyVideo={property.property_video}
            />

            {/* Title and Price */}
            <div className="mb-6 mt-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h1 className="mb-2 text-2xl font-bold md:text-3xl">{property.title}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="mr-1 h-4 w-4" />
                      <span>{property.specific_location}, {property.sub_city?.name}, {property.city?.name}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="mr-1 h-4 w-4" />
                      <span>Listed {formatDate(property.listed_date)}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center text-muted-foreground">
                      <Eye className="mr-1 h-4 w-4" />
                      <span>{property.views_count.toLocaleString()} views</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary md:text-3xl">
                    {property.listing_type === 'for_rent'
                      ? `${formatCurrency(property.monthly_rent || 0)}/month`
                      : formatCurrency(property.price_etb || 0)}
                  </div>
                  {property.price_per_sqm && (
                    <div className="text-sm text-muted-foreground">
                      {formatPricePerSqm(property.price_per_sqm)}
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Features */}
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
                {basicFeatures.map((feature) => (
                  <div key={feature.key} className="flex items-center gap-2 rounded-lg border p-3">
                    <div className="text-primary">{feature.icon}</div>
                    <div>
                      <div className="text-sm font-medium">{feature.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="mb-8">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="market">Market</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 pt-4">
                <div>
                  <h3 className="mb-3 text-xl font-semibold">Description</h3>
                  <p className="whitespace-pre-line text-muted-foreground">
                    {property.description}
                  </p>
                  {property.description_amharic && (
                    <div className="mt-4">
                      <h4 className="mb-2 font-medium">Description (Amharic)</h4>
                      <p className="whitespace-pre-line text-muted-foreground">
                        {property.description_amharic}
                      </p>
                    </div>
                  )}
                </div>

                {property.amenities && property.amenities.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-xl font-semibold">Amenities</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {property.amenities.map((amenity: any) => (
                        <div key={amenity.id} className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Globe className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-medium">{amenity.name}</span>
                            {amenity.name_amharic && (
                              <p className="text-sm text-muted-foreground">{amenity.name_amharic}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="features" className="space-y-6 pt-4">
                <div>
                  <h3 className="mb-4 text-xl font-semibold">Property Features</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {amenities.map((amenity) => (
                      <div key={amenity.key} className="flex items-center gap-3 rounded-lg border p-3">
                        <div className="text-primary">{amenity.icon}</div>
                        <span>{amenity.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {property.virtual_tour_url && (
                    <div>
                      <h4 className="mb-3 text-lg font-semibold">Virtual Tour</h4>
                      <Button asChild variant="outline">
                        <a 
                          href={property.virtual_tour_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Virtual Tour
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="location" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-medium">Address</h4>
                    <div className="space-y-1 rounded-lg border p-4">
                      {property.address_line_1 && <p className="font-medium">{property.address_line_1}</p>}
                      {property.address_line_2 && <p>{property.address_line_2}</p>}
                      <p>{property.specific_location}</p>
                      <p>{property.sub_city?.name}, {property.city?.name}</p>
                      {property.sub_city?.zip_code && <p>Zip Code: {property.sub_city.zip_code}</p>}
                    </div>
                  </div>
                  
                  <div className="h-96 rounded-lg border">
                    {/* Map Integration */}
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                      <MapPin className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">Map integration coming soon</p>
                      {property.latitude && property.longitude && (
                        <p className="text-sm text-muted-foreground">
                          Coordinates: {property.latitude}, {property.longitude}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Property Documents</h3>
                  {documents.map((doc) => (
                    <Card key={doc.key}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            {doc.icon}
                          </div>
                          <div>
                            <h4 className="font-medium">{doc.label}</h4>
                            <p className="text-sm text-muted-foreground">Available for verification</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Available
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {documents.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h4 className="mt-4 font-medium">No documents available</h4>
                      <p className="text-sm text-muted-foreground">
                        Contact the property owner for property documents
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="market" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Market Analysis</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-muted-foreground">Price per m²</div>
                            <div className="text-2xl font-bold">
                              {property.price_per_sqm ? formatPricePerSqm(property.price_per_sqm) : 'N/A'}
                            </div>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-muted-foreground">Days on Market</div>
                            <div className="text-2xl font-bold">{property.days_on_market || 0}</div>
                          </div>
                          <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div>
            <PropertySidebar 
              property={property}
              user={user}
              isSaved={isSaved}
              onSave={handleSaveProperty}
              onAddToComparison={handleAddToComparison}
              onContact={handleContact}
              onShare={handleShare}
              onPrint={handlePrint}
              onDownload={handleDownloadDetails}
            />
          </div>
        </div>

        {/* Similar Properties */}
        {!isLoadingSimilar && similarProperties && similarProperties.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Similar Properties</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/listings')}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {similarProperties.slice(0, 3).map((similarProperty: any) => (
                <PropertyCard 
                  key={similarProperty.id} 
                  property={similarProperty}
                  showComparisonButton={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recommended Properties */}
        {recommendedProperties && recommendedProperties.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">You Might Also Like</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/listings')}
              >
                Browse All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {recommendedProperties.slice(0, 4).map((property: any) => (
                <PropertyCard 
                  key={property.id} 
                  property={property}
                  compact={true}
                />
              ))}
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Information provided is for general guidance only. All measurements are approximate.
            Please verify all details with the property owner before making any decisions.
          </p>
        </div>

        {/* Inquiry Dialog */}
        <InquiryDialog 
          isOpen={isInquiryOpen}
          onOpenChange={setIsInquiryOpen}
          onSubmit={handleSubmitInquiry}
          inquiryData={inquiryData}
          onInquiryDataChange={setInquiryData}
        />
      </div>
    </div>
  )
}