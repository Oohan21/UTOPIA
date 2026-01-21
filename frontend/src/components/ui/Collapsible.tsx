// components/ui/Collapsible.tsx
import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Collapsible = CollapsiblePrimitive.Root
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

// Enhanced Collapsible with icon
interface EnhancedCollapsibleProps {
  trigger: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  contentClassName?: string
  showIcon?: boolean
  iconPosition?: "left" | "right"
}

const EnhancedCollapsible: React.FC<EnhancedCollapsibleProps> = ({
  trigger,
  children,
  defaultOpen = false,
  className,
  contentClassName,
  showIcon = true,
  iconPosition = "right",
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("w-full", className)}
    >
      <div className="flex items-center justify-between">
        {showIcon && iconPosition === "left" && (
          <ChevronDown
            className={cn(
              "h-4 w-4 mr-2 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        )}
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex-1 text-left",
              showIcon && iconPosition === "right" && "flex items-center justify-between"
            )}
          >
            {trigger}
            {showIcon && iconPosition === "right" && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            )}
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent
        className={cn(
          "overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp",
          contentClassName
        )}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

// Collapsible Card component
const CollapsibleCard: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    title: string
    description?: string
    defaultOpen?: boolean
    icon?: React.ReactNode
    headerClassName?: string
    contentClassName?: string
  }
> = ({
  title,
  description,
  defaultOpen = false,
  icon,
  className,
  headerClassName,
  contentClassName,
  children,
  ...props
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div
      className={cn("rounded-lg border bg-card", className)}
      {...props}
    >
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <button className="w-full">
            <div
              className={cn(
                "flex items-center justify-between p-4 hover:bg-muted/50 transition-colors",
                headerClassName
              )}
            >
              <div className="flex items-center gap-3">
                {icon}
                <div className="text-left">
                  <h3 className="font-medium">{title}</h3>
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={cn(
            "overflow-hidden border-t data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp",
            contentClassName
          )}
        >
          <div className="p-4 pt-3">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// Collapsible section for forms
const CollapsibleSection: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    title: string
    badge?: string | number
    defaultOpen?: boolean
    isOpen?: boolean
    onToggle?: (open: boolean) => void
  }
> = ({
  title,
  badge,
  defaultOpen = false,
  isOpen: controlledOpen,
  onToggle,
  className,
  children,
  ...props
}) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen

  const handleToggle = () => {
    const newState = !isOpen
    if (controlledOpen === undefined) {
      setInternalOpen(newState)
    }
    onToggle?.(newState)
  }

  return (
    <div className={cn("border rounded-lg", className)} {...props}>
      <button
        onClick={handleToggle}
        className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-medium">{title}</h3>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-4 pt-2 border-t">{children}</div>
      </div>
    </div>
  )
}

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  EnhancedCollapsible,
  CollapsibleCard,
  CollapsibleSection,
}