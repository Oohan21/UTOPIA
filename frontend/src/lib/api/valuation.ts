import apiClient from './client'
import { ValuationRequest, ValuationResult } from '@/lib/types/valuation'

export const valuationApi = {
  getValuation: async (data: ValuationRequest): Promise<ValuationResult> => {
    const response = await apiClient.post('/property-valuation/', data)
    return response.data
  },

  getMarketStats: async (params?: { city?: number; sub_city?: number; property_type?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.city) queryParams.append('city', params.city.toString())
    if (params?.sub_city) queryParams.append('sub_city', params.sub_city.toString())
    if (params?.property_type) queryParams.append('property_type', params.property_type)
    
    const url = `/market-stats/?${queryParams.toString()}`
    const response = await apiClient.get(url)
    return response.data
  },

  getValuationHistory: async () => {
    const response = await apiClient.get('/property-valuation/')
    return response.data
  },
}