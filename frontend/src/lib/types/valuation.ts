export interface ValuationRequest {
  city?: number
  sub_city?: number
  property_type: string
  bedrooms: number
  total_area: number
  built_year?: number
  condition: 'excellent' | 'good' | 'average' | 'needs_work'
  has_parking?: boolean
  has_security?: boolean
  has_garden?: boolean
  has_furniture?: boolean
}

export interface ValuationResult {
  estimated_value: number
  value_range: {
    low: number
    high: number
  }
  confidence: 'low' | 'medium' | 'high'
  comparables_count: number
  price_per_sqm: number
  market_trend: string
  trend_strength: number
  valuation_date: string
  note?: string
}

export interface PropertyValuation {
  id: number
  property_id?: number
  user_id?: number
  city_id?: number
  sub_city_id?: number
  property_type: string
  bedrooms: number
  total_area: number
  built_year?: number
  estimated_value_low: number
  estimated_value_mid: number
  estimated_value_high: number
  confidence_level: string
  price_per_sqm: number
  comparables_count: number
  comparables_ids: number[]
  market_trend: string
  trend_strength?: number
  notes?: string
  valuation_date: string
  created_at: string
}