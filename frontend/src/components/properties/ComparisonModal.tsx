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
  RefreshCw,
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
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

interface ComparisonModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations('comparisonModal')
  const locale = useLocale()
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

  const allFields = [
    { id: 'listing_type', label: t('fields.listingType'), category: 'basic', icon: '🏷️' },
    { id: 'property_type', label: t('fields.propertyType'), category: 'basic', icon: '🏠' },
    { id: 'price_etb', label: t('fields.salePrice'), category: 'sale_financial', icon: '💰', showIf: 'for_sale' },
    { id: 'price_per_sqm', label: t('fields.pricePerSqm'), category: 'sale_financial', icon: '📐', showIf: 'for_sale' },
    { id: 'monthly_rent', label: t('fields.monthlyRent'), category: 'rent_financial', icon: '💵', showIf: 'for_rent' },
    { id: 'rent_per_sqm', label: t('fields.rentPerSqm'), category: 'rent_financial', icon: '📏', showIf: 'for_rent' },
    { id: 'total_area', label: t('fields.totalArea'), category: 'specifications', icon: '📊' },
    { id: 'bedrooms', label: t('fields.bedrooms'), category: 'specifications', icon: '🛏️' },
    { id: 'bathrooms', label: t('fields.bathrooms'), category: 'specifications', icon: '🚿' },
    { id: 'built_year', label: t('fields.builtYear'), category: 'specifications', icon: '🏗️' },
    { id: 'city', label: t('fields.city'), category: 'location', icon: '🏙️' },
    { id: 'sub_city', label: t('fields.subCity'), category: 'location', icon: '📍' },
    { id: 'has_parking', label: t('fields.parking'), category: 'amenities', icon: '🅿️' },
    { id: 'has_garden', label: t('fields.garden'), category: 'amenities', icon: '🌳' },
    { id: 'has_security', label: t('fields.security'), category: 'amenities', icon: '🔒' },
    { id: 'has_furniture', label: t('fields.furnished'), category: 'amenities', icon: '🛋️' },
    { id: 'has_air_conditioning', label: t('fields.airConditioning'), category: 'amenities', icon: '❄️' },
    { id: 'has_elevator', label: t('fields.elevator'), category: 'amenities', icon: '⬆️' },
    { id: 'is_pet_friendly', label: t('fields.petFriendly'), category: 'amenities', icon: '🐾' },
    { id: 'virtual_tour_url', label: t('fields.virtualTour'), category: 'media', icon: '🎥' },
    { id: 'is_verified', label: t('fields.verified'), category: 'verification', icon: '✓' },
    { id: 'is_featured', label: t('fields.featured'), category: 'verification', icon: '⭐' },
    { id: 'days_on_market', label: t('fields.daysOnMarket'), category: 'market', icon: '📅' },
    { id: 'views_count', label: t('fields.views'), category: 'market', icon: '👁️' },
    { id: 'save_count', label: t('fields.saves'), category: 'market', icon: '💾' },
  ]

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
    const name = saveName || `${t('actions.saveDefaultName')} ${new Date().toLocaleDateString()}`
    const result = await saveComparison(name)
    if (result) {
      setSaveName('')
      toast.success(t('toasts.savedSuccess'))
    }
  }

  const handleClear = async () => {
    await clearComparison()
    setComparisonResult(null)
    setSelectedFields([])
    toast.success(t('toasts.clearedSuccess'))
  }

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    await exportComparison(format)
    toast.success(t(`toasts.exported.${format}`))
  }

  const handleShare = async () => {
    try {
      const propertyIds = comparisonProperties.map(p => p.id).join(',')
      const shareUrl = `${window.location.origin}/comparison/share?ids=${propertyIds}`
      setShareLink(shareUrl)
      await navigator.clipboard.writeText(shareUrl)
      toast.success(t('toasts.linkCopied'))
    } catch (error) {
      toast.error(t('toasts.shareFailed'))
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleEmail = () => {
    const subject = `${t('email.subject')}: ${comparisonProperties.length} ${t('email.properties')}`
    const body = `${t('email.body')}:\n\n${comparisonProperties.map((p, i) =>
      `${i + 1}. ${p.title} - ${p.listing_type === 'for_sale' ? (p.price_etb?.toLocaleString() + ' ETB') : (p.monthly_rent?.toLocaleString() + ' ETB/month')}`
    ).join('\n')}`

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const hasMixedTypes = comparisonProperties.some(p => p.listing_type === 'for_sale') &&
    comparisonProperties.some(p => p.listing_type === 'for_rent')

  const getFilteredFields = () => {
    return selectedFields.filter(fieldId => {
      const fieldInfo = allFields.find(f => f.id === fieldId)
      if (!fieldInfo) return true

      if (fieldInfo.showIf === 'for_sale') {
        return comparisonProperties.some(p => p.listing_type === 'for_sale')
      }
      if (fieldInfo.showIf === 'for_rent') {
        return comparisonProperties.some(p => p.listing_type === 'for_rent')
      }

      return true
    })
  }

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

  const comparisonData = ComparisonUtils.formatComparisonData(comparisonProperties)
  const stats = ComparisonUtils.calculateComparisonStats(comparisonProperties)
  const recommendations = ComparisonUtils.generateComparisonRecommendations(comparisonProperties)
  const topFeatures = stats?.amenities?.topFeatures || []

  const filteredFields = getFilteredFields()
  const fieldsToShow = showOnlyDifferences
    ? filteredFields.filter(field => {
      const values = comparisonData.matrix[field] || []
      const uniqueValues = new Set(values.map(v => String(v)))
      return uniqueValues.size > 1
    })
    : filteredFields

  const hasSmartInsights = comparisonProperties.length >= 3

  const fieldCategories = [
    { id: 'basic', label: t('categories.basic'), icon: '📋' },
    { id: 'sale_financial', label: t('categories.saleFinancial'), icon: '💰' },
    { id: 'rent_financial', label: t('categories.rentFinancial'), icon: '💵' },
    { id: 'specifications', label: t('categories.specifications'), icon: '📏' },
    { id: 'location', label: t('categories.location'), icon: '📍' },
    { id: 'amenities', label: t('categories.amenities'), icon: '⭐' },
    { id: 'media', label: t('categories.media'), icon: '🎥' },
    { id: 'verification', label: t('categories.verification'), icon: '✓' },
    { id: 'market', label: t('categories.market'), icon: '📈' },
  ]

  const getCategoryIcon = (categoryId: string) => {
    const category = fieldCategories.find(c => c.id === categoryId)
    return category?.icon || '📋'
  }

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
    return t('recommendations.default')
  }

  const getFieldInfo = (fieldId: string) => {
    const field = allFields.find(f => f.id === fieldId)
    return field || { id: fieldId, label: fieldId.replace(/_/g, ' '), icon: '📋' }
  }

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
      <DialogContent className="max-w-7xl max-h-[95vh] p-0 bg-gradient-to-b from-background via-background to-muted/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/10" aria-describedby="comparison-modal-description">
        <div id="comparison-modal-description" className="sr-only">
          {t('fields.description') || 'Compare properties side by side with detailed analysis and insights'}
        </div>
        <DialogHeader className="p-4 md:p-6 pb-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DialogTitle className="flex flex-wrap items-center gap-2 text-lg md:text-xl">
                <BarChart3Icon className="h-5 w-5 text-primary" />
                <span className="text-foreground dark:text-white">{t('title')}</span>
                <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-primary/20 to-secondary/20 dark:from-primary/30 dark:to-secondary/30 text-primary dark:text-primary-foreground">
                  {comparisonProperties.length} {t('properties')}
                </Badge>
                {hasMixedTypes && (
                  <Badge variant="outline" className="ml-2 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800">
                    <AlertCircleIcon className="h-3 w-3 mr-1" />
                    {t('mixedTypes')}
                  </Badge>
                )}
              </DialogTitle>
              {hasSmartInsights && (
                <Badge variant="outline" className="gap-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground border-primary/20 dark:border-primary/30">
                  <SparklesIcon className="h-3 w-3" />
                  {t('smartInsights')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={comparisonProperties.length === 0}
                className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
              >
                {t('actions.clearAll')}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-muted/30 dark:bg-gray-800/30 mx-4 md:mx-6 rounded-lg mb-4 border border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
              <span className="text-sm font-medium text-foreground dark:text-white">{t('filters.title')}:</span>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                <SelectValue placeholder={t('filters.sortBy')} />
              </SelectTrigger>
              <SelectContent className="bg-popover dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <SelectItem value="listing_type">{t('filters.options.listingType')}</SelectItem>
                <SelectItem value="price">{t('filters.options.priceLowHigh')}</SelectItem>
                <SelectItem value="price_per_sqm">{t('filters.options.pricePerSqm')}</SelectItem>
                <SelectItem value="rent_per_sqm">{t('filters.options.rentPerSqm')}</SelectItem>
                <SelectItem value="area">{t('filters.options.areaSmallLarge')}</SelectItem>
                <SelectItem value="bedrooms">{t('filters.options.bedrooms')}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Switch
                id="differences"
                checked={showOnlyDifferences}
                onCheckedChange={setShowOnlyDifferences}
                className="data-[state=checked]:bg-primary dark:data-[state=checked]:bg-primary"
              />
              <Label htmlFor="differences" className="text-sm text-foreground dark:text-gray-300">
                {t('filters.showDifferences')}
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleShare} className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400">
                    <Share2Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover dark:bg-gray-900 text-popover-foreground dark:text-gray-300 border-gray-200 dark:border-gray-800">
                  {t('actions.share')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handlePrint} className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400">
                    <PrinterIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover dark:bg-gray-900 text-popover-foreground dark:text-gray-300 border-gray-200 dark:border-gray-800">
                  {t('actions.print')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleEmail} className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400">
                    <MailIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover dark:bg-gray-900 text-popover-foreground dark:text-gray-300 border-gray-200 dark:border-gray-800">
                  {t('actions.email')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <ScrollArea className="h-[65vh] px-4 md:px-6">
          {comparisonProperties.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <BarChart3Icon className="h-12 w-12 md:h-16 md:w-16 mx-auto text-muted-foreground dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground dark:text-white">
                {t('empty.title')}
              </h3>
              <p className="text-muted-foreground dark:text-gray-400 mb-6 max-w-md mx-auto">
                {t('empty.description')}
              </p>
              <Button asChild size="lg" className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90" suppressHydrationWarning>
                <Link href={`/${locale}/listings`}>
                  {t('empty.browseProperties')}
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Property Cards Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
                {sortedProperties.map((property, index) => (
                  <Card key={property.id} className="relative overflow-hidden hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50">
                    <CardContent className="p-3 md:p-4">
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast('Refreshing saved comparisons...', {
                              duration: 2000,
                              icon: '🔄',
                            })
                          }}
                          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-full hover:bg-destructive/10 dark:hover:bg-destructive/20 dark:text-red-400"
                          onClick={() => removeFromComparison(property.id)}
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-10 w-10 rounded-md bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                          <span className="font-bold text-primary dark:text-primary-foreground">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate text-sm text-foreground dark:text-white">
                              {property.title || `${t('property')} ${property.id}`}
                            </h4>
                            <Badge
                              variant={property.listing_type === 'for_sale' ? 'default' : 'secondary'}
                              className="text-xs bg-gradient-to-r from-primary to-secondary dark:from-primary/80 dark:to-secondary/80"
                            >
                              {property.listing_type === 'for_sale' ? t('badges.forSale') : t('badges.forRent')}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-gray-400 truncate">
                            {property.city?.name}, {property.sub_city?.name}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {property.listing_type === 'for_sale' ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground dark:text-gray-400">{t('propertyCards.price')}:</span>
                              <span className="font-semibold text-foreground dark:text-white">
                                {property.price_etb?.toLocaleString() || 'N/A'} ETB
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground dark:text-gray-400">{t('propertyCards.pricePerSqm')}:</span>
                              <span className="text-foreground dark:text-white">
                                {property.price_etb && property.total_area
                                  ? Math.round(property.price_etb / property.total_area).toLocaleString()
                                  : 'N/A'} ETB
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground dark:text-gray-400">{t('propertyCards.monthlyRent')}:</span>
                              <span className="font-semibold text-foreground dark:text-white">
                                {property.monthly_rent?.toLocaleString() || 'N/A'} ETB
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground dark:text-gray-400">{t('propertyCards.rentPerSqm')}:</span>
                              <span className="text-foreground dark:text-white">
                                {property.monthly_rent && property.total_area
                                  ? Math.round(property.monthly_rent / property.total_area).toLocaleString()
                                  : 'N/A'} ETB
                              </span>
                            </div>
                          </>
                        )}

                        <div className="flex justify-between">
                          <span className="text-muted-foreground dark:text-gray-400">{t('propertyCards.area')}:</span>
                          <span className="text-foreground dark:text-white">{property.total_area || 'N/A'} m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground dark:text-gray-400">{t('propertyCards.bedrooms')}:</span>
                          <span className="text-foreground dark:text-white">{property.bedrooms || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Best value indicators */}
                      {bestSaleValue?.id === property.id && (
                        <div className="mt-3 p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                          <div className="flex items-center gap-1 text-green-700 dark:text-green-300 text-xs font-medium">
                            <DollarSignIcon className="h-3 w-3" />
                            {t('propertyCards.bestSaleValue')}
                          </div>
                        </div>
                      )}

                      {bestRentValue?.id === property.id && (
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                          <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300 text-xs font-medium">
                            <HomeIcon className="h-3 w-3" />
                            {t('propertyCards.bestRentValue')}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Warning for mixed types */}
              {hasMixedTypes && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-300">{t('warnings.mixedTypes.title')}</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                        {t('warnings.mixedTypes.description', {
                          saleCount: comparisonProperties.filter(p => p.listing_type === 'for_sale').length,
                          rentCount: comparisonProperties.filter(p => p.listing_type === 'for_rent').length
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Tabs defaultValue="table" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-4 bg-muted/30 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800">
                  <TabsTrigger value="table" className="flex items-center gap-2 text-xs sm:text-sm data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900 data-[state=active]:text-foreground dark:data-[state=active]:text-white">
                    <FileTextIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('tabs.table')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-2 text-xs sm:text-sm data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900 data-[state=active]:text-foreground dark:data-[state=active]:text-white">
                    <BarChart3Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('tabs.stats')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gap-2 text-xs sm:text-sm data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900 data-[state=active]:text-foreground dark:data-[state=active]:text-white">
                    <SparklesIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('tabs.insights')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="flex items-center gap-2 text-xs sm:text-sm data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900 data-[state=active]:text-foreground dark:data-[state=active]:text-white">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('tabs.recommendations')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="fields" className="flex items-center gap-2 text-xs sm:text-sm data-[state=active]:bg-background dark:data-[state=active]:bg-gray-900 data-[state=active]:text-foreground dark:data-[state=active]:text-white">
                    <FilterIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('tabs.fields')}</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="table" className="mt-4">
                  {fieldsToShow.length === 0 ? (
                    <div className="text-center py-8 border-2 border-primary/20 dark:border-primary/30 rounded-lg bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50">
                      <AlertCircleIcon className="h-8 w-8 mx-auto text-muted-foreground dark:text-gray-600 mb-2" />
                      <p className="text-muted-foreground dark:text-gray-400">{t('table.noFields')}</p>
                      <Button
                        variant="link"
                        className="mt-2 text-primary dark:text-primary-foreground"
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
                        {t('table.selectAllVisible')}
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-md border-2 border-primary/20 dark:border-primary/30 overflow-x-auto bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 dark:bg-gray-800/50">
                            <TableHead className="w-[200px] sm:w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r border-gray-200 dark:border-gray-800">
                              <div className="flex items-center gap-2">
                                <span className="text-foreground dark:text-white">{t('table.feature')}</span>
                                {showOnlyDifferences && (
                                  <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-700 dark:text-gray-300">
                                    {t('table.differencesOnly')}
                                  </Badge>
                                )}
                              </div>
                            </TableHead>
                            {sortedProperties.map((property, index) => (
                              <TableHead key={property.id} className="text-center min-w-[150px] sm:min-w-[200px] bg-muted/30 dark:bg-gray-800/30">
                                <div className="flex flex-col items-center">
                                  <span className="font-medium text-foreground dark:text-white">{t('table.property')} {index + 1}</span>
                                  <span className="text-xs text-muted-foreground dark:text-gray-400 truncate max-w-[120px] sm:max-w-[150px]">
                                    {property.title?.slice(0, 20)}...
                                  </span>
                                  <Badge
                                    variant={property.listing_type === 'for_sale' ? 'default' : 'secondary'}
                                    className="mt-1 text-xs bg-gradient-to-r from-primary to-secondary dark:from-primary/80 dark:to-secondary/80"
                                  >
                                    {property.listing_type === 'for_sale' ? t('badges.forSale') : t('badges.forRent')}
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
                                className={hasDifferences ? 'bg-yellow-50 dark:bg-yellow-950 hover:bg-yellow-100 dark:hover:bg-yellow-900' : 'hover:bg-muted/50 dark:hover:bg-gray-800/50'}
                              >
                                <TableCell className="font-medium sticky left-0 bg-background dark:bg-gray-900 z-10 border-r border-gray-200 dark:border-gray-800">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">
                                      {fieldInfo.icon}
                                    </span>
                                    <span className="capitalize text-foreground dark:text-white">{fieldInfo.label}</span>
                                    {hasDifferences && showOnlyDifferences && (
                                      <Badge variant="outline" className="ml-2 text-xs border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300">
                                        {t('table.diff')}
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
                                        } ${isBestSaleValue ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' : ''} ${isBestRentValue ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : ''}`}>
                                        {value === true ? (
                                          <span className="text-green-600 dark:text-green-400">✓</span>
                                        ) : value === false ? (
                                          <span className="text-red-600 dark:text-red-400">✗</span>
                                        ) : value === null || value === undefined ? (
                                          <span className="text-muted-foreground dark:text-gray-500">-</span>
                                        ) : (
                                          <span className="text-foreground dark:text-white">
                                            {field === 'price_etb' || field === 'monthly_rent'
                                              ? typeof value === 'number' ? value.toLocaleString() : value
                                              : value
                                            }
                                            {field === 'price_etb' && ' ETB'}
                                            {field === 'monthly_rent' && ' ETB/month'}
                                          </span>
                                        )}
                                        {isBestSaleValue && (
                                          <DollarSignIcon className="h-3 w-3 ml-1 text-green-600 dark:text-green-400" />
                                        )}
                                        {isBestRentValue && (
                                          <HomeIcon className="h-3 w-3 ml-1 text-blue-600 dark:text-blue-400" />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Sale Statistics */}
                    {comparisonProperties.some(p => p.listing_type === 'for_sale') && (
                      <Card className="border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground dark:text-white">
                            <DollarSignIcon className="h-4 w-4 text-primary" />
                            {t('stats.sale.title')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground dark:text-gray-400">{t('stats.sale.properties')}:</span>
                              <span className="font-medium text-foreground dark:text-white">
                                {comparisonProperties.filter(p => p.listing_type === 'for_sale').length}
                              </span>
                            </div>
                            {bestSaleValue && (
                              <>
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground dark:text-gray-400">{t('stats.sale.bestValue')}:</span>
                                    <span className="font-medium flex items-center gap-1 text-green-600 dark:text-green-400">
                                      {bestSaleValue.title?.slice(0, 15)}...
                                      <TrendingDownIcon className="h-4 w-4" />
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
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
                      <Card className="border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground dark:text-white">
                            <HomeIcon className="h-4 w-4 text-primary" />
                            {t('stats.rent.title')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground dark:text-gray-400">{t('stats.rent.properties')}:</span>
                              <span className="font-medium text-foreground dark:text-white">
                                {comparisonProperties.filter(p => p.listing_type === 'for_rent').length}
                              </span>
                            </div>
                            {bestRentValue && (
                              <>
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground dark:text-gray-400">{t('stats.rent.bestValue')}:</span>
                                    <span className="font-medium flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                      {bestRentValue.title?.slice(0, 15)}...
                                      <TrendingDownIcon className="h-4 w-4" />
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
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
                    <Card className="border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground dark:text-white">
                          <BarChart3Icon className="h-4 w-4 text-primary" />
                          {t('stats.common.title')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground dark:text-gray-400">{t('stats.common.avgArea')}:</span>
                            <span className="font-medium text-foreground dark:text-white">
                              {stats?.area?.avg ? stats.area.avg.toFixed(0) : 0} m²
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground dark:text-gray-400">{t('stats.common.avgBedrooms')}:</span>
                            <span className="font-medium text-foreground dark:text-white">
                              {stats?.bedrooms?.avg ? stats.bedrooms.avg.toFixed(1) : 0}
                            </span>
                          </div>
                          {topFeatures.length > 0 && (
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                              <span className="text-sm text-muted-foreground dark:text-gray-400">{t('stats.common.topAmenities')}:</span>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {topFeatures.slice(0, 4).map((feature, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-800 dark:text-gray-300">
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
                      <Card className="border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground dark:text-white">
                            <SparklesIcon className="h-4 w-4 text-primary" />
                            {t('insights.keyInsights')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* Mixed Type Warning */}
                            {hasMixedTypes && (
                              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center flex-shrink-0">
                                  <AlertCircleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm text-amber-800 dark:text-amber-300">{t('insights.mixedTypes.title')}</h4>
                                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                    {t('insights.mixedTypes.description', {
                                      saleCount: comparisonProperties.filter(p => p.listing_type === 'for_sale').length,
                                      rentCount: comparisonProperties.filter(p => p.listing_type === 'for_rent').length
                                    })}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Sale Insights */}
                            {comparisonProperties.some(p => p.listing_type === 'for_sale') && (
                              <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                                  <DollarSignIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm text-foreground dark:text-white">{t('insights.sale.title')}</h4>
                                  <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                    {bestSaleValue
                                      ? t('insights.sale.bestValue', { title: bestSaleValue.title?.slice(0, 30) })
                                      : t('insights.sale.default')
                                    }
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Rent Insights */}
                            {comparisonProperties.some(p => p.listing_type === 'for_rent') && (
                              <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                                  <HomeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm text-foreground dark:text-white">{t('insights.rent.title')}</h4>
                                  <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                    {bestRentValue
                                      ? t('insights.rent.bestValue', { title: bestRentValue.title?.slice(0, 30) })
                                      : t('insights.rent.default')
                                    }
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Feature Insights */}
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                                <StarIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <h4 className="font-medium text-sm text-foreground dark:text-white">{t('insights.features.title')}</h4>
                                <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                  {topFeatures.length > 0
                                    ? t('insights.features.topAmenities', { amenities: topFeatures.slice(0, 3).join(', ') })
                                    : t('insights.features.default')
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {recommendations && recommendations.length > 0 && (
                        <Card className="border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50">
                          <CardHeader>
                            <CardTitle className="text-sm font-medium text-foreground dark:text-white">
                              {t('insights.recommendations')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {recommendations.slice(0, 3).map((rec, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-foreground dark:text-white">{renderRecommendation(rec)}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-primary/20 dark:border-primary/30 rounded-lg bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50">
                      <SparklesIcon className="h-8 w-8 mx-auto text-muted-foreground dark:text-gray-600 mb-2" />
                      <p className="text-muted-foreground dark:text-gray-400">{t('insights.requireMoreProperties')}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="recommendations" className="mt-4">
                  {recommendations && recommendations.length > 0 ? (
                    <div className="space-y-4">
                      <Card className="border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50">
                        <CardHeader>
                          <CardTitle className="text-sm font-medium text-foreground dark:text-white">
                            {t('recommendations.title')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {recommendations.map((recommendation, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-800">
                                <div className="h-6 w-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-medium text-primary dark:text-primary-foreground">{index + 1}</span>
                                </div>
                                <p className="text-sm text-foreground dark:text-white">{renderRecommendation(recommendation)}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-primary/20 dark:border-primary/30 rounded-lg bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50">
                      <CheckCircleIcon className="h-8 w-8 mx-auto text-muted-foreground dark:text-gray-600 mb-2" />
                      <p className="text-muted-foreground dark:text-gray-400">{t('recommendations.none')}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="fields" className="mt-4">
                  <Card className="border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-foreground dark:text-white">
                        {t('fields.customizeTitle')}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        {t('fields.customizeDescription')}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
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
                              className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
                            >
                              {t('fields.selectAllVisible')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFields([])}
                              className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
                            >
                              {t('fields.clearAll')}
                            </Button>
                          </div>
                          <Badge variant="secondary" className="text-xs sm:text-sm bg-gray-100 dark:bg-gray-800 dark:text-gray-300">
                            {selectedFields.length} {t('fields.selected')}
                          </Badge>
                        </div>

                        <Separator className="bg-gray-200 dark:bg-gray-800" />

                        <div className="space-y-4">
                          {fieldCategories.map(category => {
                            const categoryFields = allFields.filter(f => f.category === category.id)
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
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <h4 className="font-medium text-sm flex items-center gap-2 text-foreground dark:text-white">
                                    <span>{category.icon}</span>
                                    {category.label}
                                    <Badge variant="outline" className="ml-2 border-gray-300 dark:border-gray-700 dark:text-gray-300">
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
                                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                                    >
                                      {selectedInCategory.length === visibleCategoryFields.length
                                        ? t('fields.deselectAll')
                                        : t('fields.selectAll')
                                      }
                                    </Button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {visibleCategoryFields.map(field => (
                                    <div
                                      key={field.id}
                                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${selectedFields.includes(field.id)
                                        ? 'bg-primary/10 border-primary/30 dark:bg-primary/20 dark:border-primary/50'
                                        : 'border-gray-200 dark:border-gray-800 hover:bg-muted/50 dark:hover:bg-gray-800/50'
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
                                        ? 'bg-primary border-primary dark:bg-primary dark:border-primary'
                                        : 'border-gray-300 dark:border-gray-700'
                                        }`}>
                                        {selectedFields.includes(field.id) && (
                                          <CheckCircleIcon className="h-3 w-3 text-primary-foreground dark:text-primary-foreground" />
                                        )}
                                      </div>
                                      <span className="text-sm flex items-center gap-2 text-foreground dark:text-white">
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
        <DialogFooter className="p-4 md:p-6 pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-muted-foreground dark:text-gray-400">{t('actions.saveAs')}:</span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Input
                    placeholder={t('actions.savePlaceholder')}
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="w-full sm:w-48 bg-background dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={comparisonProperties.length < 2}
                    className="flex-shrink-0 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
                  >
                    <SaveIcon className="h-4 w-4 mr-2" />
                    {t('actions.save')}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={comparisonProperties.length < 2}
                className="flex-1 sm:flex-none border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                disabled={comparisonProperties.length < 2}
                className="flex-1 sm:flex-none border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button
                onClick={handleCompare}
                disabled={comparisonProperties.length < 2 || isLoading}
                size="sm"
                className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 dark:from-primary/90 dark:to-secondary/90 dark:hover:from-primary dark:hover:to-secondary"
              >
                {isLoading ? t('actions.comparing') : t('actions.compareProperties')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}