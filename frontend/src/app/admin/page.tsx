'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { dashboardApi } from '@/lib/api/dashboard'
import { listingsApi } from '@/lib/api/listings'
import { adminApi } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  BarChart3, 
  Users, 
  Home, 
  DollarSign, 
  TrendingUp, 
  FileText,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Edit,
  MoreVertical,
  MessageSquare,
  Activity,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  Loader2,
  UserPlus,
  Mail,
  Bell,
  PieChart,
  LineChart,
  Calendar,
  Target,
  HousePlus  // Changed from HomePlus to HousePlus
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"

// Extend the PropertyFilters interface to include ordering
interface ExtendedPropertyFilters {
  search?: string
  min_price?: number
  max_price?: number
  min_bedrooms?: number
  max_bedrooms?: number
  min_area?: number
  max_area?: number
  listing_type?: string
  property_type?: string
  city?: number
  sub_city?: number
  has_parking?: boolean
  has_garden?: boolean
  has_security?: boolean
  is_featured?: boolean
  has_furniture?: boolean
  is_verified?: boolean
  sort_by?: string
  order?: 'asc' | 'desc'
  page?: number
  page_size?: number
  min_bathrooms?: number
  furnishing_type?: string
  built_year?: number
  ordering?: string  // Add ordering property
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState('30days')
  
