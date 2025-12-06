// src/components/properties/ComparisonModal.tsx
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ScrollArea } from '@/components/ui/Scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import { 
  XIcon, 
  DownloadIcon, 
  SaveIcon, 
  BarChart3Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  CheckCircleIcon,
  FileTextIcon
} from 'lucide-react'
import { useComparison } from '@/lib/hooks/useComparison'
import { ComparisonUtils } from '@/lib/utils/comparison'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'

interface ComparisonModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose }) => {
  const { 
    comparisonProperties, 
    removeFromComparison,
    saveComparison,
    exportComparison,
    compareProperties,
    isLoading,
    clearComparison
  } = useComparison()
  
  const [saveName, setSaveName] = useState('')
  const [comparisonResult, setComparisonResult] = useState<any>(null)
  
  const handleCompare = async () => {
    const result = await compareProperties()
    if (result) {
      setComparisonResult(result)
    }
  }
  
  const handleSave = async () => {
    const name = saveName || `Comparison ${new Date().toLocaleDateString()}`
    const result = await saveComparison(name)
    if (result) {
      setSaveName('')
    }
  }
  
  const handleClear = async () => {
    await clearComparison()
    setComparisonResult(null)
  }
  
  const comparisonData = ComparisonUtils.formatComparisonData(comparisonProperties)
  const stats = ComparisonUtils.calculateComparisonStats(comparisonProperties)
  const recommendations = ComparisonUtils.generateComparisonRecommendations(comparisonProperties)
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3Icon className="h-5 w-5" />
              Property Comparison
              <Badge variant="secondary" className="ml-2">
                {comparisonProperties.length} properties
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={comparisonProperties.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          {comparisonProperties.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No properties to compare</h3>
              <p className="text-muted-foreground">
                Add properties to comparison to start comparing
              </p>
            </div>
          ) : (
            <>
              {/* Property Chips */}
              <div className="flex flex-wrap gap-2 mb-6">
                {comparisonProperties.map(property => (
                  <Badge key={property.id} variant="secondary" className="gap-2 pl-3">
                    {property.title || `Property ${property.id}`}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeFromComparison(property.id)}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              
              <Tabs defaultValue="table" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="table" className="flex items-center gap-2">
                    <FileTextIcon className="h-4 w-4" />
                    Comparison Table
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-2">
                    <BarChart3Icon className="h-4 w-4" />
                    Statistics
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4" />
                    Recommendations
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="table" className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Feature</TableHead>
                          {comparisonProperties.map((property, index) => (
                            <TableHead key={property.id} className="text-center">
                              Property {index + 1}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(comparisonData.matrix).map(([field, values]) => (
                          <TableRow key={field}>
                            <TableCell className="font-medium capitalize">
                              {field.replace(/_/g, ' ')}
                            </TableCell>
                            {values.map((value, index) => (
                              <TableCell key={index} className="text-center">
                                {value === true ? (
                                  <span className="text-green-600">✓</span>
                                ) : value === false ? (
                                  <span className="text-red-600">✗</span>
                                ) : value || '-'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="stats" className="mt-4">
                  {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Price Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Average Price:</span>
                              <span className="font-medium">
                                {stats.price.avg.toLocaleString()} ETB
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Price Range:</span>
                              <span className="font-medium">
                                {stats.price.min.toLocaleString()} - {stats.price.max.toLocaleString()} ETB
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Best Value:</span>
                              <span className="font-medium flex items-center gap-1">
                                {stats.pricePerSqm.bestValue?.title?.slice(0, 20)}...
                                <TrendingDownIcon className="h-4 w-4 text-green-600" />
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Area Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Average Area:</span>
                              <span className="font-medium">
                                {stats.area.avg.toFixed(1)} m²
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Size Range:</span>
                              <span className="font-medium">
                                {stats.area.min} - {stats.area.max} m²
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Price per m²:</span>
                              <span className="font-medium">
                                {stats.pricePerSqm.avg.toLocaleString()} ETB/m²
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium">Bedroom Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Bedroom Range:</span>
                              <span className="font-medium">
                                {stats.bedrooms.min} - {stats.bedrooms.max} bedrooms
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Most Common:</span>
                              <span className="font-medium">
                                {stats.bedrooms.mostCommon} bedrooms
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="recommendations" className="mt-4">
                  <div className="space-y-4">
                    {recommendations.length > 0 ? (
                      recommendations.map((rec, index) => (
                        <Card key={index}>
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                              {rec.type === 'best_value' && (
                                <TrendingDownIcon className="h-5 w-5 text-green-600 mt-0.5" />
                              )}
                              {rec.type === 'most_features' && (
                                <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                              )}
                              {rec.type === 'good_value' && (
                                <TrendingUpIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                              )}
                              {rec.type === 'negotiation_opportunity' && (
                                <BarChart3Icon className="h-5 w-5 text-purple-600 mt-0.5" />
                              )}
                              <div>
                                <h4 className="font-medium">{rec.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{rec.message}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircleIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No specific recommendations available for these properties
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </ScrollArea>
        
        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Input
              placeholder="Name your comparison"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="max-w-xs"
              disabled={comparisonProperties.length < 2}
            />
            <Button
              onClick={handleSave}
              disabled={comparisonProperties.length < 2 || isLoading}
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => exportComparison('csv')}
              disabled={comparisonProperties.length < 2}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => exportComparison('json')}
              disabled={comparisonProperties.length < 2}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button
              onClick={handleCompare}
              disabled={comparisonProperties.length < 2 || isLoading}
            >
              <BarChart3Icon className="h-4 w-4 mr-2" />
              Compare Now
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}