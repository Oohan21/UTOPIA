// src/components/dashboard/UserActivityChart.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils/formatNumber';

interface UserActivityChartProps {
  period?: string;
  height?: number;
  showStats?: boolean;
  title?: string;
  description?: string;
}

interface UserGrowth {
  date: string;
  new_users: number;
  active_users: number;
  cumulative_users: number;
}

export const UserActivityChart: React.FC<UserActivityChartProps> = ({
  period = '30d',
  height = 300,
  showStats = true,
  title = "User Activity Trend",
  description = "Active and new users over time"
}) => {
  // Convert period to days
  const getDaysFromPeriod = (period: string): number => {
    switch (period) {
      case '7d': return 7;
      case '90d': return 90;
      case '365d': return 365;
      default: return 30;
    }
  };

  const days = getDaysFromPeriod(period);

  const { data: userGrowth = [], isLoading, error, isError } = useQuery<UserGrowth[]>({
    queryKey: ['user-activity-chart', days],
    queryFn: () => dashboardApi.getUserGrowth(days),
    staleTime: 5 * 60 * 1000,
  });

  // Calculate statistics from real data
  const calculateStats = (data: UserGrowth[]) => {
    if (!data || data.length === 0) return null;

    const totalNewUsers = data.reduce((sum, day) => sum + (day.new_users || 0), 0);
    const totalActiveUsers = data.reduce((sum, day) => sum + (day.active_users || 0), 0);
    const avgActiveUsers = totalActiveUsers / data.length;
    
    // Calculate growth rate if we have enough data
    let growthRate = 0;
    if (data.length > 1) {
      const firstDay = data[0]?.active_users || 0;
      const lastDay = data[data.length - 1]?.active_users || 0;
      growthRate = firstDay > 0 ? ((lastDay - firstDay) / firstDay) * 100 : 0;
    }

    // Calculate peak active users
    const peakActiveUsers = Math.max(...data.map(day => day.active_users || 0));

    return {
      totalNewUsers,
      avgActiveUsers: Math.round(avgActiveUsers),
      growthRate: parseFloat(growthRate.toFixed(1)),
      peakActiveUsers,
      isGrowing: growthRate > 0,
      totalDays: data.length
    };
  };

  const stats = calculateStats(userGrowth);

  // Format data for chart
  const formatChartData = (data: UserGrowth[]) => {
    if (!data || data.length === 0) return [];
    
    return data.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      new_users: day.new_users || 0,
      active_users: day.active_users || 0,
      total_users: day.cumulative_users || 0
    }));
  };

  const chartData = formatChartData(userGrowth);

  if (isLoading) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="dark:bg-gray-800">
          <Skeleton className="h-6 w-48 dark:bg-gray-700" />
          <Skeleton className="h-4 w-64 dark:bg-gray-700" />
        </CardHeader>
        <CardContent className="dark:bg-gray-800">
          <Skeleton className="h-[300px] dark:bg-gray-700" />
        </CardContent>
      </Card>
    );
  }

  if (isError || error) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="dark:bg-gray-800">
          <CardTitle className="dark:text-white">{title}</CardTitle>
          <CardDescription className="dark:text-gray-400">{description}</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center dark:bg-gray-800">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Unable to load activity data</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="dark:bg-gray-800">
          <CardTitle className="dark:text-white">{title}</CardTitle>
          <CardDescription className="dark:text-gray-400">{description}</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center dark:bg-gray-800">
          <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No activity data available for this period</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="dark:bg-gray-800">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="dark:text-white">{title}</CardTitle>
            <CardDescription className="dark:text-gray-400">{description}</CardDescription>
          </div>
          {stats && (
            <div className="flex items-center gap-2">
              {stats.isGrowing ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className={`font-medium ${stats.isGrowing ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.growthRate}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="dark:bg-gray-800">
        {/* Stats Summary */}
        {showStats && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">New Users</div>
              <div className="text-2xl font-bold dark:text-white">{formatNumber(stats.totalNewUsers)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total in period</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">Avg. Active</div>
              <div className="text-2xl font-bold dark:text-white">{formatNumber(stats.avgActiveUsers)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Daily average</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Peak Active</div>
              <div className="text-2xl font-bold dark:text-white">{formatNumber(stats.peakActiveUsers)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Highest in period</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
              <div className="text-sm text-amber-600 dark:text-amber-400 mb-1">Growth Rate</div>
              <div className="text-2xl font-bold dark:text-white">{stats.growthRate}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Period change</div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" className="dark:stroke-gray-700" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                stroke="#6B7280"
                className="dark:text-gray-400 dark:stroke-gray-400"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
                stroke="#6B7280"
                className="dark:text-gray-400 dark:stroke-gray-400"
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={false}
                stroke="#6B7280"
                className="dark:text-gray-400 dark:stroke-gray-400"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: '#F9FAFB'
                }}
                formatter={(value: number, name: string) => {
                  return [formatNumber(value), name];
                }}
                labelFormatter={(label) => `Date: ${label}`}
                labelStyle={{ color: '#F9FAFB' }}
              />
              <Legend wrapperStyle={{ color: '#6B7280' }} />
              
              {/* Area for total users */}
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="total_users"
                name="Total Users"
                fill="#8b5cf6"
                stroke="#8b5cf6"
                strokeWidth={0}
                fillOpacity={0.1}
              />
              
              {/* Line for active users */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="active_users"
                name="Active Users"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
              
              {/* Line for new users */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="new_users"
                name="New Users"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Period Summary */}
        {chartData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm gap-4">
              <div className="text-gray-500 dark:text-gray-400">
                Showing {stats?.totalDays || 0} days of data
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#10b981]"></div>
                  <span className="dark:text-gray-300">Active Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#3b82f6]"></div>
                  <span className="dark:text-gray-300">New Users</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};