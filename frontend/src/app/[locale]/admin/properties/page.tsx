// src/app/admin/properties/page.tsx - REMOVED EDIT ACTION
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    Star,
    Building2,
    Power,
    PowerOff,
    Check,
    X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/Dialog';
import { adminApi, Property as AdminProperty, PaginatedResponse } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'react-hot-toast';

const PropertiesManagement = () => {
    const [properties, setProperties] = useState<PaginatedResponse<AdminProperty>>({
        count: 0,
        results: [],
        next: null,
        previous: null,
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [propertyType, setPropertyType] = useState<string | undefined>(undefined);
    const [propertyStatus, setPropertyStatus] = useState<string | undefined>(undefined);
    const [propertyActive, setPropertyActive] = useState<string | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; propertyId: number | null }>({
        open: false,
        propertyId: null,
    });
    const [activateDialog, setActivateDialog] = useState<{
        open: boolean;
        propertyId: number | null;
        activate: boolean;
        propertyTitle: string;
    }>({
        open: false,
        propertyId: null,
        activate: true,
        propertyTitle: '',
    });
    const router = useRouter();

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const params: any = { page };
            if (searchTerm) params.search = searchTerm;
            if (propertyType && propertyType !== 'all') params.property_type = propertyType;
            if (propertyStatus && propertyStatus !== 'all') params.property_status = propertyStatus;
            if (propertyActive && propertyActive !== 'all') params.is_active = propertyActive === 'active';

            const data = await adminApi.getPropertiesAdmin(params);
            setProperties(data);
        } catch (err) {
            toast.error('Failed to load properties');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, [page, propertyType, propertyStatus, propertyActive]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchProperties();
    };

    const handleDeleteProperty = async () => {
        if (!deleteDialog.propertyId) return;

        try {
            await adminApi.deletePropertyAdmin(deleteDialog.propertyId);
            toast.success('Property deleted successfully');
            fetchProperties();
        } catch (err) {
            toast.error('Failed to delete property');
        } finally {
            setDeleteDialog({ open: false, propertyId: null });
        }
    };

    const handleToggleVerification = async (propertyId: number, isVerified: boolean) => {
        try {
            // Use the dedicated toggle endpoint
            await adminApi.togglePropertyVerification(propertyId);
            toast.success(`Property ${!isVerified ? 'verified' : 'unverified'}`);
            fetchProperties();
        } catch (err: any) {
            console.error('Verification toggle error:', err);

            // Fallback: Try the old method
            try {
                console.log('Trying fallback update method...');
                await adminApi.updatePropertyAdmin(propertyId, {
                    is_verified: !isVerified
                });
                toast.success(`Property ${!isVerified ? 'verified' : 'unverified'}`);
                fetchProperties();
            } catch (fallbackErr: any) {
                console.error('Fallback also failed:', fallbackErr);
                toast.error(`Failed to update property status: ${fallbackErr.response?.data?.detail || fallbackErr.message}`);
            }
        }
    };

    const handleToggleFeatured = async (propertyId: number, isFeatured: boolean) => {
        try {
            // Use the dedicated toggle endpoint
            await adminApi.togglePropertyFeatured(propertyId);
            toast.success(`Property ${!isFeatured ? 'featured' : 'unfeatured'}`);
            fetchProperties();
        } catch (err: any) {
            console.error('Featured toggle error:', err);

            // Fallback
            try {
                await adminApi.updatePropertyAdmin(propertyId, {
                    is_featured: !isFeatured
                });
                toast.success(`Property ${!isFeatured ? 'featured' : 'unfeatured'}`);
                fetchProperties();
            } catch (fallbackErr: any) {
                console.error('Fallback also failed:', fallbackErr);
                toast.error(`Failed to update featured status: ${fallbackErr.response?.data?.detail || fallbackErr.message}`);
            }
        }
    };

    const handleToggleActiveStatus = async () => {
        if (!activateDialog.propertyId) return;

        try {
            await adminApi.togglePropertyActive(activateDialog.propertyId);
            toast.success(`Property ${activateDialog.activate ? 'activated' : 'deactivated'}`);
            fetchProperties();
        } catch (err: any) {
            toast.error(`Failed to ${activateDialog.activate ? 'activate' : 'deactivate'} property`);
        } finally {
            setActivateDialog({ open: false, propertyId: null, activate: true, propertyTitle: '' });
        }
    };

    const confirmToggleActive = (propertyId: number, isActive: boolean, title: string) => {
        setActivateDialog({
            open: true,
            propertyId,
            activate: !isActive,
            propertyTitle: title,
        });
    };

    const getPropertyStatusBadge = (status: string) => {
        const statusMap: Record<string, { variant: any, label: string }> = {
            available: { variant: 'default', label: 'Available' },
            pending: { variant: 'default', label: 'Pending' },
            sold: { variant: 'destructive', label: 'Sold' },
            rented: { variant: 'default', label: 'Rented' },
            off_market: { variant: 'outline', label: 'Off Market' },
        };

        const config = statusMap[status] || { variant: 'outline', label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getPropertyTypeBadge = (type: string) => {
        return <Badge variant="outline" className="capitalize">{type}</Badge>;
    };

    const getActiveStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                <Check className="h-3 w-3 mr-1" />
                Active
            </Badge>
        ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                <X className="h-3 w-3 mr-1" />
                Inactive
            </Badge>
        );
    };

    const handleReset = () => {
        setSearchTerm('');
        setPropertyType(undefined);
        setPropertyStatus(undefined);
        setPropertyActive(undefined);
        setPage(1);
        fetchProperties();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Properties Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage all properties listed on the platform
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        onClick={() => setViewMode('table')}
                    >
                        List View
                    </Button>
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        onClick={() => setViewMode('grid')}
                    >
                        Grid View
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search properties by title, location..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div>
                                <Select
                                    value={propertyType || undefined}
                                    onValueChange={(value) => setPropertyType(value || undefined)}
                                >
                                    <SelectTrigger>
                                        <div className="flex items-center">
                                            <Filter className="h-4 w-4 mr-2" />
                                            <SelectValue placeholder="Property Type" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="house">House</SelectItem>
                                        <SelectItem value="apartment">Apartment</SelectItem>
                                        <SelectItem value="villa">Villa</SelectItem>
                                        <SelectItem value="commercial">Commercial</SelectItem>
                                        <SelectItem value="land">Land</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Select
                                    value={propertyStatus || undefined}
                                    onValueChange={(value) => setPropertyStatus(value || undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="sold">Sold</SelectItem>
                                        <SelectItem value="rented">Rented</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Select
                                    value={propertyActive || undefined}
                                    onValueChange={(value) => setPropertyActive(value || undefined)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Active Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="active">Active Only</SelectItem>
                                        <SelectItem value="inactive">Inactive Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex space-x-2">
                                <Button type="submit">
                                    Search
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Properties List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>All Properties ({properties.count})</CardTitle>
                        <div className="text-sm text-gray-500">
                            Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, properties.count)} of {properties.count}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Property
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Type
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Status
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Active
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Price
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Views
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Verified
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {properties.results.map((property) => (
                                        <tr
                                            key={property.id}
                                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-16 w-16 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                                                        {property.images?.[0]?.image ? (
                                                            <img
                                                                src={property.images[0].image}
                                                                alt={property.title}
                                                                className="h-16 w-16 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-16 w-16 flex items-center justify-center">
                                                                <Building2 className="h-8 w-8 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {property.title}
                                                        </p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {property.city?.name}, {property.sub_city?.name}
                                                        </p>
                                                        <div className="flex items-center mt-1">
                                                            {property.is_featured && (
                                                                <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                                            )}
                                                            <span className="text-xs text-gray-500">
                                                                {property.bedrooms} bed • {property.bathrooms} bath • {property.total_area} m²
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {getPropertyTypeBadge(property.property_type)}
                                            </td>
                                            <td className="py-3 px-4">
                                                {getPropertyStatusBadge(property.property_status)}
                                            </td>
                                            <td className="py-3 px-4">
                                                {getActiveStatusBadge(property.is_active)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium">
                                                    {formatCurrency(property.price_etb, 'ETB')}
                                                </div>
                                                {property.monthly_rent && (
                                                    <div className="text-xs text-gray-500">
                                                        Rent: {formatCurrency(property.monthly_rent, 'ETB')}/mo
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-sm">
                                                    {property.views_count.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {property.inquiry_count} inquiries
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    {property.is_verified ? (
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-gray-400" />
                                                    )}
                                                    {property.is_featured && (
                                                        <Star className="h-4 w-4 text-yellow-500" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    {/* View Button Only - Edit Button Removed */}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => router.push(`/listings/${property.id}`)}
                                                        title="View property"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" title="More actions">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {/* Toggle Active Status */}
                                                            <DropdownMenuItem
                                                                onClick={() => confirmToggleActive(
                                                                    property.id,
                                                                    property.is_active,
                                                                    property.title
                                                                )}
                                                            >
                                                                {property.is_active ? (
                                                                    <>
                                                                        <PowerOff className="h-4 w-4 mr-2" />
                                                                        Deactivate
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Power className="h-4 w-4 mr-2" />
                                                                        Activate
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>

                                                            {/* Toggle Verification */}
                                                            <DropdownMenuItem onClick={() => handleToggleVerification(property.id, property.is_verified)}>
                                                                {property.is_verified ? (
                                                                    <>
                                                                        <XCircle className="h-4 w-4 mr-2" />
                                                                        Unverify
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                                        Verify
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>

                                                            {/* Toggle Featured */}
                                                            <DropdownMenuItem onClick={() => handleToggleFeatured(property.id, property.is_featured)}>
                                                                {property.is_featured ? (
                                                                    <>
                                                                        <Star className="h-4 w-4 mr-2" />
                                                                        Remove Featured
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Star className="h-4 w-4 mr-2" />
                                                                        Make Featured
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>

                                                            {/* Delete */}
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => setDeleteDialog({ open: true, propertyId: property.id })}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && properties.results.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">No properties found</div>
                            <Button onClick={() => router.push('/admin/properties/create')}>
                                Add Your First Property
                            </Button>
                        </div>
                    )}

                    {/* Pagination */}
                    {properties.count > 0 && (
                        <div className="mt-6">
                            <Pagination
                                currentPage={page}
                                totalPages={Math.ceil(properties.count / 20)}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open: boolean) => setDeleteDialog({ open, propertyId: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the property
                            and all associated data including images, inquiries, and promotions.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteProperty}
                        >
                            Delete Property
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Activate/Deactivate Confirmation Dialog */}
            <Dialog open={activateDialog.open} onOpenChange={(open: boolean) =>
                setActivateDialog({ ...activateDialog, open })
            }>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {activateDialog.activate ? 'Activate Property' : 'Deactivate Property'}
                        </DialogTitle>
                        <DialogDescription>
                            {activateDialog.activate
                                ? `Are you sure you want to activate "${activateDialog.propertyTitle}"? This will make the property visible to users.`
                                : `Are you sure you want to deactivate "${activateDialog.propertyTitle}"? This will hide the property from users.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant={activateDialog.activate ? 'default' : 'destructive'}
                            onClick={handleToggleActiveStatus}
                        >
                            {activateDialog.activate ? (
                                <>
                                    <Power className="h-4 w-4 mr-2" />
                                    Activate Property
                                </>
                            ) : (
                                <>
                                    <PowerOff className="h-4 w-4 mr-2" />
                                    Deactivate Property
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PropertiesManagement;