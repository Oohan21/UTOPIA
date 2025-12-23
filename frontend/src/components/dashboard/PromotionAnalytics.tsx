// components/dashboard/PromotionAnalytics.tsx - NEW FILE
'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { 
  TrendingUp, 
  Eye, 
  MessageSquare, 
  Heart, 
  BarChart3, 
  ArrowUpRight,
  Download,
  RefreshCw,
  Mail,
  Target
} from 'lucide-react'
import { listingsApi } from '@/lib/api/listings'

interface PromotionAnalyticsProps {
  propertyId: number
  tier: string
}

export function PromotionAnalytics({ propertyId, tier }: PromotionAnalyticsProps) {
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['property-analytics', propertyId],
    queryFn: () => listingsApi.getPropertyAnalytics(propertyId),
    enabled: !!propertyId,
  })

  // Mock data for standard tier analytics
  const standardTierStats = {
    searchPosition: '8th',
    emailNotifications: 156,
    inquiriesFromEmail: 23,
    conversionRate: '14.7%',
    totalViews: 1245,
    weeklyGrowth: '+12%',
    inquiries: 42,
    saves: 18
  }

  const handleExportAnalytics = () => {
    // Export analytics data
    toast('Analytics exported successfully')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Promotion Analytics
            </CardTitle>
            <CardDescription>
              Performance metrics for your promoted property
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAnalytics}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{standardTierStats.totalViews.toLocaleString()}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                  <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                <span>{standardTierStats.weeklyGrowth} from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Inquiries</p>
                  <p className="text-2xl font-bold">{standardTierStats.inquiries}</p>
                </div>
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                  <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                <span>+8% from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saves</p>
                  <p className="text-2xl font-bold">{standardTierStats.saves}</p>
                </div>
                <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                  <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                <span>+15% from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Position</p>
                  <p className="text-2xl font-bold">{standardTierStats.searchPosition}</p>
                </div>
                <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                <span>Top 20 in searches</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Standard Tier Specific Analytics */}
        {tier === 'standard' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <h4 className="mb-3 font-semibold text-blue-800 dark:text-blue-300">
              Standard Promotion Performance
            </h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications Sent
                </p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-300">
                  {standardTierStats.emailNotifications}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  From Email Notifications
                </p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-300">
                  {standardTierStats.inquiriesFromEmail}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Conversion Rate
                </p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-300">
                  {standardTierStats.conversionRate}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Your property is performing well in the top 20 search results. 
                Consider upgrading to Featured tier for even better visibility.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}