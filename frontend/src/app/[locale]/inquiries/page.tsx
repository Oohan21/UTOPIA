// app/inquiries/page.tsx
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Checkbox } from "@/components/ui/Checkbox"
import {
  Search,
  Filter,
  Plus,
  Download,
  MoreVertical,
  User,
  Phone,
  Mail,
  Clock,
  Calendar,
  MessageSquare,
  ExternalLink,
  Copy,
  RefreshCw,
  Inbox,
  XCircle,
  CheckCircle,
  AlertCircle,
  Zap,
  Shield,
  Building,
  Tag as TagIcon,
} from 'lucide-react'
import { inquiryApi, type Inquiry, type InquiryFilters } from '@/lib/api/inquiry'
import { formatTimeAgo, formatDateTime } from '@/lib/utils/formatDate'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import toast from 'react-hot-toast'
import { InquiryStats } from '@/components/inquiries/InquiryStats'
import { InquiryTimeline } from '@/components/inquiries/InquiryTimeline'
import { CreateInquiryModal } from '@/components/inquiries/CreateInquiryModal'

interface FilterState {
  status: string[]
  priority: string[]
  inquiry_type: string
  assigned_to: string
  search: string
  date_range: 'today' | 'week' | 'month' | 'all'
  sort_by: 'created_at' | 'priority' | 'status' | 'property__title'
  sort_order: 'asc' | 'desc'
}

