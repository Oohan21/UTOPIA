// src/components/dashboard/AnalyticsDashboard.tsx
'use client';

import React from 'react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { DashboardStatsCard } from './DashboardStatsCard';
import PriceTrendChart from '@/components/dashboard/PriceTrendChart';
import { MarketHealthIndicator } from './MarketHealthIndicator';
import { PropertyTypeDistribution } from './PropertyTypeDistribution';
import { TopPerformingCities } from './TopPerformingCities';
import { RevenueChart } from './RevenueChart';
import { UserActivityChart } from './UserActivityChart';
import { ExportAnalyticsButton } from './ExportAnalyticsButton';
import { DateRangePicker } from './DateRangePicker';
import { DateRange } from 'react-day-picker';

interface AnalyticsDashboardProps {
    userType: 'admin' | 'user';
    initialPeriod?: string;
}

// Fallback data for when API fails or returns no data
const FALLBACK_TREND_DATA = [
    { date: 'Jan', price: 2500000, average_price: 2500000, median_price: 2400000 },
    { date: 'Feb', price: 2750000, average_price: 2750000, median_price: 2650000 },
    { date: 'Mar', price: 2800000, average_price: 2800000, median_price: 2700000 },
    { date: 'Apr', price: 2900000, average_price: 2900000, median_price: 2800000 },
    { date: 'May', price: 3000000, average_price: 3000000, median_price: 2900000 },
    { date: 'Jun', price: 3200000, average_price: 3200000, median_price: 3100000 },
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
    userType,
    initialPeriod = '30d',
}) => {
    const [period, setPeriod] = React.useState(initialPeriod);
    const [dateRange, setDateRange] = React.useState<DateRange | null>(null);

    // Fetch data based on user type
    const adminDashboard = useAnalytics.useAdminDashboard();
    const userDashboard = useAnalytics.useUserDashboard();
    const marketOverview = useAnalytics.useMarketOverview(period);
    const marketTrends = useAnalytics.useMarketTrends(parseInt(period.replace('d', '')));

    // Safely transform market trends data
    // Safely transform market trends data
    const priceTrendData = React.useMemo(() => {
        try {
            // If marketTrends is still loading or has error, return fallback
            if (marketTrends.isLoading || marketTrends.error || !marketTrends.data) {
                return FALLBACK_TREND_DATA;
            }

            const rawData = marketTrends.data as any; // Type assertion to bypass strict checking

            // Debug logging
            console.log('Raw market trends data:', rawData);
            console.log('Type:', typeof rawData);
            console.log('Is array?', Array.isArray(rawData));

            // Handle different data structures
            let dataArray: any[] = [];

            if (Array.isArray(rawData)) {
                dataArray = rawData;
            } else if (rawData && typeof rawData === 'object') {
                // Check for common API response patterns
                const typedData = rawData as Record<string, any>;

                if (Array.isArray(typedData.results)) {
                    dataArray = typedData.results;
                } else if (Array.isArray(typedData.data)) {
                    dataArray = typedData.data;
                } else if (Array.isArray(typedData.trends)) {
                    dataArray = typedData.trends;
                } else if (Array.isArray(typedData.items)) {
                    dataArray = typedData.items;
                } else {
                    // Extract first array property from object
                    const arrayProperties = Object.values(typedData).filter(
                        (val): val is any[] => Array.isArray(val)
                    );
                    if (arrayProperties.length > 0) {
                        dataArray = arrayProperties[0];
                    }
                }
            }

            // If we still don't have an array or it's empty, return fallback
            if (!Array.isArray(dataArray) || dataArray.length === 0) {
                console.log('No valid array found, using fallback data');
                return FALLBACK_TREND_DATA;
            }

            console.log('Processing array with', dataArray.length, 'items');

            // Transform the array to expected format
            return dataArray.map((item, index) => {
                // Safely extract values with fallbacks
                const typedItem = item as Record<string, any>;
                const value = typedItem?.value || typedItem?.average_price || typedItem?.price || 0;
                const name = typedItem?.name || typedItem?.date || typedItem?.label || `Period ${index + 1}`;

                return {
                    date: String(name),
                    price: Number(value),
                    average_price: Number(value),
                    median_price: Number(value) * 0.95,
                };
            });

        } catch (error) {
            console.error('Error transforming price trend data:', error);
            return FALLBACK_TREND_DATA;
        }
    }, [marketTrends.data, marketTrends.isLoading, marketTrends.error]);

    const data = userType === 'admin' ? adminDashboard.data : userDashboard.data;
    const isLoading = userType === 'admin' ? adminDashboard.isLoading : userDashboard.isLoading;
    const error = userType === 'admin' ? adminDashboard.error : userDashboard.error;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-lg">Loading analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-600">Error loading analytics data</div>
                <div className="text-sm text-red-500 mt-1">{error.message}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        {userType === 'admin' ? 'Platform' : 'Personal'} insights and performance metrics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                    />
                    <ExportAnalyticsButton />
                </div>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2">
                {['7d', '30d', '90d', '365d'].map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {p}
                    </button>
                ))}
            </div>

            {/* Stats Grid */}
            {userType === 'admin' && data && 'total_properties' in data && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DashboardStatsCard
                        title="Total Properties"
                        value={data.total_properties}
                        change={data.active_properties}
                        changeLabel="Active"
                        icon="🏠"
                    />
                    <DashboardStatsCard
                        title="Total Users"
                        value={data.total_users}
                        change={data.active_users}
                        changeLabel="Active"
                        icon="👤"
                    />
                    <DashboardStatsCard
                        title="Monthly Revenue"
                        value={data.revenue_month}
                        change={data.revenue_growth}
                        changeLabel="Growth"
                        isCurrency
                        icon="💰"
                    />
                    <DashboardStatsCard
                        title="Total Inquiries"
                        value={data.total_inquiries}
                        change={data.total_valuations}
                        changeLabel="Valuations"
                        icon="📞"
                    />
                </div>
            )}

            {/* Market Overview */}
            {userType === 'admin' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Market Price Trends</h2>
                        <PriceTrendChart data={priceTrendData} />
                        {marketTrends.error && (
                            <div className="mt-2 text-sm text-yellow-600">
                                Using sample data - API returned error
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Market Health</h2>
                        {marketOverview.data?.market_health ? (
                            <MarketHealthIndicator data={marketOverview.data.market_health} />
                        ) : (
                            <div className="text-gray-500">Market health data not available</div>
                        )}
                    </div>
                </div>
            )}

            {/* Property Distribution */}
            {userType === 'admin' && data && 'property_type_distribution' in data && (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-lg font-semibold mb-4">Property Type Distribution</h2>
                    <PropertyTypeDistribution data={data.property_type_distribution} />
                </div>
            )}

            {/* Top Performing Cities */}
            {userType === 'admin' && marketOverview.data && (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-lg font-semibold mb-4">Top Performing Cities</h2>
                    <TopPerformingCities data={marketOverview.data.top_performing_cities || []} />
                </div>
            )}

            {/* User Dashboard */}
            {userType === 'user' && data && 'listed_properties' in data && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <DashboardStatsCard
                            title="Listed Properties"
                            value={data.listed_properties}
                            icon="🏠"
                        />
                        <DashboardStatsCard
                            title="Saved Properties"
                            value={data.saved_properties}
                            icon="⭐"
                        />
                        <DashboardStatsCard
                            title="Inquiries Sent"
                            value={data.inquiries_sent}
                            icon="📧"
                        />
                        <DashboardStatsCard
                            title="Profile Completion"
                            value={data.profile_completion}
                            isPercentage
                            icon="📊"
                        />
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold mb-4">Recent Properties</h2>
                        <div className="space-y-3">
                            {data.recent_properties && data.recent_properties.length > 0 ? (
                                data.recent_properties.slice(0, 5).map((property) => (
                                    <div key={property.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="font-medium">{property.title}</div>
                                            <div className="text-sm text-gray-500">{property.property_type}</div>
                                        </div>
                                        <div className="font-semibold">
                                            {property.price_display || `${property.price_etb.toLocaleString()} ETB`}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    No recent properties found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Revenue Chart (Admin only) */}
            {userType === 'admin' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
                    <RevenueChart period={period} />
                </div>
            )}

            {/* User Activity (Admin only) */}
            {userType === 'admin' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-lg font-semibold mb-4">User Activity</h2>
                    <UserActivityChart period={period} />
                </div>
            )}
        </div>
    );
};