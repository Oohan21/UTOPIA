'use client'

import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { adminApi } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { 
  Bell,
  Send,
  Users,
  Home,
  AlertCircle,
  Mail,
  MessageSquare,
  TrendingDown,
  Star,
  Filter,
  Download,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const NOTIFICATION_TYPES = [
  { value: 'property_match', label: 'Property Match' },
  { value: 'price_change', label: 'Price Change' },
  { value: 'new_listing', label: 'New Listing' },
  { value: 'inquiry_response', label: 'Inquiry Response' },
  { value: 'system', label: 'System Notification' },
  { value: 'promotional', label: 'Promotional' },
]

const USER_TYPES = [
  { value: 'all', label: 'All Users' },
  { value: 'buyer', label: 'Buyers' },
  { value: 'seller', label: 'Sellers' },
  { value: 'agent', label: 'Agents' },
  { value: 'landlord', label: 'Landlords' },
  { value: 'premium', label: 'Premium Users' },
]

export default function AdminNotificationsPage() {
  const [notificationForm, setNotificationForm] = useState({
    notification_type: 'system',
    user_type: 'all',
    title: '',
    message: '',
    target_users: [] as number[],
    data: {}
  })

  const [filters, setFilters] = useState({
    search: '',
    notification_type: '',
    start_date: '',
    end_date: '',
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers({ page_size: 100 }),
  })

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      // In a real app, this would call an API endpoint
      // For now, simulate API call
      return new Promise(resolve => setTimeout(() => resolve({ success: true }), 2000))
    },
    onSuccess: () => {
      toast.success('Notification sent successfully!')
      setNotificationForm({
        notification_type: 'system',
        user_type: 'all',
        title: '',
        message: '',
        target_users: [],
        data: {}
      })
    },
    onError: () => {
      toast.error('Failed to send notification')
    },
  })

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!notificationForm.title || !notificationForm.message) {
      toast.error('Title and message are required')
      return
    }

    sendNotificationMutation.mutate(notificationForm)
  }

  const handleUserSelection = (userIds: number[]) => {
    setNotificationForm(prev => ({
      ...prev,
      target_users: userIds
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Management</h1>
          <p className="text-muted-foreground">
            Send and manage system notifications
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Send Notification Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notification_type">Notification Type</Label>
                <Select
                  options={NOTIFICATION_TYPES}
                  value={notificationForm.notification_type}
                  onValueChange={(value) => setNotificationForm(prev => ({ ...prev, notification_type: value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_type">Target Audience</Label>
                <Select
                  options={USER_TYPES}
                  value={notificationForm.user_type}
                  onValueChange={(value) => setNotificationForm(prev => ({ ...prev, user_type: value }))}
                />
              </div>

              {notificationForm.user_type === 'specific' && (
                <div className="space-y-2">
                  <Label>Select Specific Users</Label>
                  <div className="max-h-40 overflow-y-auto rounded-lg border p-2">
                    {usersLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      usersData?.results?.map((user: any) => (
                        <div key={user.id} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            id={`user-${user.id}`}
                            checked={notificationForm.target_users.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleUserSelection([...notificationForm.target_users, user.id])
                              } else {
                                handleUserSelection(notificationForm.target_users.filter(id => id !== user.id))
                              }
                            }}
                          />
                          <label htmlFor={`user-${user.id}`} className="text-sm">
                            {user.email} ({user.user_type})
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Notification title"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Notification message"
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={sendNotificationMutation.isPending}
              >
                {sendNotificationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Notification
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Email Sent</span>
                  </div>
                  <p className="text-2xl font-bold">1,234</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Push Sent</span>
                  </div>
                  <p className="text-2xl font-bold">4,567</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">Open Rate</span>
                  </div>
                  <p className="text-2xl font-bold">68%</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium">Click Rate</span>
                  </div>
                  <p className="text-2xl font-bold">24%</p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-medium">Notification Types Breakdown</h4>
                <div className="space-y-3">
                  {NOTIFICATION_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {type.value === 'property_match' && <Home className="h-4 w-4" />}
                        {type.value === 'price_change' && <TrendingDown className="h-4 w-4" />}
                        {type.value === 'new_listing' && <Star className="h-4 w-4" />}
                        {type.value === 'inquiry_response' && <MessageSquare className="h-4 w-4" />}
                        {type.value === 'system' && <AlertCircle className="h-4 w-4" />}
                        <span className="text-sm">{type.label}</span>
                      </div>
                      <span className="font-medium">245</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notification History</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample notification history items */}
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">System Maintenance Announcement</h4>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        System
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      System maintenance scheduled for Sunday, 10:00 PM - 2:00 AM
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span>Sent: Dec 15, 2023 2:30 PM</span>
                      <span>• To: All Users</span>
                      <span>• Opened: 1,234 (78%)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      Email
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800">
                      Push
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}