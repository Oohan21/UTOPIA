// src/app/[locale]/admin/audit/page.tsx - DARK MODE & MOBILE FIXED WITH I18N
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi, PaginatedResponse } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  BaseSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/Select'
import {
  Shield,
  Search,
  Filter,
  Download,
  User,
  FileEdit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  RefreshCw,
  XCircle,
  LogIn,
  LogOut,
  Database,
  FileText,
  Key,
  Mail,
  Phone,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Users,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Activity,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Hash,
  FileSpreadsheet,
  Network,
  Server,
  Terminal
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils/formatDate'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { Label } from '@/components/ui/Label'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { useTranslations, useLocale } from 'next-intl'

// Types
interface AuditLogUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
}

interface AuditLog {
  id: number;
  user: AuditLogUser | null;
  action_type: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  changes: Record<string, any>;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  request_path?: string;
  request_method?: string;
  session_id?: string;
  browser?: string;
  os?: string;
  device?: string;
  country?: string;
  city?: string;
  created_at: string;
}

interface AuditLogResponse extends PaginatedResponse<AuditLog> {
  summary?: {
    total_logs: number;
    unique_users: number;
    unique_ips: number;
    action_distribution: Array<{ action_type: string; count: number }>;
    model_distribution: Array<{ model_name: string; count: number }>;
    top_users: Array<{ user__email: string; user__first_name: string; user__last_name: string; count: number }>;
    timeline: Array<{ date: string; count: number }>;
  };
}

interface ChangesObject {
  old?: any;
  new?: any;
  [key: string]: any;
}

// Get localized action types
const getActionTypes = (t: any) => [
  { value: 'all', label: t('all_actions'), icon: <Activity className="h-4 w-4" /> },
  { value: 'login', label: t('actions.login'), icon: <LogIn className="h-4 w-4" /> },
  { value: 'logout', label: t('actions.logout'), icon: <LogOut className="h-4 w-4" /> },
  { value: 'register', label: t('actions.register'), icon: <User className="h-4 w-4" /> },
  { value: 'password_change', label: t('actions.password_change'), icon: <Key className="h-4 w-4" /> },
  { value: 'password_reset', label: t('actions.password_reset'), icon: <Key className="h-4 w-4" /> },
  { value: 'create', label: t('actions.create'), icon: <FileEdit className="h-4 w-4" /> },
  { value: 'update', label: t('actions.update'), icon: <FileEdit className="h-4 w-4" /> },
  { value: 'delete', label: t('actions.delete'), icon: <Trash2 className="h-4 w-4" /> },
  { value: 'view', label: t('actions.view'), icon: <Eye className="h-4 w-4" /> },
  { value: 'export', label: t('actions.export'), icon: <Download className="h-4 w-4" /> },
  { value: 'profile_update', label: t('actions.profile_update'), icon: <User className="h-4 w-4" /> },
  { value: 'email_verification', label: t('actions.email_verification'), icon: <Mail className="h-4 w-4" /> },
  { value: 'phone_verification', label: t('actions.phone_verification'), icon: <Phone className="h-4 w-4" /> },
  { value: 'promotion_purchase', label: t('actions.promotion_purchase'), icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'property_save', label: t('actions.property_save'), icon: <FileText className="h-4 w-4" /> },
  { value: 'property_unsave', label: t('actions.property_unsave'), icon: <FileText className="h-4 w-4" /> },
  { value: 'search', label: t('actions.search'), icon: <Search className="h-4 w-4" /> },
  { value: 'inquiry_create', label: t('actions.inquiry_create'), icon: <FileText className="h-4 w-4" /> },
  { value: 'message_send', label: t('actions.message_send'), icon: <Mail className="h-4 w-4" /> },
  { value: 'notification_send', label: t('actions.notification_send'), icon: <AlertTriangle className="h-4 w-4" /> },
  { value: 'role_change', label: t('actions.role_change'), icon: <Users className="h-4 w-4" /> },
  { value: 'status_change', label: t('actions.status_change'), icon: <Activity className="h-4 w-4" /> },
  { value: 'bulk_action', label: t('actions.bulk_action'), icon: <Database className="h-4 w-4" /> },
]

