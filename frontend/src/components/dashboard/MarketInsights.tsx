// src/components/dashboard/MarketInsights.tsx
'use client';

import React, { useState } from 'react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatNumber } from '@/lib/utils/formatNumber';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { TrendingUp, TrendingDown, DollarSign, Home, MapPin, BarChart3, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

export const MarketInsights: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('all');

  const { data: marketOverview, isLoading, error } = useAnalytics.useMarketOverview('30d');
  const { data: priceAnalytics } = useAnalytics.usePriceAnalytics();
  const { data: demandAnalytics } = useAnalytics.useDemandAnalytics();

  // Helper functions to safely access data
  const getTotalListings = () => marketOverview?.summary?.total_listings || 0;
  const getActiveListings = () => marketOverview?.summary?.active_listings || 0;
  const getAveragePrice = () => marketOverview?.summary?.average_price || 0;
  const getPriceChangeWeekly = () => marketOverview?.trends?.price_change_weekly || marketOverview?.trends?.price_change_30d || 0;
  const getMarketHealth = () => {
    if (typeof marketOverview?.market_health === 'string') {
      return marketOverview.market_health;
    }
    return 'Moderate';
  };
  
  const getAbsorptionRate = () => {
    if (marketOverview?.market_health?.absorption_rate) {
      return marketOverview.market_health.absorption_rate;
    }
    if (typeof marketOverview?.market_health === 'object' && marketOverview.market_health) {
      return marketOverview.market_health.absorption_rate || 0;
    }
    return 0;
  };

  // Get top cities
  const getTopCities = () => {
    if (marketOverview?.top_performing_cities) {
      return marketOverview.top_performing_cities;
    }
    if (marketOverview?.distribution?.popular_areas) {
      return marketOverview.distribution.popular_areas.map((area: any) => ({
        name: area.name,
        property_count: area.count,
        average_price: area.avg_price,
        total_views: 0
      }));
    }
    return [];
  };

  // Get price distribution
  const getPriceDistribution = () => {
    if (marketOverview?.distribution?.price_distribution) {
      return marketOverview.distribution.price_distribution;
    }
    if (marketOverview?.distribution?.price_ranges) {
      return marketOverview.distribution.price_ranges;
    }
    return [];
  };

  // Mock personalized insights based on user's properties
  const personalizedInsights = [
    {
      title: 'Price Adjustment Opportunity',
      description: 'Your properties in Addis Ababa are priced 15% above market average',
      action: 'Consider adjusting prices to match market rates',
      priority: 'high' as const,
      icon: <DollarSign className="h-5 w-5 text-red-600" />
    },
    {
      title: 'High Demand Area',
      description: 'Properties in Bole area are receiving 3x more views than other areas',
      action: 'Consider listing more properties in this area',
      priority: 'medium' as const,
      icon: <MapPin className="h-5 w-5 text-green-600" />
    },
    {
      title: 'Seasonal Trend',
      description: 'Property demand typically increases by 25% in the next quarter',
      action: 'Prepare for increased inquiries',
      priority: 'low' as const,
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[140px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Market Insights</h3>
          <p className="text-gray-500 mb-4">
            There was an error loading market insights data. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Market Insights</h2>
          <p className="text-gray-600 mt-1">
            Personalized market analysis and recommendations
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCity} onValueChange={setSelectedCity} placeholder="City">
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              <SelectItem value="addis-ababa">Addis Ababa</SelectItem>
              <SelectItem value="dire-dawa">Dire Dawa</SelectItem>
              <SelectItem value="bahir-dar">Bahir Dar</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType} placeholder="Property Type">
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Personalized Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {personalizedInsights.map((insight, index) => (
          <Card key={index} className={
            insight.priority === 'high' ? 'border-red-200' :
            insight.priority === 'medium' ? 'border-yellow-200' :
            'border-gray-200'
          }>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {insight.icon}
                <div className="flex-1">
                  <div className="font-semibold mb-1">{insight.title}</div>
                  <div className="text-sm text-gray-600 mb-2">{insight.description}</div>
                  <div className="text-xs text-gray-500">{insight.action}</div>
                </div>
                <Badge variant={
                  insight.priority === 'high' ? 'destructive' :
                  insight.priority === 'medium' ? 'secondary' :
                  'outline'
                }>
                  {insight.priority}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Trends</TabsTrigger>
          <TabsTrigger value="demand">Demand Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Market Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Average Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(getAveragePrice(), 'ETB', true)}
                </div>
                <div className={`text-sm mt-1 flex items-center gap-1 ${
                  getPriceChangeWeekly() >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {getPriceChangeWeekly() >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {getPriceChangeWeekly() >= 0 ? '+' : ''}
                  {getPriceChangeWeekly().toFixed(1)}% weekly
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Active Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(getActiveListings())}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {formatNumber(getTotalListings())} total listings
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Market Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {getMarketHealth()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {getAbsorptionRate().toFixed(1)}% absorption rate
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Areas */}
          {getTopCities().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Areas</CardTitle>
                <CardDescription>
                  Cities with highest property demand
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getTopCities().slice(0, 5).map((city: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">{city.name}</div>
                          <div className="text-sm text-gray-500">
                            {formatNumber(city.property_count)} properties
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatCurrency(city.average_price, 'ETB', true)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatNumber(city.total_views)} views
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pricing Trends Tab */}
        <TabsContent value="pricing" className="space-y-6">
          {priceAnalytics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Price Trends by Property Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priceAnalytics.average_prices_by_property_type || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="property_type" />
                        <YAxis tickFormatter={(value) => formatCurrency(value, 'ETB', true)} />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(Number(value), 'ETB'), 'Average Price']}
                        />
                        <Bar dataKey="avg_price" name="Average Price" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Price Forecast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {priceAnalytics.price_forecast ? (
                      <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${
                          priceAnalytics.price_forecast.current_trend === 'rising'
                            ? 'bg-green-50 border border-green-200'
                            : priceAnalytics.price_forecast.current_trend === 'falling'
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <div className="font-medium capitalize">
                            {priceAnalytics.price_forecast.current_trend} Trend
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {priceAnalytics.price_forecast.forecast}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Price Change</span>
                            <span className={`font-semibold ${
                              priceAnalytics.price_forecast.price_change_percentage >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {priceAnalytics.price_forecast.price_change_percentage >= 0 ? '+' : ''}
                              {priceAnalytics.price_forecast.price_change_percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Confidence</span>
                            <span className="font-medium capitalize">
                              {priceAnalytics.price_forecast.confidence}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Insufficient data for price forecast
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Market Price Ranges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getPriceDistribution().map((range: any, index: number) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{range.range}</span>
                            <span className="font-medium">{range.count} properties</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${range.percentage || 0}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 text-right">
                            {(range.percentage || 0).toFixed(1)}% of market
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Demand Analysis Tab */}
        <TabsContent value="demand" className="space-y-6">
          {demandAnalytics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Demand by City</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={demandAnalytics.demand_by_city || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="city" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="total_views" 
                          name="Total Views" 
                          stroke="#3b82f6" 
                          fill="#3b82f622" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="total_inquiries" 
                          name="Total Inquiries" 
                          stroke="#10b981" 
                          fill="#10b98122" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">View to Inquiry Rate</div>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold">
                            {(demandAnalytics.view_to_inquiry_ratio?.conversion_rate || 0).toFixed(2)}%
                          </div>
                          <div className="text-sm text-gray-500">
                            Industry: {demandAnalytics.view_to_inquiry_ratio?.industry_average || 0}%
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Days on Market</div>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold">
                            {(demandAnalytics.days_on_market_average?.average_days || 0).toFixed(0)} days
                          </div>
                          <div className="text-sm text-gray-500">
                            Range: {demandAnalytics.days_on_market_average?.minimum_days || 0}-{demandAnalytics.days_on_market_average?.maximum_days || 0} days
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Seasonal Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {demandAnalytics.seasonal_trends ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="font-medium text-blue-800">Peak Season</div>
                          <div className="text-lg font-bold mt-1">
                            {demandAnalytics.seasonal_trends.peak_season}
                          </div>
                          <div className="text-sm text-blue-600 mt-1">
                            +{demandAnalytics.seasonal_trends.seasonal_variation} demand
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {demandAnalytics.seasonal_trends.recommendation}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Seasonal trend data not available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800">Optimal Price Range</div>
                    <div className="text-lg font-bold mt-1">
                      {formatCurrency(2500000, 'ETB')} - {formatCurrency(4500000, 'ETB')}
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      Based on similar properties in your area
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Recommendations:</div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center mt-0.5">
                          ✓
                        </div>
                        <span>Price properties within 5% of market average</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center mt-0.5">
                          ✓
                        </div>
                        <span>Consider seasonal price adjustments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center mt-0.5">
                          ✓
                        </div>
                        <span>Bundle services for better value proposition</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Marketing Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="font-medium text-purple-800">Recommended Actions</div>
                    <div className="text-sm text-purple-600 mt-2">
                      Based on current market conditions
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <div className="font-medium">Promote During Peak Hours</div>
                        <div className="text-sm text-gray-600">
                          List properties between 6-9 PM for 30% more visibility
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Home className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <div className="font-medium">Highlight Key Features</div>
                        <div className="text-sm text-gray-600">
                          Properties with photos get 3x more inquiries
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <div className="font-medium">Use Professional Photography</div>
                        <div className="text-sm text-gray-600">
                          Professional photos increase views by 150%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timing Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Optimal Listing Timing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold">Monday</div>
                    <div className="text-sm text-gray-500 mt-1">Best for commercial</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold">Wednesday</div>
                    <div className="text-sm text-green-600 mt-1">Peak for residential</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold">Friday</div>
                    <div className="text-sm text-yellow-600 mt-1">Good for luxury</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold">Weekend</div>
                    <div className="text-sm text-gray-500 mt-1">High traffic, low conversion</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Tip: List properties on Wednesday afternoon for maximum visibility and engagement.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};