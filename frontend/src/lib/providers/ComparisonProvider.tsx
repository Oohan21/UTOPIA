// lib/providers/ComparisonProvider.tsx
'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Property } from '@/lib/types/property'

interface ComparisonContextType {
  comparisonProperties: Property[]
  addToComparison: (property: Property) => void
  removeFromComparison: (propertyId: number) => void
  clearComparison: () => void
  isInComparison: (propertyId: number) => boolean
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined)

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisonProperties, setComparisonProperties] = useState<Property[]>([])

  const addToComparison = (property: Property) => {
    if (comparisonProperties.length >= 10) {
      throw new Error('Cannot compare more than 10 properties')
    }
    if (!comparisonProperties.find(p => p.id === property.id)) {
      setComparisonProperties([...comparisonProperties, property])
    }
  }

  const removeFromComparison = (propertyId: number) => {
    setComparisonProperties(prev => prev.filter(p => p.id !== propertyId))
  }

  const clearComparison = () => {
    setComparisonProperties([])
  }

  const isInComparison = (propertyId: number) => {
    return comparisonProperties.some(p => p.id === propertyId)
  }

  return (
    <ComparisonContext.Provider
      value={{
        comparisonProperties,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  )
}

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider')
  }
  return context
}