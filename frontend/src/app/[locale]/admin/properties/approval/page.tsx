// src/app/admin/approval/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Separator } from '@/components/ui/Separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { adminApi } from '@/lib/api/admin';
import { Property, PropertyImage } from '@/lib/types/property';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'react-hot-toast';

interface ApprovalStats {
    pending: number;
    approved: number;
    rejected: number;
    changes_requested: number;
    total: number;
}

const PropertyApprovalPage = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState('pending');
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
    const router = useRouter();

    const fetchPendingProperties = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getPendingProperties();
            setProperties(data.properties || []);
            setStats({
                pending: data.count || 0,
                approved: 0,
                rejected: 0,
                changes_requested: 0,
                total: data.count || 0,
            });
        } catch (err) {
            toast.error('Failed to load pending properties');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingProperties();
    }, []);

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: 'default', label: 'Pending', icon: <Clock className="h-3 w-3 mr-1" /> },
            approved: { variant: 'success', label: 'Approved', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
            rejected: { variant: 'destructive', label: 'Rejected', icon: <XCircle className="h-3 w-3 mr-1" /> },
            changes_requested: { variant: 'warning', label: 'Changes Requested', icon: <AlertCircle className="h-3 w-3 mr-1" /> },
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return (
            <Badge variant={config.variant as any} className="flex items-center">
                {config.icon}
                {config.label}
            </Badge>
        );
    };

    const getPropertyTypeBadge = (type: string) => {
        return <Badge variant="outline" className="capitalize">{type}</Badge>;
    };

    const handleApprovalAction = async () => {
        if (!approvalDialog.property || !approvalDialog.action) return;

        try {
            await adminApi.approveProperty({
                property_id: approvalDialog.property.id,
                action: approvalDialog.action,
                notes: approvalDialog.notes || undefined,
            });

            toast.success(`Property ${approvalDialog.action}d successfully`);
            setApprovalDialog({
                open: false,
                property: null,
                action: null,
                notes: '',
            });
            fetchPendingProperties();
        } catch (err: any) {
            toast.error(`Failed to ${approvalDialog.action} property: ${err.message}`);
        }
    };

    const openApprovalDialog = (property: Property, action: 'approve' | 'reject' | 'request_changes') => {
        setApprovalDialog({
            open: true,
            property,
            action,
            notes: action === 'reject' ? 'Does not meet listing guidelines.' : '',
        });
    };

    const renderApprovalDialogContent = () => {
        if (!approvalDialog.property || !approvalDialog.action) return null;

        const { property, action } = approvalDialog;
        const actionLabels = {
            approve: 'Approve',
            reject: 'Reject',
            request_changes: 'Request Changes',
        };

        const actionMessages = {
            approve: 'This property will be published and visible to all users.',
            reject: 'This property will be rejected and hidden from users.',
            request_changes: 'The owner will be asked to make changes before resubmitting.',
        };

        return (
            <>
                <DialogHeader>
                    <DialogTitle>{actionLabels[action]} Property</DialogTitle>
                    <DialogDescription>
                        {actionMessages[action]}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Property Info */}
                    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-start space-x-4">
                            <div className="h-20 w-20 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                                {property.images?.[0]?.image ? (
                                    <img
                                        src={property.images[0].image}
                                        alt={property.title}
                                        className="h-20 w-20 object-cover"
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
                                    <span className="text-sm">
                                        {formatCurrency(property.price_etb, 'ETB')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Owner Info */}
                    <div className="p-3 border rounded-lg">
                        <h5 className="text-sm font-medium mb-2">Property Owner</h5>
                        <div className="text-sm">
                            <p>{property.owner.first_name} {property.owner.last_name}</p>
                            <p className="text-gray-600 dark:text-gray-400">{property.owner.email}</p>
                            {property.owner.phone_number && (
                                <p className="text-gray-600 dark:text-gray-400">{property.owner.phone_number}</p>
                            )}
                        </div>
                    </div>

                    {/* Notes/Reason Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {action === 'approve' ? 'Approval Notes (Optional)' :
                             action === 'reject' ? 'Rejection Reason*' :
                             'Required Changes*'}
                        </label>
                        <Textarea
                            value={approvalDialog.notes}
                            onChange={(e) => setApprovalDialog({ ...approvalDialog, notes: e.target.value })}
                            placeholder={
                                action === 'approve' ? 'Add notes about this approval...' :
                                action === 'reject' ? 'Explain why this property is being rejected...' :
                                'List the specific changes needed...'
                            }
                            rows={4}
                        />
                        {(action === 'reject' || action === 'request_changes') && (
                            <p className="text-xs text-gray-500">
                                This will be sent to the property owner.
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
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={
                            action === 'approve' ? 'default' :
                            action === 'reject' ? 'destructive' :
                            'warning'
                        }
                        onClick={handleApprovalAction}
                        disabled={(action === 'reject' || action === 'request_changes') && !approvalDialog.notes.trim()}
                    >
                        {actionLabels[action]}
                    </Button>
                </DialogFooter>
            </>
        );
    };

    const filteredProperties = properties.filter(property => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
            property.title.toLowerCase().includes(searchLower) ||
            property.description.toLowerCase().includes(searchLower) ||
            property.owner.email.toLowerCase().includes(searchLower) ||
            (property.owner.first_name + ' ' + property.owner.last_name).toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Property Approval
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Review and approve new property listings
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        onClick={fetchPendingProperties}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Pending Review
                                </p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {stats.pending}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Approved Today
                                </p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {stats.approved}
                                </p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Rejected
                                </p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {stats.rejected}
                                </p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Changes Requested
                                </p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {stats.changes_requested}
                                </p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search properties by title, owner, or location..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={selectedTab} onValueChange={setSelectedTab}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending Review</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="changes_requested">Changes Requested</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Properties List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            Properties Needing Review ({filteredProperties.length})
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : filteredProperties.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                {searchTerm ? 'No properties match your search' : 'No properties pending review'}
                            </div>
                            <Button variant="outline" onClick={fetchPendingProperties}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh List
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredProperties.map((property) => (
                                <div
                                    key={property.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                                        {/* Property Image */}
                                        <div className="w-full md:w-48 h-48 md:h-32 rounded overflow-hidden flex-shrink-0">
                                            {property.images?.[0]?.image ? (
                                                <img
                                                    src={property.images[0].image}
                                                    alt={property.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <Building2 className="h-12 w-12 text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Property Details */}
                                        <div className="flex-1">
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                                        {property.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {property.city?.name}, {property.sub_city?.name}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusBadge(property.approval_status || 'pending')}
                                                    {getPropertyTypeBadge(property.property_type)}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Price</p>
                                                    <p className="text-lg font-semibold">
                                                        {formatCurrency(property.price_etb, 'ETB')}
                                                    </p>
                                                    {property.monthly_rent && (
                                                        <p className="text-sm text-gray-500">
                                                            Rent: {formatCurrency(property.monthly_rent, 'ETB')}/mo
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Specifications</p>
                                                    <p className="text-sm">
                                                        {property.bedrooms} bed • {property.bathrooms} bath • {property.total_area} m²
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Listed: {formatDate(property.created_at)}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Owner</p>
                                                    <p className="text-sm">
                                                        {property.owner.first_name} {property.owner.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{property.owner.email}</p>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/listings/${property.id}`)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Details
                                                </Button>
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={() => openApprovalDialog(property, 'approve')}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    onClick={() => openApprovalDialog(property, 'request_changes')}
                                                >
                                                    <AlertCircle className="h-4 w-4 mr-2" />
                                                    Request Changes
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => openApprovalDialog(property, 'reject')}
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Approval Dialog */}
            <Dialog open={approvalDialog.open} onOpenChange={(open) => 
                setApprovalDialog({ ...approvalDialog, open })
            }>
                <DialogContent className="max-w-2xl">
                    {renderApprovalDialogContent()}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PropertyApprovalPage;