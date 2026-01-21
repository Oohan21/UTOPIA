// lib/api/inquiry.ts
import apiClient from './client';
import {
  Inquiry,
  InquiryFilters,
  CreateInquiryData,
  UpdateInquiryData,
  BulkUpdateInquiryData,
  ScheduleViewingData,
  InquiryDashboardStats,
  InquiryActivity,
  PaginatedResponse,
  InquiryMessage,
  ExportOptions
} from '@/lib/types/inquiry';

export const inquiryApi = {
  // Get all inquiries with filters
  getInquiries: async (filters?: InquiryFilters): Promise<PaginatedResponse<Inquiry>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else if (typeof value === 'boolean') {
            params.append(key, value.toString());
          } else if (value === 'unassigned') {
            params.append(key, '');
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    
    const queryString = params.toString();
    const url = queryString ? `/inquiries/?${queryString}` : '/inquiries/';
    
    try {
      const response = await apiClient.get<PaginatedResponse<Inquiry>>(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching inquiries:', error);
      
      // Return empty results for specific errors
      if (error.response?.status >= 500) {
        return {
          count: 0,
          next: null,
          previous: null,
          results: [],
          total_pages: 1,
          current_page: 1,
        };
      }
      
      throw error;
    }
  },

  // Get a single inquiry by ID or UUID
  getInquiry: async (id: string): Promise<Inquiry> => {
    const response = await apiClient.get<Inquiry>(`/inquiries/${id}/`);
    return response.data;
  },

  // Create a new inquiry
  createInquiry: async (data: CreateInquiryData): Promise<Inquiry> => {
    const response = await apiClient.post<Inquiry>('/inquiries/', data);
    return response.data;
  },

  // Update an inquiry
  updateInquiry: async (id: string, data: UpdateInquiryData): Promise<Inquiry> => {
    const response = await apiClient.patch<Inquiry>(`/inquiries/${id}/`, data);
    return response.data;
  },

  // Delete an inquiry
  deleteInquiry: async (id: string): Promise<void> => {
    await apiClient.delete(`/inquiries/${id}/`);
  },

  // ========== Custom Actions ==========

  // Assign inquiry to current user
  assignToMe: async (id: string): Promise<Inquiry> => {
    const response = await apiClient.post<Inquiry>(`/inquiries/${id}/assign_to_me/`);
    return response.data;
  },

  // Mark inquiry as contacted
  markAsContacted: async (id: string, notes?: string): Promise<Inquiry> => {
    const response = await apiClient.post<Inquiry>(`/inquiries/${id}/mark_as_contacted/`, {
      notes
    });
    return response.data;
  },

  // Schedule a viewing
  scheduleViewing: async (id: string, data: ScheduleViewingData): Promise<Inquiry> => {
    const response = await apiClient.post<Inquiry>(`/inquiries/${id}/schedule_viewing/`, data);
    return response.data;
  },

  // Close an inquiry
  closeInquiry: async (id: string, notes?: string): Promise<Inquiry> => {
    const response = await apiClient.post<Inquiry>(`/inquiries/${id}/close_inquiry/`, {
      notes
    });
    return response.data;
  },

  // Bulk update inquiries
  bulkUpdate: async (data: BulkUpdateInquiryData): Promise<{ 
    success: boolean; 
    updated_count: number; 
    message: string 
  }> => {
    const response = await apiClient.post('/inquiries/bulk_update/', data);
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<InquiryDashboardStats> => {
    const response = await apiClient.get<InquiryDashboardStats>('/inquiries/dashboard_stats/');
    return response.data;
  },

  // Get inquiry activity timeline
  getInquiryActivity: async (id: string): Promise<InquiryActivity[]> => {
    const response = await apiClient.get<InquiryActivity[]>(`/inquiries/${id}/activity/`);
    return response.data;
  },

  // Export inquiries to CSV
  exportInquiries: async (filters?: InquiryFilters, options?: ExportOptions): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    
    const response = await apiClient.get(`/inquiries/export/?${params.toString()}`, {
      responseType: 'blob'
    });
    
    return response.data;
  },

  // Get inquiries for current user
  getMyInquiries: async (filters?: Omit<InquiryFilters, 'user'>): Promise<PaginatedResponse<Inquiry>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    
    const queryString = params.toString();
    const url = queryString ? `/inquiries/my_inquiries/?${queryString}` : '/inquiries/my_inquiries/';
    
    const response = await apiClient.get<PaginatedResponse<Inquiry>>(url);
    return response.data;
  },

  // Get inquiries assigned to current admin
  getAssignedToMe: async (filters?: Omit<InquiryFilters, 'assigned_to'>): Promise<PaginatedResponse<Inquiry>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    
    const queryString = params.toString();
    const url = queryString ? `/inquiries/assigned_to_me/?${queryString}` : '/inquiries/assigned_to_me/';
    
    const response = await apiClient.get<PaginatedResponse<Inquiry>>(url);
    return response.data;
  },

  // Get messages for an inquiry
  getInquiryMessages: async (inquiryId: string): Promise<InquiryMessage[]> => {
    const response = await apiClient.get<InquiryMessage[]>(`/messages/?inquiry=${inquiryId}`);
    return response.data;
  },

  // Send a message for an inquiry
  sendInquiryMessage: async (inquiryId: string, data: { 
    message: string; 
    attachment?: File;
    subject?: string;
  }): Promise<InquiryMessage> => {
    const formData = new FormData();
    formData.append('message', data.message);
    if (data.subject) formData.append('subject', data.subject);
    if (data.attachment) formData.append('attachment', data.attachment);
    
    const response = await apiClient.post<InquiryMessage>(`/messages/?inquiry=${inquiryId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Mark inquiry message as read
  markMessageAsRead: async (messageId: number): Promise<void> => {
    await apiClient.post(`/messages/${messageId}/mark_as_read/`);
  },

  // Get unread message count
  getUnreadMessageCount: async (): Promise<{ unread_count: number }> => {
    const response = await apiClient.get<{ unread_count: number }>('/messages/unread_count/');
    return response.data;
  },

  // Download exported file
  downloadExport: (blob: Blob, filename?: string): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `inquiries_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};