// components/ui/Radio-group.tsx
import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

// Enhanced RadioCard component for better UI
const RadioCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
  }
>(({ className, value, checked, onCheckedChange, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer flex-col rounded-lg border-2 p-4 transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        checked
          ? "border-primary bg-primary/5"
          : "border-muted bg-card hover:bg-muted/50",
        className
      )}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      {checked && (
        <div className="absolute right-3 top-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
            <Circle className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>
      )}
      {children}
    </div>
  )
})
RadioCard.displayName = "RadioCard"

// RadioGroup with label and description
interface RadioGroupWithLabelProps {
  label?: string
  description?: string
  children: React.ReactNode
  className?: string
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupWithLabel: React.FC<RadioGroupWithLabelProps> = ({
  label,
  description,
  children,
  className,
  value,
  onValueChange,
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="space-y-1">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <RadioGroup value={value} onValueChange={onValueChange}>
        {children}
      </RadioGroup>
    </div>
  )
}

export {
  RadioGroup,
  RadioGroupItem,
  RadioCard,
  RadioGroupWithLabel,
}