export default function InquiriesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedInquiries, setSelectedInquiries] = useState<number[]>([])
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    priority: [],
    inquiry_type: '',
    assigned_to: '',
    search: '',
    date_range: 'all',
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [viewingTime, setViewingTime] = useState('')
  const [viewingAddress, setViewingAddress] = useState('')
  const [activityData, setActivityData] = useState<any[]>([])

  // Build API filters
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
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        apiFilters.created_at__gte = today.toISOString()
        break
      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        apiFilters.created_at__gte = weekAgo.toISOString()
        break
      case 'month':
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        apiFilters.created_at__gte = monthAgo.toISOString()
        break
    }

    // Sorting
    if (filters.sort_by) {
      const orderPrefix = filters.sort_order === 'desc' ? '-' : ''
      apiFilters.ordering = `${orderPrefix}${filters.sort_by}`
    }

    return apiFilters
  }, [filters])

  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ['inquiry-dashboard-stats'],
    queryFn: () => inquiryApi.getDashboardStats(),
    refetchInterval: 30000,
  })

  // Fetch inquiries
  const {
    data: inquiriesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['inquiries', filters],
    queryFn: () => inquiryApi.getInquiries(buildApiFilters()),
  })

  const inquiries = inquiriesData?.results || []
  const totalCount = inquiriesData?.count || 0

  // Fetch activity data when inquiry is selected
  useEffect(() => {
    const fetchActivity = async () => {
      if (selectedInquiry) {
        try {
          const activity = await inquiryApi.getInquiryActivity(selectedInquiry.id)
          setActivityData(activity)
        } catch (error) {
          console.error('Error fetching activity:', error)
        }
      }
    }
    fetchActivity()
  }, [selectedInquiry])

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

  const scheduleViewingMutation = useMutation({
    mutationFn: ({ id, viewing_time, address, notes }: { id: number; viewing_time: string; address?: string; notes?: string }) =>
      inquiryApi.scheduleViewing(id, { viewing_time, address, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      toast.success('Viewing scheduled successfully')
      setIsScheduleDialogOpen(false)
      setViewingTime('')
      setViewingAddress('')
      setNotes('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to schedule viewing')
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

  // Status badge configuration
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
        icon: CheckCircle
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
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      },
      spam: {
        label: 'Spam',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: Shield
      }
    }

    const cfg = config[status as keyof typeof config] || {
      label: status,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
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

  // Priority badge configuration
  const getPriorityBadge = (priority: string) => {
    const config = {
      low: {
        label: 'Low',
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      medium: {
        label: 'Medium',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      high: {
        label: 'High',
        className: 'bg-orange-100 text-orange-800 border-orange-200'
      },
      urgent: {
        label: 'Urgent',
        className: 'bg-red-100 text-red-800 border-red-200'
      }
    }

    const cfg = config[priority as keyof typeof config] || {
      label: priority,
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    return <Badge className={cfg.className}>{cfg.label}</Badge>
  }

  // Contact method badge
  const getContactBadge = (preference: string) => {
    const config = {
      call: { label: 'Call', icon: Phone, className: 'bg-blue-50 text-blue-700 border-blue-200' },
      email: { label: 'Email', icon: Mail, className: 'bg-green-50 text-green-700 border-green-200' },
      whatsapp: { label: 'WhatsApp', icon: MessageSquare, className: 'bg-green-100 text-green-800 border-green-200' },
      any: { label: 'Any', icon: MessageSquare, className: 'bg-gray-50 text-gray-700 border-gray-200' }
    }

    const cfg = config[preference as keyof typeof config] || {
      label: preference,
      icon: MessageSquare,
      className: 'bg-gray-50 text-gray-700 border-gray-200'
    }

    const Icon = cfg.icon

    return (
      <Badge className={`${cfg.className} gap-1.5`} variant="outline">
        {Icon && <Icon className="h-3 w-3" />}
        {cfg.label}
      </Badge>
    )
  }

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

  const handleScheduleViewing = (inquiryId: number) => {
    if (!viewingTime) {
      toast.error('Please select a viewing time')
      return
    }

    scheduleViewingMutation.mutate({
      id: inquiryId,
      viewing_time: viewingTime,
      address: viewingAddress,
      notes
    })
  }

  const handleSelectAll = () => {
    if (selectedInquiries.length === inquiries.length) {
      setSelectedInquiries([])
    } else {
      setSelectedInquiries(inquiries.map(i => i.id))
    }
  }

  const handleSelectInquiry = (inquiryId: number) => {
    setSelectedInquiries(prev =>
      prev.includes(inquiryId)
        ? prev.filter(id => id !== inquiryId)
        : [...prev, inquiryId]
    )
  }

  const handleClearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      inquiry_type: '',
      assigned_to: '',
      search: '',
      date_range: 'all',
      sort_by: 'created_at',
      sort_order: 'desc'
    })
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Inquiry Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage and track all property inquiries
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CreateInquiryModal />
              <Button
                variant="outline"
                onClick={() => exportMutation.mutate()}
                className="gap-2"
                disabled={exportMutation.isPending}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats Cards */}
        {dashboardStats && (
          <div className="mb-8">
            <InquiryStats 
              stats={{
                total: dashboardStats.overview.total,
                new_today: dashboardStats.overview.new_today,
                unassigned: dashboardStats.overview.unassigned,
                urgent: dashboardStats.overview.urgent,
                avg_response_time_hours: dashboardStats.performance.avg_response_time_hours,
                response_rate: dashboardStats.performance.response_rate,
                conversion_rate: dashboardStats.performance.conversion_rate,
              }}
              onFilterChange={handleFilterChange}
            />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Inquiries ({totalCount})</CardTitle>
                    <CardDescription>
                      {selectedInquiries.length > 0 && (
                        <span className="text-primary">
                          {selectedInquiries.length} selected
                        </span>
                      )}
                    </CardDescription>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search inquiries..."
                        className="pl-9"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </div>

                    <Select
                      value={filters.status[0] || ''}
                      onValueChange={(value) => handleFilterChange('status', value ? [value] : [])}
                    >
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="viewing_scheduled">Viewing Scheduled</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.date_range}
                      onValueChange={(value) => handleFilterChange('date_range', value)}
                    >
                      
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleClearFilters}
                      disabled={!filters.search && filters.status.length === 0 && filters.date_range === 'all'}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoading ? (
                  <div className="space-y-3 p-6">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
                    ))}
                  </div>
                ) : inquiries.length === 0 ? (
                  <div className="p-12 text-center">
                    <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h4 className="mt-4 text-lg font-semibold">No inquiries found</h4>
                    <p className="text-muted-foreground">
                      {filters.search || filters.status.length > 0
                        ? "No inquiries match your current filters."
                        : "No inquiries have been submitted yet."}
                    </p>
                    {(filters.search || filters.status.length > 0) && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={handleClearFilters}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y">
                    {inquiries.map((inquiry) => (
                      <div
                        key={inquiry.id}
                        className={`p-6 hover:bg-muted/50 transition-colors cursor-pointer ${
                          selectedInquiry?.id === inquiry.id ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedInquiry(inquiry)}
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={selectedInquiries.includes(inquiry.id)}
                            onCheckedChange={() => handleSelectInquiry(inquiry.id)}
                            onClick={(e) => e.stopPropagation()}
                          />

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-bold text-lg hover:text-primary transition-colors">
                                  {inquiry.property_rel?.title || 'No Property Title'}
                                </h4>
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  {getStatusBadge(inquiry.status)}
                                  {getPriorityBadge(inquiry.priority)}
                                  {inquiry.is_urgent && (
                                    <Badge className="bg-red-100 text-red-800 border-red-200 gap-1.5">
                                      <Zap className="h-3 w-3" />
                                      Urgent
                                    </Badge>
                                  )}
                                  {getContactBadge(inquiry.contact_preference)}
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Add notes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedInquiry(inquiry)
                                    setIsScheduleDialogOpen(true)
                                  }}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Schedule viewing
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => window.open(`/listings/${inquiry.property_rel?.id}`, '_blank')}>
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

                            <div className="mt-4">
                              <p className="text-muted-foreground line-clamp-2">
                                {inquiry.message}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5">
                                  <User className="h-4 w-4" />
                                  <span>{inquiry.user_full_name || inquiry.full_name || 'Anonymous'}</span>
                                </div>
                                {inquiry.email && (
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="h-4 w-4" />
                                    <span>{inquiry.email}</span>
                                  </div>
                                )}
                                {inquiry.phone && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="h-4 w-4" />
                                    <span>{inquiry.phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4" />
                                  <span>{formatTimeAgo(inquiry.created_at)}</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                {inquiry.assigned_to ? (
                                  <Badge variant="outline" className="gap-1.5">
                                    <User className="h-3 w-3" />
                                    {inquiry.assigned_to.first_name} {inquiry.assigned_to.last_name}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    Unassigned
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
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
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Quick Actions */}
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
                          disabled={updateStatusMutation.isPending}
                        >
                          {status.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Property Info */}
                  {selectedInquiry.property_rel && (
                    <div>
                      <h4 className="font-bold text-sm text-muted-foreground mb-2">Property</h4>
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                        <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                          {selectedInquiry.property_rel?.images?.[0]?.image ? (
                            <img
                              src={selectedInquiry.property_rel.images[0].image}
                              alt={selectedInquiry.property_rel.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center">
                              <Building className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold truncate">{selectedInquiry.property_rel?.title}</h5>
                          <p className="text-sm text-muted-foreground truncate">
                            {selectedInquiry.property_rel?.city?.name}, {selectedInquiry.property_rel?.sub_city?.name}
                          </p>
                          <p className="text-sm font-bold mt-1">
                            {selectedInquiry.property_rel?.listing_type === 'for_rent'
                              ? `${formatCurrency(selectedInquiry.property_rel?.monthly_rent || 0)}/month`
                              : formatCurrency(selectedInquiry.property_rel?.price_etb || 0)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/listings/${selectedInquiry.property_rel?.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* User Info */}
                  <div>
                    <h4 className="font-bold text-sm text-muted-foreground mb-2">User Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Name</span>
                        <span className="font-medium">{selectedInquiry.user_full_name || selectedInquiry.full_name || 'Anonymous'}</span>
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
                      {selectedInquiry.tags && selectedInquiry.tags.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Tags</span>
                          <div className="flex gap-1">
                            {selectedInquiry.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="gap-1">
                                <TagIcon className="h-3 w-3" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <h4 className="font-bold text-sm text-muted-foreground mb-2">Message</h4>
                    <div className="p-3 rounded-lg border bg-card">
                      <p className="whitespace-pre-line text-sm">{selectedInquiry.message}</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="font-bold text-sm text-muted-foreground mb-2">Activity Timeline</h4>
                    <InquiryTimeline
                      events={activityData.length > 0 ? activityData : [
                        {
                          id: 1,
                          type: 'status_change',
                          title: `Status updated to ${selectedInquiry.status}`,
                          description: selectedInquiry.response_notes,
                          user: selectedInquiry.assigned_to ? {
                            name: `${selectedInquiry.assigned_to.first_name} ${selectedInquiry.assigned_to.last_name}`,
                            role: 'Agent'
                          } : undefined,
                          timestamp: selectedInquiry.updated_at,
                          metadata: {
                            status: selectedInquiry.status,
                            priority: selectedInquiry.priority
                          }
                        },
                        {
                          id: 2,
                          type: 'note_added',
                          title: 'Inquiry submitted',
                          description: selectedInquiry.message.substring(0, 100) + '...',
                          user: selectedInquiry.user ? {
                            name: selectedInquiry.user_full_name,
                            role: 'User'
                          } : {
                            name: selectedInquiry.full_name || 'Anonymous',
                            role: 'Visitor'
                          },
                          timestamp: selectedInquiry.created_at
                        }
                      ]}
                      className="max-h-60 overflow-y-auto"
                    />
                  </div>

                  {/* Additional Actions */}
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => assignToMeMutation.mutate(selectedInquiry.id)}
                      disabled={assignToMeMutation.isPending}
                    >
                      <User className="mr-2 h-4 w-4" />
                      {assignToMeMutation.isPending ? 'Assigning...' : 'Assign to me'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedInquiry(selectedInquiry)
                        setIsNotesDialogOpen(true)
                      }}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Add notes
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedInquiry(selectedInquiry)
                        setIsScheduleDialogOpen(true)
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule viewing
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
                  <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h4 className="mt-4 text-lg font-semibold">Select an Inquiry</h4>
                  <p className="text-muted-foreground">
                    Click on an inquiry from the list to view details and take action.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

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
                handleStatusUpdate(selectedInquiry.id, selectedInquiry.status)
              }
            }}
            disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Viewing Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Viewing</DialogTitle>
            <DialogDescription>
              Schedule a property viewing for inquiry #{selectedInquiry?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="viewing-time">Viewing Time *</Label>
              <Input
                id="viewing-time"
                type="datetime-local"
                value={viewingTime}
                onChange={(e) => setViewingTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="viewing-address">Address (Optional)</Label>
              <Input
                id="viewing-address"
                placeholder="Enter viewing address"
                value={viewingAddress}
                onChange={(e) => setViewingAddress(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="viewing-notes">Notes (Optional)</Label>
              <Textarea
                id="viewing-notes"
                placeholder="Add any notes about the viewing"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsScheduleDialogOpen(false)
              setViewingTime('')
              setViewingAddress('')
              setNotes('')
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (selectedInquiry) {
                handleScheduleViewing(selectedInquiry.id)
              }
            }}
            disabled={scheduleViewingMutation.isPending}
            >
              {scheduleViewingMutation.isPending ? 'Scheduling...' : 'Schedule Viewing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}