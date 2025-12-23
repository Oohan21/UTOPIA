// lib/api/client.ts - ADD FILE UPLOAD CLIENT
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8000/api'

const getCSRFToken = () => {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

// Setup CSRF token before requests
const setupCSRF = async () => {
  try {
    // Get CSRF token by calling the endpoint
    await axios.get(`${API_BASE_URL}/auth/csrf/`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
  }
};

// Initialize CSRF token on app load (optional)
setupCSRF();

// Regular API client for JSON data
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// File upload client for multipart/form-data
export const uploadClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true,
})

const addCSRFToken = (config: any) => {
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
}

apiClient.interceptors.request.use(addCSRFToken)
uploadClient.interceptors.request.use(addCSRFToken)

// Response interceptor for error handling
const errorHandler = async (error: any) => {
  const originalRequest = error.config

  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true

    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token')
      }

      const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      })

      const { access } = response.data
      localStorage.setItem('access_token', access)

      originalRequest.headers.Authorization = `Bearer ${access}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.location.href = '/auth/login'
      return Promise.reject(refreshError)
    }
  }

  // Handle specific error codes
  if (error.response?.status === 400) {
    const message = error.response.data?.detail || 'Invalid request'
    toast.error(message)
  } else if (error.response?.status === 403) {
    toast.error('You do not have permission to perform this action')
  } else if (error.response?.status === 404) {
    toast.error('Resource not found')
  } else if (error.response?.status >= 500) {
    toast.error('Server error. Please try again later.')
  }

  return Promise.reject(error)
}

apiClient.interceptors.response.use(
  (response) => response,
  errorHandler
)

uploadClient.interceptors.response.use(
  (response) => response,
  errorHandler
)

export default apiClient