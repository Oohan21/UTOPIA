// app/listings/[id]/promote/page.tsx - UPDATED: Only promotion payment
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
import { subscriptionApi } from '@/lib/api/subscriptions'
import { useAuthStore } from '@/lib/store/authStore'
import toast from 'react-hot-toast'
import Header from '@/components/common/Header/Header'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  TrendingUp,
  Crown,
  Shield,
  Star,
  ExternalLink,
  RefreshCw,
  Home,
  DollarSign,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

const DURATION_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' }
]

const PromotionPage = () => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  
  const propertyId = Number(params.id)
  const fromCreate = searchParams.get('from_create') === 'true'
  
  const [selectedTier, setSelectedTier] = useState<'basic' | 'standard' | 'premium'>('standard')
  const [selectedDuration, setSelectedDuration] = useState<number>(30)
  const [isProcessing, setIsProcessing] = useState(false)
  const [promotionPrice, setPromotionPrice] = useState<number>(0)
  
  // Fetch property details
  const { data: property, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => listingsApi.getPropertyById(propertyId),
    enabled: !!propertyId,
  })
  
  // Fetch promotion tiers for display
  const { data: promotionTiers, isLoading: isLoadingTiers } = useQuery({
    queryKey: ['promotion-tiers'],
    queryFn: async () => {
      try {
        const data = await subscriptionApi.getPromotionTiers()
        return Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Error fetching tiers:', error)
        return []
      }
    },
  })
  
  // Calculate price based on tier and duration
  const calculatePrice = (tierType: string, duration: number): number => {
    if (!promotionTiers || tierType === 'basic') return 0
    
    const tier = promotionTiers.find(t => t.tier_type === tierType)
    if (!tier) return 0
    
    switch(duration) {
      case 7: return tier.price_7 || 0
      case 30: return tier.price_30 || 0
      case 60: return tier.price_60 || tier.price_30 * 2 || 0
      case 90: return tier.price_90 || tier.price_30 * 3 || 0
      default: return tier.price_30 || 0
    }
  }
  
  // Update price when tier or duration changes
  useEffect(() => {
    const price = calculatePrice(selectedTier, selectedDuration)
    setPromotionPrice(price)
  }, [selectedTier, selectedDuration, promotionTiers])
  
  const getTierIcon = (tierType: string) => {
    switch(tierType) {
      case 'basic': return <Zap className="h-5 w-5" />
      case 'standard': return <TrendingUp className="h-5 w-5" />
      case 'premium': return <Crown className="h-5 w-5" />
      default: return <Star className="h-5 w-5" />
    }
  }
  
  const getTierColor = (tierType: string) => {
    switch(tierType) {
      case 'basic': return 'bg-green-100 text-green-800 border-green-200'
      case 'standard': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  const formatDuration = (days: number): string => {
    if (days === 7) return '1 Week'
    if (days === 30) return '1 Month'
    if (days === 60) return '2 Months'
    if (days === 90) return '3 Months'
    return `${days} days`
  }
  
  // Get selected tier details
  const tierDetails = promotionTiers?.find(t => t.tier_type === selectedTier)
  
  // Initialize payment for promotion
  const initializePayment = async () => {
    if (!propertyId || !selectedTier) {
      toast.error('Missing required information')
      return
    }
    
    if (selectedTier === 'basic') {
      toast.success('Your property will remain with basic visibility')
      router.push(`/listings/${propertyId}`)
      return
    }
    
    setIsProcessing(true)
    
    try {
      console.log('Starting promotion payment with:', {
        property_id: propertyId,
        tier_type: selectedTier,
        duration_days: selectedDuration,
      })
      
      // Try the promotion payment endpoint
      const response = await subscriptionApi.initiatePromotionPayment({
        property_id: propertyId,
        tier_type: selectedTier,
        duration_days: selectedDuration,
      })
      
      console.log('Payment initiation response:', response)
      
      if (response.checkout_url) {
        // Store payment data
        localStorage.setItem('last_payment_attempt', JSON.stringify({
          propertyId,
          tierType: selectedTier,
          duration: selectedDuration,
          timestamp: new Date().toISOString()
        }))
        
        // Redirect to Chapa payment page
        window.location.href = response.checkout_url
        return
      } else {
        throw new Error('No checkout URL received')
      }
      
    } catch (error: any) {
      console.error('Payment initiation error:', error)
      toast.error(error.response?.data?.error || 'Failed to initiate payment. Please try again.')
      
      // Fallback to direct Chapa integration if API fails
      try {
        toast.loading('Trying alternative payment method...')
        
        // Generate a unique transaction reference
        const txRef = `utopia-promo-${propertyId}-${Date.now()}`
        
        // Construct Chapa payment URL directly
        const chapaPaymentUrl = `https://api.chapa.co/v1/hosted/pay?` + new URLSearchParams({
          public_key: process.env.NEXT_PUBLIC_CHAPA_PUBLIC_KEY || 'YOUR_PUBLIC_KEY',
          amount: promotionPrice.toString(),
          currency: 'ETB',
          email: 'customer@example.com', // Should come from user profile
          first_name: 'Customer',
          last_name: 'Name',
          tx_ref: txRef,
          callback_url: `${window.location.origin}/payment/callback?property_id=${propertyId}&tier=${selectedTier}&duration=${selectedDuration}`,
          return_url: `${window.location.origin}/listings/${propertyId}?promotion=success`,
          'customization[title]': 'Property Promotion Payment',
          'customization[description]': `Promotion for ${property?.title || 'Property'}`,
        }).toString()
        
        // Store payment data
        localStorage.setItem('last_payment_attempt', JSON.stringify({
          propertyId,
          tierType: selectedTier,
          duration: selectedDuration,
          txRef,
          amount: promotionPrice,
          timestamp: new Date().toISOString()
        }))
        
        // Redirect to Chapa
        window.location.href = chapaPaymentUrl
        
      } catch (fallbackError) {
        console.error('Fallback payment error:', fallbackError)
        toast.error('Unable to process payment. Please contact support.')
      }
    } finally {
      setIsProcessing(false)
      toast.dismiss()
    }
  }
  
  const handleBack = () => {
    router.push(`/listings/${propertyId}`)
  }
  
  const handleSkipPromotion = () => {
    toast.success('Property listed successfully! You can promote it later.')
    router.push(`/listings/${propertyId}`)
  }
  
  // Handle unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/listings/${propertyId}/promote`)
    }
  }, [isAuthenticated, router, propertyId])
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner fullScreen />
      </div>
    )
  }
  
  if (isLoadingProperty || isLoadingTiers) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl py-8 px-4">
          <div className="flex items-center justify-center p-12">
            <LoadingSpinner className="h-8 w-8" />
            <span className="ml-3">Loading promotion options...</span>
          </div>
        </div>
      </div>
    )
  }
  
  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl py-8 px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Unable to load property details. Please try again.
            </AlertDescription>
          </Alert>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      
      <div className="container max-w-6xl py-8 px-4">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Property
        </Button>
        
        {/* Success message for new listings */}
        {fromCreate && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-300">Property Listed Successfully!</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              Your property has been submitted for approval. Boost its visibility with a promotion below.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Main content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column - Property details and promotion options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property info */}
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0].image}
                        alt={property.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-muted">
                        <Home className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-foreground">{property.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {property.specific_location}, {property.sub_city?.name}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline" className="capitalize">
                        {property.property_type}
                      </Badge>
                      <Badge variant="outline">
                        {property.listing_type === 'for_sale' ? 'For Sale' : 'For Rent'}
                      </Badge>
                      <Badge variant="outline">
                        {property.bedrooms} bed • {property.bathrooms} bath • {property.total_area}m²
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Promotion options */}
            <Card className="border-border shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Boost Your Visibility</CardTitle>
                <CardDescription>
                  Choose a promotion package to get more views and faster results
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Promotion tier selection */}
                <div>
                  <h3 className="font-semibold mb-4 text-foreground">Select Promotion Tier</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {promotionTiers && promotionTiers.map((tier) => (
                      <div
                        key={tier.id}
                        className={cn(
                          "border-2 rounded-lg p-5 cursor-pointer transition-all h-full",
                          selectedTier === tier.tier_type
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setSelectedTier(tier.tier_type as any)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedTier(tier.tier_type as any)
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          {getTierIcon(tier.tier_type)}
                          <h4 className="font-bold text-lg text-foreground">{tier.name}</h4>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                        
                        {tier.tier_type !== 'basic' ? (
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-foreground">7 days</span>
                              <span className="font-semibold text-foreground">{tier.price_7?.toLocaleString()} ETB</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-foreground">30 days</span>
                              <span className="font-semibold text-foreground">{tier.price_30?.toLocaleString()} ETB</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-foreground">60 days</span>
                              <span className="font-semibold text-foreground">{tier.price_60?.toLocaleString()} ETB</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-2xl font-bold text-green-600 mb-4">FREE</div>
                        )}
                        
                        <div className="space-y-2">
                          {tier.features && tier.features.slice(0, 3).map((feature: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-foreground">{feature}</span>
                            </div>
                          ))}
                          {tier.features && tier.features.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              + {tier.features.length - 3} more features
                            </p>
                          )}
                        </div>
                        
                        {selectedTier === tier.tier_type && (
                          <div className="mt-4 flex items-center justify-center">
                            <Badge className={cn("gap-1", getTierColor(tier.tier_type))}>
                              <CheckCircle className="h-3 w-3" />
                              Selected
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Duration selection for paid tiers */}
                {selectedTier !== 'basic' && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-4 text-foreground">Select Duration</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {DURATION_OPTIONS.map((duration) => (
                        <Button
                          key={duration.value}
                          variant={selectedDuration === duration.value ? "default" : "outline"}
                          onClick={() => setSelectedDuration(duration.value)}
                          className="h-16"
                        >
                          <div>
                            <div className="font-bold text-foreground">{duration.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {calculatePrice(selectedTier, duration.value).toLocaleString()} ETB
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Promotion benefits summary */}
                {selectedTier !== 'basic' && tierDetails && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="font-semibold mb-3 text-foreground">Promotion Benefits</h4>
                    <div className="space-y-2">
                      {tierDetails.features && tierDetails.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Chapa Payment Instructions */}
                {selectedTier !== 'basic' && (
                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                    <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-800 dark:text-blue-300">Payment Process</AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-400 space-y-2">
                      <p>You will be redirected to Chapa's secure payment page.</p>
                      <p className="font-medium">Available payment methods:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>Credit/Debit Cards (Visa, Mastercard)</li>
                        <li>Mobile Banking (CBE Birr, Amole, M-Birr)</li>
                        <li>HelloCash</li>
                        <li>Telebirr</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Order summary and payment */}
          <div className="space-y-6">
            <Card className="sticky top-6 border-border shadow-lg">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Price breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Promotion Tier</span>
                    <span className="font-medium text-foreground">
                      {tierDetails?.name || (selectedTier === 'standard' ? 'Standard' : 'Premium')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium text-foreground">{formatDuration(selectedDuration)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {selectedTier === 'basic' ? (
                          'FREE'
                        ) : (
                          `${promotionPrice.toLocaleString()} ETB`
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedTier === 'basic' ? 'Basic listing' : 'One-time payment'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payment method info for paid tiers */}
                {selectedTier !== 'basic' && (
                  <div className="pt-4">
                    <h4 className="font-medium mb-3 text-foreground">Payment Method</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <div className="h-10 w-16 rounded bg-blue-100 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">Chapa</div>
                          <div className="text-xs text-muted-foreground">
                            Multiple payment options available
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex-col space-y-3">
                {selectedTier !== 'basic' ? (
                  <Button
                    onClick={initializePayment}
                    disabled={isProcessing}
                    className="w-full h-12 text-base"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Preparing Payment...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Pay with Chapa
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSkipPromotion}
                    className="w-full h-12 text-base"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Continue with Basic Listing
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="w-full"
                >
                  Cancel
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  By proceeding, you agree to our Terms of Service and Privacy Policy.
                </p>
              </CardFooter>
            </Card>
            
            {/* Support info */}
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div className="text-sm">
                      <div className="font-medium text-foreground">Secure Payment</div>
                      <div className="text-muted-foreground">
                        Your payment is processed securely by Chapa
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div className="text-sm">
                      <div className="font-medium text-foreground">Instant Activation</div>
                      <div className="text-muted-foreground">
                        Promotion activates immediately after payment
                      </div>
                    </div>
                  </div>
                  
                  {selectedTier !== 'basic' && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-purple-500" />
                      <div className="text-sm">
                        <div className="font-medium text-foreground">Money-Back Guarantee</div>
                        <div className="text-muted-foreground">
                          7-day refund if unsatisfied
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PromotionPage