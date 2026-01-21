// lib/types/inquiry.ts
export interface Inquiry {
  id: string;
  property_info: {  // Changed from "property" to "property_info"
    id: number;
    title: string;
    price_etb: number;
    monthly_rent?: number;
    listing_type: 'sale' | 'rent' | 'for_sale' | 'for_rent';
    city?: string;  
    sub_city?: string;  
    images?: Array<{ image: string }>;
    property_type?: string;
  };
  user?: number | {  // API returns number OR user_info object
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    user_type: 'admin' | 'user';
    is_verified: boolean;
    profile_picture?: string;
  };
  user_info?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    user_type: 'admin' | 'user';
    is_verified: boolean;
    profile_picture?: string;
  };
  inquiry_type: 'general' | 'viewing' | 'price' | 'details' | 'availability';
  message: string;
  contact_preference: 'call' | 'email' | 'whatsapp' | 'any';

  full_name?: string;
  email?: string;
  phone?: string;

  status: 'pending' | 'contacted' | 'viewing_scheduled' | 'follow_up' | 'closed' | 'spam';
  priority: 'low' | 'medium' | 'high' | 'urgent';

  assigned_to?: number | {  // API returns number OR assigned_to_info object
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    user_type: string;
  };
  assigned_to_info?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    user_type: string;
  };

  response_sent: boolean;
  response_notes?: string;
  responded_at?: string;
  response_by?: number | null;
  response_by_info?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };

  scheduled_viewing?: string;
  viewing_address?: string;
  tags: string[];
  internal_notes?: string;
  follow_up_date?: string;
  category: 'buyer' | 'seller' | 'renter' | 'landlord' | 'general';
  source: 'website' | 'phone' | 'email' | 'whatsapp' | 'walk_in' | 'referral' | 'mobile_app';

  is_urgent: boolean;
  response_time?: number;
  user_display_name?: string;
  status_display?: string;

  ip_address?: string;
  user_agent?: string;
  session_id?: string;

  created_at: string;
  updated_at: string;
}

// Helper type to normalize the API response
export type NormalizedInquiry = Omit<Inquiry, 'property_info' | 'user' | 'assigned_to' | 'response_by'> & {
  property: Inquiry['property_info'];
  user: Inquiry['user_info'];
  assigned_to: Inquiry['assigned_to_info'];
  response_by: Inquiry['response_by_info'];
};

export interface InquiryFilters {
  // Status filters
  status?: string | string[];
  priority?: string;
  inquiry_type?: string;
  category?: string;
  source?: string;
  
  // Assignment filters
  assigned_to?: number | 'unassigned' | null;
  assigned_to__isnull?: boolean;
  
  // Property filters
  property__city?: number | string;
  property__sub_city?: number | string;
  property__property_type?: string;
  property__listing_type?: string;
  
  // Date filters
  created_at__gte?: string;
  created_at__lte?: string;
  created_at__date?: string;
  responded_at__gte?: string;
  responded_at__lte?: string;
  responded_at__date?: string;
  responded_at__isnull?: boolean;
  follow_up_date__gte?: string;
  follow_up_date__lte?: string;
  follow_up_date__date?: string;
  follow_up_date__isnull?: boolean;
  
  // Response filters
  response_sent?: boolean;
  
  // User filters
  user?: number;
  
  // Search and pagination
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
  [key: string]: any;
}

export interface InquiryDashboardStats {
  overview: {
    total: number;
    new_today: number;
    new_this_week: number;
    unassigned: number;
    urgent: number;
  };
  status_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  performance: {
    avg_response_time_hours: number;
    response_rate: number;
    conversion_rate: number;
  };
  recent_activities: Array<{
    id: string;
    property__title: string;
    status: string;
    priority: string;
    created_at: string;
    user_display_name: string;
  }>;
  admin_stats?: Record<string, {
    total: number;
    closed: number;
    completion_rate: number;
  }>;
}

export interface CreateInquiryData {
  property: number;
  inquiry_type: string;
  message: string;
  contact_preference: string;
  full_name?: string;
  email?: string;
  phone?: string;
  priority?: string;
  category?: string;
  source?: string;
  tags?: string[];
}

export interface UpdateInquiryData {
  status?: string;
  priority?: string;
  assigned_to?: number | null;
  response_notes?: string;
  scheduled_viewing?: string;
  viewing_address?: string;
  tags?: string[];
  internal_notes?: string;
  follow_up_date?: string;
  category?: string;
}

export interface BulkUpdateInquiryData {
  inquiry_ids: string[];
  status?: string;
  priority?: string;
  assigned_to?: number | null;
  tags?: string[];
}

export interface ScheduleViewingData {
  viewing_time: string;
  address?: string;
  notes?: string;
}

export interface InquiryActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user: string;
  metadata: Record<string, any>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  total_pages?: number;
  current_page?: number;
}

export interface InquiryStats {
  overview: {
    total: number;
    new_today: number;
    new_this_week: number;
    unassigned: number;
    urgent: number;
  };
  status_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  performance: {
    avg_response_time_hours: number;
    response_rate: number;
    conversion_rate: number;
  };
  recent_activities: Array<{
    id: string;
    property__title: string;
    status: string;
    priority: string;
    created_at: string;
    user_display_name: string;
  }>;
  admin_stats?: Record<string, {
    total: number;
    closed: number;
    completion_rate: number;
  }>;
}

export interface ExportOptions {
  format?: 'csv' | 'json';
  include_columns?: string[];
  date_format?: string;
}

export interface InquiryMessage {
  id: number;
  sender: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    user_type: string;
  };
  receiver: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    user_type: string;
  };
  content: string;
  attachment?: string;
  created_at: string;
  is_read: boolean;
  read_at?: string;
  message_type?: string;
}