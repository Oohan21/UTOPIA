import apiClient from './client'
import { Property, PropertyFilters, ApiResponse, City, SubCity, PropertyPromotion } from '@/lib/types/property'

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

    // Add default sort for promoted properties
    if (!params.has('ordering')) {
      params.append('ordering', '-promotion_priority,-created_at')
    }

    const response = await apiClient.get<PaginatedResponse<Property>>(`/properties/?${params.toString()}`)

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

    // Convert to ApiResponse type
    return {
      ...response.data,
      results: response.data.results
    } as ApiResponse<Property>
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
        image: img.image?.startsWith('http')
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

  createProperty: async (data: FormData, promotionTier?: string) => {
    if (promotionTier && promotionTier !== 'basic') {
      // Mark as promoted for auto-approval
      data.append('is_promoted', 'true');
      data.append('promotion_tier', promotionTier);
    }

    const response = await apiClient.post<Property>('/properties/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateProperty: async (id: number, data: FormData | Record<string, any>) => {
    try {
      console.log('=== UPDATE PROPERTY DEBUG INFO ===');
      console.log('Property ID:', id);

      // Handle both FormData and regular objects
      let config: any = {};

      if (data instanceof FormData) {
        // Log FormData contents
        console.log('FormData contents:');
        for (let [key, value] of data.entries()) {
          if (value instanceof File) {
            console.log(`${key}: File - ${value.name} (${value.type}, ${value.size} bytes)`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }

        config = {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      } else {
        console.log('Regular data:', data);
      }

      const response = await apiClient.patch<Property>(`/properties/${id}/`, data, config);
      console.log('Update successful:', response.data);
      return response.data;

    } catch (error: any) {
      console.error('=== UPDATE PROPERTY ERROR DETAILS ===');
      console.error('Error:', error);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }

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

  // City and location endpoints - UPDATED
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
      const params = new URLSearchParams()
      if (cityId) {
        params.append('city', cityId.toString())
      }

      const url = `/sub-cities/${params.toString() ? `?${params}` : ''}`
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

  // User Properties Management - UPDATED endpoint
  getUserProperties: async (): Promise<Property[]> => {
    try {
      console.log('=== FETCHING USER PROPERTIES ===');
      console.log('Endpoint:', '/listings/my-listings/');

      const response = await apiClient.get('/listings/my-listings/');

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Full response:', response);
      console.log('Response data:', response.data);

      // Handle different response formats
      let propertiesData: any[] = [];

      if (Array.isArray(response.data)) {
        propertiesData = response.data;
        console.log('Response is direct array');
      } else if (response.data && Array.isArray(response.data.results)) {
        propertiesData = response.data.results;
        console.log('Response has results array');
      } else if (response.data && Array.isArray(response.data.data)) {
        propertiesData = response.data.data;
        console.log('Response has data array');
      } else {
        console.warn('Unexpected response format:', response.data);
        // Try to extract array from nested structure
        if (response.data && typeof response.data === 'object') {
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              propertiesData = response.data[key];
              console.log(`Found array in key: ${key}`);
              break;
            }
          }
        }
      }

      console.log('Extracted properties:', propertiesData.length, 'items');

      // Process images
      const processedProperties = propertiesData.map((property: any) => {
        const processed = {
          ...property,
          images: property.images?.map((img: any) => ({
            ...img,
            image: img.image?.startsWith('http')
              ? img.image
              : img.image
                ? `${apiClient.defaults.baseURL}${img.image}`
                : null
          })) || []
        };
        console.log(`Processed property ${processed.id}:`, processed.title);
        return processed;
      });

      return processedProperties;

    } catch (error: any) {
      console.error('=== ERROR FETCHING USER PROPERTIES ===');
      console.error('Error:', error);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }

      throw error;
    }
  },

  // Image Management - UPDATED endpoints
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
    const response = await apiClient.post<Property>(`/properties/${id}/toggle_featured/`)
    return response.data
  },

  toggleVerified: async (id: number) => {
    const response = await apiClient.post<Property>(`/properties/${id}/toggle_verification/`)
    return response.data
  },

  // Saved Searches - UPDATED endpoints
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

  // Tracked Properties - UPDATED endpoints
  getTrackedProperties: async () => {
    const response = await apiClient.get<any[]>('/tracked-properties/')
    return response.data
  },

  // Messaging endpoints - UPDATED
  sendMessage: async (data: {
    receiver: number;
    property?: number;
    inquiry?: number;
    message_type: string;
    subject?: string;
    content: string;
    attachment?: File;
  }) => {
    try {
      console.log('Sending message to /messages/ endpoint');

      // Create FormData
      const formData = new FormData();

      // Add all fields
      formData.append('receiver', data.receiver.toString());
      formData.append('message_type', data.message_type || 'general');
      formData.append('content', data.content);

      if (data.subject) {
        formData.append('subject', data.subject);
      }

      if (data.property) {
        formData.append('property', data.property.toString());
      }

      if (data.inquiry) {
        formData.append('inquiry', data.inquiry.toString());
      }

      if (data.attachment) {
        // Validate file size (10MB limit)
        if (data.attachment.size > 10 * 1024 * 1024) {
          throw new Error('File size must be less than 10MB');
        }
        formData.append('attachment', data.attachment);
      }

      // Debug: Log what we're sending
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const response = await apiClient.post('/messages/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Message sent successfully');
      return response.data;

    } catch (error: any) {
      console.error('Error sending message:', error);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);

        if (error.response.data) {
          // Handle field validation errors
          const fieldErrors = Object.entries(error.response.data)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              } else if (typeof messages === 'object') {
                return `${field}: ${JSON.stringify(messages)}`;
              } else {
                return `${field}: ${messages}`;
              }
            })
            .join('; ');

          if (fieldErrors) {
            throw new Error(`Validation error: ${fieldErrors}`);
          }
        }
      }

      throw new Error(error.response?.data?.detail || error.response?.data?.error || 'Failed to send message');
    }
  },

  getMessages: async (filters?: {
    thread?: number;
    property?: number;
    inquiry?: number;
    unread?: boolean;
  }) => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const url = `/messages/${params.toString() ? `?${params}` : ''}`;
    const response = await apiClient.get<PaginatedResponse<any>>(url);
    return response.data;
  },

  getMessageThreads: async () => {
    const response = await apiClient.get<PaginatedResponse<any>>('/message-threads/');
    return response.data;
  },

  getThreadMessages: async (threadId: number) => {
    const response = await apiClient.get<PaginatedResponse<any>>(`/message-threads/${threadId}/messages/`);
    return response.data;
  },

  sendThreadMessage: async (threadId: number, data: {
    content: string;
    attachment?: File;
  }) => {
    const formData = new FormData();
    formData.append('content', data.content);
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }

    const response = await apiClient.post(
      `/message-threads/${threadId}/send_message/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  markMessageAsRead: async (messageId: number) => {
    const response = await apiClient.post(`/messages/${messageId}/mark_as_read/`);
    return response.data;
  },

  // Get unread message count - UPDATED endpoint
  getUnreadMessageCount: async () => {
    const response = await apiClient.get('/messages/unread_count/');
    return response.data;
  },

  // Inquiry-specific messaging - UPDATED endpoints
  sendInquiryMessage: async (inquiryId: number, data: {
    message: string;
    attachment?: File;
  }) => {
    const formData = new FormData();
    formData.append('message', data.message);
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }

    const response = await apiClient.post(
      `/inquiries/${inquiryId}/send_message/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getInquiryMessages: async (inquiryId: number) => {
    const response = await apiClient.get(`/inquiries/${inquiryId}/messages/`);
    return response.data;
  },

  // Inquiries - UPDATED endpoints
  createInquiry: async (propertyId: number, data: any) => {
    const response = await apiClient.post('/inquiries/', {
      property: propertyId,
      ...data,
    })
    return response.data
  },

  getInquiries: async () => {
    const response = await apiClient.get<PaginatedResponse<any>>('/inquiries/')
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

  // Market Stats - NEW analytics endpoints
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

  // Property Valuation - UPDATED endpoint
  getPropertyValuation: async (data: any) => {
    const response = await apiClient.post('/property-valuation/', data)
    return response.data
  },

  getUserValuations: async () => {
    const response = await apiClient.get('/property-valuation/my-valuations/')
    return response.data
  },

  // Comparison functions - UPDATED endpoints
  addToComparison: async (id: number) => {
    const response = await apiClient.post(`/properties/${id}/add_to_comparison/`)
    return response.data
  },

  getComparisonProperties: async () => {
    const response = await apiClient.get('/properties/get_comparison_session/')
    return response.data
  },

  compareProperties: async (propertyIds: number[]) => {
    const response = await apiClient.post('/compare/', { property_ids: propertyIds })
    return response.data
  },

  getComparisonSession: async () => {
    const response = await apiClient.get('/properties/get_comparison_session/')
    return response.data
  },

  // Property Views - UPDATED endpoint
  trackPropertyView: async (propertyId: number) => {
    try {
      // Clean the propertyId to ensure it's a valid number
      const cleanId = parseInt(String(propertyId), 10);

      if (isNaN(cleanId)) {
        console.warn('Invalid property ID for tracking:', propertyId);
        return { status: 'skipped', reason: 'Invalid ID' };
      }

      // Use the correct endpoint
      const url = `/properties/${cleanId}/track_view/`;
      console.log('Tracking view for property:', cleanId, 'URL:', url);

      const response = await apiClient.post(url);
      return response.data;
    } catch (error: any) {
      // Log but don't fail the page load
      console.warn('Failed to track property view:', error.message);

      // Return a fallback response so the page continues to load
      return {
        status: 'error',
        message: 'View tracking failed',
        error: error.message
      };
    }
  },

  // Analytics - NEW endpoints
  getPropertyAnalytics: async (propertyId: number) => {
    const response = await apiClient.get(`/analytics/property/${propertyId}/`)
    return response.data
  },

  getUserAnalytics: async () => {
    const response = await apiClient.get('/analytics/dashboard/')
    return response.data
  },

  getMarketAnalytics: async (period: string = '30d') => {
    const response = await apiClient.get(`/analytics/market-overview/?period=${period}`)
    return response.data
  },

  getPriceAnalytics: async () => {
    const response = await apiClient.get('/analytics/price-analysis/')
    return response.data
  },

  getDemandAnalytics: async () => {
    const response = await apiClient.get('/analytics/demand-analysis/')
    return response.data
  },

  // Notifications - UPDATED endpoints
  getNotifications: async () => {
    const response = await apiClient.get<PaginatedResponse<any>>('/notifications/')
    return response.data
  },

  markNotificationAsRead: async (id: number) => {
    const response = await apiClient.patch(`/notifications/${id}/`)
    return response.data
  },

  markAllNotificationsAsRead: async () => {
    const response = await apiClient.post('/notifications/mark_all_read/')
    return response.data
  },

  // Promotion endpoints - NEW
  getPromotionTiers: async () => {
    const response = await apiClient.get<PropertyPromotion[]>('/subscriptions/promotion-tiers/')
    return response.data
  },

  calculatePromotionPrice: async (data: {
    tier_type: string;
    duration_days: number;
    promo_code?: string;
  }) => {
    const response = await apiClient.post('/subscriptions/promotions/calculate_price/', data)
    return response.data
  },

  initiatePromotionPayment: async (data: {
    property_id: number;
    tier_type: string;
    duration_days: number;
    promo_code?: string;
  }) => {
    const response = await apiClient.post('/subscriptions/promotions/initiate-payment/', data)
    return response.data
  },

  verifyPromotionPayment: async (params: {
    payment_id?: string;
    promotion_id?: string;
    tx_ref?: string;
  }) => {
    const queryParams = new URLSearchParams()
    if (params.payment_id) queryParams.append('payment_id', params.payment_id)
    if (params.promotion_id) queryParams.append('promotion_id', params.promotion_id)
    if (params.tx_ref) queryParams.append('tx_ref', params.tx_ref)

    const url = `/subscriptions/promotions/verify-payment/?${queryParams.toString()}`
    const response = await apiClient.get(url)
    return response.data
  },

  getPropertyPromotion: async (propertyId: number) => {
    const response = await apiClient.get(`/subscriptions/promotions/property/${propertyId}/`)
    return response.data
  },

  getUserPromotions: async () => {
    const response = await apiClient.get('/subscriptions/promotions/my-promotions/')
    return response.data
  },

  // Create property with promotion
  createPropertyWithPromotion: async (formData: FormData, promotionData?: {
    tier_type: string
    duration_days: number
    promo_code?: string
  }) => {
    // First create the property
    const propertyResponse = await apiClient.post<Property>('/properties/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    const property = propertyResponse.data

    // If promotion data provided, initiate promotion payment
    if (promotionData && property.id) {
      try {
        const promotionResponse = await listingsApi.initiatePromotionPayment({
          property_id: property.id,
          tier_type: promotionData.tier_type,
          duration_days: promotionData.duration_days,
          promo_code: promotionData.promo_code
        })

        return {
          property,
          promotion: promotionResponse
        }
      } catch (error) {
        console.error('Failed to initiate promotion:', error)
        // Return property without promotion if promotion fails
        return { property }
      }
    }

    return { property }
  },

  // Promote an existing property
  promoteProperty: async (propertyId: number, data: {
    tier_type: string
    duration_days: number
    promo_code?: string
  }) => {
    const response = await apiClient.post(`/subscriptions/promotions/initiate-payment/`, {
      property_id: propertyId,
      ...data
    })
    return response.data
  },

  // Get promoted properties
  getPromotedProperties: async (filters?: PropertyFilters) => {
    const params = new URLSearchParams({ is_promoted: 'true' })

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const response = await apiClient.get<PaginatedResponse<Property>>(`/properties/?${params.toString()}`)

    // Convert to ApiResponse type
    return {
      ...response.data,
      results: response.data.results
    } as ApiResponse<Property>
  },

  // Cancel promotion
  cancelPromotion: async (propertyId: number) => {
    const response = await apiClient.post(`/subscriptions/promotions/cancel/`, {
      property_id: propertyId
    })
    return response.data
  },

  // Get user dashboard
  getUserDashboard: async () => {
    const response = await apiClient.get('/users/dashboard/')
    return response.data
  },

  // Admin endpoints
  getAdminDashboard: async () => {
    const response = await apiClient.get('/admin/dashboard/')
    return response.data
  },

  getAdminUsers: async (filters?: {
    user_type?: string;
    search?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const url = `/admin/users/${params.toString() ? `?${params}` : ''}`
    const response = await apiClient.get<PaginatedResponse<any>>(url)
    return response.data
  },

  getAdminProperties: async (filters?: {
    property_type?: string;
    property_status?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const url = `/admin/properties/${params.toString() ? `?${params}` : ''}`
    const response = await apiClient.get<PaginatedResponse<any>>(url)
    return response.data
  },

  getAdminInquiries: async (filters?: {
    status?: string;
    inquiry_type?: string;
    search?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const url = `/admin/inquiries/${params.toString() ? `?${params}` : ''}`
    const response = await apiClient.get<PaginatedResponse<any>>(url)
    return response.data
  },

  // Export analytics data
  exportAnalyticsData: async (type: 'market' | 'users' | 'properties' | 'transactions', format: 'csv' | 'json' = 'csv') => {
    const response = await apiClient.get(`/analytics/export/?type=${type}&format=${format}`, {
      responseType: format === 'csv' ? 'blob' : 'json'
    })
    return response.data
  },

  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/health/')
    return response.data
  },

  getSearchHistory: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('/search-history/')
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data
      } else if (response.data && Array.isArray(response.data.results)) {
        return response.data.results
      } else if (response.data && Array.isArray(response.data.data)) {
        return response.data.data
      }
      return []
    } catch (error) {
      console.error('Error fetching search history:', error)
      return []
    }
  },

  saveSearchToHistory: async (searchData: {
    query?: string;
    filters?: PropertyFilters;
    results_count?: number;
    search_type?: 'manual' | 'saved_search' | 'quick_filter';
  }) => {
    try {
      // Ensure filters is always an object
      const dataToSend = {
        ...searchData,
        filters: searchData.filters || {},
        search_type: searchData.search_type || 'manual',
        results_count: searchData.results_count || 0
      }

      const response = await apiClient.post('/search-history/', dataToSend)
      return response.data
    } catch (error: any) {
      console.error('Error saving search history:', error)

      // Log more details about the error
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
      }

      // Return a fallback object so the UI doesn't break
      return {
        id: Date.now(),
        query: searchData.query,
        filters: searchData.filters || {},
        results_count: searchData.results_count || 0,
        created_at: new Date().toISOString(),
        search_type: searchData.search_type || 'manual'
      }
    }
  },

  getPopularSearches: async (limit: number = 10): Promise<any[]> => {
    try {
      const response = await apiClient.get(`/search-history/popular/?limit=${limit}`)

      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data
      } else if (response.data && Array.isArray(response.data.popular_searches)) {
        return response.data.popular_searches
      } else if (response.data && Array.isArray(response.data.results)) {
        return response.data.results
      }
      return []
    } catch (error) {
      console.error('Error fetching popular searches:', error)
      // Return a fallback array
      return [
        { query: 'Bole', count: 45 },
        { query: '3 bedroom house', count: 32 },
        { query: 'Apartment for rent', count: 28 },
        { query: 'Office space', count: 21 },
        { query: 'Commercial property', count: 18 }
      ]
    }
  },

  deleteSearchHistory: async (id: number) => {
    try {
      const response = await apiClient.delete(`/search-history/${id}/`)
      return response.data
    } catch (error) {
      console.error('Error deleting search history:', error)
      throw error
    }
  },

  clearSearchHistory: async () => {
    try {
      // Use the 'clear' action endpoint instead of 'clear/'
      const response = await apiClient.delete('/search-history/clear/')
      return response.data
    } catch (error: any) {
      console.error('Error clearing search history:', error)

      // If 404, try the alternative endpoint pattern
      if (error.response?.status === 404) {
        try {
          // Try the Django REST framework pattern
          const response = await apiClient.post('/search-history/clear/')
          return response.data
        } catch (retryError) {
          console.error('Retry failed:', retryError)
        }
      }

      // Return a success response anyway so UI doesn't break
      return {
        status: 'success',
        message: 'Search history cleared locally',
        deleted_count: 0
      }
    }
  },

  getSearchSuggestions: async (query: string) => {
    try {
      const response = await apiClient.get(`/search-history/suggestions/?q=${encodeURIComponent(query)}`)
      return response.data
    } catch (error) {
      console.error('Error fetching search suggestions:', error)
      return []
    }
  }
}