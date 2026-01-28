import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, Mail, Phone, User, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

const inquirySchema = z.object({
  inquiry_type: z.enum(['general', 'viewing', 'price', 'details', 'availability']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
  contact_preference: z.enum(['call', 'email', 'whatsapp', 'any']),
  full_name: z.string().min(2, 'Name is required').optional().or(z.literal('')),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.enum(['buyer', 'seller', 'general']),
  source: z.enum(['website', 'phone', 'email', 'whatsapp', 'walk_in', 'referral', 'mobile_app']).default('website').optional(),
});

// Create two types - one for form data, one for submission
type InquiryFormValues = z.infer<typeof inquirySchema>;
type InquiryFormData = InquiryFormValues & {
  property_id: number;
};

interface InquiryFormProps {
  propertyId: number;
  propertyTitle: string;
  onSubmit: (data: InquiryFormData) => Promise<void>;
  isLoading?: boolean;
  successMessage?: string;
}

export const InquiryForm: React.FC<InquiryFormProps> = ({
  propertyId,
  propertyTitle,
  onSubmit,
  isLoading = false,
  successMessage,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      inquiry_type: 'general',
      contact_preference: 'any',
      priority: 'medium',
      category: 'general',
      source: 'website',
      full_name: user ? `${user.first_name} ${user.last_name}` : '',
      email: user?.email || '',
      phone: user?.phone_number || '',
    },
  });

  const inquiryType = watch('inquiry_type');

  const handleFormSubmit = async (data: InquiryFormValues) => {
    try {
      const submissionData: InquiryFormData = {
        ...data,
        property_id: propertyId,
      };
      await onSubmit(submissionData);
      setIsSubmitted(true);
      reset();
    } catch (error) {
      // Error is handled by parent
    }
  };

  if (isSubmitted && successMessage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                {successMessage}
              </div>
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => setIsSubmitted(false)}
            className="mt-4"
          >
            Send Another Inquiry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inquire About: {propertyTitle}</CardTitle>
        <p className="text-sm text-gray-600">
          Fill out the form below and the property owner/agent will contact you soon.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {!user && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <Input
                    {...register('full_name')}
                    placeholder="John Doe"
                    error={errors.full_name?.message}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="john@example.com"
                    error={errors.email?.message}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  {...register('phone')}
                  placeholder="+251 911 234567"
                  error={errors.phone?.message}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {user && (
            <Alert>
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Inquiry will be sent from your account: {user.email}</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inquiry Type *
              </label>
              <Select
                value={watch('inquiry_type')}
                onValueChange={(value) => setValue('inquiry_type', value as any)}
                placeholder="Select inquiry type"
              >
                <SelectContent>
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="viewing">Viewing Request</SelectItem>
                  <SelectItem value="price">Price Inquiry</SelectItem>
                  <SelectItem value="details">More Details</SelectItem>
                </SelectContent>
              </Select>
              {errors.inquiry_type?.message && (
                <p className="text-red-500 text-xs mt-1">{errors.inquiry_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How should we contact you? *
              </label>
              <Select
                value={watch('contact_preference')}
                onValueChange={(value) => setValue('contact_preference', value as any)}
                placeholder="Select contact method"
              >
                <SelectContent>
                  <SelectItem value="any">Any Method</SelectItem>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              {errors.contact_preference?.message && (
                <p className="text-red-500 text-xs mt-1">{errors.contact_preference.message}</p>
              )}
            </div>
          </div>

          {inquiryType === 'viewing' && (
            <Alert>
              <AlertDescription>
                Please provide your preferred viewing dates and times in the message below.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Message *
            </label>
            <Textarea
              {...register('message')}
              placeholder={`I'm interested in this property. Please provide more information about...`}
              rows={6}
              className="w-full"
            />
            {errors.message?.message && (
              <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Be specific about what information you need. Minimum 10 characters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as any)}
                placeholder="Select priority"
              >
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="urgent">Urgent Priority</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority?.message && (
                <p className="text-red-500 text-xs mt-1">{errors.priority.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value as any)}
                placeholder="Select category"
              >
                <SelectContent>
                  <SelectItem value="buyer">Buyer Inquiry</SelectItem>
                  <SelectItem value="seller">Seller Inquiry</SelectItem>
                  <SelectItem value="general">General Inquiry</SelectItem>
                </SelectContent>
              </Select>
              {errors.category?.message && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Inquiry...
              </>
            ) : (
              'Send Inquiry'
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By submitting this form, you agree to our terms and conditions.
            The property owner/agent will contact you within 24-48 hours.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};