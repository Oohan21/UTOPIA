// components/ui/Tooltip.tsx
'use client'

import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Tooltip Provider
export const TooltipProvider = TooltipPrimitive.Provider

// Tooltip Root
export const Tooltip = TooltipPrimitive.Root

// Tooltip Trigger
export const TooltipTrigger = TooltipPrimitive.Trigger

// Tooltip Content Variants
const tooltipContentVariants = cva(
  'z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
  {
    variants: {
      variant: {
        default: 'bg-popover text-popover-foreground border-border',
        primary: 'bg-primary text-primary-foreground border-primary/20',
        secondary: 'bg-secondary text-secondary-foreground border-secondary/20',
        destructive: 'bg-destructive text-destructive-foreground border-destructive/20',
        success: 'bg-green-600 text-white border-green-700/20',
        warning: 'bg-amber-500 text-amber-50 border-amber-600/20',
        info: 'bg-blue-500 text-white border-blue-600/20',
        dark: 'bg-gray-900 text-gray-50 border-gray-800/20',
        light: 'bg-white text-gray-900 border-gray-200',
      },
      size: {
        sm: 'text-xs px-2 py-1',
        default: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2',
      },
      arrow: {
        true: '',
        false: '',
      },
      shadow: {
        none: 'shadow-none',
        sm: 'shadow-sm',
        default: 'shadow-md',
        lg: 'shadow-lg',
        xl: 'shadow-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shadow: 'default',
      arrow: true,
    },
  }
)

// Tooltip Arrow
export const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow> & {
    variant?: VariantProps<typeof tooltipContentVariants>['variant']
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <TooltipPrimitive.Arrow
    ref={ref}
    className={cn(
      'fill-current',
      {
        'text-popover': variant === 'default',
        'text-primary': variant === 'primary',
        'text-secondary': variant === 'secondary',
        'text-destructive': variant === 'destructive',
        'text-green-600': variant === 'success',
        'text-amber-500': variant === 'warning',
        'text-blue-500': variant === 'info',
        'text-gray-900': variant === 'dark',
        'text-white': variant === 'light',
      },
      className
    )}
    {...props}
  />
))
TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName

// Tooltip Content
export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    VariantProps<typeof tooltipContentVariants> {
  showArrow?: boolean
  arrowProps?: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
  portalProps?: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Portal>
}

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ 
  className, 
  variant, 
  size, 
  shadow,
  arrow = true,
  showArrow = true,
  arrowProps,
  portalProps,
  sideOffset = 4,
  children,
  ...props 
}, ref) => (
  <TooltipPrimitive.Portal {...portalProps}>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(tooltipContentVariants({ variant, size, shadow, arrow }), className)}
      {...props}
    >
      {children}
      {showArrow && arrow && (
        <TooltipArrow 
          variant={variant}
          width={11}
          height={5}
          className="-mt-px"
          {...arrowProps}
        />
      )}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// Simplified Tooltip Component (All-in-one)
export interface SimpleTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  delayDuration?: number
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerAsChild?: boolean
  disabled?: boolean
  className?: string
  variant?: VariantProps<typeof tooltipContentVariants>['variant']
  size?: VariantProps<typeof tooltipContentVariants>['size']
  shadow?: VariantProps<typeof tooltipContentVariants>['shadow']
  showArrow?: boolean
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
  arrowProps?: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
  portalProps?: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Portal>
}

export const SimpleTooltip = React.forwardRef<
  HTMLDivElement,
  SimpleTooltipProps
>(({
  content,
  children,
  delayDuration = 0,
  defaultOpen = false,
  open,
  onOpenChange,
  triggerAsChild = true,
  disabled = false,
  className,
  variant = 'default',
  size = 'default',
  shadow = 'default',
  showArrow = true,
  side = 'top',
  align = 'center',
  sideOffset = 4,
  alignOffset = 0,
  arrowProps,
  portalProps,
  ...props
}, ref) => {
  if (disabled) {
    return <>{children}</>
  }

  return (
    <Tooltip
      delayDuration={delayDuration}
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
    >
      <TooltipTrigger asChild={triggerAsChild}>
        {children}
      </TooltipTrigger>
      <TooltipContent
        ref={ref}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className={className}
        variant={variant}
        size={size}
        shadow={shadow}
        showArrow={showArrow}
        arrowProps={arrowProps}
        portalProps={portalProps}
        {...props}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  )
})
SimpleTooltip.displayName = 'SimpleTooltip'

// Positioned Tooltip (with custom positioning)
export interface PositionedTooltipProps extends Omit<SimpleTooltipProps, 'ref'> {
  position?: 'top' | 'bottom' | 'left' | 'right'
  offset?: number
}

export const PositionedTooltip = React.forwardRef<
  HTMLDivElement,
  PositionedTooltipProps
>(({
  position = 'top',
  offset = 8,
  ...props
}, ref) => {
  const side = position === 'left' || position === 'right' ? position : position === 'bottom' ? 'bottom' : 'top'
  const align = position === 'left' || position === 'right' ? 'center' : 'center'

  return (
    <SimpleTooltip
      ref={ref}
      side={side}
      align={align}
      sideOffset={offset}
      {...props}
    />
  )
})
PositionedTooltip.displayName = 'PositionedTooltip'

// Icon Tooltip (for buttons with icons)
export interface IconTooltipProps extends Omit<SimpleTooltipProps, 'children'> {
  icon: React.ReactNode
  iconClassName?: string
  buttonProps?: Omit<React.ComponentProps<'button'>, 'ref'>
}

export const IconTooltip = React.forwardRef<
  HTMLButtonElement,
  IconTooltipProps
