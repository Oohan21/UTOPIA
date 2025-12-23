'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Header from '@/components/common/Header/Header'
import { PropertyMap } from '@/components/map/PropertyMap'
import { MapModal } from '@/components/map/MapModal'
import { listingsApi } from '@/lib/api/listings'
import { subscriptionApi } from '@/lib/api/subscriptions'
import { formatCurrency, formatPricePerSqm } from '@/lib/utils/formatCurrency'
import { formatDate, formatTimeAgo } from '@/lib/utils/formatDate'
import {
  Bed, Bath, Square, MapPin, Calendar, Car, TreePine, Shield, Sofa,
  Wind, Wifi, Zap, Building, Dumbbell, Users, Heart, Share2, Phone,
  MessageSquare, Star, ChevronLeft, ChevronRight, Clock, CheckCircle,
  FileText, ExternalLink, Globe, Waves, Thermometer, Coffee, Home,
  Layers, DollarSign, Percent, TrendingUp, Eye, Mail, Edit, Copy,
  Facebook, Twitter, Printer, Download as DownloadIcon, Play, Video,
  ArrowLeft, Crown, Zap as ZapIcon, BarChart3, Target, Mail as MailIcon,
  AlertCircle, Maximize2, Map, Building2, Check, X, Filter,
  CalendarDays, DollarSign as Dollar, ArrowUpRight, User, MailCheck,
  PhoneCall, MessageCircle, Bookmark, Share, Send, Paperclip, XCircle,
  Sparkles, Award, BadgeCheck, Rocket, TrendingDown, RefreshCw, EyeOff,
  ShoppingBag, CreditCard, Clock3, Bell, CalendarClock, ShieldAlert
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { ScrollArea } from '@/components/ui/Scroll-area'
import PropertyCard from '@/components/listings/PropertyCard'
import { PromotionManager } from '@/components/properties/PromotionManager'
import { PromotionBenefits } from '@/components/properties/PromotionBenefits'
import { PromotionAnalytics } from '@/components/dashboard/PromotionAnalytics'
import { useAuthStore } from '@/lib/store/authStore'
import { useComparisonStore } from '@/lib/store/comparisonStore'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog"
import { Label } from '@/components/ui/Label'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/Alert"
import { Property, PropertyImage } from '@/lib/types/property'
import { PropertyPromotionTier } from '@/lib/types/subscription'
import { cn } from '@/lib/utils'

// Import MessageDialog component
import { SimpleMessageDialog } from '@/components/properties/SimpleMessageDialog'

// Import Inquiry components
import { InquiryDialog } from '@/components/inquiries/InquiryDialog'

// Import next-intl
import { useTranslations, useLocale } from 'next-intl'

// WhatsApp Icon Component
const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.375a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.9 6.994c-.004 5.45-4.436 9.88-9.885 9.88m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.893-11.892 0-3.18-1.24-6.162-3.495-8.411" />
  </svg>
)

