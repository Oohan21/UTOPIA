// src/lib/api/analytics.ts
import apiClient from './client';
import { MarketTrend, PlatformAnalytics } from '@/lib/types/dashboard';

export const analyticsApi = {
  // Market trends
  getMarketTrends: async (days: number = 30): Promise<MarketTrend[]> => {
    const response = await apiClient.get(`/analytics/market-trends/?days=${days}`);
    return response.data;
  },

  // Platform analytics
  getPlatformAnalytics: async (period: string = '30d'): Promise<any> => {
    const response = await apiClient.get(`/analytics/platform/?period=${period}`);
    return response.data;
  },

  // User analytics
  getUserAnalytics: async (userId?: number): Promise<any> => {
    const url = userId 
      ? `/analytics/users/${userId}/` 
      : '/analytics/users/me/';
    const response = await apiClient.get(url);
    return response.data;
  },

  // Price analytics
  getPriceAnalytics: async (): Promise<any> => {
    const response = await apiClient.get('/analytics/price-analysis/');
    return response.data;
  },

  // Demand analytics
  getDemandAnalytics: async (): Promise<any> => {
    const response = await apiClient.get('/analytics/demand-analysis/');
    return response.data;
  },

  // Dashboard analytics
  getDashboardAnalytics: async (): Promise<any> => {
    // Try multiple endpoints like admin.ts does
    const endpoints = [
      '/analytics/dashboard/',
      '/admin/analytics/dashboard/',
      '/dashboard/analytics/'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get(endpoint);
        return response.data;
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed, trying next...`);
        continue;
      }
    }
    
    // Return fallback data
    return {
      total_users: 0,
      total_properties: 0,
      active_users: 0,
      active_properties: 0,
      revenue_month: 0,
      revenue_year: 0,
      market_trends: []
    };
  }
};