>(({
  icon,
  iconClassName,
  buttonProps,
  ...props
}, ref) => {
  return (
    <SimpleTooltip {...props}>
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          iconClassName
        )}
        {...buttonProps}
      >
        {icon}
      </button>
    </SimpleTooltip>
  )
})
IconTooltip.displayName = 'IconTooltip'

// Info Tooltip (for form fields and information)
export interface InfoTooltipProps extends Omit<SimpleTooltipProps, 'children' | 'content'> {
  label: string
  description: string
  infoIcon?: React.ReactNode
}

export const InfoTooltip = React.forwardRef<
  HTMLDivElement,
  InfoTooltipProps
>(({
  label,
  description,
  infoIcon,
  variant = 'info',
  side = 'top',
  ...props
}, ref) => {
  return (
    <SimpleTooltip
      ref={ref}
      content={
        <div className="max-w-xs">
          <div className="font-semibold mb-1">{label}</div>
          <div className="text-sm opacity-90">{description}</div>
        </div>
      }
      variant={variant}
      side={side}
      {...props}
    >
      <span className="inline-flex items-center justify-center ml-1 cursor-help">
        {infoIcon || (
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </span>
    </SimpleTooltip>
  )
})
InfoTooltip.displayName = 'InfoTooltip'

// Multi-line Tooltip
export interface MultilineTooltipProps extends Omit<SimpleTooltipProps, 'content'> {
  lines: string[]
  title?: string
  maxWidth?: string
}

export const MultilineTooltip = React.forwardRef<
  HTMLDivElement,
  MultilineTooltipProps
>(({
  lines,
  title,
  maxWidth = '16rem',
  variant = 'default',
  size = 'default',
  children,
  ...props
}, ref) => {
  return (
    <SimpleTooltip
      ref={ref}
      content={
        <div style={{ maxWidth }}>
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className="space-y-1">
            {lines.map((line, index) => (
              <div key={index} className="text-sm leading-tight">
                {line}
              </div>
            ))}
          </div>
        </div>
      }
      variant={variant}
      size={size}
      {...props}
    >
      {children}
    </SimpleTooltip>
  )
})
MultilineTooltip.displayName = 'MultilineTooltip'

// Rich Tooltip (with custom content)
export interface RichTooltipProps extends Omit<SimpleTooltipProps, 'content'> {
  title?: string
  description?: string
  footer?: React.ReactNode
  image?: string
  actions?: React.ReactNode
}

export const RichTooltip = React.forwardRef<
  HTMLDivElement,
  RichTooltipProps
>(({
  title,
  description,
  footer,
  image,
  actions,
  variant = 'default',
  children,
  ...props
}, ref) => {
  return (
    <SimpleTooltip
      ref={ref}
      content={
        <div className="max-w-xs">
          {image && (
            <div className="mb-2 -mx-3 -mt-3">
              <img
                src={image}
                alt=""
                className="w-full h-32 object-cover rounded-t-md"
              />
            </div>
          )}
          {title && <div className="font-semibold mb-1">{title}</div>}
          {description && <div className="text-sm mb-2">{description}</div>}
          {actions && <div className="flex gap-2 mt-3">{actions}</div>}
          {footer && <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">{footer}</div>}
        </div>
      }
      variant={variant}
      size="lg"
      {...props}
    >
      {children}
    </SimpleTooltip>
  )
})
RichTooltip.displayName = 'RichTooltip'

// Usage Examples Component (for documentation)
export const TooltipExamples = () => {
  return (
    <div className="space-y-4 p-4">
      <TooltipProvider>
        <div className="flex flex-wrap gap-4">
          {/* Basic Tooltip */}
          <SimpleTooltip content="This is a basic tooltip">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded">
              Hover me
            </button>
          </SimpleTooltip>

          {/* Variants */}
          <SimpleTooltip 
            content="Primary tooltip" 
            variant="primary"
          >
            <button className="px-4 py-2 bg-primary text-white rounded">
              Primary
            </button>
          </SimpleTooltip>

          <SimpleTooltip 
            content="Destructive action" 
            variant="destructive"
          >
            <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded">
              Delete
            </button>
          </SimpleTooltip>

          {/* Info Tooltip */}
          <div className="flex items-center">
            <label>Email</label>
            <InfoTooltip
              label="Email Address"
              description="We'll use this email to send you important notifications about your account."
            />
          </div>

          {/* Icon Tooltip */}
          <IconTooltip
            icon={<span>ⓘ</span>}
            content="Click for more information"
            variant="info"
          />

          {/* Multiline Tooltip */}
          <MultilineTooltip
            lines={[
              "This is the first line of the tooltip",
              "Second line with more information",
              "Third line with additional details"
            ]}
            title="Detailed Information"
          >
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded">
              Multiline
            </button>
          </MultilineTooltip>

          {/* Rich Tooltip */}
          <RichTooltip
            title="Property Promotion"
            description="Promote your property to get more visibility and reach potential buyers faster."
            actions={
              <>
                <button className="px-3 py-1 text-xs bg-primary text-white rounded">
                  Learn More
                </button>
                <button className="px-3 py-1 text-xs border rounded">
                  Dismiss
                </button>
              </>
            }
          >
            <button className="px-4 py-2 bg-purple-500 text-white rounded">
              Promote
            </button>
          </RichTooltip>
        </div>
      </TooltipProvider>
    </div>
  )
}

// Default export
export default {
  Provider: TooltipProvider,
  Root: Tooltip,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
  Arrow: TooltipArrow,
  Simple: SimpleTooltip,
  Positioned: PositionedTooltip,
  Icon: IconTooltip,
  Info: InfoTooltip,
  Multiline: MultilineTooltip,
  Rich: RichTooltip,
  Examples: TooltipExamples,
}