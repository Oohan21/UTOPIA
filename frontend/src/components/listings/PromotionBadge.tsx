// components/properties/PromotionBadge.tsx - UPDATE
import { Badge } from '@/components/ui/Badge'
import { Clock, Star, Crown, TrendingUp } from 'lucide-react'
import { promotionUtils } from '@/lib/utils/promotion'
import { cn } from '@/lib/utils'

interface PromotionBadgeProps {
  tier: string
  endDate?: string
  daysRemaining?: number
  className?: string
  compact?: boolean
}

export default function PromotionBadge({ 
  tier, 
  endDate, 
  daysRemaining, 
  className, 
  compact = false 
}: PromotionBadgeProps) {
  const tierName = promotionUtils.getTierDisplayName(tier)
  const tierColor = promotionUtils.getTierColor(tier)
  
  if (!tier || tier === 'basic') return null

  const getTierIcon = () => {
    switch (tier.toLowerCase()) {
      case 'premium': return <Crown className="h-3 w-3" />
      case 'standard': return <TrendingUp className="h-3 w-3" />
      case 'featured': return <Star className="h-3 w-3" />
      default: return null
    }
  }

  const icon = getTierIcon()

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Badge 
        className="border-0 px-2 py-1 text-white"
        style={{ backgroundColor: tierColor }}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {compact ? tierName.slice(0, 1) + tierName.slice(1, 3) : tierName}
      </Badge>
      
      {(endDate || daysRemaining !== undefined) && !compact && (
        <Badge variant="outline" className="ml-1">
          <Clock className="h-3 w-3 mr-1" />
          {daysRemaining !== undefined 
            ? `${daysRemaining}d left`
            : endDate 
            ? new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : ''}
        </Badge>
      )}
    </div>
  )
}