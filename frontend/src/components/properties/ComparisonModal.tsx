// src/components/properties/ComparisonModal.tsx
import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ScrollArea } from '@/components/ui/Scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import {
  XIcon,
  DownloadIcon,
  SaveIcon,
  BarChart3Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  CheckCircleIcon,
  FileTextIcon,
  StarIcon,
  FilterIcon,
  Share2Icon,
  PrinterIcon,
  MailIcon,
  SparklesIcon,
  AlertCircleIcon,
  HomeIcon,
  DollarSignIcon,
  CalendarIcon,
  MapPinIcon
} from 'lucide-react'
import { useComparison } from '@/lib/hooks/useComparison'
import { ComparisonUtils } from '@/lib/utils/comparison'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'
import { Separator } from '@/components/ui/Separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface ComparisonModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose }) => {
  const {
    comparisonProperties,
    removeFromComparison,
    saveComparison,
    exportComparison,
    compareProperties,
    isLoading,
    clearComparison,
    savedComparisons
  } = useComparison()

  const router = useRouter()
  const [saveName, setSaveName] = useState('')
  const [comparisonResult, setComparisonResult] = useState<any>(null)
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false)
  const [sortBy, setSortBy] = useState<string>('listing_type')
  const [shareLink, setShareLink] = useState<string>('')

  // Define all available comparison fields with rent/sale differentiation
  const allFields = [
    // Basic Info
    { id: 'listing_type', label: 'Listing Type', category: 'basic', icon: '🏷️' },
    { id: 'property_type', label: 'Property Type', category: 'basic', icon: '🏠' },

    // Financial - Sale
    { id: 'price_etb', label: 'Sale Price', category: 'sale_financial', icon: '💰', showIf: 'for_sale' },
    { id: 'price_per_sqm', label: 'Price per m²', category: 'sale_financial', icon: '📐', showIf: 'for_sale' },

    // Financial - Rent
    { id: 'monthly_rent', label: 'Monthly Rent', category: 'rent_financial', icon: '💵', showIf: 'for_rent' },
    { id: 'rent_per_sqm', label: 'Rent per m²', category: 'rent_financial', icon: '📏', showIf: 'for_rent' },

    // Specifications
    { id: 'total_area', label: 'Total Area', category: 'specifications', icon: '📊' },
    { id: 'bedrooms', label: 'Bedrooms', category: 'specifications', icon: '🛏️' },
    { id: 'bathrooms', label: 'Bathrooms', category: 'specifications', icon: '🚿' },
    { id: 'built_year', label: 'Built Year', category: 'specifications', icon: '🏗️' },

    // Location
    { id: 'city', label: 'City', category: 'location', icon: '🏙️' },
    { id: 'sub_city', label: 'Sub City', category: 'location', icon: '📍' },

    // Amenities
    { id: 'has_parking', label: 'Parking', category: 'amenities', icon: '🅿️' },
    { id: 'has_garden', label: 'Garden', category: 'amenities', icon: '🌳' },
    { id: 'has_security', label: 'Security', category: 'amenities', icon: '🔒' },
    { id: 'has_furniture', label: 'Furnished', category: 'amenities', icon: '🛋️' },
    { id: 'has_air_conditioning', label: 'Air Conditioning', category: 'amenities', icon: '❄️' },
    { id: 'has_elevator', label: 'Elevator', category: 'amenities', icon: '⬆️' },
    { id: 'is_pet_friendly', label: 'Pet Friendly', category: 'amenities', icon: '🐾' },

    // Media & Verification
    { id: 'virtual_tour_url', label: 'Virtual Tour', category: 'media', icon: '🎥' },
    { id: 'is_verified', label: 'Verified', category: 'verification', icon: '✓' },
    { id: 'is_featured', label: 'Featured', category: 'verification', icon: '⭐' },

    // Market
    { id: 'days_on_market', label: 'Days on Market', category: 'market', icon: '📅' },
    { id: 'views_count', label: 'Views', category: 'market', icon: '👁️' },
    { id: 'save_count', label: 'Saves', category: 'market', icon: '💾' },
  ]

  // Initialize selected fields with default ones
  useEffect(() => {
    if (comparisonProperties.length > 0 && selectedFields.length === 0) {
      const defaultFields = [
        'listing_type',
        'property_type',
        'total_area',
        'bedrooms',
        'bathrooms',
        'built_year',
        'has_parking',
        'has_security',
        'city'
      ]
      // Add type-specific fields based on properties
      const hasSale = comparisonProperties.some(p => p.listing_type === 'for_sale')
      const hasRent = comparisonProperties.some(p => p.listing_type === 'for_rent')

      if (hasSale) {
        defaultFields.push('price_etb', 'price_per_sqm')
      }
      if (hasRent) {
        defaultFields.push('monthly_rent', 'rent_per_sqm')
      }

      setSelectedFields(defaultFields)
    }
  }, [comparisonProperties])

  const handleCompare = async () => {
    const result = await compareProperties()
    if (result) {
      setComparisonResult(result)
      if (result.warning) {
        toast(result.warning, {
          duration: 5000,
          icon: '⚠️',
        })
      }
    }
  }

  const handleSave = async () => {
    const name = saveName || `Comparison ${new Date().toLocaleDateString()}`
    const result = await saveComparison(name)
    if (result) {
      setSaveName('')
    }
  }

  const handleClear = async () => {
    await clearComparison()
    setComparisonResult(null)
    setSelectedFields([])
  }

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    await exportComparison(format)
  }

  const handleShare = async () => {
    try {
      // Generate shareable link
      const propertyIds = comparisonProperties.map(p => p.id).join(',')
      const shareUrl = `${window.location.origin}/comparison/share?ids=${propertyIds}`

      setShareLink(shareUrl)

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!', {
        duration: 3000,
        icon: '📋',
      })
    } catch (error) {
      toast.error('Failed to generate share link', {
        duration: 4000,
        icon: '❌',
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEmail = () => {
    const subject = `Property Comparison: ${comparisonProperties.length} Properties`
    const body = `Check out this property comparison:\n\n${comparisonProperties.map((p, i) =>
      `${i + 1}. ${p.title} - ${p.listing_type === 'for_sale' ? (p.price_etb?.toLocaleString() + ' ETB') : (p.monthly_rent?.toLocaleString() + ' ETB/month')}`
    ).join('\n')}`

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  // Check if we have mixed listing types
  const hasMixedTypes = comparisonProperties.some(p => p.listing_type === 'for_sale') &&
    comparisonProperties.some(p => p.listing_type === 'for_rent')

  // Get filtered properties based on selected fields and listing types
  const getFilteredFields = () => {
    return selectedFields.filter(fieldId => {
      const fieldInfo = allFields.find(f => f.id === fieldId)
      if (!fieldInfo) return true

      // Check if field should be shown based on property types
      if (fieldInfo.showIf === 'for_sale') {
        return comparisonProperties.some(p => p.listing_type === 'for_sale')
      }
      if (fieldInfo.showIf === 'for_rent') {
        return comparisonProperties.some(p => p.listing_type === 'for_rent')
      }

      return true
    })
  }

  // Sort properties based on selected criteria
  const sortedProperties = [...comparisonProperties].sort((a, b) => {
    switch (sortBy) {
      case 'listing_type':
        return (a.listing_type || '').localeCompare(b.listing_type || '')
      case 'price':
        if (a.listing_type === 'for_sale' && b.listing_type === 'for_sale') {
          return (a.price_etb || 0) - (b.price_etb || 0)
        }
        if (a.listing_type === 'for_rent' && b.listing_type === 'for_rent') {
          return (a.monthly_rent || 0) - (b.monthly_rent || 0)
        }
        return (a.listing_type || '').localeCompare(b.listing_type || '')
      case 'price_per_sqm':
        const aPricePerSqm = a.price_etb && a.total_area ? a.price_etb / a.total_area : 0
        const bPricePerSqm = b.price_etb && b.total_area ? b.price_etb / b.total_area : 0
        return aPricePerSqm - bPricePerSqm
      case 'rent_per_sqm':
        const aRentPerSqm = a.monthly_rent && a.total_area ? a.monthly_rent / a.total_area : 0
        const bRentPerSqm = b.monthly_rent && b.total_area ? b.monthly_rent / b.total_area : 0
        return aRentPerSqm - bRentPerSqm
      case 'area':
        return (a.total_area || 0) - (b.total_area || 0)
      case 'bedrooms':
        return (a.bedrooms || 0) - (b.bedrooms || 0)
      default:
        return 0
    }
  })

  // Calculate comparison data
  const comparisonData = ComparisonUtils.formatComparisonData(comparisonProperties)
  const stats = ComparisonUtils.calculateComparisonStats(comparisonProperties)
  const recommendations = ComparisonUtils.generateComparisonRecommendations(comparisonProperties)
  const topFeatures = stats?.amenities?.topFeatures || []

  // Filter fields to show only selected ones and check for differences
  const filteredFields = getFilteredFields()
  const fieldsToShow = showOnlyDifferences
    ? filteredFields.filter(field => {
      const values = comparisonData.matrix[field] || []
      const uniqueValues = new Set(values.map(v => String(v)))
      return uniqueValues.size > 1
    })
    : filteredFields

  const hasSmartInsights = comparisonProperties.length >= 3
  const showBestValue = stats?.pricePerSqm?.bestValue

  // Field category groups
  const fieldCategories = [
    { id: 'basic', label: 'Basic Info', icon: '📋' },
    { id: 'sale_financial', label: 'Sale Financial', icon: '💰' },
    { id: 'rent_financial', label: 'Rent Financial', icon: '💵' },
    { id: 'specifications', label: 'Specifications', icon: '📏' },
    { id: 'location', label: 'Location', icon: '📍' },
    { id: 'amenities', label: 'Amenities', icon: '⭐' },
    { id: 'media', label: 'Media', icon: '🎥' },
    { id: 'verification', label: 'Verification', icon: '✓' },
    { id: 'market', label: 'Market', icon: '📈' },
  ]

  const getCategoryIcon = (categoryId: string) => {
    const category = fieldCategories.find(c => c.id === categoryId)
    return category?.icon || '📋'
  }

  // Helper to render recommendations safely
  const renderRecommendation = (rec: any) => {
    if (typeof rec === 'string') {
      return rec
    } else if (rec && typeof rec === 'object') {
      if (rec.message) {
        return rec.message
      } else if (rec.suggestion) {
        return rec.suggestion
      } else if (rec.title) {
        return rec.title
      }
    }
    return 'Recommendation'
  }

  // Get field info with icon
  const getFieldInfo = (fieldId: string) => {
    const field = allFields.find(f => f.id === fieldId)
    return field || { id: fieldId, label: fieldId.replace(/_/g, ' '), icon: '📋' }
  }

  // Calculate best values for mixed types
  const getBestValueByType = () => {
    const saleProperties = comparisonProperties.filter(p => p.listing_type === 'for_sale')
    const rentProperties = comparisonProperties.filter(p => p.listing_type === 'for_rent')

    let bestSaleValue = null
    let bestRentValue = null

    if (saleProperties.length > 0) {
      const saleWithPrice = saleProperties.filter(p => p.price_etb && p.total_area)
      if (saleWithPrice.length > 0) {
        bestSaleValue = saleWithPrice.reduce((best, current) => {
          const currentValue = current.price_etb! / current.total_area!
          const bestValue = best.price_etb! / best.total_area!
          return currentValue < bestValue ? current : best
        })
      }
    }

    if (rentProperties.length > 0) {
      const rentWithPrice = rentProperties.filter(p => p.monthly_rent && p.total_area)
      if (rentWithPrice.length > 0) {
        bestRentValue = rentWithPrice.reduce((best, current) => {
          const currentValue = current.monthly_rent! / current.total_area!
          const bestValue = best.monthly_rent! / best.total_area!
          return currentValue < bestValue ? current : best
        })
      }
    }

    return { bestSaleValue, bestRentValue }
  }

  const { bestSaleValue, bestRentValue } = getBestValueByType()

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="flex items-center gap-2">
                <BarChart3Icon className="h-5 w-5" />
                Property Comparison
                <Badge variant="secondary" className="ml-2">
                  {comparisonProperties.length} properties
                </Badge>
                {hasMixedTypes && (
                  <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
                    <AlertCircleIcon className="h-3 w-3 mr-1" />
                    Mixed Types
                  </Badge>
                )}
              </DialogTitle>
              {hasSmartInsights && (
                <Badge variant="outline" className="gap-1 bg-primary/10">
                  <SparklesIcon className="h-3 w-3" />
                  Smart Insights
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={comparisonProperties.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-muted/50 mx-6 rounded-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="listing_type">Listing Type</SelectItem>
                <SelectItem value="price">Price (Low to High)</SelectItem>
                <SelectItem value="price_per_sqm">Price per m²</SelectItem>
                <SelectItem value="rent_per_sqm">Rent per m²</SelectItem>
                <SelectItem value="area">Area (Small to Large)</SelectItem>
                <SelectItem value="bedrooms">Bedrooms</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                id="differences"
                checked={showOnlyDifferences}
                onCheckedChange={setShowOnlyDifferences}
              />
              <Label htmlFor="differences" className="text-sm">
                Show only differences
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleShare}>
                    <Share2Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share Comparison</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handlePrint}>
                    <PrinterIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print Comparison</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleEmail}>
                    <MailIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Email Comparison</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <ScrollArea className="h-[65vh] px-6">
          {comparisonProperties.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3Icon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No properties to compare</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add properties to comparison from property listings to start comparing features, prices, and amenities side by side.
              </p>
              <Button onClick={() => router.push('/listings')}>
                Browse Properties
              </Button>
            </div>
          ) : (
            <>
              {/* Property Cards Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {sortedProperties.map((property, index) => (
                  <Card key={property.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-full hover:bg-destructive/10"
                          onClick={() => removeFromComparison(property.id)}
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                          <span className="font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate text-sm">
                              {property.title || `Property ${property.id}`}
                            </h4>
                            <Badge
                              variant={property.listing_type === 'for_sale' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {property.listing_type === 'for_sale' ? 'for_Sale' : 'for_Rent'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {property.city?.name}, {property.sub_city?.name}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {property.listing_type === 'for_sale' ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price:</span>
                              <span className="font-semibold">
                                {property.price_etb?.toLocaleString() || 'N/A'} ETB
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price/m²:</span>
                              <span>
                                {property.price_etb && property.total_area
                                  ? Math.round(property.price_etb / property.total_area).toLocaleString()
                                  : 'N/A'} ETB
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Monthly Rent:</span>
                              <span className="font-semibold">
                                {property.monthly_rent?.toLocaleString() || 'N/A'} ETB
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rent/m²:</span>
                              <span>
                                {property.monthly_rent && property.total_area
                                  ? Math.round(property.monthly_rent / property.total_area).toLocaleString()
                                  : 'N/A'} ETB
                              </span>
                            </div>
                          </>
                        )}

                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Area:</span>
                          <span>{property.total_area || 'N/A'} m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bedrooms:</span>
                          <span>{property.bedrooms || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Best value indicators */}
                      {bestSaleValue?.id === property.id && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center gap-1 text-green-700 text-xs font-medium">
                            <DollarSignIcon className="h-3 w-3" />
                            Best Sale Value
                          </div>
                        </div>
                      )}

                      {bestRentValue?.id === property.id && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center gap-1 text-blue-700 text-xs font-medium">
                            <HomeIcon className="h-3 w-3" />
                            Best Rent Value
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Warning for mixed types */}
              {hasMixedTypes && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800">Mixed Listing Types</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        You are comparing properties for sale and for rent. Some financial metrics may not be directly comparable.
                        Consider filtering by listing type for more accurate comparisons.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Tabs defaultValue="table" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="table" className="flex items-center gap-2">
                    <FileTextIcon className="h-4 w-4" />
                    Comparison Table
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-2">
                    <BarChart3Icon className="h-4 w-4" />
                    Statistics
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" />
                    Smart Insights
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4" />
                    Recommendations
                  </TabsTrigger>
                  <TabsTrigger value="fields" className="flex items-center gap-2">
                    <FilterIcon className="h-4 w-4" />
                    Customize Fields
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="table" className="mt-4">
                  {fieldsToShow.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg">
                      <AlertCircleIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No fields selected for comparison</p>
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => {
                          const visibleFields = allFields.filter(field => {
                            if (field.showIf === 'for_sale') {
                              return comparisonProperties.some(p => p.listing_type === 'for_sale')
                            }
                            if (field.showIf === 'for_rent') {
                              return comparisonProperties.some(p => p.listing_type === 'for_rent')
                            }
                            return true
                          }).map(f => f.id)
                          setSelectedFields(visibleFields)
                        }}
                      >
                        Select all visible fields
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[250px] sticky left-0 bg-background z-10 border-r">
                              <div className="flex items-center gap-2">
                                <span>Feature</span>
                                {showOnlyDifferences && (
                                  <Badge variant="outline" className="text-xs">
                                    Differences Only
                                  </Badge>
                                )}
                              </div>
                            </TableHead>
                            {sortedProperties.map((property, index) => (
                              <TableHead key={property.id} className="text-center min-w-[200px] bg-muted/50">
                                <div className="flex flex-col items-center">
                                  <span className="font-medium">Property {index + 1}</span>
                                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {property.title?.slice(0, 20)}...
                                  </span>
                                  <Badge
                                    variant={property.listing_type === 'for_sale' ? 'default' : 'secondary'}
                                    className="mt-1 text-xs"
                                  >
                                    {property.listing_type === 'for_sale' ? 'For Sale' : 'For Rent'}
                                  </Badge>
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fieldsToShow.map(field => {
                            const fieldInfo = getFieldInfo(field)
                            const values = comparisonData.matrix[field] || []
                            const uniqueValues = new Set(values.map(v => String(v)))
                            const hasDifferences = uniqueValues.size > 1

                            return (
                              <TableRow
                                key={field}
                                className={hasDifferences ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-muted/50'}
                              >
                                <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">
                                      {fieldInfo.icon}
                                    </span>
                                    <span className="capitalize">{fieldInfo.label}</span>
                                    {hasDifferences && showOnlyDifferences && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        Diff
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                {sortedProperties.map((property, index) => {
                                  const value = comparisonData.matrix[field]?.[comparisonProperties.indexOf(property)]
                                  const isBestSaleValue = field === 'price_per_sqm' && bestSaleValue?.id === property.id
                                  const isBestRentValue = field === 'rent_per_sqm' && bestRentValue?.id === property.id

                                  return (
                                    <TableCell key={index} className="text-center">
                                      <div className={`inline-flex items-center justify-center min-h-[24px] px-2 py-1 rounded ${hasDifferences ? 'font-semibold' : ''
                                        } ${isBestSaleValue ? 'bg-green-50 text-green-700' : ''} ${isBestRentValue ? 'bg-blue-50 text-blue-700' : ''}`}>
                                        {value === true ? (
                                          <span className="text-green-600">✓</span>
                                        ) : value === false ? (
                                          <span className="text-red-600">✗</span>
                                        ) : value === null || value === undefined ? (
                                          <span className="text-muted-foreground">-</span>
                                        ) : (
                                          <span>
                                            {field === 'price_etb' || field === 'monthly_rent'
                                              ? typeof value === 'number' ? value.toLocaleString() : value
                                              : value
                                            }
                                            {field === 'price_etb' && ' ETB'}
                                            {field === 'monthly_rent' && ' ETB/month'}
                                          </span>
                                        )}
                                        {isBestSaleValue && (
                                          <DollarSignIcon className="h-3 w-3 ml-1 text-green-600" />
                                        )}
                                        {isBestRentValue && (
                                          <HomeIcon className="h-3 w-3 ml-1 text-blue-600" />
                                        )}
                                      </div>
                                    </TableCell>
                                  )
                                })}
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="stats" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Sale Statistics */}
                    {comparisonProperties.some(p => p.listing_type === 'for_sale') && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSignIcon className="h-4 w-4" />
                            Sale Properties Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Sale Properties:</span>
                              <span className="font-medium">
                                {comparisonProperties.filter(p => p.listing_type === 'for_sale').length}
                              </span>
                            </div>
                            {bestSaleValue && (
                              <>
                                <div className="pt-2 border-t">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Best Value:</span>
                                    <span className="font-medium flex items-center gap-1 text-green-600">
                                      {bestSaleValue.title?.slice(0, 15)}...
                                      <TrendingDownIcon className="h-4 w-4" />
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {bestSaleValue.price_etb && bestSaleValue.total_area
                                      ? `${Math.round(bestSaleValue.price_etb / bestSaleValue.total_area).toLocaleString()} ETB/m²`
                                      : ''
                                    }
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Rent Statistics */}
                    {comparisonProperties.some(p => p.listing_type === 'for_rent') && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <HomeIcon className="h-4 w-4" />
                            Rent Properties Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Rent Properties:</span>
                              <span className="font-medium">
                                {comparisonProperties.filter(p => p.listing_type === 'for_rent').length}
                              </span>
                            </div>
                            {bestRentValue && (
                              <>
                                <div className="pt-2 border-t">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Best Value:</span>
                                    <span className="font-medium flex items-center gap-1 text-blue-600">
                                      {bestRentValue.title?.slice(0, 15)}...
                                      <TrendingDownIcon className="h-4 w-4" />
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {bestRentValue.monthly_rent && bestRentValue.total_area
                                      ? `${Math.round(bestRentValue.monthly_rent / bestRentValue.total_area).toLocaleString()} ETB/m²`
                                      : ''
                                    }
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Common Statistics */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <BarChart3Icon className="h-4 w-4" />
                          Common Features
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Avg. Area:</span>
                            <span className="font-medium">
                              {stats?.area?.avg ? stats.area.avg.toFixed(0) : 0} m²
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Avg. Bedrooms:</span>
                            <span className="font-medium">
                              {stats?.bedrooms?.avg ? stats.bedrooms.avg.toFixed(1) : 0}
                            </span>
                          </div>
                          {topFeatures.length > 0 && (
                            <div className="pt-2 border-t">
                              <span className="text-sm text-muted-foreground">Top Amenities:</span>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {topFeatures.slice(0, 4).map((feature, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="mt-4">
                  {hasSmartInsights ? (
                    <div className="space-y-4">
                      <Card className="border-primary/20">
                        <CardHeader>
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <SparklesIcon className="h-4 w-4" />
                            Key Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* Mixed Type Warning */}
                            {hasMixedTypes && (
                              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                  <AlertCircleIcon className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">Mixed Listing Types</h4>
                                  <p className="text-sm text-amber-700 mt-1">
                                    You're comparing {comparisonProperties.filter(p => p.listing_type === 'for_sale').length} properties for sale
                                    and {comparisonProperties.filter(p => p.listing_type === 'for_rent').length} for rent.
                                    Consider comparing similar types for more accurate insights.
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Sale Insights */}
                            {comparisonProperties.some(p => p.listing_type === 'for_sale') && (
                              <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                  <DollarSignIcon className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">Sale Properties</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {bestSaleValue
                                      ? `"${bestSaleValue.title?.slice(0, 30)}..." offers the best value per square meter for sale properties.`
                                      : 'Review sale properties for investment opportunities.'
                                    }
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Rent Insights */}
                            {comparisonProperties.some(p => p.listing_type === 'for_rent') && (
                              <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <HomeIcon className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">Rent Properties</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {bestRentValue
                                      ? `"${bestRentValue.title?.slice(0, 30)}..." offers the best rent value per square meter.`
                                      : 'Consider rental yield and location for rent properties.'
                                    }
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Feature Insights */}
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <StarIcon className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">Feature Comparison</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {topFeatures.length > 0
                                    ? `Top amenities include: ${topFeatures.slice(0, 3).join(', ')}.`
                                    : 'Properties have similar amenities.'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {recommendations && recommendations.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Smart Recommendations</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {recommendations.slice(0, 3).map((rec, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm">{renderRecommendation(rec)}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg">
                      <SparklesIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Add at least 3 properties to get smart insights</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="recommendations" className="mt-4">
                  {recommendations && recommendations.length > 0 ? (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {recommendations.map((recommendation, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-medium">{index + 1}</span>
                                </div>
                                <p className="text-sm">{renderRecommendation(recommendation)}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg">
                      <CheckCircleIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No recommendations available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="fields" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Customize Comparison Fields</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Select which fields to include in the comparison table
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const visibleFields = allFields.filter(field => {
                                  if (field.showIf === 'for_sale') {
                                    return comparisonProperties.some(p => p.listing_type === 'for_sale')
                                  }
                                  if (field.showIf === 'for_rent') {
                                    return comparisonProperties.some(p => p.listing_type === 'for_rent')
                                  }
                                  return true
                                }).map(f => f.id)
                                setSelectedFields(visibleFields)
                              }}
                            >
                              Select All Visible
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFields([])}
                            >
                              Clear All
                            </Button>
                          </div>
                          <Badge variant="secondary">
                            {selectedFields.length} fields selected
                          </Badge>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          {fieldCategories.map(category => {
                            const categoryFields = allFields.filter(f => f.category === category.id)
                            // Filter fields that should be visible based on property types
                            const visibleCategoryFields = categoryFields.filter(field => {
                              if (field.showIf === 'for_sale') {
                                return comparisonProperties.some(p => p.listing_type === 'for_sale')
                              }
                              if (field.showIf === 'for_rent') {
                                return comparisonProperties.some(p => p.listing_type === 'for_rent')
                              }
                              return true
                            })

                            const selectedInCategory = visibleCategoryFields.filter(f => selectedFields.includes(f.id))

                            if (visibleCategoryFields.length === 0) return null

                            return (
                              <div key={category.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm flex items-center gap-2">
                                    <span>{category.icon}</span>
                                    {category.label}
                                    <Badge variant="outline" className="ml-2">
                                      {selectedInCategory.length}/{visibleCategoryFields.length}
                                    </Badge>
                                  </h4>
                                  {visibleCategoryFields.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const allSelected = selectedInCategory.length === visibleCategoryFields.length
                                        if (allSelected) {
                                          setSelectedFields(prev =>
                                            prev.filter(id => !visibleCategoryFields.map(f => f.id).includes(id))
                                          )
                                        } else {
                                          setSelectedFields(prev => [
                                            ...prev,
                                            ...visibleCategoryFields.map(f => f.id).filter(id => !prev.includes(id))
                                          ])
                                        }
                                      }}
                                    >
                                      {selectedInCategory.length === visibleCategoryFields.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {visibleCategoryFields.map(field => (
                                    <div
                                      key={field.id}
                                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${selectedFields.includes(field.id)
                                        ? 'bg-primary/10 border-primary/30'
                                        : 'hover:bg-muted/50'
                                        }`}
                                      onClick={() => {
                                        setSelectedFields(prev =>
                                          prev.includes(field.id)
                                            ? prev.filter(id => id !== field.id)
                                            : [...prev, field.id]
                                        )
                                      }}
                                    >
                                      <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedFields.includes(field.id)
                                        ? 'bg-primary border-primary'
                                        : 'border-muted-foreground/30'
                                        }`}>
                                        {selectedFields.includes(field.id) && (
                                          <CheckCircleIcon className="h-3 w-3 text-primary-foreground" />
                                        )}
                                      </div>
                                      <span className="text-sm flex items-center gap-2">
                                        <span>{field.icon}</span>
                                        {field.label}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </ScrollArea>

        {/* Action Footer */}
        <DialogFooter className="p-6 pt-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Save as:</span>
                <Input
                  placeholder="Comparison name"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-48"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={comparisonProperties.length < 2}
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={comparisonProperties.length < 2}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
                disabled={comparisonProperties.length < 2}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button
                onClick={handleCompare}
                disabled={comparisonProperties.length < 2 || isLoading}
              >
                {isLoading ? 'Comparing...' : 'Compare Properties'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}