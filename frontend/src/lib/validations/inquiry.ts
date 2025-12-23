// lib/validations/inquiry.ts
import * as z from 'zod'

export const inquiryFormSchema = z.object({
    property_id: z.number().min(1, 'Please select a property'),
    inquiry_type: z.enum(['general', 'viewing', 'price', 'details'], {
        required_error: 'Please select an inquiry type',
    }),
    phone: z.string()
        .optional()
        .refine((val) => !val || /^\+?[\d\s\-\(\)]{10,}$/.test(val), {
            message: 'Please enter a valid phone number'
        }),

    message: z.string()
        .min(10, 'Message must be at least 10 characters')
        .max(5000, 'Message cannot exceed 5000 characters')
        .refine((val) => val.trim().length >= 10, {
            message: 'Message cannot be just whitespace'
        }),
    contact_preference: z.enum(['call', 'email', 'whatsapp', 'any'], {
        required_error: 'Please select a contact preference',
    }),
    full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Name too long'),
    email: z.string().email('Invalid email address'),
    category: z.enum(['buyer', 'seller', 'agent', 'general']).default('general'),
    source: z.enum(['website', 'phone', 'email', 'whatsapp', 'walk_in', 'referral']).default('website'),
    tags: z.array(z.string()).default([]),
})

export type InquiryFormValues = z.infer<typeof inquiryFormSchema>