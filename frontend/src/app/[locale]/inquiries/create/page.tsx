// app/inquiries/create/page.tsx - SIMPLIFIED VERSION
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select"
import { ArrowLeft, Mail, Phone, MessageSquare, User, Home } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
import { inquiryApi } from '@/lib/api/inquiry'
import toast from 'react-hot-toast'

export default function CreateInquiryPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
    const [formData, setFormData] = useState({
        inquiry_type: 'general',
        message: '',
        contact_preference: 'any',
        full_name: '',
        email: '',
        phone: '',
    })

    // Fetch properties for selection
    const { data: properties, isLoading: isLoadingProperties } = useQuery({
        queryKey: ['properties-for-inquiry'],
        queryFn: () => listingsApi.getProperties({ limit: 50 }),
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedPropertyId) {
            toast.error('Please select a property')
            return
        }

        if (!formData.full_name || !formData.email || !formData.message) {
            toast.error('Please fill in all required fields')
            return
        }

        setIsSubmitting(true)

        try {
            const inquiryData = {
                property_id: parseInt(selectedPropertyId),
                inquiry_type: formData.inquiry_type,
                message: formData.message,
                contact_preference: formData.contact_preference,
                full_name: formData.full_name,
                email: formData.email,
                phone: formData.phone || '',
                category: 'general',
                source: 'website',
            }

            console.log('Submitting inquiry:', inquiryData)
            await inquiryApi.createInquiry(inquiryData)
            toast.success('Inquiry sent successfully!')
            router.push('/inquiries')
        } catch (error: any) {
            console.error('Error creating inquiry:', error)
            toast.error(error.response?.data?.error || error.message || 'Failed to send inquiry')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name: string, value: string) => {
        if (name === 'property_id') {
            setSelectedPropertyId(value)
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container py-8">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-6 gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>

                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Send New Inquiry</CardTitle>
                                    <CardDescription>
                                        Submit an inquiry for a property
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Property Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="property_id">Select Property *</Label>
                                    <Select
                                        value={selectedPropertyId}
                                        onValueChange={(value) => handleSelectChange('property_id', value)}
                                        placeholder="Select a property"
                                    >
                                        <SelectContent>
                                            {isLoadingProperties ? (
                                                <SelectItem value="loading" disabled>Loading properties...</SelectItem>
                                            ) : properties?.results?.length ? (
                                                properties.results.map((property) => (
                                                    <SelectItem key={property.id} value={property.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <Home className="h-4 w-4" />
                                                            <span className="truncate">{property.title}</span>
                                                            <span className="text-muted-foreground text-xs whitespace-nowrap">
                                                                - {property.city?.name}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>No properties found</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {!selectedPropertyId && (
                                        <p className="text-sm text-destructive">Please select a property</p>
                                    )}
                                </div>

                                {/* Inquiry Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="inquiry_type">Inquiry Type *</Label>
                                    <Select
                                        value={formData.inquiry_type}
                                        onValueChange={(value) => handleSelectChange('inquiry_type', value)}
                                        placeholder="Select inquiry type"
                                    >
                                        <SelectContent>
                                            <SelectItem value="general">General Inquiry</SelectItem>
                                            <SelectItem value="viewing">Schedule Viewing</SelectItem>
                                            <SelectItem value="price">Price Inquiry</SelectItem>
                                            <SelectItem value="details">More Details</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Contact Preference */}
                                <div className="space-y-2">
                                    <Label htmlFor="contact_preference">Contact Preference *</Label>
                                    <Select
                                        value={formData.contact_preference}
                                        onValueChange={(value) => handleSelectChange('contact_preference', value)}
                                        placeholder="Select contact method"
                                    >
                                        <SelectContent>
                                            <SelectItem value="call">Phone Call</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                            <SelectItem value="any">Any Method</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Message */}
                                <div className="space-y-2">
                                    <Label htmlFor="message">Your Message *</Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        placeholder="I'm interested in this property. Could you please provide more details about..."
                                        className="min-h-[120px]"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Be specific to get a faster response
                                    </p>
                                </div>

                                {/* Contact Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Contact Information</h3>

                                    <div className="space-y-2">
                                        <Label htmlFor="full_name">Full Name *</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="full_name"
                                                name="full_name"
                                                className="pl-10"
                                                placeholder="John Doe"
                                                value={formData.full_name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address *</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    className="pl-10"
                                                    placeholder="john@example.com"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    className="pl-10"
                                                    placeholder="+251911223344"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <CardFooter className="px-0 pt-6">
                                    <div className="flex gap-3 w-full">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => router.back()}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !selectedPropertyId}
                                            className="flex-1 gap-2"
                                        >
                                            {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                                        </Button>
                                    </div>
                                </CardFooter>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}