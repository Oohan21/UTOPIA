// src/lib/api/dashboard.ts
import apiClient from './client';
import {
  DashboardStats,
  UserDashboard,
  MarketStats,
  MarketTrend,
  PlatformAnalytics
} from '@/lib/types/dashboard';

interface DailyActivity {
  date: string;
  active_users: number;
  new_users: number;
  page_views: number;
  searches: number;
  inquiries: number;
  properties_listed: number;
}

interface UserGrowth {
  date: string;
  new_users: number;
  active_users: number;
  cumulative_users: number;
  user_type?: string;
}

interface AnalyticsResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

const handleApiError = (error: any, endpoint: string, defaultData: any) => {
  console.error(`Error fetching ${endpoint}:`, error);

  // Log more details for debugging
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', error.response.data);
  }

  // Return fallback data with error flag
  return {
    ...defaultData,
    _error: true,
    _errorMessage: error.message || 'Unknown error',
    _timestamp: new Date().toISOString()
  };
};

const generateFallbackData = (type: string, days: number = 30) => {
  switch (type) {
    case 'market-trends':
      return Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        return {
          date: date.toISOString().split('T')[0],
          average_price: Math.random() * 10000000 + 1000000,
          median_price: Math.random() * 8000000 + 1000000,
          min_price: Math.random() * 5000000 + 500000,
          max_price: Math.random() * 20000000 + 5000000,
          total_listings: Math.floor(Math.random() * 500) + 100,
          active_listings: Math.floor(Math.random() * 400) + 50,
          new_listings: Math.floor(Math.random() * 20) + 5,
          sold_listings: Math.floor(Math.random() * 10) + 2,
          rented_listings: Math.floor(Math.random() * 15) + 3,
          total_views: Math.floor(Math.random() * 5000) + 1000,
          total_inquiries: Math.floor(Math.random() * 200) + 50,
          average_days_on_market: Math.floor(Math.random() * 60) + 30,
          price_change_daily: (Math.random() - 0.5) * 2,
          price_change_weekly: (Math.random() - 0.5) * 5,
          price_change_monthly: (Math.random() - 0.5) * 10,
          inventory_months: Math.random() * 6 + 1,
          absorption_rate: Math.random() * 20 + 10,
          price_to_rent_ratio: Math.random() * 10 + 15,
          rental_yield: Math.random() * 3 + 3
        };
      });

    case 'daily-activity':
      return Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        return {
          date: date.toISOString().split('T')[0],
          active_users: Math.floor(Math.random() * 300) + 100,
          new_users: Math.floor(Math.random() * 15) + 3,
          page_views: Math.floor(Math.random() * 5000) + 1000,
          searches: Math.floor(Math.random() * 800) + 200,
          inquiries: Math.floor(Math.random() * 100) + 20,
          properties_listed: Math.floor(Math.random() * 20) + 5
        };
      });

    case 'user-growth':
      let cumulative = 1500;
      return Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        const newUsers = Math.floor(Math.random() * 12) + 3;
        const activeUsers = Math.floor(Math.random() * 250) + 100;
        cumulative += newUsers;
        return {
          date: date.toISOString().split('T')[0],
          new_users: newUsers,
          active_users: activeUsers,
          cumulative_users: cumulative
        };
      });

    case 'platform-analytics':
      return {
        date: new Date().toISOString().split('T')[0],
        total_users: 1560,
        new_users: 42,
        active_users: 287,
        user_growth_rate: 8.5,
        total_properties: 1240,
        verified_properties: 850,
        featured_properties: 120,
        promoted_properties: 85,
        total_page_views: 124500,
        avg_session_duration: 185,
        bounce_rate: 32.5,
        total_inquiries: 1250,
        successful_contacts: 780,
        total_promotions: 45,
        total_revenue: 152000,
        api_response_time: 245,
        error_rate: 0.8,
        server_uptime: 99.7
      };

    case 'admin-dashboard':
      return {
        total_properties: 1240,
        total_users: 1560,
        total_inquiries: 1250,
        total_valuations: 320,
        revenue_month: 152000,
        revenue_growth: 8.5,
        property_type_distribution: {
          'apartment': 420,
          'house': 380,
          'commercial': 220,
          'land': 150,
          'other': 70
        },
        recent_activities: [],
        active_properties: 980,
        verified_properties: 850,
        featured_properties: 120,
        active_users: 287,
        agent_count: 45
      };

    default:
      return {};
  }
};

