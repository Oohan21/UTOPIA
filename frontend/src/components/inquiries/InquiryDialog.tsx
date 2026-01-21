// components/inquiries/InquiryDialog.tsx
'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { InquiryForm } from './InquiryForm'
import { MessageSquare } from 'lucide-react'

interface InquiryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
  propertyTitle: string
  isLoading?: boolean
  propertyId: number
  propertyOwner?: {
    id: number
    first_name: string
    last_name: string
    email: string
    phone_number?: string
  }
}

export const InquiryDialog: React.FC<InquiryDialogProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  propertyTitle,
  isLoading = false,
  propertyId,
  propertyOwner,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            Send Inquiry
          </DialogTitle>
          <DialogDescription>
            Contact the owner/agent about: {propertyTitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2">
          <InquiryForm
            propertyId={propertyId}
            propertyTitle={propertyTitle}
            onSubmit={onSubmit}
            isLoading={isLoading}
            successMessage="Your inquiry has been sent successfully! The property owner will contact you soon."
          />
        </div>

        {propertyOwner && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">
              Property Owner Information
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                {propertyOwner.first_name?.[0]}{propertyOwner.last_name?.[0]}
              </div>
              <div>
                <p className="font-medium">
                  {propertyOwner.first_name} {propertyOwner.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {propertyOwner.email}
                  {propertyOwner.phone_number && ` • ${propertyOwner.phone_number}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}