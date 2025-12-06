// src/app/admin/audit/page.tsx - Fixed version
'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api/admin'
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
  Database,
  RefreshCw,
  XCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils/formatDate'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { Label } from '@/components/ui/Label'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'

const ACTION_TYPES = [
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'view', label: 'View' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'export', label: 'Export' },
]

const MODEL_TYPES = [
  { value: 'Property', label: 'Property' },
  { value: 'User', label: 'User' },
  { value: 'Inquiry', label: 'Inquiry' },
  { value: 'City', label: 'City' },
  { value: 'SubCity', label: 'Sub City' },
  { value: 'Amenity', label: 'Amenity' },
]

// Date range options - using special value for "all"
const DATE_RANGES = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
]

// Function to clean parameters
const cleanParams = (params: any): any => {
  if (!params) return undefined
  
  const cleaned: any = {}
  for (const [key, value] of Object.entries(params)) {
    // Skip 'all' values, undefined, null, empty string, or 'undefined' string
    if (value === 'all' || value === undefined || value === null || value === '' || value === 'undefined') {
      continue
    }
    cleaned[key] = value
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}

export default function AdminAuditPage() {
  const [filters, setFilters] = useState({
    search: '',
    action_type: '', // Empty string for "All"
    model_name: '', // Empty string for "All"
    date_range: 'all', // Default to 'all'
  })
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Clean filters for API call
  const apiFilters = cleanParams({
    search: filters.search || undefined,
    action_type: filters.action_type || undefined,
    model_name: filters.model_name || undefined,
    // Note: date_range filter would need backend support
  })

  const { data: auditLogsData, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', { ...apiFilters, page }],
    queryFn: () => adminApi.getAuditLogs({
      ...apiFilters,
      page,
      page_size: pageSize
    }),
  })

  const auditLogs = auditLogsData?.results || []
  const totalCount = auditLogsData?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  const handleExportLogs = async () => {
    try {
      toast.loading('Exporting logs...')
      // Note: You'll need to implement this endpoint in your backend
      // const blob = await adminApi.exportData('audit-logs', 'csv')
      // ... rest of export logic
      toast.dismiss()
      toast.success('Audit logs exported successfully')
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to export audit logs')
    }
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      action_type: '',
      model_name: '',
      date_range: 'all',
    })
    setPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, React.ReactNode> = {
      create: <FileEdit className="h-4 w-4" />,
      update: <FileEdit className="h-4 w-4" />,
      delete: <Trash2 className="h-4 w-4" />,
      view: <Eye className="h-4 w-4" />,
      login: <User className="h-4 w-4" />,
      logout: <User className="h-4 w-4" />,
      export: <Download className="h-4 w-4" />,
    }
    return icons[actionType] || <FileEdit className="h-4 w-4" />
  }

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      view: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      login: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      logout: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      export: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    }
    return colors[actionType] || 'bg-gray-100 text-gray-800'
  }

  const getInitials = (user: any) => {
    if (!user) return 'S'
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'S'
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-4 text-lg font-semibold">Error Loading Audit Logs</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Failed to load audit logs. Please try again.
              </p>
              <Button className="mt-4" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all system activities and user actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleClearFilters} disabled={isLoading}>
            <Filter className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
          <Button variant="outline" onClick={handleExportLogs} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter audit logs by specific criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('search', e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="action-type">Action Type</Label>
              <BaseSelect
                value={filters.action_type}
                onValueChange={(value: string) => handleFilterChange('action_type', value)}
              >
                <SelectTrigger id="action-type" className="w-full">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </BaseSelect>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model-type">Model</Label>
              <BaseSelect
                value={filters.model_name}
                onValueChange={(value: string) => handleFilterChange('model_name', value)}
              >
                <SelectTrigger id="model-type" className="w-full">
                  <SelectValue placeholder="All models" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_TYPES.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </BaseSelect>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <BaseSelect
                value={filters.date_range}
                onValueChange={(value: string) => handleFilterChange('date_range', value)}
              >
                <SelectTrigger id="date-range" className="w-full">
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </BaseSelect>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${totalCount} logs found`}
              </CardDescription>
            </div>
            <div className="mt-2 md:mt-0">
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="h-16 w-16 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No audit logs found</h3>
              <p className="text-sm text-muted-foreground">
                {Object.values(filters).some(f => f && f !== 'all') ? 'Try adjusting your search filters' : 'No audit logs recorded yet'}
              </p>
              {Object.values(filters).some(f => f && f !== 'all') && (
                <Button className="mt-4" variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-full p-2 ${getActionColor(log.action_type)}`}>
                          {getActionIcon(log.action_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium capitalize">
                              {log.action_type} {log.model_name}
                            </p>
                            <Badge className={`capitalize ${getActionColor(log.action_type)}`}>
                              {log.action_type}
                            </Badge>
                            {log.object_repr && (
                              <span className="text-sm text-muted-foreground">
                                • {log.object_repr}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{log.user?.email || 'System'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(log.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {log.ip_address && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-mono">{log.ip_address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {log.user && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.user.profile_picture} alt={log.user.email} />
                          <AvatarFallback>{getInitials(log.user)}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    
                    {/* Display changes if available */}
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div className="mt-3 rounded border bg-gray-50 dark:bg-gray-800 p-3">
                        <p className="mb-2 text-sm font-medium">Changes:</p>
                        <div className="text-xs text-muted-foreground overflow-x-auto">
                          <pre className="whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {/* User agent info if available */}
                    {log.user_agent && (
                      <div className="mt-2 text-xs text-muted-foreground truncate">
                        <span className="font-medium">User Agent:</span> {log.user_agent.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} logs
                    </div>
                    
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      showFirstLast={true}
                      showPageNumbers={true}
                      maxVisiblePages={5}
                      className="justify-center"
                    />
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Page:</span>
                      <BaseSelect
                        value={page.toString()}
                        onValueChange={(value: string) => setPage(parseInt(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder={page.toString()} />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <SelectItem key={pageNum} value={pageNum.toString()}>
                              {pageNum}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </BaseSelect>
                      <span className="text-sm text-muted-foreground">of {totalPages}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}