export const dashboardApi = {
  // Admin dashboard stats with fallback endpoints
  getAdminDashboard: async (): Promise<DashboardStats> => {
    const endpoints = [
      'analytics/dashboard/',
      'admin/dashboard/',
      'dashboard/admin/',
      'analytics/admin-dashboard/'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying admin dashboard endpoint: ${endpoint}`);
        const response = await apiClient.get<DashboardStats>(endpoint);
        console.log(`Successfully loaded admin dashboard from: ${endpoint}`);
        return {
          ...response.data,
          _source: endpoint
        };
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed, trying next...`);
        continue;
      }
    }

    // All endpoints failed, return fallback data
    console.warn('All admin dashboard endpoints failed, using fallback data');
    return generateFallbackData('admin-dashboard') as DashboardStats;
  },

  // User dashboard stats
  getUserDashboard: async (): Promise<UserDashboard> => {
    try {
      const response = await apiClient.get<UserDashboard>('auth/dashboard/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user dashboard:', error);
      // Return fallback user dashboard data
      return {
        listed_properties: 0,
        saved_properties: 0,
        saved_searches: 0,
        inquiries_sent: 0,
        profile_completion: 0,
        recent_properties: [],
        recent_inquiries: [],
        market_insights: {}
      };
    }
  },

  // Market overview with period filter
  getMarketOverview: async (period: string = '30d'): Promise<MarketStats> => {
    try {
      const response = await apiClient.get<MarketStats>(`analytics/market-overview/?period=${period}`);
      return response.data;
    } catch (error) {
      return handleApiError(error, 'market overview', {
        summary: {
          average_price: 0,
          median_price: 0,
          price_range: { min: 0, max: 0 },
          total_listings: 0,
          average_bedrooms: 0,
          average_area: 0,
          average_price_per_sqm: 0
        },
        trends: {
          price_change_30d: 0,
          new_listings_30d: 0,
          average_days_on_market: 0,
          inventory_months: 0
        },
        distribution: {
          property_types: [],
          popular_areas: [],
          price_ranges: []
        },
        market_health: {
          absorption_rate: 0,
          price_to_rent_ratio: 0,
          rental_yield: 0
        }
      });
    }
  },

  // Market trends with days parameter
  getMarketTrends: async (days: number = 30): Promise<MarketTrend[]> => {
    try {
      const response = await apiClient.get<MarketTrend[]>(`analytics/market-trends/?days=${days}`);
      return response.data;
    } catch (error) {
      return generateFallbackData('market-trends', days) as MarketTrend[];
    }
  },

  // Platform analytics
  // src/lib/api/dashboard.ts

  // Update these methods:
  getPlatformAnalytics: async (period: string = '30d'): Promise<PlatformAnalytics> => {
    try {
      const response = await apiClient.get<PlatformAnalytics>(`analytics/platform-analytics/?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching platform analytics:', error);
      // Return fallback data
      return {
        date: new Date().toISOString().split('T')[0],
        total_users: 0,
        new_users: 0,
        active_users: 0,
        user_growth_rate: 0,
        total_properties: 0,
        verified_properties: 0,
        featured_properties: 0,
        promoted_properties: 0,
        total_page_views: 0,
        avg_session_duration: 0,
        bounce_rate: 0,
        total_inquiries: 0,
        successful_contacts: 0,
        total_promotions: 0,
        total_revenue: 0,
        api_response_time: 0,
        error_rate: 0,
        server_uptime: 0,
        _source: 'fallback',
        _timestamp: new Date().toISOString()
      };
    }
  },

  getDailyActivity: async (days: number = 30): Promise<DailyActivity[]> => {
    try {
      const response = await apiClient.get<DailyActivity[]>(`analytics/daily-activity/?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching daily activity:', error);
      return [];
    }
  },

  getUserGrowth: async (days: number = 30): Promise<UserGrowth[]> => {
    try {
      const response = await apiClient.get<UserGrowth[]>(`analytics/user-growth/?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user growth:', error);
      return [];
    }
  },

  // Price analytics
  getPriceAnalytics: async (): Promise<any> => {
    try {
      const response = await apiClient.get('analytics/price-analysis/');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'price analytics', {
        price_range: {},
        average_prices_by_city: [],
        average_prices_by_property_type: [],
        price_trends: [],
        price_forecast: {}
      });
    }
  },

  // Demand analytics
  getDemandAnalytics: async (): Promise<any> => {
    try {
      const response = await apiClient.get('analytics/demand-analysis/');
      return response.data;
    } catch (error) {
      return handleApiError(error, 'demand analytics', {
        demand_by_city: [],
        demand_by_property_type: [],
        view_to_inquiry_ratio: {},
        days_on_market_average: {},
        seasonal_trends: {}
      });
    }
  },

  // Property analytics
  getPropertyAnalytics: async (propertyId: number): Promise<any> => {
    try {
      const response = await apiClient.get(`analytics/property/${propertyId}/`);
      return response.data;
    } catch (error) {
      return handleApiError(error, `property analytics for ${propertyId}`, {
        property_id: propertyId,
        views_data: [],
        inquiry_data: [],
        performance_metrics: {}
      });
    }
  },

  // User analytics
  getUserAnalytics: async (userId?: number): Promise<any> => {
    const url = userId
      ? `/analytics/users/${userId}/`
      : '/analytics/users/me/';

    try {
      const response = await apiClient.get(url.startsWith('/') ? url.substring(1) : url);
      return response.data;
    } catch (error) {
      return handleApiError(error, `user analytics${userId ? ` for user ${userId}` : ''}`, {
        user_info: {},
        property_stats: {},
        engagement_stats: {},
        performance_metrics: {},
        recent_activity: [],
        recommendations: []
      });
    }
  },

  // Real-time analytics
  getRealtimeAnalytics: async (): Promise<any> => {
    try {
      const response = await apiClient.get('analytics/realtime/');
      return response.data;
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        active_users: 0,
        concurrent_sessions: 0,
        new_properties_today: 0,
        new_users_today: 0,
        inquiries_today: 0,
        _fallback: true
      };
    }
  },

  // System metrics
  getSystemMetrics: async (): Promise<any> => {
    try {
      const response = await apiClient.get('analytics/platform-metrics/');
      return response.data;
    } catch (error) {
      return {
        system: {
          uptime_days: 30,
          cpu_usage_percent: 25,
          memory_usage_percent: 45,
          os: 'Linux',
        },
        database: {
          connections: 5,
          name: 'postgresql',
        },
        application: {
          active_sessions: 10,
          response_time_ms: 250,
          error_rate_percent: 0.1,
        },
        _fallback: true
      };
    }
  },

  // Export analytics data
  exportAnalytics: async (type: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
    try {
      const response = await apiClient.get(`analytics/export/?type=${type}&format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error exporting ${type} analytics:`, error);

      // Provide more specific error
      if (error?.response?.status === 404) {
        throw new Error(`Export endpoint not found for type: ${type}`);
      }
      if (error?.response?.status === 403) {
        throw new Error('Permission denied. Admin access required for export.');
      }

      throw new Error(`Failed to export ${type}: ${error.message || 'Unknown error'}`);
    }
  },

  // Generate report
  generateReport: async (reportType: string, startDate: string, endDate: string): Promise<Blob> => {
    try {
      const response = await apiClient.get(
        `analytics/reports/${reportType}/?start_date=${startDate}&end_date=${endDate}`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error generating ${reportType} report:`, error);
      throw new Error(`Failed to generate report: ${error.message || 'Unknown error'}`);
    }
  },

  // City analytics
  getCityAnalytics: async (cityId?: number): Promise<any> => {
    const url = cityId
      ? `/analytics/cities/${cityId}/`
      : '/analytics/cities/';

    try {
      const response = await apiClient.get(url.startsWith('/') ? url.substring(1) : url);
      return response.data;
    } catch (error) {
      return handleApiError(error, `city analytics${cityId ? ` for city ${cityId}` : ''}`, {
        cities: [],
        metrics: {}
      });
    }
  },

  // User type distribution
  getUserTypeDistribution: async (): Promise<any> => {
    try {
      const response = await apiClient.get('analytics/user-distribution/');
      return response.data;
    } catch (error) {
      // Return fallback distribution
      return {
        total: 1560,
        distribution: [
          { type: 'buyer', count: 720, percentage: 46.2 },
          { type: 'seller', count: 420, percentage: 26.9 },
          { type: 'agent', count: 240, percentage: 15.4 },
          { type: 'developer', count: 120, percentage: 7.7 },
          { type: 'admin', count: 60, percentage: 3.8 }
        ]
      };
    }
  },

  // Performance metrics
  getPerformanceMetrics: async (): Promise<any> => {
    try {
      const response = await apiClient.get('analytics/performance/');
      return response.data;
    } catch (error) {
      return {
        api_response_time: 245,
        page_load_time: 1800,
        database_query_time: 120,
        cache_hit_rate: 0.85,
        error_rate: 0.008,
        uptime: 99.7,
        _fallback: true
      };
    }
  },

  // Revenue analytics
  getRevenueAnalytics: async (period: string = 'monthly'): Promise<any> => {
    try {
      const response = await apiClient.get(`analytics/revenue/?period=${period}`);
      return response.data;
    } catch (error) {
      return {
        period: period,
        total_revenue: 152000,
        revenue_by_source: [],
        growth_rate: 8.5,
        average_transaction: 1250,
        _fallback: true
      };
    }
  },

  // Batch analytics - multiple metrics in one call
  getBatchAnalytics: async (metrics: string[]): Promise<any> => {
    try {
      const response = await apiClient.post('analytics/batch/', { metrics });
      return response.data;
    } catch (error) {
      console.error('Error fetching batch analytics:', error);

      // Return individual metrics as fallback
      const results: any = {};
      for (const metric of metrics) {
        results[metric] = { _fallback: true, data: null };
      }
      return results;
    }
  },

  // Health check
  healthCheck: async (): Promise<boolean> => {
    try {
      await apiClient.get('analytics/health/');
      return true;
    } catch (error) {
      console.error('Analytics health check failed:', error);
      return false;
    }
  },

  // Clear analytics cache
  clearCache: async (): Promise<void> => {
    try {
      await apiClient.post('analytics/clear-cache/');
    } catch (error) {
      console.error('Error clearing analytics cache:', error);
      throw error;
    }
  }
};