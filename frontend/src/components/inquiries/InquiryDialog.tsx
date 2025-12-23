// components/inquiries/InquiryDialog.tsx
'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { User } from '@/lib/types/user'
import { Property } from '@/lib/types/property'
import { Mail, Phone, MessageSquare, Clock, AlertCircle } from 'lucide-react'

interface InquiryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
  inquiryData: {
    message: string
    inquiry_type: string
    contact_preference: string
  }
  onInquiryDataChange: (data: any) => void
  propertyTitle: string
  isLoading: boolean
  propertyId: number
  propertyOwner?: User
}

export function InquiryDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  inquiryData,
  onInquiryDataChange,
  propertyTitle,
  isLoading,
  propertyId,
  propertyOwner
}: InquiryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Inquiry
          </DialogTitle>
          <DialogDescription>
            Send a message to the property owner about "{propertyTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="inquiry_type">Inquiry Type</Label>
            <Select
              value={inquiryData.inquiry_type}
              onValueChange={(value) => onInquiryDataChange({ ...inquiryData, inquiry_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select inquiry type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Inquiry</SelectItem>
                <SelectItem value="viewing">Schedule Viewing</SelectItem>
                <SelectItem value="price">Price Negotiation</SelectItem>
                <SelectItem value="details">More Details</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_preference">Preferred Contact Method</Label>
            <Select
              value={inquiryData.contact_preference}
              onValueChange={(value) => onInquiryDataChange({ ...inquiryData, contact_preference: value })}
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

          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              placeholder="I'm interested in this property. Could you please provide more details about..."
              value={inquiryData.message}
              onChange={(e) => onInquiryDataChange({ ...inquiryData, message: e.target.value })}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Be specific to get a faster response
            </p>
          </div>

          {propertyOwner && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-sm font-medium mb-2">Contacting:</p>
              <p className="text-sm">{propertyOwner.first_name} {propertyOwner.last_name}</p>
              {propertyOwner.phone_number && (
                <p className="text-sm text-muted-foreground">{propertyOwner.phone_number}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading || !inquiryData.message.trim()}>
            {isLoading ? 'Sending...' : 'Send Inquiry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}