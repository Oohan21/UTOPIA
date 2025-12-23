// lib/utils/promotion.ts - NEW FILE
export const promotionUtils = {
  // Get tier display name
  getTierDisplayName: (tier: string): string => {
    switch (tier?.toLowerCase()) {
      case 'basic': return 'Basic'
      case 'standard': return 'Standard'
      case 'premium': return 'Premium'
      default: return tier || 'Standard'
    }
  },

  // Get tier color
  getTierColor: (tier: string): string => {
    switch (tier?.toLowerCase()) {
      case 'basic': return '#10B981' // emerald
      case 'standard': return '#3B82F6' // blue
      case 'premium': return '#8B5CF6' // purple
      default: return '#6B7280' // gray
    }
  },

  // Format duration display
  formatDuration: (days: number): string => {
    if (days === 7) return '1 Week'
    if (days === 30) return '1 Month'
    if (days === 60) return '2 Months'
    if (days === 90) return '3 Months'
    return `${days} days`
  },

  // Check if promotion is active
  isPromotionActive: (property: any): boolean => {
    if (!property.is_promoted) return false
    
    const status = property.promotion_status
    const endDate = property.promotion_end
    
    if (status === 'active' && endDate) {
      const now = new Date()
      const end = new Date(endDate)
      return end > now
    }
    
    return status === 'active' || status === 'pending'
  },

  // Get days remaining
  getDaysRemaining: (endDate: string): number | null => {
    if (!endDate) return null
    const now = new Date()
    const end = new Date(endDate)
    const diffInDays = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffInDays > 0 ? diffInDays : 0
  },

  // Get promotion benefits by tier
  getTierBenefits: (tier: string): string[] => {
    switch (tier?.toLowerCase()) {
      case 'basic':
        return [
          'Increased visibility',
          'Standard listing placement',
          'Basic badge display'
        ]
      case 'standard':
        return [
          'Top 20 in search results',
          'Email notifications to interested buyers',
          'Basic analytics dashboard',
          'Promoted badge display',
          '30-day visibility guarantee'
        ]
      case 'premium':
        return [
          'TOP position in search results',
          'Featured on homepage carousel',
          'Priority email notifications',
          'Social media promotion',
          'Advanced analytics',
          'Priority customer support',
          'Featured badge display'
        ]
      default:
        return ['Standard listing visibility']
    }
  },

  // Calculate price for tier and duration (client-side fallback)
  calculatePrice: (tier: any, duration: number): number => {
    if (!tier) return 0
    
    switch(duration) {
      case 7: return tier.price_7 || tier.price_30
      case 30: return tier.price_30
      case 60: return tier.price_60 || tier.price_30 * 2
      case 90: return tier.price_90 || tier.price_30 * 3
      default: return tier.price_30
    }
  }
}