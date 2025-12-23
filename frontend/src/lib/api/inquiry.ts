// lib/api/inquiry.ts
import apiClient from './client'

export interface Inquiry {
    id: number
    property_rel?: {
        id: number
        title: string
        city?: { name: string }
        sub_city?: { name: string }
        images?: Array<{ image: string }>
        price_etb?: number
        monthly_rent?: number
        listing_type: string
    }
    city_name?: string
    sub_city_name?: string
    property_id?: number
    user?: any
    user_full_name: string
    inquiry_type: string
    message: string
    contact_preference: string
    full_name?: string
    email?: string
    phone?: string
    status: string
    priority: string
    assigned_to?: any
    response_sent: boolean
    response_notes?: string
    responded_at?: string
    scheduled_viewing?: string
    viewing_address?: string
    tags: string[]
    internal_notes?: string
    follow_up_date?: string
    category: string
    source: string
    is_urgent: boolean
    response_time?: number
    property_title: string
    created_at: string
    updated_at: string
}

export interface InquiryFilters {
    status?: string | string[]
    priority?: string
    inquiry_type?: string
    category?: string
    source?: string
    assigned_to?: number | 'unassigned'
    property__city?: number
    property__sub_city?: number
    property__property_type?: string
    created_at__gte?: string
    created_at__lte?: string
    follow_up_date__gte?: string
    follow_up_date__lte?: string
    search?: string
    page?: number
    page_size?: number
    ordering?: string
}

export interface InquiryDashboardStats {
    overview: {
        total: number
        new_today: number
        new_this_week: number
        unassigned: number
        urgent: number
    }
    status_distribution: Record<string, number>
    priority_distribution: Record<string, number>
    performance: {
        avg_response_time_hours: number
        response_rate: number
        conversion_rate: number
    }
    time_periods: Record<string, string>
}

export interface UpdateInquiryData {
    status?: string
    priority?: string
    assigned_to?: number | null
    response_notes?: string
    scheduled_viewing?: string
    viewing_address?: string
    tags?: string[]
    internal_notes?: string
    follow_up_date?: string
    category?: string
    source?: string
}

export interface ScheduleViewingData {
    viewing_time: string
    address?: string
    notes?: string
}

export interface CreateInquiryData {
    property_id: number
    inquiry_type: string
    message: string
    contact_preference: string
    full_name?: string
    email?: string
    phone?: string
    tags?: string[]
    category?: string
    source?: string
}

export interface PaginatedResponse<T> {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

export const inquiryApi = {
    // Get all inquiries with filters
    getInquiries: async (filters?: InquiryFilters): Promise<PaginatedResponse<Inquiry>> => {
        const params = new URLSearchParams()
        
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(key, v))
                    } else {
                        params.append(key, String(value))
                    }
                }
            })
        }
        
        const response = await apiClient.get<PaginatedResponse<Inquiry>>(`/inquiries/?${params.toString()}`)
        return response.data
    },

    // Get a single inquiry
    getInquiry: async (id: number): Promise<Inquiry> => {
        const response = await apiClient.get<Inquiry>(`/inquiries/${id}/`)
        return response.data
    },

    // Create a new inquiry
    createInquiry: async (data: CreateInquiryData): Promise<Inquiry> => {
        const response = await apiClient.post<Inquiry>('/inquiries/', data)
        return response.data
    },

    // Update an inquiry
    updateInquiry: async (id: number, data: UpdateInquiryData): Promise<Inquiry> => {
        const response = await apiClient.patch<Inquiry>(`/inquiries/${id}/`, data)
        return response.data
    },

    // Update inquiry status
    updateInquiryStatus: async (id: number, status: string, notes?: string): Promise<Inquiry> => {
        const response = await apiClient.post<Inquiry>(`/inquiries/${id}/update_status/`, {
            status,
            notes
        })
        return response.data
    },

    // Assign inquiry to current user
    assignToMe: async (id: number): Promise<Inquiry> => {
        const response = await apiClient.post<Inquiry>(`/inquiries/${id}/assign_to_me/`)
        return response.data
    },

    // Schedule a viewing
    scheduleViewing: async (id: number, data: ScheduleViewingData): Promise<Inquiry> => {
        const response = await apiClient.post<Inquiry>(`/inquiries/${id}/schedule_viewing/`, data)
        return response.data
    },

    // Get dashboard statistics
    getDashboardStats: async (): Promise<InquiryDashboardStats> => {
        const response = await apiClient.get<InquiryDashboardStats>('/inquiries/dashboard_stats/')
        return response.data
    },

    // Export inquiries to CSV
    exportInquiries: async (filters?: InquiryFilters): Promise<void> => {
        const params = new URLSearchParams()
        
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(key, v))
                    } else {
                        params.append(key, String(value))
                    }
                }
            })
        }
        
        const response = await apiClient.get(`/inquiries/export/?${params.toString()}`, {
            responseType: 'blob'
        })
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `inquiries_export_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    },

    // Delete an inquiry
    deleteInquiry: async (id: number): Promise<void> => {
        await apiClient.delete(`/inquiries/${id}/`)
    },

    // Bulk update inquiries
    bulkUpdate: async (inquiryIds: number[], data: UpdateInquiryData): Promise<{ success: boolean }> => {
        const response = await apiClient.post<{ success: boolean }>('/inquiries/bulk_update/', {
            inquiry_ids: inquiryIds,
            ...data
        })
        return response.data
    },

    // Get inquiry activity
    getInquiryActivity: async (inquiryId: number): Promise<any> => {
        const response = await apiClient.get(`/inquiries/${inquiryId}/activity/`)
        return response.data
    }
}