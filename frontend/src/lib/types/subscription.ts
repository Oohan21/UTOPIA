// lib/types/subscription.ts - NEW FILE
export interface SubscriptionPlan {
  id: number;
  name: string;
  plan_type: 'free' | 'basic' | 'pro' | 'agent';
  description: string;
  price_etb: number;
  billing_cycle: 'monthly' | 'yearly';
  max_properties: number;
  property_discount: number; // Discount % on property promotions
  priority_support: boolean;
  advanced_analytics: boolean;
  bulk_upload: boolean;
  featured_properties_included: number;
  is_popular: boolean;
  monthly_price: number;
  yearly_price: number;
  yearly_savings: number;
}

export interface PropertyPromotionTier {
  id: number;
  name: string;
  tier_type: 'basic' | 'standard' | 'featured' | 'premium' | 'urgent';
  description: string;
  price_7_days: number;
  price_30_days: number;
  price_90_days?: number;
  features: string[];
  search_priority: number;
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

export interface UserSubscription {
  id: number;
  subscription_id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'expired' | 'trial';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  amount_paid: number;
  is_active: boolean;
  days_remaining: number;
  created_at: string;
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