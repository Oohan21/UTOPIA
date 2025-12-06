// src/app/page.tsx (or wherever your HomePage is)
'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/common/Header/Header'
import PropertyCard from '@/components/listings/PropertyCard'
import HomeSearchFilters from '@/components/listings/HomeSearchFilters'
import MarketStatsCard from '@/components/dashboard/MarketStatsCard'
import { listingsApi } from '@/lib/api/listings'
import { valuationApi } from '@/lib/api/valuation'
import { Home as HomeIcon, TrendingUp, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button' 
import Link from 'next/link'

export default function HomePage() {
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
      title: 'Wide Selection',
      description: 'Thousands of properties across Ethiopia',
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Market Insights',
      description: 'Real-time market data and trends',
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Verified Listings',
      description: 'All properties are thoroughly vetted',
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Instant Valuation',
      description: 'Get property valuations in minutes',
    },
  ]

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
        <div className="container mx-auto py-16 md:py-24">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Find Your Perfect Property in{' '}
                <span className="text-primary">Ethiopia</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground">
                UTOPIA connects you with the best real estate opportunities. 
                Browse thousands of verified properties, get instant valuations, 
                and make informed decisions.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/listings">Browse Properties</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/valuation">Get Valuation</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              {/* Hero illustration/placeholder */}
              <div className="h-64 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 md:h-96" />
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="container mx-auto -mt-8 px-4">
        <HomeSearchFilters />
      </section>

      {/* Features Section */}
      <section className="container mx-auto py-16 px-4">
        <h2 className="mb-8 text-center text-3xl font-bold">Why Choose UTOPIA</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-lg border bg-card p-6 text-center transition-all hover:shadow-lg"
            >
              <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3 text-primary">
                {feature.icon}
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Properties */}
      <section className="container mx-auto py-16 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Featured Properties</h2>
            <p className="text-muted-foreground">Handpicked properties with great value</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/listings">View All</Link>
          </Button>
        </div>

        {featuredLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : featuredProperties.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredProperties.slice(0, 6).map((property: any) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <HomeIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Featured Properties</h3>
            <p className="text-muted-foreground">Check back soon for new listings</p>
          </div>
        )}
      </section>

      {/* Market Stats */}
      <section className="container mx-auto py-16 px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">Market Insights</h2>
          <p className="text-muted-foreground">Real-time market data and trends</p>
        </div>
        
        {statsLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : marketStats ? (
          <MarketStatsCard stats={marketStats} />
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Market Data Unavailable</h3>
            <p className="text-muted-foreground">Market statistics will be available soon</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container mx-auto py-16 px-4">
        <div className="rounded-lg bg-primary p-8 text-center text-primary-foreground dark:bg-primary/90">
          <h2 className="mb-4 text-3xl font-bold">Ready to Find Your Dream Property?</h2>
          <p className="mb-6 text-lg">
            Join thousands of satisfied buyers and sellers on UTOPIA
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/auth/register">Sign Up Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 text-white hover:bg-white/20">
              <Link href="/listings">Browse Listings</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}