import apiClient from './client';
import { User } from '@/lib/types/user';
import { Property as PropertyType } from '@/lib/types/property';

export interface AdminUser extends User {
  last_login: string;
  is_staff: boolean;
  is_superuser: boolean;
  groups: string[];
  user_permissions: string[];
}

export interface AuditLog {
  id: number;
  user: User | null;
  action_type: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  changes: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface SystemReport {
  total_users: number;
  total_properties: number;
  total_inquiries: number;
  total_valuations: number;
  active_users: number;
  active_properties: number;
  revenue_month: number;
  revenue_year: number;
  storage_used: number;
  avg_response_time: number;
  revenue_growth?: number;
}

export interface AdminProperty {
  id: number;
  title: string;
  property_type: string;
  listing_type: string;
  property_status: string;
  city: { id: number; name: string };
  sub_city: { id: number; name: string };
  price_etb: number;
  monthly_rent?: number;
  bedrooms: number;
  bathrooms: number;
  total_area: number;
  is_featured: boolean;
  is_verified: boolean;
  is_active: boolean;
  is_promoted: boolean;
  views_count: number;
  inquiry_count: number;
  images?: Array<{ image: string }>;
  owner: { id: number; email: string; first_name: string; last_name: string };
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: number;
  property: PropertyType;
  user: User;
  inquiry_type: string;
  message: string;
  status: string;
  priority: string;
  assigned_to: User | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  total_pages: number;
  current_page: number;
}

export interface AnalyticsData {
  period: string;
  metrics: Record<string, number>;
}

export interface SystemSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  currency: string;
  default_language: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  property_auto_approval: boolean;
  max_properties_per_user: number;
  property_expiry_days: number;
  commission_rate: number;
}

const cleanParams = (params?: any): any => {
  if (!params) return undefined;

  const cleaned: any = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === 'undefined' || value === '') {
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
};

