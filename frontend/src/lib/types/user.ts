// lib/types/user.ts
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'admin' | 'user';
  phone_number: string;
  profile_picture?: string | null;
  bio?: string;
  language_preference: 'en' | 'am';
  currency_preference: 'ETB' | 'USD';
  is_verified: boolean;
  is_active: boolean;
  is_premium: boolean;
  occupation?: string;
  company?: string;
  profile?: UserProfile;
  profile_completion: number;
  created_at: string;
  updated_at: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  is_approved?: boolean;
  premium_expiry?: string;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  notification_enabled?: boolean;
  username?: string;
  verification_token?: string;
  verification_sent_at?: string;
  last_login_ip?: string;
  registration_ip?: string;
}

export interface UserProfile {
  id: number;
  user: number;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  address?: string;
  city?: string;
  sub_city?: string;
  postal_code?: string;
  occupation?: string;
  company?: string;
  website?: string;
  facebook_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  preferred_property_types?: string[];
  budget_range_min?: number;
  budget_range_max?: number;
  preferred_locations?: string[];
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  user_type?: 'admin' | 'user';
  password: string;
  password2: string;
}