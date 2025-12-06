'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Check, X, AlertCircle, Home, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils/formatDate'

interface Notification {
  id: number
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
  data?: any
}

interface NotificationListProps {
  userId?: number
}

export default function NotificationList({ userId }: NotificationListProps) {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        {
          id: 1,
          title: 'New Property Match',
          message: 'A new property matching your search criteria has been listed.',
          notification_type: 'property_match',
          is_read: false,
          created_at: new Date().toISOString(),
          data: { property_id: 123 }
        },
        {
          id: 2,
          title: 'Price Change Alert',
          message: 'A property you saved has reduced its price by 10%.',
          notification_type: 'price_change',
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          data: { property_id: 456, old_price: 5000000, new_price: 4500000 }
        },
        {
          id: 3,
          title: 'Inquiry Response',
          message: 'The owner has responded to your inquiry.',
          notification_type: 'inquiry_response',
          is_read: false,
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        }
      ]
    }
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      // Implement API call to mark as read
      console.log('Marking notification as read:', notificationId)
      return notificationId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      // Implement API call to delete
      console.log('Deleting notification:', notificationId)
      return notificationId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
    }
  })

  const markAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.is_read) {
        markAsReadMutation.mutate(notification.id)
      }
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'property_match':
        return <Home className="h-5 w-5 text-blue-500" />
      case 'price_change':
        return <DollarSign className="h-5 w-5 text-green-500" />
      case 'inquiry_response':
        return <AlertCircle className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <Card>
      <div className="flex items-center justify-between border-b p-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-white">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>
      <CardContent className="p-0">
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
            <h4 className="mt-4 text-lg font-semibold">No notifications</h4>
            <p className="text-muted-foreground">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 ${!notification.is_read ? 'bg-blue-50' : ''}`}
              >
                <div className="mt-1">
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {notification.data && (
                    <div className="mt-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}