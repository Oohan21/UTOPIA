// components/ui/progress.tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all duration-500 ease-out"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

// Additional Progress variants
const ProgressVariant = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: "default" | "success" | "warning" | "destructive"
    size?: "default" | "sm" | "lg"
  }
>(({ className, value, variant = "default", size = "default", ...props }, ref) => {
  const variantStyles = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    destructive: "bg-red-500"
  }

  const sizeStyles = {
    default: "h-4",
    sm: "h-2",
    lg: "h-6"
  }

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-secondary",
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all duration-500 ease-out",
          variantStyles[variant]
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
ProgressVariant.displayName = "ProgressVariant"

// Animated Progress with gradient
const ProgressAnimated = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-500 ease-out animate-gradient-x"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
ProgressAnimated.displayName = "ProgressAnimated"

// Progress with label
const ProgressWithLabel = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    label?: string
    showValue?: boolean
  }
>(({ className, value, label, showValue = false, ...props }, ref) => (
  <div className="space-y-2">
    {(label || showValue) && (
      <div className="flex justify-between text-sm text-muted-foreground">
        {label && <span>{label}</span>}
        {showValue && <span>{value}%</span>}
      </div>
    )}
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all duration-500 ease-out"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  </div>
))
ProgressWithLabel.displayName = "ProgressWithLabel"

// Circular Progress
const CircularProgress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
    size?: number
    strokeWidth?: number
    variant?: "default" | "success" | "warning" | "destructive"
  }
>(({ className, value = 0, size = 40, strokeWidth = 4, variant = "default", ...props }, ref) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  const variantColors = {
    default: "text-primary",
    success: "text-green-500",
    warning: "text-yellow-500",
    destructive: "text-red-500"
  }

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        className="absolute -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-secondary fill-transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "fill-transparent transition-all duration-500 ease-out",
            variantColors[variant]
          )}
          strokeLinecap="round"
        />
      </svg>
      {value !== undefined && (
        <span className="text-sm font-medium">
          {Math.round(value)}%
        </span>
      )}
    </div>
  )
})
CircularProgress.displayName = "CircularProgress"

// Progress with steps
interface StepProgressProps {
  steps: number
  currentStep: number
  className?: string
}

const StepProgress = React.forwardRef<
  HTMLDivElement,
  StepProgressProps
>(({ steps, currentStep, className, ...props }, ref) => {
  const stepWidth = 100 / (steps - 1)
  
  return (
    <div
      ref={ref}
      className={cn("relative w-full", className)}
      {...props}
    >
      {/* Background line */}
      <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-secondary" />
      
      {/* Progress line */}
      <div
        className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-primary transition-all duration-500 ease-out"
        style={{ width: `${currentStep * stepWidth}%` }}
      />
      
      {/* Steps */}
      <div className="relative flex justify-between">
        {Array.from({ length: steps }).map((_, index) => (
          <div key={index} className="relative flex flex-col items-center">
            <div
              className={cn(
                "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                index <= currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-background border-secondary"
              )}
            >
              {index < currentStep ? (
                <span className="text-xs">✓</span>
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </div>
            {index === currentStep && (
              <div className="absolute -top-8 text-xs font-medium">
                Step {index + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
})
StepProgress.displayName = "StepProgress"

// Progress with custom content
const ProgressCustom = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    children?: React.ReactNode
  }
>(({ className, children, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-6 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all duration-500 ease-out"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
    {children && (
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-primary-foreground">
          {children}
        </span>
      </div>
    )}
  </ProgressPrimitive.Root>
))
ProgressCustom.displayName = "ProgressCustom"

export {
  Progress,
  ProgressVariant,
  ProgressAnimated,
  ProgressWithLabel,
  CircularProgress,
  StepProgress,
  ProgressCustom,
}