import apiClient from './client'

export interface DashboardStats {
  total_properties: number
  total_users: number
  total_inquiries: number
  total_valuations: number
  revenue_month: number
  revenue_growth: number
  property_type_distribution: Record<string, number>
  recent_activities: Array<{
    user__email: string
    activity_type: string
    created_at: string
  }>
}

export interface UserStats {
  total: number
  active: number
  verified: number
  premium: number
  by_type: Record<string, number>
}

export interface PropertyStats {
  total: number
  active: number
  verified: number
  featured: number
  by_type: Record<string, number>
  by_status: Record<string, number>
}

export interface InquiryStats {
  total: number
  pending: number
  contacted: number
  closed: number
  by_type: Record<string, number>
}

export interface RevenueStats {
  monthly: number
  quarterly: number
  yearly: number
  growth: number
  by_service: Record<string, number>
}

export const dashboardApi = {
  getAdminDashboard: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/dashboard/admin/')
    return response.data
  },

  getUserDashboard: async (): Promise<any> => {
    const response = await apiClient.get('/users/dashboard/')
    return response.data
  },

  getMarketStats: async (): Promise<any> => {
    const response = await apiClient.get('/market-stats/')
    return response.data
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await apiClient.get<UserStats>('/admin/stats/users/')
    return response.data
  },

  getPropertyStats: async (): Promise<PropertyStats> => {
    const response = await apiClient.get<PropertyStats>('/admin/stats/properties/')
    return response.data
  },

  getInquiryStats: async (): Promise<InquiryStats> => {
    const response = await apiClient.get<InquiryStats>('/admin/stats/inquiries/')
    return response.data
  },

  getRevenueStats: async (): Promise<RevenueStats> => {
    const response = await apiClient.get<RevenueStats>('/admin/stats/revenue/')
    return response.data
  },
}