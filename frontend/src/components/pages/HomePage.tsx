'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from "@/components/common/Header/Header"
import PropertyCard from '@/components/listings/PropertyCard'
import HomeSearchFilters from '@/components/listings/HomeSearchFilters'
import MarketStatsCard from '@/components/dashboard/MarketStatsCard'
import { listingsApi } from '@/lib/api/listings'
import { valuationApi } from '@/lib/api/valuation'
import { 
  Home as HomeIcon, 
  TrendingUp, 
  Shield, 
  Zap,
  Star,
  MapPin,
  Bed,
  Bath,
  Ruler,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  Search,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/Button' 
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import ClientOnly from '@/components/common/ClientOnly'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { cn } from '@/lib/utils'

// Property type for the featured properties carousel
interface Property {
  id: number
  title: string
  specific_location: string
  sub_city?: { name: string }
  bedrooms: number
  bathrooms: number
  total_area: number
  price_etb: number
  listing_type: 'for_sale' | 'for_rent'
  description: string
  images?: Array<{ image: string }>
  is_featured?: boolean
}

// Featured Properties Carousel Component
const FeaturedPropertiesCarousel: React.FC<{
  featuredProperties: Property[];
}> = ({ featuredProperties }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const t = useTranslations('property')
  const tProperty = useTranslations('listings')

  // Auto-rotate featured properties every 2 seconds
  useEffect(() => {
    if (featuredProperties.length <= 1 || isPaused) return

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === featuredProperties.length - 1 ? 0 : prevIndex + 1
      )
    }, 4000)

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current)
      }
    }
  }, [featuredProperties.length, isPaused])

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === featuredProperties.length - 1 ? 0 : prevIndex + 1
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? featuredProperties.length - 1 : prevIndex - 1
    )
  }

  if (!featuredProperties || featuredProperties.length === 0) {
    return (
      <div className="h-full w-full rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 flex items-center justify-center">
        <HomeIcon className="h-16 w-16 text-primary/50 dark:text-primary/70" />
      </div>
    )
  }

  const currentProperty = featuredProperties[currentIndex]

  return (
    <div 
      className="h-full w-full rounded-lg overflow-hidden relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentProperty.images?.[0] ? (
          <img
            src={currentProperty.images[0].image}
            alt={currentProperty.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-primary/30 dark:to-secondary/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end text-white">
        {/* Featured Badge */}
        <div className="mb-3 md:mb-4">
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-600 dark:to-yellow-600 text-white border-0 font-bold gap-1 mb-2">
            <Star className="h-3 w-3" />
            {tProperty('featuredLabel')}
          </Badge>
        </div>

        {/* Property Title */}
        <h3 className="text-lg md:text-xl font-bold mb-2 line-clamp-1">
          {currentProperty.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-white/80 mb-3">
          <MapPin className="h-3 w-3 md:h-4 md:w-4 mr-2 flex-shrink-0" />
          <span className="truncate text-sm md:text-base">{currentProperty.specific_location}, {currentProperty.sub_city?.name || 'Location'}</span>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-4 gap-1 md:gap-2 mb-4">
          <div className="flex flex-col items-center justify-center bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg p-1 md:p-2">
            <Bed className="h-4 w-4 md:h-5 md:w-5 mb-1" />
            <span className="text-xs font-medium">{currentProperty.bedrooms}</span>
            <span className="text-[10px] opacity-75">{t('bedrooms')}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg p-1 md:p-2">
            <Bath className="h-4 w-4 md:h-5 md:w-5 mb-1" />
            <span className="text-xs font-medium">{currentProperty.bathrooms}</span>
            <span className="text-[10px] opacity-75">{t('bathrooms')}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg p-1 md:p-2">
            <Ruler className="h-4 w-4 md:h-5 md:w-5 mb-1" />
            <span className="text-xs font-medium">{currentProperty.total_area}{t('areaUnit')}</span>
            <span className="text-[10px] opacity-75">{t('area')}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg p-1 md:p-2">
            <DollarSign className="h-4 w-4 md:h-5 md:w-5 mb-1" />
            <span className="text-xs font-medium">{formatCurrency(currentProperty.price_etb)}</span>
            <span className="text-[10px] opacity-75">
              {currentProperty.listing_type === 'for_rent' ? t('forRent') : t('forSale')}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs md:text-sm text-white/80 mb-4 line-clamp-2">
          {currentProperty.description || 'Premium property in a prime location'}
        </p>

        {/* Action Button */}
        <Button 
          asChild 
          size="sm" 
          className="bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-white/90 dark:hover:bg-gray-700 w-fit"
        >
          <Link href={`/listings/${currentProperty.id}`}>
            {t('viewDetails')}
            <ExternalLink className="ml-2 h-3 w-3" />
          </Link>
        </Button>

        {/* Navigation Arrows */}
        {featuredProperties.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 p-1 md:p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Previous property"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 p-1 md:p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Next property"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </>
        )}

        {/* Property Indicators */}
        {featuredProperties.length > 1 && (
          <div className="absolute bottom-3 md:bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1 md:gap-2">
            {featuredProperties.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-3 md:w-4'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Quick Search Component
const QuickSearch = () => {
  const t = useTranslations('home')
  const locale = useLocale()
  const [searchTerm, setSearchTerm] = useState('')
  
  const handleSearch = () => {
    if (searchTerm.trim()) {
      window.location.href = `/${locale}/listings?search=${encodeURIComponent(searchTerm)}`
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-12 pr-24 py-3 md:py-4 rounded-lg border bg-background dark:bg-gray-900 border-input focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button
          onClick={handleSearch}
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
          size="sm"
        >
          {t('search')}
        </Button>
      </div>
    </div>
  )
}

export default function HomePage() {
  const t = useTranslations('home')
  const tCommon = useTranslations('common')
  const tListings = useTranslations('listings')
  const locale = useLocale()
  
  // Fetch featured properties
  const { data: featuredProperties = [], isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => listingsApi.getFeaturedProperties(),
  })

  // Fetch market stats
  const { data: marketStats, isLoading: statsLoading } = useQuery({
    queryKey: ['market-stats'],
    queryFn: () => valuationApi.getMarketStats(),
  })

  const features = [
    {
      icon: <HomeIcon className="h-8 w-8" />,
      title: t('wideSelection'),
      description: t('wideSelectionDesc'),
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: t('marketInsights'),
      description: t('marketInsightsDesc'),
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: t('verifiedListings'),
      description: t('verifiedListingsDesc'),
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: t('instantValuation'),
      description: t('instantValuationDesc'),
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Header/>
      
      {/* Hero Section with Search */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/5 dark:from-primary/20 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-4 py-8 md:py-16 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="text-center lg:text-left">
              <h1 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                {t('title')}
              </h1>
              <p className="mb-6 md:mb-8 text-base md:text-lg text-muted-foreground">
                {t('subtitle')}
              </p>
              
              {/* Quick Search - Mobile & Desktop */}
              <div className="mb-8 md:hidden">
                <QuickSearch />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button asChild size="lg" className="flex-1 sm:flex-none" suppressHydrationWarning>
                  <Link href={`/${locale}/listings`}>
                    {t('browseProperties')}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="flex-1 sm:flex-none" suppressHydrationWarning>
                  <Link href={`/${locale}/comparison`}>
                    {t('compareProperties')}
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="hidden lg:block">
              {/* Quick Search - Desktop */}
              <div className="mb-8">
                <QuickSearch />
              </div>
              
              {/* Featured Properties Carousel */}
              <div className="relative h-80 lg:h-96 rounded-xl overflow-hidden shadow-2xl">
                {featuredLoading ? (
                  <div className="h-full w-full rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 animate-pulse" />
                ) : (
                  <FeaturedPropertiesCarousel featuredProperties={featuredProperties} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}