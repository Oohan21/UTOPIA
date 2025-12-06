import { User } from './user'

export interface City {
  id: number
  name: string
  name_amharic: string
  slug: string
  is_capital: boolean
  is_active: boolean
  created_at: string
}

export interface SubCity {
  id: number
  name: string
  name_amharic: string
  city: City
  is_popular: boolean
  zip_code?: string
  average_price_per_sqm?: number
}

export interface Amenity {
  id: number
  name: string
  name_amharic?: string
  amenity_type: string
  icon?: string
}

export interface PropertyImage {
  id: number
  image: string
  is_primary: boolean
  caption?: string
  alt_text?: string
  order: number
  uploaded_at: string
}

export interface Property {
  id: number
  property_id: string
  title: string
  title_amharic?: string
  description: string
  description_amharic?: string
  property_type: string
  listing_type: 'for_sale' | 'for_rent' | 'for_lease' | 'auction'
  property_status: string
  owner: User
  agent?: User
  developer?: User
  city: City
  sub_city: SubCity
  specific_location: string
  latitude?: number
  longitude?: number
  address_line_1?: string
  address_line_2?: string
  bedrooms: number
  bathrooms: number
  total_area: number
  plot_size?: number
  built_year?: number
  floors: number
  furnishing_type: string
  price_etb: number
  price_usd?: number
  price_negotiable: boolean
  monthly_rent?: number
  security_deposit?: number
  maintenance_fee?: number
  property_tax?: number
  amenities: Amenity[]
  images: PropertyImage[]
  has_parking: boolean
  has_garden: boolean
  has_security: boolean
  has_furniture?: boolean
  has_air_conditioning?: boolean
  has_heating: boolean
  has_internet: boolean
  has_generator: boolean
  has_elevator: boolean
  has_swimming_pool: boolean
  has_gym: boolean
  has_conference_room: boolean
  is_pet_friendly: boolean
  is_wheelchair_accessible: boolean
  has_backup_water: boolean
  is_featured: boolean
  is_verified: boolean
  is_active: boolean
  is_premium: boolean
  views_count: number
  inquiry_count: number
  save_count: number
  virtual_tour_url?: string
  video_url?: string
  property_video?: string
  has_title_deed: boolean
  has_construction_permit: boolean
  has_occupancy_certificate: boolean
  created_at: string
  updated_at: string
  listed_date: string
  expiry_date?: string
  price_per_sqm?: number
  days_on_market?: number
  price_display?: string
  key_features?: string[]
  comparison_score?: number
  promotion_tier?: string  
  promotion_duration?: number  
  promotion_price?: number 
  promotion_active?: boolean  
  promotion_start?: string  
  promotion_end?: string
}

export interface PropertyFilters {
  search?: string
  min_price?: number
  max_price?: number
  min_bedrooms?: number
  max_bedrooms?: number
  min_area?: number
  max_area?: number
  listing_type?: string
  property_type?: string
  city?: number
  sub_city?: number
  has_parking?: boolean
  has_garden?: boolean
  has_security?: boolean
  has_air_conditioning?: boolean
  is_featured?: boolean
  has_furniture?: boolean
  is_verified?: boolean
  sort_by?: string
  order?: 'asc' | 'desc'
  page?: number
  page_size?: number
  min_bathrooms?: number
  furnishing_type?: string
  built_year?: number
}

// lib/types/property.ts
export interface PropertyFormData {
  // Basic Information
  title: string
  title_amharic?: string
  description: string
  description_amharic?: string
  property_type: string
  listing_type: 'for_sale' | 'for_rent' | 'for_lease' | 'auction'
  property_status: string

  // Location
  city: number
  sub_city: number
  specific_location: string
  address_line_1?: string
  address_line_2?: string
  latitude?: number
  longitude?: number

  // Specifications
  bedrooms?: number
  bathrooms?: number
  total_area: number
  plot_size?: number
  built_year?: number
  floors?: number
  furnishing_type: string

  // Pricing
  price_etb: number
  price_usd?: number
  price_negotiable: boolean
  monthly_rent?: number
  security_deposit?: number
  maintenance_fee?: number
  property_tax?: number

  // Features
  amenities: number[]
  has_parking: boolean
  has_garden: boolean
  has_security: boolean
  has_furniture: boolean
  has_air_conditioning: boolean
  has_heating: boolean
  has_internet: boolean
  has_generator: boolean
  has_elevator: boolean
  has_swimming_pool: boolean
  has_gym: boolean
  has_conference_room: boolean
  is_pet_friendly: boolean
  is_wheelchair_accessible: boolean
  has_backup_water: boolean

  // Media
  images: File[]
  property_video?: File
  virtual_tour_url?: string
  video_url?: string

  // Documentation
  has_title_deed: boolean
  has_construction_permit: boolean
  has_occupancy_certificate: boolean

  // Additional Files
  documents: File[]

  // Status
  is_premium: boolean
  promotionTier?: string;
  promotionDuration?: number;  // 7, 30, 90 days
  promotionPrice?: number;  // Calculated price
  promotionFeatures?: string[];
}

export interface ApiResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
  total_pages: number
  current_page: number
}

export interface SavedSearch {
  id: number
  name: string
  filters: PropertyFilters
  is_active: boolean
  email_alerts: boolean
  alert_frequency: 'daily' | 'weekly' | 'instant'
  match_count: number
  created_at: string
}

export interface ComparisonSummary {
  count: number
  price_range: {
    min: number
    max: number
    avg: number
  }
  area_range: {
    min: number
    max: number
    avg: number
  }
  bedrooms_range: {
    min: number
    max: number
    avg: number
  }
}

export interface PropertyComparison {
  id: number
  name: string
  properties: Property[]
  comparison_summary: ComparisonSummary
  created_at: string
  updated_at: string
}

export interface ComparisonCriteria {
  target_price?: number
  target_area?: number
  required_features?: string[]
  preferred_locations?: string[]
  price_weight?: number
  area_weight?: number
  features_weight?: number
  location_weight?: number
  condition?: 'excellent' | 'good' | 'average' | 'needs_work'
}