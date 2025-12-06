// src/components/properties/ComparisonButton.tsx
import React from 'react'
import { Button } from '@/components/ui/Button'
import { GitCompare, CheckIcon, PlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useComparison } from '@/lib/hooks/useComparison'
import toast from 'react-hot-toast'

interface ComparisonButtonProps {
  propertyId: number
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

export const ComparisonButton: React.FC<ComparisonButtonProps> = ({
  propertyId,
  className,
  variant = 'outline',
  size = 'sm',
  showLabel = false
}) => {
  const { 
    comparisonProperties, 
    addToComparison, 
    removeFromComparison,
    isLoading,
    canAddMore
  } = useComparison()
  
  const isInComparison = comparisonProperties.some(p => p.id === propertyId)
  
  const handleClick = async () => {
    if (isInComparison) {
      await removeFromComparison(propertyId)
    } else {
      if (!canAddMore) {
        toast.error('Cannot add more than 10 properties to comparison')
        return
      }
      await addToComparison(propertyId)
    }
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'gap-2 transition-all',
        isInComparison && 'bg-primary text-primary-foreground hover:bg-primary/90',
        !canAddMore && !isInComparison && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={!canAddMore && !isInComparison ? 'Maximum 10 properties in comparison' : undefined}
    >
      {isInComparison ? (
        <>
          <CheckIcon className="h-4 w-4" />
          {showLabel && 'In Comparison'}
        </>
      ) : (
        <>
          {canAddMore ? (
            <>
              <PlusIcon className="h-4 w-4" />
              {showLabel && 'Add to Compare'}
            </>
          ) : (
            <>
              <GitCompare className="h-4 w-4" />
              {showLabel && 'Max Reached'}
            </>
          )}
        </>
      )}
    </Button>
  )
}