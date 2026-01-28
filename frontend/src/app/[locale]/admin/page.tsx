// src/app/[locale]/admin/page.tsx - DARK MODE & MOBILE RESPONSIVE
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
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  HardDrive,
  Database,
  Cpu,
  RefreshCw,
  FileText,
  Home,
  MapPin,
  Target,
  Calendar,
  CheckCircle,
  Star,
  Bed,
  Bath,
  Maximize2,
  AlertCircle,
  Download,
  Settings,
  Shield,
  Bell,
  Globe,
  ShoppingBag,
  CreditCard,
  CheckSquare,
  XCircle,
  PieChart,
  LineChart as LineChartIcon,
  DownloadCloud,
  UserCheck,
  Users as UsersIcon,
  Home as HomeIcon,
  Mail,
  Phone,
  Tag,
  ChevronRight,
  Filter,
  Search,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Progress } from '@/components/ui/progress';
import { adminApi } from '@/lib/api/admin';
import { analyticsApi } from '@/lib/api/analytics';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

// Define types based on AnalyticsDashboardData structure
interface ActivityItem {
  user: string;
  action: string;
  time: string;
  type: 'property' | 'registration' | 'inquiry' | 'system';
}

interface CityData {
  name: string;
  properties: number;
  growth: string;
}

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  color: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'emerald';
  description: string;
  realData: boolean;
}

interface ChartDataPoint {
  date: string;
  users: number;
  properties: number;
  revenue: number;
  inquiries: number;
  views?: number;
}

interface UserGrowthData {
  date: string;
  new_users: number;
  active_users: number;
  cumulative_users: number;
}

interface MarketTrend {
  date: string;
  total_listings?: number;
  active_listings?: number;
  average_price?: number;
  total_inquiries?: number;
  total_views?: number;
}

interface AdminProperty {
  id: number;
  title: string;
  price_etb: number;
  monthly_rent?: number;
  listing_type: string;
  property_type: string;
  city: any;
  sub_city: any;
  bedrooms: number;
  bathrooms: number;
  total_area: number;
  views_count: number;
  inquiry_count: number;
  is_verified: boolean;
  created_at: string;
  property_status: string;
  is_active: boolean;
  is_featured: boolean;
  owner?: any;
}

interface DashboardData {
  platform_metrics: {
    total_users: number;
    new_users_today: number;
    total_properties: number;
    active_properties: number;
    verified_properties: number;
    featured_properties: number;
    sale_properties?: number;
    rent_properties?: number;
  };
  revenue_metrics: {
    total_revenue: number;
    revenue_today: number;
    total_transactions: number;
    avg_transaction_value: number;
  };
  engagement_metrics: {
    total_views_today: number;
    total_inquiries_today: number;
    total_inquiries?: number;
    active_users_today: number;
    user_retention_rate: number;
  };
  performance_metrics: {
    api_performance: string;
    error_rate: number;
    server_uptime: number;
    response_time: number;
  };
  recent_activity: {
    recent_users: Array<{ email: string; joined: string }>;
    recent_properties: Array<{ title: string; price: number; listed: string }>;
    recent_payments: Array<{ amount: number; user: string; date: string }>;
  };
  top_performers: {
    top_properties: Array<{ title: string; views: number; inquiries: number; city: string }>;
    top_users: Array<{ email: string; properties: number; total_views: number }>;
  };
}

