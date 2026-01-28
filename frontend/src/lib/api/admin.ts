import apiClient from './client';

// Helper to perform a request that forwards incoming cookies when running
// in Next server-side (SSR / server components). If running in the browser
// we fall back to the `apiClient` which has `withCredentials` enabled.
async function fetchWithForwardedCookie(endpoint: string, opts: any = {}) {
  if (typeof window === 'undefined') {
    try {
      const { headers } = await import('next/headers');
      const cookie = (await headers()).get('cookie') || '';
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = `${base}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      const res = await fetch(url, {
        method: opts.method || 'GET',
        headers: {
          ...(opts.headers || {}),
          cookie,
        },
        body: opts.body,
        credentials: 'include',
        cache: opts.cache || 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (e) {
      throw e;
    }
  } else {
    const response = await apiClient.get(endpoint, opts);
    return response.data;
  }
}
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
  user: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    profile_picture?: string;
  } | null;
  action_type: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  changes: Record<string, any>;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  request_path?: string;
  request_method?: string;
  session_id?: string;
  browser?: string;
  os?: string;
  device?: string;
  country?: string;
  city?: string;
  created_at: string;
}

export interface AuditLogResponse extends PaginatedResponse<AuditLog> {
  summary?: {
    total_logs: number;
    unique_users: number;
    unique_ips: number;
    action_distribution: Array<{ action_type: string; count: number }>;
    model_distribution: Array<{ model_name: string; count: number }>;
    top_users: Array<{ user__email: string; user__first_name: string; user__last_name: string; count: number }>;
    timeline: Array<{ date: string; count: number }>;
  };
}

export interface AuditLogStats {
  today: {
    total: number;
    by_hour: Array<{ hour: number; count: number; label: string }>;
    top_actions: Array<{ action_type: string; count: number }>;
    active_users: Array<{ user__email: string; user__first_name: string; user__last_name: string; count: number }>;
    failed_logins: number;
    error_rate: number;
  };
  week: {
    total: number;
    daily_trend: Array<{ date: string; count: number; day_name: string }>;
    unique_users: number;
    unique_ips: number;
  };
  month: {
    total: number;
    growth_rate: number;
    top_models: Array<{ model_name: string; count: number }>;
  };
  all_time: {
    total: number;
    first_log: string | null;
    last_log: string | null;
  };
}

export interface AuditLogFilters {
  search?: string;
  action_type?: string;
  model_name?: string;
  date_range?: string;
  device?: string;
  user_id?: string;
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
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
  user_stats?: any;
  property_stats?: any;
  inquiry_stats?: any;
  market_stats?: any;
  revenue_stats?: any;
  activity_stats?: any;
  performance_metrics?: any;
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
  stats?: {
    pending: number;
    approved: number;
    rejected: number;
    changes_requested: number;
    total: number;
  };
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
          const data = await fetchWithForwardedCookie(endpoint);
          console.log(`Admin dashboard loaded from: ${endpoint}`);
          return data;
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
        const data = await fetchWithForwardedCookie(endpoint);
        console.log(`Users loaded from: ${endpoint}`);
        return data as PaginatedResponse<AdminUser>;
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
    const response = await apiClient.patch<AdminUser>(`/admin/users/${userId}/`, data);
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
        const data = await fetchWithForwardedCookie(endpoint);
        console.log(`Properties loaded from: ${endpoint}`, data.count);
        return data as PaginatedResponse<AdminProperty>;
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

  getPendingProperties: async (params?: any): Promise<PaginatedResponse<PropertyType>> => {
    const cleanedParams = cleanParams(params);
    const queryParams = new URLSearchParams(cleanedParams || {}).toString();
    const response = await apiClient.get<PaginatedResponse<PropertyType>>(`/admin/listings/pending/${queryParams ? `?${queryParams}` : ''}`);
    return response.data;
  },

  approveProperty: async (data: { property_id: number; action: string; notes?: string }): Promise<any> => {
    const response = await apiClient.post('/admin/listings/approve/', data);
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
  getAuditLogs: async (params?: AuditLogFilters): Promise<AuditLogResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append('search', params.search);
    if (params?.action_type && params.action_type !== 'all') queryParams.append('action_type', params.action_type);
    if (params?.model_name && params.model_name !== 'all') queryParams.append('model_name', params.model_name);
    if (params?.date_range && params.date_range !== 'all') queryParams.append('date_range', params.date_range);
    if (params?.device && params.device !== 'all') queryParams.append('device', params.device);
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const queryString = queryParams.toString();
    const url = `/admin/audit-logs/${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<AuditLogResponse>(url);
    return response.data;
  },

  getAuditLogStats: async (): Promise<AuditLogStats> => {
    const response = await apiClient.get<AuditLogStats>('/admin/audit-logs/stats/');
    return response.data;
  },

  exportAuditLogs: async (params?: AuditLogFilters): Promise<Blob> => {
    const queryParams = new URLSearchParams();

    if (params?.search) queryParams.append('search', params.search);
    if (params?.action_type && params.action_type !== 'all') queryParams.append('action_type', params.action_type);
    if (params?.model_name && params.model_name !== 'all') queryParams.append('model_name', params.model_name);
    if (params?.date_range && params.date_range !== 'all') queryParams.append('date_range', params.date_range);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const queryString = queryParams.toString();
    const url = `/admin/audit-logs/export/${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get(url, {
      responseType: 'blob'
    });
    return response.data;
  },

  searchAuditLogs: async (searchParams: {
    query?: string;
    action_types?: string[];
    model_names?: string[];
    start_date?: string;
    end_date?: string;
    user_id?: string;
    ip_address?: string;
    change_key?: string;
    change_value?: string;
    order_by?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<AuditLog>> => {
    const response = await apiClient.post<PaginatedResponse<AuditLog>>(
      '/admin/audit-logs/search/',
      searchParams
    );
    return response.data;
  },

  getSystemAuditInsights: async (): Promise<any> => {
    const response = await apiClient.get('/admin/audit-logs/system/');
    return response.data;
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
      const response = await apiClient.get('/admin/reports/');
      return response.data;
    } catch (error: any) {
      console.error('System report failed:', error);

      // Return comprehensive fallback data
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
        revenue_growth: 0,
        user_stats: {
          total: 0,
          active: 0,
          new_today: 0,
          new_week: 0
        },
        property_stats: {
          total: 0,
          active: 0,
          pending: 0,
          featured: 0
        },
        inquiry_stats: {
          total: 0,
          pending: 0,
          resolved: 0,
          response_rate: 0
        },
        market_stats: {
          avg_price: 0,
          total_listings: 0,
          sold_count: 0
        },
        revenue_stats: {
          month: 0,
          year: 0,
          growth: 0
        },
        activity_stats: {
          total_views: 0,
          total_logins: 0,
          peak_hour: 'N/A'
        },
        performance_metrics: {
          uptime: 'N/A',
          response_time: 0,
          error_rate: 0
        }
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
  exportData: async (dataType: string, format?: 'csv' | 'excel'): Promise<Blob> => {
    try {
      console.log(`Exporting ${dataType} in ${format || 'csv'} format...`);

      const exportFormat = format || 'csv';

      // Build URL based on format
      let url = `/admin/export/${dataType}/`;
      if (exportFormat === 'excel') {
        url = `/admin/export/${dataType}/${exportFormat}/`;
      }

      console.log(`Export URL: ${url}`);

      const response = await apiClient.get(url, {
        responseType: 'blob',
        timeout: 30000 // 30 second timeout for large exports
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response received from server');
      }

      // Create and trigger download
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileExtension = exportFormat === 'excel' ? 'xlsx' : 'csv';
      const filename = `${dataType}_export_${timestamp}.${fileExtension}`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log(`Export completed: ${filename}`);
      return blob;

    } catch (error: any) {
      console.error(`Export failed for ${dataType}:`, error);

      // Enhanced error messages
      if (error?.response?.status === 404) {
        throw new Error(`Export endpoint not found. Please check if ${dataType} export is supported.`);
      }
      if (error?.response?.status === 405) {
        throw new Error(`Method not allowed. Try a different format or contact support.`);
      }
      if (error?.response?.status === 403) {
        throw new Error('Permission denied. Admin privileges required.');
      }
      if (error?.response?.status === 500) {
        throw new Error('Server error. Please try again later or contact support.');
      }
      if (error?.code === 'ECONNABORTED') {
        throw new Error('Export timeout. The file may be too large.');
      }

      throw new Error(`Export failed: ${error.message || 'Unknown error'}`);
    }
  },

  exportBatch: async (reportTypes: string[], format?: 'csv' | 'excel'): Promise<Blob> => {
    const exportFormat = format || 'csv';

    try {
      console.log('Starting batch export:', {
        report_types: reportTypes,
        format: exportFormat,
        count: reportTypes.length
      });

      // Validate input
      if (!reportTypes || reportTypes.length === 0) {
        throw new Error('No report types selected');
      }

      // DEBUG: Log what we're sending
      console.log('Sending POST request to /admin/exports/batch/');

      // Make the POST request
      const response = await apiClient.post(
        '/admin/exports/batch/',
        {
          report_types: reportTypes,
          format: exportFormat
        },
        {
          responseType: 'blob',
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/zip, application/octet-stream'
          }
        }
      );

      console.log('Batch export response status:', response.status);

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response received from server');
      }

      console.log('Batch export response received, size:', response.data.size, 'type:', response.data.type);

      // Create download link for ZIP file
      const blob = response.data;
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      link.download = `reports_batch_${timestamp}.zip`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log('Batch export completed successfully');
      return blob;

    } catch (error: any) {
      console.error('Batch export failed:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        headers: error?.response?.headers
      });

      // Enhanced error handling
      if (error?.response?.status === 404) {
        throw new Error('Batch export endpoint not found. Please ensure backend is properly configured.');
      }
      if (error?.response?.status === 405) {
        // Check what methods are allowed
        const allowedMethods = error?.response?.headers?.['allow'] || 'Unknown';
        throw new Error(`Method not allowed. Allowed methods: ${allowedMethods}. Try a different approach.`);
      }
      if (error?.response?.status === 400) {
        const errorData = error.response.data;
        let errorMessage = 'Invalid request. Please check selected reports.';

        if (typeof errorData === 'string') {
          errorMessage = `Invalid request: ${errorData}`;
        } else if (errorData?.error) {
          errorMessage = `Invalid request: ${errorData.error}`;
        } else if (errorData) {
          try {
            const text = await errorData.text();
            errorMessage = `Invalid request: ${text}`;
          } catch (e) {
            errorMessage = 'Invalid request data format';
          }
        }

        throw new Error(errorMessage);
      }
      if (error?.response?.status === 500) {
        throw new Error('Server error during batch export. Please try again later.');
      }
      if (error?.code === 'ECONNABORTED') {
        throw new Error('Batch export timeout. Reports may be too large.');
      }
      if (error?.message?.includes('Network Error')) {
        throw new Error('Network error. Please check your connection.');
      }

      throw new Error(`Batch export failed: ${error.message || 'Unknown error'}`);
    }
  },

  // Generate Custom Report - update format parameter
  generateCustomReport: async (
    reportType: string,
    startDate: string,
    endDate: string,
    format?: 'csv' | 'excel'
  ): Promise<Blob> => {
    const exportFormat = format || 'csv';

    try {
      let url = '';
      if (exportFormat === 'csv') {
        url = `/admin/export/${reportType}/?start_date=${startDate}&end_date=${endDate}`;
      } else {
        url = `/admin/export/${reportType}/${exportFormat}/?start_date=${startDate}&end_date=${endDate}`;
      }

      const response = await apiClient.get(url, {
        responseType: 'blob'
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response received from server');
      }

      // Create and trigger download
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `${reportType}_custom_${timestamp}.csv`;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log(`Custom report completed: ${filename}`);
      return response.data;
    } catch (error: any) {
      console.error('Custom report failed:', error);
      throw new Error(`Failed to generate custom report: ${error.message || 'Unknown error'}`);
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
  getPlatformMetrics: async (period: string = '7d'): Promise<any> => {
    try {
      const response = await apiClient.get(`/admin/platform-metrics/?period=${period}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get platform metrics:', error);
      return {
        total_revenue: 0,
        total_users: 0,
        total_properties: 0,
        growth_rate: 0
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
  },

  // Location Management
  // Cities
  getCitiesAdmin: async (params?: any): Promise<PaginatedResponse<any>> => {
    const queryParams = new URLSearchParams(params || {}).toString();
    const response = await apiClient.get(`/admin/cities/${queryParams ? `?${queryParams}` : ''}`);
    return response.data;
  },

  createCity: async (data: any): Promise<any> => {
    const response = await apiClient.post('/admin/cities/', data);
    return response.data;
  },

  updateCity: async (cityId: number, data: any): Promise<any> => {
    const response = await apiClient.patch(`/admin/cities/${cityId}/`, data);
    return response.data;
  },

  deleteCity: async (cityId: number): Promise<void> => {
    await apiClient.delete(`/admin/cities/${cityId}/`);
  },

  toggleCityActive: async (cityId: number): Promise<any> => {
    const response = await apiClient.post(`/admin/cities/${cityId}/toggle_active/`);
    return response.data;
  },

  getCitySubCities: async (cityId: number): Promise<any> => {
    const response = await apiClient.get(`/admin/cities/${cityId}/subcities/`);
    return response.data;
  },

  // Sub-cities
  getSubCitiesAdmin: async (params?: any): Promise<PaginatedResponse<any>> => {
    const queryParams = new URLSearchParams(params || {}).toString();
    const response = await apiClient.get(`/admin/sub-cities/${queryParams ? `?${queryParams}` : ''}`);
    return response.data;
  },

  createSubCity: async (data: any): Promise<any> => {
    const response = await apiClient.post('/admin/sub-cities/', data);
    return response.data;
  },

  updateSubCity: async (subCityId: number, data: any): Promise<any> => {
    const response = await apiClient.patch(`/admin/sub-cities/${subCityId}/`, data);
    return response.data;
  },

  deleteSubCity: async (subCityId: number): Promise<void> => {
    await apiClient.delete(`/admin/sub-cities/${subCityId}/`);
  },

  toggleSubCityPopular: async (subCityId: number): Promise<any> => {
    const response = await apiClient.post(`/admin/sub-cities/${subCityId}/toggle_popular/`);
    return response.data;
  },

  // Amenities
  getAmenitiesAdmin: async (params?: any): Promise<PaginatedResponse<any>> => {
    const queryParams = new URLSearchParams(params || {}).toString();
    const response = await apiClient.get(`/admin/amenities/${queryParams ? `?${queryParams}` : ''}`);
    return response.data;
  },

  createAmenity: async (data: any): Promise<any> => {
    const response = await apiClient.post('/admin/amenities/', data);
    return response.data;
  },

  updateAmenity: async (amenityId: number, data: any): Promise<any> => {
    const response = await apiClient.patch(`/admin/amenities/${amenityId}/`, data);
    return response.data;
  },

  deleteAmenity: async (amenityId: number): Promise<void> => {
    await apiClient.delete(`/admin/amenities/${amenityId}/`);
  },

  toggleAmenityActive: async (amenityId: number): Promise<any> => {
    const response = await apiClient.post(`/admin/amenities/${amenityId}/toggle_active/`);
    return response.data;
  },

  getAmenitiesByType: async (): Promise<any> => {
    const response = await apiClient.get('/admin/amenities/by_type/');
    return response.data;
  },
};