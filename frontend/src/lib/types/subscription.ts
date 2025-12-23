export interface PropertyPromotionTier {
  id: number;
  name: string;
  tier_type: 'basic' | 'standard' | 'premium';
  description: string;
  price_7: number;
  price_30: number;
  price_60: number;
  price_90?: number;
  features: string[];
  search_position: number;
  badge_color: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  homepage_featured: boolean;
  email_inclusion: boolean;
  social_media_promotion: boolean;
  badge_display: boolean;
  discounted_price?: {
    '7_days': number;
    '30_days': number;
    '90_days'?: number;
  };
}


export interface PropertyPromotion {
  id: number;
  promotion_id: string;
  property: number;
  property_title: string;
  tier: PropertyPromotionTier;
  original_price: number;
  discount_applied: number;
  final_price: number;
  duration_days: number;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'pending' | 'expired' | 'canceled';
  is_active: boolean;
  created_at: string;
}