// Property Gallery Component
function PropertyGallery({
  images,
  propertyTitle,
  propertyVideo,
  onImageClick,
  t
}: {
  images: PropertyImage[],
  propertyTitle: string,
  propertyVideo?: string,
  onImageClick?: (index: number) => void,
  t: any
}) {
  const [activeImage, setActiveImage] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  const primaryImage = images.find(img => img.is_primary) || images[0]

  const handlePreviousImage = () => {
    setActiveImage((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleNextImage = () => {
    setActiveImage((prev) => (prev + 1) % images.length)
  }

  const handleThumbnailClick = (index: number) => {
    setActiveImage(index)
    onImageClick?.(index)
  }

  const getImageUrl = (image: PropertyImage) => {
    if (!image?.image) return '/placeholder-property.jpg'
    return image.image.startsWith('http') ? image.image : `http://localhost:8000${image.image}`
  }

  const hasImages = images?.length > 0
  const hasVideo = !!propertyVideo

  return (
    <div className="space-y-4">
      {/* Main Media Display */}
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 shadow-2xl">
        {/* Media Content */}
        {hasImages ? (
          <>
            <Image
              src={getImageUrl(images[activeImage] || primaryImage)}
              alt={`${propertyTitle} - ${activeImage + 1}`}
              fill
              className="object-cover transition-all duration-500 hover:scale-105 cursor-pointer"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
              onClick={() => setIsFullscreen(true)}
            />

            {/* Image Overlay Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {images[activeImage]?.caption || `${t('gallery.image')} ${activeImage + 1} ${t('gallery.of')} ${images.length}`}
                </div>
                <div className="text-sm opacity-90 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {images.length} {t('gallery.photos')} {hasVideo && `• 1 ${t('gallery.video')}`}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
            <Home className="h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">{t('gallery.noImages')}</p>
          </div>
        )}

        {/* Video Badge */}
        {hasVideo && (
          <div className="absolute right-3 top-3 z-10">
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 backdrop-blur-sm text-white border-0 shadow-lg px-4 py-2 gap-2">
              <Video className="h-4 w-4" />
              {t('gallery.videoTour')}
            </Badge>
          </div>
        )}

        {/* Navigation Controls */}
        {images?.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white shadow-2xl transition-all duration-300 hover:scale-110"
              onClick={handlePreviousImage}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white shadow-2xl transition-all duration-300 hover:scale-110"
              onClick={handleNextImage}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Action Buttons */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          {hasVideo && (
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white shadow-lg border-0 gap-2 px-4"
              onClick={() => setIsVideoModalOpen(true)}
            >
              <Play className="h-4 w-4" />
              {t('gallery.playVideo')}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white shadow-lg border-0"
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Media Counter */}
        {images?.length > 1 && (
          <div className="absolute bottom-3 left-3 rounded-full bg-black/60 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-lg">
            {activeImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images?.length > 1 && (
        <ScrollArea className="pb-2">
          <div className="flex gap-3">
            {images.map((image, index) => {
              const imageUrl = getImageUrl(image)
              return (
                <button
                  key={image.id}
                  onClick={() => handleThumbnailClick(index)}
                  className={`relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl transition-all duration-300 ${activeImage === index
                    ? 'ring-3 ring-primary ring-offset-2 shadow-xl scale-105'
                    : 'opacity-80 hover:opacity-100 hover:ring-2 hover:ring-primary/50 hover:scale-105'
                    }`}
                >
                  <img
                    src={imageUrl}
                    alt={`${propertyTitle} - ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-lg">
                      {t('gallery.cover')}
                    </div>
                  )}
                  {activeImage === index && (
                    <div className="absolute inset-0 bg-primary/20" />
                  )}
                </button>
              )
            })}
            {hasVideo && (
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 group"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Video className="h-10 w-10 text-primary/50 group-hover:text-primary transition-colors" />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    {t('gallery.videoTour')}
                  </span>
                </div>
              </button>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && hasImages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4">
          <div className="relative h-full w-full max-w-7xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            <img
              src={getImageUrl(images[activeImage])}
              alt={`${propertyTitle} - Fullscreen`}
              className="h-full w-full object-contain"
            />

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all"
                  onClick={handlePreviousImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
              {activeImage + 1} / {images.length}
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {propertyVideo && (
        <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
          <DialogContent className="max-w-4xl bg-background border-0 shadow-2xl">
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <Video className="h-6 w-6 text-primary" />
                {t('gallery.propertyVideoTour')}
              </DialogTitle>
              <DialogDescription className="text-lg">
                {t('gallery.immersiveVideoTour')} {propertyTitle}
              </DialogDescription>
            </DialogHeader>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-muted/30 to-muted/50">
              <video
                src={propertyVideo}
                controls
                className="h-full w-full rounded-lg"
                title={propertyTitle}
                autoPlay
                playsInline
              >
                {t('gallery.browserNoSupport')}
              </video>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = propertyVideo
                  link.download = `${propertyTitle.replace(/\s+/g, '_')}_video.mp4`
                  link.click()
                }}
                className="w-full sm:w-auto gap-2"
              >
                <DownloadIcon className="h-4 w-4" />
                {t('gallery.downloadVideo')}
              </Button>
              <Button
                onClick={() => setIsVideoModalOpen(false)}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {t('common.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Promotion Status Badge Component
function PromotionStatusBadge({
  tier,
  isPromoted,
  endDate,
  status,
  t
}: {
  tier?: string;
  isPromoted?: boolean;
  endDate?: string;
  status?: string;
  t: any;
}) {
  if (!isPromoted || !tier || tier === 'basic' || status !== 'active') return null

  const badgeConfig = {
    standard: {
      icon: TrendingUp,
      label: t('promotion.standardPromoted'),
      className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      gradient: 'from-blue-500 to-cyan-500',
      daysLeft: t('promotion.standardExposureFor'),
      features: [
        t('promotion.features.top20InSearch'),
        t('promotion.features.emailNotifications'),
        t('promotion.features.promotedBadge')
      ]
    },
    premium: {
      icon: Crown,
      label: t('promotion.premiumPromoted'),
      className: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
      gradient: 'from-purple-600 to-pink-600',
      daysLeft: t('promotion.premiumVisibilityFor'),
      features: [
        t('promotion.features.topPosition'),
        t('promotion.features.homepageFeatured'),
        t('promotion.features.socialMediaPromotion')
      ]
    }
  }

  const config = badgeConfig[tier as keyof typeof badgeConfig]
  if (!config) return null

  const Icon = config.icon
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="relative group">
      <Badge className={`${config.className} gap-2 px-4 py-2.5 font-bold text-sm shadow-xl border-0 rounded-xl`}>
        <Icon className="h-4 w-4" />
        {config.label}
        {daysRemaining !== null && daysRemaining > 0 && (
          <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
            {daysRemaining}d {t('promotion.left')}
          </span>
        )}
      </Badge>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-50 w-64">
        <div className="bg-gray-900 text-white rounded-xl py-3 px-4 shadow-2xl border border-gray-800">
          <div className="font-bold text-sm mb-2 flex items-center gap-2">
            <Icon className="h-3.5 w-3.5" />
            {config.label} {t('promotion.listing')}
          </div>
          <div className="space-y-2 text-xs">
            {daysRemaining !== null && (
              <div className="text-gray-300">
                {config.daysLeft} <span className="font-bold text-white">{daysRemaining} {t('promotion.days')}</span>
              </div>
            )}
            {endDate && (
              <div className="text-gray-400 text-xs">
                {t('promotion.expires')}: {formatDate(endDate)}
              </div>
            )}
            <Separator className="my-2 bg-gray-700" />
            <div className="font-medium text-gray-300 mb-1">{t('promotion.features')}:</div>
            {config.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="h-3 w-3 text-green-400" />
                {feature}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-3 h-3 bg-gray-900 border-b border-r border-gray-800"></div>
      </div>
    </div>
  )
}

// Active Promotion Card Component
function ActivePromotionCard({
  property,
  onCancelPromotion,
  t
}: {
  property: Property;
  onCancelPromotion: () => void;
  t: any;
}) {
  const daysRemaining = property.promotion_end
    ? Math.max(0, Math.ceil((new Date(property.promotion_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const tierConfig = {
    standard: {
      icon: TrendingUp,
      color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      label: t('promotion.standardPromotion'),
      benefits: [
        t('promotion.benefits.top20InSearch'),
        t('promotion.benefits.emailNotification'),
        t('promotion.benefits.promotedBadge')
      ]
    },
    premium: {
      icon: Crown,
      color: 'bg-gradient-to-r from-purple-600 to-pink-600',
      label: t('promotion.premiumPromotion'),
      benefits: [
        t('promotion.benefits.topPosition'),
        t('promotion.benefits.homepageFeatured'),
        t('promotion.benefits.socialMediaAdvertising')
      ]
    }
  }

  const config = tierConfig[property.promotion_tier as keyof typeof tierConfig]
  const Icon = config?.icon || TrendingUp

  return (
    <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-950 text-white">
      <div className={`absolute top-0 left-0 right-0 h-1 ${config?.color || 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}></div>

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                {t('promotion.activePromotion')}
                <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 px-3 py-1">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('common.active')}
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-300">
                {t('promotion.propertyCurrentlyPromoted')}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">{t('promotion.promotionProgress')}</span>
            <span className="font-bold">{daysRemaining} {t('promotion.daysRemaining')}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${config?.color || 'bg-gradient-to-r from-blue-500 to-cyan-500'} transition-all duration-1000`}
              style={{
                width: daysRemaining ? `${Math.min(100, (daysRemaining / 30) * 100)}%` : '100%'
              }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{property.views_count?.toLocaleString() || 0}</div>
            <div className="text-xs text-gray-400 mt-1">{t('stats.totalViews')}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{property.inquiry_count || 0}</div>
            <div className="text-xs text-gray-400 mt-1">{t('stats.inquiries')}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{daysRemaining || 0}</div>
            <div className="text-xs text-gray-400 mt-1">{t('promotion.daysLeft')}</div>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-300">{t('promotion.activeBenefits')}</h4>
          <div className="space-y-2">
            {config?.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-lg p-3">
                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3">
            <div className="text-gray-400">{t('promotion.started')}</div>
            <div className="font-semibold">{formatDate(property.promotion_start || '')}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3">
            <div className="text-gray-400">{t('promotion.expires')}</div>
            <div className="font-semibold">{formatDate(property.promotion_end || '')}</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3 pt-4 border-t border-gray-800">
        <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {t('promotion.cancelWarning')}
          </AlertDescription>
        </Alert>
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1 bg-transparent border-gray-700 hover:bg-gray-800 text-white"
            onClick={onCancelPromotion}
          >
            <X className="h-4 w-4 mr-2" />
            {t('promotion.cancelPromotion')}
          </Button>
          <Button className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('promotion.extendPromotion')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

// Property Sidebar Component
function PropertySidebar({
  property,
  user,
  isSaved,
  isInComparison,
  onSave,
  onAddToComparison,
  onContact,
  onShare,
  onPrint,
  onDownload,
  onSendInquiry,
  onSendMessage,
  isOwner,
  t,
  locale
}: {
  property: Property
  user: any
  isSaved: boolean
  isInComparison: boolean
  onSave: () => void
  onAddToComparison: () => void
  onContact: (method: 'call' | 'message' | 'whatsapp') => void
  onShare: (platform?: string) => void
  onPrint: () => void
  onDownload: () => void
  onSendInquiry: () => void
  onSendMessage: () => void
  isOwner: boolean
  t: any
  locale: string
}) {
  const priceDisplay = property.listing_type === 'for_rent'
    ? `${formatCurrency(property.monthly_rent || 0)}${t('perMonth')}`
    : formatCurrency(property.price_etb || 0)

  const contactMethods = [
    {
      method: 'call' as const,
      label: t('actions.callNow'),
      icon: PhoneCall,
      available: !!property.owner?.phone_number,
      color: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg'
    },
    {
      method: 'whatsapp' as const,
      label: t('actions.whatsapp'),
      icon: WhatsappIcon,
      available: !!property.owner?.phone_number,
      color: 'bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#22C55E] hover:to-[#0F9D58] text-white shadow-lg'
    },
    {
      method: 'message' as const,
      label: t('actions.sendMessage'),
      icon: MessageCircle,
      available: true,
      color: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Pricing Card */}
      <Card className="border-0 shadow-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="mb-6 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {priceDisplay}
            </div>
            {property.price_per_sqm && (
              <div className="mt-2 text-sm text-muted-foreground">
                {formatPricePerSqm(property.price_per_sqm)}
              </div>
            )}
            {property.price_negotiable && (
              <Badge className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-4 py-1.5 gap-2">
                <Percent className="h-3.5 w-3.5" />
                {t('priceNegotiable')}
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            {contactMethods.map((method) => (
              <Button
                key={method.method}
                className={`w-full h-12 ${method.color}`}
                onClick={() => onContact(method.method)}
                disabled={!method.available}
              >
                <method.icon className="mr-2 h-5 w-5" />
                {method.available ? method.label : t('actions.contactUnavailable')}
              </Button>
            ))}

            <Button
              variant="outline"
              className="w-full h-12 border-2 hover:border-primary hover:bg-primary/5"
              onClick={onSendInquiry}
            >
              <MailCheck className="mr-2 h-5 w-5" />
              {t('actions.sendDetailedInquiry')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Owner Card */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            {t('contactInformation')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Owner Info */}
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 p-4 border">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80 text-white font-bold text-lg">
                {property.owner?.first_name?.[0]}{property.owner?.last_name?.[0]}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg">
                  {property.owner?.first_name} {property.owner?.last_name}
                </h4>
                <p className="text-sm text-muted-foreground capitalize">
                  {property.owner?.user_type?.replace('_', ' ') || t('propertyOwner')}
                </p>
                {property.owner?.is_verified && (
                  <Badge className="mt-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs px-3 py-1">
                    <BadgeCheck className="h-3 w-3 mr-1" />
                    {t('verifiedSeller')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 rounded-lg border bg-card p-4">
              <h5 className="font-semibold text-sm text-muted-foreground">{t('contactDetails')}</h5>
              {property.owner?.phone_number && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t('phone')}:</span>
                  <span className="font-medium text-primary">{property.owner.phone_number}</span>
                </div>
              )}
              {property.owner?.email && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">{t('email')}:</span>
                  <span className="font-medium truncate max-w-[150px] text-primary">{property.owner.email}</span>
                </div>
              )}
            </div>

            {/* Member Since */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('memberSince')}</span>
                </div>
                <span className="font-semibold">{formatDate(property.owner?.created_at || '')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!isOwner && (
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t('saveAndShare')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-11 justify-start border-2 hover:border-primary hover:bg-primary/5"
              onClick={onSave}
            >
              <Heart className={`mr-3 h-5 w-5 ${isSaved ? 'fill-red-500 text-red-500 animate-pulse' : ''}`} />
              {isSaved ? t('savedToFavorites') : t('saveProperty')}
            </Button>

            <Button
              variant="outline"
              className="w-full h-11 justify-start border-2 hover:border-primary hover:bg-primary/5"
              onClick={onAddToComparison}
              disabled={isInComparison}
            >
              <ExternalLink className="mr-3 h-5 w-5" />
              {isInComparison ? t('inComparison') : t('addToComparison')}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-11 justify-start border-2 hover:border-primary hover:bg-primary/5">
                  <Share className="mr-3 h-5 w-5" />
                  {t('shareProperty')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-0 shadow-2xl">
                <DropdownMenuItem onClick={() => onShare('facebook')} className="gap-2 cursor-pointer">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare('twitter')} className="gap-2 cursor-pointer">
                  <Twitter className="h-4 w-4 text-blue-400" />
                  Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare()} className="gap-2 cursor-pointer">
                  <Copy className="h-4 w-4" />
                  {t('copyLink')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onPrint} className="gap-2 cursor-pointer">
                  <Printer className="h-4 w-4" />
                  {t('printDetails')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDownload} className="gap-2 cursor-pointer">
                  <DownloadIcon className="h-4 w-4" />
                  {t('downloadPDF')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      )}

      {/* Property Stats */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{t('propertyStats')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">{t('propertyID')}</span>
              <span className="font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                {property.property_id}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{t('listed')}</span>
              <div className="text-right">
                <div className="font-semibold">{formatDate(property.listed_date)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeAgo(property.listed_date)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-2">
              <div className="text-center p-2 rounded-lg bg-primary/5">
                <div className="flex items-center justify-center gap-1">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="font-bold">{(property.views_count || 0).toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{t('views')}</div>
              </div>

              <div className="text-center p-2 rounded-lg bg-green-500/5">
                <div className="flex items-center justify-center gap-1">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="font-bold">{property.inquiry_count || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{t('inquiries')}</div>
              </div>

              <div className="text-center p-2 rounded-lg bg-purple-500/5">
                <div className="flex items-center justify-center gap-1">
                  <Bookmark className="h-4 w-4 text-purple-500" />
                  <span className="font-bold">{property.save_count || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{t('saved')}</div>
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">{t('status')}</span>
              <Badge
                className={`capitalize px-3 py-1.5 ${property.property_status === 'available'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : property.property_status === 'sold'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
                  }`}
              >
                {t(`statuses.${property.property_status}`)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Tips */}
      {!isOwner && (
        <Alert className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 shadow-lg">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">{t('safetyTipsTitle')}</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm space-y-1">
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
              <span>{t('safetyTips.meetPublic')}</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
              <span>{t('safetyTips.verifyDocuments')}</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
              <span>{t('safetyTips.neverWire')}</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
              <span>{t('safetyTips.reportSuspicious')}</span>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Main Component
export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = parseInt(params.id as string)
  const { isAuthenticated, user } = useAuthStore()
  const { addToComparison, isInComparison } = useComparisonStore()

  // Get translations and locale
  const t = useTranslations('property')
  const tCommon = useTranslations('common')
  const tListings = useTranslations('listings')
  const tProperty = useTranslations('propertyDetail')
  const locale = useLocale() as 'en' | 'am' | 'om'

  // State
  const [isInquiryOpen, setIsInquiryOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingInquiry, setIsSendingInquiry] = useState(false)
  const [isCancellingPromotion, setIsCancellingPromotion] = useState(false)
  const [showPromotionBenefits, setShowPromotionBenefits] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [inquiryData, setInquiryData] = useState({
    message: '',
    inquiry_type: 'general',
    contact_preference: 'any',
  })

  // Track view on mount
  useEffect(() => {
    if (propertyId) {
      listingsApi.trackPropertyView(propertyId).catch(console.error)
    }
  }, [propertyId])

  // Fetch property details
  const {
    data: property,
    isLoading: isLoadingProperty,
    error: propertyError,
    refetch: refetchProperty
  } = useQuery<Property>({
    queryKey: ['property', propertyId],
    queryFn: () => listingsApi.getPropertyById(propertyId),
    enabled: !!propertyId,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch similar properties
  const { data: similarProperties, isLoading: isLoadingSimilar } = useQuery<Property[]>({
    queryKey: ['similar-properties', propertyId],
    queryFn: () => listingsApi.getSimilarProperties(propertyId),
    enabled: !!propertyId && !!property,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch recommended properties
  const { data: recommendedProperties } = useQuery<Property[]>({
    queryKey: ['recommended-properties'],
    queryFn: () => listingsApi.getRecommendations(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch promotion tiers
  const { data: promotionTiers } = useQuery<PropertyPromotionTier[]>({
    queryKey: ['promotion-tiers'],
    queryFn: () => subscriptionApi.getPromotionTiers(),
  })

  // Calculate property stats
  const propertyStats = useMemo(() => {
    if (!property) return null

    const basicFeatures = [
      { icon: Bed, label: `${property.bedrooms || 0} ${tProperty('bedrooms')}`, value: property.bedrooms },
      { icon: Bath, label: `${property.bathrooms || 0} ${tProperty('bathrooms')}`, value: property.bathrooms },
      { icon: Square, label: `${property.total_area || 0} ${tProperty('areaUnit')}`, value: property.total_area },
      { icon: Building, label: `${property.floors || 1} ${(property.floors || 1) > 1 ? tProperty('floors') : tProperty('floor')}`, value: property.floors },
      { icon: Calendar, label: `${tProperty('built')} ${property.built_year || 'N/A'}`, value: property.built_year },
    ]

    const amenities = [
      { key: 'has_parking', icon: Car, label: tProperty('features.parking'), value: property.has_parking },
      { key: 'has_garden', icon: TreePine, label: tProperty('features.garden'), value: property.has_garden },
      { key: 'has_security', icon: Shield, label: tProperty('features.security'), value: property.has_security },
      { key: 'has_furniture', icon: Sofa, label: tProperty('features.furnished'), value: property.has_furniture },
      { key: 'has_air_conditioning', icon: Wind, label: tProperty('features.ac'), value: property.has_air_conditioning },
      { key: 'has_internet', icon: Wifi, label: tProperty('features.internet'), value: property.has_internet },
      { key: 'has_generator', icon: Zap, label: tProperty('features.generator'), value: property.has_generator },
      { key: 'has_gym', icon: Dumbbell, label: tProperty('features.gym'), value: property.has_gym },
      { key: 'is_pet_friendly', icon: Users, label: tProperty('features.petFriendly'), value: property.is_pet_friendly },
      { key: 'has_swimming_pool', icon: Waves, label: tProperty('features.swimmingPool'), value: property.has_swimming_pool },
      { key: 'has_elevator', icon: Layers, label: tProperty('features.elevator'), value: property.has_elevator },
      { key: 'is_wheelchair_accessible', icon: Users, label: tProperty('features.accessible'), value: property.is_wheelchair_accessible },
      { key: 'has_heating', icon: Thermometer, label: tProperty('features.heating'), value: property.has_heating },
      { key: 'has_backup_water', icon: Coffee, label: tProperty('features.waterBackup'), value: property.has_backup_water },
      { key: 'has_conference_room', icon: Building2, label: tProperty('features.conferenceRoom'), value: property.has_conference_room },
    ].filter(item => item.value)

    const documents = [
      { key: 'has_title_deed', icon: FileText, label: tProperty('documents.titleDeed'), value: property.has_title_deed },
      { key: 'has_construction_permit', icon: FileText, label: tProperty('documents.constructionPermit'), value: property.has_construction_permit },
      { key: 'has_occupancy_certificate', icon: FileText, label: tProperty('documents.occupancyCertificate'), value: property.has_occupancy_certificate },
    ].filter(item => item.value)

    return { basicFeatures, amenities, documents }
  }, [property, tProperty])

  // Handlers
  const handleSaveProperty = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error(tProperty('toasts.loginRequired'))
      router.push(`/auth/login?redirect=/listings/${propertyId}`)
      return
    }

    if (isSaving) return

    setIsSaving(true)
    try {
      await listingsApi.saveProperty(propertyId)
      const wasSaved = property?.save_count && property.save_count > 0
      toast.success(wasSaved ? tProperty('toasts.removedFromSaved') : tProperty('toasts.propertySaved'))
      refetchProperty()
    } catch (error: any) {
      toast.error(error.response?.data?.error || tProperty('toasts.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }, [isAuthenticated, propertyId, property?.save_count, router, refetchProperty, isSaving, tProperty])

  const handleShare = useCallback(async (platform?: string) => {
    const url = window.location.href
    const title = property?.title || tProperty('share.defaultTitle')
    const text = property?.description?.substring(0, 100) || ''

    if (platform) {
      let shareUrl = ''
      switch (platform) {
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`
          break
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}&hashtags=PropertyListing`
          break
        default:
          break
      }
      window.open(shareUrl, '_blank')
      return
    }

    // Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        })
        toast.success(tProperty('toasts.sharedSuccess'))
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url)
        toast.success(tProperty('toasts.linkCopied'))
      } catch (err) {
        toast.error(tProperty('toasts.copyFailed'))
      }
    }
  }, [property, tProperty])

  const handleContact = useCallback((method: 'call' | 'message' | 'whatsapp') => {
    if (!property?.owner?.phone_number && method !== 'message') {
      toast.error(tProperty('toasts.noContactInfo'))
      return
    }

    const phoneNumber = property?.owner?.phone_number?.replace(/\D/g, '') || ''

    switch (method) {
      case 'call':
        window.location.href = `tel:${phoneNumber}`
        break
      case 'whatsapp':
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(`${tProperty('whatsapp.message')} ${property?.title}`)}`, '_blank')
        break
      case 'message':
        setIsMessageDialogOpen(true)
        break
    }
  }, [property, tProperty])

  const handleSubmitInquiry = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error(tProperty('toasts.loginRequired'))
      router.push(`/auth/login?redirect=/listings/${propertyId}`)
      return
    }

    if (!inquiryData.message.trim()) {
      toast.error(tProperty('toasts.enterMessage'))
      return
    }

    setIsSendingInquiry(true)
    try {
      const inquiryApi = (await import('@/lib/api/inquiry')).inquiryApi
      await inquiryApi.createInquiry({
        property_id: propertyId,
        inquiry_type: inquiryData.inquiry_type,
        message: inquiryData.message,
        contact_preference: inquiryData.contact_preference,
        full_name: user?.first_name ? `${user.first_name} ${user.last_name}` : undefined,
        email: user?.email,
        phone: user?.phone_number,
        category: 'buyer',
        source: 'website'
      })
      toast.success(tProperty('toasts.inquirySent'))
      setIsInquiryOpen(false)
      setInquiryData({
        message: '',
        inquiry_type: 'general',
        contact_preference: 'any',
      })
      refetchProperty()
    } catch (error: any) {
      toast.error(error.response?.data?.error || tProperty('toasts.inquiryFailed'))
    } finally {
      setIsSendingInquiry(false)
    }
  }, [isAuthenticated, inquiryData, propertyId, user, router, refetchProperty, tProperty])

  const handleAddToComparison = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error(tProperty('toasts.loginRequired'))
      router.push(`/auth/login?redirect=/listings/${propertyId}`)
      return
    }

    if (!property) return

    try {
      await listingsApi.addToComparison(propertyId)
      addToComparison(property)
      toast.success(tProperty('toasts.addedToComparison'))
    } catch (error: any) {
      toast.error(error.response?.data?.error || tProperty('toasts.comparisonFailed'))
    }
  }, [isAuthenticated, propertyId, property, router, addToComparison, tProperty])

  const handlePrint = useCallback(() => {
    window.print()
    toast.success(tProperty('toasts.printDialog'))
  }, [tProperty])

  const handleDownloadDetails = useCallback(() => {
    toast.success(tProperty('toasts.downloading'))
    // Implement PDF generation/download logic here
  }, [tProperty])

  const handlePromotionActivated = useCallback(() => {
    refetchProperty()
    toast.success(tProperty('toasts.promotionActivated'))
  }, [refetchProperty, tProperty])

  const handleCancelPromotion = useCallback(async () => {
    if (!property || !property.is_promoted) return

    setIsCancellingPromotion(true)
    try {
      await listingsApi.cancelPromotion(propertyId)
      toast.success(tProperty('toasts.promotionCancelled'))
      refetchProperty()
    } catch (error: any) {
      toast.error(error.response?.data?.error || tProperty('toasts.promotionCancelFailed'))
    } finally {
      setIsCancellingPromotion(false)
    }
  }, [property, propertyId, refetchProperty, tProperty])

  const getPropertyTitle = useCallback(() => {
    if (locale === 'am' && property?.title_amharic) {
      return property.title_amharic;
    }
    return property?.title || '';
  }, [locale, property?.title, property?.title_amharic]);

  // Derived values
  const isOwner = user?.id === property?.owner?.id
  const canEdit = isOwner
  const hasActivePromotion = property?.is_promoted && property?.promotion_status === 'active'
  const promotionTier = property?.promotion_tier || 'basic'
  const promotionEndDate = property?.promotion_end

  // Loading State
  if (isLoadingProperty) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header />
        <div className="container py-12">
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner className="h-16 w-16 text-primary" />
            <p className="mt-6 text-lg text-muted-foreground">{tProperty('loading.propertyDetails')}</p>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (propertyError || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Header />
        <div className="container py-12">
          <div className="max-w-md mx-auto text-center py-20">
            <Home className="mx-auto h-20 w-20 text-muted-foreground/50" />
            <h1 className="mt-6 text-3xl font-bold">{tProperty('errors.propertyNotFound')}</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {tProperty('errors.propertyNotFoundDesc')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push('/listings')}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg px-8 py-6 text-lg"
              >
                <ArrowLeft className="mr-3 h-5 w-5" />
                {tProperty('buttons.browseProperties')}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="px-8 py-6 text-lg border-2"
              >
                {tProperty('buttons.goBack')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />

      <div className="container py-8 px-4">
        {/* Breadcrumb Navigation - FIXED translation key */}
        <nav className="mb-8 flex flex-wrap items-center gap-3 text-sm bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/listings')}
            className="h-10 px-4 text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tProperty('buttons.backToListings')}
          </Button>
          <span className="text-muted-foreground">/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/listings?city=${property.city?.id}`)}
            className="h-10 px-4 text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-xl"
          >
            {property.city?.name}
          </Button>
          <span className="text-muted-foreground">/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/listings?sub_city=${property.sub_city?.id}`)}
            className="h-10 px-4 text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-xl"
          >
            {property.sub_city?.name}
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 text-primary rounded-xl text-sm font-bold truncate max-w-[250px] border border-primary/20">
            {property.title}
          </span>
        </nav>

        {/* Property Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <Badge className="capitalize px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20">
                  {property.property_type.replace('_', ' ')}
                </Badge>
                <Badge className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-blue-500/5 text-blue-500 border border-blue-500/20">
                  {property.listing_type === 'for_sale' ? t('forSale') : t('forRent')}
                </Badge>
                <Badge className="capitalize px-4 py-2 bg-gradient-to-r from-purple-500/10 to-purple-500/5 text-purple-500 border border-purple-500/20">
                  {property.furnishing_type.replace('_', ' ')}
                </Badge>
                {property.is_featured && (
                  <Badge className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg gap-2">
                    <Star className="h-3.5 w-3.5" />
                    {tListings('featuredLabel')}
                  </Badge>
                )}
                {property.is_verified && (
                  <Badge className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg gap-2">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {t('verified')}
                  </Badge>
                )}
                <PromotionStatusBadge
                  tier={promotionTier}
                  isPromoted={hasActivePromotion}
                  endDate={promotionEndDate}
                  status={property.promotion_status}
                  t={tProperty}
                />
              </div>

              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {getPropertyTitle()}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2.5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-4 py-2.5 rounded-xl">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="truncate max-w-[300px] font-medium">
                    {property.specific_location}, {property.sub_city?.name}, {property.city?.name}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2.5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-4 py-2.5 rounded-xl">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{t('listed')} {formatTimeAgo(property.listed_date)}</span>
                </div>
                <div className="flex items-center gap-2.5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-4 py-2.5 rounded-xl">
                  <Eye className="h-5 w-5 text-primary" />
                  <span className="font-bold">{(property.views_count || 0).toLocaleString()} {t('views')}</span>
                </div>
              </div>
            </div>

            {/* EDIT BUTTON - Only show if user can edit */}
            {canEdit && (
              <div className="flex flex-col gap-3 mt-3">
                <Button
                  onClick={() => router.push(`/listings/${propertyId}/edit`)}
                  className="gap-3 px-6 py-6 h-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl"
                  variant={property.approval_status === 'rejected' ? 'destructive' : "default"}
                >
                  <Edit className="h-5 w-5" />
                  {property.approval_status === 'rejected' ? tProperty('buttons.editAndResubmit') : tProperty('buttons.editProperty')}
                </Button>

                {/* Add activate/deactivate button for approved properties */}
                {property.approval_status === 'approved' && (
                  <Button
                    onClick={async () => {
                      try {
                        const newActiveState = !property.is_active
                        await listingsApi.updateProperty(propertyId, { is_active: newActiveState })
                        toast.success(tProperty(`toasts.${newActiveState ? 'listingActivated' : 'listingDeactivated'}`))
                        refetchProperty()
                      } catch (error) {
                        toast.error(tProperty('toasts.activationFailed'))
                      }
                    }}
                    className="gap-3 px-6 py-6 h-auto"
                    variant={property.is_active ? "outline" : "default"}
                  >
                    {property.is_active ? (
                      <>
                        <EyeOff className="h-5 w-5" />
                        {tProperty('buttons.deactivate')}
                      </>
                    ) : (
                      <>
                        <Eye className="h-5 w-5" />
                        {tProperty('buttons.activate')}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Approval Status Alerts */}
        {isOwner && property.approval_status && (
          <div className="mb-8 space-y-4">
            {property.approval_status === 'pending' && (
              <Alert className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 shadow-xl rounded-2xl">
                <Clock className="h-6 w-6 text-amber-500" />
                <AlertTitle className="text-amber-800 dark:text-amber-300 text-xl">{tProperty('approval.pending.title')}</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-400 space-y-2">
                  <p>{tProperty('approval.pending.description')}</p>
                  {property.approval_notes && (
                    <div className="mt-3 p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
                      <strong className="text-amber-800 dark:text-amber-300">{tProperty('approval.pending.adminNotes')}</strong>
                      <p className="mt-1">{property.approval_notes}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {property.approval_status === 'rejected' && (
              <Alert className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-500/20 shadow-xl rounded-2xl">
                <XCircle className="h-6 w-6 text-red-500" />
                <AlertTitle className="text-red-800 dark:text-red-300 text-xl">{tProperty('approval.rejected.title')}</AlertTitle>
                <AlertDescription className="text-red-700 dark:text-red-400 space-y-3">
                  <p>{property.rejection_reason || tProperty('approval.rejected.defaultMessage')}</p>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => router.push(`/listings/${propertyId}/edit`)}
                      className="gap-2 border-red-500/30 hover:border-red-500 hover:bg-red-500/10"
                    >
                      <Edit className="h-4 w-4" />
                      {tProperty('approval.rejected.editAndResubmit')}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {property.approval_status === 'changes_requested' && (
              <Alert className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20 shadow-xl rounded-2xl">
                <AlertCircle className="h-6 w-6 text-blue-500" />
                <AlertTitle className="text-blue-800 dark:text-blue-300 text-xl">{tProperty('approval.changesRequested.title')}</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400 space-y-3">
                  <p>{tProperty('approval.changesRequested.description')}</p>
                  <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                    {property.approval_notes || tProperty('approval.changesRequested.defaultMessage')}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => router.push(`/listings/${propertyId}/edit`)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      {tProperty('approval.changesRequested.makeChanges')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => router.push('/support')}
                      className="gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {tProperty('approval.changesRequested.contactSupport')}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {property.approval_status === 'approved' && !property.is_active && (
              <Alert className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 shadow-xl rounded-2xl">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <AlertTitle className="text-green-800 dark:text-green-300 text-xl">{tProperty('approval.approved.title')}</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400 space-y-3">
                  <p>{tProperty('approval.approved.description')}</p>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={async () => {
                        try {
                          await listingsApi.updateProperty(propertyId, { is_active: true })
                          toast.success(tProperty('toasts.listingActivated'))
                          refetchProperty()
                        } catch (error) {
                          toast.error(tProperty('toasts.activationFailed'))
                        }
                      }}
                      className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                    >
                      <Check className="h-4 w-4" />
                      {tProperty('approval.approved.activateListing')}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Gallery Section */}
            <section>
              <PropertyGallery
                images={property.images || []}
                propertyTitle={property.title}
                propertyVideo={property.property_video}
                t={tProperty}
              />
            </section>

            {/* Quick Stats Section */}
            {propertyStats && (
              <section>
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  {tProperty('sections.propertyFeatures')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {propertyStats.basicFeatures.map((feature, index) => (
                    <div key={index} className="flex flex-col items-center justify-center rounded-2xl border-2 bg-gradient-to-b from-card to-card/50 p-6 text-center transition-all hover:border-primary hover:shadow-2xl hover:-translate-y-1">
                      <feature.icon className="h-8 w-8 text-primary mb-3" />
                      <div className="font-bold text-lg">{feature.label}</div>
                      {feature.value && (
                        <div className="text-sm text-muted-foreground mt-2">
                          {feature.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Description Section */}
            <section>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                {tProperty('sections.description')}
              </h2>
              <div className="bg-gradient-to-br from-card to-card/50 border-2 rounded-2xl p-8">
                <p className="whitespace-pre-line text-muted-foreground leading-relaxed text-lg">
                  {property.description}
                </p>
                {property.description_amharic && (
                  <div className="mt-8 pt-8 border-t">
                    <h3 className="font-bold text-xl mb-4">{tProperty('sections.descriptionAmharic')}</h3>
                    <p className="whitespace-pre-line text-muted-foreground leading-relaxed text-lg">
                      {property.description_amharic}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Detailed Tabs Section */}
            <section>
              <Tabs defaultValue="features" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-muted to-muted/50 p-2 rounded-2xl">
                  <TabsTrigger
                    value="features"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-xl gap-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    {tProperty('tabs.features')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="amenities"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-xl gap-2"
                  >
                    <Building2 className="h-5 w-5" />
                    {tProperty('tabs.amenities')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="location"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-xl gap-2"
                  >
                    <Map className="h-5 w-5" />
                    {tProperty('tabs.location')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-xl gap-2"
                  >
                    <FileText className="h-5 w-5" />
                    {tProperty('tabs.documents')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="features" className="mt-8 space-y-6">
                  {propertyStats && propertyStats.amenities.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {propertyStats.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-4 rounded-xl border-2 bg-gradient-to-b from-card to-card/50 p-4 hover:border-primary hover:shadow-xl transition-all">
                          <amenity.icon className="h-6 w-6 text-primary flex-shrink-0" />
                          <span className="font-semibold text-lg">{amenity.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground text-lg">
                      {tProperty('tabs.noFeatures')}
                    </div>
                  )}

                  {property.virtual_tour_url && (
                    <div className="mt-8">
                      <h4 className="font-bold text-xl mb-4">{tProperty('tabs.virtualTour')}</h4>
                      <Button asChild variant="outline" className="gap-3 px-6 py-6 h-auto text-lg border-2 hover:border-primary hover:bg-primary/5">
                        <a
                          href={property.virtual_tour_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-5 w-5" />
                          {tProperty('tabs.view3dTour')}
                        </a>
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="amenities" className="mt-8">
                  {property.amenities && property.amenities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {property.amenities.map((amenity) => (
                        <div key={amenity.id} className="flex items-center gap-4 rounded-2xl border-2 bg-gradient-to-b from-card to-card/50 p-6 hover:shadow-xl transition-all">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-primary/10 to-primary/5">
                            <Globe className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">{amenity.name}</h4>
                            {amenity.name_amharic && (
                              <p className="text-sm text-muted-foreground mt-1">{amenity.name_amharic}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground text-lg">
                      {tProperty('tabs.noAmenities')}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="location" className="mt-8 space-y-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-xl mb-4">{tProperty('tabs.address')}</h4>
                      <div className="rounded-2xl border-2 bg-gradient-to-b from-card to-card/50 p-6 space-y-3">
                        {property.address_line_1 && (
                          <p className="font-bold text-lg">{property.address_line_1}</p>
                        )}
                        {property.address_line_2 && <p className="text-lg">{property.address_line_2}</p>}
                        <p className="text-lg">{property.specific_location}</p>
                        <p className="text-primary font-bold text-xl">
                          {property.sub_city?.name}, {property.city?.name}
                        </p>
                        {property.sub_city?.zip_code && (
                          <p className="text-muted-foreground">{tProperty('tabs.zipCode')}: {property.sub_city.zip_code}</p>
                        )}
                      </div>
                    </div>

                    {/* Interactive Map */}
                    {property.latitude && property.longitude ? (
                      <>
                        <PropertyMap
                          latitude={property.latitude ? Number(property.latitude) : null}
                          longitude={property.longitude ? Number(property.longitude) : null}
                          title={property.title}
                          address={property.specific_location}
                          city={property.city?.name || ''}
                          subCity={property.sub_city?.name || ''}
                          price={property.listing_type === 'for_rent'
                            ? `${formatCurrency(property.monthly_rent || 0)}${t('perMonth')}`
                            : formatCurrency(property.price_etb || 0)}
                          propertyType={property.property_type}
                          className="w-full rounded-2xl overflow-hidden shadow-2xl"
                        />

                        <div className="flex justify-end">
                          <MapModal
                            latitude={property.latitude ? Number(property.latitude) : null}
                            longitude={property.longitude ? Number(property.longitude) : null}
                            title={property.title}
                            address={property.specific_location}
                            city={property.city?.name || ''}
                            subCity={property.sub_city?.name || ''}
                            price={property.listing_type === 'for_rent'
                              ? `${formatCurrency(property.monthly_rent || 0)}${t('perMonth')}`
                              : formatCurrency(property.price_etb || 0)}
                            propertyType={property.property_type}
                            trigger={
                              <Button variant="outline" className="gap-3 px-6 py-6 h-auto text-lg border-2">
                                <Maximize2 className="h-5 w-5" />
                                {tProperty('tabs.fullscreenMap')}
                              </Button>
                            }
                          />
                        </div>
                      </>
                    ) : (
                      <div className="h-96 rounded-2xl border-2 bg-gradient-to-br from-muted/30 to-muted/50 flex flex-col items-center justify-center gap-4 p-8">
                        <MapPin className="h-16 w-16 text-muted-foreground/50" />
                        <div className="text-center">
                          <p className="font-bold text-xl">{tProperty('tabs.locationMap')}</p>
                          <p className="text-muted-foreground mt-2">
                            {tProperty('tabs.noCoordinates')}
                          </p>
                        </div>
                        <p className="text-muted-foreground text-center max-w-md">
                          {tProperty('tabs.privacyMessage')}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="mt-8">
                  {propertyStats && propertyStats.documents.length > 0 ? (
                    <div className="space-y-4">
                      {propertyStats.documents.map((doc, index) => (
                        <Card key={index} className="border-2 shadow-lg">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 p-3">
                                  <doc.icon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg">{doc.label}</h4>
                                  <p className="text-muted-foreground">{tProperty('tabs.availableForVerification')}</p>
                                </div>
                              </div>
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-4 py-2 gap-2">
                                <CheckCircle className="h-4 w-4" />
                                {tProperty('tabs.available')}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-16 w-16 text-muted-foreground/50" />
                      <h4 className="mt-6 font-bold text-xl">{tProperty('tabs.noDocuments')}</h4>
                      <p className="text-muted-foreground mt-2">
                        {tProperty('tabs.contactOwner')}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </section>

            {/* Promotion Section for Owners - Only show if NOT already promoted */}
            {isOwner && (
              <section className="pt-10 border-t">
                {/* Simple check: If property has promotion fields set, it's already promoted */}
                {property?.is_promoted && property?.promotion_tier && property.promotion_tier !== 'basic' && property?.promotion_start ? (
                  // PROPERTY IS ALREADY PROMOTED - Show status
                  <>
                    <ActivePromotionCard
                      property={property}
                      onCancelPromotion={handleCancelPromotion}
                      t={tProperty}
                    />

                    {showAnalytics && (
                      <div className="mt-8">
                        <PromotionAnalytics
                          propertyId={propertyId}
                          tier={property.promotion_tier || 'standard'}
                        />
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full mt-6 py-6 text-lg border-2 hover:border-primary hover:bg-primary/5"
                      onClick={() => setShowAnalytics(!showAnalytics)}
                    >
                      {showAnalytics ? (
                        <>
                          <TrendingDown className="mr-3 h-5 w-5" />
                          {tProperty('promotion.hideAnalytics')}
                        </>
                      ) : (
                        <>
                          <BarChart3 className="mr-3 h-5 w-5" />
                          {tProperty('promotion.viewAnalytics')}
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  // PROPERTY IS NOT PROMOTED - Show promotion options
                  <>
                    <PromotionManager
                      property={property}
                      onPromotionActivated={handlePromotionActivated}
                    />

                    <Button
                      variant="outline"
                      className="w-full mt-6 py-6 text-lg border-2 hover:border-primary hover:bg-primary/5"
                      onClick={() => setShowPromotionBenefits(!showPromotionBenefits)}
                    >
                      {showPromotionBenefits ? (
                        <>
                          <TrendingDown className="mr-3 h-5 w-5" />
                          {tProperty('promotion.hideBenefits')}
                        </>
                      ) : (
                        <>
                          <TrendingUp className="mr-3 h-5 w-5" />
                          {tProperty('promotion.viewBenefits')}
                        </>
                      )}
                    </Button>

                    {showPromotionBenefits && (
                      <div className="mt-6">
                        <PromotionBenefits tier="standard" />
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <PropertySidebar
              property={property}
              user={user}
              isSaved={(property.save_count || 0) > 0}
              isInComparison={isInComparison(property.id)}
              onSave={handleSaveProperty}
              onAddToComparison={handleAddToComparison}
              onContact={handleContact}
              onShare={handleShare}
              onPrint={handlePrint}
              onDownload={handleDownloadDetails}
              onSendInquiry={() => setIsInquiryOpen(true)}
              onSendMessage={() => setIsMessageDialogOpen(true)}
              isOwner={isOwner}
              t={tProperty}
              locale={locale}
            />
          </div>
        </div>

        {/* Similar Properties Section */}
        {!isLoadingSimilar && similarProperties && similarProperties.length > 0 && (
          <section className="mt-20 pt-16 border-t">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold mb-3">{tProperty('sections.similarProperties')}</h2>
                <p className="text-xl text-muted-foreground">
                  {tProperty('sections.similarPropertiesDesc')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => router.push('/listings')}
                className="gap-2 text-lg"
              >
                {tProperty('buttons.viewAll')}
                <ArrowUpRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {similarProperties.slice(0, 3).map((similarProperty) => (
                <PropertyCard
                  key={similarProperty.id}
                  property={similarProperty}
                  showComparisonButton={false}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recommended Properties Section */}
        {recommendedProperties && recommendedProperties.length > 0 && (
          <section className="mt-16 pt-16 border-t">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold mb-3">{tProperty('sections.recommended')}</h2>
                <p className="text-xl text-muted-foreground">
                  {tProperty('sections.recommendedDesc')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => router.push('/listings')}
                className="gap-2 text-lg"
              >
                {tProperty('buttons.browseAll')}
                <ArrowUpRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {recommendedProperties.slice(0, 4).map((recProperty) => (
                <PropertyCard
                  key={recProperty.id}
                  property={recProperty}
                  viewMode="compact"
                />
              ))}
            </div>
          </section>
        )}

        {/* Footer Disclaimer */}
        <div className="mt-20 pt-16 border-t">
          <div className="max-w-3xl mx-auto text-center text-muted-foreground space-y-4">
            <p className="text-lg">
              <strong className="text-foreground">{tProperty('disclaimer.title')}:</strong> {tProperty('disclaimer.message')}
            </p>
            <p className="text-sm">
              {tProperty('disclaimer.propertyId')}: <span className="font-bold text-primary">{property.property_id}</span> • {tProperty('disclaimer.lastUpdated')}: {formatDate(property.updated_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Inquiry Dialog */}
      <InquiryDialog
        isOpen={isInquiryOpen}
        onOpenChange={setIsInquiryOpen}
        onSubmit={handleSubmitInquiry}
        inquiryData={inquiryData}
        onInquiryDataChange={setInquiryData}
        propertyTitle={property.title}
        isLoading={isSendingInquiry}
        propertyId={propertyId}
        propertyOwner={property.owner}
      />

      {/* Message Dialog */}
      {!isOwner && property?.owner && (
        <SimpleMessageDialog
          isOpen={isMessageDialogOpen}
          onOpenChange={setIsMessageDialogOpen}
          receiver={property.owner}
          property={property}
          onSuccess={() => {
            toast.success(tProperty('toasts.messageSent'));
          }}
        />
      )}
    </div>
  )
}