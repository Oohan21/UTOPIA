import apiClient from './client'

export const notificationApi = {
    // Get all notifications
    getNotifications: async (params?: any) => {
        const response = await apiClient.get('/notifications/', { params })
        return response.data
    },

    // Get unread notifications count
    getUnreadCount: async (): Promise<{ unread_count: number }> => {
        const response = await apiClient.get('/notifications/unread/')
        return response.data
    },

    // Get a single notification
    getNotification: async (notificationId: number) => {
        const response = await apiClient.get(`/notifications/${notificationId}/`)
        return response.data
    },

    // Mark notification as read
    markAsRead: async (notificationId: number) => {
        const response = await apiClient.patch(`/notifications/${notificationId}/`, {
            is_read: true
        })
        return response.data
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        const response = await apiClient.post('/notifications/mark_all_read/')
        return response.data
    },

    // Delete notification
    deleteNotification: async (notificationId: number) => {
        await apiClient.delete(`/notifications/${notificationId}/`)
    },

    // Get notification preferences
    getPreferences: async () => {
        const response = await apiClient.get('/notifications/preferences/')
        return response.data
    },

    // Update notification preferences
    updatePreferences: async (data: any) => {
        const response = await apiClient.put('/notifications/preferences/', data)
        return response.data
    },

    // Create test notification
    createTestNotification: async (data: {
        notification_type: string
        title: string
        message: string
    }) => {
        const response = await apiClient.post('/notifications/test/', data)
        return response.data
    }
}