// src/components/dashboard/UserAnalytics.tsx - UPDATED
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, UserPlus, TrendingUp, Activity, Clock, Target,
  MessageSquare, Eye, Home, CheckCircle,
  Search, Download, Filter, UserCheck, UserX,
  Shield, AlertCircle, MoreVertical
} from 'lucide-react';
import { analyticsApi } from '@/lib/api/analytics';
import { UserGrowthData, DailyActivityData, AdminUserAnalyticsResponse } from '@/lib/types/analytics';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface UserFilter {
  search: string;
  userType: string;
  status: string;
}

export function UserAnalytics() {
  const t = useTranslations('analytics.users');
  const [adminUserData, setAdminUserData] = useState<AdminUserAnalyticsResponse | null>(null);
  const [growthData, setGrowthData] = useState<UserGrowthData[]>([]);
  const [activityData, setActivityData] = useState<DailyActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [filter, setFilter] = useState<UserFilter>({
    search: '',
    userType: 'all',
    status: 'all'
  });
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
      
      const [adminAllUsers, growth, activity] = await Promise.allSettled([
        analyticsApi.getAdminAllUsers(days),
        analyticsApi.getUserGrowth(days),
        analyticsApi.getDailyActivity(days),
      ]);

      if (adminAllUsers.status === 'fulfilled') setAdminUserData(adminAllUsers.value);
      if (growth.status === 'fulfilled') setGrowthData(growth.value);
      if (activity.status === 'fulfilled') setActivityData(activity.value);
    } catch (error) {
      console.error('Failed to fetch admin user analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-ET').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateUserStats = () => {
    if (!adminUserData) return { total: 0, activeToday: 0, newToday: 0 };
    
    const activeToday = adminUserData.users.filter(user => user.is_active_today).length;
    const newToday = adminUserData.platform_totals.new_users_today;
    
    return {
      total: adminUserData.users.length,
      activeToday,
      newToday,
      inactiveToday: adminUserData.users.length - activeToday
    };
  };

  const getFilteredUsers = () => {
    if (!adminUserData) return [];
    
    return adminUserData.users.filter(user => {
      if (filter.search && !user.email.toLowerCase().includes(filter.search.toLowerCase()) && 
          !user.full_name?.toLowerCase().includes(filter.search.toLowerCase())) {
        return false;
      }
      
      if (filter.userType !== 'all' && user.user_type !== filter.userType) {
        return false;
      }
      
      if (filter.status === 'active' && !user.is_active_today) {
        return false;
      }
      if (filter.status === 'inactive' && user.is_active_today) {
        return false;
      }
      
      return true;
    });
  };

  const getTopUsersByMetric = (metric: 'inquiries' | 'properties' | 'views', limit: number = 5) => {
    if (!adminUserData) return [];
    
    return [...adminUserData.users]
      .sort((a, b) => {
        if (metric === 'inquiries') return b.total_inquiries - a.total_inquiries;
        if (metric === 'properties') return b.total_properties - a.total_properties;
        return b.total_views - a.total_views;
      })
      .slice(0, limit);
  };

  const exportData = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const blob = await analyticsApi.exportAnalytics('users', format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_analytics_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Skeleton className="h-8 w-48 bg-gray-300 dark:bg-gray-700" />
          <Skeleton className="h-10 w-32 bg-gray-300 dark:bg-gray-700" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 md:h-32 bg-gray-300 dark:bg-gray-700" />
          ))}
        </div>
        <Skeleton className="h-64 md:h-96 bg-gray-300 dark:bg-gray-700" />
      </div>
    );
  }

  const userStats = calculateUserStats();
  const filteredUsers = getFilteredUsers();
  const topUsersByInquiries = getTopUsersByMetric('inquiries');
  const topUsersByProperties = getTopUsersByMetric('properties');

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
            {t('title')}
          </h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportData('csv')}
            className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            {t('actions.exportCSV')}
          </Button>
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <Button
              variant={timeRange === '7d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('7d')}
              className="rounded-none border-0 h-8 px-2 md:px-3"
            >
              {t('timeRanges.7d')}
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('30d')}
              className="rounded-none border-0 h-8 px-2 md:px-3"
            >
              {t('timeRanges.30d')}
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('90d')}
              className="rounded-none border-0 h-8 px-2 md:px-3"
            >
              {t('timeRanges.90d')}
            </Button>
          </div>
        </div>
      </div>

      {/* Platform Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start md:items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('cards.totalUsers')}
                </p>
                <p className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatNumber(adminUserData?.platform_totals.total_users || 0)}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Users className="h-4 w-4 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-2 md:mt-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
              <span className="text-green-600 dark:text-green-400">+{userStats.newToday}</span> {t('cards.newToday')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start md:items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('cards.activeToday')}
                </p>
                <p className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatNumber(userStats.activeToday)}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <UserCheck className="h-4 w-4 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-2 md:mt-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {((userStats.activeToday / userStats.total) * 100).toFixed(1)}% {t('cards.ofTotal')}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start md:items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('cards.totalProperties')}
                </p>
                <p className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatNumber(adminUserData?.platform_totals.total_properties || 0)}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Home className="h-4 w-4 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-2 md:mt-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {t('cards.avgPerUser', {
                avg: adminUserData?.platform_totals.total_users ? 
                  Math.round(adminUserData.platform_totals.total_properties / adminUserData.platform_totals.total_users) : 0
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start md:items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('cards.totalInquiries')}
                </p>
                <p className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatNumber(adminUserData?.platform_totals.total_inquiries || 0)}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full">
                <MessageSquare className="h-4 w-4 md:h-6 md:w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="mt-2 md:mt-4 text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {t('cards.conversionRate', {
                rate: adminUserData?.platform_totals.total_views ? 
                  ((adminUserData.platform_totals.total_inquiries / adminUserData.platform_totals.total_views) * 100).toFixed(1) : 0
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t('filters.search')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                <Input
                  placeholder={t('filters.searchPlaceholder')}
                  value={filter.search}
                  onChange={(e) => setFilter({...filter, search: e.target.value})}
                  className="pl-8 md:pl-10 text-xs md:text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t('filters.userType')}
              </label>
              <select
                value={filter.userType}
                onChange={(e) => setFilter({...filter, userType: e.target.value})}
                className="w-full px-3 py-2 text-xs md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('filters.allTypes')}</option>
                <option value="user">{t('filters.user')}</option>
                <option value="admin">{t('filters.admin')}</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t('filters.activityStatus')}
              </label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
                className="w-full px-3 py-2 text-xs md:text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('filters.allUsers')}</option>
                <option value="active">{t('filters.activeToday')}</option>
                <option value="inactive">{t('filters.inactiveToday')}</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {t('filters.showing', { 
                showing: filteredUsers.length, 
                total: adminUserData?.users.length || 0 
              })}
              {filter.search && ` "${filter.search}"`}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter({ search: '', userType: 'all', status: 'all' })}
              className="text-xs md:text-sm dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t('filters.clear')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* User Growth Chart */}
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
              {t('charts.userGrowth')}
            </CardTitle>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {adminUserData?.time_period.date_from} to {adminUserData?.time_period.date_to}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                {growthData.length > 0 ? (
                  <AreaChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeOpacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      tick={{ fill: '#666', fontSize: 11 }}
                    />
                    <YAxis 
                      stroke="#666"
                      tick={{ fill: '#666', fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        color: '#111827',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#666', fontSize: '12px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative_users" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                      name={t('charts.totalUsers')}
                    />
                    <Bar 
                      dataKey="new_users" 
                      fill="#10b981" 
                      name={t('charts.newUsers')}
                      radius={[2, 2, 0, 0]}
                    />
                  </AreaChart>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-center px-4">
                      {t('charts.noGrowthData')}
                    </p>
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
              {t('topPerformers.title')}
            </CardTitle>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {t('topPerformers.subtitle')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm md:text-base">
                  {t('topPerformers.mostInquiries')}
                </h4>
                {topUsersByInquiries.map((user, index) => (
                  <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-3 mb-1 sm:mb-0">
                      <div className={cn(
                        "w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full flex-shrink-0",
                        index === 0 ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-gray-100 dark:bg-gray-700/50'
                      )}>
                        <span className={cn(
                          "text-xs font-medium",
                          index === 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'
                        )}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium dark:text-white text-sm truncate">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{user.user_type}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 self-end sm:self-auto">
                      {formatNumber(user.total_inquiries)} {t('topPerformers.inquiries')}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm md:text-base">
                  {t('topPerformers.mostProperties')}
                </h4>
                {topUsersByProperties.map((user, index) => (
                  <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-3 mb-1 sm:mb-0">
                      <div className={cn(
                        "w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full flex-shrink-0",
                        index === 0 ? 'bg-purple-100 dark:bg-purple-900/20' : 'bg-gray-100 dark:bg-gray-700/50'
                      )}>
                        <span className={cn(
                          "text-xs font-medium",
                          index === 0 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
                        )}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium dark:text-white text-sm truncate">
                          {user.full_name || user.email}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{user.user_type}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 self-end sm:self-auto">
                      {formatNumber(user.total_properties)} {t('topPerformers.properties')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
            {t('usersTable.title')}
          </CardTitle>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            {t('usersTable.subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('usersTable.columns.user')}
                  </th>
                  <th className="text-left py-2 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('usersTable.columns.type')}
                  </th>
                  <th className="text-left py-2 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('usersTable.columns.properties')}
                  </th>
                  <th className="text-left py-2 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('usersTable.columns.views')}
                  </th>
                  <th className="text-left py-2 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('usersTable.columns.inquiries')}
                  </th>
                  <th className="text-left py-2 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('usersTable.columns.conversion')}
                  </th>
                  <th className="text-left py-2 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('usersTable.columns.status')}
                  </th>
                  <th className="text-left py-2 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('usersTable.columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className={cn(
                      "border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                      selectedUser === user.id && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                    onClick={() => setSelectedUser(user.id === selectedUser ? null : user.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          user.is_active_today ? "bg-green-100 dark:bg-green-900/20" : "bg-gray-100 dark:bg-gray-700"
                        )}>
                          {user.is_active_today ? (
                            <UserCheck className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <UserX className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium dark:text-white text-sm truncate">
                            {user.full_name || t('usersTable.noName')}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {t('usersTable.joined')}: {formatDate(user.joined_date)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        user.user_type === 'admin' ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800' :
                        user.user_type === 'agent' ? 'bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
                        user.user_type === 'seller' ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                        'bg-gray-50 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      )}>
                        {user.user_type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Home className="h-3 w-3 md:h-4 md:w-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium dark:text-white text-sm">{formatNumber(user.total_properties)}</p>
                          {user.active_properties > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {user.active_properties} {t('usersTable.active')}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-3 w-3 md:h-4 md:w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium dark:text-white text-sm">{formatNumber(user.total_views)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-3 w-3 md:h-4 md:w-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium dark:text-white text-sm">{formatNumber(user.total_inquiries)}</p>
                          {user.recent_inquiries > 0 && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              +{user.recent_inquiries} {t('usersTable.recent')}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className={cn(
                          "h-3 w-3 md:h-4 md:w-4 flex-shrink-0",
                          user.conversion_rate > 5 ? 'text-green-500' : 
                          user.conversion_rate > 2 ? 'text-amber-500' : 'text-gray-400'
                        )} />
                        <span className={cn(
                          "font-medium text-sm",
                          user.conversion_rate > 5 ? 'text-green-600 dark:text-green-400' : 
                          user.conversion_rate > 2 ? 'text-amber-600 dark:text-amber-400' : 
                          'text-gray-600 dark:text-gray-400'
                        )}>
                          {user.conversion_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {user.is_active_today ? (
                          <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="text-xs md:text-sm">{t('usersTable.activeStatus')}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="text-xs md:text-sm">{t('usersTable.inactiveStatus')}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>{t('usersTable.actionsLabel')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => window.location.href = `/admin/users/${user.id}`}>
                            {t('usersTable.viewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = `/admin/users/${user.id}/properties`}>
                            {t('usersTable.viewProperties')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
                            {t('usersTable.copyEmail')}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 dark:text-red-400">
                            {t('usersTable.suspendUser')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                {t('usersTable.noUsers')}
              </p>
            </div>
          )}
          
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {t('usersTable.showing', { 
                showing: filteredUsers.length, 
                total: adminUserData?.users.length || 0 
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs md:text-sm"
              >
                {t('usersTable.refresh')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData('json')}
                className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs md:text-sm"
              >
                <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                {t('usersTable.exportJSON')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}