// Get localized model types
const getModelTypes = (t: any) => [
  { value: 'all', label: t('all_models'), icon: <Database className="h-4 w-4" /> },
  { value: 'User', label: t('models.user'), icon: <Users className="h-4 w-4" /> },
  { value: 'Property', label: t('models.property'), icon: <Database className="h-4 w-4" /> },
  { value: 'Inquiry', label: t('models.inquiry'), icon: <FileText className="h-4 w-4" /> },
  { value: 'City', label: t('models.city'), icon: <Globe className="h-4 w-4" /> },
  { value: 'SubCity', label: t('models.sub_city'), icon: <Globe className="h-4 w-4" /> },
  { value: 'Amenity', label: t('models.amenity'), icon: <Database className="h-4 w-4" /> },
  { value: 'Notification', label: t('models.notification'), icon: <AlertTriangle className="h-4 w-4" /> },
  { value: 'MarketStats', label: t('models.market_stats'), icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'PropertyValuation', label: t('models.valuation'), icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'Message', label: t('models.message'), icon: <Mail className="h-4 w-4" /> },
  { value: 'Payment', label: t('models.payment'), icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'PropertyPromotion', label: t('models.promotion'), icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'SavedSearch', label: t('models.saved_search'), icon: <Search className="h-4 w-4" /> },
  { value: 'TrackedProperty', label: t('models.tracked_property'), icon: <Eye className="h-4 w-4" /> },
  { value: 'Comparison', label: t('models.comparison'), icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'System', label: t('models.system'), icon: <Server className="h-4 w-4" /> },
]

// Get localized date ranges
const getDateRanges = (t: any) => [
  { value: 'all', label: t('date_ranges.all_time'), icon: <Calendar className="h-4 w-4" /> },
  { value: 'today', label: t('date_ranges.today'), icon: <Calendar className="h-4 w-4" /> },
  { value: 'week', label: t('date_ranges.last_7_days'), icon: <Calendar className="h-4 w-4" /> },
  { value: 'month', label: t('date_ranges.last_30_days'), icon: <Calendar className="h-4 w-4" /> },
  { value: 'year', label: t('date_ranges.last_year'), icon: <Calendar className="h-4 w-4" /> },
]

// Get localized device types
const getDeviceTypes = (t: any) => [
  { value: 'all', label: t('devices.all'), icon: <Monitor className="h-4 w-4" /> },
  { value: 'Desktop', label: t('devices.desktop'), icon: <Monitor className="h-4 w-4" /> },
  { value: 'Mobile', label: t('devices.mobile'), icon: <Smartphone className="h-4 w-4" /> },
  { value: 'Tablet', label: t('devices.tablet'), icon: <Tablet className="h-4 w-4" /> },
]

interface FilterState {
  search: string
  action_type: string
  model_name: string
  date_range: string
  device: string
  user_id: string
}

interface ApiFilters {
  search?: string
  action_type?: string
  model_name?: string
  date_range?: string
  device?: string
  user_id?: string
  page?: number
  page_size?: number
}

const ITEMS_PER_PAGE = 20

// Clean parameters for API call
const cleanParams = (params: any): any => {
  if (!params) return undefined

  const cleaned: any = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === 'all' || value === undefined || value === null || value === '' || value === 'undefined') {
      continue
    }
    cleaned[key] = value
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}

// Transform API response
const transformAuditLogs = (data: any): AuditLogResponse => {
  if (!data) {
    return {
      count: 0,
      next: null,
      previous: null,
      results: [],
      total_pages: 0,
      current_page: 1,
    }
  }

  return {
    count: data.count || 0,
    next: data.next || null,
    previous: data.previous || null,
    results: (data.results || []).map((log: any) => ({
      id: log.id,
      user: log.user ? {
        id: log.user.id,
        email: log.user.email,
        first_name: log.user.first_name || '',
        last_name: log.user.last_name || '',
        profile_picture: log.user.profile_picture || undefined,
      } : null,
      action_type: log.action_type,
      model_name: log.model_name,
      object_id: log.object_id,
      object_repr: log.object_repr,
      changes: log.changes || {},
      old_values: log.old_values || {},
      new_values: log.new_values || {},
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      request_path: log.request_path,
      request_method: log.request_method,
      session_id: log.session_id,
      browser: log.browser,
      os: log.os,
      device: log.device,
      country: log.country,
      city: log.city,
      created_at: log.created_at,
    })),
    total_pages: data.total_pages || 0,
    current_page: data.current_page || 1,
    summary: data.summary,
  }
}

