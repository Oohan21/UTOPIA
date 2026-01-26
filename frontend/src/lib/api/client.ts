// lib/api/client.ts - FIXED VERSION
import axios from 'axios'
import toast from 'react-hot-toast'

// Use relative API base in development so Next.js rewrites can proxy requests
// and keep requests same-origin (cookies and CSRF will work).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// ============ SESSION-BASED API CLIENT ============
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Let axios automatically read the CSRF cookie and set the header for XHR requests
apiClient.defaults.xsrfCookieName = 'csrftoken'
apiClient.defaults.xsrfHeaderName = 'X-CSRFToken'

// ============ FILE UPLOAD CLIENT ============
export const uploadClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

uploadClient.defaults.xsrfCookieName = 'csrftoken'
uploadClient.defaults.xsrfHeaderName = 'X-CSRFToken'

// ============ CSRF TOKEN MANAGEMENT ============
let csrfToken: string | null = null
let csrfInitialized = false

// Helper function to safely get CSRF token from cookies
const getCSRFTokenFromCookies = (): string | null => {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  for (let cookie of cookies) {
    cookie = cookie.trim()
    // check common names used by server
    if (cookie.startsWith('csrftoken=')) {
      return cookie.substring('csrftoken='.length)
    }
    if (cookie.startsWith('utopia_csrftoken=')) {
      return cookie.substring('utopia_csrftoken='.length)
    }
    if (cookie.startsWith('XSRF-TOKEN=')) {
      return cookie.substring('XSRF-TOKEN='.length)
    }
  }
  return null
}

// Helper function to get CSRF token with fallbacks
export const getCSRFToken = (): string | null => {
  // First check localStorage
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('csrf_token')
    if (storedToken) {
      return storedToken
    }
  }

  // Then check cookies
  const cookieToken = getCSRFTokenFromCookies()
  if (cookieToken && typeof window !== 'undefined') {
    // Store in localStorage as backup
    localStorage.setItem('csrf_token', cookieToken)
    return cookieToken
  }

  return csrfToken // Return the module variable as last resort
}

export const initCSRF = async (): Promise<string | null> => {
  if (csrfInitialized && csrfToken) {
    return csrfToken
  }

  try {
    console.log('Initializing CSRF token...')

    // Fetch CSRF token from server
    const response = await axios.get(`${API_BASE_URL}/auth/csrf/`, {
      withCredentials: true,
      headers: {
        'Accept': 'application/json',
      }
    })

    console.log('CSRF response:', response.data)

    // Check cookies first (they should be set by browser)
    let token = getCSRFTokenFromCookies()

    if (!token) {
      // Fallback to response data
      token = response.data?.csrf_token || null
    }

    if (token) {
      csrfToken = token
      csrfInitialized = true

      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('csrf_token', token)
        localStorage.setItem('csrf_initialized', 'true')
      }

      console.log('CSRF token initialized:', token.substring(0, 10) + '...')
      return token
    } else {
      console.warn('CSRF token not found in response')
      return null
    }

  } catch (error: any) {
    console.error('Failed to initialize CSRF:', error)
    console.error('Error details:', error.response?.data)
    return null
  }
}

export const ensureCSRFToken = async (): Promise<string | null> => {
  // Check if we already have a token
  const existingToken = getCSRFToken()
  if (existingToken) {
    csrfToken = existingToken
    return existingToken
  }

  // Try to get from cookies
  const cookieToken = getCSRFTokenFromCookies()
  if (cookieToken) {
    csrfToken = cookieToken
    if (typeof window !== 'undefined') {
      localStorage.setItem('csrf_token', cookieToken)
    }
    return cookieToken
  }

  // Initialize if not found
  return await initCSRF()
}

const initCSRFAndGetToken = async (): Promise<string | null> => {
  try {
    return await initCSRF()
  } catch (error) {
    console.error('Failed to get CSRF token:', error)
    return null
  }
}

// Request interceptor - FIXED
apiClient.interceptors.request.use(async (config) => {
  // Get CSRF token
  let token = csrfToken || getCSRFToken()

  // If still no token, try to get one
  if (!token && typeof window !== 'undefined') {
    token = await ensureCSRFToken()
  }

  // Add Authorization header if available
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      // ⚠️ DO NOT REVERT THIS BLOCK ⚠️
      // This is required for JWT Authentication to work.
      // It attaches the token and disables cookies to avoid 403 errors.
      config.headers['Authorization'] = `Bearer ${accessToken}`
      config.withCredentials = false
    }
  }

  // Only add CSRF token if it exists and it's a non-GET request
  const method = config.method?.toUpperCase()
  if (token && method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    config.headers['X-CSRFToken'] = token
    console.log(`✅ Adding CSRF token to ${method} ${config.url}`)
  } else if (!token && method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    console.warn(`⚠️ No CSRF token for ${method} ${config.url}`)
  }

  return config
})

// Upload client interceptor - FIXED
uploadClient.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase()

  if (method && ['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return config
  }

  const token = await ensureCSRFToken()

  if (token) {
    config.headers['X-CSRFToken'] = token
  }

  return config
})

// Initialize on client side only
if (typeof window !== 'undefined') {
  // Check localStorage first
  const storedToken = localStorage.getItem('csrf_token')
  if (storedToken) {
    csrfToken = storedToken
    csrfInitialized = true
  } else {
    // Initialize if not found
    initCSRF().then(() => {
      console.log('CSRF initialization complete')
    }).catch(error => {
      console.error('CSRF initialization failed:', error)
    })
  }
}

// ============ ERROR HANDLING ============
const errorHandler = async (error: any) => {
  const originalRequest = error.config

  // Handle 401 Unauthorized
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true

    // Clear user data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      sessionStorage.removeItem('user')

      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login?session_expired=true'
      }
    }

    return Promise.reject(error)
  }

  // Handle specific error codes
  if (error.response) {
    const { status, data } = error.response

    switch (status) {
      case 400:
        const message = data?.detail || data?.error || data?.message || 'Invalid request'
        toast.error(typeof message === 'string' ? message : JSON.stringify(message))
        break
      case 403:
        toast.error(data?.detail || 'You do not have permission to perform this action')
        break
      case 404:
        toast.error(data?.detail || 'Resource not found')
        break
      case 429:
        toast.error('Too many requests. Please try again later.')
        break
      case 500:
        toast.error('Server error. Please try again later.')
        break
      default:
        if (status >= 500) {
          toast.error('Server error. Please try again later.')
        }
    }
  } else if (!error.response) {
    // Network error
    toast.error('Network error. Please check your connection.')
  }

  return Promise.reject(error)
}

// Apply error handlers
apiClient.interceptors.response.use(
  response => response,
  errorHandler
)

uploadClient.interceptors.response.use(
  response => response,
  errorHandler
)

// ============ SESSION UTILITIES ============
export const sessionApi = {
  // Initialize session by fetching CSRF token
  initialize: async (): Promise<string | null> => {
    return await ensureCSRFToken()
  },

  // Check if user is authenticated
  checkAuth: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/auth/check-session/')
      return response.data?.authenticated || false
    } catch {
      return false
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/current-user/')
      return response.data
    } catch {
      return null
    }
  },

  // Clear all auth data
  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      sessionStorage.removeItem('user')
      localStorage.removeItem('csrf_token')
      localStorage.removeItem('csrf_initialized')

      // Clear cookies
      document.cookie = 'sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      csrfToken = null
      csrfInitialized = false
    }
  }
}

export default apiClient