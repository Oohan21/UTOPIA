// Create a new file: lib/api/comparison.ts
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
  properties: any[]
  report?: {
    summary: {
      total_properties: number
      price_range: {
        min: number
        max: number
        avg: number
      }
      best_value?: any
      most_features?: any
    }
    property_scores: Record<number, number>
    recommendations: any[]
  }
  matrix?: Record<string, any[]>
  comparison_date: string
  comparison_id?: number
  save_url?: string
}

export interface SavedComparison {
  id: number
  name: string
  properties: Property[]
  comparison_summary: any
  created_at: string
  updated_at: string
}

export const comparisonApi = {
  // Compare multiple properties
  compareProperties: async (propertyIds: number[]): Promise<ComparisonResult> => {
    const response = await apiClient.post('/comparisons/compare_properties/', {
      property_ids: propertyIds
    })
    return response.data
  },

  // Advanced comparison with criteria
  advancedComparison: async (propertyIds: number[], criteria: ComparisonCriteria): Promise<ComparisonResult> => {
    const response = await apiClient.post('/compare/advanced/', {
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

  // Get user's saved comparisons
  getSavedComparisons: async (): Promise<SavedComparison[]> => {
    const response = await apiClient.get('/comparisons/my_comparisons/')
    return response.data
  },

  // Get comparison by ID
  getComparison: async (id: number): Promise<SavedComparison> => {
    const response = await apiClient.get(`/comparisons/${id}/`)
    return response.data
  },

  // Delete comparison
  deleteComparison: async (id: number): Promise<void> => {
    await apiClient.delete(`/comparisons/${id}/`)
  },

  // Add property to comparison session
  addToComparisonSession: async (propertyId: number): Promise<any> => {
    const response = await apiClient.post(`/properties/${propertyId}/add_to_comparison/`)
    return response.data
  },

  // Get current comparison session
  getComparisonSession: async (): Promise<{ properties: Property[]; count: number; session_id?: string }> => {
    const response = await apiClient.get('/properties/get_comparison_session/')
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

  // Compare similar properties
  compareSimilar: async (criteria: {
    city?: number
    property_type?: string
    min_bedrooms?: number
    max_bedrooms?: number
    min_price?: number
    max_price?: number
  }): Promise<ComparisonResult> => {
    const response = await apiClient.post('/comparisons/compare_similar/', criteria)
    return response.data
  },

  // Get comparison stats
  getComparisonStats: async (propertyIds: number[]): Promise<any> => {
    const response = await apiClient.post('/comparisons/stats/', {
      property_ids: propertyIds
    })
    return response.data
  }
}