'use client'

import React from 'react'
import { ValuationResult } from '@/lib/types/valuation'
import { formatCurrency } from '../../lib/utils/formatCurrency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TrendingUp, TrendingDown, Minus, DollarSign, Home, BarChart3 } from 'lucide-react'

interface ValuationResultProps {
  result: ValuationResult
}

export default function ValuationResultComponent({ result }: ValuationResultProps) {
  const getTrendIcon = () => {
    if (result.market_trend.includes('rising')) {
      return <TrendingUp className="h-5 w-5 text-green-500" />
    } else if (result.market_trend.includes('falling')) {
      return <TrendingDown className="h-5 w-5 text-red-500" />
    }
    return <Minus className="h-5 w-5 text-gray-500" />
  }

  const getConfidenceColor = () => {
    switch (result.confidence) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Valuation Result</CardTitle>
          <Badge className={getConfidenceColor()}>
            {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)} Confidence
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Based on {result.comparables_count} comparable properties
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estimated Value */}
        <div className="text-center">
          <div className="mb-2 text-sm text-muted-foreground">Estimated Value</div>
          <div className="text-4xl font-bold text-primary">
            {formatCurrency(result.estimated_value)}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Range: {formatCurrency(result.value_range.low)} - {formatCurrency(result.value_range.high)}
          </div>
        </div>

        {/* Market Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price per m²</span>
              <Home className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold">
              {formatCurrency(result.price_per_sqm)}/m²
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Market Trend</span>
              {getTrendIcon()}
            </div>
            <div className="text-2xl font-semibold capitalize">
              {result.market_trend}
            </div>
            <div className="text-sm text-muted-foreground">
              {result.trend_strength}% change
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Comparables</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold">
              {result.comparables_count}
            </div>
            <div className="text-sm text-muted-foreground">
              similar properties
            </div>
          </div>
        </div>

        {/* Notes */}
        {result.note && (
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <span className="text-sm">ℹ️</span>
              </div>
              <p className="text-sm text-muted-foreground">{result.note}</p>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> This is an automated valuation based on market data and 
            may not reflect the exact market value. For a precise valuation, consider consulting 
            with a professional real estate appraiser.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}