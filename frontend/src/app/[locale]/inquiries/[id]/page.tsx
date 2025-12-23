// app/inquiries/[id]/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select"
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
import { Separator } from "@/components/ui/Separator"
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    Calendar,
    MessageSquare,
    Clock,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    Building,
    MapPin,
    Tag as TagIcon,
    FileText,
    Download,
    Copy,
    Trash2,
    Edit,
    Eye,
    MoreVertical,
    ChevronRight,
    Loader2,
} from 'lucide-react'
import { inquiryApi } from '@/lib/api/inquiry'
import { formatDateTime, formatTimeAgo } from '@/lib/utils/formatDate'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import toast from 'react-hot-toast'
import { InquiryTimeline } from '@/components/inquiries/InquiryTimeline'

export default function InquiryDetailPage() {
    const params = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const inquiryId = parseInt(params.id as string)

    const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
    const [notes, setNotes] = useState('')
    const [viewingTime, setViewingTime] = useState('')
    const [viewingAddress, setViewingAddress] = useState('')
    const [activityData, setActivityData] = useState<any[]>([])

    // Fetch inquiry details
    const {
        data: inquiry,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['inquiry', inquiryId],
        queryFn: () => inquiryApi.getInquiry(inquiryId),
        enabled: !isNaN(inquiryId),
    })

    // Fetch activity data
    useEffect(() => {
        const fetchActivity = async () => {
            if (inquiry) {
                try {
                    const activity = await inquiryApi.getInquiryActivity(inquiryId)
                    setActivityData(activity)
                } catch (error) {
                    console.error('Error fetching activity:', error)
                }
            }
        }
        if (inquiry) {
            fetchActivity()
        }
    }, [inquiry, inquiryId])

    // Mutations
    const updateStatusMutation = useMutation({
        mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
            inquiryApi.updateInquiryStatus(inquiryId, status, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inquiry', inquiryId] })
            queryClient.invalidateQueries({ queryKey: ['inquiries'] })
            queryClient.invalidateQueries({ queryKey: ['inquiry-dashboard-stats'] })
            toast.success('Status updated successfully')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to update status')
        }
    })

    const assignToMeMutation = useMutation({
        mutationFn: () => inquiryApi.assignToMe(inquiryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inquiry', inquiryId] })
            queryClient.invalidateQueries({ queryKey: ['inquiries'] })
            queryClient.invalidateQueries({ queryKey: ['inquiry-dashboard-stats'] })
            toast.success('Inquiry assigned to you')
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Failed to assign inquiry')
        }
    })

    const scheduleViewingMutation = useMutation({
        mutationFn: ({ viewing_time, address, notes }: { viewing_time: string; address?: string; notes?: string }) =>
            inquiryApi.scheduleViewing(inquiryId, { viewing_time, address, notes }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inquiry', inquiryId] })
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
                <div className="container py-8">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center">
                            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                            <p className="mt-4 text-muted-foreground">Loading inquiry details...</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !inquiry) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
                <div className="container py-8">
                    <Card>
                        <CardContent className="p-12 text-center">
                            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                            <h4 className="mt-4 text-lg font-semibold">Inquiry Not Found</h4>
                            <p className="text-muted-foreground">
                                The inquiry you're looking for doesn't exist or you don't have permission to view it.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4 gap-2"
                                onClick={() => router.push('/inquiries')}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Inquiries
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    const handleStatusUpdate = (status: string) => {
        if (notes.trim()) {
            updateStatusMutation.mutate({ status, notes })
            setNotes('')
            setIsNotesDialogOpen(false)
        } else {
            updateStatusMutation.mutate({ status })
        }
    }

    const handleScheduleViewing = () => {
        if (!viewingTime) {
            toast.error('Please select a viewing time')
            return
        }

        scheduleViewingMutation.mutate({
            viewing_time: viewingTime,
            address: viewingAddress,
            notes
        })
    }

    // Format date for datetime-local input
    const formatDateForInput = (dateString?: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toISOString().slice(0, 16)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="container py-8">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/inquiries')}
                    className="mb-6 gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Inquiries
                </Button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <CardTitle className="text-2xl">
                                                {inquiry.property_rel?.title || inquiry.property_title || 'No Property Title'}
                                            </CardTitle>
                                            {getStatusBadge(inquiry.status)}
                                            {getPriorityBadge(inquiry.priority)}
                                            {inquiry.is_urgent && (
                                                <Badge className="bg-red-100 text-red-800 border-red-200 gap-1.5">
                                                    <AlertCircle className="h-3 w-3" />
                                                    Urgent
                                                </Badge>
                                            )}
                                        </div>
                                        <CardDescription>
                                            Inquiry #{inquiry.id} • Created {formatTimeAgo(inquiry.created_at)}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(`/listings/${inquiry.property_rel?.id}`, '_blank')}
                                            disabled={!inquiry.property_rel?.id}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View Property
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                navigator.clipboard.writeText(inquiry.id.toString())
                                                toast.success('Inquiry ID copied to clipboard')
                                            }}
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Copy ID
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Message Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Message</CardTitle>
                                <CardDescription>
                                    Inquiry from {inquiry.user_full_name || inquiry.full_name || 'Anonymous'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 rounded-lg border bg-card">
                                    <p className="whitespace-pre-line text-sm">{inquiry.message}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timeline Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity Timeline</CardTitle>
                                <CardDescription>All activities related to this inquiry</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <InquiryTimeline
                                    events={activityData.length > 0 ? activityData : [
                                        ...(inquiry.responded_at ? [{
                                            id: 1,
                                            type: 'status_change',
                                            title: `Status updated to ${inquiry.status}`,
                                            description: inquiry.response_notes,
                                            user: inquiry.assigned_to ? {
                                                name: `${inquiry.assigned_to.first_name} ${inquiry.assigned_to.last_name}`,
                                                role: 'Agent'
                                            } : undefined,
                                            timestamp: inquiry.responded_at,
                                            metadata: {
                                                status: inquiry.status,
                                                priority: inquiry.priority
                                            }
                                        }] : []),
                                        {
                                            id: 2,
                                            type: 'note_added',
                                            title: 'Inquiry submitted',
                                            description: inquiry.message.substring(0, 100) + '...',
                                            user: inquiry.user ? {
                                                name: inquiry.user_full_name,
                                                role: 'User'
                                            } : {
                                                name: inquiry.full_name || 'Anonymous',
                                                role: 'Visitor'
                                            },
                                            timestamp: inquiry.created_at
                                        }
                                    ]}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Property Card */}
                        {inquiry.property_rel && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Property Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                                                {inquiry.property_rel?.images?.[0]?.image ? (
                                                    <img
                                                        src={inquiry.property_rel.images[0].image}
                                                        alt={inquiry.property_rel.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full bg-muted flex items-center justify-center">
                                                        <Building className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold truncate">{inquiry.property_rel?.title}</h5>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {inquiry.city_name}, {inquiry.sub_city_name}
                                                </p>
                                                <p className="text-sm font-bold mt-1">
                                                    {inquiry.property_rel?.listing_type === 'for_rent'
                                                        ? `${formatCurrency(inquiry.property_rel?.monthly_rent || 0)}/month`
                                                        : formatCurrency(inquiry.property_rel?.price_etb || 0)}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => window.open(`/listings/${inquiry.property_rel?.id}`, '_blank')}
                                            disabled={!inquiry.property_rel?.id}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View Full Details
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Contact Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Name</span>
                                        <span className="font-medium">{inquiry.user_full_name || inquiry.full_name || 'Anonymous'}</span>
                                    </div>
                                    {inquiry.email && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Email</span>
                                            <span className="font-medium">{inquiry.email}</span>
                                        </div>
                                    )}
                                    {inquiry.phone && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Phone</span>
                                            <span className="font-medium">{inquiry.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Contact Preference</span>
                                        {getContactBadge(inquiry.contact_preference)}
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex gap-2">
                                    {inquiry.phone && (
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => window.location.href = `tel:${inquiry.phone}`}
                                        >
                                            <Phone className="h-4 w-4 mr-2" />
                                            Call
                                        </Button>
                                    )}
                                    {inquiry.email && (
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => window.location.href = `mailto:${inquiry.email}`}
                                        >
                                            <Mail className="h-4 w-4 mr-2" />
                                            Email
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {['pending', 'contacted', 'viewing_scheduled', 'closed'].map((status) => (
                                        <Button
                                            key={status}
                                            size="sm"
                                            variant={inquiry.status === status ? "default" : "outline"}
                                            onClick={() => handleStatusUpdate(status)}
                                            className="capitalize"
                                            disabled={updateStatusMutation.isPending}
                                        >
                                            {status.replace('_', ' ')}
                                        </Button>
                                    ))}
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => assignToMeMutation.mutate()}
                                        disabled={assignToMeMutation.isPending}
                                    >
                                        <User className="h-4 w-4 mr-2" />
                                        {assignToMeMutation.isPending ? 'Assigning...' : 'Assign to me'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => setIsNotesDialogOpen(true)}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Add notes
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => setIsScheduleDialogOpen(true)}
                                    >
                                        <Calendar className="h-4 w-4 mr-2" />
                                        Schedule viewing
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Metadata Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Metadata</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Created</span>
                                    <span>{formatDateTime(inquiry.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Last Updated</span>
                                    <span>{formatDateTime(inquiry.updated_at)}</span>
                                </div>
                                {inquiry.responded_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Responded At</span>
                                        <span>{formatDateTime(inquiry.responded_at)}</span>
                                    </div>
                                )}
                                {/* FIX: Check if response_time exists and is a number */}
                                {inquiry.response_time !== null && inquiry.response_time !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Response Time</span>
                                        <span>{typeof inquiry.response_time === 'number' ?
                                            `${inquiry.response_time.toFixed(1)} hours` :
                                            'N/A'}</span>
                                    </div>
                                )}
                                {inquiry.scheduled_viewing && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Scheduled Viewing</span>
                                        <span>{formatDateTime(inquiry.scheduled_viewing)}</span>
                                    </div>
                                )}
                                {inquiry.tags && inquiry.tags.length > 0 && (
                                    <div className="pt-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TagIcon className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-muted-foreground">Tags</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {inquiry.tags.map((tag, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Notes Dialog */}
            <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Notes</DialogTitle>
                        <DialogDescription>
                            Add notes for inquiry #{inquiry.id}
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
                        <Button onClick={() => handleStatusUpdate(inquiry.status)}
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
                            Schedule a property viewing for inquiry #{inquiry.id}
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
                        <Button onClick={handleScheduleViewing}
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