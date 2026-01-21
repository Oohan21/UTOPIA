// src/components/properties/ComparisonButton.tsx
import React from 'react'
import { Button } from '@/components/ui/Button'
import { GitCompare, CheckIcon, PlusIcon, SaveIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useComparison } from '@/lib/hooks/useComparison'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

interface ComparisonButtonProps {
  propertyId: number
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  action?: 'add' | 'save'
}

export const ComparisonButton: React.FC<ComparisonButtonProps> = ({
  propertyId,
  className,
  variant = 'outline',
  size = 'sm',
  action = 'add',
  showLabel = false
}) => {
  const t = useTranslations('comparisonButton')
  const {
    comparisonProperties,
    addToComparison,
    removeFromComparison,
    saveComparison,
    isLoading,
    canAddMore
  } = useComparison()

  const isInComparison = comparisonProperties.some(p => p.id === propertyId)

  const handleClick = async () => {
    if (action === 'save') {
      // Handle save comparison logic
      const name = prompt(t('savePrompt') || 'Enter name for comparison:')
      if (name && name.trim()) {
        try {
          await saveComparison(name)
          // toast.success(t('saved')) - This is already handled in saveComparison
        } catch (error) {
          // Error toast is already handled in saveComparison
        }
      } else if (name !== null) {
        toast.error('Please enter a name for the comparison', {
          duration: 3000,
          icon: '⚠️',
        })
      }
      return
    }

    // Handle add/remove logic
    if (isInComparison) {
      await removeFromComparison(propertyId)
      // toast.success(t('removed')) - This is already handled in removeFromComparison
    } else {
      if (!canAddMore) {
        toast.error(t('maxReached'), {
          duration: 4000,
          icon: '⚠️',
        })
        return
      }
      await addToComparison(propertyId)
      // toast.success(t('added')) - This is already handled in addToComparison
    }
  }

  const getButtonContent = () => {
    if (action === 'save') {
      return (
        <>
          <SaveIcon className="h-4 w-4" />
          {showLabel && t('saveComparison')}
        </>
      )
    }
    
    if (isInComparison) {
      return (
        <>
          <CheckIcon className="h-4 w-4" />
          {showLabel && t('inComparison')}
        </>
      )
    } else {
      return (
        <>
          {canAddMore ? (
            <>
              <PlusIcon className="h-4 w-4" />
              {showLabel && t('addToCompare')}
            </>
          ) : (
            <>
              <GitCompare className="h-4 w-4" />
              {showLabel && t('maxReached')}
            </>
          )}
        </>
      )
    }
  }

  const getButtonProps = () => {
    if (action === 'save') {
      return {
        variant: 'default' as const,
        className: cn(
          'gap-2 transition-all bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800',
          comparisonProperties.length < 2 && 'opacity-50 cursor-not-allowed',
          className
        ),
        disabled: isLoading || comparisonProperties.length < 2,
        title: comparisonProperties.length < 2 ? t('needAtLeastTwo') : undefined
      }
    }

    return {
      variant,
      className: cn(
        'gap-2 transition-all',
        isInComparison && 'bg-primary text-primary-foreground hover:bg-primary/90',
        !canAddMore && !isInComparison && 'opacity-50 cursor-not-allowed',
        className
      ),
      disabled: isLoading,
      title: !canAddMore && !isInComparison ? t('maxReached') : undefined
    }
  }

  const buttonProps = getButtonProps()

  return (
    <Button
      variant={buttonProps.variant}
      size={size}
      onClick={handleClick}
      disabled={buttonProps.disabled}
      className={buttonProps.className}
      title={buttonProps.title}
    >
      {getButtonContent()}
    </Button>
  )
}