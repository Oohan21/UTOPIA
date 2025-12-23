import apiClient, { uploadClient } from './client';
import { User, LoginCredentials, RegisterData } from '@/lib/types/user';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/auth/login/', credentials);

    if (response.data.access && response.data.refresh) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register/', data);

    if (response.data.access && response.data.refresh) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout/');

    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me/');

    // Store user data in localStorage
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
  },

  // Regular profile update (JSON data)
  updateProfile: async (data: Partial<User>): Promise<User> => {
    try {
      console.log('Updating profile with data:', data);

      // Handle FormData for file uploads
      if (data instanceof FormData) {
        const response = await uploadClient.patch('/auth/update/', data);
        return response.data;
      } else {
        // Handle regular JSON data
        const response = await apiClient.patch('/auth/update/', data);
        return response.data;
      }
    } catch (error: any) {
      console.error('Profile update error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Profile picture upload (FormData)
  updateProfilePicture: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('profile_picture', file, file.name);

    console.log('Uploading profile picture:', file.name, file.size);

    const response = await uploadClient.patch('/auth/update/', formData);
    return response.data;
  },

  // Remove profile picture
  removeProfilePicture: async (): Promise<User> => {
    const response = await apiClient.patch('/auth/update/', {
      profile_picture: null,
    });
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });

    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
    }

    return response.data;
  },

  // Verify email
  verifyEmail: async (token: string) => {
    const response = await apiClient.post('/auth/verify-email/', { token });
    return response.data;
  },

  // Resend verification email
  resendVerificationEmail: async (email: string) => {
    const response = await apiClient.post('/auth/resend-verification/', { email });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/forgot-password/', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password/', {
      token,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
    return response.data;
  },

  validateResetToken: async (token: string): Promise<{ valid: boolean; email?: string; error?: string }> => {
    const response = await apiClient.post('/auth/validate-reset-token/', { token });
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  // Get CSRF token (for forms that need it)
  getCSRFToken: async () => {
    const response = await apiClient.get('/auth/csrf/');
    return response.data;
  },

  // Get user profile completion percentage
  getProfileCompletion: async (): Promise<number> => {
    const response = await apiClient.get('/auth/profile-completion/');
    return response.data.profile_completion;
  },

  // Get user activity stats
  getUserStats: async () => {
    const response = await apiClient.get('/auth/stats/');
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('access_token');
    return !!token;
  },

  // Get stored user data
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        return null;
      }
    }
    return null;
  },

  // Clear stored user data
  clearStoredUser: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  // Initialize authentication from stored tokens
  initializeAuth: async (): Promise<User | null> => {
    if (authApi.isAuthenticated()) {
      try {
        const user = await authApi.getCurrentUser();
        return user;
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        authApi.clearStoredUser();
        return null;
      }
    }
    return null;
  }
};