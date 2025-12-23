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

// Update MarketTrend interface to match Django model
export interface MarketTrend {
  date: string;
  total_listings: number;
  active_listings: number;
  new_listings: number;
  sold_listings: number;
  rented_listings: number;
  average_price: number;
  median_price: number;
  min_price: number;
  max_price: number;
  total_views: number;
  total_inquiries: number;
  average_days_on_market: number;
  price_change_daily: number;
  price_change_weekly: number;
  price_change_monthly: number;
  inventory_months: number;
  absorption_rate: number;
  price_to_rent_ratio: number;
  rental_yield: number;
}

export interface PlatformAnalyticsResponse {
  total_users: number;
  new_users: number;
  active_users: number;
  user_growth_rate: number;
  avg_session_duration: number;
  bounce_rate: number;
  total_page_views: number;
  
  // Error handling properties
  _error?: boolean;
  _errorMessage?: string;
  _fallback?: boolean;
  _timestamp?: string;
  _source?: string;
}

// Update PlatformAnalytics to extend PlatformAnalyticsResponse
export interface PlatformAnalytics extends PlatformAnalyticsResponse {
  date: string;
  total_properties: number;
  verified_properties: number;
  featured_properties: number;
  promoted_properties: number;
  total_inquiries: number;
  successful_contacts: number;
  total_promotions: number;
  total_revenue: number;
  api_response_time: number;
  error_rate: number;
  server_uptime: number;
}

export interface DailyActivity {
  date: string;
  active_users: number;
  new_users: number;
  page_views: number;
  searches: number;
  inquiries: number;
  properties_listed: number;
}

export interface UserGrowth {
  date: string;
  new_users: number;
  active_users: number;
  cumulative_users: number;
  user_type?: string;
}

export interface CityAnalytics {
  id: number;
  name: string;
  property_count: number;
  average_price: number;
  total_views: number;
  total_inquiries: number;
  demand_score: number;
}

export interface PerformanceMetrics {
  api_response_time: number;
  page_load_time: number;
  database_query_time: number;
  cache_hit_rate: number;
  error_rate: number;
  uptime: number;
  _fallback?: boolean;
}

export interface RevenueAnalytics {
  period: string;
  total_revenue: number;
  revenue_by_source: Array<{
    source: string;
    amount: number;
    percentage: number;
  }>;
  growth_rate: number;
  average_transaction: number;
  _fallback?: boolean;
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
  _source?: string; 
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
    active_listings?: number;
    average_bedrooms: number
    average_area: number
    average_price_per_sqm: number
  }
  trends: {
    price_change_30d: number
    price_change_weekly?: number;
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
    price_distribution?: Array<{  // Add alias for backward compatibility
      range: string;
      count: number;
    }>;
  }
  market_health: {
    absorption_rate: number
    price_to_rent_ratio: number
    rental_yield: number
  }
   top_performing_cities?: Array<{
    name: string;
    property_count: number;
    average_price: number;
    total_views: number;
  }>;
  
  property_type_distribution?: Array<{  // Alias for distribution.property_types
    property_type: string;
    count: number;
    avg_price: number;
  }>;
  
  total_listings?: number;  // Alias for summary.total_listings
  active_listings?: number; // Alias for summary.active_listings
  average_price?: number;   // Alias for summary.average_price
  price_change_weekly?: number; // Alias for trends.price_change_weekly
  total_views_today?: number;
  total_inquiries_today?: number;
  new_listings_today?: number;
}