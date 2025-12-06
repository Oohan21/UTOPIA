import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { notificationApi } from '@/lib/api/notification'
import { Notification } from '@/lib/types/notification'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  lastFetched: number | null
  
  // Actions
  fetchNotifications: (params?: any) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (notificationId: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: number) => Promise<void>
  addNotification: (notification: Notification) => void
  clearAll: () => void
  
  // Real-time
  subscribeToNotifications: () => () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchNotifications: async (params?: any) => {
        set({ isLoading: true, error: null })
        try {
          const response = await notificationApi.getNotifications(params)
          set({
            notifications: response.results || response,
            isLoading: false,
            lastFetched: Date.now()
          })
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || 'Failed to fetch notifications',
            isLoading: false
          })
        }
      },

      fetchUnreadCount: async () => {
        try {
          const response = await notificationApi.getUnreadCount()
          set({ unreadCount: response.unread_count })
        } catch (error) {
          console.error('Failed to fetch unread count:', error)
        }
      },

      markAsRead: async (notificationId: number) => {
        try {
          await notificationApi.markAsRead(notificationId)
          set(state => ({
            notifications: state.notifications.map(notif =>
              notif.id === notificationId 
                ? { ...notif, is_read: true, read_at: new Date().toISOString() }
                : notif
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }))
        } catch (error) {
          console.error('Failed to mark as read:', error)
        }
      },

      markAllAsRead: async () => {
        try {
          await notificationApi.markAllAsRead()
          set(state => ({
            notifications: state.notifications.map(notif => ({
              ...notif,
              is_read: true,
              read_at: new Date().toISOString()
            })),
            unreadCount: 0
          }))
        } catch (error) {
          console.error('Failed to mark all as read:', error)
        }
      },

      deleteNotification: async (notificationId: number) => {
        try {
          await notificationApi.deleteNotification(notificationId)
          const notification = get().notifications.find(n => n.id === notificationId)
          set(state => ({
            notifications: state.notifications.filter(n => n.id !== notificationId),
            unreadCount: notification?.is_read ? state.unreadCount : Math.max(0, state.unreadCount - 1)
          }))
        } catch (error) {
          console.error('Failed to delete notification:', error)
        }
      },

      addNotification: (notification: Notification) => {
        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadCount: notification.is_read ? state.unreadCount : state.unreadCount + 1
        }))
      },

      clearAll: () => {
        set({
          notifications: [],
          unreadCount: 0,
          lastFetched: null
        })
      },

      subscribeToNotifications: () => {
        // In a real app, this would connect to WebSocket or SSE
        // For now, we'll use polling
        const interval = setInterval(() => {
          const { lastFetched } = get()
          // Refresh every 30 seconds if needed
          if (!lastFetched || Date.now() - lastFetched > 30000) {
            get().fetchUnreadCount()
          }
        }, 10000)

        return () => clearInterval(interval)
      }
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Store only last 50
        unreadCount: state.unreadCount
      })
    }
  )
)