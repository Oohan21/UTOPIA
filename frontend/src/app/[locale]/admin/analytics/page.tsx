// src/app/admin/analytics/page.tsx - Updated with language & dark mode
'use client';

import React, { useState } from 'react';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { MarketAnalytics } from '@/components/dashboard/MarketAnalytics';
import { UserAnalytics } from '@/components/dashboard/UserAnalytics';
import { PlatformAnalytics } from '@/components/dashboard/PlatformAnalytics';
import { ExportAnalyticsButton } from '@/components/dashboard/ExportAnalyticsButton';
import { Card } from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const t = useTranslations('admin.analytics');
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 md:px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 md:mt-2">
              {t('subtitle')}
            </p>
          </div>
          <ExportAnalyticsButton />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-800 p-1">
            <TabsTrigger 
              value="overview"
              className={cn(
                "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
              )}
            >
              {t('tabs.overview')}
            </TabsTrigger>
            <TabsTrigger 
              value="market"
              className={cn(
                "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
              )}
            >
              {t('tabs.market')}
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className={cn(
                "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
              )}
            >
              {t('tabs.users')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="p-4 md:p-6">
                <AnalyticsDashboard userType="admin" />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="market">
            <MarketAnalytics />
          </TabsContent>

          <TabsContent value="users">
            <UserAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}