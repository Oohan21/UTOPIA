// components/inquiries/InquiryForm.tsx
'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inquiryFormSchema, type InquiryFormValues } from '@/lib/validations/inquiry'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/Form"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Button } from "@/components/ui/Button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/Command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover"
import { Check, ChevronsUpDown, Mail, Phone, MessageSquare, User, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
import toast from 'react-hot-toast'

interface InquiryFormProps {
    defaultValues?: Partial<InquiryFormValues>
    onSubmit: (data: InquiryFormValues) => Promise<void>
    isSubmitting?: boolean
    submitLabel?: string
    showPropertyField?: boolean
}

export function InquiryForm({
    defaultValues,
    onSubmit,
    isSubmitting = false,
    submitLabel = 'Send Inquiry',
    showPropertyField = true,
}: InquiryFormProps) {
    const form = useForm<InquiryFormValues>({
        resolver: zodResolver(inquiryFormSchema),
        defaultValues: {
            inquiry_type: 'general',
            contact_preference: 'any',
            category: 'general',
            source: 'website',
            tags: [],
            ...defaultValues,
        },
    })

    // Fetch properties for selection
    const { data: properties, isLoading: isLoadingProperties } = useQuery({
        queryKey: ['properties-for-inquiry'],
        queryFn: () => listingsApi.getProperties({ limit: 100 }),
        enabled: showPropertyField,
    })

    const handleSubmit = async (data: InquiryFormValues) => {
        try {
            const apiData = {
                ...data,
                property: data.property_id
            }
            await onSubmit(apiData)
            toast.success('Inquiry submitted successfully!')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to submit inquiry')
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {showPropertyField && (
                    <FormField
                        control={form.control}
                        name="property_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Property *</FormLabel>
                                <Select
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    defaultValue={field.value?.toString()}
                                    disabled={isLoadingProperties}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a property" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {isLoadingProperties ? (
                                            <SelectItem value="loading" disabled>
                                                Loading properties...
                                            </SelectItem>
                                        ) : properties?.results?.length ? (
                                            properties.results.map((property) => (
                                                <SelectItem key={property.id} value={property.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        <Home className="h-4 w-4 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="truncate font-medium">{property.title}</div>
                                                            <div className="truncate text-xs text-muted-foreground">
                                                                {property.city?.name}, {property.sub_city?.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>
                                                No properties found
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="inquiry_type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Inquiry Type *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="general">General Inquiry</SelectItem>
                                        <SelectItem value="viewing">Schedule Viewing</SelectItem>
                                        <SelectItem value="price">Price Negotiation</SelectItem>
                                        <SelectItem value="details">More Details</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="contact_preference"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Preference *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="call">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4" />
                                                Phone Call
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="email">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                Email
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                        <SelectItem value="any">Any Method</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Your Message *</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="I'm interested in this property. Could you please provide more details about..."
                                    className="min-h-[120px] resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Be specific to get a faster response. Include questions about price, availability, or viewing options.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Contact Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input className="pl-10" placeholder="John Doe" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address *</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input className="pl-10" type="email" placeholder="john@example.com" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number (Optional)</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input className="pl-10" placeholder="+1234567890" {...field} />
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    Provide your phone number if you prefer phone contact
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="buyer">Buyer Inquiry</SelectItem>
                                            <SelectItem value="seller">Seller Inquiry</SelectItem>
                                            <SelectItem value="agent">Agent Inquiry</SelectItem>
                                            <SelectItem value="general">General Inquiry</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="source"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Source</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select source" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="website">Website</SelectItem>
                                            <SelectItem value="phone">Phone Call</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                            <SelectItem value="walk_in">Walk-in</SelectItem>
                                            <SelectItem value="referral">Referral</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 gap-2"
                    >
                        <MessageSquare className="h-4 w-4" />
                        {isSubmitting ? 'Submitting...' : submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    )
}