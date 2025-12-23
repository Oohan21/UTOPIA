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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    );
  }

  if (isError || error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-500">Unable to load activity data</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No activity data available for this period</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {stats && (
            <div className="flex items-center gap-2">
              {stats.isGrowing ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className={`font-medium ${stats.isGrowing ? 'text-green-600' : 'text-red-600'}`}>
                {stats.growthRate}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        {showStats && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">New Users</div>
              <div className="text-2xl font-bold">{formatNumber(stats.totalNewUsers)}</div>
              <div className="text-xs text-gray-500">Total in period</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 mb-1">Avg. Active</div>
              <div className="text-2xl font-bold">{formatNumber(stats.avgActiveUsers)}</div>
              <div className="text-xs text-gray-500">Daily average</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">Peak Active</div>
              <div className="text-2xl font-bold">{formatNumber(stats.peakActiveUsers)}</div>
              <div className="text-xs text-gray-500">Highest in period</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="text-sm text-amber-600 mb-1">Growth Rate</div>
              <div className="text-2xl font-bold">{stats.growthRate}%</div>
              <div className="text-xs text-gray-500">Period change</div>
            </div>
          </div>
        )}

        {/* Chart */}
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: number, name: string) => {
                  return [formatNumber(value), name];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              
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
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <div className="text-gray-500">
                Showing {stats?.totalDays || 0} days of data
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#10b981]"></div>
                  <span>Active Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#3b82f6]"></div>
                  <span>New Users</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};