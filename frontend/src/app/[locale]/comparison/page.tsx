// src/app/comparison/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/common/Header/Header'
import { ComparisonModal } from '@/components/properties/ComparisonModal'
import { ComparisonFloatingButton } from '@/components/properties/ComparisonFloatingButton'
import { useComparison } from '@/lib/hooks/useComparison'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  BarChart3,
  Download,
  Plus,
  Trash2,
  Share2,
  GitCompare
} from 'lucide-react'

export default function ComparisonPage() {
  const {
    comparisonProperties,
    savedComparisons,
    removeFromComparison,
    deleteSavedComparison,
    exportComparison,
    clearComparison,
    hasEnoughProperties,
    isLoading,
    loadComparisonSession
  } = useComparison()
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Reload comparison session when component mounts
    loadComparisonSession()
  }, [])

  // Add loading state
  if (isLoading && comparisonProperties.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto py-8">
          <div className="text-center py-12">Loading comparison...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Property Comparison</h1>
            <p className="text-muted-foreground">
              Compare up to 10 properties side by side
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={clearComparison}
              variant="outline"
              disabled={comparisonProperties.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={!hasEnoughProperties}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Compare Now ({comparisonProperties.length})
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Comparison Session */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Properties in Comparison</span>
                  <Badge variant="secondary">
                    {comparisonProperties.length}/10
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {comparisonProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <GitCompare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No properties added</h3>
                    <p className="text-muted-foreground mb-4">
                      Add properties from listings to start comparing
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Browse Properties
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {comparisonProperties.map(property => (
                        <div key={property.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{property.title}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromComparison(property.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span>Price:</span>
                              <span className="font-medium">
                                {property.price_etb?.toLocaleString() || 'N/A'} ETB
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Area:</span>
                              <span>{property.total_area || 'N/A'} m²</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Bedrooms:</span>
                              <span>{property.bedrooms || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => exportComparison('csv')}
                        disabled={comparisonProperties.length < 2}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" disabled={comparisonProperties.length < 2}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button
                          onClick={() => setIsModalOpen(true)}
                          disabled={!hasEnoughProperties}
                        >
                          Compare Properties
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Saved Comparisons */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Saved Comparisons</CardTitle>
              </CardHeader>
              <CardContent>
                {savedComparisons.length === 0 ? (
                  <div className="text-center py-8">
                    <GitCompare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      No saved comparisons yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedComparisons.map(comparison => (
                      <div
                        key={comparison.id}
                        className="border rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => {
                          // Load this comparison into the current session
                          // You might want to implement this functionality
                          console.log('Load comparison:', comparison.id)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm truncate">{comparison.name}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSavedComparison(comparison.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {comparison.properties?.length || 0} properties •
                          Saved {new Date(comparison.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <ComparisonModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
        <ComparisonFloatingButton />
      </div>
    </div>
  )
}