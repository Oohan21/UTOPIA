// lib/hooks/useComparison.ts - FIXED VERSION
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { comparisonApi } from '@/lib/api/comparison'
import { Property } from '@/lib/types/property'
import { ComparisonUtils } from '@/lib/utils/comparison'

export interface SavedProperty {
  id: number
  property_id: string
  title: string
  property_type: string
  listing_type: 'for_sale' | 'for_rent'
  city: any
  sub_city: any
  bedrooms: number
  bathrooms: number
  total_area: number
  price_etb: number
  monthly_rent?: number
  price_per_sqm: number
  built_year?: number
  has_parking: boolean
  has_garden: boolean
  has_security: boolean
  has_furniture: boolean
  has_air_conditioning: boolean
  has_generator: boolean
  has_elevator: boolean
  is_pet_friendly: boolean
  virtual_tour_url: string
  is_verified: boolean
}

export interface SavedComparison {
  id: number
  name: string
  properties: SavedProperty[]
  comparison_summary: any
  created_at: string
  updated_at: string
}

export interface ComparisonStats {
  price: {
    min: number
    max: number
    avg: number
    median: number
  }
  area: {
    min: number
    max: number
    avg: number
  }
  pricePerSqm: {
    min: number
    max: number
    avg: number
    bestValue?: Property
  }
  bedrooms: {
    min: number
    max: number
    avg: number
    mostCommon: number
  }
  amenities: {
    avg: number
    mostCommon: string[]
    topFeatures: string[]
  }
}

