// components/listings/PropertyCard.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
    Crown,
    Zap,
    TrendingUp,
    Mail as MailIcon,
    Target,
    BarChart3,
    Wifi,
    Droplets,
    Thermometer,
    Users,
    Building,
    ParkingCircle,
    Sparkles,
    ArrowUpRight,
    CalendarDays,
    BadgeCheck,
    ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatPricePerSqm } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
import toast from 'react-hot-toast'
import SafeImage from '@/components/common/SafeImage'
import { cn } from '@/lib/utils'
import { useTranslations, useLocale } from 'next-intl'

interface PropertyCardProps {
    property: Property
    viewMode?: 'grid' | 'list' | 'compact'
    showComparisonButton?: boolean
    showSaveButton?: boolean
    className?: string
    showPromotionBadge?: boolean
    showStatusBadge?: boolean
    showFeatures?: boolean
}

// Feature icons mapping with translatable labels
const featureIcons = {
    has_parking: { icon: ParkingCircle, labelKey: 'features.parking', color: 'text-blue-500' },
    has_garden: { icon: TreePine, labelKey: 'features.garden', color: 'text-green-500' },
    has_security: { icon: Shield, labelKey: 'features.security', color: 'text-amber-500' },
    has_furniture: { icon: Building, labelKey: 'features.furnished', color: 'text-purple-500' },
    has_air_conditioning: { icon: Thermometer, labelKey: 'features.ac', color: 'text-cyan-500' },
    has_internet: { icon: Wifi, labelKey: 'features.internet', color: 'text-indigo-500' },
    has_generator: { icon: Zap, labelKey: 'features.generator', color: 'text-yellow-500' },
    has_elevator: { icon: ArrowUpRight, labelKey: 'features.elevator', color: 'text-gray-500' },
    has_backup_water: { icon: Droplets, labelKey: 'features.waterBackup', color: 'text-sky-500' },
    is_pet_friendly: { icon: Users, labelKey: 'features.petFriendly', color: 'text-pink-500' },
    is_wheelchair_accessible: { icon: ShieldCheck, labelKey: 'features.accessible', color: 'text-teal-500' }
}

// Promotion badge configuration with vibrant colors
const promotionBadgeConfig = {
    basic: {
        icon: TrendingUp,
        labelKey: 'listings.promotion.basic',
        className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-600',
        glow: 'shadow-lg shadow-green-500/20'
    },
    standard: {
        icon: Star,
        labelKey: 'listings.promotion.standard',
        className: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-600',
        glow: 'shadow-lg shadow-blue-500/20'
    },
    premium: {
        icon: Crown,
        labelKey: 'listings.promotion.premium',
        className: 'bg-gradient-to-r from-purple-500 to-pink-600 text-white border-purple-600',
        glow: 'shadow-lg shadow-purple-500/20'
    }
}

// Featured property color theme
const featuredConfig = {
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    bg: 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10',
    border: 'border-amber-200 dark:border-amber-800',
    shadow: 'shadow-xl shadow-amber-500/10',
    badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
}

// Regular property color theme
const regularConfig = {
    gradient: 'from-gray-500 to-slate-600',
    bg: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    shadow: 'shadow-lg',
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
}

