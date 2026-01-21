import apiClient, { uploadClient, sessionApi, ensureCSRFToken } from './client'
import { User, LoginCredentials, RegisterData } from '@/lib/types/user'

export const sessionAuth = {
  // Initialize session on app load
  initialize: async (): Promise<User | null> => {
    try {
      const hasSession = await sessionApi.checkAuth()

      if (!hasSession) {
        sessionAuth.clear()
        return null
      }

      // Get current user
      const user = await sessionApi.getCurrentUser()

      if (user) {
        sessionStorage.setItem('user', JSON.stringify(user))
        return processUserData(user)
      }

      return null
    } catch (error) {
      console.error('Session initialization error:', error)
      sessionAuth.clear()
      return null
    }
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      return await sessionApi.checkAuth()
    } catch {
      return false
    }
  },

  // Get stored user (from sessionStorage)
  getStoredUser: (): User | null => {
    if (typeof window === 'undefined') return null

    const userStr = sessionStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        return processUserData(user)
      } catch {
        return null
      }
    }
    return null
  },

  // Clear all session data
  clear: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('user')
      localStorage.removeItem('user')
      sessionApi.clear()
    }
  }
}

// ============ AUTH API ============
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; message: string }> => {
    try {
      // Ensure CSRF token is available BEFORE login
      const token = await ensureCSRFToken()
      console.log('Login CSRF token:', token ? 'Available' : 'Not available')

      const response = await apiClient.post('/auth/login/', credentials)

      if (response.data.user) {
        const userData = processUserData(response.data.user)
        sessionStorage.setItem('user', JSON.stringify(userData))
        return {
          user: userData,
          message: response.data.message || 'Login successful'
        }
      }

      throw new Error('Invalid response from server')
    } catch (error: any) {
      console.error('Login error:', error)

      if (error.response?.data?.requires_verification) {
        throw {
          ...error,
          requiresVerification: true,
          userId: error.response.data.user_id,
          email: error.response.data.email
        }
      }

      throw error
    }
  },

  register: async (data: RegisterData): Promise<{
    user: User;
    message: string;
    requiresVerification: boolean
  }> => {
    try {
      await sessionApi.initialize()

      const response = await apiClient.post('/auth/register/', data)

      const userData = processUserData(response.data.user)
      sessionStorage.setItem('user', JSON.stringify(userData))

      return {
        user: userData,
        message: response.data.message,
        requiresVerification: response.data.requires_verification || false
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      throw error
    }
  },

  logout: async (): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post('/auth/logout/')

      // Clear all session data
      sessionAuth.clear()

      return {
        message: response.data.message || 'Logout successful'
      }
    } catch (error: any) {
      console.error('Logout error:', error)
      // Still clear local data even if API call fails
      sessionAuth.clear()
      throw error
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await apiClient.get('/auth/current-user/')

      if (response.data) {
        const userData = processUserData(response.data)
        sessionStorage.setItem('user', JSON.stringify(userData))
        return userData
      }

      throw new Error('Not authenticated')
    } catch (error: any) {
      console.error('Get current user error:', error)

      if (error.response?.status === 401) {
        sessionAuth.clear()
      }

      throw error
    }
  },

  updateProfile: async (data: Partial<User> | FormData): Promise<User> => {
    try {
      let response

      if (data instanceof FormData) {
        response = await uploadClient.patch('/auth/update/', data)
      } else {
        response = await apiClient.patch('/auth/update/', data)
      }

      const userData = processUserData(response.data)
      sessionStorage.setItem('user', JSON.stringify(userData))

      return userData
    } catch (error: any) {
      console.error('Profile update error:', error)
      throw error
    }
  },

  updateProfilePicture: async (file: File): Promise<User> => {
    const formData = new FormData()
    formData.append('profile_picture', file)

    const response = await uploadClient.patch('/auth/update/', formData)

    const userData = processUserData(response.data)
    sessionStorage.setItem('user', JSON.stringify(userData))

    return userData
  },

  removeProfilePicture: async (): Promise<User> => {
    const response = await apiClient.patch('/auth/update/', {
      profile_picture: null,
    })

    const userData = processUserData(response.data)
    sessionStorage.setItem('user', JSON.stringify(userData))

    return userData
  },

  verifyEmail: async (token: string): Promise<{
    success: boolean
    message: string
    user?: User
  }> => {
    const response = await apiClient.post('/auth/verify-email/', { token })

    if (response.data.user) {
      const userData = processUserData(response.data.user)
      sessionStorage.setItem('user', JSON.stringify(userData))
    }

    return response.data
  },

  resendVerificationEmail: async (): Promise<{
    success: boolean;
    message: string
  }> => {
    const response = await apiClient.post('/auth/resend-verification/')
    return response.data
  },

  checkVerificationStatus: async (): Promise<{
    email_verified: boolean
    phone_verified: boolean
    is_verified: boolean
    verification_sent_at: string
    can_resend: boolean
  }> => {
    const response = await apiClient.get('/auth/verification-status/')
    return response.data
  },

  forgotPassword: async (email: string): Promise<{
    success: boolean
    message: string
  }> => {
    const response = await apiClient.post('/auth/forgot-password/', { email })
    return response.data
  },

  resetPassword: async (
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{
    success: boolean
    message: string
  }> => {
    const response = await apiClient.post('/auth/reset-password/', {
      token,
      new_password: newPassword,
      confirm_password: confirmPassword
    })
    return response.data
  },

  validateResetToken: async (token: string): Promise<{
    valid: boolean;
    email?: string;
    error?: string
  }> => {
    const response = await apiClient.post('/auth/validate-reset-token/', { token })
    return response.data
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{
    success: boolean
    message: string
  }> => {
    const response = await apiClient.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    return response.data
  },

  getProfileCompletion: async (): Promise<number> => {
    const response = await apiClient.get('/auth/profile-completion/')
    return response.data.profile_completion
  },

  getUserStats: async () => {
    const response = await apiClient.get('/auth/dashboard/')
    return response.data
  },

  getUserActivities: async (pageSize: number = 10) => {
    const response = await apiClient.get('/auth/activities/', {
      params: {
        page_size: pageSize,
        ordering: '-created_at'
      }
    })
    return response.data
  },

  getActivitySummary: async () => {
    const response = await apiClient.get('/auth/activities/summary/')
    return response.data
  },

  createActivity: async (activityType: string, metadata: any = {}) => {
    const response = await apiClient.post('/auth/activities/create/', {
      activity_type: activityType,
      metadata: metadata
    })
    return response.data
  },

  // Initialize auth on app load
  initialize: async (): Promise<User | null> => {
    return await sessionAuth.initialize()
  },

  checkAuth: async (): Promise<boolean> => {
    try {
      // Try using current-user endpoint
      const response = await apiClient.get('/auth/current-user/')
      return response.status === 200
    } catch (error: any) {
      // If that fails, try check-session as fallback
      try {
        const response = await apiClient.get('/auth/check-session/')
        return response.data?.authenticated || false
      } catch {
        return false
      }
    }
  },

  // Get stored user
  getStoredUser: (): User | null => {
    return sessionAuth.getStoredUser()
  },

  // Clear auth
  clear: () => {
    sessionAuth.clear()
  }
}

// ============ HELPER FUNCTIONS ============
const processUserData = (userData: any): User => {
  if (!userData) return userData

  const processed = { ...userData }

  // Convert relative media URLs to absolute URLs
  if (processed.profile_picture) {
    if (processed.profile_picture.startsWith('/media/')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
      processed.profile_picture = `${baseUrl}${processed.profile_picture}`
    } else if (!processed.profile_picture.startsWith('http')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000'
      processed.profile_picture = `${baseUrl}${processed.profile_picture}`
    }
  }

  return processed
}