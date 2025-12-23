// src/lib/hooks/useAnalytics.ts
import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api/dashboard';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const useAnalytics = {
  // Admin dashboard
  useAdminDashboard: () => {
    return useQuery({
      queryKey: ['admin-dashboard'],
      queryFn: () => dashboardApi.getAdminDashboard(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  },

  // User dashboard
  useUserDashboard: () => {
    return useQuery({
      queryKey: ['user-dashboard'],
      queryFn: () => dashboardApi.getUserDashboard(),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  },

  // Market trends
  useMarketTrends: (days: number = 30) => {
    return useQuery({
      queryKey: ['market-trends', days],
      queryFn: () => dashboardApi.getMarketTrends(days),
    });
  },

  // Market overview
  useMarketOverview: (period: string = '30d') => {
    return useQuery({
      queryKey: ['market-overview', period],
      queryFn: () => dashboardApi.getMarketOverview(period),
    });
  },

  // Price analytics
  usePriceAnalytics: () => {
    return useQuery({
      queryKey: ['price-analytics'],
      queryFn: () => dashboardApi.getPriceAnalytics(),
    });
  },

  // Demand analytics
  useDemandAnalytics: () => {
    return useQuery({
      queryKey: ['demand-analytics'],
      queryFn: () => dashboardApi.getDemandAnalytics(),
    });
  },

  // Property analytics
  usePropertyAnalytics: (propertyId: number) => {
    return useQuery({
      queryKey: ['property-analytics', propertyId],
      queryFn: () => dashboardApi.getPropertyAnalytics(propertyId),
      enabled: !!propertyId,
    });
  },

  // Platform analytics
  usePlatformAnalytics: (period: string = 'daily') => {
    return useQuery({
      queryKey: ['platform-analytics', period],
      queryFn: () => dashboardApi.getPlatformAnalytics(period),
    });
  },

  // Realtime analytics
  useRealtimeAnalytics: (enabled: boolean = true) => {
    return useQuery({
      queryKey: ['realtime-analytics'],
      queryFn: () => dashboardApi.getRealtimeAnalytics(),
      refetchInterval: enabled ? 30000 : false, // 30 seconds
      enabled,
    });
  }
};

// Custom hook for tracking events
export const useAnalyticsTracker = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  const trackEvent = async (eventName: string, properties: Record<string, any> = {}) => {
    try {
      // You can implement your analytics tracking here
      console.log(`Analytics Event: ${eventName}`, properties);
      
      // Example: Send to backend
      // await apiClient.post('/analytics/track/', {
      //   event_name: eventName,
      //   properties,
      //   timestamp: new Date().toISOString(),
      // });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  const trackPageView = (pageName: string) => {
    trackEvent('page_view', { page: pageName });
  };

  const trackPropertyView = (propertyId: number, propertyType: string) => {
    trackEvent('property_view', {
      property_id: propertyId,
      property_type: propertyType,
    });
  };

  const trackInquiry = (propertyId: number, inquiryType: string) => {
    trackEvent('inquiry_sent', {
      property_id: propertyId,
      inquiry_type: inquiryType,
    });
  };

  const trackSearch = (filters: Record<string, any>) => {
    trackEvent('search_performed', { filters });
  };

  return {
    trackEvent,
    trackPageView,
    trackPropertyView,
    trackInquiry,
    trackSearch,
    isInitialized,
  };
};