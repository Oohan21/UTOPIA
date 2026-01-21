// src/components/dashboard/MarketAnalytics.tsx - UPDATED
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { analyticsApi } from '@/lib/api/analytics';
import { MarketAnalyticsData, PriceAnalyticsData } from '@/lib/types/analytics';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function MarketAnalytics() {
  const t = useTranslations('analytics.market');
  const [activeTab, setActiveTab] = useState('overview');
  const [marketData, setMarketData] = useState<MarketAnalyticsData | null>(null);
  const [priceData, setPriceData] = useState<PriceAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [market, price] = await Promise.all([
        analyticsApi.getMarketAnalytics(),
        analyticsApi.getPriceAnalytics(),
      ]);
      setMarketData(market);
      setPriceData(price);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setError(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-8 w-48 bg-gray-300 dark:bg-gray-700" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-gray-300 dark:bg-gray-700" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Skeleton className="h-64 md:h-80 bg-gray-300 dark:bg-gray-700" />
          <Skeleton className="h-64 md:h-80 bg-gray-300 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (error || (!marketData && !priceData)) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error || t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1">
          <TabsTrigger 
            value="overview" 
            className={cn(
              "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
              "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
            )}
          >
            {t('tabs.overview')}
          </TabsTrigger>
          <TabsTrigger 
            value="prices" 
            className={cn(
              "data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
              "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
            )}
          >
            {t('tabs.prices')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          {marketData && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="p-3 md:p-4">
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      {t('metrics.totalListings')}
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {marketData.total_listings || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="p-3 md:p-4">
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      {t('metrics.avgPrice')}
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatCurrency(marketData.average_price || 0, 'ETB')}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="p-3 md:p-4">
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      {t('metrics.todaysViews')}
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {marketData.total_views_today || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="p-3 md:p-4">
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {t('metrics.marketHealth')}
                    </p>
                    <Badge 
                      className={cn(
                        marketData.market_health === 'Excellent' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                        marketData.market_health === 'Good' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                        marketData.market_health === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
                        "text-xs font-medium"
                      )}
                    >
                      {marketData.market_health || t('metrics.unknown')}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Property Type Distribution */}
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
                      {t('charts.propertyTypeDistribution')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 md:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        {(marketData.property_type_distribution || []).length > 0 ? (
                          <PieChart>
                            <Pie
                              data={marketData.property_type_distribution || []}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(props: any) => {
                                const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill="white"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize={12}
                                    fontWeight="500"
                                  >
                                    {`${(percent * 100).toFixed(0)}%`}
                                  </text>
                                );
                              }}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                            >
                              {(marketData.property_type_distribution || []).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: any, name: any, props: any) => {
                                const payload = props.payload;
                                return [value, payload?.property_type || t('charts.unknown')];
                              }}
                              contentStyle={{ 
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                color: '#111827',
                                borderRadius: '8px',
                                fontSize: '14px',
                              }}
                            />
                            <Legend 
                              formatter={(value: any, entry: any) => {
                                const index = entry.payload?.index;
                                const data = marketData.property_type_distribution || [];
                                const item = data[index];
                                
                                if (item) {
                                  return `${item.property_type}`;
                                }
                                
                                return value;
                              }}
                              wrapperStyle={{ 
                                color: '#6b7280',
                                fontSize: '12px',
                              }}
                            />
                          </PieChart>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500 dark:text-gray-400 text-center px-4">
                              {t('charts.noPropertyData')}
                            </p>
                          </div>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Price Distribution */}
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
                      {t('charts.priceDistribution')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 md:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        {(marketData.price_distribution || []).length > 0 ? (
                          <BarChart 
                            data={marketData.price_distribution || []}
                            margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeOpacity={0.3} />
                            <XAxis 
                              dataKey="range" 
                              stroke="#666"
                              tick={{ fill: '#666', fontSize: 12 }}
                              angle={-45}
                              textAnchor="end"
                              height={40}
                            />
                            <YAxis 
                              stroke="#666"
                              tick={{ fill: '#666', fontSize: 12 }}
                            />
                            <Tooltip 
                              formatter={(value) => [value, t('charts.properties')]}
                              labelFormatter={(label) => `${t('charts.priceRange')}: ${label}`}
                              contentStyle={{ 
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                color: '#111827',
                                borderRadius: '8px',
                                fontSize: '14px',
                              }}
                            />
                            <Legend wrapperStyle={{ color: '#6b7280', fontSize: '12px' }} />
                            <Bar 
                              dataKey="count" 
                              fill="#3b82f6" 
                              name={t('charts.numberOfProperties')}
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500 dark:text-gray-400 text-center px-4">
                              {t('charts.noPriceData')}
                            </p>
                          </div>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performing Cities */}
              <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
                    {t('topCities.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('topCities.city')}
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('topCities.properties')}
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('topCities.avgPrice')}
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('topCities.totalViews')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(marketData.top_performing_cities || []).map((city, index) => (
                          <tr 
                            key={index} 
                            className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                              {city.name || t('topCities.unknown')}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                              {city.property_count || 0}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                              {formatCurrency(city.average_price || 0, 'ETB')}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                              {(city.total_views || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(marketData.top_performing_cities || []).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                          {t('topCities.noData')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="prices" className="space-y-4 md:space-y-6">
          {priceData && (
            <>
              {/* Price Range Summary */}
              <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
                    {t('priceAnalysis.priceRange')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="text-center p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {t('priceAnalysis.minimum')}
                      </p>
                      <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatCurrency(priceData.price_range?.min_price || 0, 'ETB')}
                      </p>
                    </div>
                    <div className="text-center p-3 md:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {t('priceAnalysis.maximum')}
                      </p>
                      <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatCurrency(priceData.price_range?.max_price || 0, 'ETB')}
                      </p>
                    </div>
                    <div className="text-center p-3 md:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {t('priceAnalysis.average')}
                      </p>
                      <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatCurrency(priceData.price_range?.avg_price || 0, 'ETB')}
                      </p>
                    </div>
                    <div className="text-center p-3 md:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {t('priceAnalysis.median')}
                      </p>
                      <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {formatCurrency(priceData.price_range?.median_price || 0, 'ETB')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Average Prices by City - Bar Chart */}
              <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
                    {t('priceAnalysis.averageByCity')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {(priceData.average_prices_by_city || []).length > 0 ? (
                        <BarChart 
                          data={priceData.average_prices_by_city || []}
                          margin={{ top: 10, right: 10, left: 0, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeOpacity={0.3} />
                          <XAxis 
                            dataKey="city"
                            angle={-45}
                            textAnchor="end"
                            height={40}
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 12 }}
                          />
                          <YAxis 
                            tickFormatter={(value) => formatCurrency(value, 'ETB')}
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'avg_price') {
                                return [formatCurrency(Number(value), 'ETB'), t('priceAnalysis.averagePrice')];
                              }
                              return [value, t('priceAnalysis.propertyCount')];
                            }}
                            labelFormatter={(label) => `${t('priceAnalysis.city')}: ${label}`}
                            contentStyle={{ 
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              color: '#111827',
                              borderRadius: '8px',
                              fontSize: '14px',
                            }}
                          />
                          <Legend wrapperStyle={{ color: '#6b7280', fontSize: '12px' }} />
                          <Bar 
                            dataKey="avg_price" 
                            fill="#3b82f6" 
                            name={t('priceAnalysis.averagePrice')}
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="property_count" 
                            fill="#10b981" 
                            name={t('priceAnalysis.propertyCount')}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-gray-500 dark:text-gray-400 text-center px-4">
                            {t('priceAnalysis.noCityData')}
                          </p>
                        </div>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Property Type Price Distribution - Table */}
              <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
                    {t('priceAnalysis.typeDetails')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('priceAnalysis.propertyType')}
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('priceAnalysis.averagePrice')}
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('priceAnalysis.count')}
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('priceAnalysis.percentage')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(priceData.average_prices_by_property_type || []).map((type, index) => {
                          const totalCount = (priceData.average_prices_by_property_type || [])
                            .reduce((sum, item) => sum + (item.count || 0), 0);
                          const percentage = totalCount > 0 
                            ? ((type.count || 0) / totalCount * 100).toFixed(1)
                            : '0.0';
                          
                          return (
                            <tr 
                              key={index} 
                              className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                              <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                                {type.property_type || t('priceAnalysis.unknown')}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                                {formatCurrency(type.avg_price || 0, 'ETB')}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                                {type.count || 0}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                                {percentage}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {(priceData.average_prices_by_property_type || []).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                          {t('priceAnalysis.noTypeData')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}