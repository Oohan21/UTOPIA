// lib/hooks/useComparison.ts
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { comparisonApi } from '@/lib/api/comparison'
import { Property } from '@/lib/types/property'
import { ComparisonUtils } from '@/lib/utils/comparison'

export interface SavedComparison {
  id: number
  name: string
  properties: Property[]
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
  const [sessionId, setSessionId] = useState<string>('')

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

  const loadSavedComparisons = async () => {
    try {
      const comparisons = await comparisonApi.getSavedComparisons()
      setSavedComparisons(comparisons)
    } catch (error) {
      console.error('Failed to load saved comparisons:', error)
      toast.error('Failed to load saved comparisons')
    }
  }

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
      console.error('Failed to add to comparison:', error)
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
      console.error('Failed to remove from comparison:', error)
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
      console.error('Comparison failed:', error)
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
      console.error('Failed to save comparison:', error)
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
      console.error('Failed to delete comparison:', error)
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
      console.error('Failed to clear comparison:', error)
      toast.error('Unable to clear comparison', {
        duration: 4000,
        icon: '⚠️',
      })
    } finally {
      setIsLoading(false)
    }
  }

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
    isLoading,
    sessionId,

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

    // Helpers
    hasEnoughProperties,
    canAddMore,
    isInComparison,
  }
}