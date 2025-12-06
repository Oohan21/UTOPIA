import apiClient from './client'
import { User } from '@/lib/types/user'

export interface AdminUser extends User {
  last_login: string
  is_staff: boolean
  is_superuser: boolean
  groups: string[]
  user_permissions: string[]
}

export interface AuditLog {
  id: number
  user: User | null
  action_type: string
  model_name: string
  object_id: string
  object_repr: string
  changes: Record<string, any>
  ip_address: string
  user_agent: string
  created_at: string
}

export interface SystemReport {
  total_users: number
  total_properties: number
  total_inquiries: number
  total_valuations: number
  active_users: number
  active_properties: number
  revenue_month: number
  revenue_year: number
  storage_used: number
  avg_response_time: number
  revenue_growth?: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Property {
  id: number
  title: string
  property_type: string
  listing_type: string
  property_status: string
  city: { name: string }
  sub_city: { name: string }
  price_etb: number
  monthly_rent?: number
  bedrooms: number
  bathrooms: number
  total_area: number
  is_featured: boolean
  is_verified: boolean
  is_active: boolean
  views_count: number
  inquiry_count: number
  images?: Array<{ image: string }>
  created_at: string
}

const cleanParams = (params?: any): any => {
  if (!params) return undefined
  
  const cleaned: any = {}
  for (const [key, value] of Object.entries(params)) {
    // Skip undefined values completely
    if (value === undefined || value === 'undefined') {
      continue
    }
    // Skip empty strings unless explicitly needed
    if (typeof value === 'string' && value.trim() === '') {
      continue
    }
    cleaned[key] = value
  }
  return cleaned
}

export const adminApi = {
  // Users
   getUsers: async (params?: any): Promise<PaginatedResponse<AdminUser>> => {
    const cleanedParams = cleanParams(params)
    const queryParams = new URLSearchParams(cleanedParams || {}).toString()
    const url = cleanedParams ? `/admin/users/?${queryParams}` : '/admin/users/'
    const response = await apiClient.get<PaginatedResponse<AdminUser>>(url)
    return response.data
  },

  getPropertiesAdmin: async (params?: any): Promise<PaginatedResponse<Property>> => {
    const cleanedParams = cleanParams(params)
    const queryParams = new URLSearchParams(cleanedParams || {}).toString()
    const url = cleanedParams ? `/admin/properties/?${queryParams}` : '/admin/properties/'
    const response = await apiClient.get<PaginatedResponse<Property>>(url)
    return response.data
  },

  getUser: async (userId: number): Promise<AdminUser> => {
    const response = await apiClient.get<AdminUser>(`/admin/users/${userId}/`)
    return response.data
  },

  getAdminDashboard: async (): Promise<any> => {
    const response = await apiClient.get('/dashboard/admin/')
    return response.data
  },

  updateUser: async (userId: number, data: Partial<AdminUser>): Promise<AdminUser> => {
    const response = await apiClient.put<AdminUser>(`/admin/users/${userId}/`, data)
    return response.data
  },

  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}/`)
  },

  // Audit Logs
  getAuditLogs: async (params?: any): Promise<PaginatedResponse<AuditLog>> => {
    const queryParams = new URLSearchParams(params || {}).toString()
    const response = await apiClient.get<PaginatedResponse<AuditLog>>(`/admin/audit-logs/?${queryParams}`)
    return response.data
  },

  // System Reports
  getSystemStats: async (): Promise<SystemReport> => {
    const response = await apiClient.get<SystemReport>('/admin/system-stats/')
    return response.data
  },

  // Data Export
  exportData: async (dataType: string, format: 'csv' | 'json' = 'json'): Promise<Blob> => {
    const response = await apiClient.get(`/admin/export/${dataType}/?format=${format}`, {
      responseType: 'blob'
    })
    return response.data
  },

  updatePropertyAdmin: async (propertyId: number, data: any): Promise<Property> => {
    const response = await apiClient.put(`/admin/properties/${propertyId}/`, data)
    return response.data
  },

  deletePropertyAdmin: async (propertyId: number): Promise<void> => {
    await apiClient.delete(`/admin/properties/${propertyId}/`)
  },

  // Inquiries Management
  getInquiriesAdmin: async (params?: any): Promise<PaginatedResponse<any>> => {
    const queryParams = new URLSearchParams(params || {}).toString()
    const response = await apiClient.get<PaginatedResponse<any>>(`/admin/inquiries/?${queryParams}`)
    return response.data
  },

  updateInquiryAdmin: async (inquiryId: number, data: any): Promise<any> => {
    const response = await apiClient.put(`/admin/inquiries/${inquiryId}/`, data)
    return response.data
  },

  createUser: async (data: any): Promise<AdminUser> => {
    const response = await apiClient.post<AdminUser>('/admin/users/', data)
    return response.data
  },

  resetUserPassword: async (userId: number): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/reset-password/`)
  },

  // System Maintenance
  clearCache: async (): Promise<void> => {
    await apiClient.post('/admin/clear-cache/')
  },

  backupDatabase: async (): Promise<Blob> => {
    const response = await apiClient.get('/admin/backup-database/', {
      responseType: 'blob'
    })
    return response.data
  },

  runSystemCheck: async (): Promise<any> => {
    const response = await apiClient.get('/admin/system-check/')
    return response.data
  },
}