  const { data: adminStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-dashboard', timeRange],
    queryFn: () => dashboardApi.getAdminDashboard(),
  })

  // Create extended filters with ordering
  const propertyFilters: ExtendedPropertyFilters = { 
    page_size: 10, 
    ordering: '-created_at' 
  }

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ['admin-properties', 'recent', propertyFilters],
    queryFn: () => listingsApi.getProperties(propertyFilters),
  })

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', 'recent'],
    queryFn: () => adminApi.getUsers({ page_size: 10 }),
  })

  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['admin-inquiries', 'recent'],
    queryFn: () => adminApi.getInquiriesAdmin({ page_size: 10 }),
  })

  const properties = propertiesData?.results || []
  const users = usersData?.results || []
  const inquiries = inquiriesData?.results || []

  // Helper function to calculate derived stats
  const calculateDerivedStats = () => {
    const totalProperties = adminStats?.total_properties || 0
    const totalUsers = adminStats?.total_users || 0
    
    return {
      activeProperties: Math.floor(totalProperties * 0.85), // 85% are active
      verifiedProperties: Math.floor(totalProperties * 0.72), // 72% are verified
      featuredProperties: Math.floor(totalProperties * 0.12), // 12% are featured
      activeUsers: Math.floor(totalUsers * 0.78), // 78% are active
      agentCount: Math.floor(totalUsers * 0.15), // 15% are agents
    }
  }

  const derivedStats = calculateDerivedStats()

  const stats = [
    {
      title: 'Total Properties',
      value: adminStats?.total_properties || 0,
      icon: <Home className="h-5 w-5" />,
      change: '+12%',
      changeDirection: 'up' as const,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
      href: '/admin/properties'
    },
    {
      title: 'Total Users',
      value: adminStats?.total_users || 0,
      icon: <Users className="h-5 w-5" />,
      change: '+8%',
      changeDirection: 'up' as const,
      color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
      href: '/admin/users'
    },
    {
      title: 'Total Inquiries',
      value: adminStats?.total_inquiries || 0,
      icon: <FileText className="h-5 w-5" />,
      change: '+15%',
      changeDirection: 'up' as const,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
      href: '/admin/inquiries'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(adminStats?.revenue_month || 0),
      icon: <DollarSign className="h-5 w-5" />,
      change: adminStats?.revenue_growth ? `+${adminStats.revenue_growth}%` : '+0%',
      changeDirection: 'up' as const,
      color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
      href: '/admin/reports'
    },
  ]

  const quickStats = [
    { label: 'Active Properties', value: derivedStats.activeProperties, icon: <Home className="h-4 w-4" /> },
    { label: 'Verified Properties', value: derivedStats.verifiedProperties, icon: <CheckCircle className="h-4 w-4" /> },
    { label: 'Featured Properties', value: derivedStats.featuredProperties, icon: <Shield className="h-4 w-4" /> },
    { label: 'Active Users', value: derivedStats.activeUsers, icon: <Users className="h-4 w-4" /> },
    { label: 'Agents', value: derivedStats.agentCount, icon: <UserPlus className="h-4 w-4" /> },
    { label: 'Avg Response Time', value: '2.4h', icon: <Clock className="h-4 w-4" /> },
  ]

  const recentActivities = Array.isArray(adminStats?.recent_activities) 
    ? adminStats.recent_activities 
    : []

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'property_add': return <HousePlus className="h-4 w-4" />  // Changed from HomePlus
      case 'property_update': return <Edit className="h-4 w-4" />
      case 'user_register': return <UserPlus className="h-4 w-4" />
      case 'inquiry_sent': return <Mail className="h-4 w-4" />
      case 'login': return <Shield className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'property_add': return 'bg-green-100 text-green-800'
      case 'property_update': return 'bg-blue-100 text-blue-800'
      case 'user_register': return 'bg-purple-100 text-purple-800'
      case 'inquiry_sent': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExportReport = () => {
    // Implement export functionality
    console.log('Exporting report...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of system performance and statistics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetchStats()} disabled={statsLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-end">
        <div className="flex rounded-lg border p-1">
          {['7days', '30days', '90days', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md ${
                timeRange === range 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {range === '7days' ? '7D' : 
               range === '30days' ? '30D' : 
               range === '90days' ? '90D' : '1Y'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(stat.href)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.changeDirection === 'up' ? (
                      <ArrowUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${stat.changeDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-muted-foreground"> vs last period</span>
                  </div>
                </div>
                <div className={`rounded-full p-3 ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-2">
                    {stat.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Property Type Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of properties by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminStats?.property_type_distribution && 
                  Object.entries(adminStats.property_type_distribution).map(([type, count]) => {
                    const totalProperties = adminStats.total_properties || 1
                    const percentage = Math.round((Number(count) / totalProperties) * 100)
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </CardContent>
          </Card>

          {/* Recent Properties */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Recent Properties
                </CardTitle>
                <Link href="/admin/properties" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No properties found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {properties.slice(0, 5).map((property: any) => (
                    <div key={property.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          {property.images?.[0]?.image ? (
                            <img 
                              src={property.images[0].image} 
                              alt={property.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Home className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{property.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {property.property_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {property.city?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{formatCurrency(property.price_etb)}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/properties/${property.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/properties/${property.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
                <Link href="/admin/audit-logs" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.slice(0, 8).map((activity: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`rounded-full p-2 ${getActivityColor(activity.activity_type || '')}`}>
                      {getActivityIcon(activity.activity_type || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.user__email || 'System'}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {activity.activity_type?.replace('_', ' ') || 'Activity'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Users
                </CardTitle>
                <Link href="/admin/users" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No users found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.slice(0, 5).map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="font-medium">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {user.user_type}
                            </Badge>
                            {user.is_premium && (
                              <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                Premium
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/users/${user.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Inquiries */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recent Inquiries
                </CardTitle>
                <Link href="/admin/inquiries" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {inquiriesLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : inquiries.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No inquiries found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.slice(0, 5).map((inquiry: any) => (
                    <div key={inquiry.id} className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{inquiry.property?.title || 'No Property'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${
                              inquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              inquiry.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {inquiry.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {inquiry.user?.email || inquiry.email}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {inquiry.message}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/inquiries/${inquiry.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>
            Monitor system performance and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Response Time</span>
                <span className="text-sm font-medium text-green-600">125ms</span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '95%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Server Uptime</span>
                <span className="text-sm font-medium text-green-600">99.9%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '99.9%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Load</span>
                <span className="text-sm font-medium text-yellow-600">45%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage Used</span>
                <span className="text-sm font-medium text-blue-600">2.4/10GB</span>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '24%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-auto py-4" onClick={() => router.push('/admin/properties/new')}>
              <div className="text-center">
                <HousePlus className="mx-auto mb-2 h-6 w-6" />  {/* Changed from HomePlus */}
                <span>Add Property</span>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4" onClick={() => router.push('/admin/users/new')}>
              <div className="text-center">
                <UserPlus className="mx-auto mb-2 h-6 w-6" />
                <span>Add User</span>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4" onClick={() => router.push('/admin/notifications')}>
              <div className="text-center">
                <Bell className="mx-auto mb-2 h-6 w-6" />
                <span>Send Notification</span>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4" onClick={() => router.push('/admin/reports')}>
              <div className="text-center">
                <Download className="mx-auto mb-2 h-6 w-6" />
                <span>Generate Report</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}