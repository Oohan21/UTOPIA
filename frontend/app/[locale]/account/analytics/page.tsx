// src/app/account/analytics/page.tsx
'use client';

import React, { useState } from 'react';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { PropertyAnalytics } from '@/components/dashboard/PropertyAnalytics';
import { InquiriesAnalytics } from '@/components/dashboard/InquiriesAnalytics';
import { PerformanceAnalytics } from '@/components/dashboard/PerformanceAnalytics';
import { MarketInsights } from '@/components/dashboard/MarketInsights';

export default function UserAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Analytics</h1>
        <p className="text-gray-600 mt-1">
          Track your property performance and market insights
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnalyticsDashboard userType="user" />
        </TabsContent>

        <TabsContent value="properties">
          <PropertyAnalytics />
        </TabsContent>

        <TabsContent value="inquiries">
          <InquiriesAnalytics />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceAnalytics />
        </TabsContent>

        <TabsContent value="insights">
          <MarketInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
}