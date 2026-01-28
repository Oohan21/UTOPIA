// src/app/admin/approval/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Eye,
    Clock,
    AlertCircle,
    RefreshCw,
    Download,
    Building2,
    MoreVertical,
    FileText,
    User,
    MapPin,
    DollarSign,
    Bed,
    Bath,
    Maximize2,
    Calendar,
    Mail,
    Phone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Textarea } from '@/components/ui/Textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { adminApi } from '@/lib/api/admin';
import { Property } from '@/lib/types/property';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ApprovalStats {
    pending: number;
    approved: number;
    rejected: number;
    changes_requested: number;
    total: number;
}

interface ApprovalHistoryItem {
    id: number;
    action: string;
    notes: string;
    admin: {
        id: number;
        name: string;
        email: string;
    };
    timestamp: string;
}

// Use environment variable or default to relative path
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const PropertyApprovalPage = () => {
    const t = useTranslations('admin.approval');
    const router = useRouter();
    const notificationStore = useNotificationStore();

    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryItem[]>([]);
    const [approvalDialog, setApprovalDialog] = useState<{
        open: boolean;
        property: Property | null;
        action: 'approve' | 'reject' | 'request_changes' | null;
        notes: string;
    }>({
        open: false,
        property: null,
        action: null,
        notes: '',
    });
    const [stats, setStats] = useState<ApprovalStats>({
        pending: 0,
        approved: 0,
        rejected: 0,
        changes_requested: 0,
        total: 0,
    });
    const [filters, setFilters] = useState({
        propertyType: '',
        listingType: '',
        city: '',
        dateRange: 'all',
    });
    const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
    const [bulkActionDialog, setBulkActionDialog] = useState(false);
    const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve');
    const [bulkNotes, setBulkNotes] = useState('');
    const [showDetails, setShowDetails] = useState(false);
    const [sendNotification, setSendNotification] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

    // Fix: Properly format image URLs
    const getImageUrl = (imagePath: string | undefined) => {
        if (!imagePath) return null;

        // If it's already a full URL, return it
        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        // If no API base URL is set (relative path), just return the path
        if (!API_BASE_URL) {
            return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        }

        // If it starts with /media/, prepend the API base URL
        if (imagePath.startsWith('/media/') || imagePath.startsWith('media/')) {
            const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
            return `${API_BASE_URL}${cleanPath}`;
        }

        // Otherwise, assume it's a relative path from the API
        return `${API_BASE_URL}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
    };

    const fetchPendingProperties = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminApi.getPendingProperties();
            console.log('Fetched properties:', data);

            // The adminApi.getPendingProperties() returns a PaginatedResponse<Property>
            let propertiesList: Property[] = data.results || [];

            // Fix: Ensure image URLs are properly formatted
            propertiesList = propertiesList.map(property => ({
                ...property,
                images: property.images?.map(img => ({
                    ...img,
                    image: getImageUrl(img.image) || img.image
                })) || []
            }));

            setProperties(propertiesList);

            // Update stats from backend if provided, otherwise fallback to local calculation
            if (data.stats) {
                setStats(data.stats);
            } else {
                const pending = propertiesList.length;
                setStats({
                    pending,
                    approved: 0,
                    rejected: 0,
                    changes_requested: 0,
                    total: pending,
                });
            }

        } catch (err: any) {
            console.error('Error loading properties:', err);
            toast.error(t('errors.loadFailed'));
            setProperties([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingProperties();

        // Fix: Clear any existing interval before setting new one
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }

        // Only refresh every 30 seconds when tab is active
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchPendingProperties();
            }
        }, 30000);

        setRefreshInterval(interval);

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [fetchPendingProperties]);

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, {
            variant: 'default' | 'success' | 'destructive' | 'warning';
            label: string;
            icon: React.ReactNode;
        }> = {
            pending: {
                variant: 'default',
                label: t('status.pending'),
                icon: <Clock className="h-3 w-3 mr-1" />
            },
            approved: {
                variant: 'success',
                label: t('status.approved'),
                icon: <CheckCircle className="h-3 w-3 mr-1" />
            },
            rejected: {
                variant: 'destructive',
                label: t('status.rejected'),
                icon: <XCircle className="h-3 w-3 mr-1" />
            },
            changes_requested: {
                variant: 'warning',
                label: t('status.changesRequested'),
                icon: <AlertCircle className="h-3 w-3 mr-1" />
            },
        };

        const config = statusConfig[status] || statusConfig.pending;
        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                {config.icon}
                {config.label}
            </Badge>
        );
    };

    const getPropertyTypeBadge = (type: string) => {
        const typeColors: Record<string, string> = {
            apartment: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            house: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            villa: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            commercial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            land: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        };

        const colorClass = typeColors[type.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
                {t(`propertyTypes.${type}`, { defaultValue: type })}
            </span>
        );
    };

    const handleApprovalAction = async () => {
        if (!approvalDialog.property || !approvalDialog.action) return;

        try {
            await adminApi.approveProperty({
                property_id: approvalDialog.property.id,
                action: approvalDialog.action,
                notes: approvalDialog.notes || undefined,
            });

            toast.success(t(`actions.${approvalDialog.action}Success`));

            // Close dialog and reset
            setApprovalDialog({
                open: false,
                property: null,
                action: null,
                notes: '',
            });

            // Remove property from list
            setProperties(prev => prev.filter(p => p.id !== approvalDialog.property?.id));

            // Update stats
            setStats(prev => ({
                ...prev,
                pending: Math.max(0, prev.pending - 1),
                [approvalDialog.action === 'approve' ? 'approved' :
                    approvalDialog.action === 'reject' ? 'rejected' :
                        'changes_requested']: prev[approvalDialog.action === 'approve' ? 'approved' :
                            approvalDialog.action === 'reject' ? 'rejected' :
                                'changes_requested'] as number + 1
            }));

            // Refresh notifications
            notificationStore.fetchUnreadCount();

        } catch (err: any) {
            console.error('Approval error:', err);
            toast.error(t('errors.approvalFailed'));
        }
    };

    const openApprovalDialog = (property: Property, action: 'approve' | 'reject' | 'request_changes') => {
        setApprovalDialog({
            open: true,
            property,
            action,
            notes: action === 'reject' ? t('dialogs.defaultRejectionReason') :
                action === 'request_changes' ? t('dialogs.defaultChangesRequest') : '',
        });
    };

    const viewPropertyDetails = (property: Property) => {
        setSelectedProperty(property);
        setShowDetails(true);

        // Fetch approval history
        // TODO: Implement API endpoint for property approval history
        setApprovalHistory([
            {
                id: 1,
                action: 'submitted',
                notes: t('history.submitted'),
                admin: { id: 0, name: 'System', email: 'system@example.com' },
                timestamp: property.created_at,
            },
        ]);
    };

    const handleBulkAction = async () => {
        if (selectedProperties.length === 0) {
            toast.error(t('errors.noPropertiesSelected'));
            return;
        }

        try {
            for (const propertyId of selectedProperties) {
                await adminApi.approveProperty({
                    property_id: propertyId,
                    action: bulkAction,
                    notes: bulkNotes || undefined,
                });
            }

            toast.success(t('actions.bulkSuccess', { count: selectedProperties.length, action: bulkAction }));
            setBulkActionDialog(false);
            setBulkNotes('');
            setSelectedProperties([]);
            fetchPendingProperties();
        } catch (err: any) {
            console.error('Bulk action error:', err);
            toast.error(t('errors.bulkFailed'));
        }
    };

    const togglePropertySelection = (propertyId: number) => {
        setSelectedProperties(prev =>
            prev.includes(propertyId)
                ? prev.filter(id => id !== propertyId)
                : [...prev, propertyId]
        );
    };

    const selectAllProperties = () => {
        if (selectedProperties.length === filteredProperties.length) {
            setSelectedProperties([]);
        } else {
            setSelectedProperties(filteredProperties.map(p => p.id));
        }
    };

    const downloadReport = () => {
        // Generate CSV report
        const headers = ['ID', 'Title', 'Owner', 'Type', 'Price', 'Status', 'Date', 'Location'];
        const csvContent = [
            headers.join(','),
            ...filteredProperties.map(property => [
                property.id,
                `"${property.title}"`,
                `"${property.owner.first_name} ${property.owner.last_name}"`,
                property.property_type,
                property.price_etb,
                property.approval_status || 'pending',
                property.created_at,
                `"${property.city?.name}, ${property.sub_city?.name}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `property-approval-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success(t('actions.exportSuccess'));
    };

    const sendOwnerEmail = async (property: Property) => {
        try {
            // TODO: Implement email sending API
            await adminApi.sendTestEmail(property.owner.email);
            toast.success(t('actions.emailSent'));
        } catch (err: any) {
            console.error('Email error:', err);
            toast.error(t('errors.emailFailed'));
        }
    };

    const filteredProperties = properties.filter(property => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        return (
            property.title.toLowerCase().includes(searchLower) ||
            property.description.toLowerCase().includes(searchLower) ||
            property.owner.email.toLowerCase().includes(searchLower) ||
            (property.owner.first_name + ' ' + property.owner.last_name).toLowerCase().includes(searchLower) ||
            property.city?.name.toLowerCase().includes(searchLower) ||
            property.sub_city?.name.toLowerCase().includes(searchLower)
        );
    });

    const renderApprovalDialogContent = () => {
        if (!approvalDialog.property || !approvalDialog.action) return null;

        const { property, action } = approvalDialog;
        const actionLabels = {
            approve: t('dialogs.approve.title'),
            reject: t('dialogs.reject.title'),
            request_changes: t('dialogs.requestChanges.title'),
        };

        const actionMessages = {
            approve: t('dialogs.approve.description'),
            reject: t('dialogs.reject.description'),
            request_changes: t('dialogs.requestChanges.description'),
        };

        return (
            <>
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">
                        {actionLabels[action]}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                        {actionMessages[action]}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Property Info */}
                    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <div className="flex items-start space-x-4">
                            <div className="h-20 w-20 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                                {property.images?.[0]?.image ? (
                                    <img
                                        src={getImageUrl(property.images[0].image) || ''}
                                        alt={property.title}
                                        className="h-20 w-20 object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            const parent = (e.target as HTMLImageElement).parentElement;
                                            if (parent) {
                                                parent.innerHTML = '<div class="h-20 w-20 flex items-center justify-center"><Building2 class="h-8 w-8 text-gray-400" /></div>';
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="h-20 w-20 flex items-center justify-center">
                                        <Building2 className="h-8 w-8 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {property.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {property.city?.name}, {property.sub_city?.name}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                    {getPropertyTypeBadge(property.property_type)}
                                    <span className="text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(property.price_etb, 'ETB')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Owner Info */}
                    <div className="p-3 border rounded-lg border-gray-200 dark:border-gray-700">
                        <h5 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                            {t('details.owner')}
                        </h5>
                        <div className="text-sm">
                            <p className="text-gray-900 dark:text-white">{property.owner.first_name} {property.owner.last_name}</p>
                            <p className="text-gray-600 dark:text-gray-400">{property.owner.email}</p>
                            {property.owner.phone_number && (
                                <p className="text-gray-600 dark:text-gray-400">{property.owner.phone_number}</p>
                            )}
                        </div>
                    </div>

                    {/* Notes/Reason Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">
                            {action === 'approve' ? t('dialogs.approve.notesLabel') :
                                action === 'reject' ? t('dialogs.reject.notesLabel') :
                                    t('dialogs.requestChanges.notesLabel')}
                        </label>
                        <Textarea
                            value={approvalDialog.notes}
                            onChange={(e) => setApprovalDialog({ ...approvalDialog, notes: e.target.value })}
                            placeholder={
                                action === 'approve' ? t('dialogs.approve.notesPlaceholder') :
                                    action === 'reject' ? t('dialogs.reject.notesPlaceholder') :
                                        t('dialogs.requestChanges.notesPlaceholder')
                            }
                            rows={4}
                            className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        />
                        {(action === 'reject' || action === 'request_changes') && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('dialogs.notesDescription')}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setApprovalDialog({
                            open: false,
                            property: null,
                            action: null,
                            notes: '',
                        })}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        {t('dialogs.cancel')}
                    </Button>
                    <Button
                        variant={
                            action === 'approve' ? 'default' :
                                action === 'reject' ? 'destructive' :
                                    'warning'
                        }
                        onClick={handleApprovalAction}
                        disabled={(action === 'reject' || action === 'request_changes') && !approvalDialog.notes.trim()}
                        className={action === 'approve' ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800' : ''}
                    >
                        {actionLabels[action]}
                    </Button>
                </DialogFooter>
            </>
        );
    };

    const renderPropertyRow = (property: Property) => (
        <TableRow key={property.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <TableCell>
                <input
                    type="checkbox"
                    checked={selectedProperties.includes(property.id)}
                    onChange={() => togglePropertySelection(property.id)}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
            </TableCell>
            <TableCell>
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                        {property.images?.[0]?.image ? (
                            <img
                                src={getImageUrl(property.images[0].image) || ''}
                                alt={property.title}
                                className="h-10 w-10 object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) {
                                        parent.innerHTML = '<div class="h-10 w-10 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><Building2 class="h-5 w-5 text-gray-400" /></div>';
                                    }
                                }}
                            />
                        ) : (
                            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-gray-400" />
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                            {property.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            {t('details.id', { id: property.id })}
                        </p>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">{property.owner.first_name} {property.owner.last_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{property.owner.email}</p>
                </div>
            </TableCell>
            <TableCell>
                <div className="space-y-1">
                    {getPropertyTypeBadge(property.property_type)}
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        {property.listing_type === 'for_sale' ? t('listingTypes.sale') : t('listingTypes.rent')}
                    </p>
                </div>
            </TableCell>
            <TableCell>
                <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.price_etb, 'ETB')}</p>
                {property.monthly_rent && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        {t('details.rent')}: {formatCurrency(property.monthly_rent, 'ETB')}/mo
                    </p>
                )}
            </TableCell>
            <TableCell>
                <div className="flex items-center space-x-2">
                    {getStatusBadge(property.approval_status || 'pending')}
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDate(property.created_at)}
                    </span>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewPropertyDetails(property)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                            <DropdownMenuItem
                                onClick={() => openApprovalDialog(property, 'approve')}
                                className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t('actions.approve')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => openApprovalDialog(property, 'request_changes')}
                                className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {t('actions.requestChanges')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => openApprovalDialog(property, 'reject')}
                                className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                {t('actions.reject')}
                            </DropdownMenuItem>
                            <Separator className="dark:bg-gray-700" />
                            <DropdownMenuItem
                                onClick={() => router.push(`/listings/${property.id}`)}
                                className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                {t('actions.viewPublic')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => sendOwnerEmail(property)}
                                className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                {t('actions.sendEmail')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </TableCell>
        </TableRow>
    );

    return (
        <div className="space-y-6 p-3 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('title')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {t('subtitle')}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {selectedProperties.length > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => setBulkActionDialog(true)}
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {t('actions.bulkActions', { count: selectedProperties.length })}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={downloadReport}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {t('actions.export')}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={fetchPendingProperties}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t('actions.refresh')}
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(stats).map(([key, value]) => {
                    const configs: Record<string, {
                        icon: React.ComponentType<any>;
                        color: string;
                        bg: string;
                    }> = {
                        pending: { icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900' },
                        approved: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900' },
                        rejected: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900' },
                        changes_requested: { icon: AlertCircle, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900' },
                        total: { icon: Building2, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
                    };

                    const config = configs[key];
                    const Icon = config.icon;

                    return (
                        <Card key={key} className="overflow-hidden border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardContent className="p-4 md:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                                            {t(`stats.${key}`)}
                                        </p>
                                        <p className={`text-2xl font-bold ${config.color}`}>
                                            {value}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-full ${config.bg}`}>
                                        <Icon className={`h-6 w-6 ${config.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Filters */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="lg:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <Input
                                    placeholder={t('filters.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <Select value={filters.propertyType} onValueChange={(value) => setFilters({ ...filters, propertyType: value })}
                            placeholder={t('filters.propertyType')}>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('filters.allTypes')}</SelectItem>
                                <SelectItem value="apartment" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('propertyTypes.apartment')}</SelectItem>
                                <SelectItem value="house" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('propertyTypes.house')}</SelectItem>
                                <SelectItem value="villa" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('propertyTypes.villa')}</SelectItem>
                                <SelectItem value="commercial" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('propertyTypes.commercial')}</SelectItem>
                                <SelectItem value="land" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('propertyTypes.land')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.listingType} onValueChange={(value) => setFilters({ ...filters, listingType: value })}
                            placeholder={t('filters.listingType')}>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('filters.allListings')}</SelectItem>
                                <SelectItem value="for_sale" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('listingTypes.sale')}</SelectItem>
                                <SelectItem value="for_rent" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('listingTypes.rent')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
                            placeholder={t('filters.dateRange')}>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                <SelectItem value="today" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('filters.today')}</SelectItem>
                                <SelectItem value="week" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('filters.week')}</SelectItem>
                                <SelectItem value="month" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('filters.month')}</SelectItem>
                                <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('filters.allTime')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Properties Table */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-gray-900 dark:text-white">
                            {t('tableTitle', { count: filteredProperties.length })}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                                    onChange={selectAllProperties}
                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <Label className="text-sm text-gray-600 dark:text-gray-400">{t('actions.selectAll')}</Label>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-700" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700" />
                                        <Skeleton className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredProperties.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 dark:text-gray-500 mb-4">
                                <Building2 className="h-12 w-12 mx-auto mb-3" />
                                {searchTerm ? t('emptyState.noMatch') : t('emptyState.noProperties')}
                            </div>
                            {searchTerm && (
                                <Button
                                    variant="outline"
                                    onClick={() => setSearchTerm('')}
                                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {t('emptyState.clearSearch')}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border border-gray-200 dark:border-gray-700">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-gray-200 dark:border-gray-700">
                                        <TableHead className="w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedProperties.length === filteredProperties.length && filteredProperties.length > 0}
                                                onChange={selectAllProperties}
                                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                            />
                                        </TableHead>
                                        <TableHead className="text-gray-600 dark:text-gray-400">{t('columns.property')}</TableHead>
                                        <TableHead className="text-gray-600 dark:text-gray-400">{t('columns.owner')}</TableHead>
                                        <TableHead className="text-gray-600 dark:text-gray-400">{t('columns.type')}</TableHead>
                                        <TableHead className="text-gray-600 dark:text-gray-400">{t('columns.price')}</TableHead>
                                        <TableHead className="text-gray-600 dark:text-gray-400">{t('columns.status')}</TableHead>
                                        <TableHead className="w-24 text-gray-600 dark:text-gray-400">{t('columns.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProperties.map(renderPropertyRow)}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Property Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                    {selectedProperty && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-gray-900 dark:text-white">
                                    {selectedProperty.title}
                                </DialogTitle>
                                <DialogDescription className="text-gray-600 dark:text-gray-400">
                                    {t('dialogs.reviewDescription')}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                                {/* Property Images */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                                        {t('details.images')}
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {selectedProperty.images?.slice(0, 4).map((image, index) => (
                                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                                <img
                                                    src={getImageUrl(image.image) || ''}
                                                    alt={`Property image ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        const parent = (e.target as HTMLImageElement).parentElement;
                                                        if (parent) {
                                                            parent.innerHTML = '<div class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><Building2 class="h-8 w-8 text-gray-400" /></div>';
                                                        }
                                                    }}
                                                />
                                                {index === 0 && (
                                                    <div className="absolute top-2 left-2">
                                                        <Badge className="bg-blue-600 dark:bg-blue-700">{t('details.primary')}</Badge>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {(!selectedProperty.images || selectedProperty.images.length === 0) && (
                                            <div className="col-span-4 aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                                <Building2 className="h-12 w-12 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Property Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center text-gray-900 dark:text-white">
                                                <MapPin className="h-4 w-4 mr-2" />
                                                {t('details.location')}
                                            </h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {selectedProperty.city?.name}, {selectedProperty.sub_city?.name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                                {selectedProperty.specific_location}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center text-gray-900 dark:text-white">
                                                <DollarSign className="h-4 w-4 mr-2" />
                                                {t('details.pricing')}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('details.price')}</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedProperty.price_etb, 'ETB')}</p>
                                                </div>
                                                {selectedProperty.monthly_rent && (
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('details.monthlyRent')}</p>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedProperty.monthly_rent, 'ETB')}</p>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('details.pricePerSqm')}</p>
                                                    <p className="font-semibold text-gray-900 dark:text-white">
                                                        {formatCurrency(selectedProperty.price_per_sqm || selectedProperty.price_etb / selectedProperty.total_area, 'ETB')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2 flex items-center text-gray-900 dark:text-white">
                                                <Building2 className="h-4 w-4 mr-2" />
                                                {t('details.specifications')}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex items-center space-x-2">
                                                    <Bed className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                    <span className="text-gray-700 dark:text-gray-300">{selectedProperty.bedrooms} {t('details.bedrooms')}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Bath className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                    <span className="text-gray-700 dark:text-gray-300">{selectedProperty.bathrooms} {t('details.bathrooms')}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Maximize2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                    <span className="text-gray-700 dark:text-gray-300">{selectedProperty.total_area} {t('details.areaUnit')}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                    <span className="text-gray-700 dark:text-gray-300">{selectedProperty.built_year || t('details.notAvailable')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('details.keyFeatures')}</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedProperty.has_parking && <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{t('features.parking')}</Badge>}
                                                {selectedProperty.has_garden && <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{t('features.garden')}</Badge>}
                                                {selectedProperty.has_security && <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{t('features.security')}</Badge>}
                                                {selectedProperty.has_furniture && <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{t('features.furnished')}</Badge>}
                                                {selectedProperty.is_pet_friendly && <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{t('features.petFriendly')}</Badge>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Owner Info */}
                                <div className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
                                    <h4 className="font-semibold mb-3 flex items-center text-gray-900 dark:text-white">
                                        <User className="h-4 w-4 mr-2" />
                                        {t('details.owner')}
                                    </h4>
                                    <div className="flex items-center space-x-3">
                                        <Avatar>
                                            <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                {selectedProperty.owner.first_name?.[0]}{selectedProperty.owner.last_name?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {selectedProperty.owner.first_name} {selectedProperty.owner.last_name}
                                            </p>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500 dark:text-gray-500">
                                                <span className="flex items-center">
                                                    <Mail className="h-3 w-3 mr-1" />
                                                    {selectedProperty.owner.email}
                                                </span>
                                                {selectedProperty.owner.phone_number && (
                                                    <span className="flex items-center">
                                                        <Phone className="h-3 w-3 mr-1" />
                                                        {selectedProperty.owner.phone_number}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/admin/users/${selectedProperty.owner.id}`)}
                                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            {t('actions.viewProfile')}
                                        </Button>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('details.description')}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                                        {selectedProperty.description}
                                    </p>
                                </div>

                                {/* Approval History */}
                                {approvalHistory.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">{t('details.approvalHistory')}</h4>
                                        <div className="space-y-3">
                                            {approvalHistory.map(item => (
                                                <div key={item.id} className="border-l-2 border-gray-300 dark:border-gray-600 pl-4 py-2">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                                        <span className="font-medium text-gray-900 dark:text-white">{t(`history.${item.action}`)}</span>
                                                        <span className="text-sm text-gray-500 dark:text-gray-500">
                                                            {formatDate(item.timestamp)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.notes}</p>
                                                    {item.admin && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                            {t('history.by', { name: item.admin.name, email: item.admin.email })}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="flex flex-col sm:flex-row gap-3">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={sendNotification}
                                        onCheckedChange={setSendNotification}
                                    />
                                    <Label className="text-sm text-gray-700 dark:text-gray-300">
                                        {t('actions.sendNotification')}
                                    </Label>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="success"
                                        onClick={() => {
                                            openApprovalDialog(selectedProperty, 'approve');
                                            setShowDetails(false);
                                        }}
                                        className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        {t('actions.approve')}
                                    </Button>
                                    <Button
                                        variant="warning"
                                        onClick={() => {
                                            openApprovalDialog(selectedProperty, 'request_changes');
                                            setShowDetails(false);
                                        }}
                                        className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800"
                                    >
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        {t('actions.requestChanges')}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            openApprovalDialog(selectedProperty, 'reject');
                                            setShowDetails(false);
                                        }}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        {t('actions.reject')}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Approval Dialog */}
            <Dialog open={approvalDialog.open} onOpenChange={(open) =>
                setApprovalDialog({ ...approvalDialog, open })
            }>
                <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                    {renderApprovalDialogContent()}
                </DialogContent>
            </Dialog>

            {/* Bulk Action Dialog */}
            <Dialog open={bulkActionDialog} onOpenChange={setBulkActionDialog}>
                <DialogContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">
                            {t('dialogs.bulkAction.title')}
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
                            {t('dialogs.bulkAction.description', { count: selectedProperties.length })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Select
                            value={bulkAction}
                            onValueChange={(value: string) => setBulkAction(value as 'approve' | 'reject')}
                        >
                            <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                                <SelectValue placeholder={t('dialogs.bulkAction.selectPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                <SelectItem value="approve" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('actions.approve')}</SelectItem>
                                <SelectItem value="reject" className="dark:text-gray-300 dark:hover:bg-gray-700">{t('actions.reject')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <div>
                            <Label className="text-gray-900 dark:text-white">{t('dialogs.bulkAction.notesLabel')}</Label>
                            <Textarea
                                value={bulkNotes}
                                onChange={(e) => setBulkNotes(e.target.value)}
                                placeholder={t('dialogs.bulkAction.notesPlaceholder')}
                                rows={3}
                                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={sendNotification}
                                onCheckedChange={setSendNotification}
                            />
                            <Label className="text-sm text-gray-700 dark:text-gray-300">
                                {t('actions.sendNotification')}
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setBulkActionDialog(false)}
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {t('dialogs.cancel')}
                        </Button>
                        <Button
                            variant={bulkAction === 'approve' ? 'default' : 'destructive'}
                            onClick={handleBulkAction}
                            className={bulkAction === 'approve' ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800' : ''}
                        >
                            {bulkAction === 'approve' ? t('dialogs.bulkAction.approveAll') : t('dialogs.bulkAction.rejectAll')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PropertyApprovalPage;