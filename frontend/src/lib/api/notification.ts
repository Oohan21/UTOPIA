import apiClient from './client';

export const notificationApi = {
  // Get all notifications
  getNotifications: async (params?: any) => {
    const response = await apiClient.get('/notifications/', { params });
    return response.data;
  },

  // Get unread notifications count - FIXED ENDPOINT
  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const response = await apiClient.get('/notifications/unread_count/');
    return response.data;
  },

  // Get a single notification
  getNotification: async (notificationId: string) => {
    const response = await apiClient.get(`/notifications/${notificationId}/`);
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/`, {
      is_read: true
    });
    return response.data;
  },

  // Mark all notifications as read - FIXED ENDPOINT
  markAllAsRead: async () => {
    const response = await apiClient.post('/notifications/mark_all_read/');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId: string) => {
    await apiClient.delete(`/notifications/${notificationId}/`);
  },

  // Get notification preferences
  getPreferences: async () => {
    const response = await apiClient.get('/notification/preferences/');
    return response.data;
  },

  // Update notification preferences
  updatePreferences: async (data: any) => {
    const response = await apiClient.put('/notification/preferences/', data);
    return response.data;
  },

  // Get notification types
  getNotificationTypes: async (): Promise<{ types: string[], type_descriptions: Record<string, string> }> => {
    const response = await apiClient.get('/notifications/types/');
    return response.data;
  },

  // Get property-related notifications
  getPropertyNotifications: async (params?: any) => {
    const response = await apiClient.get('/notifications/property_notifications/', { params });
    return response.data;
  },
  
  createTestNotification: async (data: {
    notification_type: string;
    title: string;
    message: string;
  }) => {
    // Check if this endpoint exists in your Django backend
    const response = await apiClient.post('/notifications/test/', data);
    return response.data;
  },

  // Create property approval notification (admin only)
  createPropertyApprovalNotification: async (propertyId: number, action: 'approve' | 'reject' | 'request_changes', notes?: string) => {
    // Check if this endpoint exists or use the admin approval endpoint directly
    const response = await apiClient.post('/admin/property-approval/', {
      property_id: propertyId,
      action,
      notes
    });
    return response.data;
  }
};