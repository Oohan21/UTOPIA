// src/app/admin/analytics/page.tsx
'use client';

import React, { useState } from 'react';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { MarketAnalytics } from '@/components/dashboard/MarketAnalytics';
import { UserAnalytics } from '@/components/dashboard/UserAnalytics';
import { FinancialAnalytics } from '@/components/dashboard/FinancialAnalytics';
import { PerformanceAnalytics } from '@/components/dashboard/PerformanceAnalytics';
import { RealtimeAnalytics } from '@/components/dashboard/RealtimeAnalytics';
import { ExportAnalyticsButton } from '@/components/dashboard/ExportAnalyticsButton';

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive platform insights and performance metrics
          </p>
        </div>
        <ExportAnalyticsButton />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnalyticsDashboard userType="admin" />
        </TabsContent>

        <TabsContent value="market">
          <MarketAnalytics />
        </TabsContent>

        <TabsContent value="users">
          <UserAnalytics />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialAnalytics />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceAnalytics />
        </TabsContent>

        <TabsContent value="realtime">
          <RealtimeAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}