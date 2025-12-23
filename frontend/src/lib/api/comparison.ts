// lib/api/comparison.ts - Update to include missing methods
import apiClient from './client'
import { Property } from '@/lib/types/property'

export interface ComparisonCriteria {
  target_price?: number
  target_area?: number
  required_features?: string[]
  preferred_locations?: string[]
  price_weight?: number
  area_weight?: number
  features_weight?: number
  location_weight?: number
  condition?: 'excellent' | 'good' | 'average' | 'needs_work'
}

export interface ComparisonResult {
  properties: Array<{
    id: number
    title: string
    listing_type: 'sale' | 'rent'
    property_type: string
    city: string | null
    sub_city: string | null
    total_area: number | null
    bedrooms: number | null
    bathrooms: number | null
    built_year: number | null
    has_parking: boolean
    has_garden: boolean
    has_security: boolean
    has_furniture: boolean
    has_air_conditioning: boolean
    has_elevator: boolean
    is_pet_friendly: boolean
    is_verified: boolean
    is_featured: boolean
    days_on_market: number
    views_count: number
    
    // Sale-specific fields
    price_etb?: number | null
    price_per_sqm?: number | null
    
    // Rent-specific fields
    monthly_rent?: number | null
    rent_per_sqm?: number | null
    estimated_sale_value?: number | null
  }>
  
  matrix: Record<string, any[]>
  has_mixed_types: boolean
  warning?: string
  
  summary: {
    total_properties: number
    sale_properties_count: number
    rent_properties_count: number
    has_mixed_types: boolean
    
    common_stats: {
      area_range: {
        min: number
        max: number
        avg: number
      }
      bedroom_range: {
        min: number
        max: number
        avg: number
      }
    }
    
    sale_stats?: {
      price_range: {
        min: number
        max: number
        avg: number
      }
      price_per_sqm_range?: {
        min: number
        max: number
        avg: number
        best_value: number | null
      }
    }
    
    rent_stats?: {
      rent_range: {
        min: number
        max: number
        avg: number
      }
      rent_per_sqm_range?: {
        min: number
        max: number
        avg: number
      }
      estimated_sale_value_range?: {
        min: number
        max: number
        avg: number
      }
    }
    
    best_sale_value?: {
      id: number
      title: string
      price_per_sqm: number
      total_price: number
      area: number
    }
    
    best_rent_value?: {
      id: number
      title: string
      rent_per_sqm: number
      monthly_rent: number
      area: number
    }
    
    most_features?: {
      id: number
      title: string
      listing_type: 'sale' | 'rent'
      feature_count: number
    }
  }
  
  comparison_date: string
  comparison_id?: number
  save_url?: string
  status: string
}

export interface SavedComparison {
  id: number
  name: string
  properties: Property[]
  comparison_summary: any
  created_at: string
  updated_at: string
}

export interface ComparisonOptions {
  fields?: string[]
  includeStats?: boolean
  includeRecommendations?: boolean
  scoringCriteria?: ComparisonCriteria
}

export const comparisonApi = {
  // Get comparison session
  getComparisonSession: async (): Promise<{
    properties: Property[];
    count: number;
    session_id?: string
  }> => {
    const response = await apiClient.get('/properties/get_comparison_session/')
    return response.data
  },

  // Get user's saved comparisons
  getSavedComparisons: async (): Promise<SavedComparison[]> => {
    const response = await apiClient.get('/comparisons/my_comparisons/')
    return response.data
  },

  // Add property to comparison session
  addToComparisonSession: async (propertyId: number): Promise<any> => {
    const response = await apiClient.post(`/properties/${propertyId}/add_to_comparison/`)
    return response.data
  },

  // Clear comparison session
  clearComparisonSession: async (): Promise<void> => {
    const session = await comparisonApi.getComparisonSession()
    if (session.session_id) {
      // Clear by removing all properties
      for (const property of session.properties) {
        // Toggle removal
        await comparisonApi.addToComparisonSession(property.id)
      }
    }
  },

  // Compare properties
  compareProperties: async (propertyIds: number[]): Promise<ComparisonResult> => {
    const response = await apiClient.post('/comparisons/compare/', {
      property_ids: propertyIds
    })
    return response.data
  },

  // Get comparison with options
  getComparison: async (propertyIds: number[], options?: ComparisonOptions): Promise<ComparisonResult> => {
    const response = await apiClient.post('/comparisons/compare/', {
      property_ids: propertyIds,
      options
    })
    return response.data
  },

  // Advanced comparison with criteria
  advancedComparison: async (propertyIds: number[], criteria: ComparisonCriteria): Promise<ComparisonResult> => {
    const response = await apiClient.post('/comparisons/compare/', {
      property_ids: propertyIds,
      criteria: criteria
    })
    return response.data
  },

  // Save comparison
  saveComparison: async (propertyIds: number[], name?: string): Promise<{ id: number; name: string; property_count: number }> => {
    const response = await apiClient.post('/comparisons/save_comparison/', {
      property_ids: propertyIds,
      name: name || `Comparison ${new Date().toLocaleDateString()}`
    })
    return response.data
  },

  // Get comparison by ID
  getComparisonById: async (id: number): Promise<SavedComparison> => {
    const response = await apiClient.get(`/comparisons/${id}/`)
    return response.data
  },

  // Delete comparison
  deleteComparison: async (id: number): Promise<void> => {
    await apiClient.delete(`/comparisons/${id}/`)
  },

  // Compare similar properties
  compareSimilar: async (criteria: {
    city?: number
    property_type?: string
    min_bedrooms?: number
    max_bedrooms?: number
    min_price?: number
    max_price?: number
  }): Promise<ComparisonResult> => {
    const response = await apiClient.post('/comparisons/find_similar/', criteria)
    return response.data
  },

  // Get comparison stats
  getComparisonStats: async (propertyIds: number[]): Promise<any> => {
    const response = await apiClient.post('/comparisons/stats/', {
      property_ids: propertyIds
    })
    return response.data
  },

  // Get comparison suggestions
  getComparisonSuggestions: async (propertyId: number): Promise<Property[]> => {
    const response = await apiClient.get(`/properties/${propertyId}/comparison_suggestions/`)
    return response.data
  },

  // Share comparison
  shareComparison: async (propertyIds: number[]): Promise<{ shareUrl: string; expiry: string }> => {
    const response = await apiClient.post('/comparisons/share/', {
      property_ids: propertyIds
    })
    return response.data
  },

  // Get comparison insights
  getComparisonInsights: async (propertyIds: number[]): Promise<any> => {
    const response = await apiClient.post('/comparisons/insights/', {
      property_ids: propertyIds
    })
    return response.data
  },

  // Bulk add to comparison
  bulkAddToComparison: async (propertyIds: number[]): Promise<any> => {
    const response = await apiClient.post('/comparisons/bulk_add/', {
      property_ids: propertyIds
    })
    return response.data
  },

  getComparisonDashboard: async (): Promise<{
    data: {
      overview: {
        total_comparisons: number
        avg_properties_per_comparison: number
        comparison_frequency: string
      }
      comparison_habits: {
        comparison_frequency: string
        preferred_property_types: Array<{ type: string; count: number }>
        most_active_day: string
      }
      comparison_timeline: Array<{ date: string; count: number }>
      most_compared_properties: Array<{
        id: number
        title: string
        property_type: string
        city: { name: string }
        comparison_count: number
      }>
      saved_comparisons: Array<{
        id: number
        name: string
        created_at: string
        properties: any[]
      }>
    }
  }> => {
    const response = await apiClient.get('/comparison/dashboard/')
    return response.data
  }
}