// src/app/comparison/page.tsx - DARK MODE VERSION
'use client'

import { useState, useEffect, useRef } from 'react'
import Header from "@/components/common/Header/Header";
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
  GitCompare,
  Save,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

export default function ComparisonPage() {
  const t = useTranslations('comparison')
  const tc = useTranslations('home')
  const locale = useLocale()
  const {
    comparisonProperties,
    savedComparisons,
    addToComparison,
    removeFromComparison,
    deleteSavedComparison,
    saveComparison,
    exportComparison,
    clearComparison,
    hasEnoughProperties,
    isLoading,
    isLoadingSaved,
    loadComparisonSession,
    loadSavedComparisons,
    loadSavedComparison,
    savedComparisonsError
  } = useComparison()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Add refs to prevent multiple loads
  const hasLoadedSession = useRef(false)
  const hasLoadedSaved = useRef(false)

  const handleSaveComparison = async () => {
    const name = prompt(t('savePrompt') || 'Enter name for this comparison:')
    if (name && name.trim()) {
      try {
        await saveComparison(name)
      } catch (error) {
        // Error toast is already handled in saveComparison
      }
    } else if (name !== null) {
      toast.error('Please enter a name for the comparison', {
        duration: 3000,
        icon: '⚠️',
      })
    }
  }

  if (isLoading && comparisonProperties.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/10 dark:from-gray-900 dark:to-gray-800/10">
        <div className="container mx-auto py-8">
          <div className="text-center py-12 dark:text-white">{t('loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/10">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 dark:from-white dark:to-white/80 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground dark:text-gray-400 mt-1">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={clearComparison}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
              disabled={comparisonProperties.length === 0 || isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('actions.clearAll')}</span>
            </Button>

            {/* Save Button */}
            <Button
              onClick={handleSaveComparison}
              variant="default"
              size="sm"
              className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 dark:from-green-700 dark:to-emerald-700 dark:hover:from-green-800 dark:hover:to-emerald-800 text-white shadow-lg"
              disabled={comparisonProperties.length < 2 || isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('actions.save')}</span>
              <span className="sm:hidden">{t('actions.saveShort')}</span>
            </Button>

            <Button
              onClick={() => setIsModalOpen(true)}
              disabled={!hasEnoughProperties || isLoading}
              size="sm"
              className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg dark:from-primary/90 dark:to-secondary/90 dark:hover:from-primary dark:hover:to-secondary"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('actions.compareNow')}</span>
              <span className="sm:hidden">{t('actions.compare')}</span>
              <Badge variant="secondary" className="ml-2 bg-white/20 text-white dark:bg-gray-800/50 dark:text-gray-300">
                {comparisonProperties.length}
              </Badge>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Current Comparison Session */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50 shadow-lg dark:shadow-gray-900/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-base md:text-lg">
                  <span className="text-foreground dark:text-white">{t('currentSession.title')}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs md:text-sm bg-gray-100 dark:bg-gray-800 dark:text-gray-300">
                      {comparisonProperties.length}/10
                    </Badge>
                    {hasEnoughProperties && (
                      <Button
                        onClick={handleSaveComparison}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30"
                        title={t('actions.save')}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {comparisonProperties.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <GitCompare className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">
                      {t('currentSession.emptyTitle')}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground dark:text-gray-400 mb-4">
                      {t('currentSession.emptyDescription')}
                    </p>
                    <Button asChild size="lg" className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                      <Link href={`/${locale}/listings`}>
                        {tc('browseProperties')}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {comparisonProperties.map(property => (
                        <div key={property.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-card dark:bg-gray-900/50 hover:bg-accent/50 dark:hover:bg-gray-800/50 transition-colors shadow-sm dark:shadow-gray-900/50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium truncate text-foreground dark:text-white text-sm md:text-base">
                              {property.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-destructive/10 dark:hover:bg-destructive/20"
                              onClick={() => removeFromComparison(property.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4 text-destructive dark:text-red-400" />
                            </Button>
                          </div>
                          <div className="space-y-2 text-xs md:text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground dark:text-gray-400">{t('currentSession.price')}:</span>
                              <span className="font-medium text-foreground dark:text-white">
                                {property.listing_type === 'for_sale'
                                  ? (property.price_etb?.toLocaleString() || 'N/A') + ' ETB'
                                  : (property.monthly_rent?.toLocaleString() || 'N/A') + ' ETB/month'
                                }
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground dark:text-gray-400">{t('currentSession.area')}:</span>
                              <span className="text-foreground dark:text-white">{property.total_area || 'N/A'} m²</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground dark:text-gray-400">{t('currentSession.bedrooms')}:</span>
                              <span className="text-foreground dark:text-white">{property.bedrooms || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground dark:text-gray-400">{t('currentSession.type')}:</span>
                              <Badge variant={property.listing_type === 'for_sale' ? 'default' : 'secondary'} className="text-xs bg-gradient-to-r from-primary to-secondary dark:from-primary/80 dark:to-secondary/80">
                                {property.listing_type === 'for_sale' ? 'Sale' : 'Rent'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border dark:border-gray-800">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportComparison('csv')}
                          disabled={comparisonProperties.length < 2 || isLoading}
                          className="flex-1 sm:flex-none border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t('actions.exportCSV')}
                        </Button>
                        <Button
                          onClick={handleSaveComparison}
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none border-green-600 text-green-600 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/30"
                          disabled={comparisonProperties.length < 2 || isLoading}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {t('actions.save')}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={comparisonProperties.length < 2 || isLoading}
                          className="flex-1 sm:flex-none border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
                          onClick={() => {
                            toast('Share functionality coming soon', {
                              duration: 3000,
                              icon: '🔗',
                            })
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">{t('actions.share')}</span>
                        </Button>
                        <Button
                          onClick={() => setIsModalOpen(true)}
                          disabled={!hasEnoughProperties || isLoading}
                          size="sm"
                          className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 dark:from-primary/90 dark:to-secondary/90 dark:hover:from-primary dark:hover:to-secondary"
                        >
                          {t('actions.compareProperties')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Saved Comparisons - Dark Mode */}
          <div>
            <Card className="border-2 border-primary/20 dark:border-primary/30 bg-gradient-to-br from-background to-muted/20 dark:from-gray-900/50 dark:to-gray-800/50 shadow-lg dark:shadow-gray-900/30 h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg text-foreground dark:text-white">
                    {t('savedComparisons.title')}
                    <Badge variant="outline" className="ml-2 text-xs border-gray-300 dark:border-gray-700 dark:text-gray-300">
                      {savedComparisons.length}
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      hasLoadedSaved.current = false
                      loadSavedComparisons()
                    }}
                    disabled={isLoadingSaved}
                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                    title="Refresh saved comparisons"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingSaved ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSaved ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 animate-pulse bg-gray-100/50 dark:bg-gray-800/50">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : savedComparisonsError ? (
                  <div className="text-center py-6 md:py-8">
                    <AlertCircle className="h-8 w-8 md:h-10 md:w-10 mx-auto text-red-500 dark:text-red-400 mb-2" />
                    <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                      Error loading saved comparisons
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-gray-500 mb-4">
                      {savedComparisonsError}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadSavedComparisons}
                      disabled={isLoadingSaved}
                      className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : savedComparisons.length === 0 ? (
                  <div className="text-center py-6 md:py-8">
                    <GitCompare className="h-8 w-8 md:h-10 md:w-10 mx-auto text-muted-foreground dark:text-gray-600 mb-2" />
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      {t('savedComparisons.empty')}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
                      onClick={loadSavedComparisons}
                      disabled={isLoadingSaved}
                    >
                      {isLoadingSaved ? 'Loading...' : 'Check for saved comparisons'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {savedComparisons.map(comparison => {
                      return (
                        <div
                          key={comparison.id}
                          className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 bg-card dark:bg-gray-900/50 hover:bg-accent/30 dark:hover:bg-gray-800/70 cursor-pointer transition-colors shadow-sm dark:shadow-gray-900/50"
                          onClick={() => {
                            if (loadSavedComparison) {
                              loadSavedComparison(comparison.id)
                            } else {
                              toast(`Loading saved comparisons is not implemented yet`, {
                                duration: 3000,
                                icon: '⚠️',
                              })
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate text-foreground dark:text-white">
                              {comparison.name}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-destructive/10 dark:hover:bg-destructive/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Are you sure you want to delete this saved comparison?')) {
                                  deleteSavedComparison(comparison.id)
                                }
                              }}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-3 w-3 text-destructive dark:text-red-400" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                            {comparison.properties?.length || 0} {t('savedComparisons.properties')} • {t('savedComparisons.saved')} {new Date(comparison.created_at).toLocaleDateString()}
                          </div>
                          {comparison.comparison_summary && (
                            <div className="mt-2 text-xs text-muted-foreground dark:text-gray-400 space-y-1">
                              {comparison.comparison_summary.price_range?.min && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium dark:text-gray-300">Price:</span>
                                  <span className="dark:text-gray-400">{comparison.comparison_summary.price_range.min.toLocaleString()} - {comparison.comparison_summary.price_range.max.toLocaleString()} ETB</span>
                                </div>
                              )}
                              {comparison.comparison_summary.area_range?.avg && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium dark:text-gray-300">Avg Area:</span>
                                  <span className="dark:text-gray-400">{comparison.comparison_summary.area_range.avg.toFixed(0)}m²</span>
                                </div>
                              )}
                              {comparison.comparison_summary.bedrooms_range?.avg && (
                                <div className="flex items-center gap-1">
                                  <span className="font-medium dark:text-gray-300">Avg Beds:</span>
                                  <span className="dark:text-gray-400">{comparison.comparison_summary.bedrooms_range.avg.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
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