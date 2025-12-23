// src/components/dashboard/UserAnalytics.tsx
'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';
import { adminApi } from '@/lib/api/admin';
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
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatNumber } from '@/lib/utils/formatNumber';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrendingUp, TrendingDown, Users, Eye, Search, MessageSquare, AlertCircle, Activity } from 'lucide-react';
import { AdminUser } from '@/lib/api/admin';

// Define proper types for our data
interface DailyActivity {
  date: string;
  active_users: number;
  new_users: number;
  page_views: number;
  searches: number;
  inquiries: number;
  properties_listed: number;
}

interface UserGrowth {
  date: string;
  new_users: number;
  active_users: number;
  cumulative_users: number;
}

interface UserTypeDistribution {
  name: string;
  value: number;
  [key: string]: any; // Add index signature for recharts compatibility
}

interface PlatformAnalyticsResponse {
  total_users: number;
  new_users: number;
  active_users: number;
  user_growth_rate: number;
  avg_session_duration: number;
  bounce_rate: number;
  total_page_views: number;
  _error?: boolean;
  _errorMessage?: string;
  _fallback?: boolean;
  _timestamp?: string;
}

export const UserAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Convert timeRange to days for API calls
  const getDaysFromRange = (range: string): number => {
    switch (range) {
      case '7d': return 7;
      case '90d': return 90;
      case '365d': return 365;
      default: return 30;
    }
  };

  const days = getDaysFromRange(timeRange);

  // Fetch platform analytics
  const { 
    data: platformAnalytics, 
    isLoading: platformLoading,
    error: platformError,
    isError: isPlatformError
  } = useQuery<PlatformAnalyticsResponse>({
    queryKey: ['platform-analytics', timeRange],
    queryFn: () => dashboardApi.getPlatformAnalytics(timeRange),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch daily activity
  const { 
    data: dailyActivity = [], 
    isLoading: activityLoading,
    isError: isActivityError
  } = useQuery<DailyActivity[]>({
    queryKey: ['daily-activity', days],
    queryFn: () => dashboardApi.getDailyActivity(days),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user growth
  const { 
    data: userGrowth = [], 
    isLoading: growthLoading,
    isError: isGrowthError
  } = useQuery<UserGrowth[]>({
    queryKey: ['user-growth', days],
    queryFn: () => dashboardApi.getUserGrowth(days),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch users data
  const { 
    data: usersData, 
    isLoading: usersLoading,
    isError: isUsersError
  } = useQuery({
    queryKey: ['admin-users', userTypeFilter, timeRange],
    queryFn: () => adminApi.getUsers({ 
      user_type: userTypeFilter !== 'all' ? userTypeFilter : undefined,
      created_at__gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    }),
    enabled: activeTab === 'users',
  });

  // Calculate metrics from real data
  const calculateMetrics = () => {
    if (!dailyActivity || dailyActivity.length === 0) {
      return {
        totalNewUsers: 0,
        avgActiveUsers: 0,
        totalPageViews: 0,
        totalInquiries: 0,
        totalSearches: 0,
        totalPropertiesListed: 0,
        userRetention: 0,
        conversionRate: 0,
        errorRate: 0
      };
    }

    const totalNewUsers = dailyActivity.reduce((sum, day) => sum + (day.new_users || 0), 0);
    const avgActiveUsers = dailyActivity.reduce((sum, day) => sum + (day.active_users || 0), 0) / dailyActivity.length;
    const totalPageViews = dailyActivity.reduce((sum, day) => sum + (day.page_views || 0), 0);
    const totalInquiries = dailyActivity.reduce((sum, day) => sum + (day.inquiries || 0), 0);
    const totalSearches = dailyActivity.reduce((sum, day) => sum + (day.searches || 0), 0);
    const totalPropertiesListed = dailyActivity.reduce((sum, day) => sum + (day.properties_listed || 0), 0);
    
    // Calculate conversion rate (simplified)
    const conversionRate = totalPageViews > 0 ? (totalInquiries / totalPageViews) * 100 : 0;
    
    return {
      totalNewUsers,
      avgActiveUsers: Math.round(avgActiveUsers),
      totalPageViews,
      totalInquiries,
      totalSearches,
      totalPropertiesListed,
      userRetention: 72.5, // This would come from backend API
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      errorRate: platformAnalytics?._error || platformAnalytics?._fallback ? 1 : 0
    };
  };

  const metrics = calculateMetrics();

  // Calculate user type distribution from real user data
  const calculateUserTypeDistribution = (): UserTypeDistribution[] => {
    if (!usersData?.results || usersData.results.length === 0) {
      return [
        { name: 'Buyers', value: 0, fill: '#3b82f6' },
        { name: 'Sellers', value: 0, fill: '#10b981' },
        { name: 'Agents', value: 0, fill: '#8b5cf6' },
        { name: 'Developers', value: 0, fill: '#f59e0b' }
      ];
    }

    const typeCounts: Record<string, number> = {};
    usersData.results.forEach((user: AdminUser) => {
      const type = user.user_type || 'user';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
    let colorIndex = 0;
    
    return Object.entries(typeCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: colors[colorIndex++ % colors.length]
    }));
  };

  const userTypeDistribution = calculateUserTypeDistribution();
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  // Check for any errors
  const hasErrors = isPlatformError || isActivityError || isGrowthError || isUsersError;
  const isLoading = platformLoading || activityLoading || growthLoading || (activeTab === 'users' && usersLoading);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (hasErrors) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Analytics Data</h3>
          <p className="text-gray-500 mb-4">
            {platformError?.message || 
             platformAnalytics?._errorMessage || 
             'There was an error loading the analytics data. Please try again.'}
          </p>
          {platformAnalytics?._fallback && (
            <p className="text-sm text-amber-600 mb-4">
              Showing fallback data for demonstration purposes.
            </p>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  // Format chart data
  const formatChartData = (data: any[]) => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      // Ensure numeric values
      active_users: Number(item.active_users || 0),
      new_users: Number(item.new_users || 0),
      page_views: Number(item.page_views || 0),
      searches: Number(item.searches || 0),
      inquiries: Number(item.inquiries || 0)
    }));
  };

  const formattedDailyActivity = formatChartData(dailyActivity);
  const formattedUserGrowth = formatChartData(userGrowth);

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Analytics</h1>
          <p className="text-gray-500">Monitor user behavior and engagement metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={timeRange} onValueChange={setTimeRange} placeholder="Time Range">
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={userTypeFilter} onValueChange={setUserTypeFilter} placeholder="User Type">
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="user">Regular Users</SelectItem>
              <SelectItem value="admin">Administrators</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Quality Warning */}
      {(platformAnalytics?._fallback || platformAnalytics?._error) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
            <span className="text-amber-800">
              Using fallback data. Real analytics data will be available when the backend is fully configured.
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(platformAnalytics?.total_users || 0)}
                </div>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{formatNumber(metrics.totalNewUsers || 0)} new
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Active Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(platformAnalytics?.active_users || metrics.avgActiveUsers)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Daily average: {formatNumber(metrics.avgActiveUsers)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Page Views
                  </CardTitle>
                  <Eye className="h-4 w-4 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.totalPageViews)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {formatNumber(metrics.totalSearches)} searches
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Engagement Rate
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.conversionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {formatNumber(metrics.totalInquiries)} inquiries
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts - Only show if we have data */}
          {(formattedUserGrowth.length > 0 || formattedDailyActivity.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {formattedUserGrowth.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>
                      New and active users over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={formattedUserGrowth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Area 
                            type="monotone" 
                            dataKey="new_users" 
                            name="New Users" 
                            stroke="#3b82f6" 
                            fill="#3b82f622" 
                            strokeWidth={2}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="active_users" 
                            name="Active Users" 
                            stroke="#10b981" 
                            fill="#10b98122" 
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {formattedDailyActivity.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>User Activity</CardTitle>
                    <CardDescription>
                      Daily engagement metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={formattedDailyActivity.slice(-14)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="page_views" name="Page Views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="searches" name="Searches" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="inquiries" name="Inquiries" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* User Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Avg. Session Duration</div>
                      <div className="text-2xl font-bold">
                        {Math.round(platformAnalytics?.avg_session_duration || 0)}s
                      </div>
                      <div className="text-sm text-gray-500">
                        Across all users
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Bounce Rate</div>
                      <div className="text-2xl font-bold">
                        {(platformAnalytics?.bounce_rate || 0).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">
                        Lower is better
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">Activity Summary</div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Total Views: {formatNumber(metrics.totalPageViews)}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Search className="h-3 w-3" />
                        Searches: {formatNumber(metrics.totalSearches)}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Inquiries: {formatNumber(metrics.totalInquiries)}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        New Users: {formatNumber(metrics.totalNewUsers)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Tab */}
        <TabsContent value="growth" className="space-y-6">
          {formattedUserGrowth.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>User Growth Analytics</CardTitle>
                <CardDescription>
                  Detailed analysis of user acquisition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedUserGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="new_users" 
                        name="New Users" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="active_users" 
                        name="Active Users" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatNumber(metrics.totalNewUsers)}</div>
                    <div className="text-sm text-gray-500">New Users ({days} days)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{formatNumber(metrics.avgActiveUsers)}</div>
                    <div className="text-sm text-gray-500">Avg. Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {platformAnalytics?.user_growth_rate ? platformAnalytics.user_growth_rate.toFixed(1) : '0.0'}%
                    </div>
                    <div className="text-sm text-gray-500">Growth Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {platformAnalytics?.total_users ? formatNumber(platformAnalytics.total_users) : '0'}
                    </div>
                    <div className="text-sm text-gray-500">Total Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Growth Data Available</h3>
                <p className="text-gray-500">User growth data will appear here once available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          {formattedDailyActivity.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>
                  User interaction and activity patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedDailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="page_views" 
                        name="Page Views" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="searches" 
                        name="Searches" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="inquiries" 
                        name="Inquiries" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Engagement Data Available</h3>
                <p className="text-gray-500">Engagement data will appear here once available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {usersData?.results && usersData.results.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>
                  Latest registered users and their activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Properties</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Last Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData.results.slice(0, 10).map((user: AdminUser) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                {user.first_name?.[0] || user.email[0].toUpperCase()}
                                {user.last_name?.[0] || ''}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {user.first_name && user.last_name 
                                    ? `${user.first_name} ${user.last_name}`
                                    : user.email}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.user_type === 'admin' ? "default" : "outline"} 
                              className="capitalize"
                            >
                              {user.user_type || 'user'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={user.is_verified ? "default" : "secondary"}>
                                {user.is_verified ? 'Verified' : 'Pending'}
                              </Badge>
                              <Badge variant={user.is_active ? "default" : "destructive"}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">0</div>
                            <div className="text-xs text-gray-500">Properties listed</div>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {user.last_login 
                              ? new Date(user.last_login).toLocaleDateString()
                              : 'Never'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No User Data Available</h3>
                <p className="text-gray-500">User data will appear here once available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};