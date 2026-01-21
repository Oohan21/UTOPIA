'use client'

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from "@/components/common/Header/Header";
import { useInquiries } from '@/lib/hooks/useInquiries';
import { InquiryDetails } from '@/components/inquiries/InquiryDetails';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export default function InquiryDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const t = useTranslations('inquiries');
  const isAdmin = user?.user_type === 'admin';
  
  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    fetchInquiry,
    updateInquiry,
    assignToMe,
    markAsContacted,
    scheduleViewing,
    closeInquiry,
    deleteInquiry,
  } = useInquiries();

  useEffect(() => {
    if (id) {
      loadInquiry();
    }
  }, [id]);

  const loadInquiry = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInquiry(id);
      setInquiry(data);
    } catch (err: any) {
      setError(err.message || t('loadError'));
      toast({
        title: t('error'),
        description: t('loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (inquiryId: string, data: any) => {
    try {
      await updateInquiry(inquiryId, data);
      toast({
        title: t('success'),
        description: t('updateSuccess'),
      });
      loadInquiry();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('updateFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleAssign = async (inquiryId: string) => {
    try {
      await assignToMe(inquiryId);
      toast({
        title: t('success'),
        description: t('assignSuccess'),
      });
      loadInquiry();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('assignFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleContact = async (inquiryId: string, notes?: string) => {
    try {
      await markAsContacted(inquiryId, notes);
      toast({
        title: t('success'),
        description: t('contactedSuccess'),
      });
      loadInquiry();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('contactedFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleSchedule = async (inquiryId: string, data: any) => {
    try {
      await scheduleViewing(inquiryId, data);
      toast({
        title: t('success'),
        description: t('scheduleSuccess'),
      });
      loadInquiry();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('scheduleFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleClose = async (inquiryId: string, notes?: string) => {
    try {
      await closeInquiry(inquiryId, notes);
      toast({
        title: t('success'),
        description: t('closeSuccess'),
      });
      loadInquiry();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('closeFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('deleteConfirmation'))) return;

    try {
      await deleteInquiry(id);
      toast({
        title: t('success'),
        description: t('deleteSuccess'),
      });
      router.push('/inquiries');
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('deleteFailed'),
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
              <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header/>
        <div className="container mx-auto px-3 md:px-4 py-12">
          <Alert variant="destructive">
            <AlertDescription>
              {error || t('notFound')}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push('/inquiries')}
            className="mt-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToInquiries')}
          </Button>
        </div>
      </div>
    );
  }

  const canView = isAdmin || 
                  inquiry.user?.id === user?.id || 
                  (inquiry.property && inquiry.property.owner === user?.id);
  
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header/>
        <div className="container mx-auto px-3 md:px-4 py-12">
          <Alert variant="destructive">
            <AlertDescription>
              {t('noPermission')}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push('/inquiries')}
            className="mt-4 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToInquiries')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header/>
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/inquiries')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToInquiries')}
          </Button>
          
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/inquiries/${id}/edit`)}
                  className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {t('edit')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('delete')}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Inquiry Details */}
        <InquiryDetails
          inquiry={inquiry}
          onUpdate={handleUpdate}
          onAssign={handleAssign}
          onContact={handleContact}
          onSchedule={handleSchedule}
          onClose={handleClose}
          isAdmin={isAdmin}
        />

        {/* Activity Timeline */}
        {isAdmin && (
          <Card className="mt-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">{t('activityTimeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t('comingSoon')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}