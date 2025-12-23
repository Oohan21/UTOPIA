// components/properties/PromotionManager.tsx - UPDATED WITH EMPTY RESULTS HANDLING
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { subscriptionApi } from '@/lib/api/subscriptions'
import { Property } from '@/lib/types/property'
import { PropertyPromotionTier } from '@/lib/types/subscription'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import {
  TrendingUp,
  Crown,
  Zap,
  Clock,
  CheckCircle,
  DollarSign,
  AlertCircle,
  ArrowRight,
  Shield,
  Target,
  BarChart3,
  Mail,
  Star,
  Calendar,
  RefreshCw,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface PromotionManagerProps {
  property: Property
  onPromotionActivated: () => void
}

const DURATION_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' }
]

const DEFAULT_TIERS: PropertyPromotionTier[] = [
  {
    id: 1,
    name: 'Basic',
    tier_type: 'basic',
    description: 'Free listing with basic visibility',
    price_7: 0,
    price_30: 0,
    price_60: 0,
    price_90: 0,
    features: [
      'Appears in general search results',
      'Standard property card',
      'No priority placement',
      'Hidden after 3rd page in search'
    ],
    search_position: 100,
    badge_color: 'gray',
    is_active: true,
    display_order: 1,
    created_at: '',
    homepage_featured: false,
    email_inclusion: false,
    social_media_promotion: false,
    badge_display: false,
    discounted_price: undefined
  },
  {
    id: 2,
    name: 'Standard Promotion',
    tier_type: 'standard',
    description: 'Good visibility for serious sellers',
    price_7: 2500,
    price_30: 5000,
    price_60: 9000,
    price_90: 12000,
    features: [
      'Top 20 in search results',
      'Email notification to matching buyers',
      'Basic analytics',
      '30-day visibility guarantee',
      'Promoted badge display'
    ],
    search_position: 20,
    badge_color: 'blue',
    is_active: true,
    display_order: 2,
    created_at: '',
    homepage_featured: false,
    email_inclusion: true,
    social_media_promotion: false,
    badge_display: true,
    discounted_price: undefined
  },
  {
    id: 3,
    name: 'Premium Package',
    tier_type: 'premium',
    description: 'Maximum exposure for fast selling',
    price_7: 15000,
    price_30: 30000,
    price_60: 55000,
    price_90: 70000,
    features: [
      'TOP position in search',
      'Homepage featured section',
      'Dedicated email campaign',
      'Social media advertising',
      'Professional photography included',
      'Virtual tour creation',
      'Priority 24/7 support',
      'Featured badge display'
    ],
    search_position: 1,
    badge_color: 'purple',
    is_active: true,
    display_order: 3,
    created_at: '',
    homepage_featured: true,
    email_inclusion: true,
    social_media_promotion: true,
    badge_display: true,
    discounted_price: undefined
  }
]

export function PromotionManager({ property, onPromotionActivated }: PromotionManagerProps) {
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState<string>('standard')
  const [selectedDuration, setSelectedDuration] = useState<number>(30)
  const [isLoading, setIsLoading] = useState(false)
  const [tiers, setTiers] = useState<PropertyPromotionTier[]>(DEFAULT_TIERS)
  const [isLoadingTiers, setIsLoadingTiers] = useState(false)
  const [tierError, setTierError] = useState<string | null>(null)

  // Load promotion tiers from backend with fallback
  useEffect(() => {
    const loadTiers = async () => {
      setIsLoadingTiers(true)
      setTierError(null)
      try {
        const backendTiers = await subscriptionApi.getPromotionTiers()
        console.log('Backend tiers response:', backendTiers)

        if (backendTiers && Array.isArray(backendTiers)) {
          if (backendTiers.length === 0) {
            console.log('No tiers returned from backend, using defaults')
            setTiers(DEFAULT_TIERS)
            setTierError('No promotion tiers configured. Using default tiers.')
          } else {
            // Filter out basic tier and ensure we have paid tiers
            const paidTiers = backendTiers.filter(tier =>
              tier.tier_type !== 'basic' && tier.is_active
            )
            if (paidTiers.length > 0) {
              console.log('Using backend tiers:', paidTiers)
              setTiers(paidTiers)
              setSelectedTier(paidTiers[0]?.tier_type || 'standard')
            } else {
              console.log('No active paid tiers, using defaults')
              setTiers(DEFAULT_TIERS)
              setTierError('No active promotion tiers available. Using default tiers.')
            }
          }
        } else {
          console.log('Invalid backend response, using defaults')
          setTiers(DEFAULT_TIERS)
          setTierError('Invalid response from server. Using default tiers.')
        }
      } catch (error) {
        console.warn('Failed to load promotion tiers, using defaults:', error)
        setTiers(DEFAULT_TIERS)
        setTierError('Failed to load promotion tiers. Using default tiers.')
      } finally {
        setIsLoadingTiers(false)
      }
    }

    loadTiers()
  }, [])

  const calculatePrice = (tierType: string, duration: number): number => {
    const tier = tiers.find(t => t.tier_type === tierType)
    if (!tier) return 0

    // Get price based on duration using fallback calculation
    switch (duration) {
      case 7: return tier.price_7 || 0
      case 30: return tier.price_30 || 0
      case 60: return tier.price_60 || tier.price_30 * 2 || 0
      case 90: return tier.price_90 || tier.price_30 * 3 || 0
      default: return tier.price_30 || 0
    }
  }

  const formatDuration = (days: number): string => {
    if (days === 7) return '1 Week'
    if (days === 30) return '1 Month'
    if (days === 60) return '2 Months'
    if (days === 90) return '3 Months'
    return `${days} days`
  }

  const getTierIcon = (tierType: string) => {
    switch (tierType) {
      case 'standard': return <TrendingUp className="h-5 w-5" />
      case 'premium': return <Crown className="h-5 w-5" />
      default: return <Star className="h-5 w-5" />
    }
  }

  const getTierColor = (tierType: string) => {
    switch (tierType) {
      case 'standard': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700'
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700'
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700'
    }
  }

  const handlePromotionPurchase = async () => {
    if (!selectedTier || selectedDuration <= 0) {
      toast.error('Please select a promotion package')
      return
    }

    setIsLoading(true)

    try {
      // Directly redirect to payment page with calculated price
      const price = calculatePrice(selectedTier, selectedDuration)

      router.push(`/listings/${property.id}/promote?tier=${selectedTier}&duration=${selectedDuration}&price=${price}`)

    } catch (error: any) {
      console.error('Promotion purchase error:', error)
      toast.error(error.response?.data?.error || 'Failed to initiate promotion purchase')
    } finally {
      setIsLoading(false)
    }
  }

  const currentPrice = calculatePrice(selectedTier, selectedDuration)
  const isPropertyPromoted = property.is_promoted && property.promotion_status === 'active'

  if (isPropertyPromoted) {
    return (
      <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-300">
            <CheckCircle className="h-5 w-5" />
            Promotion Active
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-400">
            Your property is currently promoted with {property.promotion_tier} tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <div>
                <div className="font-semibold text-green-800 dark:text-green-300 capitalize">
                  {property.promotion_tier} Promotion
                </div>
                <div className="text-sm text-green-700 dark:text-green-400">
                  Expires: {property.promotion_end ? new Date(property.promotion_end).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <Badge className="bg-green-500 text-white">
                Active
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg border border-green-200 bg-white dark:bg-gray-900">
                <div className="text-lg font-bold text-green-600">
                  {property.views_count?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
              <div className="text-center p-3 rounded-lg border border-green-200 bg-white dark:bg-gray-900">
                <div className="text-lg font-bold text-green-600">
                  {property.inquiry_count || 0}
                </div>
                <div className="text-xs text-muted-foreground">Inquiries</div>
              </div>
            </div>

            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Promotion Status</AlertTitle>
              <AlertDescription>
                Your promotion is active until {property.promotion_end ? new Date(property.promotion_end).toLocaleDateString() : 'N/A'}.
                You can extend it anytime.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Boost Your Listing
        </CardTitle>
        <CardDescription>
          Promote your property to get more visibility and faster results
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoadingTiers ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading promotion options...</span>
          </div>
        ) : (
          <>
            {tierError && (
              <Alert className="mb-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-800 dark:text-amber-300">Note</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-400">
                  {tierError}
                </AlertDescription>
              </Alert>
            )}

            {/* Tier Selection */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Select Promotion Package</h3>
              {tiers.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Promotion Packages Available</AlertTitle>
                  <AlertDescription>
                    Please contact support to set up promotion packages.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tiers.map((tier) => (
                    <div
                      key={tier.id}
                      className={cn(
                        "border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                        selectedTier === tier.tier_type
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setSelectedTier(tier.tier_type)}
                    >
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          {getTierIcon(tier.tier_type)}
                          <h4 className="font-bold text-lg">{tier.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{tier.description}</p>
                      </div>

                      <div className="mb-3 space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span>7 days</span>
                          <span className="font-semibold">{(tier.price_7 || 0).toLocaleString()} ETB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>30 days</span>
                          <span className="font-semibold">{(tier.price_30 || 0).toLocaleString()} ETB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>60 days</span>
                          <span className="font-semibold">{(tier.price_60 || 0).toLocaleString()} ETB</span>
                        </div>
                        {(tier.price_90 || tier.price_90 === 0) && (
                          <div className="flex justify-between text-sm">
                            <span>90 days</span>
                            <span className="font-semibold">{(tier.price_90 || 0).toLocaleString()} ETB</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {Array.isArray(tier.features) && tier.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {selectedTier === tier.tier_type && (
                        <div className="mt-3 flex items-center justify-center">
                          <Badge className={cn("gap-1", getTierColor(tier.tier_type))}>
                            <CheckCircle className="h-3 w-3" />
                            Selected
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Duration Selection */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Select Duration</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DURATION_OPTIONS.map((duration) => (
                  <Button
                    key={duration.value}
                    variant={selectedDuration === duration.value ? "default" : "outline"}
                    onClick={() => setSelectedDuration(duration.value)}
                    className="h-14 flex flex-col"
                    disabled={tiers.length === 0}
                  >
                    <div className="font-bold">{duration.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {calculatePrice(selectedTier, duration.value).toLocaleString()} ETB
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Benefits Summary */}
            <div className="mb-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                What You Get
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-medium text-sm">Higher Visibility</div>
                    <div className="text-xs text-muted-foreground">Top search positions</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2">
                  <Mail className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-medium text-sm">Email Campaigns</div>
                    <div className="text-xs text-muted-foreground">Targeted buyer emails</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="font-medium text-sm">Analytics</div>
                    <div className="text-xs text-muted-foreground">Performance insights</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="mb-6 p-4 rounded-lg bg-muted">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Total</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedTier === 'standard' ? 'Standard' : 'Premium'} Promotion for {formatDuration(selectedDuration)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {currentPrice.toLocaleString()} ETB
                  </div>
                  <div className="text-xs text-muted-foreground">
                    One-time payment
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={handlePromotionPurchase}
              disabled={isLoading || tiers.length === 0}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : tiers.length === 0 ? (
                'Promotion Unavailable'
              ) : (
                <>
                  Get Promotion
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {/* Guarantee */}
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>30-day satisfaction guarantee</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}