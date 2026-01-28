'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from "@/components/common/Header/Header";
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { PropertyMap } from '@/components/map/PropertyMap'
import { MapModal } from '@/components/map/MapModal'
import { listingsApi } from '@/lib/api/listings'
import { formatCurrency, formatPricePerSqm } from '@/lib/utils/formatCurrency'
import { formatDate, formatTimeAgo } from '@/lib/utils/formatDate'
import {
  Bed, Bath, MapPin, Calendar, Car, TreePine, Shield, Sofa,
  Wind, Wifi, Zap, Building, Dumbbell, Users, Heart, Phone,
  MessageSquare, Star, ChevronLeft, ChevronRight, Clock, CheckCircle,
  FileText, ExternalLink, Globe, Waves, Thermometer, Coffee, Home,
  Percent, TrendingUp, Eye, Mail, Edit, Copy,
  Facebook, Twitter, Printer, Download as DownloadIcon, Play, Video,
  ArrowLeft, Crown, Zap as ZapIcon, BarChart3, Info, Mail as MailIcon,
  AlertCircle, Maximize2, Map, Building2, Check, X, Filter,
  CalendarDays, DollarSign as Dollar, ArrowUpRight, User, MailCheck,
  PhoneCall, MessageCircle, Bookmark, Share, Send, Paperclip, XCircle,
  Sparkles, Award, BadgeCheck, Rocket, TrendingDown, RefreshCw, EyeOff,
  Bell, ShieldAlert, Trash2, Wrench, Satellite, ShieldCheck,
  Refrigerator, Microwave, Flame, Snowflake, Lightbulb, Gamepad,
  GlassWater, Droplet, Sun, Building as BuildingIcon, Briefcase,
  Library, Book, Tv, HelpCircle, Mic, Truck, Trees, Package,
  Droplets, Camera, ChevronDown, ArrowUpDown, Cpu, Calculator,
  XSquare as XSquare2, Square, Linkedin
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { ScrollArea } from '@/components/ui/Scroll-area'
import PropertyCard from '@/components/listings/PropertyCard'
import { useAuthStore } from '@/lib/store/authStore'
import { useComparisonStore } from '@/lib/store/comparisonStore'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/Alert"
import { Property, PropertyImage, PropertyFormData } from '@/lib/types/property'
import { cn } from '@/lib/utils'
import { subscriptionApi } from '@/lib/api/subscriptions'
import { PropertyPromotionTier } from '@/lib/types/subscription';
import { SimpleMessageDialog } from '@/components/properties/SimpleMessageDialog'
import { InquiryDialog } from '@/components/inquiries/InquiryDialog'
import { useTranslations, useLocale } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'

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

// Enhanced amenities categories from create page
const AMENITIES_CATEGORIES = {
  essentials: [
    { id: 1, name: 'Parking', key: 'has_parking', icon: Car, description: 'Dedicated parking space' },
    { id: 2, name: 'Security', key: 'has_security', icon: Shield, description: '24/7 security' },
    { id: 3, name: 'Water Backup', key: 'has_backup_water', icon: Droplets, description: 'Water storage' },
    { id: 4, name: 'Generator', key: 'has_generator', icon: Zap, description: 'Backup power' },
    { id: 5, name: 'Fire Safety', key: 'has_fire_safety', icon: Flame, description: 'Fire extinguishers' },
    { id: 6, name: 'CCTV', key: 'has_cctv', icon: Camera, description: 'Security cameras' },
    { id: 7, name: 'Intercom', key: 'has_intercom', icon: Phone, description: 'Intercom system' },
    { id: 8, name: 'Guard House', key: 'has_guard_house', icon: Home, description: 'Security guard house' },
  ],
  comfort: [
    { id: 9, name: 'Air Conditioning', key: 'has_air_conditioning', icon: Snowflake, description: 'AC units' },
    { id: 10, name: 'Heating', key: 'has_heating', icon: Flame, description: 'Heating system' },
    { id: 11, name: 'Elevator', key: 'has_elevator', icon: ArrowUpDown, description: 'Elevator access' },
    { id: 12, name: 'Furnished', key: 'has_furniture', icon: Sofa, description: 'Fully furnished' },
    { id: 13, name: 'WiFi', key: 'has_internet', icon: Wifi, description: 'High-speed internet' },
    { id: 14, name: 'Satellite TV', key: 'has_satellite_tv', icon: Satellite, description: 'Satellite television' },
    { id: 15, name: 'Central Heating', key: 'has_central_heating', icon: Thermometer, description: 'Central heating' },
    { id: 16, name: 'Central Cooling', key: 'has_central_cooling', icon: Wind, description: 'Central cooling' },
  ],
  appliances: [
    { id: 17, name: 'Refrigerator', key: 'has_refrigerator', icon: Refrigerator, description: 'Refrigerator included' },
    { id: 18, name: 'Washing Machine', key: 'has_washing_machine', icon: RefreshCw, description: 'Washing machine' },
    { id: 19, name: 'Dishwasher', key: 'has_dishwasher', icon: Droplets, description: 'Dishwasher' },
    { id: 20, name: 'Microwave', key: 'has_microwave', icon: Microwave, description: 'Microwave oven' },
    { id: 21, name: 'Oven', key: 'has_oven', icon: Flame, description: 'Electric/gas oven' },
    { id: 22, name: 'Stove', key: 'has_stove', icon: Flame, description: 'Cooking stove' },
    { id: 23, name: 'Coffee Maker', key: 'has_coffee_maker', icon: Coffee, description: 'Coffee machine' },
    { id: 24, name: 'Water Dispenser', key: 'has_water_dispenser', icon: Droplet, description: 'Water dispenser' },
  ],
  lifestyle: [
    { id: 25, name: 'Swimming Pool', key: 'has_swimming_pool', icon: Waves, description: 'Swimming pool' },
    { id: 26, name: 'Gym', key: 'has_gym', icon: Dumbbell, description: 'Fitness center' },
    { id: 27, name: 'Garden', key: 'has_garden', icon: Trees, description: 'Private garden' },
    { id: 28, name: 'Balcony', key: 'has_balcony', icon: Maximize2, description: 'Balcony/terrace' },
    { id: 29, name: 'Pet Friendly', key: 'is_pet_friendly', icon: Heart, description: 'Pets allowed' },
    { id: 30, name: 'Smoking Allowed', key: 'is_smoking_allowed', icon: Flame, description: 'Smoking permitted' },
    { id: 31, name: 'Wheelchair Access', key: 'is_wheelchair_accessible', icon: HelpCircle, description: 'Accessible' },
    { id: 32, name: 'Kids Play Area', key: 'has_play_area', icon: Users, description: 'Children play area' },
  ],
  technology: [
    { id: 33, name: 'Smart Home', key: 'has_smart_home', icon: Cpu, description: 'Smart home system' },
    { id: 34, name: 'Home Theater', key: 'has_home_theater', icon: Tv, description: 'Home theater setup' },
    { id: 35, name: 'Electric Car Charging', key: 'has_car_charging', icon: Zap, description: 'EV charging' },
    { id: 36, name: 'Solar Panels', key: 'has_solar_panels', icon: Sun, description: 'Solar power' },
    { id: 37, name: 'Backup Internet', key: 'has_backup_internet', icon: Wifi, description: 'Redundant internet' },
    { id: 38, name: 'Automated Lighting', key: 'has_automated_lighting', icon: Lightbulb, description: 'Smart lighting' },
    { id: 39, name: 'Security System', key: 'has_security_system', icon: ShieldCheck, description: 'Advanced security' },
    { id: 40, name: 'Voice Control', key: 'has_voice_control', icon: Mic, description: 'Voice assistants' },
  ],
  services: [
    { id: 41, name: 'Cleaning Service', key: 'has_cleaning_service', icon: Trash2, description: 'Regular cleaning' },
    { id: 42, name: 'Maintenance', key: 'has_maintenance', icon: Wrench, description: 'On-call maintenance' },
    { id: 43, name: 'Concierge', key: 'has_concierge', icon: Bell, description: 'Concierge service' },
    { id: 44, name: 'Laundry Service', key: 'has_laundry_service', icon: RefreshCw, description: 'Laundry service' },
    { id: 45, name: 'Room Service', key: 'has_room_service', icon: Truck, description: 'Room service' },
    { id: 46, name: 'Valet Parking', key: 'has_valet_parking', icon: Car, description: 'Valet parking' },
    { id: 47, name: '24/7 Reception', key: 'has_reception', icon: Building, description: '24-hour reception' },
    { id: 48, name: 'Package Handling', key: 'has_package_handling', icon: Package, description: 'Package reception' },
  ],
  community: [
    { id: 49, name: 'Club House', key: 'has_club_house', icon: Home, description: 'Community club house' },
    { id: 50, name: 'Conference Room', key: 'has_conference_room', icon: Users, description: 'Meeting rooms' },
    { id: 51, name: 'Business Center', key: 'has_business_center', icon: Briefcase, description: 'Business facilities' },
    { id: 52, name: 'Library', key: 'has_library', icon: Book, description: 'Library access' },
    { id: 53, name: 'Party Hall', key: 'has_party_hall', icon: GlassWater, description: 'Party/event space' },
    { id: 54, name: 'BBQ Area', key: 'has_bbq_area', icon: Flame, description: 'Barbecue area' },
    { id: 55, name: 'Playground', key: 'has_playground', icon: Gamepad, description: 'Children playground' },
    { id: 56, name: 'Tennis Court', key: 'has_tennis_court', icon: Dumbbell, description: 'Tennis court' },
  ]
}

// Document categories from create page
const DOCUMENTS = [
  { id: 1, name: 'Title Deed', key: 'has_title_deed', description: 'Proof of property ownership' },
  { id: 2, name: 'Construction Permit', key: 'has_construction_permit', description: 'Building approval documents' },
  { id: 3, name: 'Occupancy Certificate', key: 'has_occupancy_certificate', description: 'Certificate for habitation' },
  { id: 4, name: 'Tax Clearance', key: 'has_tax_clearance', description: 'Property tax clearance' },
  { id: 5, name: 'Land Certificate', key: 'has_land_certificate', description: 'Land ownership certificate' },
  { id: 6, name: 'Building Plans', key: 'has_building_plans', description: 'Architectural plans' },
  { id: 7, name: 'Insurance', key: 'has_insurance', description: 'Property insurance' },
  { id: 8, name: 'Utility Bills', key: 'has_utility_bills', description: 'Recent utility bills' },
]

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
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {images.length} {t('gallery.photos')} {hasVideo && `• 1 ${t('gallery.video')}`}
        </div>
      </div>

      {/* Main Media Display */}
      <div className="relative aspect-video overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 dark:from-gray-800 dark:to-gray-900 shadow-lg md:shadow-2xl">
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
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 md:p-6 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="text-xs sm:text-sm font-medium bg-black/30 backdrop-blur-sm px-2 sm:px-3 py-1.5 rounded-full w-fit">
                  {images[activeImage]?.caption || `${t('gallery.image')} ${activeImage + 1} ${t('gallery.of')} ${images.length}`}
                </div>
                <div className="text-xs sm:text-sm opacity-90 bg-black/30 backdrop-blur-sm px-2 sm:px-3 py-1.5 rounded-full w-fit">
                  {activeImage + 1} / {images.length}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10">
            <Home className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground/50 dark:text-muted-foreground/30" />
            <p className="mt-2 md:mt-4 text-sm md:text-base text-muted-foreground">{t('gallery.noImages')}</p>
          </div>
        )}

        {/* Video Badge */}
        {hasVideo && (
          <div className="absolute right-2 top-2 md:right-3 md:top-3 z-10">
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 backdrop-blur-sm text-white border-0 shadow-lg px-2 md:px-4 py-1 md:py-2 gap-1 md:gap-2 text-xs md:text-sm">
              <Video className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">{t('gallery.videoTour')}</span>
              <span className="sm:hidden">Video</span>
            </Badge>
          </div>
        )}

        {/* Navigation Controls */}
        {images?.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 md:left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white shadow-lg md:shadow-2xl transition-all duration-300 hover:scale-110 h-8 w-8 md:h-10 md:w-10"
              onClick={handlePreviousImage}
            >
              <ChevronLeft className="h-4 w-4 md:h-6 md:w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 md:right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white shadow-lg md:shadow-2xl transition-all duration-300 hover:scale-110 h-8 w-8 md:h-10 md:w-10"
              onClick={handleNextImage}
            >
              <ChevronRight className="h-4 w-4 md:h-6 md:w-6" />
            </Button>
          </>
        )}

        {/* Action Buttons */}
        <div className="absolute right-2 top-2 md:right-3 md:top-3 flex flex-col gap-1 md:gap-2">
          {hasVideo && (
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white shadow-lg border-0 gap-1 md:gap-2 px-2 md:px-4 text-xs md:text-sm h-8 md:h-auto"
              onClick={() => setIsVideoModalOpen(true)}
            >
              <Play className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden md:inline">{t('gallery.playVideo')}</span>
              <span className="md:hidden">Play</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white shadow-lg border-0 h-8 w-8 md:h-10 md:w-10"
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>

      {/* Thumbnails - Grid View Only */}
      {images?.length > 1 && (
        <ScrollArea className="pb-2">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 md:gap-3">
            {images.map((image, index) => {
              const imageUrl = getImageUrl(image)
              return (
                <button
                  key={image.id}
                  onClick={() => handleThumbnailClick(index)}
                  className={cn(
                    "relative overflow-hidden aspect-square rounded-lg md:rounded-xl transition-all duration-300",
                    activeImage === index
                      ? 'ring-2 md:ring-3 ring-primary ring-offset-1 md:ring-offset-2 shadow-lg md:shadow-xl scale-105'
                      : 'opacity-80 hover:opacity-100 hover:ring-1 md:hover:ring-2 hover:ring-primary/50 hover:scale-105'
                  )}
                >
                  <div className="h-full w-full overflow-hidden bg-muted/30">
                    <img
                      src={imageUrl}
                      alt={`${propertyTitle} - ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {index === 0 && (
                    <div className="absolute top-1 left-1 md:top-2 md:left-2 rounded-full bg-primary px-1.5 md:px-3 py-0.5 md:py-1 text-xs font-bold text-white shadow-lg">
                      <span className="hidden sm:inline">{t('gallery.cover')}</span>
                      <span className="sm:hidden">C</span>
                    </div>
                  )}
                </button>
              )
            })}
            {hasVideo && (
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="relative overflow-hidden border border-dashed md:border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 group aspect-square rounded-lg md:rounded-xl"
              >
                <div className="flex flex-col items-center justify-center gap-1 md:gap-2 h-full w-full">
                  <Video className="h-6 w-6 md:h-10 md:w-10 text-primary/50 group-hover:text-primary transition-colors" />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    <span className="hidden sm:inline">{t('gallery.videoTour')}</span>
                    <span className="sm:hidden">Video</span>
                  </span>
                </div>
              </button>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && hasImages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 md:p-4">
          <div className="relative h-full w-full max-w-7xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 md:right-4 md:top-4 z-10 rounded-full bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all h-8 w-8 md:h-10 md:w-10"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all h-8 w-8 md:h-10 md:w-10"
                  onClick={handlePreviousImage}
                >
                  <ChevronLeft className="h-4 w-4 md:h-8 md:w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:scale-110 transition-all h-8 w-8 md:h-10 md:w-10"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-4 w-4 md:h-8 md:w-8" />
                </Button>
              </>
            )}

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-2 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium">
              {activeImage + 1} / {images.length}
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {propertyVideo && (
        <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-4xl bg-background dark:bg-gray-900 border-0 shadow-2xl mx-2 md:mx-auto">
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl">
                <Video className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                {t('gallery.propertyVideoTour')}
              </DialogTitle>
              <DialogDescription className="text-sm md:text-lg dark:text-gray-400">
                {t('gallery.immersiveVideoTour')} {propertyTitle}
              </DialogDescription>
            </DialogHeader>
            <div className="relative aspect-video rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-br from-muted/30 to-muted/50 dark:from-gray-800 dark:to-gray-900">
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
            <DialogFooter className="flex-col sm:flex-row gap-2 md:gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = propertyVideo
                  link.download = `${propertyTitle.replace(/\s+/g, '_')}_video.mp4`
                  link.click()
                }}
                className="w-full sm:w-auto gap-1 md:gap-2 text-sm md:text-base"
              >
                <DownloadIcon className="h-3 w-3 md:h-4 md:w-4" />
                {t('gallery.downloadVideo')}
              </Button>
              <Button
                onClick={() => setIsVideoModalOpen(false)}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-sm md:text-base"
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

// Property Sidebar Component
// Property Sidebar Component - Updated with better promotion detection
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
  locale,
  onPromote
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
  onPromote: () => void
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

  // Check if property is already promoted - using multiple possible indicators
  const isPropertyPromoted = () => {
    // Check for explicit promotion fields
    if ((property as any).is_promoted === true) return true;
    if ((property as any).promotion_tier && (property as any).promotion_tier !== 'basic') return true;
    if ((property as any).promotion_status === 'active') return true;

    // Check for featured badge (which might indicate promotion)
    if (property.is_featured === true) return true;

    // Check for premium badges or indicators
    const hasPremiumBadge = property.is_premium === true;

    return hasPremiumBadge;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Pricing Card */}
      <Card className="border-0 shadow-lg md:shadow-2xl overflow-hidden dark:border-gray-800">
        <CardContent className="p-4 md:p-6">
          <div className="mb-4 md:mb-6 text-center">
            <div className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {priceDisplay}
            </div>
            {property.price_per_sqm && (
              <div className="mt-1 md:mt-2 text-xs md:text-sm text-muted-foreground">
                {formatPricePerSqm(property.price_per_sqm)}
              </div>
            )}
            {property.price_negotiable && (
              <Badge className="mt-2 md:mt-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-2 md:px-4 py-1 md:py-1.5 gap-1 md:gap-2 text-xs md:text-sm">
                <Percent className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" />
                {t('priceNegotiable')}
              </Badge>
            )}
          </div>

          <div className="space-y-2 md:space-y-3">
            {contactMethods.map((method) => (
              <Button
                key={method.method}
                className={`w-full h-10 md:h-12 ${method.color} text-sm md:text-base`}
                onClick={() => onContact(method.method)}
                disabled={!method.available}
              >
                <method.icon className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                {method.available ? method.label : t('actions.contactUnavailable')}
              </Button>
            ))}

            <Button
              variant="outline"
              className="w-full h-10 md:h-12 border md:border-2 hover:border-primary hover:bg-primary/5 text-sm md:text-base dark:border-gray-700 dark:hover:border-primary"
              onClick={onSendInquiry}
            >
              <MailCheck className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
              {t('actions.sendDetailedInquiry')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Owner Card */}
      <Card className="border-0 shadow-lg md:shadow-xl dark:border-gray-800">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg flex items-center gap-1 md:gap-2">
            <div className="p-1.5 md:p-2 rounded-full bg-primary/10 dark:bg-primary/20">
              <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            {t('contactInformation')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {/* Owner Info */}
            <div className="flex items-center gap-2 md:gap-3 rounded-lg md:rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 p-3 md:p-4 border dark:border-gray-800">
              <div className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80 text-white font-bold text-base md:text-lg">
                {property.owner?.first_name?.[0]}{property.owner?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base md:text-lg truncate">
                  {property.owner?.first_name} {property.owner?.last_name}
                </h4>
                <p className="text-xs md:text-sm text-muted-foreground capitalize truncate dark:text-gray-400">
                  {property.owner?.user_type?.replace('_', ' ') || t('propertyOwner')}
                </p>
                {property.owner?.is_verified && (
                  <Badge className="mt-1 md:mt-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 text-xs px-2 md:px-3 py-0.5 md:py-1">
                    <BadgeCheck className="h-2 w-2 md:h-3 md:w-3 mr-0.5 md:mr-1" />
                    {t('verifiedSeller')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-2 md:space-y-3 rounded-lg border bg-card dark:bg-gray-900 p-3 md:p-4 dark:border-gray-800">
              <h5 className="font-semibold text-xs md:text-sm text-muted-foreground dark:text-gray-400">{t('contactDetails')}</h5>
              {property.owner?.phone_number && (
                <div className="flex items-center justify-between py-1 md:py-2 border-b dark:border-gray-800">
                  <span className="text-muted-foreground dark:text-gray-400 text-xs md:text-sm">{t('phone')}:</span>
                  <span className="font-medium text-primary text-xs md:text-sm truncate ml-2">{property.owner.phone_number}</span>
                </div>
              )}
              {property.owner?.email && (
                <div className="flex items-center justify-between py-1 md:py-2">
                  <span className="text-muted-foreground dark:text-gray-400 text-xs md:text-sm">{t('email')}:</span>
                  <span className="font-medium truncate max-w-[120px] md:max-w-[150px] text-primary text-xs md:text-sm ml-2">{property.owner.email}</span>
                </div>
              )}
            </div>

            {/* Member Since */}
            <div className="rounded-lg border bg-card dark:bg-gray-900 p-3 md:p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 md:gap-2">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground dark:text-gray-400" />
                  <span className="text-xs md:text-sm text-muted-foreground dark:text-gray-400">{t('memberSince')}</span>
                </div>
                <span className="font-semibold text-xs md:text-sm">{formatDate(property.owner?.created_at || '')}</span>
              </div>
            </div>

            {/* Response time indicator */}
            <div className="rounded-lg border bg-card dark:bg-gray-900 p-3 md:p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 md:gap-2">
                  <Clock className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                  <span className="text-xs md:text-sm text-muted-foreground dark:text-gray-400">Response Time</span>
                </div>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                  <Clock className="h-2 w-2 mr-1" />
                  Within 24 hours
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!isOwner && (
        <Card className="border-0 shadow-lg md:shadow-xl dark:border-gray-800">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-base md:text-lg">{t('saveAndShare')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3">
            <Button
              variant="outline"
              className="w-full h-9 md:h-11 justify-start border md:border-2 hover:border-primary hover:bg-primary/5 text-xs md:text-sm dark:border-gray-700 dark:hover:border-primary"
              onClick={onSave}
            >
              <Heart className={`mr-2 md:mr-3 h-3 w-3 md:h-5 md:w-5 ${isSaved ? 'fill-red-500 text-red-500 animate-pulse' : ''}`} />
              {isSaved ? t('savedToFavorites') : t('saveProperty')}
            </Button>

            <Button
              variant="outline"
              className="w-full h-9 md:h-11 justify-start border md:border-2 hover:border-primary hover:bg-primary/5 text-xs md:text-sm dark:border-gray-700 dark:hover:border-primary"
              onClick={onAddToComparison}
              disabled={isInComparison}
            >
              <ExternalLink className="mr-2 md:mr-3 h-3 w-3 md:h-5 md:w-5" />
              {isInComparison ? t('inComparison') : t('addToComparison')}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-9 md:h-11 justify-start border md:border-2 hover:border-primary hover:bg-primary/5 text-xs md:text-sm dark:border-gray-700 dark:hover:border-primary">
                  <Share className="mr-2 md:mr-3 h-3 w-3 md:h-5 md:w-5" />
                  {t('shareProperty')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 md:w-56 border-0 shadow-xl md:shadow-2xl dark:border-gray-800 dark:bg-gray-900">
                <DropdownMenuItem onClick={() => onShare('facebook')} className="gap-1 md:gap-2 cursor-pointer text-xs md:text-sm">
                  <Facebook className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                  Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare('twitter')} className="gap-1 md:gap-2 cursor-pointer text-xs md:text-sm">
                  <Twitter className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
                  Twitter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare()} className="gap-1 md:gap-2 cursor-pointer text-xs md:text-sm">
                  <Copy className="h-3 w-3 md:h-4 md:w-4" />
                  {t('copyLink')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="dark:bg-gray-800" />
                <DropdownMenuItem onClick={onPrint} className="gap-1 md:gap-2 cursor-pointer text-xs md:text-sm">
                  <Printer className="h-3 w-3 md:h-4 md:w-4" />
                  {t('printDetails')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDownload} className="gap-1 md:gap-2 cursor-pointer text-xs md:text-sm">
                  <DownloadIcon className="h-3 w-3 md:h-4 md:w-4" />
                  {t('downloadPDF')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="dark:bg-gray-800" />
                <DropdownMenuItem onClick={() => onShare('whatsapp')} className="gap-1 md:gap-2 cursor-pointer text-xs md:text-sm">
                  <WhatsappIcon className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare('linkedin')} className="gap-1 md:gap-2 cursor-pointer text-xs md:text-sm">
                  <Linkedin className="h-3 w-3 md:h-4 md:w-4 text-blue-700" />
                  LinkedIn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      )}

      {/* Property Stats */}
      <Card className="border-0 shadow-lg md:shadow-xl dark:border-gray-800">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg">{t('propertyStats')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center py-1 md:py-2 border-b dark:border-gray-800">
              <span className="text-muted-foreground dark:text-gray-400 text-xs md:text-sm">{t('propertyID')}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-mono font-bold text-primary bg-primary/10 dark:bg-primary/20 px-2 md:px-3 py-0.5 md:py-1 rounded text-xs md:text-sm cursor-help">
                      {property.property_id}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Use this ID when contacting support</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex justify-between py-1 md:py-2 border-b dark:border-gray-800">
              <span className="text-muted-foreground dark:text-gray-400 text-xs md:text-sm">{t('listed')}</span>
              <div className="text-right">
                <div className="font-semibold text-xs md:text-sm">{formatDate(property.listed_date)}</div>
                <div className="text-xs text-muted-foreground dark:text-gray-500">
                  {formatTimeAgo(property.listed_date)}
                </div>
              </div>
            </div>

            <div className="flex justify-between py-1 md:py-2 border-b dark:border-gray-800">
              <span className="text-muted-foreground dark:text-gray-400 text-xs md:text-sm">Last Updated</span>
              <div className="text-right">
                <div className="font-semibold text-xs md:text-sm">{formatDate(property.updated_at)}</div>
                <div className="text-xs text-muted-foreground dark:text-gray-500">
                  {formatTimeAgo(property.updated_at)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4 py-1 md:py-2">
              <div className="text-center p-1.5 md:p-2 rounded-md md:rounded-lg bg-primary/5 dark:bg-primary/10">
                <div className="flex items-center justify-center gap-0.5 md:gap-1">
                  <Eye className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                  <span className="font-bold text-xs md:text-sm">{(property.views_count || 0).toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground dark:text-gray-500 mt-0.5 md:mt-1">{t('views')}</div>
              </div>

              <div className="text-center p-1.5 md:p-2 rounded-md md:rounded-lg bg-green-500/5 dark:bg-green-500/10">
                <div className="flex items-center justify-center gap-0.5 md:gap-1">
                  <MessageSquare className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                  <span className="font-bold text-xs md:text-sm">{property.inquiry_count || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground dark:text-gray-500 mt-0.5 md:mt-1">{t('inquiries')}</div>
              </div>

              <div className="text-center p-1.5 md:p-2 rounded-md md:rounded-lg bg-purple-500/5 dark:bg-purple-500/10">
                <div className="flex items-center justify-center gap-0.5 md:gap-1">
                  <Bookmark className="h-3 w-3 md:h-4 md:w-4 text-purple-500" />
                  <span className="font-bold text-xs md:text-sm">{property.save_count || 0}</span>
                </div>
                <div className="text-xs text-muted-foreground dark:text-gray-500 mt-0.5 md:mt-1">{t('saved')}</div>
              </div>
            </div>

            {property.price_per_sqm && (
              <div className="flex justify-between items-center py-1 md:py-2 border-b dark:border-gray-800">
                <span className="text-muted-foreground dark:text-gray-400 text-xs md:text-sm">Price per m²</span>
                <span className="font-bold text-primary text-xs md:text-sm">
                  {formatPricePerSqm(property.price_per_sqm)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 md:py-2">
              <span className="text-muted-foreground dark:text-gray-400 text-xs md:text-sm">{t('status')}</span>
              <Badge
                className={`capitalize px-2 md:px-3 py-0.5 md:py-1.5 text-xs md:text-sm ${property.property_status === 'available'
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
        <Alert className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 shadow-lg dark:from-amber-500/5 dark:to-orange-500/5 dark:border-amber-500/10">
          <ShieldAlert className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
          <div className="ml-2">
            <AlertTitle className="text-amber-800 dark:text-amber-300 text-sm md:text-base">{t('safetyTipsTitle')}</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs md:text-sm space-y-0.5 md:space-y-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-start gap-1 md:gap-2 cursor-help">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 md:mt-1.5 flex-shrink-0"></div>
                      <span>{t('safetyTips.meetPublic')}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Meet in public places like cafes or bank offices</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-start gap-1 md:gap-2 cursor-help">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 md:mt-1.5 flex-shrink-0"></div>
                      <span>{t('safetyTips.verifyDocuments')}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Check title deed, ID, and ownership documents</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-start gap-1 md:gap-2 cursor-help">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 md:mt-1.5 flex-shrink-0"></div>
                      <span>{t('safetyTips.neverWire')}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Use secure payment methods with transaction records</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-start gap-1 md:gap-2 cursor-help">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 md:mt-1.5 flex-shrink-0"></div>
                      <span>{t('safetyTips.reportSuspicious')}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Contact our support team immediately</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </AlertDescription>
          </div>
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
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['essentials', 'comfort'])

  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isLoadingPromotionTiers, setIsLoadingPromotionTiers] = useState(false);
  const [promotionTiers, setPromotionTiers] = useState<PropertyPromotionTier[]>([]);

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

  const isOwner = user?.id === property?.owner?.id
  const canEdit = isOwner

  const fetchPromotionTiers = useCallback(async () => {
    setIsLoadingPromotionTiers(true);
    try {
      const tiers = await subscriptionApi.getPromotionTiers();
      setPromotionTiers(Array.isArray(tiers) ? tiers : []);
    } catch (error) {
      console.error('Error fetching promotion tiers:', error);
      toast.error(tProperty('toasts.promotionTiersFailed'));
    } finally {
      setIsLoadingPromotionTiers(false);
    }
  }, [tProperty]);

  useEffect(() => {
    if (property && isOwner && property.is_promoted === false) {
      fetchPromotionTiers();
    }
  }, [property, isOwner, fetchPromotionTiers]);

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

    // Type guard for Property with form data
    type PropertyWithFormData = Property & {
      [key: string]: boolean | undefined;
    };

    const propertyWithFormData = property as PropertyWithFormData;

    const allAmenities = Object.values(AMENITIES_CATEGORIES).flat()
    const amenities = allAmenities
      .filter(amenity => propertyWithFormData[amenity.key] === true)
      .map(amenity => ({
        key: amenity.key,
        icon: amenity.icon,
        label: amenity.name,
        value: true,
        description: amenity.description,
        category: Object.entries(AMENITIES_CATEGORIES).find(([cat, items]) =>
          items.some(item => item.key === amenity.key)
        )?.[0]
      }))

    const documents = DOCUMENTS
      .filter(doc => propertyWithFormData[doc.key] === true)
      .map(doc => ({
        key: doc.key,
        icon: FileText,
        label: doc.name,
        value: true,
        description: doc.description
      }))

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
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
          break
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`
          break
        default:
          break
      }
      if (shareUrl) {
        window.open(shareUrl, '_blank')
      }
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

  const handleSubmitInquiry = useCallback(async (data: any) => {
    setIsSendingInquiry(true)
    try {
      console.log('📤 Preparing inquiry data...')

      // The CreateInquirySerializer expects 'property' field, not 'property_id'
      const requestData = {
        property: propertyId,
        inquiry_type: data.inquiry_type,
        message: data.message,
        contact_preference: data.contact_preference,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || '',
        priority: data.priority || 'medium',
        category: data.category || 'general',
        source: data.source || 'website',
      }

      console.log('📤 Final request data:', JSON.stringify(requestData, null, 2))

      // Use the inquiry API
      const inquiryApi = (await import('@/lib/api/inquiry')).inquiryApi

      // Just await the promise without returning the result
      await inquiryApi.createInquiry(requestData)

      console.log('✅ Inquiry created successfully')

      toast.success(tProperty('toasts.inquirySent'))
      setIsInquiryOpen(false)
      refetchProperty()

    } catch (error: any) {
      console.error('❌ Inquiry creation failed:', error)
      console.error('Error response:', error.response?.data)

      let errorMessage = tProperty('toasts.inquiryFailed')

      // Check for specific validation errors
      if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.'
      } else if (error.response?.data) {
        const errorData = error.response.data

        // Handle field errors
        if (typeof errorData === 'object') {
          const fieldErrors = []

          for (const [field, errors] of Object.entries(errorData)) {
            if (Array.isArray(errors)) {
              fieldErrors.push(`${field}: ${errors.join(', ')}`)
            } else if (field === 'non_field_errors') {
              fieldErrors.push(errors)
            } else {
              fieldErrors.push(`${field}: ${errors}`)
            }
          }

          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('; ')
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      }

      toast.error(errorMessage)
      throw error
    } finally {
      setIsSendingInquiry(false)
    }
  }, [isAuthenticated, propertyId, router, refetchProperty, tProperty])

  const handleDeleteProperty = useCallback(async () => {
    if (!window.confirm(tProperty('deleteConfirmation'))) return;

    try {
      await listingsApi.deleteProperty(propertyId);
      toast.success(tProperty('deleteSuccess'));
      router.push('/account/listings');
    } catch (error: any) {
      toast.error(error.response?.data?.error || tProperty('toasts.deleteFailed') || 'Failed to delete listing');
    }
  }, [propertyId, router, tProperty])

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

  // Function to toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }, [])

  const getPropertyTitle = useCallback(() => {
    if (locale === 'am' && property?.title_amharic) {
      return property.title_amharic;
    }
    return property?.title || '';
  }, [locale, property?.title, property?.title_amharic])

  const handlePromoteProperty = useCallback(async (tierType: 'standard' | 'premium', duration: number = 30) => {
    if (!isAuthenticated) {
      toast.error(tProperty('toasts.loginRequired'));
      router.push(`/auth/login?redirect=/listings/${propertyId}`);
      return;
    }

    if (!property) return;

    try {
      const tier = promotionTiers.find(t => t.tier_type === tierType);
      if (!tier) {
        toast.error(tProperty('toasts.promotionTierNotFound'));
        return;
      }

      const price = calculatePromotionPrice(tier, duration);

      setIsPromotionDialogOpen(false);

      // Show confirmation toast with payment button
      toast.custom((t) => (
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-foreground">{tProperty('promotion.confirm.title')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {tProperty('promotion.confirm.description', {
                  tier: tier.name,
                  days: duration
                })}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">
                  {price.toLocaleString()} ETB
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.dismiss(t.id)}
                    className="border-muted-foreground/20"
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => initiatePromotionPayment(tierType, duration, price)}
                    className="bg-gradient-to-r from-orange-500 to-yellow-500"
                  >
                    {tProperty('promotion.confirm.payNow')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 10000 });
    } catch (error) {
      console.error('Error preparing promotion:', error);
      toast.error(tProperty('toasts.promotionFailed'));
    }
  }, [isAuthenticated, propertyId, property, promotionTiers, router, tProperty, tCommon])

  const calculatePromotionPrice = useCallback((tier: PropertyPromotionTier, duration: number): number => {
    switch (duration) {
      case 7: return tier.price_7 || 0;
      case 30: return tier.price_30 || 0;
      case 60: return tier.price_60 || tier.price_30 * 2 || 0;
      case 90: return tier.price_90 || tier.price_30 * 3 || 0;
      default: return tier.price_30 || 0;
    }
  }, [])

  const initiatePromotionPayment = useCallback(async (tierType: string, duration: number, amount: number) => {
    if (!propertyId) return;

    try {
      const response = await subscriptionApi.initiatePromotionPayment({
        property_id: propertyId,
        tier_type: tierType,
        duration_days: duration,
      });

      if (response.checkout_url) {
        // Store payment data
        localStorage.setItem('last_payment_attempt', JSON.stringify({
          propertyId,
          tierType,
          duration,
          timestamp: new Date().toISOString()
        }));

        // Redirect to payment page
        window.location.href = response.checkout_url;
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast.error(error.response?.data?.error || tProperty('toasts.paymentFailed'));
    }
  }, [propertyId, tProperty])

  // Loading State
  if (isLoadingProperty) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 dark:from-gray-900 dark:to-gray-800/20">
        <Header />
        <div className="container py-6 md:py-12">
          <div className="flex flex-col items-center justify-center py-12 md:py-20">
            <LoadingSpinner className="h-10 w-10 md:h-16 md:w-16 text-primary" />
            <p className="mt-4 md:mt-6 text-base md:text-lg text-muted-foreground dark:text-gray-400">{tProperty('loading.propertyDetails')}</p>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (propertyError || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 dark:from-gray-900 dark:to-gray-800/20">
        <Header />
        <div className="container py-6 md:py-12">
          <div className="max-w-md mx-auto text-center py-12 md:py-20">
            <Home className="mx-auto h-12 w-12 md:h-20 md:w-20 text-muted-foreground/50 dark:text-gray-700" />
            <h1 className="mt-4 md:mt-6 text-2xl md:text-3xl font-bold dark:text-white">{tProperty('errors.propertyNotFound')}</h1>
            <p className="mt-2 md:mt-4 text-base md:text-lg text-muted-foreground dark:text-gray-400">
              {tProperty('errors.propertyNotFoundDesc')}
            </p>
            <div className="mt-6 md:mt-10 flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Button
                onClick={() => router.push('/listings')}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg px-6 md:px-8 py-4 md:py-6 text-base md:text-lg"
              >
                <ArrowLeft className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" />
                {tProperty('buttons.browseProperties')}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="px-6 md:px-8 py-4 md:py-6 text-base md:text-lg border md:border-2 dark:border-gray-700 dark:hover:border-gray-600"
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 dark:from-gray-900 dark:to-gray-800/20">
      <Header />
      <div className="container py-4 md:py-8 px-3 md:px-4">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4 md:mb-8 flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg md:rounded-2xl p-3 md:p-4 shadow-lg dark:shadow-gray-900/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/listings')}
            className="h-8 md:h-10 px-2 md:px-4 text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-lg md:rounded-xl text-xs md:text-sm"
          >
            <ArrowLeft className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            {tProperty('buttons.backToListings')}
          </Button>
          <span className="text-muted-foreground dark:text-gray-500">/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/listings?city=${property.city?.id}`)}
            className="h-8 md:h-10 px-2 md:px-4 text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-lg md:rounded-xl text-xs md:text-sm"
          >
            {property.city?.name}
          </Button>
          <span className="text-muted-foreground dark:text-gray-500">/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/listings?sub_city=${property.sub_city?.id}`)}
            className="h-8 md:h-10 px-2 md:px-4 text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-lg md:rounded-xl text-xs md:text-sm"
          >
            {property.sub_city?.name}
          </Button>
          <span className="text-muted-foreground dark:text-gray-500">/</span>
          <span className="px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 text-primary rounded-lg md:rounded-xl text-xs md:text-sm font-bold truncate max-w-[150px] md:max-w-[250px] border border-primary/20 dark:border-primary/30">
            {property.title}
          </span>
        </nav>

        {/* Property Header with enhanced badges */}
        <div className="mb-6 md:mb-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-5">
                <Badge className="capitalize px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 text-primary border border-primary/20 dark:border-primary/30 text-xs md:text-sm">
                  {property.property_type.replace('_', ' ')}
                </Badge>
                <Badge className="px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/10 text-blue-500 border border-blue-500/20 dark:border-blue-500/30 text-xs md:text-sm">
                  {property.listing_type === 'for_sale' ? t('forSale') : t('forRent')}
                </Badge>
                <Badge className="capitalize px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-purple-500/10 to-purple-500/5 dark:from-purple-500/20 dark:to-purple-500/10 text-purple-500 border border-purple-500/20 dark:border-purple-500/30 text-xs md:text-sm">
                  {property.furnishing_type.replace('_', ' ')}
                </Badge>
                {property.is_featured && (
                  <Badge className="px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg gap-1 md:gap-2 text-xs md:text-sm">
                    <Star className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" />
                    {tListings('featuredLabel')}
                  </Badge>
                )}
                {property.is_verified && (
                  <Badge className="px-2 md:px-4 py-1 md:py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg gap-1 md:gap-2 text-xs md:text-sm">
                    <BadgeCheck className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" />
                    {t('verified')}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 md:mb-5 bg-gradient-to-r from-foreground to-foreground/80 dark:from-white dark:to-white/80 bg-clip-text text-transparent">
                {getPropertyTitle()}
              </h1>

              <div className="flex flex-wrap items-center gap-3 md:gap-6 text-muted-foreground dark:text-gray-400">
                <div className="flex items-center gap-1.5 md:gap-2.5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-2 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm">
                  <MapPin className="h-3 w-3 md:h-5 md:w-5 text-primary" />
                  <span className="truncate max-w-[200px] md:max-w-[300px] font-medium">
                    {property.specific_location}, {property.sub_city?.name}, {property.city?.name}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 md:gap-2.5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-2 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm">
                  <Clock className="h-3 w-3 md:h-5 md:w-5 text-primary" />
                  <span>{t('listed')} {formatTimeAgo(property.listed_date)}</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2.5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-2 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm">
                  <Eye className="h-3 w-3 md:h-5 md:w-5 text-primary" />
                  <span className="font-bold">{(property.views_count || 0).toLocaleString()} {t('views')}</span>
                </div>
                {property.price_per_sqm && (
                  <div className="flex items-center gap-1.5 md:gap-2.5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm px-2 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm">
                    <Calculator className="h-3 w-3 md:h-5 md:w-5 text-primary" />
                    <span className="font-bold">{formatPricePerSqm(property.price_per_sqm)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* EDIT BUTTON - Only show if user can edit */}
            {canEdit && (
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3 mt-2 md:mt-3">
                <Button
                  onClick={() => router.push(`/listings/${propertyId}/edit`)}
                  className="gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-6 h-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-xl text-sm md:text-base"
                  variant={property.approval_status === 'rejected' ? 'destructive' : "default"}
                >
                  <Edit className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">
                    {property.approval_status === 'rejected' ? tProperty('buttons.editAndResubmit') : tProperty('buttons.editProperty')}
                  </span>
                  <span className="sm:hidden">Edit</span>
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
                    className="gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-6 h-auto text-sm md:text-base"
                    variant={property.is_active ? "outline" : "default"}
                  >
                    {property.is_active ? (
                      <>
                        <EyeOff className="h-4 w-4 md:h-5 md:w-5" />
                        <span className="hidden sm:inline">{tProperty('buttons.deactivate')}</span>
                        <span className="sm:hidden">Deactivate</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 md:h-5 md:w-5" />
                        <span className="hidden sm:inline">{tProperty('buttons.activate')}</span>
                        <span className="sm:hidden">Activate</span>
                      </>
                    )}
                  </Button>
                )}

                {/* Promote Property button - only show if not already promoted */}
                {property.approval_status === 'approved' && !property.is_promoted && (
                  <Button
                    onClick={() => router.push(`/listings/${propertyId}/promote`)}
                    className="gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-6 h-auto text-sm md:text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                  >
                    <Rocket className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="hidden sm:inline">{tProperty('buttons.promoteProperty') || 'Promote Property'}</span>
                    <span className="sm:hidden">Promote</span>
                  </Button>
                )}

                <Button
                  onClick={handleDeleteProperty}
                  variant="outline"
                  className="gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-6 h-auto text-sm md:text-base border-red-200 dark:border-red-900/30 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">{tProperty('deleteProperty')}</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Approval Status Alerts */}
        {isOwner && property.approval_status && (
          <div className="mb-4 md:mb-8 space-y-3 md:space-y-4">
            {property.approval_status === 'pending' && (
              <Alert className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 shadow-xl rounded-lg md:rounded-2xl dark:from-amber-500/5 dark:to-orange-500/5 dark:border-amber-500/10">
                <Clock className="h-4 w-4 md:h-6 md:w-6 text-amber-500" />
                <div className="ml-2">
                  <AlertTitle className="text-amber-800 dark:text-amber-300 text-base md:text-xl">{tProperty('approval.pending.title')}</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400 space-y-1 md:space-y-2 text-sm md:text-base">
                    <p>{tProperty('approval.pending.description')}</p>
                    {property.approval_notes && (
                      <div className="mt-1 md:mt-3 p-2 md:p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-lg md:rounded-xl border border-amber-500/20 dark:border-amber-500/10">
                        <strong className="text-amber-800 dark:text-amber-300 text-sm">{tProperty('approval.pending.adminNotes')}</strong>
                        <p className="mt-0.5 md:mt-1 text-xs md:text-sm">{property.approval_notes}</p>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {property.approval_status === 'rejected' && (
              <Alert className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-500/20 shadow-xl rounded-lg md:rounded-2xl dark:from-red-500/5 dark:to-rose-500/5 dark:border-red-500/10">
                <XCircle className="h-4 w-4 md:h-6 md:w-6 text-red-500" />
                <div className="ml-2">
                  <AlertTitle className="text-red-800 dark:text-red-300 text-base md:text-xl">{tProperty('approval.rejected.title')}</AlertTitle>
                  <AlertDescription className="text-red-700 dark:text-red-400 space-y-2 md:space-y-3 text-sm md:text-base">
                    <p>{property.rejection_reason || tProperty('approval.rejected.defaultMessage')}</p>
                    <div className="mt-2 md:mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/listings/${propertyId}/edit`)}
                        className="gap-1 md:gap-2 border-red-500/30 hover:border-red-500 hover:bg-red-500/10 dark:border-red-500/20 dark:hover:border-red-500 text-xs md:text-sm"
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                        {tProperty('approval.rejected.editAndResubmit')}
                      </Button>
                    </div>
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {property.approval_status === 'changes_requested' && (
              <Alert className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20 shadow-xl rounded-lg md:rounded-2xl dark:from-blue-500/5 dark:to-cyan-500/5 dark:border-blue-500/10">
                <AlertCircle className="h-4 w-4 md:h-6 md:w-6 text-blue-500" />
                <div className="ml-2">
                  <AlertTitle className="text-blue-800 dark:text-blue-300 text-base md:text-xl">{tProperty('approval.changesRequested.title')}</AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-400 space-y-2 md:space-y-3 text-sm md:text-base">
                    <p>{tProperty('approval.changesRequested.description')}</p>
                    <div className="p-2 md:p-4 bg-blue-500/5 dark:bg-blue-500/10 rounded-lg md:rounded-xl border border-blue-500/20 dark:border-blue-500/10">
                      {property.approval_notes || tProperty('approval.changesRequested.defaultMessage')}
                    </div>
                    <div className="mt-2 md:mt-4 flex flex-col sm:flex-row gap-2 md:gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/listings/${propertyId}/edit`)}
                        className="gap-1 md:gap-2 text-xs md:text-sm"
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                        {tProperty('approval.changesRequested.makeChanges')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/support')}
                        className="gap-1 md:gap-2 text-xs md:text-sm dark:hover:bg-gray-800"
                      >
                        <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
                        {tProperty('approval.changesRequested.contactSupport')}
                      </Button>
                    </div>
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {property.approval_status === 'approved' && !property.is_active && (
              <Alert className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 shadow-xl rounded-lg md:rounded-2xl dark:from-green-500/5 dark:to-emerald-500/5 dark:border-green-500/10">
                <CheckCircle className="h-4 w-4 md:h-6 md:w-6 text-green-500" />
                <div className="ml-2">
                  <AlertTitle className="text-green-800 dark:text-green-300 text-base md:text-xl">{tProperty('approval.approved.title')}</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-400 space-y-2 md:space-y-3 text-sm md:text-base">
                    <p>{tProperty('approval.approved.description')}</p>
                    <div className="mt-2 md:mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            await listingsApi.updateProperty(propertyId, { is_active: true })
                            toast.success(tProperty('toasts.listingActivated'))
                            refetchProperty()
                          } catch (error) {
                            toast.error(tProperty('toasts.activationFailed'))
                          }
                        }}
                        className="gap-1 md:gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 text-xs md:text-sm"
                      >
                        <Check className="h-3 w-3 md:h-4 md:w-4" />
                        {tProperty('approval.approved.activateListing')}
                      </Button>
                    </div>
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 md:space-y-10">
            {/* Gallery Section with grid view only */}
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
                <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-6 flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 rounded-full bg-primary/10 dark:bg-primary/20">
                    <Building2 className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                  </div>
                  {tProperty('sections.propertyFeatures')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
                  {propertyStats.basicFeatures.map((feature, index) => (
                    <div key={index} className="flex flex-col items-center justify-center rounded-lg md:rounded-2xl border md:border-2 bg-gradient-to-b from-card to-card/50 dark:from-gray-900 dark:to-gray-900/50 p-3 md:p-6 text-center transition-all hover:border-primary hover:shadow-lg md:hover:shadow-2xl hover:-translate-y-0.5 md:hover:-translate-y-1">
                      <feature.icon className="h-5 w-5 md:h-8 md:w-8 text-primary mb-1.5 md:mb-3" />
                      <div className="font-bold text-sm md:text-lg">{feature.label}</div>
                      {feature.value && (
                        <div className="text-xs md:text-sm text-muted-foreground dark:text-gray-400 mt-1 md:mt-2">
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
              <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-6 flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 rounded-full bg-primary/10 dark:bg-primary/20">
                  <FileText className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                </div>
                {tProperty('sections.description')}
              </h2>
              <div className="bg-gradient-to-br from-card to-card/50 dark:from-gray-900 dark:to-gray-900/50 border md:border-2 rounded-lg md:rounded-2xl p-4 md:p-8 dark:border-gray-800">
                <p className="whitespace-pre-line text-muted-foreground dark:text-gray-400 leading-relaxed text-sm md:text-lg">
                  {property.description}
                </p>
                {property.description_amharic && (
                  <div className="mt-4 md:mt-8 pt-4 md:pt-8 border-t dark:border-gray-800">
                    <h3 className="font-bold text-lg md:text-xl mb-2 md:mb-4">{tProperty('sections.descriptionAmharic')}</h3>
                    <p className="whitespace-pre-line text-muted-foreground dark:text-gray-400 leading-relaxed text-sm md:text-lg">
                      {property.description_amharic}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Enhanced Detailed Tabs Section with collapsible categories */}
            <section>
              <Tabs defaultValue="features" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-muted to-muted/50 dark:from-gray-800 dark:to-gray-800/50 p-1 md:p-2 rounded-lg md:rounded-2xl">
                  <TabsTrigger
                    value="features"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg md:rounded-xl gap-1 md:gap-2 text-xs md:text-sm"
                  >
                    <CheckCircle className="h-3 w-3 md:h-5 md:w-5" />
                    <span className="hidden sm:inline">{tProperty('tabs.features')}</span>
                    <span className="sm:hidden">Features</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="amenities"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg md:rounded-xl gap-1 md:gap-2 text-xs md:text-sm"
                  >
                    <Building2 className="h-3 w-3 md:h-5 md:w-5" />
                    <span className="hidden sm:inline">{tProperty('tabs.amenities')}</span>
                    <span className="sm:hidden">Amenities</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="location"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg md:rounded-xl gap-1 md:gap-2 text-xs md:text-sm"
                  >
                    <Map className="h-3 w-3 md:h-5 md:w-5" />
                    <span className="hidden sm:inline">{tProperty('tabs.location')}</span>
                    <span className="sm:hidden">Location</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white rounded-lg md:rounded-xl gap-1 md:gap-2 text-xs md:text-sm"
                  >
                    <FileText className="h-3 w-3 md:h-5 md:w-5" />
                    <span className="hidden sm:inline">{tProperty('tabs.documents')}</span>
                    <span className="sm:hidden">Docs</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="features" className="mt-4 md:mt-8 space-y-6 md:space-y-8">
                  {/* Enhanced Features with categories like create page */}
                  {propertyStats && propertyStats.amenities.length > 0 ? (
                    <div className="space-y-6">
                      {/* Essentials Category */}
                      <Collapsible
                        open={expandedCategories.includes('essentials')}
                        onOpenChange={() => toggleCategory('essentials')}
                        className="space-y-4"
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10">
                              <Shield className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold text-lg text-foreground">Essentials</h3>
                              <p className="text-sm text-muted-foreground">Basic safety and utility features</p>
                            </div>
                          </div>
                          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {propertyStats.amenities
                              .filter(amenity => amenity.category === 'essentials')
                              .map((amenity, index) => (
                                <div
                                  key={index}
                                  className="relative rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-lg border-red-500/20 bg-red-500/5"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-red-500/10">
                                      <amenity.icon className="h-5 w-5 text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">{amenity.label}</div>
                                      <div className="text-xs text-muted-foreground">{amenity.description}</div>
                                    </div>
                                  </div>
                                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                                    <CheckCircle className="h-3 w-3" />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Comfort Category */}
                      <Collapsible
                        open={expandedCategories.includes('comfort')}
                        onOpenChange={() => toggleCategory('comfort')}
                        className="space-y-4"
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <Snowflake className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold text-lg text-foreground">Comfort</h3>
                              <p className="text-sm text-muted-foreground">Climate control and living comforts</p>
                            </div>
                          </div>
                          <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 ui-open:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {propertyStats.amenities
                              .filter(amenity => amenity.category === 'comfort')
                              .map((amenity, index) => (
                                <div
                                  key={index}
                                  className="relative rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-lg border-blue-500/20 bg-blue-500/5"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-500/10">
                                      <amenity.icon className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-foreground">{amenity.label}</div>
                                      <div className="text-xs text-muted-foreground">{amenity.description}</div>
                                    </div>
                                  </div>
                                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                    <CheckCircle className="h-3 w-3" />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  ) : (
                    <div className="text-center py-6 md:py-12 text-muted-foreground dark:text-gray-400 text-base md:text-lg">
                      {tProperty('tabs.noFeatures')}
                    </div>
                  )}

                  {property.virtual_tour_url && (
                    <div className="mt-8">
                      <h4 className="font-bold text-lg md:text-xl mb-4 flex items-center gap-2">
                        <Video className="h-5 w-5 text-primary" />
                        {tProperty('tabs.virtualTour')}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button asChild variant="outline" className="gap-3 px-6 py-6 h-auto text-lg border-2 hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary">
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
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="amenities" className="mt-4 md:mt-8">
                  {property.amenities && property.amenities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                      {property.amenities.map((amenity) => (
                        <div key={amenity.id} className="flex items-center gap-2 md:gap-4 rounded-lg md:rounded-2xl border md:border-2 bg-gradient-to-b from-card to-card/50 dark:from-gray-900 dark:to-gray-900/50 p-3 md:p-6 hover:shadow-lg md:hover:shadow-xl transition-all">
                          <div className="flex h-8 w-8 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
                            <Globe className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm md:text-lg truncate">{amenity.name}</h4>
                            {amenity.name_amharic && (
                              <p className="text-xs md:text-sm text-muted-foreground dark:text-gray-400 mt-0.5 md:mt-1 truncate">{amenity.name_amharic}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 md:py-12 text-muted-foreground dark:text-gray-400 text-base md:text-lg">
                      {tProperty('tabs.noAmenities')}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="location" className="mt-4 md:mt-8 space-y-4 md:space-y-8">
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <h4 className="font-bold text-lg md:text-xl mb-2 md:mb-4">{tProperty('tabs.address')}</h4>
                      <div className="rounded-lg md:rounded-2xl border md:border-2 bg-gradient-to-b from-card to-card/50 dark:from-gray-900 dark:to-gray-900/50 p-3 md:p-6 space-y-2 md:space-y-3 dark:border-gray-800">
                        {property.address_line_1 && (
                          <p className="font-bold text-sm md:text-lg">{property.address_line_1}</p>
                        )}
                        {property.address_line_2 && <p className="text-sm md:text-lg">{property.address_line_2}</p>}
                        <p className="text-sm md:text-lg">{property.specific_location}</p>
                        <p className="text-primary font-bold text-lg md:text-xl">
                          {property.sub_city?.name}, {property.city?.name}
                        </p>
                        {property.sub_city?.zip_code && (
                          <p className="text-muted-foreground dark:text-gray-400 text-sm">{tProperty('tabs.zipCode')}: {property.sub_city.zip_code}</p>
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
                          className="w-full rounded-lg md:rounded-2xl overflow-hidden shadow-lg md:shadow-2xl"
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
                            trigger={(
                              <Button variant="outline" className="gap-2 md:gap-3 px-3 md:px-6 py-3 md:py-6 h-auto text-sm md:text-lg border md:border-2 dark:border-gray-700">
                                <Maximize2 className="h-4 w-4 md:h-5 md:w-5" />
                                <span className="hidden sm:inline">{tProperty('tabs.fullscreenMap')}</span>
                                <span className="sm:hidden">Full Map</span>
                              </Button>
                            )}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="h-64 md:h-96 rounded-lg md:rounded-2xl border md:border-2 bg-gradient-to-br from-muted/30 to-muted/50 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center gap-2 md:gap-4 p-4 md:p-8 dark:border-gray-800">
                        <MapPin className="h-10 w-10 md:h-16 md:w-16 text-muted-foreground/50 dark:text-gray-700" />
                        <div className="text-center">
                          <p className="font-bold text-lg md:text-xl dark:text-white">{tProperty('tabs.locationMap')}</p>
                          <p className="text-muted-foreground dark:text-gray-400 mt-1 md:mt-2 text-sm md:text-base">
                            {tProperty('tabs.noCoordinates')}
                          </p>
                        </div>
                        <p className="text-muted-foreground dark:text-gray-400 text-center max-w-md text-xs md:text-sm">
                          {tProperty('tabs.privacyMessage')}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="mt-4 md:mt-8">
                  {propertyStats && propertyStats.documents.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      {propertyStats.documents.map((doc, index) => (
                        <Card key={index} className="border md:border-2 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                          <CardContent className="p-3 md:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
                              <div className="flex items-center gap-2 md:gap-4">
                                <div className="rounded-lg md:rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-2 md:p-3">
                                  <doc.icon className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm md:text-lg">{doc.label}</h4>
                                  <p className="text-muted-foreground dark:text-gray-400 text-xs md:text-sm">{doc.description}</p>
                                </div>
                              </div>
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-2 md:px-4 py-1 md:py-2 gap-1 md:gap-2 text-xs md:text-sm mt-2 sm:mt-0 w-fit">
                                <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                                {tProperty('tabs.available')}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 md:py-12">
                      <FileText className="mx-auto h-10 w-10 md:h-16 md:w-16 text-muted-foreground/50 dark:text-gray-700" />
                      <h4 className="mt-4 md:mt-6 font-bold text-lg md:text-xl dark:text-white">{tProperty('tabs.noDocuments')}</h4>
                      <p className="text-muted-foreground dark:text-gray-400 mt-1 md:mt-2 text-sm md:text-base">
                        {tProperty('tabs.contactOwner')}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </section>
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
              onPromote={() => setIsPromotionDialogOpen(true)}
            />
          </div>
        </div>

        {/* Similar Properties Section */}
        {!isLoadingSimilar && similarProperties && similarProperties.length > 0 && (
          <section className="mt-10 md:mt-20 pt-8 md:pt-16 border-t dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-10 gap-3 md:gap-0">
              <div>
                <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-3 dark:text-white">{tProperty('sections.similarProperties')}</h2>
                <p className="text-base md:text-xl text-muted-foreground dark:text-gray-400">
                  {tProperty('sections.similarPropertiesDesc')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/listings')}
                className="gap-1 md:gap-2 text-sm md:text-lg w-fit"
              >
                {tProperty('buttons.viewAll')}
                <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
            <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
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
          <section className="mt-8 md:mt-16 pt-8 md:pt-16 border-t dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-10 gap-3 md:gap-0">
              <div>
                <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-3 dark:text-white">{tProperty('sections.recommended')}</h2>
                <p className="text-base md:text-xl text-muted-foreground dark:text-gray-400">
                  {tProperty('sections.recommendedDesc')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/listings')}
                className="gap-1 md:gap-2 text-sm md:text-lg w-fit"
              >
                {tProperty('buttons.browseAll')}
                <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
            <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="mt-10 md:mt-20 pt-8 md:pt-16 border-t dark:border-gray-800">
          <div className="max-w-3xl mx-auto text-center text-muted-foreground dark:text-gray-400 space-y-2 md:space-y-4">
            <p className="text-sm md:text-lg">
              <strong className="text-foreground dark:text-white">{tProperty('disclaimer.title')}:</strong> {tProperty('disclaimer.message')}
            </p>
            <p className="text-xs md:text-sm">
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
        propertyTitle={property.title}
        isLoading={isSendingInquiry}
        propertyId={propertyId}
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

      {/* Promotion Dialog */}
      <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
        <DialogContent className="max-w-md md:max-w-2xl bg-background dark:bg-gray-900 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              {tProperty('promotion.title')}
            </DialogTitle>
            <DialogDescription className="text-lg dark:text-gray-400">
              {tProperty('promotion.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {isLoadingPromotionTiers ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner className="h-8 w-8" />
                <span className="ml-3 dark:text-white">{tProperty('promotion.loading')}</span>
              </div>
            ) : promotionTiers.filter(t => t.tier_type !== 'basic').length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {promotionTiers
                    .filter(tier => tier.tier_type !== 'basic')
                    .map((tier) => (
                      <Card key={tier.id} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                        <CardHeader>
                          <div className="flex items-center gap-3 mb-2">
                            {tier.tier_type === 'standard' ? (
                              <TrendingUp className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Crown className="h-5 w-5 text-purple-500" />
                            )}
                            <CardTitle className="text-xl">{tier.name}</CardTitle>
                          </div>
                          <CardDescription>{tier.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 mb-4">
                            {tier.features && tier.features.slice(0, 3).map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span className="text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteProperty(tier.tier_type as 'standard' | 'premium', 7)}
                              className="text-xs"
                            >
                              7 days
                              <br />
                              {tier.price_7?.toLocaleString()} ETB
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteProperty(tier.tier_type as 'standard' | 'premium', 30)}
                              className="text-xs"
                            >
                              30 days
                              <br />
                              {tier.price_30?.toLocaleString()} ETB
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteProperty(tier.tier_type as 'standard' | 'premium', 60)}
                              className="text-xs"
                            >
                              60 days
                              <br />
                              {tier.price_60?.toLocaleString() || (tier.price_30 ? (tier.price_30 * 2).toLocaleString() : '0')} ETB
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteProperty(tier.tier_type as 'standard' | 'premium', 90)}
                              className="text-xs"
                            >
                              90 days
                              <br />
                              {tier.price_90?.toLocaleString() || (tier.price_30 ? (tier.price_30 * 3).toLocaleString() : '0')} ETB
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                <Alert className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                  <Rocket className="h-5 w-5 text-blue-500" />
                  <AlertTitle className="text-blue-800 dark:text-blue-300">
                    {tProperty('promotion.benefits.title')}
                  </AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-400 space-y-2">
                    <p>🚀 <strong>3-5x more views</strong> than regular listings</p>
                    <p>🎯 <strong>Priority placement</strong> in search results</p>
                    <p>👑 <strong>Featured badge</strong> attracts more clicks</p>
                    <p>⚡ <strong>Faster response</strong> from potential buyers</p>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-bold dark:text-white mb-2">
                  {tProperty('promotion.noTiers.title')}
                </h3>
                <p className="text-muted-foreground">
                  {tProperty('promotion.noTiers.description')}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPromotionDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.open('/help/promotion', '_blank')}
              className="w-full sm:w-auto"
            >
              <Info className="mr-2 h-4 w-4" />
              {tProperty('promotion.learnMore')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}