'use client'

import React, { useState, useEffect } from 'react'
import Header from "@/components/common/Header/Header";
import { useNotificationStore } from '@/lib/store/notificationStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { 
  Bell,
  BellOff,
  Mail,
  MessageSquare,
  CheckCircle,
  Trash2,
  Filter,
  Settings,
  RefreshCw,
  Loader2,
  Home,
  TrendingDown,
  AlertCircle,
  Star
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    property_matches: true,
    price_changes: true,
    new_listings: true,
    inquiry_responses: true,
    system_alerts: true,
    promotional: false,
  })

  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchUnreadCount
  } = useNotificationStore()

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [fetchNotifications, fetchUnreadCount])

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.is_read
      case 'property':
        return notification.notification_type.includes('property')
      case 'system':
        return notification.notification_type === 'system'
      case 'inquiry':
        return notification.notification_type === 'inquiry_response'
      default:
        return true
    }
  })

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark notifications as read')
    }
  }

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      // Note: In a real app, you'd have an API endpoint for this
      toast.success('All notifications deleted')
    }
  }

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    // In a real app, save to API
    toast.success('Preferences updated')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'property_match':
        return <Home className="h-5 w-5" />
      case 'price_change':
        return <TrendingDown className="h-5 w-5" />
      case 'new_listing':
        return <Star className="h-5 w-5" />
      case 'inquiry_response':
        return <MessageSquare className="h-5 w-5" />
      case 'system':
        return <AlertCircle className="h-5 w-5" />
      case 'promotional':
        return <Bell className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
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
    <div className="container mx-auto p-6 space-y-6">
      <Header/>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your notifications and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchNotifications()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Stats Cards */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Notifications</p>
                <p className="text-3xl font-bold">{notifications.length}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-3xl font-bold">{unreadCount}</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                <BellOff className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Property Alerts</p>
                <p className="text-3xl font-bold">
                  {notifications.filter(n => n.notification_type.includes('property')).length}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <Home className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="property">Property</TabsTrigger>
          <TabsTrigger value="inquiry">Inquiry</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <NotificationsList
            notifications={filteredNotifications}
            isLoading={isLoading}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getIcon={getNotificationIcon}
            getColor={getNotificationColor}
          />
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <NotificationsList
            notifications={filteredNotifications}
            isLoading={isLoading}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getIcon={getNotificationIcon}
            getColor={getNotificationColor}
          />
        </TabsContent>

        <TabsContent value="property" className="space-y-4">
          <NotificationsList
            notifications={filteredNotifications}
            isLoading={isLoading}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getIcon={getNotificationIcon}
            getColor={getNotificationColor}
          />
        </TabsContent>

        <TabsContent value="inquiry" className="space-y-4">
          <NotificationsList
            notifications={filteredNotifications}
            isLoading={isLoading}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getIcon={getNotificationIcon}
            getColor={getNotificationColor}
          />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <NotificationsList
            notifications={filteredNotifications}
            isLoading={isLoading}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getIcon={getNotificationIcon}
            getColor={getNotificationColor}
          />
        </TabsContent>
      </Tabs>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-medium">Delivery Methods</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email_notifications"
                    checked={preferences.email_notifications}
                    onCheckedChange={(checked) => handlePreferenceChange('email_notifications', checked)}
                  />
                  <Label htmlFor="email_notifications" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sms_notifications"
                    checked={preferences.sms_notifications}
                    onCheckedChange={(checked) => handlePreferenceChange('sms_notifications', checked)}
                  />
                  <Label htmlFor="sms_notifications">SMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="push_notifications"
                    checked={preferences.push_notifications}
                    onCheckedChange={(checked) => handlePreferenceChange('push_notifications', checked)}
                  />
                  <Label htmlFor="push_notifications">Push Notifications</Label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-medium">Notification Types</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="property_matches"
                    checked={preferences.property_matches}
                    onCheckedChange={(checked) => handlePreferenceChange('property_matches', checked)}
                  />
                  <Label htmlFor="property_matches" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Property Matches
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="price_changes"
                    checked={preferences.price_changes}
                    onCheckedChange={(checked) => handlePreferenceChange('price_changes', checked)}
                  />
                  <Label htmlFor="price_changes" className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Price Changes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="new_listings"
                    checked={preferences.new_listings}
                    onCheckedChange={(checked) => handlePreferenceChange('new_listings', checked)}
                  />
                  <Label htmlFor="new_listings" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    New Listings
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="inquiry_responses"
                    checked={preferences.inquiry_responses}
                    onCheckedChange={(checked) => handlePreferenceChange('inquiry_responses', checked)}
                  />
                  <Label htmlFor="inquiry_responses" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Inquiry Responses
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="system_alerts"
                    checked={preferences.system_alerts}
                    onCheckedChange={(checked) => handlePreferenceChange('system_alerts', checked)}
                  />
                  <Label htmlFor="system_alerts" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    System Alerts
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="promotional"
                    checked={preferences.promotional}
                    onCheckedChange={(checked) => handlePreferenceChange('promotional', checked)}
                  />
                  <Label htmlFor="promotional" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Promotional
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Reusable Notifications List Component
function NotificationsList({ 
  notifications, 
  isLoading, 
  onMarkAsRead, 
  onDelete,
  getIcon,
  getColor 
}: any) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
          <p className="text-sm text-gray-500">You're all caught up!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification: any) => (
        <Card key={notification.id} className={`${!notification.is_read ? 'border-blue-200 dark:border-blue-800' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`rounded-full p-2 ${getColor(notification.notification_type)}`}>
                  {getIcon(notification.notification_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{notification.title}</h4>
                    <Badge className={getColor(notification.notification_type)}>
                      {notification.notification_type.replace('_', ' ')}
                    </Badge>
                    {!notification.is_read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {notification.message}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>{format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}</span>
                    {notification.data?.property_title && (
                      <span>• Property: {notification.data.property_title}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(notification.id)}
                    title="Mark as read"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(notification.id)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}