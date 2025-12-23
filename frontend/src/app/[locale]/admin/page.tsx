// src/app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Building2,
  MessageSquare,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { adminApi } from '@/lib/api/admin';
import { SystemReport } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import MarketStatsCard from '@/components/dashboard/MarketStatsCard';
import PriceTrendChart from '@/components/dashboard/PriceTrendChart';
import AdminLayout from '@/components/admin/AdminLayout';
import { Alert, AlertDescription } from '@/components/ui/Alert';

const AdminDashboard = () => {
  const [stats, setStats] = useState<SystemReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAdminDashboard();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      icon: <Users className="h-5 w-5" />,
      change: '+12.5%',
      trend: 'up',
      color: 'blue',
    },
    {
      title: 'Total Properties',
      value: stats?.total_properties || 0,
      icon: <Building2 className="h-5 w-5" />,
      change: '+8.2%',
      trend: 'up',
      color: 'green',
    },
    {
      title: 'Total Inquiries',
      value: stats?.total_inquiries || 0,
      icon: <MessageSquare className="h-5 w-5" />,
      change: '+5.3%',
      trend: 'up',
      color: 'purple',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats?.revenue_month || 0, 'ETB'),
      icon: <DollarSign className="h-5 w-5" />,
      change: `${stats?.revenue_growth || 0}%`,
      trend: stats?.revenue_growth && stats.revenue_growth > 0 ? 'up' : 'down',
      color: 'amber',
    },
  ];

  const recentActivities = [
    { user: 'John Doe', action: 'Added new property', time: '2 min ago' },
    { user: 'Jane Smith', action: 'Updated profile', time: '15 min ago' },
    { user: 'Bob Johnson', action: 'Made inquiry', time: '30 min ago' },
    { user: 'Alice Brown', action: 'Registered', time: '1 hour ago' },
    { user: 'Charlie Wilson', action: 'Purchased promotion', time: '2 hours ago' },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your platform today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => fetchStats()}
          >
            Refresh
          </Button>
          <Button onClick={() => router.push('/admin/reports')}>
            Generate Report
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                  <div className={`text-${stat.color}-600 dark:text-${stat.color}-400`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
              <div className="flex items-center mt-4">
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  from last month
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Price Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceTrendChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Market Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <MarketStatsCard />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {activity.user[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.user}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.action}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-1" />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => router.push('/admin/audit-logs')}
            >
              View All Activities
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Active Users
                </span>
                <Badge variant="outline">
                  {stats?.active_users || 0} online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Active Properties
                </span>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="font-medium">{stats?.active_properties || 0}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Inactive Properties
                </span>
                <span className="text-sm font-medium text-red-600">
                  {(stats?.total_properties || 0) - (stats?.active_properties || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Pending Approvals
                </span>
                <span className="text-sm font-medium text-yellow-600">
                  3 {/* You can add actual count */}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Storage Used
                </span>
                <span className="text-sm font-medium">
                  {((stats?.storage_used || 0) / 1024).toFixed(1)} GB
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Avg. Response Time
                </span>
                <span className="text-sm font-medium">
                  {stats?.avg_response_time || 0}ms
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;