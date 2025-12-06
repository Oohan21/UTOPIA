// lib/api/client.ts - ADD FILE UPLOAD CLIENT
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

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

// Add auth token to both clients
const addAuthToken = (config: any) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

apiClient.interceptors.request.use(addAuthToken)
uploadClient.interceptors.request.use(addAuthToken)

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