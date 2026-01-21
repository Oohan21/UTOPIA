export interface Notification {
  id: string;
  user: number;
  notification_type: 'property_match' | 'price_change' | 'new_listing' |
  'inquiry_response' | 'system' | 'promotional' |
  'property_approved' | 'property_rejected' | 'property_changes_requested';
  title: string;
  message: string;
  data: {
    property_id?: number;
    property_title?: string;
    action?: string;
    admin_user_id?: number;
    admin_name?: string;
    notes?: string;
    timestamp?: string;
    property_url?: string;
    edit_url?: string;
    [key: string]: any;
  };
  content_type: string | null;
  object_id: string | null;
  is_read: boolean;
  is_sent: boolean;
  sent_via: 'email' | 'sms' | 'push' | 'in_app';
  created_at: string;
  read_at: string | null;
  sent_at: string | null;
}

export interface UnreadCount {
  unread_count: number;
}

export interface NotificationPreferences {
  // Email notifications
  email_enabled: boolean;
  email_property_approved: boolean;
  email_property_rejected: boolean;
  email_property_changes: boolean;
  email_inquiry_response: boolean;
  email_messages: boolean;
  email_promotions: boolean;
  email_system: boolean;

  // Push notifications
  push_enabled: boolean;
  push_property_approved: boolean;
  push_property_rejected: boolean;
  push_property_changes: boolean;
  push_inquiry_response: boolean;
  push_messages: boolean;
  push_promotions: boolean;

  // SMS notifications
  sms_enabled: boolean;
  sms_urgent: boolean;

  // Frequency
  notification_frequency: 'immediate' | 'daily' | 'weekly';

  // Quiet hours
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export interface NotificationFilter {
  is_read?: boolean;
  notification_type?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface NotificationTypesResponse {
  types: string[];
  type_descriptions: Record<string, string>;
}