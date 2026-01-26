// app/[locale]/account/saved/SavedPropertiesContent.tsx - FIXED
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import PropertyCard from '@/components/listings/PropertyCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import {
  Heart,
  HeartOff,
  Download,
  Share2,
  Trash2,
  Bell,
  Eye,
  Calendar,
  Filter,
  Search,
  AlertCircle,
  Check,
  TrendingUp,
  X,
  Smartphone,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

// Hooks
import { useSavedProperties } from '@/lib/hooks/useSavedProperties';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/lib/store/authStore';

// Utility functions
function SavedPropertiesContent({ locale }: { locale: string }) {
  const t = useTranslations('savedProperties');
  const tCommon = useTranslations('common');
  const { isAuthenticated, isLoading: authLoading, hasHydrated } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recently_saved');
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);

  // Use the saved properties hook
  const {
    savedProperties,
    isLoading: propertiesLoading,
    error,
    toggleSaveProperty,
    refreshSavedProperties
  } = useSavedProperties();

  // Filter and sort properties
  const filteredProperties = useMemo(() => {
    if (!savedProperties) return [];

    let filtered = [...savedProperties];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(property =>
        property.title.toLowerCase().includes(query) ||
        property.description.toLowerCase().includes(query) ||
        property.specific_location.toLowerCase().includes(query) ||
        property.sub_city?.name.toLowerCase().includes(query) ||
        property.property_type.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recently_saved':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price_low_high':
          return a.price_etb - b.price_etb;
        case 'price_high_low':
          return b.price_etb - a.price_etb;
        case 'recently_listed':
          return new Date(b.listed_date).getTime() - new Date(a.listed_date).getTime();
        case 'most_viewed':
          return b.views_count - a.views_count;
        default:
          return 0;
      }
    });

    return filtered;
  }, [savedProperties, searchQuery, sortBy]);

  // Handle property selection
  const togglePropertySelection = React.useCallback((propertyId: number) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  }, []);

  // Handle bulk removal
  const handleBulkRemove = React.useCallback(async () => {
    if (selectedProperties.length === 0) return;

    try {
      setIsClearingAll(true);

      // Remove each selected property
      for (const propertyId of selectedProperties) {
        const property = savedProperties.find(p => p.id === propertyId);
        if (property) {
          await toggleSaveProperty(property);
        }
      }

      // Clear selection
      setSelectedProperties([]);

      toast({
        title: t('toasts.bulkRemoveSuccess'),
        description: t('toasts.bulkRemoveDescription', { count: selectedProperties.length }),
      });

      // Refresh the list
      await refreshSavedProperties();

    } catch (error: any) {
      console.error('Error removing properties:', error);
      toast({
        title: t('toasts.error'),
        description: error.message || t('toasts.removeError'),
        variant: 'destructive',
      });
    } finally {
      setIsClearingAll(false);
    }
  }, [selectedProperties, savedProperties, toggleSaveProperty, refreshSavedProperties, t, toast]);

  // Handle clear all saved properties
  const handleClearAll = React.useCallback(async () => {
    if (!savedProperties.length) return;

    if (!confirm(t('clearAllConfirmation') || 'Are you sure you want to remove all saved properties?')) return;

    try {
      setIsClearingAll(true);

      // Remove all properties one by one
      for (const property of savedProperties) {
        await toggleSaveProperty(property);
      }

      toast({
        title: t('toasts.clearAllSuccess') || 'All properties removed',
        description: t('toasts.clearAllDescription') || 'All saved properties have been cleared',
      });

      // Refresh the list
      await refreshSavedProperties();

    } catch (error: any) {
      console.error('Error clearing all properties:', error);
      toast({
        title: t('toasts.error') || 'Error',
        description: error.message || t('toasts.clearAllError') || 'Failed to clear all properties',
        variant: 'destructive',
      });
    } finally {
      setIsClearingAll(false);
    }
  }, [savedProperties, toggleSaveProperty, refreshSavedProperties, t, toast]);

  // Redirect if not authenticated
  useEffect(() => {
    // Only check after store has hydrated
    if (!hasHydrated || authLoading) {
      console.log('Waiting for auth hydration...');
      return;
    }
    
    console.log('Auth state:', { isAuthenticated, hasHydrated, authLoading });
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      router.push(`/${locale}/auth/login?redirect=/account/saved`);
    } else {
      console.log('User authenticated, rendering content');
      setShouldRender(true);
    }
  }, [isAuthenticated, authLoading, hasHydrated, locale, router]);

  // Show loading while checking authentication or loading properties
  if (!hasHydrated || authLoading || !shouldRender || propertiesLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 md:h-8 w-32 md:w-48" />
              <Skeleton className="h-3 md:h-4 w-40 md:w-64" />
            </div>
            <Skeleton className="h-8 md:h-10 w-24 md:w-32" />
          </div>
        </div>

        {/* Properties Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2 md:space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
              <Skeleton className="h-4 md:h-6 w-3/4" />
              <Skeleton className="h-3 md:h-4 w-full" />
              <Skeleton className="h-3 md:h-4 w-2/3" />
              <div className="flex justify-between">
                <Skeleton className="h-8 md:h-10 w-20 md:w-24" />
                <Skeleton className="h-8 md:h-10 w-20 md:w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8 md:py-12">
        <div className="mx-auto w-16 h-16 md:w-24 md:h-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4 md:mb-6">
          <AlertCircle className="h-8 w-8 md:h-12 md:w-12 text-red-500" />
        </div>
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {t('errorState.title') || 'Unable to load saved properties'}
        </h3>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6 max-w-md mx-auto">
          {error}
        </p>
        <div className="space-x-3 md:space-x-4">
          <Button onClick={() => refreshSavedProperties()} size="sm">
            {tCommon('retry') || 'Try Again'}
          </Button>
          <Button variant="outline" asChild size="sm">
            <a href={`/${locale}/listings`}>
              {t('errorState.ctaBrowse') || 'Browse Properties'}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with stats and actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">

        <div className="flex items-center gap-2">
          {savedProperties.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={isClearingAll}
                className="gap-1 md:gap-2"
              >
                {isClearingAll ? (
                  <div className="h-3 w-3 md:h-4 md:w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                )}
                <span className="hidden sm:inline">{t('actions.clearAll') || 'Clear All'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1 md:gap-2"
                onClick={() => {
                  // Export functionality
                  toast({
                    title: t('toasts.exportStarted') || 'Export started',
                    description: t('toasts.exportDescription') || 'Your saved properties list is being exported',
                  });
                }}
              >
                <Download className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{t('actions.export') || 'Export'}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {savedProperties.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.totalProperties') || 'Total Properties'}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {savedProperties.length}
                </p>
              </div>
              <Heart className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.activeListings') || 'Active Listings'}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {savedProperties.filter(p => p.is_active).length}
                </p>
              </div>
              <Eye className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.recentlyAdded') || 'Recently Added'}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  {savedProperties.filter(p => {
                    const daysAgo = (Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
                    return daysAgo <= 7;
                  }).length}
                </p>
              </div>
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-amber-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('stats.viewMode') || 'View Mode'}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white capitalize">
                  {viewMode}
                </p>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-0.5 md:space-y-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-4 h-1 md:w-6 md:h-2 bg-purple-500 rounded" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and filters - Mobile */}
      {savedProperties.length > 0 && (
        <>
          {/* Mobile search bar */}
          <div className="md:hidden space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('searchPlaceholder') || 'Search saved properties...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <Filter className="h-4 w-4" />
                Filter
                {showMobileFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setShowMobileSort(!showMobileSort)}
              >
                <TrendingUp className="h-4 w-4" />
                Sort
                {showMobileSort ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Mobile filters dropdown */}
            {showMobileFilters && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 dark:text-white">View Mode</h4>
                  <div className="flex border rounded-lg p-1 bg-gray-50 dark:bg-gray-800">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="px-2 text-xs"
                    >
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="px-2 text-xs"
                    >
                      List
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Mobile sort dropdown */}
            {showMobileSort && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">Sort By</h4>
                {['recently_saved', 'price_low_high', 'price_high_low', 'recently_listed', 'most_viewed'].map((option) => (
                  <Button
                    key={option}
                    variant={sortBy === option ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setSortBy(option);
                      setShowMobileSort(false);
                    }}
                    className="w-full justify-start text-xs"
                  >
                    {option === 'recently_saved' && 'Recently Saved'}
                    {option === 'price_low_high' && 'Price: Low to High'}
                    {option === 'price_high_low' && 'Price: High to Low'}
                    {option === 'recently_listed' && 'Recently Listed'}
                    {option === 'most_viewed' && 'Most Viewed'}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop search and filters */}
          <div className="hidden md:flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('searchPlaceholder') || 'Search saved properties...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex border rounded-lg p-1 bg-gray-50 dark:bg-gray-800">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-3"
                >
                  {tCommon('gridView') || 'Grid'}
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3"
                >
                  {tCommon('listView') || 'List'}
                </Button>
              </div>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {t('sortBy') || 'Sort by'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <DropdownMenuItem onClick={() => setSortBy('recently_saved')} className="dark:text-gray-300 dark:hover:bg-gray-700">
                    {t('sortOptions.recentlySaved') || 'Recently Saved'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price_low_high')} className="dark:text-gray-300 dark:hover:bg-gray-700">
                    {t('sortOptions.priceLowHigh') || 'Price: Low to High'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price_high_low')} className="dark:text-gray-300 dark:hover:bg-gray-700">
                    {t('sortOptions.priceHighLow') || 'Price: High to Low'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('recently_listed')} className="dark:text-gray-300 dark:hover:bg-gray-700">
                    {t('sortOptions.recentlyListed') || 'Recently Listed'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('most_viewed')} className="dark:text-gray-300 dark:hover:bg-gray-700">
                    {t('sortOptions.mostViewed') || 'Most Viewed'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </>
      )}

      {/* Bulk Actions */}
      {selectedProperties.length > 0 && (
        <div className="sticky top-4 md:top-6 z-10 mb-4 md:mb-6">
          <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-3 md:p-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
              <div className="flex items-center gap-2 md:gap-4">
                <Badge className="bg-white text-blue-600 border-0 text-xs">
                  {selectedProperties.length} {t('bulkActions.selected') || 'selected'}
                </Badge>
                <p className="text-white text-xs md:text-sm">
                  {t('bulkActions.description') || 'Properties selected for bulk actions'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs"
                  onClick={() => {
                    // Share functionality
                    toast({
                      title: t('toasts.shareStarted') || 'Sharing started',
                      description: t('toasts.shareDescription') || 'Preparing selected properties for sharing',
                    });
                  }}
                >
                  <Share2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">{t('bulkActions.share') || 'Share Selected'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:text-red-100 hover:border-red-300 text-xs"
                  onClick={handleBulkRemove}
                >
                  <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">{t('bulkActions.remove') || 'Remove Selected'}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 text-xs"
                  onClick={() => setSelectedProperties([])}
                >
                  {t('bulkActions.clear') || 'Clear'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Properties list */}
      {savedProperties.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <div className="mx-auto w-16 h-16 md:w-24 md:h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 md:mb-6">
            <Heart className="h-8 w-8 md:h-12 md:w-12 text-gray-400" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('emptyState.title') || 'No saved properties yet'}
          </h3>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6 max-w-md mx-auto">
            {t('emptyState.description') || 'Start browsing properties and click the heart icon to save your favorites here.'}
          </p>
          <div className="space-x-3 md:space-x-4">
            <Button asChild size="sm">
              <a href={`/${locale}/listings`}>
                {t('emptyState.ctaBrowse') || 'Browse Properties'}
              </a>
            </Button>
          </div>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <div className="mx-auto w-16 h-16 md:w-24 md:h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 md:mb-6">
            <Search className="h-8 w-8 md:h-12 md:w-12 text-gray-400" />
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('noResults.title') || 'No matching properties found'}
          </h3>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6 max-w-md mx-auto">
            {t('noResults.description') || 'Try adjusting your search filters or clear the search to see all saved properties.'}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSortBy('recently_saved');
            }}
            size="sm"
          >
            {t('noResults.resetFilters') || 'Reset Filters'}
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'
          : 'space-y-4 md:space-y-6'
        }>
          {filteredProperties.map((property) => (
            <div key={property.id} className="group relative">
              {/* Selection checkbox */}
              <div className="absolute top-3 md:top-4 left-3 md:left-4 z-20">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePropertySelection(property.id);
                  }}
                  className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedProperties.includes(property.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white/80 border-gray-300 hover:border-blue-500 dark:bg-gray-800/80 dark:border-gray-600'
                    }`}
                >
                  {selectedProperties.includes(property.id) && (
                    <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
                  )}
                </button>
              </div>

              {/* Property card */}
              <PropertyCard
                property={property}
                viewMode={viewMode}
                showSaveButton={false}
                showComparisonButton={true}
                className="relative"
              />

              {/* Action buttons on hover */}
              <div className="absolute top-3 md:top-4 right-3 md:right-4 flex flex-col gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      await toggleSaveProperty(property);
                      toast({
                        title: t('toasts.removed') || 'Property removed',
                        description: t('toasts.removedDescription') || 'Property removed from your saved list',
                      });
                    } catch (error: any) {
                      toast({
                        title: t('toasts.error') || 'Error',
                        description: error.message || t('toasts.removeError') || 'Failed to remove property',
                        variant: 'destructive',
                      });
                    }
                  }}
                  className="bg-white/90 backdrop-blur-sm hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900 shadow-lg h-7 w-7 md:h-9 md:w-9"
                >
                  <HeartOff className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-white/90 backdrop-blur-sm hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900 shadow-lg h-7 w-7 md:h-9 md:w-9"
                    >
                      <Share2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <DropdownMenuItem onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/${locale}/listings/${property.id}`
                      );
                      toast({
                        title: t('toasts.linkCopied') || 'Link copied',
                        description: t('toasts.linkCopiedDescription') || 'Property link copied to clipboard',
                      });
                    }} className="dark:text-gray-300 dark:hover:bg-gray-700">
                      {t('actions.copyLink') || 'Copy Link'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Saved indicator */}
              <div className="absolute top-3 md:top-4 left-9 md:left-12">
                <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 gap-1 text-xs">
                  <Heart className="h-2.5 w-2.5 md:h-3 md:w-3 fill-current" />
                  {t('savedBadge') || 'Saved'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more button (if needed) */}
      {filteredProperties.length > 0 && filteredProperties.length < savedProperties.length && (
        <div className="text-center pt-4 md:pt-6">
          <Button
            variant="outline"
            onClick={async () => {
              // In a real app, this would load more properties
              toast({
                title: t('toasts.loadingMore') || 'Loading more properties',
                description: t('toasts.loadingMoreDescription') || 'Fetching additional saved properties...',
              });
            }}
            size="sm"
          >
            {t('loadMore') || 'Load More Properties'}
          </Button>
        </div>
      )}
    </div>
  );
}

export { SavedPropertiesContent };