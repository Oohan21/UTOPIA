'use client'

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from "@/components/common/Header/Header";
import { useInquiries } from '@/lib/hooks/useInquiries';
import { InquiryForm } from '@/components/inquiries/InquiryForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, ArrowLeft, Home } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { listingsApi } from '@/lib/api/listings';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const CreateInquiryPage: React.FC = () => {
  const params = useParams();
  const propertyId = params?.propertyId as string;
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('inquiries');
  const tProperty = useTranslations('propertyDetail');
  
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [propertyError, setPropertyError] = useState<string | null>(null);
  
  const { createInquiry, loading: submitting } = useInquiries();

  useEffect(() => {
    if (propertyId) {
      loadProperty();
    } else {
      setPropertyError('No property specified');
      setLoading(false);
    }
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      setPropertyError(null);
      const data = await listingsApi.getPropertyById(parseInt(propertyId!));
      setProperty(data);
    } catch (err: any) {
      setPropertyError(err.message || t('loadError'));
      toast({
        title: t('error'),
        description: t('loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      await createInquiry(data);
      toast({
        title: t('success'),
        description: t('inquirySentSuccess'),
      });
      
      setTimeout(() => {
        router.push(`/properties/${propertyId}`);
      }, 2000);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('inquirySentFailed'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header/>
        <div className="container mx-auto px-3 md:px-4 py-12">
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="pt-12 pb-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('loadingProperty')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (propertyError || !property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header/>
        <div className="container mx-auto px-3 md:px-4 py-12">
          <Alert variant="destructive">
            <AlertDescription>
              {propertyError || t('propertyNotFound')}
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button 
              onClick={() => router.push('/properties')}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Home className="w-4 h-4 mr-2" />
              {t('browseProperties')}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('goBack')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header/>
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push(`/properties/${propertyId}`)}
              className="mb-3 md:mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToProperty')}
            </Button>
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {t('sendInquiry')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 md:mt-2">
              {t('contactOwnerAgent', { propertyTitle: property.title })}
            </p>
          </div>

          {/* Property Preview */}
          <Card className="mb-6 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">{t('propertyDetailsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {property.images && property.images[0] && (
                  <img
                    src={property.images[0].image}
                    alt={property.title}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg dark:text-white break-words">
                    {property.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {property.city?.name} {property.sub_city && `• ${property.sub_city.name}`}
                  </p>
                  <p className="text-xl font-bold mt-2 dark:text-white">
                    {property.listing_type === 'for_sale'
                      ? `${property.price_etb?.toLocaleString() || 0} ETB`
                      : `${property.monthly_rent?.toLocaleString() || 0} ETB/month`
                    }
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded dark:text-gray-300">
                      {t('beds', { count: property.bedrooms || 0 })}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded dark:text-gray-300">
                      {t('baths', { count: property.bathrooms || 0 })}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded dark:text-gray-300">
                      {t('area', { area: property.total_area || 0 })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inquiry Form */}
          <InquiryForm
            propertyId={property.id}
            propertyTitle={property.title}
            onSubmit={handleSubmit}
            isLoading={submitting}
            successMessage={t('inquirySentSuccess')}
          />

          {/* Additional Info */}
          <Card className="mt-6 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-sm dark:text-gray-300">{t('whatHappensNext')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{t('nextTip1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{t('nextTip2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{t('nextTip3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{t('nextTip4')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateInquiryPage;