import { User } from './user'
import { Property } from './property'

export interface City {
  id: number
  name: string
  name_amharic: string
  slug: string
  is_capital: boolean
  is_active: boolean
  created_at: string
}

export interface MarketTrend {
  name: string
  value: number
  change: number
  direction: 'up' | 'down' | 'stable'
}

export interface DashboardStats {
  total_properties: number
  total_users: number
  total_inquiries: number
  total_valuations: number
  revenue_month: number
  revenue_growth: number
  property_type_distribution: Record<string, number>
  recent_activities: any[]
  active_properties?: number  
  verified_properties?: number  
  featured_properties?: number  
  active_users?: number  
  agent_count?: number
}

export interface UserDashboard {
  listed_properties: number
  saved_properties: number
  saved_searches: number
  inquiries_sent: number
  profile_completion: number
  recent_properties: Property[]
  recent_inquiries: any[]
  market_insights: Record<string, any>
}

export interface MarketStats {
  summary: {
    average_price: number
    median_price: number
    price_range: {
      min: number
      max: number
    }
    total_listings: number
    average_bedrooms: number
    average_area: number
    average_price_per_sqm: number
  }
  trends: {
    price_change_30d: number
    new_listings_30d: number
    average_days_on_market: number
    inventory_months: number
  }
  distribution: {
    property_types: Array<{
      property_type: string
      count: number
      avg_price: number
    }>
    popular_areas: Array<{
      name: string
      count: number
      avg_price: number
    }>
    price_ranges: Array<{
      range: string
      count: number
    }>
  }
  market_health: {
    absorption_rate: number
    price_to_rent_ratio: number
    rental_yield: number
  }
}