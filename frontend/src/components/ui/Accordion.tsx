// components/ui/Accordion.tsx
import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
    <AccordionPrimitive.Item
        ref={ref}
        className={cn("border-b", className)}
        {...props}
    />
))
AccordionItem.displayName = "AccordionPrimitive.Item"

const AccordionTrigger = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
            ref={ref}
            className={cn(
                "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
        ref={ref}
        className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        {...props}
    >
        <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

// Enhanced Accordion components
interface EnhancedAccordionItemProps {
    value: string
    trigger: React.ReactNode
    children: React.ReactNode
    icon?: React.ReactNode
    badge?: string | number
    className?: string
    contentClassName?: string
}

const EnhancedAccordionItem: React.FC<EnhancedAccordionItemProps> = ({
    value,
    trigger,
    children,
    icon,
    badge,
    className,
    contentClassName,
}) => {
    return (
        <AccordionItem value={value} className={cn("border rounded-lg mb-2", className)}>
            <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        {icon}
                        <div className="text-left">
                            {trigger}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {badge && (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                {badge}
                            </span>
                        )}
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className={cn("px-4", contentClassName)}>
                {children}
            </AccordionContent>
        </AccordionItem>
    )
}

// Accordion with plus/minus icons
const PlusMinusAccordionItem: React.FC<
    Omit<EnhancedAccordionItemProps, 'icon'> & {
        variant?: 'plus' | 'chevron'
    }
> = ({
    value,
    trigger,
    children,
    badge,
    className,
    contentClassName,
    variant = 'plus',
}) => {
        return (
            <AccordionItem value={value} className={cn("border rounded-lg mb-2", className)}>
                <AccordionTrigger className="px-4 hover:no-underline group">
                    <div className="flex items-center justify-between w-full">
                        <div className="text-left font-medium">
                            {trigger}
                        </div>
                        <div className="flex items-center gap-2">
                            {badge && (
                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                    {badge}
                                </span>
                            )}
                            {variant === 'plus' ? (
                                <div className="relative h-4 w-4">
                                    <Plus className="h-4 w-4 absolute transition-opacity duration-200 group-data-[state=open]:opacity-0" />
                                    <Minus className="h-4 w-4 absolute transition-opacity duration-200 opacity-0 group-data-[state=open]:opacity-100" />
                                </div>
                            ) : (
                                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            )}
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className={cn("px-4", contentClassName)}>
                    {children}
                </AccordionContent>
            </AccordionItem>
        )
    }

// Accordion for filters
const FilterAccordion: React.FC<{
    items: Array<{
        value: string
        title: string
        count?: number
        content: React.ReactNode
        icon?: React.ReactNode
    }>
    type?: 'single' | 'multiple'
    defaultValue?: string | string[]
    className?: string
    onValueChange?: (value: string) => void
}> = ({ items, type = 'single', defaultValue, className, onValueChange }) => {
    return (
        <Accordion
            type={type as any} 
            defaultValue={defaultValue}
            onValueChange={onValueChange as any}
            className={cn("space-y-2", className)}
        >
            {items.map((item) => (
                <EnhancedAccordionItem
                    key={item.value}
                    value={item.value}
                    trigger={
                        <div className="flex items-center justify-between w-full">
                            <span>{item.title}</span>
                            {item.count !== undefined && (
                                <span className="text-sm text-muted-foreground">
                                    {item.count}
                                </span>
                            )}
                        </div>
                    }
                    icon={item.icon}
                    badge={item.count?.toString()}
                >
                    {item.content}
                </EnhancedAccordionItem>
            ))}
        </Accordion>
    )
}

// FAQ Accordion
const FAQAccordion: React.FC<{
    items: Array<{
        value: string
        question: string
        answer: string | React.ReactNode
    }>
    className?: string
}> = ({ items, className }) => {
    return (
        <Accordion type="single" collapsible className={cn("space-y-2", className)}>
            {items.map((item) => (
                <PlusMinusAccordionItem
                    key={item.value}
                    value={item.value}
                    trigger={item.question}
                    variant="plus"
                >
                    <div className="text-muted-foreground">
                        {item.answer}
                    </div>
                </PlusMinusAccordionItem>
            ))}
        </Accordion>
    )
}

// Settings Accordion
const SettingsAccordion: React.FC<{
    items: Array<{
        value: string
        title: string
        description?: string
        content: React.ReactNode
        icon?: React.ReactNode
    }>
    className?: string
}> = ({ items, className }) => {
    return (
        <Accordion type="single" collapsible className={cn("space-y-2", className)}>
            {items.map((item) => (
                <AccordionItem key={item.value} value={item.value} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                            {item.icon}
                            <div>
                                <div className="font-medium">{item.title}</div>
                                {item.description && (
                                    <div className="text-sm text-muted-foreground">{item.description}</div>
                                )}
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4">
                        {item.content}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}

export {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
    EnhancedAccordionItem,
    PlusMinusAccordionItem,
    FilterAccordion,
    FAQAccordion,
    SettingsAccordion,
}