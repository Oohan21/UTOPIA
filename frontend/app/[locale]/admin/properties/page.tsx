// src/app/admin/properties/page.tsx - Fixed with Grid and List Views
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
    Grid,
    List,
    MapPin,
    Bed,
    Bath,
    Maximize2,
    Calendar
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
import { adminApi, type AdminProperty, type PaginatedResponse } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const PropertiesManagement = () => {
    const t = useTranslations('admin.properties');
    const [properties, setProperties] = useState<PaginatedResponse<AdminProperty>>({
        count: 0,
        results: [],
        next: null,
        previous: null,
        total_pages: 1,
        current_page: 1
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [propertyType, setPropertyType] = useState<string>('all');
    const [propertyStatus, setPropertyStatus] = useState<string>('all');
    const [propertyActive, setPropertyActive] = useState<string>('all');
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
            if (propertyType !== 'all') params.property_type = propertyType;
            if (propertyStatus !== 'all') params.property_status = propertyStatus;
            if (propertyActive !== 'all') params.is_active = propertyActive === 'active';

            const data = await adminApi.getPropertiesAdmin(params);
            setProperties(data);
        } catch (err) {
            toast.error(t('errors.loadFailed'));
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
            toast.success(t('actions.deleteSuccess'));
            fetchProperties();
        } catch (err) {
            toast.error(t('errors.deleteFailed'));
        } finally {
            setDeleteDialog({ open: false, propertyId: null });
        }
    };

    const handleToggleVerification = async (propertyId: number, isVerified: boolean) => {
        try {
            // Use the dedicated toggle endpoint
            await adminApi.togglePropertyVerification(propertyId);
            toast.success(t(`actions.${!isVerified ? 'verifySuccess' : 'unverifySuccess'}`));
            fetchProperties();
        } catch (err: any) {
            console.error('Verification toggle error:', err);

            // Fallback: Try the old method
            try {
                console.log('Trying fallback update method...');
                await adminApi.updatePropertyAdmin(propertyId, {
                    is_verified: !isVerified
                });
                toast.success(t(`actions.${!isVerified ? 'verifySuccess' : 'unverifySuccess'}`));
                fetchProperties();
            } catch (fallbackErr: any) {
                console.error('Fallback also failed:', fallbackErr);
                toast.error(t('errors.toggleFailed'));
            }
        }
    };

    const handleToggleFeatured = async (propertyId: number, isFeatured: boolean) => {
        try {
            // Use the dedicated toggle endpoint
            await adminApi.togglePropertyFeatured(propertyId);
            toast.success(t(`actions.${!isFeatured ? 'featureSuccess' : 'unfeatureSuccess'}`));
            fetchProperties();
        } catch (err: any) {
            console.error('Featured toggle error:', err);

            // Fallback
            try {
                await adminApi.updatePropertyAdmin(propertyId, {
                    is_featured: !isFeatured
                });
                toast.success(t(`actions.${!isFeatured ? 'featureSuccess' : 'unfeatureSuccess'}`));
                fetchProperties();
            } catch (fallbackErr: any) {
                console.error('Fallback also failed:', fallbackErr);
                toast.error(t('errors.toggleFailed'));
            }
        }
    };

    const handleToggleActiveStatus = async () => {
        if (!activateDialog.propertyId) return;

        try {
            await adminApi.togglePropertyActive(activateDialog.propertyId);
            toast.success(t(`actions.${activateDialog.activate ? 'activateSuccess' : 'deactivateSuccess'}`));
            fetchProperties();
        } catch (err: any) {
            toast.error(t(`errors.${activateDialog.activate ? 'activateFailed' : 'deactivateFailed'}`));
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
        const statusMap: Record<string, { variant: "default" | "destructive" | "outline" | "secondary", label: string }> = {
            available: { variant: 'default', label: t('status.available') },
            pending: { variant: 'secondary', label: t('status.pending') },
            sold: { variant: 'destructive', label: t('status.sold') },
            rented: { variant: 'default', label: t('status.rented') },
            off_market: { variant: 'outline', label: t('status.offMarket') },
        };

        const config = statusMap[status] || { variant: 'outline', label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getPropertyTypeBadge = (type: string) => {
        return (
            <Badge variant="outline" className="capitalize border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                {t(`propertyTypes.${type}`, { defaultValue: type })}
            </Badge>
        );
    };

    const getActiveStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                <Check className="h-3 w-3 mr-1" />
                {t('status.active')}
            </Badge>
        ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                <X className="h-3 w-3 mr-1" />
                {t('status.inactive')}
            </Badge>
        );
    };

    const handleReset = () => {
        setSearchTerm('');
        setPropertyType('all');
        setPropertyStatus('all');
        setPropertyActive('all');
        setPage(1);
        fetchProperties();
    };

    const getCityName = (city: any): string => {
        if (typeof city === 'string') return city;
        if (city && typeof city === 'object' && city.name) return city.name;
        return t('location.unspecified');
    };

    const formatPropertyPrice = (property: AdminProperty) => {
        if (property.listing_type === 'sale' || property.listing_type === 'Sale') {
            return formatCurrency(property.price_etb, 'ETB');
        } else if (property.listing_type === 'rent' || property.listing_type === 'Rent') {
            const rentAmount = property.monthly_rent || property.price_etb;
            return `${formatCurrency(rentAmount, 'ETB')}/month`;
        } else {
            return formatCurrency(property.price_etb, 'ETB');
        }
    };

    const formatTimeAgo = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffMs / (1000 * 60));

            if (diffDays > 0) {
                return t('timeAgo.days', { count: diffDays });
            } else if (diffHours > 0) {
                return t('timeAgo.hours', { count: diffHours });
            } else {
                return t('timeAgo.minutes', { count: diffMinutes });
            }
        } catch {
            return t('timeAgo.recently');
        }
    };

    // Grid View Component
    const PropertyGridCard = ({ property }: { property: AdminProperty }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-200">
            {/* Property Image */}
            <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {property.images?.[0]?.image ? (
                    <img
                        src={property.images[0].image}
                        alt={property.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                    </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-3 left-3 space-y-1">
                    {!property.is_active && (
                        <Badge variant="destructive" className="text-xs">
                            {t('status.inactive')}
                        </Badge>
                    )}
                    {property.is_featured && (
                        <Badge className="bg-yellow-500 text-white border-0 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {t('status.featured')}
                        </Badge>
                    )}
                </div>

                {/* Type Badge */}
                <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs border-gray-300 dark:border-gray-600">
                        {t(`propertyTypes.${property.property_type}`, { defaultValue: property.property_type })}
                    </Badge>
                </div>
            </div>

            {/* Property Info */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {property.title}
                    </h3>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                            <DropdownMenuItem
                                onClick={() => router.push(`/listings/${property.id}`)}
                                className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                {t('actions.view')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => confirmToggleActive(property.id, property.is_active, property.title)}
                                className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                {property.is_active ? (
                                    <>
                                        <PowerOff className="h-4 w-4 mr-2" />
                                        {t('actions.deactivate')}
                                    </>
                                ) : (
                                    <>
                                        <Power className="h-4 w-4 mr-2" />
                                        {t('actions.activate')}
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleToggleVerification(property.id, property.is_verified)}
                                className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                {property.is_verified ? (
                                    <>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        {t('actions.unverify')}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        {t('actions.verify')}
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleToggleFeatured(property.id, property.is_featured)}
                                className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                {property.is_featured ? (
                                    <>
                                        <Star className="h-4 w-4 mr-2" />
                                        {t('actions.removeFeatured')}
                                    </>
                                ) : (
                                    <>
                                        <Star className="h-4 w-4 mr-2" />
                                        {t('actions.makeFeatured')}
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700"
                                onClick={() => setDeleteDialog({ open: true, propertyId: property.id })}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('actions.delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Location */}
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="line-clamp-1">
                        {getCityName(property.city)}
                        {property.sub_city && `, ${getCityName(property.sub_city)}`}
                    </span>
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <Bed className="h-4 w-4 text-gray-500 dark:text-gray-400 mb-1" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{property.bedrooms || 0}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('details.beds')}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <Bath className="h-4 w-4 text-gray-500 dark:text-gray-400 mb-1" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{property.bathrooms || 0}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('details.baths')}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <Maximize2 className="h-4 w-4 text-gray-500 dark:text-gray-400 mb-1" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{property.total_area || 0}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('details.area')}</span>
                    </div>
                </div>

                {/* Price and Status */}
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatPropertyPrice(property)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {property.listing_type === 'rent' ? t('details.monthly') : t('details.sale')}
                        </div>
                    </div>
                    {getPropertyStatusBadge(property.property_status)}
                </div>

                {/* Stats and Verification */}
                <div className="flex items-center justify-between text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                            <Eye className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-300">{property.views_count?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-600 dark:text-gray-300">{formatTimeAgo(property.created_at)}</span>
                        </div>
                    </div>
                    {property.is_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                        <XCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 p-3 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('title')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {t('subtitle')}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('table')}
                        className={cn(
                            "flex items-center",
                            viewMode === 'table'
                                ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        )}
                    >
                        <List className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">{t('view.list')}</span>
                    </Button>
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={cn(
                            "flex items-center",
                            viewMode === 'grid'
                                ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        )}
                    >
                        <Grid className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">{t('view.grid')}</span>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex flex-col lg:flex-row gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder={t('filters.searchPlaceholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 w-full"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Select
                                    value={propertyType}
                                    onValueChange={setPropertyType}
                                    placeholder={t('filters.propertyType')}
                                >
                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                        <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('filters.allTypes')}
                                        </SelectItem>
                                        <SelectItem value="house" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('propertyTypes.house')}
                                        </SelectItem>
                                        <SelectItem value="apartment" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('propertyTypes.apartment')}
                                        </SelectItem>
                                        <SelectItem value="villa" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('propertyTypes.villa')}
                                        </SelectItem>
                                        <SelectItem value="commercial" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('propertyTypes.commercial')}
                                        </SelectItem>
                                        <SelectItem value="land" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('propertyTypes.land')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Select
                                    value={propertyStatus}
                                    onValueChange={setPropertyStatus}
                                    placeholder={t('filters.propertyStatus')}
                                >
                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                        <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('filters.allStatuses')}
                                        </SelectItem>
                                        <SelectItem value="available" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('status.available')}
                                        </SelectItem>
                                        <SelectItem value="pending" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('status.pending')}
                                        </SelectItem>
                                        <SelectItem value="sold" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('status.sold')}
                                        </SelectItem>
                                        <SelectItem value="rented" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('status.rented')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Select
                                    value={propertyActive}
                                    onValueChange={setPropertyActive}
                                    placeholder={t('filters.activeStatus')}
                                >
                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                        <SelectItem value="all" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('filters.all')}
                                        </SelectItem>
                                        <SelectItem value="active" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('filters.activeOnly')}
                                        </SelectItem>
                                        <SelectItem value="inactive" className="dark:text-gray-300 dark:hover:bg-gray-700">
                                            {t('filters.inactiveOnly')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" className="whitespace-nowrap">
                                    {t('actions.search')}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    className="whitespace-nowrap"
                                >
                                    {t('actions.reset')}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Properties List/Grid */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-gray-900 dark:text-white">
                            {t('tableTitle', { count: properties.count })}
                        </CardTitle>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {t('showingRange', {
                                start: (page - 1) * 20 + 1,
                                end: Math.min(page * 20, properties.count),
                                total: properties.count
                            })}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <>
                            {viewMode === 'table' ? (
                                // Table View - Completely Responsive
                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                    {/* Mobile/Tablet View - Cards */}
                                    <div className="block md:hidden">
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {properties.results.map((property) => (
                                                <div key={property.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                                                    {property.title}
                                                                </h4>
                                                                {property.is_featured && (
                                                                    <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                                <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                                                <span className="truncate">
                                                                    {getCityName(property.city)}
                                                                    {property.sub_city && `, ${getCityName(property.sub_city)}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {/* Same dropdown items as desktop */}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    {/* Property Details Row */}
                                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                                            <Bed className="h-4 w-4 mx-auto mb-1 text-gray-500" />
                                                            <div className="text-sm font-medium">{property.bedrooms || 0}</div>
                                                            <div className="text-xs text-gray-500">Beds</div>
                                                        </div>
                                                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                                            <Bath className="h-4 w-4 mx-auto mb-1 text-gray-500" />
                                                            <div className="text-sm font-medium">{property.bathrooms || 0}</div>
                                                            <div className="text-xs text-gray-500">Baths</div>
                                                        </div>
                                                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                                            <Maximize2 className="h-4 w-4 mx-auto mb-1 text-gray-500" />
                                                            <div className="text-sm font-medium">{property.total_area || 0}</div>
                                                            <div className="text-xs text-gray-500">m²</div>
                                                        </div>
                                                    </div>

                                                    {/* Status and Price Row */}
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-lg text-gray-900 dark:text-white">
                                                                {formatPropertyPrice(property)}
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                {getPropertyTypeBadge(property.property_type)}
                                                                {getPropertyStatusBadge(property.property_status)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            {property.is_verified ? (
                                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                            ) : (
                                                                <XCircle className="h-5 w-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Stats Row */}
                                                    <div className="flex justify-between items-center text-sm text-gray-500">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="flex items-center">
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                <span>{property.views_count || 0}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Calendar className="h-4 w-4 mr-1" />
                                                                <span>{formatTimeAgo(property.created_at)}</span>
                                                            </div>
                                                        </div>
                                                        {getActiveStatusBadge(property.is_active)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Desktop View - Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                                <tr>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white w-[300px]">
                                                        Property
                                                    </th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white w-[100px]">
                                                        Type
                                                    </th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white w-[120px]">
                                                        Status
                                                    </th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white w-[100px]">
                                                        Active
                                                    </th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white w-[120px]">
                                                        Price
                                                    </th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white w-[100px]">
                                                        Views
                                                    </th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white w-[100px]">
                                                        Verified
                                                    </th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white w-[80px]">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {properties.results.map((property) => (
                                                    <tr key={property.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        {/* Property Column */}
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-start space-x-3">
                                                                <div className="flex-shrink-0">
                                                                    <div className="h-12 w-12 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                                                        {property.images?.[0]?.image ? (
                                                                            <img
                                                                                src={property.images[0].image}
                                                                                alt={property.title}
                                                                                className="h-12 w-12 object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="h-12 w-12 flex items-center justify-center">
                                                                                <Building2 className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center space-x-1 mb-1">
                                                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                                            {property.title}
                                                                        </h4>
                                                                        {property.is_featured && (
                                                                            <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                                                                        {getCityName(property.city)}
                                                                        {property.sub_city && `, ${getCityName(property.sub_city)}`}
                                                                    </p>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                                                        {property.bedrooms || 0} bd • {property.bathrooms || 0} ba • {property.total_area || 0} m²
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Type Column */}
                                                        <td className="py-3 px-4">
                                                            <div className="space-y-1">
                                                                {getPropertyTypeBadge(property.property_type)}
                                                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                                                    {property.listing_type === 'rent' ? 'Rent' : 'Sale'}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Status Column */}
                                                        <td className="py-3 px-4">
                                                            <div className="space-y-1">
                                                                {getPropertyStatusBadge(property.property_status)}
                                                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                                                    {formatTimeAgo(property.created_at)}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Active Column */}
                                                        <td className="py-3 px-4">
                                                            {getActiveStatusBadge(property.is_active)}
                                                        </td>

                                                        {/* Price Column */}
                                                        <td className="py-3 px-4">
                                                            <div className="space-y-1">
                                                                <div className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                                    {formatPropertyPrice(property)}
                                                                </div>
                                                                {property.listing_type === 'rent' && property.monthly_rent && (
                                                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                                                        Deposit: {formatCurrency(property.price_etb, 'ETB')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Views Column */}
                                                        <td className="py-3 px-4">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center space-x-1">
                                                                    <Eye className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                                        {property.views_count?.toLocaleString() || 0}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                                                    {property.inquiry_count || 0} inquiries
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Verified Column */}
                                                        <td className="py-3 px-4">
                                                            <div className="flex flex-col items-start">
                                                                <div className="flex items-center space-x-1">
                                                                    {property.is_verified ? (
                                                                        <>
                                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                                            <span className="text-xs text-green-600 dark:text-green-400">
                                                                                Verified
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <XCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                                            <span className="text-xs text-gray-500 dark:text-gray-500">
                                                                                Unverified
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                {property.is_featured && (
                                                                    <div className="mt-1 flex items-center">
                                                                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                                                        <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                                                            Featured
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Actions Column */}
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center space-x-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => router.push(`/listings/${property.id}`)}
                                                                    title="View"
                                                                    className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            title="More"
                                                                            className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                                                        >
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48">
                                                                        {/* Keep the same dropdown items */}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                // Grid View
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    {properties.results.map((property) => (
                                        <PropertyGridCard key={property.id} property={property} />
                                    ))}
                                </div>
                            )}

                            {properties.results.length === 0 && (
                                <div className="text-center py-12">
                                    <Building2 className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                                    <div className="text-gray-400 dark:text-gray-500 mb-4">{t('emptyState.noProperties')}</div>
                                    <Button
                                        onClick={() => router.push('/admin/properties/create')}
                                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                    >
                                        {t('emptyState.addFirstProperty')}
                                    </Button>
                                </div>
                            )}

                            {/* Pagination */}
                            {properties.count > 0 && (
                                <div className={`mt-6 ${viewMode === 'grid' ? 'border-t border-gray-200 dark:border-gray-700 pt-6' : ''}`}>
                                    <Pagination
                                        currentPage={page}
                                        totalPages={Math.ceil(properties.count / 20)}
                                        onPageChange={setPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open: boolean) => setDeleteDialog({ open, propertyId: null })}>
                <DialogContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">
                            {t('dialogs.delete.title')}
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
                            {t('dialogs.delete.description')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {t('dialogs.delete.cancel')}
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteProperty}
                        >
                            {t('dialogs.delete.confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Activate/Deactivate Confirmation Dialog */}
            <Dialog open={activateDialog.open} onOpenChange={(open: boolean) =>
                setActivateDialog({ ...activateDialog, open })
            }>
                <DialogContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">
                            {activateDialog.activate ? t('dialogs.activate.title') : t('dialogs.deactivate.title')}
                        </DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
                            {activateDialog.activate
                                ? t('dialogs.activate.description', { propertyTitle: activateDialog.propertyTitle })
                                : t('dialogs.deactivate.description', { propertyTitle: activateDialog.propertyTitle })
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {t('dialogs.activate.cancel')}
                            </Button>
                        </DialogClose>
                        <Button
                            variant={activateDialog.activate ? 'default' : 'destructive'}
                            onClick={handleToggleActiveStatus}
                            className={activateDialog.activate ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800' : ''}
                        >
                            {activateDialog.activate ? (
                                <>
                                    <Power className="h-4 w-4 mr-2" />
                                    {t('dialogs.activate.confirm')}
                                </>
                            ) : (
                                <>
                                    <PowerOff className="h-4 w-4 mr-2" />
                                    {t('dialogs.deactivate.confirm')}
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