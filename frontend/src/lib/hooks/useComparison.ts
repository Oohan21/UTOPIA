// src/lib/hooks/useComparison.ts
import { useState, useCallback, useEffect } from 'react'
import { comparisonApi } from '@/lib/api/comparison'
import { listingsApi } from '@/lib/api/listings'
import { Property } from '@/lib/types/property'
import toast from 'react-hot-toast'
import { ComparisonUtils } from '@/lib/utils/comparison'

export const useComparison = () => {
  const [comparisonProperties, setComparisonProperties] = useState<Property[]>([])
  const [savedComparisons, setSavedComparisons] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load comparison session on mount
  useEffect(() => {
    loadComparisonSession()
    loadSavedComparisons()
  }, [])

  const loadComparisonSession = async () => {
    try {
      const session = await listingsApi.getComparisonProperties()
      setComparisonProperties(session.properties || [])
    } catch (error) {
      console.error('Failed to load comparison session:', error)
    }
  }

  const loadSavedComparisons = async () => {
    try {
      const comparisons = await comparisonApi.getSavedComparisons()
      setSavedComparisons(comparisons)
    } catch (error) {
      console.error('Failed to load saved comparisons:', error)
    }
  }

  const addToComparison = async (property: Property | number) => {
    try {
      const propertyId = typeof property === 'number' ? property : property.id
      
      if (comparisonProperties.length >= 10) {
        toast.error('Cannot add more than 10 properties to comparison')
        return false
      }

      // Check if property is already in comparison
      if (comparisonProperties.some(p => p.id === propertyId)) {
        toast.error('Property already in comparison')
        return false
      }

      setIsLoading(true)
      const response = await comparisonApi.addToComparisonSession(propertyId)
      
      // Refresh comparison session
      await loadComparisonSession()
      
      toast.success('Property added to comparison')
      return true
    } catch (error) {
      toast.error('Failed to add property to comparison')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromComparison = async (propertyId: number) => {
    try {
      // Toggle removal
      await comparisonApi.addToComparisonSession(propertyId)
      await loadComparisonSession()
      toast.success('Property removed from comparison')
    } catch (error) {
      toast.error('Failed to remove property from comparison')
    }
  }

  const clearComparison = async () => {
    try {
      await comparisonApi.clearComparisonSession()
      setComparisonProperties([])
      toast.success('Comparison cleared')
    } catch (error) {
      toast.error('Failed to clear comparison')
    }
  }

  const compareProperties = async (propertyIds?: number[]) => {
    try {
      setIsLoading(true)
      const ids = propertyIds || comparisonProperties.map(p => p.id)
      
      if (ids.length < 2) {
        toast.error('Select at least 2 properties to compare')
        return null
      }

      const result = await comparisonApi.compareProperties(ids)
      return result
    } catch (error) {
      toast.error('Failed to compare properties')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const saveComparison = async (name?: string) => {
    try {
      const propertyIds = comparisonProperties.map(p => p.id)
      
      if (propertyIds.length < 2) {
        toast.error('Need at least 2 properties to save comparison')
        return null
      }

      const result = await comparisonApi.saveComparison(propertyIds, name)
      await loadSavedComparisons()
      toast.success('Comparison saved successfully')
      return result
    } catch (error) {
      toast.error('Failed to save comparison')
      return null
    }
  }

  const deleteSavedComparison = async (id: number) => {
    try {
      await comparisonApi.deleteComparison(id)
      await loadSavedComparisons()
      toast.success('Comparison deleted')
    } catch (error) {
      toast.error('Failed to delete comparison')
    }
  }

  const exportComparison = (format: 'csv' | 'json' = 'csv') => {
    const matrix = ComparisonUtils.formatComparisonData(comparisonProperties).matrix
    let data: string
    let mimeType: string
    let filename: string

    if (format === 'csv') {
      data = ComparisonUtils.exportComparisonToCSV(comparisonProperties, matrix!)
      mimeType = 'text/csv'
      filename = `property_comparison_${new Date().toISOString().split('T')[0]}.csv`
    } else {
      data = ComparisonUtils.exportComparisonToJSON(comparisonProperties, matrix!)
      mimeType = 'application/json'
      filename = `property_comparison_${new Date().toISOString().split('T')[0]}.json`
    }

    const blob = new Blob([data], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return {
    comparisonProperties,
    savedComparisons,
    isLoading,
    addToComparison,
    removeFromComparison,
    clearComparison,
    compareProperties,
    saveComparison,
    deleteSavedComparison,
    exportComparison,
    canAddMore: comparisonProperties.length < 10,
    hasEnoughProperties: comparisonProperties.length >= 2,
    refreshComparisons: loadSavedComparisons,
    refreshSession: loadComparisonSession
  }
}