const PropertyCard: React.FC<PropertyCardProps> = ({
    property,
    viewMode = 'grid',
    showComparisonButton = true,
    showSaveButton = true,
    className,
    showPromotionBadge = true,
    showStatusBadge = true,
    showFeatures = true
}) => {
    const { isAuthenticated } = useAuthStore()
    const { addToComparison, isInComparison } = useComparisonStore()
    const [isSaved, setIsSaved] = useState(property.save_count > 0)
    const [isImageLoading, setIsImageLoading] = useState(true)

    // Translation hooks
    const t = useTranslations()
    const tProperty = useTranslations('property')
    const tListings = useTranslations('listings')
    const tCommon = useTranslations('common')
    const locale = useLocale()

    useEffect(() => {
        setIsSaved(property.save_count > 0)
    }, [property.save_count])

    // Get primary image or first image
    const primaryImage = property.images?.find(img => img.is_primary) || property.images?.[0]
    const imageUrl = primaryImage?.image || '/placeholder-property.jpg'

    // Check if property is featured
    const isFeatured = property.is_featured
    const theme = isFeatured ? featuredConfig : regularConfig

    // Check promotion status
    const promotionTier = property.promotion_tier
    const promotionEnd = property.promotion_end
    const promotionActive = property.is_promoted && (property.promotion_status === 'active' || property.promotion_status === 'pending')

    const calculateDaysRemaining = () => {
        if (!promotionEnd) return null
        const endDate = new Date(promotionEnd)
        const now = new Date()
        const diffInDays = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return diffInDays > 0 ? diffInDays : 0
    }

    const daysRemaining = promotionEnd ? calculateDaysRemaining() : null

    const getPropertyTitle = useCallback(() => {
        if (locale === 'am' && property?.title_amharic) {
            return property.title_amharic;
        }
        return property?.title || '';
    }, [locale, property?.title, property?.title_amharic]);

    const handleSaveProperty = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!isAuthenticated) {
            toast.error(tCommon('loginRequired'))
            return
        }

        try {
            await listingsApi.saveProperty(property.id)
            setIsSaved(!isSaved)
            toast.success(isSaved ? tListings('actions.removedFromSaved') : tListings('actions.propertySaved'))
        } catch (error: any) {
            toast.error(error.response?.data?.error || tListings('errors.saveFailed'))
        }
    }

    const handleAddToComparison = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!isAuthenticated) {
            toast.error(tCommon('loginRequired'))
            return
        }

        try {
            await listingsApi.addToComparison(property.id)
            addToComparison(property)
            toast.success(tListings('actions.addedToComparison'))
        } catch (error: any) {
            toast.error(error.response?.data?.error || tListings('errors.addToComparisonFailed'))
        }
    }

    const propertyUrl = `/${locale}/listings/${property.id}`

    // Get active features
    const activeFeatures = Object.entries(featureIcons)
        .filter(([key]) => property[key as keyof Property])
        .slice(0, 4) // Limit to 4 features

    // Price display
    const priceDisplay = property.listing_type === 'for_rent'
        ? `${formatCurrency(property.monthly_rent || 0)}${tProperty('perMonth')}`
        : formatCurrency(property.price_etb)

    // Format property type for display
    const propertyTypeKey = property.property_type.toLowerCase()
    let propertyTypeDisplay = property.property_type

    try {
        // Try common property types
        const translated = tListings(`propertyTypes.${propertyTypeKey}`)
        if (translated && !translated.includes('propertyTypes.')) {
            propertyTypeDisplay = translated
        }
    } catch (error) {
        // Use the original property_type if translation fails
        propertyTypeDisplay = property.property_type
    }

    // Format listing type for display
    const listingTypeKey = property.listing_type === 'for_sale' ? 'for_sale' : 'for_rent'
    const listingTypeDisplay = tListings(`listingTypes.${listingTypeKey}`)

    // Compact view
    if (viewMode === 'compact') {
        return (
            <Link href={propertyUrl} className="block">
                <div className={cn(
                    "group relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl",
                    theme.border,
                    theme.shadow,
                    isFeatured && "border-amber-200 dark:border-amber-700",
                    className
                )}>
                    {/* Background gradient for featured properties */}
                    {isFeatured && (
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-yellow-500/5" />
                    )}

                    <div className="relative flex items-center p-4">
                        {/* Image */}
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                            <SafeImage
                                src={imageUrl}
                                alt={getPropertyTitle()}
                                className="h-full w-full object-cover"
                                onLoad={() => setIsImageLoading(false)}
                            />
                            {isImageLoading && (
                                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="ml-4 flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                                        {getPropertyTitle()}
                                    </h3>
                                    <div className="mt-1 flex items-center text-sm text-gray-500">
                                        <MapPin className="h-3 w-3 flex-shrink-0 mr-1" />
                                        <span className="truncate">
                                            {property.sub_city?.name}
                                        </span>
                                    </div>
                                </div>
                                {isFeatured && (
                                    <div className="ml-2 flex-shrink-0">
                                        <Badge className={cn(
                                            "px-2 py-1 text-xs font-bold",
                                            featuredConfig.badge
                                        )}>
                                            <Star className="h-3 w-3 mr-1" />
                                            {tListings('featuredLabel')}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm">
                                    {property.bedrooms > 0 && (
                                        <div className="flex items-center">
                                            <Bed className="h-4 w-4 text-gray-400 mr-1" />
                                            <span>{property.bedrooms}</span>
                                        </div>
                                    )}
                                    {property.bathrooms > 0 && (
                                        <div className="flex items-center">
                                            <Bath className="h-4 w-4 text-gray-400 mr-1" />
                                            <span>{property.bathrooms}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <Square className="h-4 w-4 text-gray-400 mr-1" />
                                        <span>{property.total_area}{tProperty('areaUnit')}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900 dark:text-white">
                                        {priceDisplay}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        )
    }

    // List view
    if (viewMode === 'list') {
        return (
            <Link href={propertyUrl} className="block">
                <div className={cn(
                    "group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-[1.005]",
                    theme.border,
                    theme.shadow,
                    isFeatured && "border-amber-200 dark:border-amber-700",
                    "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800",
                    className
                )}>
                    {/* Featured glow effect */}
                    {isFeatured && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    )}

                    <div className="relative flex flex-col md:flex-row">
                        {/* Image */}
                        <div className="relative h-64 md:h-auto md:w-80 lg:w-96 flex-shrink-0 overflow-hidden">
                            <SafeImage
                                src={imageUrl}
                                alt={getPropertyTitle()}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onLoad={() => setIsImageLoading(false)}
                            />
                            {isImageLoading && (
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
                            )}

                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Top badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                {showStatusBadge && promotionActive && promotionTier && (
                                    <Badge className={cn(
                                        "gap-1.5 border-0 font-semibold",
                                        promotionBadgeConfig[promotionTier as keyof typeof promotionBadgeConfig]?.className,
                                        promotionBadgeConfig[promotionTier as keyof typeof promotionBadgeConfig]?.glow
                                    )}>
                                        {promotionTier === 'standard' && <Star className="h-3 w-3" />}
                                        {promotionTier === 'premium' && <Crown className="h-3 w-3" />}
                                        {promotionTier === 'basic' && <TrendingUp className="h-3 w-3" />}
                                        {tListings(`promotion.badges.${promotionTier}`)}
                                    </Badge>
                                )}

                                {isFeatured && (
                                    <Badge className={cn(
                                        "gap-1.5 border-0 font-bold",
                                        featuredConfig.badge,
                                        "shadow-lg shadow-amber-500/30"
                                    )}>
                                        <Sparkles className="h-3 w-3" />
                                        {tListings('featured')}
                                    </Badge>
                                )}

                                <Badge variant="outline" className="bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 capitalize">
                                    {propertyTypeDisplay}
                                </Badge>
                            </div>

                            {/* Save button */}
                            {showSaveButton && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-4 right-4 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900"
                                    onClick={handleSaveProperty}
                                >
                                    <Heart className={cn(
                                        "h-5 w-5 transition-colors",
                                        isSaved ? "fill-red-500 text-red-500" : "text-gray-700 dark:text-gray-300"
                                    )} />
                                </Button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-6 md:p-8">
                            <div className="mb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="mb-2 text-xl lg:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2">
                                            {getPropertyTitle()}
                                        </h3>
                                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                                            <MapPin className="h-4 w-4 flex-shrink-0 mr-2" />
                                            <span className="line-clamp-1">
                                                {property.specific_location}, {property.sub_city?.name}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-shrink-0 text-right">
                                        <div className="text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                                            {priceDisplay}
                                        </div>
                                        {property.price_per_sqm && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatPricePerSqm(property.price_per_sqm)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Key specs */}
                            <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {property.bedrooms > 0 && (
                                    <div className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-3">
                                        <Bed className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                {property.bedrooms}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                {tProperty('bedrooms')}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {property.bathrooms > 0 && (
                                    <div className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-3">
                                        <Bath className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        <div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                {property.bathrooms}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                {tProperty('bathrooms')}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 p-3">
                                    <Square className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    <div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {property.total_area}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            {tProperty('areaUnit')}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-3">
                                    <CalendarDays className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    <div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {formatDate(property.listed_date)}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            {tListings('actions.listed')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            {showFeatures && activeFeatures.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {tListings('features')}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {activeFeatures.map(([key, config]) => {
                                            const Icon = config.icon
                                            return (
                                                <Badge
                                                    key={key}
                                                    variant="outline"
                                                    className="gap-1.5 bg-white/50 dark:bg-gray-800/50"
                                                >
                                                    <Icon className={cn("h-3 w-3", config.color)} />
                                                    {tProperty(config.labelKey)}
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <p className="mb-6 line-clamp-2 text-gray-600 dark:text-gray-400">
                                {property.description}
                            </p>

                            {/* Footer */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Eye className="h-4 w-4" />
                                        <span>{property.views_count.toLocaleString()} {tListings('stats.views')}</span>
                                    </div>
                                    {property.is_verified && (
                                        <div className="flex items-center gap-1">
                                            <BadgeCheck className="h-4 w-4 text-green-500" />
                                            <span className="text-green-600 dark:text-green-400">
                                                {tListings('verified')}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {showComparisonButton && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddToComparison}
                                            disabled={isInComparison(property.id)}
                                            className="gap-2"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            {isInComparison(property.id) ? tListings('actions.inComparison') : tCommon('compare')}
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                    >
                                        {tProperty('viewDetails')}
                                        <ArrowUpRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        )
    }

    // Default Grid view (enhanced)
    return (
        <Link href={propertyUrl} className="block">
            <div className={cn(
                "group relative overflow-hidden rounded-2xl border-2 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl",
                theme.border,
                theme.shadow,
                isFeatured && "border-amber-200 dark:border-amber-700",
                "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800",
                className
            )}>
                {/* Featured glow effect */}
                {isFeatured && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}

                {/* Image container */}
                <div className="relative aspect-[4/3] overflow-hidden">
                    <SafeImage
                        src={imageUrl}
                        alt={getPropertyTitle()}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onLoad={() => setIsImageLoading(false)}
                    />
                    {isImageLoading && (
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
                    )}

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                    {/* Top badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {showStatusBadge && promotionActive && promotionTier && (
                            <Badge className={cn(
                                "gap-1.5 border-0 font-semibold",
                                promotionBadgeConfig[promotionTier as keyof typeof promotionBadgeConfig]?.className,
                                promotionBadgeConfig[promotionTier as keyof typeof promotionBadgeConfig]?.glow
                            )}>
                                {promotionTier === 'standard' && <Star className="h-3 w-3" />}
                                {promotionTier === 'premium' && <Crown className="h-3 w-3" />}
                                {promotionTier === 'basic' && <TrendingUp className="h-3 w-3" />}
                                {tListings(`promotion.badges.${promotionTier}`)}
                            </Badge>
                        )}

                        {isFeatured && (
                            <Badge className={cn(
                                "gap-1.5 border-0 font-bold animate-pulse",
                                featuredConfig.badge,
                                "shadow-lg shadow-amber-500/30"
                            )}>
                                <Sparkles className="h-3 w-3" />
                                {tListings('featuredLabel')}
                            </Badge>
                        )}

                        <Badge variant="outline" className="bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 capitalize">
                            {propertyTypeDisplay}
                        </Badge>
                    </div>

                    {/* Listing type badge */}
                    <Badge className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 font-semibold">
                        {listingTypeDisplay}
                    </Badge>

                    {/* Save button */}
                    {showSaveButton && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 bottom-4 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900 shadow-lg"
                            onClick={handleSaveProperty}
                        >
                            <Heart className={cn(
                                "h-5 w-5 transition-all duration-300",
                                isSaved
                                    ? "fill-red-500 text-red-500 scale-110"
                                    : "text-gray-700 dark:text-gray-300 group-hover:scale-110"
                            )} />
                        </Button>
                    )}

                    {/* Price tag with gradient */}
                    <div className="absolute bottom-4 left-4 rounded-xl bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-sm dark:from-gray-900/95 dark:to-gray-900/90 p-4 shadow-xl">
                        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {priceDisplay}
                        </div>
                        {property.price_per_sqm && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {formatPricePerSqm(property.price_per_sqm)}
                            </div>
                        )}
                        {promotionActive && (
                            <div className="flex items-center gap-1 mt-2 text-xs">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                    {tListings(`promotion.${promotionTier}`)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-4">
                        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                            {getPropertyTitle()}
                        </h3>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 flex-shrink-0 mr-2" />
                            <span className="line-clamp-1">
                                {property.specific_location}, {property.sub_city?.name}
                            </span>
                        </div>
                    </div>

                    {/* Key specs with icons */}
                    <div className="mb-6 grid grid-cols-2 gap-3">
                        {property.bedrooms > 0 && (
                            <div className="flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                                <div className="rounded-full bg-blue-100 dark:bg-blue-800 p-2">
                                    <Bed className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {property.bedrooms}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                        {tProperty('bedrooms')}
                                    </div>
                                </div>
                            </div>
                        )}
                        {property.bathrooms > 0 && (
                            <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                                <div className="rounded-full bg-green-100 dark:bg-green-800 p-2">
                                    <Bath className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {property.bathrooms}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                        {tProperty('bathrooms')}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
                            <div className="rounded-full bg-amber-100 dark:bg-amber-800 p-2">
                                <Square className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    {property.total_area}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {tProperty('areaUnit')}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3">
                            <div className="rounded-full bg-purple-100 dark:bg-purple-800 p-2">
                                <CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    {new Date(property.listed_date).getFullYear()}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {tListings('actions.listed')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick features */}
                    {showFeatures && activeFeatures.length > 0 && (
                        <div className="mb-6">
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {tListings('amenities')}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                    {activeFeatures.length}+
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {activeFeatures.map(([key, config]) => {
                                    const Icon = config.icon
                                    return (
                                        <div key={key} className="flex items-center gap-2">
                                            <Icon className={cn("h-4 w-4", config.color)} />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {tProperty(config.labelKey)}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Footer with stats and actions */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                    <Eye className="h-4 w-4" />
                                    <span>{property.views_count.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <BarChart3 className="h-4 w-4" />
                                    <span>{property.inquiry_count}</span>
                                </div>
                                {property.is_verified && (
                                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                        <CheckCircle className="h-4 w-4" />
                                        <span>{tListings('verified')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {showComparisonButton && (
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-2"
                                    onClick={handleAddToComparison}
                                    disabled={isInComparison(property.id)}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    {isInComparison(property.id) ? tListings('actions.inComparison') : tCommon('compare')}
                                </Button>
                            )}
                            <Button className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                                {tProperty('viewDetails')}
                                <ArrowUpRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}

export default React.memo(PropertyCard, (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    return (
        prevProps.property.id === nextProps.property.id &&
        prevProps.viewMode === nextProps.viewMode &&
        prevProps.property.save_count === nextProps.property.save_count &&
        prevProps.property.images?.[0]?.image === nextProps.property.images?.[0]?.image
    )
})