const AdminDashboard = () => {
  const t = useTranslations('admin.dashboard');
  const locale = useLocale();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [platformMetrics, setPlatformMetrics] = useState<any>(null);
  const [latestProperties, setLatestProperties] = useState<AdminProperty[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [topCities, setTopCities] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]); // Add state

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboard, trends, metrics, propertiesRes, growth] = await Promise.allSettled([
        analyticsApi.getDashboardAnalytics('admin'),
        analyticsApi.getMarketTrends(30),
        analyticsApi.getPlatformMetrics(),
        adminApi.getPropertiesAdmin({
          limit: 50,
          ordering: '-created_at',
          is_active: true
        }),
        analyticsApi.getUserGrowth(30), // Fetch user growth
      ]);

      if (dashboard.status === 'fulfilled') {
        setDashboardData(dashboard.value as DashboardData);
      } else {
        // ... (fallback data can remain, omitted for brevity if no changes)
        setDashboardData({
          platform_metrics: {
            total_users: 0,
            new_users_today: 0,
            total_properties: 0,
            active_properties: 0,
            verified_properties: 0,
            featured_properties: 0,
            sale_properties: 0,
            rent_properties: 0,
          },
          revenue_metrics: {
            total_revenue: 0,
            revenue_today: 0,
            total_transactions: 0,
            avg_transaction_value: 0,
          },
          engagement_metrics: {
            total_views_today: 0,
            total_inquiries_today: 0,
            total_inquiries: 0,
            active_users_today: 0,
            user_retention_rate: 0,
          },
          performance_metrics: {
            api_performance: 'Good',
            error_rate: 0,
            server_uptime: 99.9,
            response_time: 250,
          },
          recent_activity: {
            recent_users: [],
            recent_properties: [],
            recent_payments: [],
          },
          top_performers: {
            top_properties: [],
            top_users: [],
          },
        });
      }

      if (trends.status === 'fulfilled' && trends.value && trends.value.length > 0) {
        setMarketTrends(trends.value as MarketTrend[]);
      } else {
        setMarketTrends([]);
      }

      if (metrics.status === 'fulfilled') {
        setPlatformMetrics(metrics.value);
      } else {
        setPlatformMetrics(null);
      }

      if (propertiesRes.status === 'fulfilled' && propertiesRes.value) {
        const properties = propertiesRes.value.results || [];
        setLatestProperties(properties.slice(0, 5) as AdminProperty[]);

        const activities: ActivityItem[] = properties.slice(0, 5).map(property => ({
          user: property.owner?.email || 'Unknown User',
          action: `${t('activities.property_listed')}: ${property.title}`,
          time: property.created_at,
          type: 'property'
        }));
        setRecentActivities(activities);

        const cityMap: Map<string, number> = new Map();
        properties.forEach(property => {
          const cityName = getCityName(property.city);
          if (cityName && cityName !== 'Unspecified') {
            cityMap.set(cityName, (cityMap.get(cityName) || 0) + 1);
          }
        });

        const topCitiesData: CityData[] = Array.from(cityMap.entries())
          .map(([name, count]) => ({
            name,
            properties: count,
            growth: '+0%'
          }))
          .sort((a, b) => b.properties - a.properties)
          .slice(0, 5);

        setTopCities(topCitiesData);
      } else {
        setLatestProperties([]);
      }

      if (growth.status === 'fulfilled' && growth.value) {
        setUserGrowth(growth.value);
      }

    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(t('errors.loadFailed') || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [refreshKey]);

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  const prepareChartData = (): ChartDataPoint[] => {
    // Create a map of dates to data
    const dataMap = new Map<string, ChartDataPoint>();
    const today = new Date();

    // Initialize with last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });

      dataMap.set(dateStr, {
        date: displayDate,
        users: 0,
        properties: 0,
        revenue: 0,
        inquiries: 0,
        views: 0
      });
    }

    // Merge Market Trends (Properties, Inquiries, Views)
    if (Array.isArray(marketTrends)) {
      marketTrends.forEach(trend => {
        if (!trend.date) return;
        const dateStr = trend.date.split('T')[0];
        const point = dataMap.get(dateStr);
        if (point) {
          point.properties = trend.active_listings || trend.total_listings || 0;
          point.inquiries = trend.total_inquiries || 0;
          point.views = trend.total_views || 0;
          point.revenue = trend.average_price || 0;
        }
      });
    }

    // Merge User Growth
    if (Array.isArray(userGrowth)) {
      userGrowth.forEach(growth => {
        if (!growth.date) return;
        const dateStr = growth.date.split('T')[0];
        const point = dataMap.get(dateStr);
        if (point) {
          point.users = growth.cumulative_users || growth.active_users || 0;
        }
      });
    }

    // Convert map values to array
    const data = Array.from(dataMap.values());

    // Fallback if no real data
    if (data.every(d => d.users === 0 && d.properties === 0)) {
      // ... (Simulated data fallback logic can be improved or kept)
      // For now, let's return the empty-ish data but ideally we should keep the simulation fallback if data is truly empty

      // If we have absolutely no data, use simulation
      if (marketTrends.length === 0 && userGrowth.length === 0) {
        const simData: ChartDataPoint[] = [];
        const totalProperties = dashboardData?.platform_metrics?.total_properties || 0;
        const totalUsers = dashboardData?.platform_metrics?.total_users || 0;
        const totalInquiries = dashboardData?.engagement_metrics?.total_inquiries_today || 0;
        const totalViews = dashboardData?.engagement_metrics?.total_views_today || 0;

        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });

          const baseProperties = Math.max(1, Math.floor(totalProperties / 1)); // Assuming linear for simulation
          const baseUsers = Math.max(1, Math.floor(totalUsers / 1));

          const variation = 0.1;

          simData.push({
            date: dateStr,
            users: Math.floor(baseUsers * (0.9 + Math.random() * variation)), // Just a flat line with noise
            properties: Math.floor(baseProperties * (0.9 + Math.random() * variation)),
            revenue: 0,
            inquiries: Math.floor(totalInquiries * Math.random()),
            views: Math.floor(totalViews * Math.random())
          });
        }
        return simData;
      }
    }

    return data;
  };

  const getStatCards = (): StatCard[] => {
    if (!dashboardData) {
      return [
        {
          title: t('stats.totalUsers'),
          value: 0,
          icon: <Users className="h-4 w-4 sm:h-5 sm:w-5" />,
          change: '+0%',
          trend: 'neutral',
          color: 'blue',
          description: t('stats.registeredUsers'),
          realData: false,
        },
        {
          title: t('stats.totalProperties'),
          value: 0,
          icon: <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />,
          change: '+0%',
          trend: 'neutral',
          color: 'green',
          description: t('stats.listedProperties'),
          realData: false,
        },
        {
          title: t('stats.todayInquiries'),
          value: 0,
          icon: <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />,
          change: '0 active users',
          trend: 'neutral',
          color: 'purple',
          description: t('stats.inquiriesToday'),
          realData: false,
        },
        {
          title: t('stats.todayRevenue'),
          value: formatCurrency(0, 'ETB'),
          icon: <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />,
          change: '0 transactions',
          trend: 'neutral',
          color: 'amber',
          description: t('stats.revenueToday'),
          realData: false,
        },
      ];
    }

    return [
      {
        title: t('stats.totalUsers'),
        value: dashboardData.platform_metrics.total_users || 0,
        icon: <Users className="h-4 w-4 sm:h-5 sm:w-5" />,
        change: `${dashboardData.platform_metrics.new_users_today || 0} ${t('stats.today')}`,
        trend: dashboardData.platform_metrics.new_users_today > 0 ? 'up' : 'neutral',
        color: 'blue',
        description: t('stats.registeredUsers'),
        realData: true,
      },
      {
        title: t('stats.totalProperties'),
        value: dashboardData.platform_metrics.total_properties || 0,
        icon: <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />,
        change: `${dashboardData.platform_metrics.active_properties || 0} ${t('stats.active')}`,
        trend: dashboardData.platform_metrics.active_properties > 0 ? 'up' : 'neutral',
        color: 'green',
        description: t('stats.listedProperties'),
        realData: true,
      },
      {
        title: t('stats.todayInquiries'),
        value: dashboardData.engagement_metrics.total_inquiries_today || 0,
        icon: <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />,
        change: `${dashboardData.engagement_metrics.active_users_today || 0} ${t('stats.active_users')}`,
        trend: dashboardData.engagement_metrics.total_inquiries_today > 0 ? 'up' : 'neutral',
        color: 'purple',
        description: t('stats.inquiriesToday'),
        realData: true,
      },
      {
        title: t('stats.todayRevenue'),
        value: formatCurrency(dashboardData.revenue_metrics.revenue_today || 0, 'ETB'),
        icon: <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />,
        change: `${dashboardData.revenue_metrics.total_transactions || 0} ${t('stats.transactions')}`,
        trend: dashboardData.revenue_metrics.revenue_today > 0 ? 'up' : 'neutral',
        color: 'amber',
        description: t('stats.revenueToday'),
        realData: true,
      },
    ];
  };

  const getPropertyStatistics = () => {
    if (!dashboardData) {
      return {
        totalProperties: 0,
        activeProperties: 0,
        verifiedProperties: 0,
        featuredProperties: 0,
        saleProperties: 0,
        rentProperties: 0,
        promotedProperties: 0,
        averagePrice: 0,
        totalInquiries: 0,
      };
    }

    const salePropertiesFromLatest = latestProperties.filter(p =>
      p.listing_type?.toLowerCase() === 'sale'
    ).length;

    const rentPropertiesFromLatest = latestProperties.filter(p =>
      p.listing_type?.toLowerCase() === 'rent'
    ).length;

    const totalLatest = latestProperties.length;

    // Use direct metrics from dashboardData if available, otherwise fallback to estimation
    let estimatedSaleCount = dashboardData.platform_metrics.sale_properties ?? 0;
    let estimatedRentCount = dashboardData.platform_metrics.rent_properties ?? 0;

    // Fallback if backend returns 0 (and we have properties) or undefined
    if (estimatedSaleCount === 0 && estimatedRentCount === 0 && totalLatest > 0) {
      const saleRatio = salePropertiesFromLatest / totalLatest;
      const rentRatio = rentPropertiesFromLatest / totalLatest;

      estimatedSaleCount = Math.floor((dashboardData.platform_metrics.active_properties || 0) * saleRatio);
      estimatedRentCount = Math.floor((dashboardData.platform_metrics.active_properties || 0) * rentRatio);
    }

    return {
      totalProperties: dashboardData.platform_metrics.total_properties || 0,
      activeProperties: dashboardData.platform_metrics.active_properties || 0,
      verifiedProperties: dashboardData.platform_metrics.verified_properties || 0,
      featuredProperties: dashboardData.platform_metrics.featured_properties || 0,
      saleProperties: estimatedSaleCount,
      rentProperties: estimatedRentCount,
      promotedProperties: latestProperties.filter(p => p.is_featured).length,
      averagePrice: dashboardData.revenue_metrics.avg_transaction_value || 0,
      totalInquiries: dashboardData.engagement_metrics.total_inquiries || dashboardData.engagement_metrics.total_inquiries_today || 0,
    };
  };

  const formatPropertyPrice = (property: AdminProperty) => {
    if (property.listing_type === 'sale' || property.listing_type === 'Sale') {
      return formatCurrency(property.price_etb, 'ETB');
    } else if (property.listing_type === 'rent' || property.listing_type === 'Rent') {
      const rentAmount = property.monthly_rent || property.price_etb;
      return `${formatCurrency(rentAmount, 'ETB')}/${t('common.per_month')}`;
    } else {
      return formatCurrency(property.price_etb, 'ETB');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffDays > 0) {
        return t('time.days_ago', { count: diffDays });
      } else if (diffHours > 0) {
        return t('time.hours_ago', { count: diffHours });
      } else {
        return t('time.minutes_ago', { count: diffMinutes });
      }
    } catch {
      return t('time.recently');
    }
  };

  const getPropertyTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'apartment': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      'house': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      'villa': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
      'commercial': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      'land': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
      'condominium': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
      'office': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
    };

    const lowerType = type.toLowerCase();
    return colors[lowerType] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  };

  const getCityName = (city: any): string => {
    if (!city) return t('location.unspecified');
    if (typeof city === 'string') return city;
    if (city && typeof city === 'object' && city.name) return city.name;
    if (city && typeof city === 'object' && city.city_name) return city.city_name;
    return t('location.unspecified');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-12 h-12 animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 mb-2 dark:bg-gray-700" />
            <Skeleton className="h-3 sm:h-4 w-48 sm:w-64 dark:bg-gray-700" />
          </div>
          <Skeleton className="h-8 sm:h-10 w-28 sm:w-32 dark:bg-gray-700" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 sm:h-32 dark:bg-gray-700" />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Skeleton className="h-64 sm:h-80 dark:bg-gray-700" />
          <Skeleton className="h-64 sm:h-80 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  const chartData = prepareChartData();
  const statCards = getStatCards();
  const propertyStats = getPropertyStatistics();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          <Button
            variant="outline"
            onClick={refreshData}
            className="gap-1.5 sm:gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs sm:text-sm px-2 sm:px-4"
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? t('actions.refreshing') : t('actions.refresh')}
          </Button>

          {marketTrends.length === 0 && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  setLoading(true);
                  await analyticsApi.generateDailyTrend();
                  refreshData();
                } catch (error) {
                  console.error('Failed to generate trends:', error);
                } finally {
                  setLoading(false);
                }
              }}
              className="gap-1.5 sm:gap-2 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-xs sm:text-sm px-2 sm:px-4"
              size="sm"
            >
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t('actions.generate_trends')}
            </Button>
          )}

          <Button
            onClick={() => router.push('/admin/reports')}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-xs sm:text-sm px-2 sm:px-4"
            size="sm"
          >
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            {t('actions.generate_report')}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-red-700 dark:text-red-400">
            {t('errors.title')}
          </AlertTitle>
          <AlertDescription className="text-red-600 dark:text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="hover:shadow-lg transition-shadow duration-200 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    {stat.realData && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 px-1 py-0">
                        {t('badges.live')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold mt-1 sm:mt-2 text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={cn(
                  "p-2 sm:p-3 rounded-full flex-shrink-0",
                  stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                    stat.color === 'green' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                      stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' :
                        stat.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                          stat.color === 'red' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                            'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                )}>
                  {stat.icon}
                </div>
              </div>
              <div className="flex items-center mt-2 sm:mt-4">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-1" />
                ) : stat.trend === 'down' ? (
                  <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 mr-1" />
                ) : null}
                <span className={cn(
                  "text-xs sm:text-sm font-medium",
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

      {/* Tabs for different views - Mobile Optimized */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 bg-gray-100 dark:bg-gray-800 p-1 h-auto">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-0"
          >
            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 inline-block" />
            <span className="hidden sm:inline">{t('tabs.overview')}</span>
            <span className="sm:hidden">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="properties"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-0"
          >
            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 inline-block" />
            <span className="hidden sm:inline">{t('tabs.properties')}</span>
            <span className="sm:hidden">Properties</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-0"
          >
            <PieChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 inline-block" />
            <span className="hidden sm:inline">{t('tabs.analytics')}</span>
            <span className="sm:hidden">Analytics</span>
          </TabsTrigger>
          <TabsTrigger
            value="insights"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-0"
          >
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 inline-block" />
            <span className="hidden sm:inline">{t('tabs.insights')}</span>
            <span className="sm:hidden">Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Platform Growth Chart */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center text-gray-900 dark:text-white text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {t('charts.platformGrowth')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 sm:h-64 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartData.length > 0 ? (
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeOpacity={0.3} />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: '#666', fontSize: 10 }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis
                          tick={{ fill: '#666', fontSize: 10 }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="users"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.2}
                          name={t('charts.users')}
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="properties"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.2}
                          name={t('charts.properties')}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2 sm:mb-3" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('charts.noGrowthData')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">{t('charts.dataWillAppear')}</p>
                        </div>
                      </div>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center text-gray-900 dark:text-white text-base sm:text-lg">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {t('charts.engagementMetrics')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56 sm:h-64 md:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartData.length > 0 ? (
                      <BarChart data={chartData.slice(-7)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeOpacity={0.3} />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: '#666', fontSize: 10 }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <YAxis
                          tick={{ fill: '#666', fontSize: 10 }}
                          axisLine={{ stroke: '#e0e0e0' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            fontSize: '12px',
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="inquiries"
                          fill="#8b5cf6"
                          name={t('charts.inquiries')}
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="views"
                          fill="#0ea5e9"
                          name={t('charts.views')}
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <Activity className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2 sm:mb-3" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('charts.noEngagementData')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">{t('charts.dataWillAppear')}</p>
                        </div>
                      </div>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity and Quick Stats */}
          <div className="grid grid-cols-1 gap-0 sm:gap-0">
            <Card className="lg:col-span-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center text-gray-900 dark:text-white text-base sm:text-lg">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {t('activities.recentActivity')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity: ActivityItem, index: number) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-150 border border-gray-100 dark:border-gray-700"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0">
                          <div className={cn(
                            "h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0",
                            activity.type === 'property' ? 'bg-blue-100 dark:bg-blue-900/20' :
                              activity.type === 'registration' ? 'bg-green-100 dark:bg-green-900/20' :
                                activity.type === 'inquiry' ? 'bg-purple-100 dark:bg-purple-900/20' :
                                  'bg-gray-100 dark:bg-gray-800'
                          )}>
                            {activity.type === 'property' ? <Home className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" /> :
                              activity.type === 'registration' ? <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" /> :
                                activity.type === 'inquiry' ? <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" /> :
                                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {activity.user}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              {activity.action}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {formatTimeAgo(activity.time)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2 sm:mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('activities.noActivities')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {t('activities.activitiesWillAppear')}
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  className="w-full mt-3 sm:mt-4 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                  onClick={() => router.push('/admin/audit')}
                >
                  {t('actions.viewAllActivities')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4 sm:space-y-6">
          {/* Property Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Property Stats Card */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                  {t('properties.statistics')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {[
                    {
                      label: t('properties.totalProperties'),
                      value: propertyStats.totalProperties,
                      max: Math.max(propertyStats.totalProperties * 2, 1000),
                      color: 'bg-blue-500'
                    },
                    {
                      label: t('properties.activeProperties'),
                      value: propertyStats.activeProperties,
                      max: propertyStats.totalProperties || 1,
                      color: 'bg-green-500'
                    },
                    {
                      label: t('properties.verifiedProperties'),
                      value: propertyStats.verifiedProperties,
                      max: propertyStats.totalProperties || 1,
                      color: 'bg-purple-500'
                    },
                    {
                      label: t('properties.featuredProperties'),
                      value: propertyStats.featuredProperties,
                      max: propertyStats.totalProperties || 1,
                      color: 'bg-amber-500'
                    },
                    {
                      label: t('properties.averagePrice'),
                      value: formatCurrency(propertyStats.averagePrice, 'ETB'),
                      max: 5000000,
                      color: 'bg-red-500'
                    },
                  ].map((item, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                          {typeof item.value === 'string' ? item.value : item.value.toLocaleString(locale)}
                        </span>
                      </div>
                      <Progress
                        value={typeof item.value === 'number' ? Math.min(100, (item.value / item.max) * 100) : 0}
                        className="bg-gray-200 dark:bg-gray-700 h-1.5"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Property Types Distribution */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                  {t('properties.propertyDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {propertyStats.totalProperties > 0 ? (
                  <>
                    <div className="h-48 sm:h-56 md:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={[
                              { name: t('properties.forSale'), value: propertyStats.saleProperties, color: '#3b82f6' },
                              { name: t('properties.forRent'), value: propertyStats.rentProperties, color: '#10b981' },
                              { name: t('properties.featured'), value: propertyStats.featuredProperties, color: '#f59e0b' },
                              { name: t('properties.verified'), value: propertyStats.verifiedProperties, color: '#8b5cf6' },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          >
                            <Cell fill="#3b82f6" />
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#8b5cf6" />
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [`${value} ${t('properties.properties')}`, name]}
                          />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 sm:mt-4">
                      {[
                        {
                          label: t('properties.forSale'),
                          count: propertyStats.saleProperties,
                          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
                          totalCount: propertyStats.totalProperties
                        },
                        {
                          label: t('properties.forRent'),
                          count: propertyStats.rentProperties,
                          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
                          totalCount: propertyStats.totalProperties
                        },
                        {
                          label: t('properties.featured'),
                          count: propertyStats.featuredProperties,
                          color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
                          totalCount: propertyStats.totalProperties
                        },
                        {
                          label: t('properties.verified'),
                          count: propertyStats.verifiedProperties,
                          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
                          totalCount: propertyStats.totalProperties
                        },
                      ].map((item, index) => (
                        <div key={index} className={`flex flex-col p-2 sm:p-3 rounded-lg ${item.color}`}>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium">{item.label}</span>
                            <span className="text-sm sm:text-lg font-bold">{item.count}</span>
                          </div>
                          {item.totalCount > 0 && (
                            <div className="text-xs mt-1 opacity-80">
                              {((item.count / item.totalCount) * 100).toFixed(0)}% {t('properties.ofTotalProperties')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-48 sm:h-56 md:h-64 flex flex-col items-center justify-center">
                    <BarChart3 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 dark:text-gray-500 mb-2 sm:mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-1">
                      {t('properties.noDistributionData')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                      {t('properties.distributionWillAppear')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Property Actions */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                  {t('properties.quickActions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-2 sm:py-3 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => router.push('/admin/properties/new')}
                  >
                    <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{t('properties.addNewProperty')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{t('properties.createNewListing')}</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-2 sm:py-3 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => router.push('/admin/approval')}
                  >
                    <Clock className="h-4 w-4 mr-2 text-amber-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{t('properties.pendingReviews')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{t('properties.reviewNewListings')}</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-2 sm:py-3 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => router.push('/admin/properties?verified=false')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{t('properties.verifyProperties')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{t('properties.approveListings')}</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-2 sm:py-3 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => router.push('/admin/properties/analytics')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{t('properties.propertyAnalytics')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{t('properties.viewPerformance')}</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Latest Properties List */}
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <CardTitle className="flex items-center text-gray-900 dark:text-white text-base sm:text-lg">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {t('properties.latestProperties')}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/properties')}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs sm:text-sm"
                >
                  {t('properties.viewAllProperties')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {latestProperties.length > 0 ? (
                  latestProperties.map((property) => (
                    <div
                      key={property.id}
                      className="flex flex-col md:flex-row items-start md:items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors duration-150"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                              {property.title}
                            </h3>
                            {property.is_verified && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 text-xs">
                                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                {t('properties.verified')}
                              </Badge>
                            )}
                          </div>
                          <Badge className={`${getPropertyTypeColor(property.property_type)} text-xs`}>
                            {property.property_type}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {getCityName(property.city)}
                            {property.sub_city && `, ${getCityName(property.sub_city)}`}
                          </div>

                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="flex items-center">
                              <Bed className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              {property.bedrooms || 0} {t('properties.beds')}
                            </div>
                            <div className="flex items-center">
                              <Bath className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              {property.bathrooms || 0} {t('properties.baths')}
                            </div>
                            <div className="flex items-center">
                              <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              {property.total_area || 0} {t('properties.area')}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                              {formatPropertyPrice(property)}
                            </span>
                            <Badge variant={
                              property.listing_type?.toLowerCase() === 'sale' ? 'default' :
                                property.listing_type?.toLowerCase() === 'rent' ? 'secondary' : 'outline'
                            } className="text-xs">
                              {property.listing_type || t('properties.unknown')}
                            </Badge>
                          </div>

                          <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                            <div className="flex items-center">
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              {property.views_count || 0} {t('properties.views')}
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              {property.inquiry_count || 0} {t('properties.inquiries')}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              {formatTimeAgo(property.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 sm:space-x-2 self-end md:self-auto mt-2 md:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/properties/${property.id}`)}
                          className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs sm:text-sm"
                        >
                          {t('properties.viewDetails')}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Building2 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2 sm:mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('properties.noPropertiesFound')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {t('properties.propertiesWillAppear')}
                    </p>
                    <Button
                      className="mt-2 sm:mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-xs sm:text-sm"
                      onClick={() => router.push('/admin/properties/new')}
                    >
                      {t('properties.addNewProperty')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Geographical Distribution */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center text-gray-900 dark:text-white text-base sm:text-lg">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {t('analytics.propertyDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {topCities.length > 0 ? (
                    topCities.map((city: CityData, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{city.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {city.properties} {t('analytics.properties')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 text-xs">
                          {city.growth}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2 sm:mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('analytics.noCityData')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {t('analytics.cityDataWillAppear')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Analytics */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center text-gray-900 dark:text-white text-base sm:text-lg">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {t('analytics.revenuePerformance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-6">
                  {[
                    {
                      label: t('analytics.totalRevenue'),
                      value: dashboardData?.revenue_metrics.total_revenue || 0,
                      threshold: 1000000,
                      format: (val: number) => formatCurrency(val, 'ETB')
                    },
                    {
                      label: t('analytics.todaysRevenue'),
                      value: dashboardData?.revenue_metrics.revenue_today || 0,
                      threshold: 100000,
                      format: (val: number) => formatCurrency(val, 'ETB')
                    },
                    {
                      label: t('analytics.avgTransaction'),
                      value: dashboardData?.revenue_metrics.avg_transaction_value || 0,
                      threshold: 50000,
                      format: (val: number) => formatCurrency(val, 'ETB')
                    },
                    {
                      label: t('analytics.totalTransactions'),
                      value: dashboardData?.revenue_metrics.total_transactions || 0,
                      threshold: 1000,
                      format: (val: number) => val.toLocaleString(locale)
                    },
                  ].map((metric, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{metric.label}</span>
                        <Badge variant={
                          metric.value > metric.threshold ? 'default' :
                            metric.value > metric.threshold * 0.5 ? 'outline' : 'secondary'
                        } className="text-xs">
                          {metric.format(metric.value)}
                        </Badge>
                      </div>
                      <Progress
                        value={Math.min(100, (metric.value / metric.threshold) * 100)}
                        className="bg-gray-200 dark:bg-gray-700 h-1.5"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Engagement Analytics */}
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center text-gray-900 dark:text-white text-base sm:text-lg">
                <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                {t('analytics.userEngagement')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{t('analytics.totalUsers')}</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData?.platform_metrics.total_users || 0}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {dashboardData?.platform_metrics.new_users_today || 0} {t('analytics.newToday')}
                  </p>
                </div>

                <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{t('analytics.activeToday')}</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData?.engagement_metrics.active_users_today || 0}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {dashboardData?.engagement_metrics.user_retention_rate?.toFixed(1) || 0}% {t('analytics.retentionRate')}
                  </p>
                </div>

                <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{t('analytics.todaysInquiries')}</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData?.engagement_metrics.total_inquiries || 0}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {dashboardData?.engagement_metrics.total_inquiries_today || 0} {t('analytics.today')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                {t('performance.systemPerformance')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {[
                  {
                    icon: <Cpu className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />,
                    title: t('performance.cpuUsage'),
                    value: `${platformMetrics?.system?.cpu_usage_percent || '0'}%`,
                    status: platformMetrics?.system?.cpu_usage_percent < 50 ? t('performance.optimal') :
                      platformMetrics?.system?.cpu_usage_percent < 80 ? t('performance.moderate') : t('performance.slow'),
                    color: 'blue'
                  },
                  {
                    icon: <HardDrive className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />,
                    title: t('performance.memory'),
                    value: `${platformMetrics?.system?.memory_usage_percent || '0'}%`,
                    status: platformMetrics?.system?.memory_usage_percent < 60 ? t('performance.healthy') : t('performance.high'),
                    color: 'green'
                  },
                  {
                    icon: <Database className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />,
                    title: t('performance.database'),
                    value: `${platformMetrics?.database?.connections || '0'}`,
                    subtitle: t('performance.activeConnections'),
                    color: 'amber'
                  },
                  {
                    icon: <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />,
                    title: t('performance.uptime'),
                    value: `${platformMetrics?.system?.uptime_percentage || '0'}%`,
                    subtitle: t('performance.days', { days: platformMetrics?.system?.uptime_days?.toFixed(1) || '0' }),
                    color: 'purple'
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 sm:p-4 rounded-lg",
                      item.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' :
                        item.color === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
                          item.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20' :
                            'bg-purple-50 dark:bg-purple-900/20'
                    )}
                  >
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      {item.icon}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</span>
                    </div>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold mt-1.5 sm:mt-2 text-gray-900 dark:text-white">
                      {item.value}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.status || item.subtitle}
                    </p>
                  </div>
                ))}
              </div>

              {/* Real-time Performance Chart */}
              <div className="h-56 sm:h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  {chartData.length > 0 ? (
                    <LineChart data={chartData.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeOpacity={0.3} />
                      <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#666', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="inquiries"
                        stroke="#8b5cf6"
                        name={t('performance.inquiries')}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="views"
                        stroke="#0ea5e9"
                        name={t('performance.views')}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="properties"
                        stroke="#10b981"
                        name={t('performance.properties')}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Activity className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2 sm:mb-3" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('performance.noPerformanceData')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{t('performance.dataWillAppear')}</p>
                      </div>
                    </div>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Platform Insights */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                  {t('insights.platformInsights')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {dashboardData?.platform_metrics.total_users && dashboardData.platform_metrics.total_users > 0 && (
                    <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t('insights.userGrowth')}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {t('insights.platformHasUsers', { count: dashboardData.platform_metrics.total_users })}
                        {dashboardData.platform_metrics.total_users > 1000
                          ? t('insights.considerAdvancedSegmentation')
                          : t('insights.focusUserAcquisition')}
                      </p>
                    </div>
                  )}

                  {dashboardData?.platform_metrics.total_properties && dashboardData.platform_metrics.total_properties > 0 && (
                    <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t('insights.propertyMarketplace')}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {t('insights.propertiesListed', { count: dashboardData.platform_metrics.total_properties })}
                        {dashboardData.platform_metrics.active_properties < dashboardData.platform_metrics.total_properties
                          ? t('insights.propertiesInactive', { count: dashboardData.platform_metrics.total_properties - (dashboardData.platform_metrics.active_properties || 0) })
                          : t('insights.allPropertiesActive')}
                      </p>
                    </div>
                  )}

                  {dashboardData?.revenue_metrics.total_revenue && dashboardData.revenue_metrics.total_revenue > 0 && (
                    <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{t('insights.revenuePerformance')}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {t('insights.monthlyRevenue', { amount: formatCurrency(dashboardData.revenue_metrics.total_revenue, 'ETB') })}
                        {dashboardData.revenue_metrics.revenue_today && dashboardData.revenue_metrics.revenue_today > 0
                          ? t('insights.growingAtRate', { rate: 15 })
                          : t('insights.exploreNewRevenue')}
                      </p>
                    </div>
                  )}

                  {dashboardData?.platform_metrics.verified_properties &&
                    dashboardData.platform_metrics.total_properties &&
                    dashboardData.platform_metrics.verified_properties < dashboardData.platform_metrics.total_properties * 0.8 && (
                      <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{t('insights.verificationNeeded')}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {t('insights.onlyPercentVerified', { percent: Math.round((dashboardData.platform_metrics.verified_properties / dashboardData.platform_metrics.total_properties) * 100) })}
                          {t('insights.considerAutomatedVerification')}
                        </p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-gray-900 dark:text-white text-base sm:text-lg">
                  {t('insights.quickActions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    className="w-full justify-start h-auto py-2 sm:py-3 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    variant="outline"
                    onClick={() => router.push('/admin/users')}
                  >
                    <Users className="h-4 w-4 mr-2 text-blue-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{t('insights.manageUsers')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {t('insights.countUsers', { count: dashboardData?.platform_metrics.total_users || 0 })}
                      </div>
                    </div>
                  </Button>

                  <Button
                    className="w-full justify-start h-auto py-2 sm:py-3 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    variant="outline"
                    onClick={() => router.push('/admin/properties')}
                  >
                    <Building2 className="h-4 w-4 mr-2 text-green-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{t('insights.manageProperties')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {t('insights.countProperties', { count: dashboardData?.platform_metrics.total_properties || 0 })}
                      </div>
                    </div>
                  </Button>

                  <Button
                    className="w-full justify-start h-auto py-2 sm:py-3 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    variant="outline"
                    onClick={() => router.push('/admin/inquiries')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2 text-purple-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{t('insights.viewInquiries')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {t('insights.countInquiries', { count: dashboardData?.engagement_metrics.total_inquiries || 0 })}
                      </div>
                    </div>
                  </Button>

                  <Button
                    className="w-full justify-start h-auto py-2 sm:py-3 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    variant="outline"
                    onClick={() => router.push('/admin/analytics/export')}
                  >
                    <DownloadCloud className="h-4 w-4 mr-2 text-cyan-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{t('insights.advancedAnalytics')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {t('insights.detailedReports')}
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;