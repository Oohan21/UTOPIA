// lib/api/auth.ts - UPDATED
import apiClient, { uploadClient } from './client';
import { User, LoginCredentials, RegisterData } from '@/lib/types/user';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/auth/token/', credentials);
    
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
    const response = await apiClient.get('/users/me/');
    return response.data;
  },

  // Regular profile update (JSON data)
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put('/auth/update/', data);
    return response.data;
  },

  // Profile picture upload (FormData)
  updateProfilePicture: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('profile_picture', file, file.name);
    
    const response = await uploadClient.put('/auth/update/', formData);
    return response.data;
  },

  // Remove profile picture
  removeProfilePicture: async (): Promise<User> => {
    const response = await apiClient.put('/auth/update/', {
      profile_picture: null,
    });
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },
};