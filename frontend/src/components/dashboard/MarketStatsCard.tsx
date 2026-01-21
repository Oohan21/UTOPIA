'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, Home, DollarSign, BarChart3 } from 'lucide-react'

interface MarketStatsCardProps {
  stats?: any
}

export default function MarketStatsCard({ stats }: MarketStatsCardProps) {
  const defaultStats = {
    summary: {
      average_price: 2500000,
      median_price: 2200000,
      price_range: { min: 1000000, max: 5000000 },
      total_listings: 1245,
      average_bedrooms: 3.2,
      average_area: 140,
      average_price_per_sqm: 17857,
    },
    trends: {
      price_change_30d: 2.5,
      new_listings_30d: 45,
      average_days_on_market: 45,
      inventory_months: 3.2,
    },
  }

  const data = stats || defaultStats

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="dark:bg-gray-800">
        <CardTitle className="dark:text-white">Market Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 dark:bg-gray-800">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground dark:text-gray-400">Avg. Price</span>
              <DollarSign className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </div>
            <div className="text-2xl font-semibold dark:text-white">
              {data.summary.average_price.toLocaleString()} ETB
            </div>
          </div>

          <div className="rounded-lg border p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground dark:text-gray-400">Total Listings</span>
              <Home className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </div>
            <div className="text-2xl font-semibold dark:text-white">
              {data.summary.total_listings.toLocaleString()}
            </div>
          </div>

          <div className="rounded-lg border p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground dark:text-gray-400">Price Change</span>
              {data.trends.price_change_30d > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className={`text-2xl font-semibold ${
              data.trends.price_change_30d > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {data.trends.price_change_30d > 0 ? '+' : ''}{data.trends.price_change_30d}%
            </div>
            <div className="text-sm text-muted-foreground dark:text-gray-400">Last 30 days</div>
          </div>

          <div className="rounded-lg border p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground dark:text-gray-400">Avg. Days on Market</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
            </div>
            <div className="text-2xl font-semibold dark:text-white">
              {data.trends.average_days_on_market}
            </div>
            <div className="text-sm text-muted-foreground dark:text-gray-400">days</div>
          </div>
        </div>

        {/* Price Distribution */}
        <div>
          <h4 className="mb-4 font-medium dark:text-gray-300">Price Distribution</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm dark:text-gray-400">Under 1M ETB</span>
              <div className="w-32">
                <div className="h-2 rounded-full bg-muted dark:bg-gray-700">
                  <div className="h-full w-1/4 rounded-full bg-blue-500"></div>
                </div>
              </div>
              <span className="text-sm font-medium dark:text-gray-300">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm dark:text-gray-400">1M - 3M ETB</span>
              <div className="w-32">
                <div className="h-2 rounded-full bg-muted dark:bg-gray-700">
                  <div className="h-full w-2/5 rounded-full bg-green-500"></div>
                </div>
              </div>
              <span className="text-sm font-medium dark:text-gray-300">40%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm dark:text-gray-400">3M - 5M ETB</span>
              <div className="w-32">
                <div className="h-2 rounded-full bg-muted dark:bg-gray-700">
                  <div className="h-full w-1/5 rounded-full bg-yellow-500"></div>
                </div>
              </div>
              <span className="text-sm font-medium dark:text-gray-300">20%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm dark:text-gray-400">5M+ ETB</span>
              <div className="w-32">
                <div className="h-2 rounded-full bg-muted dark:bg-gray-700">
                  <div className="h-full w-1/5 rounded-full bg-red-500"></div>
                </div>
              </div>
              <span className="text-sm font-medium dark:text-gray-300">15%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}