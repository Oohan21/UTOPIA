export interface Notification {
  id: number
  user: number
  notification_type: 'property_match' | 'price_change' | 'new_listing' | 'inquiry_response' | 'system' | 'promotional'
  title: string
  message: string
  data: Record<string, any>
  content_type: string | null
  object_id: number | null
  is_read: boolean
  is_sent: boolean
  sent_via: 'email' | 'sms' | 'push' | 'in_app'
  created_at: string
  read_at: string | null
  sent_at: string | null
}

export interface UnreadCount {
  unread_count: number
}

export interface NotificationPreferences {
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  property_matches: boolean
  price_changes: boolean
  new_listings: boolean
  inquiry_responses: boolean
  system_alerts: boolean
  promotional: boolean
}

export interface NotificationFilter {
  is_read?: boolean
  notification_type?: string
  start_date?: string
  end_date?: string
  search?: string
}