export const useComparison = () => {
  const [comparisonProperties, setComparisonProperties] = useState<Property[]>([])
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSaved, setIsLoadingSaved] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [hasLoadedSaved, setHasLoadedSaved] = useState(false)
  const [savedComparisonsError, setSavedComparisonsError] = useState<string | null>(null)

  // Load comparison session on mount
  useEffect(() => {
    loadComparisonSession()
    loadSavedComparisons()
  }, [])

  const loadComparisonSession = async () => {
    try {
      setIsLoading(true)
      const session = await comparisonApi.getComparisonSession()
      setComparisonProperties(session.properties || [])
      setSessionId(session.session_id || '')
    } catch (error) {
      console.error('Failed to load comparison session:', error)
      toast.error('Failed to load comparison session')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSavedComparisons = useCallback(async () => {
    try {
      setIsLoadingSaved(true)
      setSavedComparisonsError(null)

      const response = await comparisonApi.getSavedComparisons()

      if (Array.isArray(response)) {

        const transformedComparisons: SavedComparison[] = response.map(item => ({
          id: item.id,
          name: item.name || `Comparison ${item.id}`,
          properties: Array.isArray(item.properties)
            ? item.properties.map(prop => ({
              id: prop.id || 0,
              property_id: prop.property_id?.toString() || '',
              title: prop.title || 'Untitled Property',
              property_type: prop.property_type || '',
              listing_type: prop.listing_type || 'for_sale',
              city: prop.city || { name: 'Unknown', id: 0 },
              sub_city: prop.sub_city || { name: 'Unknown', id: 0 },
              bedrooms: Number(prop.bedrooms) || 0,
              bathrooms: Number(prop.bathrooms) || 0,
              total_area: Number(prop.total_area) || 0,
              price_etb: Number(prop.price_etb) || 0,
              monthly_rent: prop.monthly_rent ? Number(prop.monthly_rent) : undefined,
              price_per_sqm: prop.price_per_sqm ? Number(prop.price_per_sqm) : 0,
              built_year: prop.built_year ? Number(prop.built_year) : undefined,
              has_parking: Boolean(prop.has_parking),
              has_garden: Boolean(prop.has_garden),
              has_security: Boolean(prop.has_security),
              has_furniture: Boolean(prop.has_furniture),
              has_air_conditioning: Boolean(prop.has_air_conditioning),
              has_generator: Boolean(prop.has_generator),
              has_elevator: Boolean(prop.has_elevator),
              is_pet_friendly: Boolean(prop.is_pet_friendly),
              virtual_tour_url: prop.virtual_tour_url || '',
              is_verified: Boolean(prop.is_verified),
            }))
            : [],
          comparison_summary: item.comparison_summary || {
            price_range: { min: 0, max: 0, avg: 0 },
            area_range: { min: 0, max: 0, avg: 0 },
            bedrooms_range: { min: 0, max: 0, avg: 0 }
          },
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        }))

        // Only update state if data actually changed
        setSavedComparisons(prev => {
          const prevIds = prev.map(c => c.id).sort()
          const newIds = transformedComparisons.map(c => c.id).sort()

          if (JSON.stringify(prevIds) === JSON.stringify(newIds)) {
            return prev
          }

          return transformedComparisons
        })

        setHasLoadedSaved(true)

      } else {
        console.error('❌ Response is not an array:', response)
        setSavedComparisons([])
        setSavedComparisonsError('Invalid response format from server')
      }
    } catch (error: any) {
      setSavedComparisonsError(error.message || 'Failed to load saved comparisons')
      setSavedComparisons([])
    } finally {
      setIsLoadingSaved(false)
    }
  }, [])

  const addToComparison = async (propertyId: number) => {
    try {
      setIsLoading(true)
      const result = await comparisonApi.addToComparisonSession(propertyId)

      if (result.action === 'added') {
        await loadComparisonSession()
        toast.success(`✓ Property added to comparison (${result.session_properties_count}/10)`, {
          duration: 3000,
          icon: '➕',
        })
      } else {
        await loadComparisonSession()
        toast.success('✓ Property removed from comparison', {
          duration: 3000,
          icon: '❌',
        })
      }
    } catch (error) {
      toast.error('Failed to update comparison', {
        duration: 4000,
        icon: '⚠️',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromComparison = async (propertyId: number) => {
    try {
      setIsLoading(true)
      await comparisonApi.addToComparisonSession(propertyId)
      await loadComparisonSession()
      toast.success('✓ Property removed from comparison', {
        duration: 3000,
        icon: '🗑️',
      })
    } catch (error) {
      toast.error('Failed to remove property', {
        duration: 4000,
        icon: '⚠️',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const compareProperties = async () => {
    if (comparisonProperties.length < 2) {
      toast.error('Add at least 2 properties to compare', {
        duration: 4000,
        icon: '📊',
      })
      return null
    }

    try {
      setIsLoading(true)
      const propertyIds = comparisonProperties.map(p => p.id)
      const result = await comparisonApi.compareProperties(propertyIds)
      toast.success(`✓ Successfully compared ${comparisonProperties.length} properties`, {
        duration: 4000,
        icon: '✅',
      })
      return result
    } catch (error) {
      toast.error('Unable to compare properties', {
        duration: 4000,
        icon: '❌',
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const saveComparison = async (name: string) => {
    if (comparisonProperties.length < 2) {
      toast.error('Add at least 2 properties to save comparison', {
        duration: 4000,
        icon: '💾',
      })
      return null
    }

    try {
      setIsLoading(true)
      const propertyIds = comparisonProperties.map(p => p.id)
      const result = await comparisonApi.saveComparison(propertyIds, name)

      toast.success('✓ Your comparison has been saved successfully', {
        duration: 4000,
        icon: '💾',
      })
      await loadSavedComparisons()
      return result
    } catch (error) {
      toast.error('Unable to save comparison', {
        duration: 4000,
        icon: '❌',
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSavedComparison = async (comparisonId: number) => {
    try {
      setIsLoading(true)
      await comparisonApi.deleteComparison(comparisonId)

      toast.success('✓ Comparison deleted successfully', {
        duration: 3000,
        icon: '🗑️',
      })
      await loadSavedComparisons()
    } catch (error) {
      toast.error('Unable to delete comparison', {
        duration: 4000,
        icon: '⚠️',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearComparison = async () => {
    try {
      setIsLoading(true)
      await comparisonApi.clearComparisonSession()
      setComparisonProperties([])

      toast.success('✓ Comparison cleared successfully', {
        duration: 3000,
        icon: '🧹',
      })
    } catch (error) {
      toast.error('Unable to clear comparison', {
        duration: 4000,
        icon: '⚠️',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update loadSavedComparison function in useComparison.ts
const loadSavedComparison = useCallback(async (comparisonId: number) => {
  try {
    setIsLoading(true)
    
    const savedComparison = savedComparisons.find(c => c.id === comparisonId)
    if (!savedComparison) {
      toast.error('Comparison not found')
      return
    }
    
    // Clear current comparison first
    await clearComparison()
    
    try {
      // Try bulk add if available
      const propertyIds = savedComparison.properties.map(p => p.id)
      
      let successCount = 0
      for (let i = 0; i < savedComparison.properties.length; i++) {
        const property = savedComparison.properties[i]
        try {
          
          // Check if already in comparison to avoid toggle issues
          const currentSession = await comparisonApi.getComparisonSession()
          const isAlreadyInSession = currentSession.properties.some(p => p.id === property.id)
          
          if (!isAlreadyInSession) {
            await comparisonApi.addToComparisonSession(property.id)
            successCount++
          } else {
            successCount++ // Count as success since it's already there
          }
          
          // Longer delay to ensure API processes each request
          await new Promise(resolve => setTimeout(resolve, 200))
          
        } catch (propError) {
        }
      }
      
      // Reload the comparison session to get updated state
      await loadComparisonSession()
      
      if (successCount === savedComparison.properties.length) {
        toast.success(`✓ Loaded ${successCount} properties from "${savedComparison.name}"`, {
          duration: 3000,
          icon: '📋',
        })
      } else if (successCount >= 2) {
        toast.success(`✓ Loaded ${successCount} of ${savedComparison.properties.length} properties`, {
          duration: 3000,
          icon: '📋',
        })
      } else {
        toast.error(`Only loaded ${successCount} properties. Need at least 2 to compare.`, {
          duration: 4000,
          icon: '⚠️',
        })
      }
      
    } catch (apiError) {
      toast.error('Failed to load some properties', {
        duration: 4000,
        icon: '⚠️',
      })
    }
    
  } catch (error) {
    toast.error('Failed to load comparison', {
      duration: 4000,
      icon: '⚠️',
    })
  } finally {
    setIsLoading(false)
  }
}, [savedComparisons, clearComparison, loadComparisonSession])

  const exportComparison = async (format: 'csv' | 'json' | 'pdf' = 'csv') => {
    if (comparisonProperties.length < 2) {
      toast.error('Add at least 2 properties to export', {
        duration: 4000,
        icon: '📤',
      })
      return
    }

    try {
      setIsLoading(true)
      const propertyIds = comparisonProperties.map(p => p.id)

      // First, try to get comparison data
      let comparisonResult: any

      try {
        comparisonResult = await compareProperties()
        if (!comparisonResult) {
          throw new Error('Comparison failed')
        }
      } catch (compareError) {
        console.error('Comparison failed:', compareError)
        // Fallback to local data
        comparisonResult = {
          properties: comparisonProperties,
          matrix: ComparisonUtils.formatComparisonData(comparisonProperties).matrix,
          summary: {
            total_properties: comparisonProperties.length,
            price_range: {
              min: Math.min(...comparisonProperties.map(p => p.price_etb || 0)),
              max: Math.max(...comparisonProperties.map(p => p.price_etb || 0)),
              avg: comparisonProperties.reduce((sum, p) => sum + (p.price_etb || 0), 0) / comparisonProperties.length
            }
          }
        }
        toast('Using local data for export', {
          duration: 3000,
          icon: '📋',
        })
      }

      let data: string
      let filename: string
      let mimeType: string

      if (format === 'csv') {
        data = convertToCSV(comparisonResult)
        filename = `comparison_${Date.now()}.csv`
        mimeType = 'text/csv'
      } else if (format === 'json') {
        data = JSON.stringify(comparisonResult, null, 2)
        filename = `comparison_${Date.now()}.json`
        mimeType = 'application/json'
      } else {
        toast('PDF export will be available soon', {
          duration: 3000,
          icon: '📄',
        })
        return
      }

      downloadFile(data, filename, mimeType)
      toast.success(`✓ Comparison exported as ${format.toUpperCase()}`, {
        duration: 4000,
        icon: '📤',
      })
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Unable to export comparison', {
        duration: 4000,
        icon: '❌',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const convertToCSV = (data: any): string => {
    if (!data || !data.matrix) return ''

    const fields = data.fields || []
    const matrix = data.matrix || {}
    const properties = data.properties || []

    const headers = ['Feature', ...properties.map((p: any, i: number) => `Property ${i + 1}`)]
    const rows = fields.map((field: string) => {
      const values = matrix[field] || []
      return [field, ...values.map((v: any) =>
        v === true ? 'Yes' : v === false ? 'No' : String(v || '-')
      )]
    })

    return [headers, ...rows].map(row =>
      row.map((cell: any) => `"${cell}"`).join(',')
    ).join('\n')
  }

  // Helper functions
  const hasEnoughProperties = comparisonProperties.length >= 2
  const canAddMore = comparisonProperties.length < 10
  const isInComparison = (propertyId: number) =>
    comparisonProperties.some(p => p.id === propertyId)

  return {
    // State
    comparisonProperties,
    savedComparisons,
    sessionId,
    isLoading: isLoading || isLoadingSaved,
    isLoadingSaved,
    hasLoadedSaved,
    savedComparisonsError,

    // Actions
    addToComparison,
    removeFromComparison,
    compareProperties,
    saveComparison,
    deleteSavedComparison,
    clearComparison,
    exportComparison,
    loadComparisonSession,
    loadSavedComparisons,
    loadSavedComparison,

    // Helpers
    hasEnoughProperties,
    canAddMore,
    isInComparison,
  }
}