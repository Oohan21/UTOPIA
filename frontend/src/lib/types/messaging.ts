// lib/types/messaging.ts
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_picture?: string;
  user_type: string;
}

export interface Message {
  id: number;
  sender: User;
  receiver: User;
  content: string;
  attachment?: string;
  is_read: boolean;
  created_at: string;
  is_my_message: boolean;
  formatted_time: string;
  thread_last_message?: number; 
  subject?: string;
}

export interface Conversation {
  id: number;
  participants: User[];
  other_user: User;
  last_message_content: string;
  last_message_time: string;
  unread_count: number;
  updated_at: string;
  subject?: string;
}

export interface ApiResponse<T> {
  results?: T[];
  count?: number;
  next?: string;
  previous?: string;
}

export interface SendMessageData {
  receiver: number;
  content: string;
  attachment?: File;
  message_type?: string;
  subject?: string;
  property?: number;
}

export interface ConversationState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface MessageNotification {
  id: number;
  title: string;
  message: string;
  data: {
    message_id: number;
    sender_id: number;
    sender_name: string;
    thread_id?: number;
  };
  created_at: string;
}