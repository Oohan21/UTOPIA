// src/app/admin/inquiries/page.tsx
'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  MessageSquare, 
  Search, 
  Filter, 
  Download, 
  Mail, 
  Phone, 
  User, 
  Home,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Eye,
  MessageCircle,
  RefreshCw,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Label } from '@/components/ui/Label'
import { Skeleton } from '@/components/ui/Skeleton'
import { Pagination } from '@/components/ui/Pagination'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Textarea } from '@/components/ui/Textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog'

// Status options
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'viewing_scheduled', label: 'Viewing Scheduled' },
  { value: 'follow_up', label: 'Follow Up Required' },
  { value: 'closed', label: 'Closed' },
  { value: 'spam', label: 'Spam' },
]

// Priority options
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

// Inquiry type options
const INQUIRY_TYPES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'viewing', label: 'Viewing Request' },
  { value: 'price', label: 'Price Inquiry' },
  { value: 'details', label: 'More Details' },
]

// Function to clean parameters
const cleanParams = (params: any): any => {
  if (!params) return undefined
  
  const cleaned: any = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === 'undefined') {
      continue
    }
    cleaned[key] = value
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined
}

export default function AdminInquiriesPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    inquiry_type: '',
    assigned_to: '',
  })
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [expandedInquiries, setExpandedInquiries] = useState<Set<number>>(new Set())

  // Clean filters for API call
  const apiFilters = cleanParams({
    search: filters.search || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    inquiry_type: filters.inquiry_type || undefined,
  })

  // Fetch inquiries
  const { 
    data: inquiriesData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['admin-inquiries', { ...apiFilters, page }],
    queryFn: () => adminApi.getInquiriesAdmin({
      ...apiFilters,
      page,
      page_size: pageSize
    }),
  })

  // Update inquiry mutation
  const updateInquiryMutation = useMutation({
    mutationFn: ({ inquiryId, data }: { inquiryId: number; data: any }) => 
      adminApi.updateInquiryAdmin(inquiryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] })
      toast.success('Inquiry updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update inquiry')
    },
  })

  // Send response mutation
  const sendResponseMutation = useMutation({
    mutationFn: ({ inquiryId, response }: { inquiryId: number; response: string }) => {
      // In a real app, this would call an API endpoint
      return Promise.resolve()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] })
      setIsResponseDialogOpen(false)
      setResponseText('')
      toast.success('Response sent successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to send response')
    },
  })

  const inquiries = inquiriesData?.results || []
  const totalCount = inquiriesData?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      priority: '',
      inquiry_type: '',
      assigned_to: '',
    })
    setPage(1)
  }

  // Handle inquiry actions
  const handleViewDetails = (inquiry: any) => {
    setSelectedInquiry(inquiry)
    setIsDetailDialogOpen(true)
  }

  const handleRespond = (inquiry: any) => {
    setSelectedInquiry(inquiry)
    setIsResponseDialogOpen(true)
  }

  const handleStatusChange = (inquiry: any, newStatus: string) => {
    updateInquiryMutation.mutate({
      inquiryId: inquiry.id,
      data: { status: newStatus }
    })
  }

  const handlePriorityChange = (inquiry: any, newPriority: string) => {
    updateInquiryMutation.mutate({
      inquiryId: inquiry.id,
      data: { priority: newPriority }
    })
  }

  const handleAssignToMe = (inquiry: any) => {
    // In a real app, you would get the current user ID
    updateInquiryMutation.mutate({
      inquiryId: inquiry.id,
      data: { assigned_to: 1 } // Replace with actual user ID
    })
  }

  const handleSendResponse = () => {
    if (selectedInquiry && responseText.trim()) {
      sendResponseMutation.mutate({
        inquiryId: selectedInquiry.id,
        response: responseText
      })
    }
  }

  const toggleInquiryExpand = (inquiryId: number) => {
    const newExpanded = new Set(expandedInquiries)
    if (newExpanded.has(inquiryId)) {
      newExpanded.delete(inquiryId)
    } else {
      newExpanded.add(inquiryId)
    }
    setExpandedInquiries(newExpanded)
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      viewing_scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      follow_up: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      spam: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-4 w-4" />,
      contacted: <MessageCircle className="h-4 w-4" />,
      viewing_scheduled: <Calendar className="h-4 w-4" />,
      follow_up: <AlertCircle className="h-4 w-4" />,
      closed: <CheckCircle className="h-4 w-4" />,
      spam: <XCircle className="h-4 w-4" />,
    }
    return icons[status] || <Clock className="h-4 w-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Stats
  const pendingCount = inquiries.filter((i: any) => i.status === 'pending').length
  const contactedCount = inquiries.filter((i: any) => i.status === 'contacted').length
  const highPriorityCount = inquiries.filter((i: any) => i.priority === 'high' || i.priority === 'urgent').length
  const viewingRequests = inquiries.filter((i: any) => i.inquiry_type === 'viewing').length

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-4 text-lg font-semibold">Error Loading Inquiries</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Failed to load inquiry data. Please try again.
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inquiry Management</h1>
          <p className="text-muted-foreground">
            Manage and respond to property inquiries from users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleClearFilters} disabled={isLoading}>
            <Filter className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
          <Button variant="outline" disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inquiries</p>
                <p className="text-3xl font-bold">{totalCount}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">{pendingCount}</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-3xl font-bold">{highPriorityCount}</p>
              </div>
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Viewing Requests</p>
                <p className="text-3xl font-bold">{viewingRequests}</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter inquiries by specific criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Name, email, property..."
                value={filters.search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('search', e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <BaseSelect
                value={filters.status}
                onValueChange={(value: string) => handleFilterChange('status', value)}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </BaseSelect>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <BaseSelect
                value={filters.priority}
                onValueChange={(value: string) => handleFilterChange('priority', value)}
              >
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </BaseSelect>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inquiry-type">Inquiry Type</Label>
              <BaseSelect
                value={filters.inquiry_type}
                onValueChange={(value: string) => handleFilterChange('inquiry_type', value)}
              >
                <SelectTrigger id="inquiry-type" className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  {INQUIRY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </BaseSelect>
            </div>
            
            <div className="flex items-end">
              <Button className="w-full" onClick={() => refetch()}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle>Inquiries</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${totalCount} inquiries found`}
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
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No inquiries found</h3>
              <p className="text-sm text-muted-foreground">
                {Object.values(filters).some(f => f) ? 'Try adjusting your search filters' : 'No inquiries yet'}
              </p>
              {Object.values(filters).some(f => f) && (
                <Button className="mt-4" variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {inquiries.map((inquiry: any) => (
                  <div key={inquiry.id} className="rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge className={getStatusColor(inquiry.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(inquiry.status)}
                                {inquiry.status.replace('_', ' ')}
                              </span>
                            </Badge>
                            <Badge className={getPriorityColor(inquiry.priority)}>
                              {inquiry.priority} Priority
                            </Badge>
                            <Badge variant="outline">
                              {inquiry.inquiry_type.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(inquiry.created_at)}
                            </span>
                          </div>
                          
                          <div className="flex items-start gap-4">
                            <div>
                              <h4 className="font-semibold">{inquiry.property?.title || 'Unknown Property'}</h4>
                              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{inquiry.user?.email || inquiry.email || 'Anonymous'}</span>
                                </div>
                                {inquiry.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{inquiry.phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Home className="h-3 w-3" />
                                  <span className="text-muted-foreground">
                                    {inquiry.property?.city?.name}, {inquiry.property?.sub_city?.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-sm line-clamp-2">{inquiry.message}</p>
                            <button
                              onClick={() => toggleInquiryExpand(inquiry.id)}
                              className="mt-1 text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              {expandedInquiries.has(inquiry.id) ? (
                                <>
                                  Show less <ChevronUp className="h-3 w-3" />
                                </>
                              ) : (
                                <>
                                  Read more <ChevronDown className="h-3 w-3" />
                                </>
                              )}
                            </button>
                          </div>
                          
                          {expandedInquiries.has(inquiry.id) && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <p className="text-sm whitespace-pre-wrap">{inquiry.message}</p>
                              {inquiry.contact_preference && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                  <span className="font-medium">Preferred contact:</span> {inquiry.contact_preference}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewDetails(inquiry)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRespond(inquiry)}>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Respond
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                              {STATUS_OPTIONS.map((status) => (
                                <DropdownMenuItem 
                                  key={status.value}
                                  onClick={() => handleStatusChange(inquiry, status.value)}
                                  className={inquiry.status === status.value ? 'bg-accent' : ''}
                                >
                                  {status.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Change Priority</DropdownMenuLabel>
                              {PRIORITY_OPTIONS.map((priority) => (
                                <DropdownMenuItem 
                                  key={priority.value}
                                  onClick={() => handlePriorityChange(inquiry, priority.value)}
                                  className={inquiry.priority === priority.value ? 'bg-accent' : ''}
                                >
                                  {priority.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleAssignToMe(inquiry)}>
                                <User className="mr-2 h-4 w-4" />
                                Assign to Me
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          {inquiry.assigned_to && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={inquiry.assigned_to.profile_picture} />
                              <AvatarFallback>
                                {inquiry.assigned_to.first_name?.[0]}{inquiry.assigned_to.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} inquiries
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
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Inquiry Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              Detailed information about this inquiry
            </DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedInquiry.status)}>
                    {selectedInquiry.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge className={getPriorityColor(selectedInquiry.priority)}>
                    {selectedInquiry.priority}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Property</Label>
                <p className="font-medium">{selectedInquiry.property?.title || 'Unknown Property'}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedInquiry.property?.city?.name}, {selectedInquiry.property?.sub_city?.name}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Inquiry Type</Label>
                <p>{selectedInquiry.inquiry_type.replace('_', ' ')}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Message</Label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <p className="whitespace-pre-wrap">{selectedInquiry.message}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Contact Information</Label>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Name:</span> {selectedInquiry.user?.first_name} {selectedInquiry.user?.last_name || selectedInquiry.full_name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {selectedInquiry.user?.email || selectedInquiry.email}
                    </p>
                    {selectedInquiry.phone && (
                      <p className="text-sm">
                        <span className="font-medium">Phone:</span> {selectedInquiry.phone}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Contact Preference</Label>
                  <p>{selectedInquiry.contact_preference || 'Any'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Timestamps</Label>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Created:</span> {formatDate(selectedInquiry.created_at)}
                  </p>
                  {selectedInquiry.updated_at && (
                    <p>
                      <span className="font-medium">Last Updated:</span> {formatDate(selectedInquiry.updated_at)}
                    </p>
                  )}
                  {selectedInquiry.responded_at && (
                    <p>
                      <span className="font-medium">Responded:</span> {formatDate(selectedInquiry.responded_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsDetailDialogOpen(false)
              handleRespond(selectedInquiry)
            }}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Respond
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Response</DialogTitle>
            <DialogDescription>
              Respond to {selectedInquiry?.user?.email || selectedInquiry?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="response-text">Your Response</Label>
              <Textarea
                id="response-text"
                placeholder="Type your response here..."
                value={responseText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponseText(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Original Message</Label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{selectedInquiry?.message}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendResponse}
              disabled={!responseText.trim() || sendResponseMutation.isPending}
            >
              {sendResponseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : 'Send Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}