export const adminApi = {
  // Dashboard
  getAdminDashboard: async (): Promise<any> => {
    try {
      // Try multiple dashboard endpoints
      const endpoints = [
        '/admin/dashboard/',
        '/dashboard/',
        '/analytics/dashboard/'
      ];

      let lastError: any = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying admin dashboard: ${endpoint}`);
          const response = await apiClient.get(endpoint);
          console.log(`Admin dashboard loaded from: ${endpoint}`);
          return response.data;
        } catch (error: any) {
          console.log(`Endpoint ${endpoint} failed:`, error?.response?.status || error.message);
          lastError = error;
          continue;
        }
      }
      
      throw lastError;
    } catch (error: any) {
      console.error('Failed to load admin dashboard:', error);
      
      // Return fallback data if endpoints fail
      return {
        total_users: 0,
        total_properties: 0,
        total_inquiries: 0,
        total_valuations: 0,
        active_users: 0,
        active_properties: 0,
        revenue_month: 0,
        revenue_year: 0,
        revenue_growth: 0,
        property_type_distribution: {},
        user_type_distribution: {},
        recent_activities: []
      };
    }
  },

  // Users
  getUsers: async (params?: any): Promise<PaginatedResponse<AdminUser>> => {
    const cleanedParams = cleanParams(params);
    const queryParams = new URLSearchParams(cleanedParams || {}).toString();
    
    // Try different user endpoints
    const endpoints = [
      `/admin/users/${queryParams ? `?${queryParams}` : ''}`,
      `/users/${queryParams ? `?${queryParams}` : ''}`
    ];

    let lastError: any = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying users endpoint: ${endpoint}`);
        const response = await apiClient.get<PaginatedResponse<AdminUser>>(endpoint);
        console.log(`Users loaded from: ${endpoint}`, response.data);
        return response.data;
      } catch (error: any) {
        console.log(`Endpoint ${endpoint} failed:`, error?.response?.status || error.message);
        lastError = error;
        continue;
      }
    }
    
    throw lastError;
  },

  getUser: async (userId: number): Promise<AdminUser> => {
    try {
      const response = await apiClient.get<AdminUser>(`/users/${userId}/`);
      return response.data;
    } catch (error: any) {
      // Try admin endpoint as fallback
      const response = await apiClient.get<AdminUser>(`/admin/users/${userId}/`);
      return response.data;
    }
  },

  createUser: async (data: any): Promise<AdminUser> => {
    const response = await apiClient.post<AdminUser>('/admin/users/', data);
    return response.data;
  },

  updateUser: async (userId: number, data: Partial<AdminUser>): Promise<AdminUser> => {
    const response = await apiClient.put<AdminUser>(`/admin/users/${userId}/`, data);
    return response.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}/`);
  },

  resetUserPassword: async (userId: number): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/reset-password/`);
  },

  toggleUserVerification: async (userId: number): Promise<AdminUser> => {
    const response = await apiClient.post(`/admin/users/${userId}/toggle_verification/`);
    return response.data;
  },
  
  toggleUserActiveStatus: async (userId: number): Promise<AdminUser> => {
    const response = await apiClient.post(`/admin/users/${userId}/toggle_active/`);
    return response.data;
  },

  // Properties
  getPropertiesAdmin: async (params?: any): Promise<PaginatedResponse<AdminProperty>> => {
    const cleanedParams = cleanParams(params);
    const queryParams = new URLSearchParams(cleanedParams || {}).toString();
    
    // Try different property endpoints
    const endpoints = [
      `/admin/properties/${queryParams ? `?${queryParams}` : ''}`,
      `/properties/${queryParams ? `?${queryParams}&admin=true` : '?admin=true'}`
    ];

    let lastError: any = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying properties endpoint: ${endpoint}`);
        const response = await apiClient.get<PaginatedResponse<AdminProperty>>(endpoint);
        console.log(`Properties loaded from: ${endpoint}`, response.data.count);
        return response.data;
      } catch (error: any) {
        console.log(`Endpoint ${endpoint} failed:`, error?.response?.status || error.message);
        lastError = error;
        continue;
      }
    }
    
    throw lastError;
  },

  updatePropertyAdmin: async (propertyId: number, data: any): Promise<AdminProperty> => {
    const response = await apiClient.put(`/admin/properties/${propertyId}/`, data);
    return response.data;
  },

  deletePropertyAdmin: async (propertyId: number): Promise<void> => {
    await apiClient.delete(`/admin/properties/${propertyId}/`);
  },

  togglePropertyActive: async (propertyId: number): Promise<AdminProperty> => {
    const response = await apiClient.post(`/admin/properties/${propertyId}/toggle_active/`);
    return response.data;
  },

  togglePropertyVerification: async (propertyId: number): Promise<AdminProperty> => {
    const response = await apiClient.post(`/admin/properties/${propertyId}/toggle_verification/`);
    return response.data;
  },

  togglePropertyFeatured: async (propertyId: number): Promise<AdminProperty> => {
    const response = await apiClient.post(`/admin/properties/${propertyId}/toggle_featured/`);
    return response.data;
  },

  // Inquiries
  getInquiriesAdmin: async (params?: any): Promise<PaginatedResponse<Inquiry>> => {
    const queryParams = new URLSearchParams(params || {}).toString();
    
    const endpoints = [
      `/admin/inquiries/${queryParams ? `?${queryParams}` : ''}`,
      `/inquiries/${queryParams ? `?${queryParams}&admin=true` : '?admin=true'}`
    ];

    let lastError: any = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying inquiries endpoint: ${endpoint}`);
        const response = await apiClient.get<PaginatedResponse<Inquiry>>(endpoint);
        return response.data;
      } catch (error: any) {
        console.log(`Endpoint ${endpoint} failed:`, error?.response?.status || error.message);
        lastError = error;
        continue;
      }
    }
    
    throw lastError;
  },

  updateInquiryAdmin: async (inquiryId: number, data: any): Promise<Inquiry> => {
    const response = await apiClient.put(`/admin/inquiries/${inquiryId}/`, data);
    return response.data;
  },

  assignInquiryToMe: async (inquiryId: number): Promise<Inquiry> => {
    const response = await apiClient.post(`/admin/inquiries/${inquiryId}/assign_to_me/`);
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (params?: any): Promise<PaginatedResponse<AuditLog>> => {
    const queryParams = new URLSearchParams(params || {}).toString();
    
    const endpoints = [
      `/admin/audit-logs/${queryParams ? `?${queryParams}` : ''}`,
      `/audit-logs/${queryParams ? `?${queryParams}` : ''}`
    ];

    let lastError: any = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying audit logs: ${endpoint}`);
        const response = await apiClient.get<PaginatedResponse<AuditLog>>(endpoint);
        return response.data;
      } catch (error: any) {
        console.log(`Endpoint ${endpoint} failed:`, error?.response?.status || error.message);
        lastError = error;
        continue;
      }
    }
    
    throw lastError;
  },

  // Analytics
  getAnalytics: async (period: string = '30d'): Promise<AnalyticsData[]> => {
    const endpoints = [
      `/analytics/?period=${period}`,
      `/admin/analytics/?period=${period}`
    ];

    let lastError: any = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying analytics: ${endpoint}`);
        const response = await apiClient.get(endpoint);
        return response.data;
      } catch (error: any) {
        console.log(`Endpoint ${endpoint} failed:`, error?.response?.status || error.message);
        lastError = error;
        continue;
      }
    }
    
    throw lastError;
  },

  // Reports
  generateReport: async (type: string, startDate: string, endDate: string): Promise<Blob> => {
    try {
      const response = await apiClient.get(
        `/admin/reports/?type=${type}&start_date=${startDate}&end_date=${endDate}`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error: any) {
      console.error('Report generation failed:', error);
      throw new Error(`Failed to generate report: ${error.message || 'Unknown error'}`);
    }
  },

  getSystemReport: async (): Promise<SystemReport> => {
    try {
      const response = await apiClient.get('/admin/report/');
      return response.data;
    } catch (error: any) {
      console.error('System report failed:', error);
      // Return fallback data
      return {
        total_users: 0,
        total_properties: 0,
        total_inquiries: 0,
        total_valuations: 0,
        active_users: 0,
        active_properties: 0,
        revenue_month: 0,
        revenue_year: 0,
        storage_used: 0,
        avg_response_time: 0,
        revenue_growth: 0
      };
    }
  },

  // System Maintenance
  clearCache: async (): Promise<void> => {
    await apiClient.post('/admin/clear-cache/');
  },

  backupDatabase: async (): Promise<Blob> => {
    const response = await apiClient.get('/admin/backup-database/', {
      responseType: 'blob'
    });
    return response.data;
  },

  runSystemCheck: async (): Promise<any> => {
    const response = await apiClient.get('/admin/system-check/');
    return response.data;
  },

  // Settings
  getSystemSettings: async (): Promise<SystemSettings> => {
    try {
      const response = await apiClient.get('/admin/settings/');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get system settings:', error);
      // Return default settings
      return {
        site_name: "Utopia Real Estate Platform",
        site_description: "Ethiopian Real Estate Marketplace",
        contact_email: "support@utopia-realestate.com",
        contact_phone: "+251911223344",
        currency: "ETB",
        default_language: "en",
        maintenance_mode: false,
        registration_enabled: true,
        property_auto_approval: false,
        max_properties_per_user: 10,
        property_expiry_days: 90,
        commission_rate: 2.5
      };
    }
  },

  updateSystemSettings: async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
    const response = await apiClient.post('/admin/settings/', settings);
    return response.data;
  },

  // Promotions
  getPromotionStats: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/admin/promotions/stats/');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get promotion stats:', error);
      return {
        total_promotions: 0,
        active_promotions: 0,
        revenue_total: 0,
        revenue_month: 0,
        tier_distribution: { basic: 0, standard: 0, premium: 0 },
        top_promoted_properties: []
      };
    }
  },

  // Notifications
  sendBulkNotification: async (data: {
    users: number[];
    title: string;
    message: string;
    type: string;
  }): Promise<void> => {
    await apiClient.post('/admin/notifications/send-bulk/', data);
  },

  // Export Data
  exportData: async (dataType: string, format: 'csv' | 'json' = 'json'): Promise<Blob> => {
    try {
      // Try different endpoint patterns
      const endpoints = [
        `/admin/export/${dataType}/?format=${format}`,
        `/analytics/export/?type=${dataType}&format=${format}`,
        `/admin/data/export/?data_type=${dataType}&format=${format}`
      ];

      let lastError: any = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying export endpoint: ${endpoint}`);
          const response = await apiClient.get(endpoint, {
            responseType: 'blob'
          });
          console.log(`Export successful from: ${endpoint}`);
          return response.data;
        } catch (error: any) {
          console.log(`Endpoint ${endpoint} failed:`, error?.response?.status || error.message);
          lastError = error;
          continue;
        }
      }
      
      throw lastError;
      
    } catch (error: any) {
      console.error(`All export endpoints failed for ${dataType}:`, error);
      
      // Provide more specific error message
      if (error?.response?.status === 404) {
        throw new Error(`Export endpoint not found. Please ensure backend has export endpoints implemented.`);
      }
      if (error?.response?.status === 403) {
        throw new Error('Permission denied. You need admin privileges to export data.');
      }
      if (error?.response?.status === 500) {
        throw new Error('Server error during export. Please try again later.');
      }
      
      throw new Error(`Failed to export ${dataType}: ${error.message || 'Unknown error'}`);
    }
  },

  // Email Management
  sendTestEmail: async (email: string): Promise<void> => {
    await apiClient.post('/admin/send-test-email/', { email });
  },

  getEmailStats: async (): Promise<any> => {
    const response = await apiClient.get('/admin/email-stats/');
    return response.data;
  },

  // User Management Utilities
  bulkUserAction: async (userIds: number[], action: string, data?: any): Promise<any> => {
    const response = await apiClient.post('/admin/users/bulk-action/', {
      user_ids: userIds,
      action: action,
      data: data
    });
    return response.data;
  },

  // Property Management Utilities
  bulkPropertyAction: async (propertyIds: number[], action: string, data?: any): Promise<any> => {
    const response = await apiClient.post('/admin/properties/bulk-action/', {
      property_ids: propertyIds,
      action: action,
      data: data
    });
    return response.data;
  },

  // Content Moderation
  getPendingModeration: async (): Promise<any> => {
    const response = await apiClient.get('/admin/pending-moderation/');
    return response.data;
  },

  moderateContent: async (contentId: number, contentType: string, action: string, reason?: string): Promise<any> => {
    const response = await apiClient.post('/admin/moderate-content/', {
      content_id: contentId,
      content_type: contentType,
      action: action,
      reason: reason
    });
    return response.data;
  },

  // Platform Metrics
  getPlatformMetrics: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/admin/platform-metrics/');
      return response.data;
    } catch (error) {
      console.error('Failed to get platform metrics:', error);
      return {
        uptime: '99.9%',
        response_time: 250,
        error_rate: 0.1,
        active_sessions: 0,
        memory_usage: '0 MB',
        cpu_usage: '0%'
      };
    }
  },

  // Activity Logs
  getUserActivity: async (userId: number): Promise<any[]> => {
    const response = await apiClient.get(`/admin/users/${userId}/activity/`);
    return response.data;
  },

  // Revenue Reports
  getRevenueReport: async (period: string = 'monthly'): Promise<any> => {
    const response = await apiClient.get(`/admin/revenue-report/?period=${period}`);
    return response.data;
  },

  getPendingProperties: async () => {
    const response = await apiClient.get('/admin/listings/pending/')
    return response.data
  },
  
  approveProperty: async (data: {
    property_id: number
    action: 'approve' | 'reject' | 'request_changes'
    notes?: string
  }) => {
    const response = await apiClient.post('/admin/listings/approve/', data)
    return response.data
  },

  // Database Stats
  getDatabaseStats: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/admin/database-stats/');
      return response.data;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {
        total_size: '0 MB',
        table_counts: {},
        row_counts: {}
      };
    }
  }
};