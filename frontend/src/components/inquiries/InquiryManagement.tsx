'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Filter, Mail, Phone, Clock, Check, X, AlertCircle,
  Calendar, User, Building, Download, Eye, MessageSquare,
  TrendingUp, Users, Shield, Star, Zap, ArrowUpDown,
  MoreVertical, Trash2, Copy, ExternalLink, BarChart3,
  ChevronDown, ChevronUp, FileText, MapPin, Tag, List 
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Separator } from '@/components/ui/Separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { inquiryApi, type Inquiry, type InquiryFilters, type InquiryDashboardStats } from '@/lib/api/inquiry'
import { formatDateTime, formatTimeAgo } from '@/lib/utils/formatDate'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import toast from 'react-hot-toast'

interface FilterState {
  status: string[]
  priority: string[]
  inquiry_type: string
  assigned_to: string
  search: string
  date_range: 'today' | 'week' | 'month' | 'all'
}

export default function InquiryManagement() {
  const queryClient = useQueryClient()
  const [selectedInquiries, setSelectedInquiries] = useState<number[]>([])
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    inquiry_type: '',
    assigned_to: '',
    search: '',
    date_range: 'all'
  })
  const [bulkAction, setBulkAction] = useState<string>('')
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery<InquiryDashboardStats>({
    queryKey: ['inquiry-dashboard-stats'],
    queryFn: () => inquiryApi.getDashboardStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Build API filters from state
  const buildApiFilters = useCallback((): InquiryFilters => {
    const apiFilters: InquiryFilters = {}

    if (filters.status.length > 0) {
      apiFilters.status = filters.status
    }

    if (filters.priority.length > 0) {
      apiFilters.priority = filters.priority[0]
    }

    if (filters.inquiry_type) {
      apiFilters.inquiry_type = filters.inquiry_type
    }

    if (filters.assigned_to) {
      if (filters.assigned_to === 'unassigned') {
        apiFilters.assigned_to = 'unassigned'
      } else {
        apiFilters.assigned_to = parseInt(filters.assigned_to)
      }
    }

    if (filters.search) {
      apiFilters.search = filters.search
    }

    // Date range filter
    const now = new Date()
    switch (filters.date_range) {
      case 'today':
        apiFilters.created_at__gte = now.toISOString().split('T')[0]
        break
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7))
        apiFilters.created_at__gte = weekAgo.toISOString().split('T')[0]
        break
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
        apiFilters.created_at__gte = monthAgo.toISOString().split('T')[0]
        break
    }

    return apiFilters
  }, [filters])

  // Fetch inquiries
  const {
    data: inquiriesData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['inquiries', buildApiFilters()],
    queryFn: () => inquiryApi.getInquiries(buildApiFilters()),
  })

  const inquiries = inquiriesData?.results || []

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      inquiryApi.updateInquiryStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      queryClient.invalidateQueries({ queryKey: ['inquiry-dashboard-stats'] })
      toast.success('Status updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update status')
    }
  })

  const assignToMeMutation = useMutation({
    mutationFn: (inquiryId: number) => inquiryApi.assignToMe(inquiryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      queryClient.invalidateQueries({ queryKey: ['inquiry-dashboard-stats'] })
      toast.success('Inquiry assigned to you')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign inquiry')
    }
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, data }: { ids: number[]; data: any }) =>
      inquiryApi.bulkUpdate(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      queryClient.invalidateQueries({ queryKey: ['inquiry-dashboard-stats'] })
      setSelectedInquiries([])
      setIsBulkDialogOpen(false)
      toast.success(`Updated ${selectedInquiries.length} inquiries`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update inquiries')
    }
  })

  const exportMutation = useMutation({
    mutationFn: () => inquiryApi.exportInquiries(buildApiFilters()),
    onSuccess: () => {
      toast.success('Export started successfully')
    },
    onError: () => {
      toast.error('Failed to export inquiries')
    }
  })

  // Handlers
  const handleStatusUpdate = (inquiryId: number, status: string) => {
    if (notes.trim()) {
      updateStatusMutation.mutate({ id: inquiryId, status, notes })
      setNotes('')
      setIsNotesDialogOpen(false)
    } else {
      updateStatusMutation.mutate({ id: inquiryId, status })
    }
  }

  const handleBulkAction = () => {
    if (!bulkAction || selectedInquiries.length === 0) return

    let data: any = {}

    switch (bulkAction) {
      case 'assign_to_me':
        // Handle individual assignments
        selectedInquiries.forEach(id => {
          assignToMeMutation.mutate(id)
        })
        return
      case 'update_status':
        data.status = 'contacted'
        break
      case 'add_tag':
        data.tags = ['bulk_processed']
        break
      case 'delete':
        // Handle individual deletions
        selectedInquiries.forEach(id => {
          // Would call delete mutation here
        })
        toast.success(`Marked ${selectedInquiries.length} inquiries for deletion`)
        return
    }

    bulkUpdateMutation.mutate({ ids: selectedInquiries, data })
  }

  const handleSelectInquiry = (inquiryId: number) => {
    setSelectedInquiries(prev =>
      prev.includes(inquiryId)
        ? prev.filter(id => id !== inquiryId)
        : [...prev, inquiryId]
    )
  }

  const handleSelectAll = () => {
    if (selectedInquiries.length === inquiries.length) {
      setSelectedInquiries([])
    } else {
      setSelectedInquiries(inquiries.map(i => i.id))
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pending: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock
      },
      contacted: {
        label: 'Contacted',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Check
      },
      viewing_scheduled: {
        label: 'Viewing Scheduled',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Calendar
      },
      follow_up: {
        label: 'Follow Up',
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: AlertCircle
      },
      closed: {
        label: 'Closed',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: X
      },
      spam: {
        label: 'Spam',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: Shield
      }
    }

    const cfg = config[status as keyof typeof config] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
      icon: AlertCircle
    }

    const Icon = cfg.icon

    return (
      <Badge className={`${cfg.className} gap-1.5 px-3 py-1.5`}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const config = {
      low: { label: 'Low', className: 'bg-green-100 text-green-800 border-green-200' },
      medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      high: { label: 'High', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800 border-red-200' }
    }

    const cfg = config[priority as keyof typeof config] || {
      label: priority,
      className: 'bg-gray-100 text-gray-800'
    }

    return <Badge className={cfg.className}>{cfg.label}</Badge>
  }

  const getContactBadge = (preference: string) => {
    const config = {
      call: { label: 'Call', icon: Phone, className: 'bg-blue-50 text-blue-700' },
      email: { label: 'Email', icon: Mail, className: 'bg-green-50 text-green-700' },
      whatsapp: { label: 'WhatsApp', icon: MessageSquare, className: 'bg-green-100 text-green-800' },
      any: { label: 'Any', icon: MessageSquare, className: 'bg-gray-50 text-gray-700' }
    }

    const cfg = config[preference as keyof typeof config] || {
      label: preference,
      icon: MessageSquare,
      className: 'bg-gray-50 text-gray-700'
    }

    const Icon = cfg.icon

    return (
      <Badge className={`${cfg.className} gap-1.5`} variant="outline">
        {Icon && <Icon className="h-3 w-3" />}
        {cfg.label}
      </Badge>
    )
  }

  // Render inquiry card for list view
  const renderInquiryCard = (inquiry: Inquiry) => {
    const isSelected = selectedInquiries.includes(inquiry.id)
    const isUrgent = inquiry.is_urgent

    return (
      <Card
        className={`transition-all hover:shadow-lg border-2 ${isSelected ? 'border-primary bg-primary/5' : ''} ${isUrgent ? 'border-l-4 border-l-red-500' : ''}`}
      >
        <CardContent className="p-0">
          <div className="flex items-start p-6">
            {/* Selection Checkbox */}
            <div className="mr-4 mt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => handleSelectInquiry(inquiry.id)}
              />
            </div>

            {/* Main Content */}
            <div
              className="flex-1 cursor-pointer"
              onClick={() => setSelectedInquiry(inquiry)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="font-bold text-lg hover:text-primary transition-colors">
                      {inquiry.property.title}
                    </h4>
                    {getStatusBadge(inquiry.status)}
                    {getPriorityBadge(inquiry.priority)}
                    {inquiry.is_urgent && (
                      <Badge className="bg-red-100 text-red-800 border-red-200 gap-1.5">
                        <Zap className="h-3 w-3" />
                        Urgent
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      <span>{inquiry.user_full_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building className="h-4 w-4" />
                      <span>{inquiry.property.city.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getContactBadge(inquiry.contact_preference)}
                    </div>
                    {inquiry.assigned_to && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>Assigned to {inquiry.assigned_to.first_name}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-muted-foreground line-clamp-2 mb-4">
                    {inquiry.message}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => assignToMeMutation.mutate(inquiry.id)}>
                      <User className="mr-2 h-4 w-4" />
                      Assign to me
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedInquiry(inquiry)
                      setIsNotesDialogOpen(true)
                    }}>
                      <FileText className="mr-2 h-4 w-4" />
                      Add notes
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.open(`/listings/${inquiry.property.id}`, '_blank')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View property
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(inquiry.id.toString())}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy ID
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimeAgo(inquiry.created_at)}</span>
                  </div>
                  {inquiry.response_time && (
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-4 w-4" />
                      <span>Response: {inquiry.response_time.toFixed(1)}h</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {['pending', 'contacted', 'viewing_scheduled'].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={inquiry.status === status ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStatusUpdate(inquiry.id, status)
                      }}
                      className="capitalize"
                    >
                      {status.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render kanban column
  const renderKanbanColumn = (status: string, inquiries: Inquiry[]) => {
    const statusConfig = {
      pending: { title: 'Pending', color: 'bg-yellow-500' },
      contacted: { title: 'Contacted', color: 'bg-blue-500' },
      viewing_scheduled: { title: 'Viewing Scheduled', color: 'bg-purple-500' },
      follow_up: { title: 'Follow Up', color: 'bg-orange-500' },
      closed: { title: 'Closed', color: 'bg-gray-500' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { title: status, color: 'bg-gray-500' }

    return (
      <div className="flex-1 min-w-[300px]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${config.color}`} />
            <h3 className="font-bold">{config.title}</h3>
            <Badge className="ml-2">{inquiries.length}</Badge>
          </div>
        </div>

        <div className="space-y-4">
          {inquiries.map(inquiry => (
            <Card
              key={inquiry.id}
              className="cursor-move hover:shadow-md transition-shadow"
              onClick={() => setSelectedInquiry(inquiry)}
            >
              <CardContent className="p-4">
                <div className="mb-3">
                  <h4 className="font-bold text-sm line-clamp-2 mb-2">
                    {inquiry.property.title}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    {getPriorityBadge(inquiry.priority)}
                    {getContactBadge(inquiry.contact_preference)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">{inquiry.user_full_name}</span>
                  </div>
                  <span>{formatTimeAgo(inquiry.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Inquiries</p>
                  <p className="text-3xl font-bold mt-2">{dashboardStats.overview.total}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-600">{dashboardStats.overview.new_today} new today</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unassigned</p>
                  <p className="text-3xl font-bold mt-2">{dashboardStats.overview.unassigned}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={dashboardStats.overview.unassigned / dashboardStats.overview.total * 100} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                  <p className="text-3xl font-bold mt-2">{dashboardStats.performance.avg_response_time_hours.toFixed(1)}h</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Response rate: {dashboardStats.performance.response_rate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                  <p className="text-3xl font-bold mt-2">{dashboardStats.overview.urgent}</p>
                </div>
                <div className="p-3 rounded-full bg-red-100">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setFilters(prev => ({ ...prev, status: ['pending'] }))}
                >
                  View Urgent
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search inquiries, properties, users..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                startIcon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status[0] || ''}
              onValueChange={(value) => setFilters({ ...filters, status: value ? [value] : [] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="viewing_scheduled">Viewing Scheduled</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Select
              value={filters.date_range}
              onValueChange={(value) => setFilters({ ...filters, date_range: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
              className="gap-2"
            >
              {viewMode === 'list' ? (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Kanban
                </>
              ) : (
                <>
                  <List className="h-4 w-4" />
                  List
                </>
              )}
            </Button>

            {/* Export */}
            <Button
              variant="outline"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedInquiries.length > 0 && (
            <div className="mt-4 flex items-center gap-4 p-4 bg-primary/5 rounded-lg border">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedInquiries.length === inquiries.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="font-medium">{selectedInquiries.length} selected</span>
              </div>

              <Select
                value={bulkAction}
                onValueChange={setBulkAction}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Bulk actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assign_to_me">Assign to me</SelectItem>
                  <SelectItem value="update_status">Mark as contacted</SelectItem>
                  <SelectItem value="add_tag">Add tag</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="default"
                onClick={() => setIsBulkDialogOpen(true)}
                disabled={!bulkAction}
              >
                Apply
              </Button>

              <Button
                variant="ghost"
                onClick={() => setSelectedInquiries([])}
              >
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inquiries List */}
      {viewMode === 'list' ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Inquiries List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Inquiries ({inquiries.length})</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                  >
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="space-y-3 p-6">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
                    ))}
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="p-12 text-center">
                    <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h4 className="mt-4 text-lg font-semibold">No inquiries found</h4>
                    <p className="text-muted-foreground">No inquiries match your current filters.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setFilters({
                        status: [],
                        priority: [],
                        inquiry_type: '',
                        assigned_to: '',
                        search: '',
                        date_range: 'all'
                      })}
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {inquiries.map((inquiry) => renderInquiryCard(inquiry))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Inquiry Details Sidebar */}
          <div>
            {selectedInquiry ? (
              <Card className="sticky top-6">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Inquiry Details</CardTitle>
                      <CardDescription>ID: {selectedInquiry.id}</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedInquiry(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Property Info */}
                  <div>
                    <h4 className="font-bold text-sm text-muted-foreground mb-2">Property</h4>
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                        {selectedInquiry.property.images?.[0]?.image ? (
                          <img
                            src={selectedInquiry.property.images[0].image}
                            alt={selectedInquiry.property.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center">
                            <Building className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold truncate">{selectedInquiry.property.title}</h5>
                        <p className="text-sm text-muted-foreground truncate">
                          {selectedInquiry.property.city.name}, {selectedInquiry.property.sub_city.name}
                        </p>
                        <p className="text-sm font-bold mt-1">
                          {selectedInquiry.property.listing_type === 'for_rent'
                            ? `${formatCurrency(selectedInquiry.property.monthly_rent || 0)}/month`
                            : formatCurrency(selectedInquiry.property.price_etb || 0)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/listings/${selectedInquiry.property.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* User Info */}
                  <div>
                    <h4 className="font-bold text-sm text-muted-foreground mb-2">User Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Name</span>
                        <span className="font-medium">{selectedInquiry.user_full_name}</span>
                      </div>
                      {selectedInquiry.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Email</span>
                          <span className="font-medium">{selectedInquiry.email}</span>
                        </div>
                      )}
                      {selectedInquiry.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Phone</span>
                          <span className="font-medium">{selectedInquiry.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Contact Preference</span>
                        {getContactBadge(selectedInquiry.contact_preference)}
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <h4 className="font-bold text-sm text-muted-foreground mb-2">Message</h4>
                    <div className="p-3 rounded-lg border bg-card">
                      <p className="whitespace-pre-line text-sm">{selectedInquiry.message}</p>
                    </div>
                  </div>

                  {/* Status Management */}
                  <div>
                    <h4 className="font-bold text-sm text-muted-foreground mb-2">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['pending', 'contacted', 'viewing_scheduled', 'closed'].map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={selectedInquiry.status === status ? "default" : "outline"}
                          onClick={() => handleStatusUpdate(selectedInquiry.id, status)}
                          className="capitalize"
                        >
                          {status.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Additional Actions */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => assignToMeMutation.mutate(selectedInquiry.id)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Assign to me
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedInquiry(selectedInquiry)
                        setIsNotesDialogOpen(true)
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Add notes
                    </Button>
                    {selectedInquiry.contact_preference === 'call' && selectedInquiry.phone && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.location.href = `tel:${selectedInquiry.phone}`}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Call now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h4 className="mt-4 text-lg font-semibold">Select an Inquiry</h4>
                  <p className="text-muted-foreground">
                    Click on an inquiry from the list to view details and take action.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="flex gap-6 overflow-x-auto pb-4">
          {['pending', 'contacted', 'viewing_scheduled', 'follow_up', 'closed'].map((status) => (
            renderKanbanColumn(
              status,
              inquiries.filter(i => i.status === status)
            )
          ))}
        </div>
      )}

      {/* Bulk Action Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Bulk Action</DialogTitle>
            <DialogDescription>
              This action will affect {selectedInquiries.length} inquiries.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to {bulkAction?.replace('_', ' ')} these inquiries?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAction}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notes</DialogTitle>
            <DialogDescription>
              Add notes for inquiry #{selectedInquiry?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter your notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsNotesDialogOpen(false)
              setNotes('')
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (selectedInquiry) {
                updateStatusMutation.mutate({
                  id: selectedInquiry.id,
                  status: selectedInquiry.status,
                  notes
                })
              }
            }}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add missing List icon component
const List = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)