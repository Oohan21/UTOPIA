// components/listings/PropertyCard.tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Property } from '@/lib/types/property'
import { listingsApi } from '@/lib/api/listings'
import { useAuthStore } from '@/lib/store/authStore'
import { useComparisonStore } from '@/lib/store/comparisonStore'
import { 
  Bed, 
  Bath, 
  Square, 
  MapPin, 
  Heart, 
  Star,
  CheckCircle,
  Car,
  Shield,
  TreePine,
  ExternalLink,
  Eye,
  Clock,
  Home
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatPricePerSqm } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
import toast from 'react-hot-toast'
import SafeImage from '@/components/common/SafeImage'

interface PropertyCardProps {
  property: Property
  viewMode?: 'grid' | 'list'
  showComparisonButton?: boolean
  compact?: boolean
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  viewMode = 'grid',
  showComparisonButton = true,
  compact = false
}) => {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { addToComparison, isInComparison } = useComparisonStore()
  const [isSaved, setIsSaved] = useState(false)

  // Get primary image or first image
  const primaryImage = property.images?.find(img => img.is_primary) || property.images?.[0]
  const imageUrl = primaryImage?.image || null

  const handleSaveProperty = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.error('Please login to save properties')
      return
    }

    try {
      await listingsApi.saveProperty(property.id)
      setIsSaved(!isSaved)
      toast.success(isSaved ? 'Removed from saved' : 'Property saved!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save property')
    }
  }

  const handleAddToComparison = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.error('Please login to add to comparison')
      return
    }

    try {
      await listingsApi.addToComparison(property.id)
      addToComparison(property)
      toast.success('Added to comparison')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add to comparison')
    }
  }

  const propertyUrl = `/listings/${property.id}`

  if (viewMode === 'list') {
    return (
      <Link href={propertyUrl} className="block">
        <div className="group flex flex-col gap-4 rounded-lg border bg-card p-4 transition-all hover:border-primary hover:shadow-md md:flex-row">
          {/* Image */}
          <div className="relative h-48 w-full overflow-hidden rounded-lg md:w-64 md:flex-shrink-0">
            <SafeImage
              src={imageUrl}
              alt={property.title}
              className="transition-transform group-hover:scale-105"
            />
            
            {/* Status Badges */}
            <div className="absolute left-2 top-2 flex flex-col gap-1">
              {property.is_featured && (
                <Badge className="bg-primary">
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
            </div>
            
            {/* Save Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleSaveProperty}
            >
              <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col">
            <div className="mb-2 flex flex-col justify-between gap-2 md:flex-row md:items-start">
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold line-clamp-1">{property.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {property.specific_location}, {property.sub_city?.name}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold text-primary">
                  {property.listing_type === 'for_rent'
                    ? `${formatCurrency(property.monthly_rent || 0)}/mo`
                    : formatCurrency(property.price_etb)}
                </div>
                {property.price_per_sqm && (
                  <div className="text-sm text-muted-foreground">
                    {formatPricePerSqm(property.price_per_sqm)}
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {property.bedrooms > 0 && (
                <div className="flex items-center gap-1 rounded-lg border p-2">
                  <Bed className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-sm font-medium">{property.bedrooms}</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center gap-1 rounded-lg border p-2">
                  <Bath className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-sm font-medium">{property.bathrooms}</span>
                </div>
              )}
              {property.total_area > 0 && (
                <div className="flex items-center gap-1 rounded-lg border p-2">
                  <Square className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-sm font-medium">{property.total_area} m²</span>
                </div>
              )}
              {property.has_parking && (
                <div className="flex items-center gap-1 rounded-lg border p-2">
                  <Car className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-sm font-medium">Parking</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
              {property.description}
            </p>

            {/* Footer */}
            <div className="mt-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(property.listed_date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{property.views_count.toLocaleString()} views</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {showComparisonButton && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddToComparison}
                    disabled={isInComparison(property.id)}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {isInComparison(property.id) ? 'In Comparison' : 'Compare'}
                  </Button>
                )}
                <Button size="sm">
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Grid View
  return (
    <Link href={propertyUrl} className="block">
      <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:border-primary hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <SafeImage
            src={imageUrl}
            alt={property.title}
            className="transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          
          {/* Status Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            <Badge variant="outline" className="bg-background/90 backdrop-blur-sm capitalize">
              {property.property_type}
            </Badge>
            {property.is_featured && (
              <Badge className="bg-primary">
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
          </div>
          
          {/* Listing Type Badge */}
          <Badge 
            variant="secondary" 
            className="absolute right-2 top-2 bg-background/90 backdrop-blur-sm capitalize"
          >
            {property.listing_type.replace('_', ' ')}
          </Badge>
          
          {/* Save Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={handleSaveProperty}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          
          {/* Price Tag */}
          <div className="absolute bottom-2 left-2 rounded-lg bg-background/90 px-3 py-2 backdrop-blur-sm">
            <div className="text-lg font-bold text-primary">
              {property.listing_type === 'for_rent'
                ? `${formatCurrency(property.monthly_rent || 0)}/mo`
                : formatCurrency(property.price_etb)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="mb-2 line-clamp-1 text-lg font-semibold">{property.title}</h3>
          
          <div className="mb-3 flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {property.specific_location}, {property.sub_city?.name}
            </span>
          </div>

          {/* Features */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            {property.bedrooms > 0 && (
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-sm truncate">{property.bedrooms} Bedrooms</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center gap-2">
                <Bath className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-sm truncate">{property.bathrooms} Bathrooms</span>
              </div>
            )}
            {property.total_area > 0 && (
              <div className="flex items-center gap-2">
                <Square className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-sm truncate">{property.total_area} m²</span>
              </div>
            )}
            {property.has_parking && (
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 flex-shrink-0 text-primary" />
                <span className="text-sm truncate">Parking</span>
              </div>
            )}
          </div>

          {/* Additional Features */}
          {(property.has_garden || property.has_security || property.has_furniture) && !compact && (
            <div className="mb-4 flex flex-wrap gap-1">
              {property.has_garden && (
                <Badge variant="outline" className="gap-1">
                  <TreePine className="h-3 w-3" />
                  Garden
                </Badge>
              )}
              {property.has_security && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Security
                </Badge>
              )}
              {property.has_furniture && (
                <Badge variant="outline">Furnished</Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {property.views_count.toLocaleString()} views
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {showComparisonButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddToComparison}
                  disabled={isInComparison(property.id)}
                  className="w-full sm:w-auto"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Compare
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default PropertyCard