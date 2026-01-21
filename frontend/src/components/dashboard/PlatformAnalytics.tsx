// src/components/dashboard/PlatformAnalytics.tsx - UPDATED
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { 
  Gauge, Cpu, HardDrive, Database, Server, Activity,
  AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw,
  AlertCircle, Shield, Zap
} from 'lucide-react';
import { analyticsApi } from '@/lib/api/analytics';
import { PlatformMetrics } from '@/lib/types/analytics';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function PlatformAnalytics() {
  const t = useTranslations('analytics.platform');
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      if (!refreshing) setRefreshing(true);
      const data = await analyticsApi.getPlatformMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch platform metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getProgressColorClass = (value: number, type: 'cpu' | 'memory' | 'disk' = 'cpu') => {
    if (type === 'cpu') {
      return value > 80 ? 'bg-red-600 dark:bg-red-500' : value > 60 ? 'bg-yellow-600 dark:bg-yellow-500' : 'bg-green-600 dark:bg-green-500';
    } else if (type === 'memory') {
      return value > 80 ? 'bg-red-600 dark:bg-red-500' : value > 60 ? 'bg-yellow-600 dark:bg-yellow-500' : 'bg-green-600 dark:bg-green-500';
    } else { // disk
      return value > 85 ? 'bg-red-600 dark:bg-red-500' : value > 70 ? 'bg-yellow-600 dark:bg-yellow-500' : 'bg-green-600 dark:bg-green-500';
    }
  };

  const getBadgeVariant = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'default';
    if (value <= thresholds.warning) return 'outline';
    return 'destructive';
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-8 w-48 bg-gray-300 dark:bg-gray-700" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 md:h-32 bg-gray-300 dark:bg-gray-700" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Skeleton className="h-64 md:h-80 bg-gray-300 dark:bg-gray-700" />
          <Skeleton className="h-64 md:h-80 bg-gray-300 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{t('loadFailed')}</p>
        </CardContent>
      </Card>
    );
  }

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
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMetrics}
          disabled={refreshing}
          className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? t('refreshing') : t('refresh')}
        </Button>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start md:items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('cards.uptime')}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {metrics.system.uptime_percentage}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metrics.system.uptime_days.toFixed(1)} {t('cards.days')}
                </p>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Server className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="relative mt-3 md:mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div 
                className="h-full bg-green-600 dark:bg-green-500 transition-all"
                style={{ width: `${metrics.system.uptime_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start md:items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('cards.cpu')}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {metrics.system.cpu_usage_percent}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('cards.systemLoad')}
                </p>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <Cpu className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="relative mt-3 md:mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div 
                className={cn("h-full transition-all", getProgressColorClass(metrics.system.cpu_usage_percent, 'cpu'))}
                style={{ width: `${metrics.system.cpu_usage_percent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start md:items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('cards.memory')}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {metrics.system.memory_usage_percent}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metrics.system.memory_used_mb.toFixed(0)} / {metrics.system.memory_total_mb.toFixed(0)} MB
                </p>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <HardDrive className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="relative mt-3 md:mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div 
                className={cn("h-full transition-all", getProgressColorClass(metrics.system.memory_usage_percent, 'memory'))}
                style={{ width: `${metrics.system.memory_usage_percent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start md:items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('cards.disk')}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {metrics.system.disk_usage_percent}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metrics.system.disk_used_gb.toFixed(1)} / {metrics.system.disk_total_gb.toFixed(1)} GB
                </p>
              </div>
              <div className="p-2 md:p-3 rounded-full bg-amber-100 dark:bg-amber-900/20">
                <Database className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="relative mt-3 md:mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div 
                className={cn("h-full transition-all", getProgressColorClass(metrics.system.disk_usage_percent, 'disk'))}
                style={{ width: `${metrics.system.disk_usage_percent}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
              {t('application.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('application.responseTime')}
                  </span>
                </div>
                <Badge variant={getBadgeVariant(metrics.application.response_time_ms, { good: 200, warning: 500 })}>
                  {metrics.application.response_time_ms}ms
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Gauge className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('application.errorRate')}
                  </span>
                </div>
                <Badge variant={getBadgeVariant(metrics.application.error_rate_percent, { good: 1, warning: 5 })}>
                  {metrics.application.error_rate_percent}%
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('application.dbConnections')}
                  </span>
                </div>
                <Badge variant="outline" className="border-gray-300 dark:border-gray-600">
                  {metrics.database.connections}
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('application.activeSessions')}
                  </span>
                </div>
                <Badge variant="outline" className="border-gray-300 dark:border-gray-600">
                  {metrics.application.active_sessions}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl">
              {t('systemInfo.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 md:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('systemInfo.os')}
                </span>
                <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                  {metrics.system.os}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('systemInfo.python')}
                </span>
                <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                  {metrics.system.python_version}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('systemInfo.django')}
                </span>
                <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                  {metrics.system.django_version}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('systemInfo.database')}
                </span>
                <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                  {metrics.database.name}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t('systemInfo.dbSize')}
                </span>
                <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                  {metrics.database.size_mb} MB
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {metrics.alerts.length > 0 && (
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <span>{t('alerts.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.alerts.map((alert, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-3 rounded-lg flex items-start md:items-center space-x-3",
                    alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
                    alert.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                    'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  )}
                >
                  {alert.type === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  ) : alert.type === 'critical' ? (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {alert.metric}: {alert.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-900 dark:text-white text-lg md:text-xl flex items-center space-x-2">
            <Zap className="h-5 w-5 text-green-600 dark:text-green-500" />
            <span>{t('performance.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="text-center p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {t('performance.avgResponse')}
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {metrics.performance.average_response_time}ms
              </p>
            </div>
            <div className="text-center p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {t('performance.p95Response')}
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {metrics.performance.p95_response_time}ms
              </p>
            </div>
            <div className="text-center p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {t('performance.p99Response')}
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {metrics.performance.p99_response_time}ms
              </p>
            </div>
            <div className="text-center p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {t('performance.requestsPerSec')}
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {metrics.performance.requests_per_second}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}