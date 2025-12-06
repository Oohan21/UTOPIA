// src/components/properties/ComparisonFloatingButton.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { GitCompare, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useComparison } from '@/lib/hooks/useComparison'
import { ComparisonModal } from './ComparisonModal'

interface ComparisonFloatingButtonProps {
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export const ComparisonFloatingButton: React.FC<ComparisonFloatingButtonProps> = ({
  className,
  position = 'bottom-right'
}) => {
  const { comparisonProperties, hasEnoughProperties } = useComparison()
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }
  
  if (comparisonProperties.length === 0) return null
  
  return (
    <>
      <div className={cn(
        'fixed z-50',
        positionClasses[position],
        className
      )}>
        <Button
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className={cn(
            'rounded-full shadow-lg h-14 w-14 relative',
            hasEnoughProperties 
              ? 'bg-primary hover:bg-primary/90' 
              : 'bg-amber-500 hover:bg-amber-600'
          )}
        >
          <GitCompare className="h-6 w-6" />
          {comparisonProperties.length > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0"
              variant="destructive"
            >
              {comparisonProperties.length}
            </Badge>
          )}
        </Button>
        
        {comparisonProperties.length > 0 && (
          <div className="absolute -top-12 right-0 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border w-64">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Compare Properties</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="h-6 w-6 p-0"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {hasEnoughProperties 
                ? `Ready to compare ${comparisonProperties.length} properties` 
                : `Add ${2 - comparisonProperties.length} more property to compare`}
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="w-full"
              disabled={!hasEnoughProperties}
            >
              Open Comparison
            </Button>
          </div>
        )}
      </div>
      
      <ComparisonModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}