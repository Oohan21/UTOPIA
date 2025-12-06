'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api/dashboard'
import { Search, Filter, Mail, Phone, Clock, Check, X, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils/formatDate'
import toast from 'react-hot-toast'

interface Inquiry {
  id: number
  property: {
    id: number
    title: string
  }
  user: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
  inquiry_type: string
  message: string
  contact_preference: string
  status: string
  priority: string
  assigned_to: {
    id: number
    email: string
  } | null
  created_at: string
}

export default function InquiryManagement() {
  const queryClient = useQueryClient()
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assigned_to: '',
  })

  const { data: inquiries = [], isLoading } = useQuery<Inquiry[]>({
    queryKey: ['inquiries', filters],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        {
          id: 1,
          property: {
            id: 123,
            title: 'Beautiful Villa in Bole'
          },
          user: {
            id: 1,
            email: 'buyer@example.com',
            first_name: 'John',
            last_name: 'Buyer'
          },
          inquiry_type: 'viewing',
          message: 'I would like to schedule a viewing for this property.',
          contact_preference: 'call',
          status: 'pending',
          priority: 'high',
          assigned_to: {
            id: 2,
            email: 'agent@utopia.com'
          },
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          property: {
            id: 456,
            title: 'Apartment in Kazanchis'
          },
          user: {
            id: 3,
            email: 'seller@example.com',
            first_name: 'Jane',
            last_name: 'Seller'
          },
          inquiry_type: 'price',
          message: 'Is the price negotiable?',
          contact_preference: 'email',
          status: 'contacted',
          priority: 'medium',
          assigned_to: null,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      // Implement API call to update status
      console.log('Updating inquiry status:', id, status)
      return { id, status }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      toast.success('Status updated successfully')
    },
    onError: () => {
      toast.error('Failed to update status')
    }
  })

  const assignToMeMutation = useMutation({
    mutationFn: async (inquiryId: number) => {
      // Implement API call to assign to current user
      console.log('Assigning inquiry to me:', inquiryId)
      return inquiryId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      toast.success('Inquiry assigned to you')
    }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'contacted':
        return <Badge className="bg-blue-100 text-blue-800">Contacted</Badge>
      case 'viewing_scheduled':
        return <Badge className="bg-green-100 text-green-800">Viewing Scheduled</Badge>
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Input
              placeholder="Search inquiries..."
              startIcon={<Search className="h-4 w-4" />}
            />
            <Select
              placeholder="Status"
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'viewing_scheduled', label: 'Viewing Scheduled' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
            <Select
              placeholder="Priority"
              value={filters.priority}
              onValueChange={(value) => setFilters({ ...filters, priority: value })}
              options={[
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
            <Button variant="outline" className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Inquiries List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Inquiries ({inquiries.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : inquiries.length === 0 ? (
                <div className="p-6 text-center">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h4 className="mt-4 text-lg font-semibold">No inquiries</h4>
                  <p className="text-muted-foreground">No inquiries found matching your filters.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {inquiries.map((inquiry) => (
                    <div
                      key={inquiry.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        selectedInquiry?.id === inquiry.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedInquiry(inquiry)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{inquiry.property.title}</h4>
                            {getStatusBadge(inquiry.status)}
                            {getPriorityBadge(inquiry.priority)}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            From: {inquiry.user.first_name} {inquiry.user.last_name}
                          </p>
                          <p className="mt-1 text-sm">{inquiry.message.substring(0, 100)}...</p>
                          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDateTime(inquiry.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {inquiry.contact_preference === 'call' ? (
                                <Phone className="h-3 w-3" />
                              ) : (
                                <Mail className="h-3 w-3" />
                              )}
                              <span>Contact via {inquiry.contact_preference}</span>
                            </div>
                          </div>
                        </div>
                        {!inquiry.assigned_to && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              assignToMeMutation.mutate(inquiry.id)
                            }}
                          >
                            Assign to me
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inquiry Details */}
        <div>
          {selectedInquiry ? (
            <Card>
              <CardHeader>
                <CardTitle>Inquiry Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Property</h4>
                  <p className="text-primary">{selectedInquiry.property.title}</p>
                </div>

                <div>
                  <h4 className="font-medium">From</h4>
                  <p>{selectedInquiry.user.first_name} {selectedInquiry.user.last_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedInquiry.user.email}</p>
                </div>

                <div>
                  <h4 className="font-medium">Inquiry Type</h4>
                  <Badge variant="outline" className="capitalize">
                    {selectedInquiry.inquiry_type.replace('_', ' ')}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium">Message</h4>
                  <p className="whitespace-pre-line rounded-lg bg-gray-50 p-3">
                    {selectedInquiry.message}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium">Contact Preference</h4>
                  <div className="flex items-center gap-2">
                    {selectedInquiry.contact_preference === 'call' ? (
                      <Phone className="h-4 w-4" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    <span className="capitalize">{selectedInquiry.contact_preference}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'contacted', 'viewing_scheduled', 'closed'].map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={selectedInquiry.status === status ? 'default' : 'outline'}
                        onClick={() => updateStatusMutation.mutate({ 
                          id: selectedInquiry.id, 
                          status 
                        })}
                      >
                        {status === 'contacted' ? (
                          <Check className="mr-2 h-3 w-3" />
                        ) : status === 'closed' ? (
                          <X className="mr-2 h-3 w-3" />
                        ) : (
                          <AlertCircle className="mr-2 h-3 w-3" />
                        )}
                        {status.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full">Respond to Inquiry</Button>
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
    </div>
  )
}