// Default empty response
const DEFAULT_AUDIT_LOG_RESPONSE: AuditLogResponse = {
  count: 0,
  next: null,
  previous: null,
  results: [],
  total_pages: 0,
  current_page: 1,
}

export default function AdminAuditPage() {
  const t = useTranslations('admin.audit');
  const locale = useLocale();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    action_type: 'all',
    model_name: 'all',
    date_range: 'all',
    device: 'all',
    user_id: '',
  })
  const [page, setPage] = useState(1)
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState('logs')
  const [mounted, setMounted] = useState(false)

  // Get localized options
  const ACTION_TYPES = getActionTypes(t);
  const MODEL_TYPES = getModelTypes(t);
  const DATE_RANGES = getDateRanges(t);
  const DEVICE_TYPES = getDeviceTypes(t);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prepare API filters
  const apiFilters = cleanParams({
    search: filters.search || undefined,
    action_type: filters.action_type !== 'all' ? filters.action_type : undefined,
    model_name: filters.model_name !== 'all' ? filters.model_name : undefined,
    date_range: filters.date_range !== 'all' ? filters.date_range : undefined,
    device: filters.device !== 'all' ? filters.device : undefined,
    user_id: filters.user_id || undefined,
  })

  // Fetch audit logs
  const {
    data: auditLogsData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['audit-logs', { ...apiFilters, page }],
    queryFn: async (): Promise<AuditLogResponse> => {
      try {
        const data = await adminApi.getAuditLogs({
          ...apiFilters,
          page,
          page_size: ITEMS_PER_PAGE
        });
        return transformAuditLogs(data);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        return DEFAULT_AUDIT_LOG_RESPONSE;
      }
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: 1000,
  })

  const auditLogs = auditLogsData?.results || []
  const totalCount = auditLogsData?.count || 0
  const totalPages = auditLogsData?.total_pages || Math.ceil(totalCount / ITEMS_PER_PAGE)
  const hasFilters = Object.values(filters).some(f => f && f !== 'all' && f !== '')
  const summary = auditLogsData?.summary

  // Handlers
  const handleExportLogs = async () => {
    try {
      toast.loading(t('exporting'));
      await adminApi.exportData('audit-logs', 'csv')
      toast.dismiss()
      toast.success(t('export_success'));
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || t('export_failed'));
    }
  }

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      action_type: 'all',
      model_name: 'all',
      date_range: 'all',
      device: 'all',
      user_id: '',
    })
    setPage(1)
  }, [])

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }, [])

  const handleSearch = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
    setPage(1)
  }, [])

  const toggleLogExpansion = useCallback((logId: number) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }, [])

  // Helper functions
  const getActionIcon = (actionType: string) => {
    const action = ACTION_TYPES.find(a => a.value === actionType)
    return action?.icon || <Activity className="h-4 w-4" />
  }

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      // Authentication
      'login': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      'logout': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700',
      'register': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      'password_change': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
      'password_reset': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',

      // CRUD Operations
      'create': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      'update': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      'delete': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
      'view': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700',

      // User Actions
      'profile_update': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
      'email_verification': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
      'phone_verification': 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',

      // Property Actions
      'property_save': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
      'property_unsave': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
      'promotion_purchase': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',

      // Communication
      'inquiry_create': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
      'message_send': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
      'notification_send': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',

      // System Actions
      'export': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      'search': 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800',
      'role_change': 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
      'status_change': 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
      'bulk_action': 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
    }

    return colors[actionType] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700'
  }

  const getDeviceIcon = (device?: string) => {
    switch (device) {
      case 'Desktop':
        return <Monitor className="h-3.5 w-3.5" />
      case 'Mobile':
        return <Smartphone className="h-3.5 w-3.5" />
      case 'Tablet':
        return <Tablet className="h-3.5 w-3.5" />
      default:
        return <Monitor className="h-3.5 w-3.5" />
    }
  }

  const getInitials = (user: AuditLogUser | null) => {
    if (!user) return 'S'
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'S'
  }

  const formatDetailedChanges = (log: AuditLog) => {
    const sections: Array<{
      title: string;
      data: Record<string, any>;
      icon: React.ReactNode;
    }> = []

    // Changes section
    if (log.changes && Object.keys(log.changes).length > 0) {
      sections.push({
        title: t('sections.changes'),
        data: log.changes,
        icon: <FileEdit className="h-4 w-4" />
      })
    }

    // Old values section
    if (log.old_values && Object.keys(log.old_values).length > 0) {
      sections.push({
        title: t('sections.old_values'),
        data: log.old_values,
        icon: <Clock className="h-4 w-4" />
      })
    }

    // New values section
    if (log.new_values && Object.keys(log.new_values).length > 0) {
      sections.push({
        title: t('sections.new_values'),
        data: log.new_values,
        icon: <FileEdit className="h-4 w-4" />
      })
    }

    return sections
  }

  const renderAnalyticsDashboard = () => {
    if (!summary) return null

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('summary.total_logs')}</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.total_logs.toLocaleString(locale)}
                  </h3>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Hash className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('summary.unique_users')}</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.unique_users.toLocaleString(locale)}
                  </h3>
                </div>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('summary.unique_ips')}</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.unique_ips.toLocaleString(locale)}
                  </h3>
                </div>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('summary.active_filters')}</p>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Object.values(filters).filter(f => f && f !== 'all').length}
                  </h3>
                </div>
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Filter className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Action Distribution */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">{t('charts.action_distribution')}</CardTitle>
              <CardDescription className="dark:text-gray-400">{t('charts.action_distribution_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.action_distribution?.slice(0, 10).map((item: { action_type: string; count: number }, index: number) => (
                  <div key={item.action_type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.action_type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.count.toLocaleString(locale)}</span>
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 dark:bg-blue-400"
                          style={{
                            width: `${(item.count / Math.max(...summary.action_distribution.map((a: { count: number }) => a.count))) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Model Distribution */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">{t('charts.model_distribution')}</CardTitle>
              <CardDescription className="dark:text-gray-400">{t('charts.model_distribution_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.model_distribution?.slice(0, 10).map((item: { model_name: string; count: number }, index: number) => (
                  <div key={item.model_name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{item.model_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.count.toLocaleString(locale)}</span>
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 dark:bg-green-400"
                          style={{
                            width: `${(item.count / Math.max(...summary.model_distribution.map((a: { count: number }) => a.count))) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Users */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">{t('top_users.title')}</CardTitle>
            <CardDescription className="dark:text-gray-400">{t('top_users.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.top_users?.slice(0, 10).map((user: { user__email: string; user__first_name: string; user__last_name: string; count: number }, index: number) => (
                <div key={user.user__email} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {`${user.user__first_name?.[0] || ''}${user.user__last_name?.[0] || ''}`.toUpperCase() || user.user__email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.user__first_name && user.user__last_name
                          ? `${user.user__first_name} ${user.user__last_name}`
                          : user.user__email}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.user__email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 sm:mt-0">
                    <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                      {user.count.toLocaleString(locale)} {t('top_users.actions')}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t('top_users.rank')} #{index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-12 h-12 animate-spin text-blue-500 dark:text-blue-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <XCircle className="mx-auto h-16 w-16 text-red-500 dark:text-red-400" />
              <div>
                <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">
                  {t('error.title')}
                </h3>
                <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                  {t('error.description')}
                </p>
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button 
                  variant="outline" 
                  onClick={() => refetch()}
                  className="dark:border-gray-600 dark:text-gray-300"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('error.retry')}
                </Button>
                <Button 
                  onClick={handleClearFilters}
                  className="dark:bg-gray-700 dark:text-white"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {t('error.clear_filters')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {t('title')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={isLoading || !hasFilters}
            className="gap-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-sm sm:text-base px-3 sm:px-4"
            size="sm"
          >
            <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {t('actions.clear_filters')}
            {hasFilters && (
              <span className="ml-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center dark:bg-blue-900/30 dark:text-blue-400">
                {Object.values(filters).filter(f => f && f !== 'all' && f !== '').length}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportLogs}
            disabled={isLoading || totalCount === 0}
            className="gap-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 text-sm sm:text-base px-3 sm:px-4"
            size="sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {t('actions.export_csv')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 dark:bg-gray-800 h-auto sm:h-10">
          <TabsTrigger 
            value="logs" 
            className="gap-1 sm:gap-2 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white text-sm sm:text-base py-2 sm:py-0"
          >
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">{t('tabs.activity_logs')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="gap-1 sm:gap-2 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white text-sm sm:text-base py-2 sm:py-0"
          >
            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">{t('tabs.analytics')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4 sm:space-y-6">
          {/* Filters Card - Mobile Optimized */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {t('filters.title')}
              </CardTitle>
              <CardDescription className="dark:text-gray-400 text-sm sm:text-base">
                {t('filters.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {/* Search - Full width on mobile */}
                <div className="space-y-2 sm:col-span-2 xl:col-span-2">
                  <Label htmlFor="search" className="flex items-center gap-2 dark:text-gray-300 text-sm sm:text-base">
                    <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {t('filters.search')}
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="search"
                      placeholder={t('filters.search_placeholder')}
                      value={filters.search}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-9 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm sm:text-base h-9 sm:h-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Action Type */}
                <div className="space-y-2">
                  <Label htmlFor="action-type" className="dark:text-gray-300 text-sm sm:text-base">
                    {t('filters.action_type')}
                  </Label>
                  <BaseSelect
                    value={filters.action_type}
                    onValueChange={(value) => handleFilterChange('action_type', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="action-type" className="w-full dark:bg-gray-700 dark:border-gray-600 text-sm sm:text-base h-9 sm:h-10">
                      <div className="flex items-center gap-2 truncate">
                        {ACTION_TYPES.find(a => a.value === filters.action_type)?.icon}
                        <SelectValue placeholder={t('filters.all_actions')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-60">
                      {ACTION_TYPES.map((action) => (
                        <SelectItem key={action.value} value={action.value} className="dark:text-gray-300 text-sm sm:text-base">
                          <div className="flex items-center gap-2 truncate">
                            {action.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </BaseSelect>
                </div>

                {/* Model Type */}
                <div className="space-y-2">
                  <Label htmlFor="model-type" className="dark:text-gray-300 text-sm sm:text-base">
                    {t('filters.model')}
                  </Label>
                  <BaseSelect
                    value={filters.model_name}
                    onValueChange={(value) => handleFilterChange('model_name', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="model-type" className="w-full dark:bg-gray-700 dark:border-gray-600 text-sm sm:text-base h-9 sm:h-10">
                      <div className="flex items-center gap-2 truncate">
                        {MODEL_TYPES.find(m => m.value === filters.model_name)?.icon}
                        <SelectValue placeholder={t('filters.all_models')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700 max-h-60">
                      {MODEL_TYPES.map((model) => (
                        <SelectItem key={model.value} value={model.value} className="dark:text-gray-300 text-sm sm:text-base">
                          <div className="flex items-center gap-2 truncate">
                            {model.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </BaseSelect>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label htmlFor="date-range" className="dark:text-gray-300 text-sm sm:text-base">
                    {t('filters.date_range')}
                  </Label>
                  <BaseSelect
                    value={filters.date_range}
                    onValueChange={(value) => handleFilterChange('date_range', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="date-range" className="w-full dark:bg-gray-700 dark:border-gray-600 text-sm sm:text-base h-9 sm:h-10">
                      <div className="flex items-center gap-2 truncate">
                        {DATE_RANGES.find(d => d.value === filters.date_range)?.icon}
                        <SelectValue placeholder={t('filters.all_time')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      {DATE_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value} className="dark:text-gray-300 text-sm sm:text-base">
                          <div className="flex items-center gap-2 truncate">
                            {range.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </BaseSelect>
                </div>

                {/* Device Type */}
                {/* <div className="space-y-2">
                  <Label htmlFor="device-type" className="dark:text-gray-300 text-sm sm:text-base">
                    {t('filters.device')}
                  </Label>
                  <BaseSelect
                    value={filters.device}
                    onValueChange={(value) => handleFilterChange('device', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="device-type" className="w-full dark:bg-gray-700 dark:border-gray-600 text-sm sm:text-base h-9 sm:h-10">
                      <div className="flex items-center gap-2 truncate">
                        {DEVICE_TYPES.find(d => d.value === filters.device)?.icon}
                        <SelectValue placeholder={t('filters.all_devices')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      {DEVICE_TYPES.map((device) => (
                        <SelectItem key={device.value} value={device.value} className="dark:text-gray-300 text-sm sm:text-base">
                          <div className="flex items-center gap-2 truncate">
                            {device.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </BaseSelect>
                </div> */}
              </div>
            </CardContent>
          </Card>

          {/* Main Content Card */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    <CardTitle className="text-gray-900 dark:text-white text-lg sm:text-xl">
                      {t('activity_logs.title')}
                    </CardTitle>
                    {isLoading || isRefetching ? (
                      <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-pulse rounded-full bg-blue-500" />
                    ) : null}
                  </div>
                  <CardDescription className="dark:text-gray-400 text-sm sm:text-base">
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-pulse rounded-full bg-gray-400" />
                        {t('activity_logs.loading')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-white">{totalCount.toLocaleString(locale)}</span>
                        <span className="text-gray-600 dark:text-gray-400">{t('activity_logs.logs_found')}</span>
                        {hasFilters && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
                            {t('activity_logs.filtered')}
                          </span>
                        )}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isLoading || isRefetching}
                    className="gap-1.5 sm:gap-2 dark:border-gray-600 dark:text-gray-300 text-xs sm:text-sm"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isRefetching && "animate-spin")} />
                    {t('activity_logs.refresh')}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Loading State */}
              {isLoading ? (
                <div className="space-y-3 sm:space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full dark:bg-gray-700" />
                        <div className="flex-1 space-y-2 sm:space-y-3">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <Skeleton className="h-3 sm:h-4 w-16 sm:w-20 dark:bg-gray-700" />
                            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 dark:bg-gray-700" />
                            <Skeleton className="h-3 sm:h-4 w-28 sm:w-32 dark:bg-gray-700" />
                          </div>
                          <Skeleton className="h-2.5 sm:h-3 w-40 sm:w-48 dark:bg-gray-700" />
                          <div className="flex items-center gap-3 sm:gap-4">
                            <Skeleton className="h-2.5 sm:h-3 w-20 sm:w-24 dark:bg-gray-700" />
                            <Skeleton className="h-2.5 sm:h-3 w-16 sm:w-20 dark:bg-gray-700" />
                            <Skeleton className="h-2.5 sm:h-3 w-12 sm:w-16 dark:bg-gray-700" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 rounded-full bg-gray-100 dark:bg-gray-700">
                    <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="text-center space-y-1.5 sm:space-y-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      {t('empty_state.title')}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md">
                      {hasFilters
                        ? t('empty_state.filtered')
                        : t('empty_state.default')}
                    </p>
                  </div>
                  {hasFilters && (
                    <Button 
                      variant="outline" 
                      onClick={handleClearFilters}
                      className="mt-2 sm:mt-4 dark:border-gray-600 dark:text-gray-300 text-sm"
                    >
                      {t('empty_state.clear_filters')}
                    </Button>
                  )}
                </div>
              ) : (
                /* Logs List */
                <>
                  <div className="space-y-3 sm:space-y-4">
                    {auditLogs.map((log: any) => (
                      <Collapsible
                        key={log.id}
                        open={expandedLogs.has(log.id)}
                        onOpenChange={() => toggleLogExpansion(log.id)}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <div className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                              {/* Action Icon */}
                              <div className={cn(
                                "rounded-full p-1.5 sm:p-2 border flex-shrink-0",
                                getActionColor(log.action_type)
                              )}>
                                {getActionIcon(log.action_type)}
                              </div>

                              {/* Log Details */}
                              <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                                {/* Title Row */}
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <p className="font-medium capitalize truncate text-gray-900 dark:text-white text-sm sm:text-base">
                                    {log.action_type.replace('_', ' ')} {log.model_name}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "capitalize px-1.5 py-0 sm:px-2 sm:py-0.5 text-xs",
                                      getActionColor(log.action_type)
                                    )}
                                  >
                                    {log.action_type.replace('_', ' ')}
                                  </Badge>
                                  {log.object_repr && (
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                      • {log.object_repr}
                                    </span>
                                  )}
                                </div>

                                {/* Metadata Row */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1 sm:gap-1.5">
                                    <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    <span className="truncate">
                                      {log.user?.email || t('common.system')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-1.5">
                                    <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    <span>{formatDate(log.created_at)}</span>
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-1.5">
                                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    <span>
                                      {new Date(log.created_at).toLocaleTimeString(locale, {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 mt-2 sm:mt-0">
                              {/* User Avatar */}
                              {log.user && (
                                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                  <AvatarImage
                                    src={log.user.profile_picture || undefined}
                                    alt={log.user.email}
                                  />
                                  <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs sm:text-sm">
                                    {getInitials(log.user)}
                                  </AvatarFallback>
                                </Avatar>
                              )}

                              {/* Expand/Collapse Button */}
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                                  {expandedLogs.has(log.id) ? (
                                    <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50 dark:bg-gray-800/50">
                            {/* Technical Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                              <div className="space-y-1.5 sm:space-y-2">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {t('details.technical_info')}
                                </h4>
                                <div className="space-y-1 text-xs sm:text-sm">
                                  {log.request_path && (
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t('details.path')}:
                                      </span>
                                      <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-gray-800 dark:text-gray-300">
                                        {log.request_method} {log.request_path}
                                      </code>
                                    </div>
                                  )}
                                  {log.session_id && (
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t('details.session')}:
                                      </span>
                                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{log.session_id.slice(0, 8)}...</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Device & Location */}
                              <div className="space-y-1.5 sm:space-y-2">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {t('details.device_location')}
                                </h4>
                                <div className="space-y-1 text-xs sm:text-sm">
                                  {log.device && (
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t('details.device')}:
                                      </span>
                                      <span className="text-gray-600 dark:text-gray-400">{log.device}</span>
                                    </div>
                                  )}
                                  {log.browser && (
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t('details.browser')}:
                                      </span>
                                      <span className="text-gray-600 dark:text-gray-400">{log.browser}</span>
                                    </div>
                                  )}
                                  {(log.country || log.city) && (
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {t('details.location')}:
                                      </span>
                                      <span className="text-gray-600 dark:text-gray-400">
                                        {[log.city, log.country].filter(Boolean).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Object Info */}
                              <div className="space-y-1.5 sm:space-y-2">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {t('details.object_info')}
                                </h4>
                                <div className="space-y-1 text-xs sm:text-sm">
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      {t('details.id')}:
                                    </span>
                                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-gray-800 dark:text-gray-300">
                                      {log.object_id || t('details.not_available')}
                                    </code>
                                  </div>
                                  <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      {t('details.model')}:
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">{log.model_name}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Changes Sections */}
                            {formatDetailedChanges(log).map((section, index) => (
                              <div key={index} className="space-y-1.5 sm:space-y-2">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  {section.icon}
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{section.title}</h4>
                                </div>
                                <div className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 sm:p-3 max-h-48 sm:max-h-60 overflow-y-auto">
                                  <pre className="text-xs whitespace-pre-wrap text-gray-800 dark:text-gray-300">
                                    {JSON.stringify(section.data, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                        {/* Results Count */}
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {t('pagination.showing')}{' '}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {((page - 1) * ITEMS_PER_PAGE + 1).toLocaleString(locale)}
                          </span>
                          {' '}{t('pagination.to')}{' '}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {Math.min(page * ITEMS_PER_PAGE, totalCount).toLocaleString(locale)}
                          </span>
                          {' '}{t('pagination.of')}{' '}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {totalCount.toLocaleString(locale)}
                          </span>
                          {' '}{t('pagination.logs')}
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex items-center gap-3 sm:gap-4">
                          <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            showFirstLast={true}
                            showPageNumbers={true}
                            maxVisiblePages={window.innerWidth < 640 ? 3 : 5}
                            className="dark:text-white text-sm sm:text-base"
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {renderAnalyticsDashboard()}
        </TabsContent>
      </Tabs>
    </div>
  )
}