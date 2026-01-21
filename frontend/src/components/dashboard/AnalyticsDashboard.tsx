// src/components/dashboard/AnalyticsDashboard.tsx - UPDATED
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, Building2, Eye, MessageSquare, DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { analyticsApi } from '@/lib/api/analytics';
import { AnalyticsDashboardData } from '@/lib/types/analytics';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  userType?: 'admin' | 'user';
}

export function AnalyticsDashboard({ userType = 'user' }: AnalyticsDashboardProps) {
  const t = useTranslations('analytics.dashboard');
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [userType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const analyticsData = await analyticsApi.getDashboardAnalytics(userType);
      setData(analyticsData);
    } catch (err) {
      setError(t('loadFailed'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return t('time.daysAgo', { count: diffDays });
    } else if (diffHours > 0) {
      return t('time.hoursAgo', { count: diffHours });
    } else {
      return t('time.minutesAgo', { count: diffMinutes });
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: userType === 'admin' ? 6 : 3 }).map((_, i) => (
          <Card key={i} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24 bg-gray-300 dark:bg-gray-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2 bg-gray-300 dark:bg-gray-700" />
              <Skeleton className="h-4 w-full bg-gray-300 dark:bg-gray-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error || t('noData')}</p>
        </CardContent>
      </Card>
    );
  }

  const statCards = userType === 'admin' ? [
    {
      title: t('stats.totalUsers'),
      value: data.platform_metrics.total_users,
      icon: <Users className="h-5 w-5" />,
      change: data.platform_metrics.new_users_today > 0 
        ? t('stats.newUsersToday', { count: data.platform_metrics.new_users_today }) 
        : t('stats.noChange'),
      trend: data.platform_metrics.new_users_today > 0 ? 'up' : 'neutral',
      color: 'blue',
    },
    {
      title: t('stats.activeProperties'),
      value: data.platform_metrics.active_properties,
      icon: <Building2 className="h-5 w-5" />,
      change: t('stats.verifiedProperties', { count: data.platform_metrics.verified_properties }),
      trend: 'up',
      color: 'green',
    },
    {
      title: t('stats.todaysViews'),
      value: data.engagement_metrics.total_views_today,
      icon: <Eye className="h-5 w-5" />,
      change: t('stats.retentionRate', { rate: data.engagement_metrics.user_retention_rate.toFixed(1) }),
      trend: 'up',
      color: 'purple',
    },
    {
      title: t('stats.todaysInquiries'),
      value: data.engagement_metrics.total_inquiries_today,
      icon: <MessageSquare className="h-5 w-5" />,
      change: t('stats.activeUsers', { count: data.engagement_metrics.active_users_today }),
      trend: 'up',
      color: 'orange',
    },
    {
      title: t('stats.revenueToday'),
      value: formatCurrency(data.revenue_metrics.revenue_today, 'ETB'),
      icon: <DollarSign className="h-5 w-5" />,
      change: t('stats.avgTransaction', { amount: formatCurrency(data.revenue_metrics.avg_transaction_value, 'ETB') }),
      trend: data.revenue_metrics.revenue_today > 0 ? 'up' : 'down',
      color: 'amber',
    },
    {
      title: t('stats.systemPerformance'),
      value: data.performance_metrics.api_performance,
      icon: data.performance_metrics.api_performance === 'Good' ? (
        <TrendingUp className="h-5 w-5" />
      ) : (
        <TrendingDown className="h-5 w-5" />
      ),
      change: t('stats.responseTime', { time: data.performance_metrics.response_time }),
      trend: data.performance_metrics.api_performance === 'Good' ? 'up' : 'down',
      color: data.performance_metrics.api_performance === 'Good' ? 'emerald' : 'red',
    },
  ] : [
    // User-specific stats
    {
      title: t('stats.user.propertiesListed'),
      value: data.platform_metrics.total_properties,
      icon: <Building2 className="h-5 w-5" />,
      change: t('stats.user.activeProperties', { count: data.platform_metrics.active_properties }),
      trend: 'up',
      color: 'blue',
    },
    {
      title: t('stats.user.totalViews'),
      value: data.engagement_metrics.total_views_today,
      icon: <Eye className="h-5 w-5" />,
      change: t('stats.user.inquiries', { count: data.engagement_metrics.total_inquiries_today }),
      trend: 'up',
      color: 'green',
    },
    {
      title: t('stats.user.revenueGenerated'),
      value: formatCurrency(data.revenue_metrics.total_revenue, 'ETB'),
      icon: <DollarSign className="h-5 w-5" />,
      change: t('stats.user.transactions', { count: data.revenue_metrics.total_transactions }),
      trend: data.revenue_metrics.total_revenue > 0 ? 'up' : 'neutral',
      color: 'amber',
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start md:items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {stat.title}
                  </p>
                  <p className="text-xl md:text-2xl font-bold mt-1 md:mt-2 text-gray-900 dark:text-white truncate">
                    {stat.value}
                  </p>
                </div>
                <div className={cn(
                  "p-2 md:p-3 rounded-full flex-shrink-0 ml-2",
                  stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                  stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
                  stat.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/20' :
                  stat.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/20' :
                  stat.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/20' :
                  'bg-red-100 dark:bg-red-900/20'
                )}>
                  <div className={cn(
                    stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                    stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                    stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                    stat.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                    stat.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                    stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                    'text-red-600 dark:text-red-400'
                  )}>
                    {stat.icon}
                  </div>
                </div>
              </div>
              <div className="flex items-center mt-3 md:mt-4">
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-1 flex-shrink-0" />
                ) : stat.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-500 mr-1 flex-shrink-0" />
                ) : null}
                <span className={cn(
                  "text-xs md:text-sm font-medium truncate",
                  stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                  stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-600 dark:text-gray-400'
                )}>
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Activity */}
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
              {t('recentActivity.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recent_activity.recent_users.slice(0, 3).map((user, index) => (
                <div 
                  key={index} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {t('recentActivity.newUser')}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 self-end sm:self-auto">
                    {formatTimeAgo(user.joined)}
                  </span>
                </div>
              ))}
              {data.recent_activity.recent_users.length === 0 && (
                <div className="text-center py-6">
                  <Activity className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">{t('recentActivity.noActivity')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
              {t('topPerformers.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.top_performers.top_properties.slice(0, 3).map((property, index) => (
                <div 
                  key={index} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {property.title}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                        {property.city}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 self-end sm:self-auto"
                  >
                    {property.views} {t('topPerformers.views')}
                  </Badge>
                </div>
              ))}
              {data.top_performers.top_properties.length === 0 && (
                <div className="text-center py-6">
                  <TrendingUp className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">{t('topPerformers.noData')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}