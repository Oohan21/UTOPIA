// lib/types/messaging.ts
export interface Message {
  id: number;
  sender: User;
  receiver: User;
  property?: Property;
  inquiry?: number;
  message_type: 'general' | 'viewing' | 'offer' | 'negotiation' | 'question' | 'document';
  subject: string;
  content: string;
  attachment?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  thread_last_message?: number;
  formatted_time?: string;
  is_my_message?: boolean;
}

export interface MessageThread {
  id: number;
  participants: User[];
  property?: Property;
  inquiry?: number;
  subject: string;
  last_message?: Message;
  is_active: boolean;
  is_starred?: boolean;
  is_pinned?: boolean;
  is_muted?: boolean;
  unread_count: number;
  participant_info?: ParticipantInfo;
  formatted_last_activity?: string;
  created_at: string;
  updated_at: string;
}

export interface ParticipantInfo {
  id: number;
  name: string;
  email: string;
  profile_picture?: string;
  user_type: string;
  is_verified: boolean;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
  user_type: 'admin' | 'agent' | 'buyer' | 'seller' | 'user';
  is_verified: boolean;
  phone_number?: string;
}

export interface Property {
  id: number;
  title: string;
  price_etb: number;
  city?: { name: string };
  sub_city?: { name: string };
  main_image?: string;
}

export interface QuickContact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
  user_type: string;
  is_verified: boolean;
  unread_count: number;
  last_message_at: string;
  thread_id?: number;
  property?: {
    id: number;
    title: string;
  };
}

export interface MessageStats {
  response_rate: number;
  avg_response_time: string;
  weekly_activity: number[];
  top_contacts: Array<{
    id: number;
    name: string;
    email: string;
    count: number;
    profile_picture?: string;
  }>;
  total_messages: number;
  unread_count: number;
  active_conversations: number;
  total_threads: number;
  weekly_activity_count: number;
}

export interface CreateMessageData {
  receiver: number;
  property?: number;
  inquiry?: number;
  message_type: string;
  subject?: string;
  content: string;
  attachment?: File;
}

export interface ThreadMessageData {
  content: string;
  attachment?: File;
  message_type?: string;
}

export interface MessageAnalytics {
  response_rate: number;
  avg_response_time: string;
  weekly_activity: number[];
  top_contacts: Array<{
    id: number;
    name: string;
    email: string;
    count: number;
    profile_picture?: string;
  }>;
  total_messages: number;
  unread_count: number;
  active_conversations: number;
  total_threads: number;
  weekly_activity_count: number;
}

export interface BulkMessageAction {
  message_ids: number[];
  action: 'mark_read' | 'delete';
}

export interface ThreadFilters {
  property?: number;
  inquiry?: number;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface MessageFilters {
  thread?: number;
  property?: number;
  inquiry?: number;
  unread?: boolean;
  page?: number;
  page_size?: number;
}

export interface MessageComposerState {
  content: string;
  attachment?: File;
  message_type: string;
  subject?: string;
  receiver?: number;
  property?: number;
  inquiry?: number;
}

export interface MessageNotification {
  id: number;
  type: 'message_received' | 'message_read' | 'thread_update';
  title: string;
  message: string;
  data?: Record<string, any>;
  created_at: string;
  is_read: boolean;
}