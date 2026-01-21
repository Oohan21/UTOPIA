'use client'

import React, { useState, useEffect } from 'react';
import { useInquiries } from '@/lib/hooks/useInquiries';
import Header from "@/components/common/Header/Header";
import { InquiryListItem } from '@/components/inquiries/InquiryListItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Pagination } from '@/components/ui/Pagination';
import {
  Inbox,
  Clock,
  CheckCircle,
  MessageSquare,
  RefreshCw,
  Home
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth'; 
import { InquiryFilters } from '@/lib/types/inquiry';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const MyInquiriesPage: React.FC = () => {
  const { user } = useAuth(); 
  const t = useTranslations('inquiries');
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<InquiryFilters>({});
  const [mounted, setMounted] = useState(false);
  
  const {
    inquiries,
    loading,
    error,
    pagination,
    fetchMyInquiries,
  } = useInquiries();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const tabFilters: InquiryFilters = { ...filters };
    
    if (user?.id) {
      tabFilters.user = user.id;
    }
    
    switch (activeTab) {
      case 'pending':
        tabFilters.status = 'pending';
        break;
      case 'responded':
        tabFilters.response_sent = true;
        break;
      case 'closed':
        tabFilters.status = 'closed';
        break;
    }
    
    fetchMyInquiries(tabFilters);
  }, [activeTab, filters, user?.id]);

  const getTabCount = (tab: string) => {
    if (!inquiries) return 0;
    
    switch (tab) {
      case 'pending':
        return inquiries.filter(i => i.status === 'pending').length;
      case 'responded':
        return inquiries.filter(i => i.response_sent).length;
      case 'closed':
        return inquiries.filter(i => i.status === 'closed').length;
      default:
        return inquiries.length;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header/>
        <div className="container mx-auto px-3 md:px-4 py-8">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header/>
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {t('myInquiries')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 md:mt-2">
              {t('trackAndManage')}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Link href="/properties">
                <Home className="w-4 h-4 mr-2" />
                {t('browseProperties')}
              </Link>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => fetchMyInquiries({ user: user?.id, ...filters })}
              disabled={loading}
              className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1">
            <TabsTrigger 
              value="all" 
              className={cn(
                "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-xs sm:text-sm"
              )}
            >
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">{t('all')}</span>
              <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full dark:text-gray-300">
                {getTabCount('all')}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="pending"
              className={cn(
                "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-xs sm:text-sm"
              )}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">{t('pending')}</span>
              <span className="ml-1 text-xs bg-yellow-200 dark:bg-yellow-900 px-2 py-0.5 rounded-full dark:text-yellow-300">
                {getTabCount('pending')}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="responded"
              className={cn(
                "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-xs sm:text-sm"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{t('responded')}</span>
              <span className="ml-1 text-xs bg-blue-200 dark:bg-blue-900 px-2 py-0.5 rounded-full dark:text-blue-300">
                {getTabCount('responded')}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="closed"
              className={cn(
                "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-xs sm:text-sm"
              )}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('closed')}</span>
              <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full dark:text-gray-300">
                {getTabCount('closed')}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Inquiries List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="pt-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : inquiries.length === 0 ? (
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardContent className="pt-12 pb-12 text-center">
                <Inbox className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('noInquiriesFound')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {activeTab !== 'all'
                    ? t('noInquiriesForTab', { tab: activeTab })
                    : t('noInquiriesYet')}
                </p>
                {activeTab !== 'all' ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('all')}
                    className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t('viewAllInquiries')}
                  </Button>
                ) : (
                  <Button asChild className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Link href="/properties">
                      <Home className="w-4 h-4 mr-2" />
                      {t('browseProperties')}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            inquiries.map(inquiry => (
              <InquiryListItem
                key={inquiry.id}
                inquiry={inquiry}
                showActions={false}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              onPageChange={(page) => {
                fetchMyInquiries({ 
                  ...filters, 
                  user: user?.id,
                  page 
                });
              }}
            />
          </div>
        )}

        {/* Help Card */}
        <Card className="mt-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-sm dark:text-gray-300">{t('needHelp')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p>• {t('helpTip1')}</p>
              <p>• {t('helpTip2')}</p>
              <p>• {t('helpTip3')}</p>
              <p>• {t('helpTip4')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyInquiriesPage;