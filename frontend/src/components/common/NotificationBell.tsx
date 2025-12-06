'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, Trash2, Settings, X } from 'lucide-react'
import { useNotificationStore } from '@/lib/store/notificationStore'
import { Button } from '@/components/ui/Button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Badge } from '@/components/ui/Badge'
import { formatDistanceToNow } from 'date-fns'

export function NotificationBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    subscribeToNotifications
  } = useNotificationStore()

  useEffect(() => {
    fetchUnreadCount()
    fetchNotifications({ page_size: 10 })
    const unsubscribe = subscribeToNotifications()
    return unsubscribe
  }, [fetchUnreadCount, fetchNotifications, subscribeToNotifications])

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification.id)
    
    // Navigate based on notification type
    if (notification.content_type && notification.object_id) {
      switch (notification.content_type) {
        case 'property':
          router.push(`/listings/${notification.object_id}`)
          break
        case 'inquiry':
          router.push(`/account/inquiries/${notification.object_id}`)
          break
        case 'comparison':
          router.push(`/comparison/${notification.object_id}`)
          break
      }
    }
    
    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'property_match':
        return '🏠'
      case 'price_change':
        return '📉'
      case 'new_listing':
        return '✨'
      case 'inquiry_response':
        return '💬'
      case 'system':
        return '⚙️'
      case 'promotional':
        return '🎁'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'property_match':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'price_change':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'new_listing':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'inquiry_response':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications ({unreadCount} unread)</span>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline"
                title="Mark all as read"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => router.push('/account/notifications')}
              className="text-xs text-primary hover:underline"
              title="Notification settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No notifications</p>
          </div>
        ) : (
          <>
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex w-full items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getNotificationIcon(notification.notification_type)}</span>
                    <div>
                      <p className="text-sm font-medium">{notification.title}</p>
                      <Badge className={`text-xs ${getNotificationColor(notification.notification_type)}`}>
                        {notification.notification_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notification.id)
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {notification.message}
                </p>
                
                <div className="flex w-full items-center justify-between text-xs text-gray-500">
                  <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                  {!notification.is_read && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            
            {notifications.length > 10 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="justify-center text-center text-primary"
                  onClick={() => {
                    router.push('/account/notifications')
                    setIsOpen(false)
                  }}
                >
                  View all notifications
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}