'use client'

import React, { useState } from 'react'
import Header from '@/components/common/Header/Header'
import ValuationForm from '@/components/valuation/ValuationForm'
import ValuationResultComponent from '@/components/valuation/ValuationResult'
import MarketStatsCard from '@/components/dashboard/MarketStatsCard'
import { ValuationResult } from '@/lib/types/valuation'
import { Calculator, TrendingUp, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'

export default function ValuationPage() {
  const [valuationResult, setValuationResult] = useState<ValuationResult | null>(null)

  const handleValuationComplete = (result: ValuationResult) => {
    setValuationResult(result)
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Property Valuation</h1>
          <p className="text-muted-foreground">
            Get an instant, data-driven valuation of your property
          </p>
        </div>

        <Tabs defaultValue="valuation" className="space-y-6">
          <TabsList>
            <TabsTrigger value="valuation" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Valuation Tool
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Market Data
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="valuation" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ValuationForm onValuationComplete={handleValuationComplete} />
              </div>
              
              <div className="space-y-6">
                {valuationResult ? (
                  <ValuationResultComponent result={valuationResult} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg bg-primary/10 p-4">
                        <div className="text-sm font-medium text-primary">Step 1</div>
                        <p className="text-sm">Enter your property details</p>
                      </div>
                      <div className="rounded-lg bg-primary/10 p-4">
                        <div className="text-sm font-medium text-primary">Step 2</div>
                        <p className="text-sm">Add features and condition</p>
                      </div>
                      <div className="rounded-lg bg-primary/10 p-4">
                        <div className="text-sm font-medium text-primary">Step 3</div>
                        <p className="text-sm">Get instant valuation</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Tips for Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• Be specific about location</p>
                    <p>• Include all property features</p>
                    <p>• Consider recent renovations</p>
                    <p>• Compare with similar properties</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="market">
            <MarketStatsCard />
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>Market Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Market insights will be displayed here...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}