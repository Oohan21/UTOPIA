import apiClient from './client'
import { Property, PropertyFilters, ApiResponse, City, SubCity } from '@/lib/types/property'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
  total_pages: number
  current_page: number
}

export const listingsApi = {
  getProperties: async (filters?: PropertyFilters) => {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v))
          } else {
            params.append(key, String(value))
          }
        }
      })
    }

    const response = await apiClient.get<ApiResponse<Property>>(`/properties/?${params.toString()}`)

    // Process images to ensure full URLs
    if (response.data.results) {
      response.data.results = response.data.results.map((property: Property) => ({
        ...property,
        images: property.images?.map((img: any) => ({
          ...img,
          image: img.image?.startsWith('http')
            ? img.image
            : `${apiClient.defaults.baseURL}${img.image}`
        })) || []
      }))
    }

    return response.data
  },

  getFeaturedProperties: async () => {
    const response = await apiClient.get<Property[]>('/properties/featured/')
    return response.data
  },

  getPropertyById: async (id: number) => {
    const response = await apiClient.get<Property>(`/properties/${id}/`)
    const data = response.data

    // Add base URL to images if they're relative
    if (data.images) {
      data.images = data.images.map((img: any) => ({
        ...img,
        image: img.image.startsWith('http')
          ? img.image
          : `${apiClient.defaults.baseURL}${img.image}`
      }))
    }

    return data
  },

  getSimilarProperties: async (propertyId: number) => {
    const response = await apiClient.get<Property[]>(`/properties/similar/?property_id=${propertyId}`)
    return response.data
  },

  getRecommendations: async () => {
    const response = await apiClient.get<Property[]>('/properties/recommendations/')
    return response.data
  },

  createProperty: async (data: FormData) => {
    const response = await apiClient.post<Property>('/properties/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  updateProperty: async (id: number, data: FormData) => {
    try {
      console.log('=== UPDATE PROPERTY DEBUG INFO ===');
      console.log('Property ID:', id);

      // Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of data.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.type}, ${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // Try PATCH instead of PUT (partial update)
      const response = await apiClient.patch<Property>(`/properties/${id}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Update successful:', response.data);
      return response.data;

    } catch (error: any) {
      console.error('=== UPDATE PROPERTY ERROR DETAILS ===');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Status:', error.response?.status);
      console.error('Status text:', error.response?.statusText);
      console.error('Response headers:', error.response?.headers);
      console.error('Response data:', error.response?.data);

      // Log the request that failed
      console.error('Failed request config:', {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data,
        headers: error.config?.headers,
      });

      throw error;
    }
  },

  deleteProperty: async (id: number) => {
    const response = await apiClient.delete(`/properties/${id}/`)
    return response.data
  },

  saveProperty: async (id: number) => {
    const response = await apiClient.post(`/properties/${id}/save/`)
    return response.data
  },

  getCities: async (): Promise<City[]> => {
    try {
      const response = await apiClient.get<PaginatedResponse<City>>('/cities/')
      console.log('Cities API response:', response.data)
      return response.data.results || []
    } catch (error) {
      console.error('Error fetching cities:', error)
      throw error
    }
  },

  getSubCities: async (cityId?: number): Promise<SubCity[]> => {
    try {
      let url = '/sub-cities/'
      if (cityId) {
        url += `?city=${cityId}`
      }
      const response = await apiClient.get<PaginatedResponse<SubCity>>(url)
      console.log(`SubCities API response for city ${cityId}:`, response.data)
      return response.data.results || []
    } catch (error) {
      console.error('Error fetching subcities:', error)
      throw error
    }
  },

  getAmenities: async () => {
    const response = await apiClient.get<any[]>('/amenities/')
    return response.data
  },

  // User Properties Management
  getUserProperties: async () => {
    const response = await apiClient.get<Property[]>('/properties/my-listings/')
    return response.data
  },

  // Image Management
  uploadPropertyImage: async (propertyId: number, image: File) => {
    const formData = new FormData()
    formData.append('image', image)
    formData.append('property', propertyId.toString())

    const response = await apiClient.post<any>('/property-images/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  deletePropertyImage: async (imageId: number) => {
    const response = await apiClient.delete(`/property-images/${imageId}/`)
    return response.data
  },

  // Property Status Management
  updatePropertyStatus: async (id: number, status: string) => {
    const response = await apiClient.patch<Property>(`/properties/${id}/`, {
      property_status: status
    })
    return response.data
  },

  toggleFeatured: async (id: number) => {
    const response = await apiClient.patch<Property>(`/properties/${id}/toggle_featured/`)
    return response.data
  },

  toggleVerified: async (id: number) => {
    const response = await apiClient.patch<Property>(`/properties/${id}/toggle_verification/`)
    return response.data
  },

  // Saved Searches
  getSavedSearches: async () => {
    const response = await apiClient.get<any[]>('/saved-searches/')
    return response.data
  },

  createSavedSearch: async (data: { name: string; filters: PropertyFilters }) => {
    const response = await apiClient.post('/saved-searches/', data)
    return response.data
  },

  deleteSavedSearch: async (id: number) => {
    const response = await apiClient.delete(`/saved-searches/${id}/`)
    return response.data
  },

  // Tracked Properties
  getTrackedProperties: async () => {
    const response = await apiClient.get<any[]>('/tracked-properties/')
    return response.data
  },

  // Inquiries
  createInquiry: async (propertyId: number, data: any) => {
    const response = await apiClient.post('/inquiries/', {
      property: propertyId,
      ...data,
    })
    return response.data
  },

  getInquiries: async () => {
    const response = await apiClient.get<any[]>('/inquiries/')
    return response.data
  },

  updateInquiry: async (id: number, data: any) => {
    const response = await apiClient.put(`/inquiries/${id}/`, data)
    return response.data
  },

  deleteInquiry: async (id: number) => {
    const response = await apiClient.delete(`/inquiries/${id}/`)
    return response.data
  },

  // Market Stats
  getMarketStats: async (params?: { city?: number; sub_city?: number; property_type?: string }) => {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, String(value))
      })
    }
    const url = `/market-stats/${queryParams.toString() ? `?${queryParams}` : ''}`
    const response = await apiClient.get(url)
    return response.data
  },

  // Property Valuation
  getPropertyValuation: async (data: any) => {
    const response = await apiClient.post('/property-valuation/', data)
    return response.data
  },

  getUserValuations: async () => {
    const response = await apiClient.get('/property-valuation/my-valuations/')
    return response.data
  },

  // Comparison functions
  addToComparison: async (id: number) => {
    const response = await apiClient.post(`/properties/${id}/add_to_comparison/`)
    return response.data
  },

  getComparisonProperties: async () => {
    const response = await apiClient.get('/properties/get_comparison_session/')
    return response.data
  },

  compareProperties: async (propertyIds: number[]) => {
    const response = await apiClient.post('/properties/compare/', { property_ids: propertyIds })
    return response.data
  },

  saveComparison: async (data: { name: string; property_ids: number[] }) => {
    const response = await apiClient.post('/properties/save-comparison/', data)
    return response.data
  },

  getMyComparisons: async () => {
    const response = await apiClient.get('/my-comparisons/')
    return response.data
  },

  deleteComparison: async (id: number) => {
    const response = await apiClient.delete(`/comparisons/${id}/`)
    return response.data
  },

  getComparisonSession: async () => {
    const response = await apiClient.get('/properties/get_comparison_session/')
    return response.data
  },

  // Property Views
  trackPropertyView: async (propertyId: number) => {
    const response = await apiClient.post(`/properties/${propertyId}/track_view/`)
    return response.data
  },

  // Analytics
  getPropertyAnalytics: async (propertyId: number) => {
    const response = await apiClient.get(`/properties/${propertyId}/analytics/`)
    return response.data
  },

  getUserAnalytics: async () => {
    const response = await apiClient.get('/analytics/user/')
    return response.data
  },

  // Notifications
  getNotifications: async () => {
    const response = await apiClient.get('/notifications/')
    return response.data
  },

  markNotificationAsRead: async (id: number) => {
    const response = await apiClient.patch(`/notifications/${id}/mark_read/`)
    return response.data
  },

  markAllNotificationsAsRead: async () => {
    const response = await apiClient.post('/notifications/mark_all_read/')
    return response.data
  }
}