import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Users, 
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { InquiryStats as StatsType } from '@/lib/types/inquiry';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface InquiryStatsProps {
  stats: StatsType;
  loading?: boolean;
}

export const InquiryStats: React.FC<InquiryStatsProps> = ({ stats, loading = false }) => {
  const t = useTranslations('inquiries');

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { overview, performance, status_distribution } = stats;

  const statCards = [
    {
      title: t('totalInquiries'),
      value: overview.total,
      icon: MessageSquare,
      color: 'bg-blue-500 dark:bg-blue-600',
      trend: '+12%',
    },
    {
      title: t('newToday'),
      value: overview.new_today,
      icon: Calendar,
      color: 'bg-green-500 dark:bg-green-600',
      change: '+3',
    },
    {
      title: t('unassignedInquiries'),
      value: overview.unassigned,
      icon: Users,
      color: 'bg-yellow-500 dark:bg-yellow-600',
      urgent: overview.unassigned > 0,
    },
    {
      title: t('urgentInquiries'),
      value: overview.urgent,
      icon: AlertCircle,
      color: 'bg-red-500 dark:bg-red-600',
      urgent: true,
    },
  ];

  const performanceCards = [
    {
      title: t('avgResponseTime'),
      value: `${performance.avg_response_time_hours.toFixed(1)}h`,
      icon: Clock,
      description: 'Time to first response',
    },
    {
      title: t('responseRate'),
      value: `${performance.response_rate.toFixed(1)}%`,
      icon: CheckCircle,
      description: 'Inquiries responded to',
    },
    {
      title: t('conversionRate'),
      value: `${performance.conversion_rate.toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Inquiries converted to closed',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1 dark:text-white">{stat.value}</p>
                  {stat.trend && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stat.trend} from last week
                    </p>
                  )}
                  {stat.change && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {parseInt(stat.change) > 0 ? '+' : ''}{stat.change} from yesterday
                    </p>
                  )}
                </div>
                <div className={cn("p-3 rounded-lg", stat.color)}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              {stat.urgent && (stat.value as number) > 0 && (
                <Badge variant="destructive" className="mt-2">
                  {t('requiresAttention')}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {performanceCards.map((stat) => (
          <Card key={stat.title} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-lg",
                  stat.title.includes('Rate') ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                )}>
                  <stat.icon className={cn(
                    "w-6 h-6",
                    stat.title.includes('Rate') ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">{t('statusDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(status_distribution).map(([status, count]) => {
                const percentage = (count / overview.total) * 100;
                const width = `${percentage}%`;
                
                const statusColors: Record<string, string> = {
                  pending: 'bg-yellow-500 dark:bg-yellow-600',
                  contacted: 'bg-blue-500 dark:bg-blue-600',
                  viewing_scheduled: 'bg-green-500 dark:bg-green-600',
                  follow_up: 'bg-orange-500 dark:bg-orange-600',
                  closed: 'bg-gray-500 dark:bg-gray-600',
                  spam: 'bg-red-500 dark:bg-red-600',
                };

                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize dark:text-gray-300">{status.replace('_', ' ')}</span>
                      <span className="font-medium dark:text-gray-300">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full", statusColors[status] || 'bg-gray-500 dark:bg-gray-600')}
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">{t('recentActivities')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent_activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-sm dark:text-gray-300">{activity.property__title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.user_display_name}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <Badge className="text-xs bg-gray-100 dark:bg-gray-800 dark:text-gray-300">
                      {activity.status}
                    </Badge>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};