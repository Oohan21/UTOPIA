// src/components/dashboard/MarketAnalytics.tsx
'use client';

import React, { useState } from 'react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatNumber } from '@/lib/utils/formatNumber';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertCircle } from 'lucide-react';

export const MarketAnalytics: React.FC = () => {
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
    const getMarketHealthDisplay = (): string => {
        const health = marketOverview?.market_health;

        // Handle string case
        if (typeof health === 'string') {
            return health;
        }

        // Handle object case
        if (health && typeof health === 'object') {
            // Check for status property
            if ('status' in health && typeof health.status === 'string') {
                return health.status;
            }

            // Determine from absorption rate
            if ('absorption_rate' in health) {
                const rate = Number(health.absorption_rate);
                if (rate > 20) return 'Excellent';
                if (rate > 10) return 'Good';
                if (rate > 5) return 'Moderate';
                return 'Slow';
            }
        }

        return 'Moderate';
    };

    const getAbsorptionRateDisplay = (): string => {
        const health = marketOverview?.market_health;
        let rate = 0;

        if (health && typeof health === 'object') {
            if ('absorption_rate' in health) {
                rate = Number(health.absorption_rate);
            }
        } else if (marketOverview?.market_health?.absorption_rate) {
            rate = Number(marketOverview.market_health.absorption_rate);
        }

        return `${rate.toFixed(1)}%`;
    };

    // Get top cities - check both possible locations
    const getTopCities = () => {
        if (marketOverview?.top_performing_cities) {
            return marketOverview.top_performing_cities;
        }
        if (marketOverview?.distribution?.popular_areas) {
            return marketOverview.distribution.popular_areas.map((area: any) => ({
                name: area.name,
                property_count: area.count,
                average_price: area.avg_price,
                total_views: 0 // Default value
            }));
        }
        return [];
    };

    // Get property type distribution
    const getPropertyTypeDistribution = () => {
        if (marketOverview?.property_type_distribution) {
            return marketOverview.property_type_distribution;
        }
        if (marketOverview?.distribution?.property_types) {
            return marketOverview.distribution.property_types;
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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <Skeleton className="h-10 w-full sm:w-[200px]" />
                    <Skeleton className="h-10 w-full sm:w-[200px]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
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
                    <h3 className="text-lg font-semibold mb-2">Unable to Load Market Analytics</h3>
                    <p className="text-gray-500 mb-4">
                        There was an error loading market analytics data. Please try again.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Select value={selectedCity} onValueChange={setSelectedCity} placeholder="Select City">
                    <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        {getTopCities().map((city: any) => (
                            <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType} placeholder="Property Type">
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {getPropertyTypeDistribution().map((type: any) => (
                            <SelectItem key={type.property_type || type.name} value={type.property_type || type.name}>
                                {type.property_type || type.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Market Overview</TabsTrigger>
                    <TabsTrigger value="prices">Price Analysis</TabsTrigger>
                    <TabsTrigger value="demand">Demand Analysis</TabsTrigger>
                    <TabsTrigger value="distribution">Distribution</TabsTrigger>
                </TabsList>

                {/* Market Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">
                                    Total Listings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatNumber(getTotalListings())}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {formatNumber(getActiveListings())} Active
                                </div>
                            </CardContent>
                        </Card>

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
                                <div className={`text-sm mt-1 ${getPriceChangeWeekly() >= 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                    }`}>
                                    {getPriceChangeWeekly() >= 0 ? '+' : ''}
                                    {getPriceChangeWeekly().toFixed(1)}% weekly
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
                                    {getMarketHealthDisplay()}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {getAbsorptionRateDisplay()}% absorption rate
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">
                                    Price to Rent Ratio
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {marketOverview?.market_health?.price_to_rent_ratio?.toFixed(1) || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    {marketOverview?.market_health?.rental_yield?.toFixed(1) || '0.0'}% Rental Yield
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Performing Cities */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Performing Areas</CardTitle>
                            <CardDescription>
                                Based on listings and average prices
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={getTopCities()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value, name) => {
                                                if (name === 'property_count') return [formatNumber(Number(value)), 'Properties'];
                                                if (name === 'average_price') return [formatCurrency(Number(value), 'ETB'), 'Average Price'];
                                                return [formatNumber(Number(value)), name];
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="property_count" name="Properties" fill="#3b82f6" />
                                        <Bar dataKey="average_price" name="Average Price" fill="#10b981" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Price Analysis Tab */}
                <TabsContent value="prices" className="space-y-6">
                    {priceAnalytics && (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Price Distribution by Property Type</CardTitle>
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
                                                    <Bar dataKey="avg_price" name="Average Price" fill="#8b5cf6" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Price Distribution by City</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={priceAnalytics.average_prices_by_city || []}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="city" />
                                                    <YAxis tickFormatter={(value) => formatCurrency(value, 'ETB', true)} />
                                                    <Tooltip
                                                        formatter={(value) => [formatCurrency(Number(value), 'ETB'), 'Average Price']}
                                                    />
                                                    <Bar dataKey="avg_price" name="Average Price" fill="#f59e0b" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Price Forecast */}
                            {priceAnalytics.price_forecast && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Price Forecast</CardTitle>
                                        <CardDescription>
                                            {priceAnalytics.price_forecast.forecast}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium">Current Trend:</div>
                                                <div className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${priceAnalytics.price_forecast.current_trend === 'rising'
                                                    ? 'bg-green-100 text-green-800'
                                                    : priceAnalytics.price_forecast.current_trend === 'falling'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {priceAnalytics.price_forecast.current_trend}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium">Price Change:</div>
                                                <div className={`font-semibold ${priceAnalytics.price_forecast.price_change_percentage >= 0
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                    }`}>
                                                    {priceAnalytics.price_forecast.price_change_percentage >= 0 ? '+' : ''}
                                                    {priceAnalytics.price_forecast.price_change_percentage}%
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium">Confidence:</div>
                                                <div className="font-medium capitalize">
                                                    {priceAnalytics.price_forecast.confidence}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </TabsContent>

                {/* Demand Analysis Tab */}
                <TabsContent value="demand" className="space-y-6">
                    {demandAnalytics && (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Demand by City</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={demandAnalytics.demand_by_city || []}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="city" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="total_views" name="Total Views" fill="#3b82f6" />
                                                    <Bar dataKey="total_inquiries" name="Total Inquiries" fill="#10b981" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Demand by Property Type</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={demandAnalytics.demand_by_property_type || []}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="property_type" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="total_views" name="Views" fill="#8b5cf6" />
                                                    <Bar dataKey="total_inquiries" name="Inquiries" fill="#f59e0b" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Conversion Metrics */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Conversion Metrics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="text-sm text-gray-500 mb-2">View to Inquiry Ratio</div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-2xl font-bold">
                                                    {(demandAnalytics.view_to_inquiry_ratio?.conversion_rate || 0).toFixed(1)}%
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Industry Average: {demandAnalytics.view_to_inquiry_ratio?.industry_average || 0}%
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-sm text-gray-500 mb-2">Days on Market</div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold">
                                                        {(demandAnalytics.days_on_market_average?.average_days || 0).toFixed(0)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">Average</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold">
                                                        {demandAnalytics.days_on_market_average?.minimum_days || 0}
                                                    </div>
                                                    <div className="text-sm text-gray-500">Minimum</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold">
                                                        {demandAnalytics.days_on_market_average?.maximum_days || 0}
                                                    </div>
                                                    <div className="text-sm text-gray-500">Maximum</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Seasonal Trends */}
                                        {demandAnalytics.seasonal_trends && (
                                            <div>
                                                <div className="text-sm text-gray-500 mb-2">Seasonal Trends</div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span>Peak Season:</span>
                                                        <span className="font-medium">{demandAnalytics.seasonal_trends.peak_season}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Low Season:</span>
                                                        <span className="font-medium">{demandAnalytics.seasonal_trends.low_season}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Seasonal Variation:</span>
                                                        <span className="font-medium">{demandAnalytics.seasonal_trends.seasonal_variation}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                {/* Distribution Tab */}
                <TabsContent value="distribution" className="space-y-6">
                    {getPropertyTypeDistribution().length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Property Type Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={getPropertyTypeDistribution()}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="count"
                                                >
                                                    {getPropertyTypeDistribution().map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value, name, props) => [
                                                    `${value} properties (${(props.payload.percentage || 0).toFixed(1)}%)`,
                                                    name
                                                ]} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Price Range Distribution</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={getPriceDistribution()}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="range" />
                                                <YAxis />
                                                <Tooltip
                                                    formatter={(value) => [`${value} properties`, 'Count']}
                                                />
                                                <Bar dataKey="count" name="Properties" fill="#3b82f6" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};