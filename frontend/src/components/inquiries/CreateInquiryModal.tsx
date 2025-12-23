// components/inquiries/CreateInquiryModal.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog"
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
import { Plus, Search, Home } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
import { inquiryApi } from '@/lib/api/inquiry'
import toast from 'react-hot-toast'

export function CreateInquiryModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    property_id: '',
    inquiry_type: 'general',
    message: '',
    contact_preference: 'any',
    full_name: '',
    email: '',
    phone: '',
  })

  // Fetch properties for selection
  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties', searchTerm],
    queryFn: () => listingsApi.getProperties({ 
      search: searchTerm,
      limit: 10 
    }),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const inquiryData = {
        property_id: parseInt(formData.property_id),
        inquiry_type: formData.inquiry_type,
        message: formData.message,
        contact_preference: formData.contact_preference,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        category: 'general',
        source: 'website'
      }

      await inquiryApi.createInquiry(inquiryData)
      toast.success('Inquiry sent successfully!')
      setOpen(false)
      setFormData({
        property_id: '',
        inquiry_type: 'general',
        message: '',
        contact_preference: 'any',
        full_name: '',
        email: '',
        phone: '',
      })
      router.refresh()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send inquiry')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Inquiry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Inquiry</DialogTitle>
          <DialogDescription>
            Send an inquiry for a property. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property Search */}
          <div className="space-y-2">
            <Label htmlFor="property-search">Search Property *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="property-search"
                placeholder="Search properties by title, location..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {searchTerm && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {isLoadingProperties ? (
                  <p className="text-sm text-muted-foreground">Loading properties...</p>
                ) : properties?.results?.length ? (
                  properties.results.map((property) => (
                    <div
                      key={property.id}
                      className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                        formData.property_id === property.id.toString() 
                          ? 'bg-primary/5 border-primary' 
                          : ''
                      }`}
                      onClick={() => handleSelectChange('property_id', property.id.toString())}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-muted">
                          <Home className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{property.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {property.city?.name}, {property.sub_city?.name}
                          </p>
                        </div>
                        {formData.property_id === property.id.toString() && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No properties found</p>
                )}
              </div>
            )}
          </div>

          {/* Inquiry Type */}
          <div className="space-y-2">
            <Label htmlFor="inquiry_type">Inquiry Type *</Label>
            <Select
              value={formData.inquiry_type}
              onValueChange={(value) => handleSelectChange('inquiry_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select inquiry type" />
              </SelectTrigger>
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
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact method" />
              </SelectTrigger>
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
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="I'm interested in this property. Could you please provide more details about..."
              value={formData.message}
              onChange={handleChange}
              rows={4}
              required
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-medium">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+251911223344"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.property_id}
              className="flex-1"
            >
              {isSubmitting ? 'Sending...' : 'Send Inquiry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}