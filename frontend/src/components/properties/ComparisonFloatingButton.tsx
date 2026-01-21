// src/components/properties/ComparisonFloatingButton.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { GitCompare, XIcon, Save } from 'lucide-react' // Add Save icon
import { cn } from '@/lib/utils'
import { useComparison } from '@/lib/hooks/useComparison'
import { ComparisonModal } from './ComparisonModal'
import { useTranslations } from 'next-intl'
import toast from 'react-hot-toast' // Add toast import

interface ComparisonFloatingButtonProps {
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export const ComparisonFloatingButton: React.FC<ComparisonFloatingButtonProps> = ({
  className,
  position = 'bottom-right'
}) => {
  const t = useTranslations('comparisonFloatingButton')
  const { comparisonProperties, hasEnoughProperties, saveComparison } = useComparison()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  
  const positionClasses = {
    'bottom-right': 'bottom-4 sm:bottom-6 right-4 sm:right-6',
    'bottom-left': 'bottom-4 sm:bottom-6 left-4 sm:left-6',
    'top-right': 'top-4 sm:top-6 right-4 sm:right-6',
    'top-left': 'top-4 sm:top-6 left-4 sm:left-6',
  }
  
  if (comparisonProperties.length === 0) return null
  
  const handleSaveClick = async () => {
    const name = prompt(t('savePrompt') || 'Save comparison as:')
    if (name && name.trim()) {
      try {
        await saveComparison(name)
      } catch (error) {
        // Error is already handled in saveComparison
      }
    } else if (name !== null) {
      toast.error('Please enter a name for the comparison', {
        duration: 3000,
        icon: '⚠️',
      })
    }
  }
  
  return (
    <>
      <div className={cn(
        'fixed z-50',
        positionClasses[position],
        className
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      >
        <Button
          onClick={() => setIsModalOpen(true)}
          size="lg"
          className={cn(
            'rounded-full shadow-lg h-12 w-12 sm:h-14 sm:w-14 relative transition-all duration-300',
            hasEnoughProperties 
              ? 'bg-primary hover:bg-primary/90' 
              : 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700'
          )}
        >
          <GitCompare className="h-5 w-5 sm:h-6 sm:w-6" />
          {comparisonProperties.length > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {comparisonProperties.length}
            </Badge>
          )}
        </Button>
        
        {comparisonProperties.length > 0 && isHovering && (
          <div className="absolute -top-32 sm:-top-36 right-0 bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border w-56 sm:w-64 dark:bg-gray-900 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm text-foreground">
                {t('title')}
              </h4>
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
                ? t('ready', { count: comparisonProperties.length }) 
                : t('needMore', { needed: 2 - comparisonProperties.length })}
            </p>
            
            {/* Add Save Button in Tooltip */}
            {hasEnoughProperties && (
              <Button
                onClick={handleSaveClick}
                size="sm"
                variant="outline"
                className="w-full mb-2 border-green-600 text-green-600 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-950"
              >
                <Save className="h-4 w-4 mr-2" />
                {t('saveComparison')}
              </Button>
            )}
            
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              className="w-full"
              disabled={!hasEnoughProperties}
            >
              {t('openComparison')}
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