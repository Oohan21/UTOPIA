'use client'

import React, { useState } from 'react';
import { NormalizedInquiry as Inquiry } from '@/lib/types/inquiry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import {
    Calendar,
    Clock,
    Mail,
    Phone,
    User,
    MessageSquare,
    AlertCircle,
    CheckCircle,
    Edit,
    Save,
    X,
    MapPin,
    Tag,
    ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface InquiryDetailsProps {
    inquiry: Inquiry;
    onUpdate: (id: string, data: any) => Promise<void>;
    onAssign: (id: string) => Promise<void>;
    onContact: (id: string, notes?: string) => Promise<void>;
    onSchedule: (id: string, data: any) => Promise<void>;
    onClose: (id: string, notes?: string) => Promise<void>;
    isAdmin?: boolean;
    loading?: boolean;
}

export const InquiryDetails: React.FC<InquiryDetailsProps> = ({
    inquiry,
    onUpdate,
    onAssign,
    onContact,
    onSchedule,
    onClose,
    isAdmin = false,
    loading = false,
}) => {
    const t = useTranslations('inquiries');
    const [isEditing, setIsEditing] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [responseNotes, setResponseNotes] = useState('');
    const [viewingData, setViewingData] = useState({
        viewing_time: '',
        address: '',
        notes: '',
    });
    const [showScheduleForm, setShowScheduleForm] = useState(false);

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        viewing_scheduled: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        follow_up: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        spam: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    const priorityColors = {
        low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    const handleFieldEdit = (field: string, value: any) => {
        setEditingField(field);
        setEditValue(value);
    };

    const handleSaveEdit = async () => {
        if (editingField && editValue !== undefined) {
            await onUpdate(inquiry.id, { [editingField]: editValue });
            setEditingField(null);
            setEditValue('');
        }
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        setEditValue('');
    };

    const handleMarkContacted = async () => {
        await onContact(inquiry.id, responseNotes);
        setResponseNotes('');
    };

    const handleScheduleViewing = async () => {
        await onSchedule(inquiry.id, viewingData);
        setShowScheduleForm(false);
        setViewingData({ viewing_time: '', address: '', notes: '' });
    };

    const handleCloseInquiry = async () => {
        await onClose(inquiry.id, responseNotes);
        setResponseNotes('');
    };

    const renderEditableField = (
        field: string,
        label: string,
        value: any,
        type: 'text' | 'select' | 'textarea' = 'text',
        options?: Array<{ value: string; label: string }>
    ) => {
        if (editingField === field) {
            return (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    {type === 'select' && options ? (
                        <Select
                            value={editValue}
                            onValueChange={setEditValue}
                        >
                            <SelectTrigger className="flex-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white">
                                <SelectValue placeholder="Select value" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                                {options.map(option => (
                                    <SelectItem 
                                        key={option.value} 
                                        value={option.value}
                                        className="dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : type === 'textarea' ? (
                        <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
                            rows={3}
                        />
                    ) : (
                        <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
                        />
                    )}
                    <div className="flex gap-2 self-end sm:self-center">
                        <Button size="sm" onClick={handleSaveEdit}>
                            <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}
                            className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-between group">
                <span className="dark:text-gray-300">{value || t('notSet')}</span>
                {isAdmin && !inquiry.response_sent && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        onClick={() => handleFieldEdit(field, value)}
                    >
                        <Edit className="w-3 h-3" />
                    </Button>
                )}
            </div>
        );
    };

    const property = inquiry.property || (inquiry as any).property_info;
    const propertyId = property?.id;
    const propertyTitle = property?.title || t('unknownProperty');

    const getPropertyUrl = () => {
        if (!propertyId) return '#';
        return `/listings/${propertyId}`;
    };

    const propertyUrl = getPropertyUrl();

    return (
        <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        {t('inquiryNumber', { id: inquiry.id.slice(0, 8) })}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {t('about')}: <Link href={propertyUrl} className="text-blue-600 dark:text-blue-400 hover:underline">
                            {propertyTitle}
                        </Link>
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {isAdmin && !inquiry.assigned_to_info && (
                        <Button
                            onClick={() => onAssign(inquiry.id)}
                            disabled={loading}
                            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            {t('assignToMe')}
                        </Button>
                    )}

                    {isAdmin && inquiry.status === 'pending' && (
                        <Button
                            variant="default"
                            onClick={handleMarkContacted}
                            disabled={loading}
                        >
                            {t('markAsContacted')}
                        </Button>
                    )}

                    {isAdmin && !inquiry.scheduled_viewing && inquiry.status !== 'closed' && (
                        <Button
                            variant="outline"
                            onClick={() => setShowScheduleForm(!showScheduleForm)}
                            className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {t('scheduleViewing')}
                        </Button>
                    )}

                    {isAdmin && inquiry.status !== 'closed' && (
                        <Button
                            variant="destructive"
                            onClick={handleCloseInquiry}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                        >
                            {t('closeInquiry')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Alert for urgent inquiries */}
            {inquiry.is_urgent && (
                <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                        {t('urgentAttention')}
                    </AlertDescription>
                </Alert>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Inquiry Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status and Priority Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium dark:text-gray-300">
                                    {t('status')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge className={cn(
                                    statusColors[inquiry.status],
                                    "text-lg px-4 py-2"
                                )}>
                                    {inquiry.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                                {isAdmin && renderEditableField('status', 'Status', inquiry.status, 'select', [
                                    { value: 'pending', label: t('pending') },
                                    { value: 'contacted', label: t('contacted') },
                                    { value: 'viewing_scheduled', label: t('viewing_scheduled') },
                                    { value: 'follow_up', label: t('follow_up') },
                                    { value: 'closed', label: t('closed') },
                                    { value: 'spam', label: t('spam') },
                                ])}
                            </CardContent>
                        </Card>

                        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium dark:text-gray-300">
                                    {t('priority')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Badge className={cn(
                                    priorityColors[inquiry.priority],
                                    "text-lg px-4 py-2"
                                )}>
                                    {inquiry.priority.toUpperCase()}
                                </Badge>
                                {isAdmin && renderEditableField('priority', 'Priority', inquiry.priority, 'select', [
                                    { value: 'low', label: t('low') },
                                    { value: 'medium', label: t('medium') },
                                    { value: 'high', label: t('high') },
                                    { value: 'urgent', label: t('urgent') },
                                ])}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Message Card */}
                    <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 dark:text-white">
                                <MessageSquare className="w-5 h-5" />
                                {t('inquiryMessage')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                                <p className="whitespace-pre-wrap dark:text-gray-300">{inquiry.message}</p>
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium dark:text-gray-300">{t('inquiryType')}:</span>
                                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600 dark:text-gray-300">
                                        {inquiry.inquiry_type.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium dark:text-gray-300">{t('contactPreference')}:</span>
                                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600 dark:text-gray-300">
                                        {inquiry.contact_preference}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium dark:text-gray-300">{t('source')}:</span>
                                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600 dark:text-gray-300">
                                        {inquiry.source}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Response Notes */}
                    {(inquiry.response_notes || isAdmin) && (
                        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="dark:text-white">{t('responseNotes')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isAdmin ? (
                                    renderEditableField('response_notes', t('responseNotes'), inquiry.response_notes, 'textarea')
                                ) : (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                        <p className="whitespace-pre-wrap dark:text-gray-300">{inquiry.response_notes}</p>
                                        {inquiry.responded_at && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                {t('respondedAt')}: {format(new Date(inquiry.responded_at), 'PPP p')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Schedule Viewing Form */}
                    {showScheduleForm && (
                        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="dark:text-white">{t('scheduleViewing')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('viewingDate')}
                                        </label>
                                        <Input
                                            type="datetime-local"
                                            value={viewingData.viewing_time}
                                            onChange={(e) => setViewingData(prev => ({ ...prev, viewing_time: e.target.value }))}
                                            className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('viewingAddress')}
                                        </label>
                                        <Input
                                            value={viewingData.address}
                                            onChange={(e) => setViewingData(prev => ({ ...prev, address: e.target.value }))}
                                            placeholder="Meeting point or exact address"
                                            className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('additionalNotes')}
                                        </label>
                                        <Textarea
                                            value={viewingData.notes}
                                            onChange={(e) => setViewingData(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="Any special instructions..."
                                            rows={3}
                                            className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button onClick={handleScheduleViewing}>
                                            {t('scheduleViewingButton')}
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            onClick={() => setShowScheduleForm(false)}
                                            className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            {t('cancelSchedule')}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Scheduled Viewing Info */}
                    {inquiry.scheduled_viewing && (
                        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 dark:text-white">
                                    <Calendar className="w-5 h-5" />
                                    {t('scheduledViewing')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        <span className="font-medium dark:text-gray-300">{t('viewingDate')}:</span>
                                        <span className="dark:text-gray-300">{format(new Date(inquiry.scheduled_viewing), 'PPP p')}</span>
                                    </div>
                                    {inquiry.viewing_address && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                            <span className="font-medium dark:text-gray-300">{t('viewingAddress')}:</span>
                                            <span className="dark:text-gray-300">{inquiry.viewing_address}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Meta Information */}
                <div className="space-y-6">
                    {/* User Information */}
                    <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium dark:text-gray-300">
                                {t('contactInformation')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <div>
                                    <p className="font-medium dark:text-white">
                                        {inquiry.user?.first_name || inquiry.full_name || 'Anonymous'}
                                    </p>
                                    {inquiry.user && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {t('registeredUser')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {inquiry.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    <span className="dark:text-gray-300 break-all">{inquiry.email}</span>
                                </div>
                            )}

                            {inquiry.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    <span className="dark:text-gray-300">{inquiry.phone}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Property Information */}
                    <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium dark:text-gray-300">
                                {t('propertyDetails')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {propertyId ? (
                                <div className="block p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <p className="font-medium mb-1 dark:text-white break-words">{propertyTitle}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {property?.listing_type === 'for_sale' ? t('forSale') : t('forRent')}
                                    </p>
                                    <p className="text-lg font-bold mt-2 dark:text-white">
                                        {property?.listing_type === 'for_sale'
                                            ? `${property?.price_etb?.toLocaleString() || 0} ETB`
                                            : `${property?.monthly_rent?.toLocaleString() || 0} ETB/month`
                                        }
                                    </p>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="mt-2 w-full border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" 
                                        asChild
                                    >
                                        <Link href={propertyUrl}>
                                            <ExternalLink className="w-3 h-3 mr-2" />
                                            {t('viewProperty')}
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <p className="font-medium mb-1 dark:text-white">{propertyTitle}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {t('noPropertyDetails')}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timestamps */}
                    <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium dark:text-gray-300">
                                {t('timestamps')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{t('created')}:</span>
                                <span className="text-sm font-medium dark:text-gray-300">
                                    {format(new Date(inquiry.created_at), 'PPpp')}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{t('updated')}:</span>
                                <span className="text-sm font-medium dark:text-gray-300">
                                    {format(new Date(inquiry.updated_at), 'PPpp')}
                                </span>
                            </div>
                            {inquiry.responded_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('respondedAt')}:</span>
                                    <span className="text-sm font-medium dark:text-gray-300">
                                        {format(new Date(inquiry.responded_at), 'PPpp')}
                                    </span>
                                </div>
                            )}
                            {inquiry.response_time && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('responseTime')}:</span>
                                    <Badge variant="outline" className="border-gray-300 dark:border-gray-600 dark:text-gray-300">
                                        {inquiry.response_time.toFixed(1)} hours
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Assignment */}
                    {isAdmin && (
                        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium dark:text-gray-300">
                                    {t('assignment')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {inquiry.assigned_to_info ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 dark:text-gray-400" />
                                            <div>
                                                <p className="font-medium dark:text-white">
                                                    {inquiry.assigned_to_info.first_name} {inquiry.assigned_to_info.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {inquiry.assigned_to_info.email}
                                                </p>
                                            </div>
                                        </div>
                                        {inquiry.response_by_info && inquiry.response_by_info.id !== inquiry.assigned_to_info.id && (
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {t('lastResponseBy')}: {inquiry.response_by_info.first_name}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Alert>
                                        <AlertDescription>
                                            {t('notAssigned')}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Tags */}
                    {inquiry.tags.length > 0 && (
                        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium flex items-center gap-2 dark:text-gray-300">
                                    <Tag className="w-4 h-4" />
                                    {t('tags')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-1">
                                    {inquiry.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Internal Notes (Admin Only) */}
                    {isAdmin && inquiry.internal_notes && (
                        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium dark:text-gray-300">
                                    {t('internalNotes')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900">
                                    <p className="text-sm whitespace-pre-wrap dark:text-gray-300">
                                        {inquiry.internal_notes}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Response Notes Input */}
            {isAdmin && (inquiry.status === 'pending' || inquiry.status === 'follow_up') && (
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="dark:text-white">{t('addResponseNotes')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <Textarea
                                value={responseNotes}
                                onChange={(e) => setResponseNotes(e.target.value)}
                                placeholder={t('addResponseNotesPlaceholder')}
                                rows={3}
                                className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 dark:text-white"
                            />
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    onClick={handleMarkContacted}
                                    disabled={!responseNotes.trim() || loading}
                                >
                                    {t('saveNotesMarkContacted')}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setResponseNotes('')}
                                    className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {t('clear')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};