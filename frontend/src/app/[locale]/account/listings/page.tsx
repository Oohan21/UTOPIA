// src/app/account/listings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Filter,
    Plus,
    Edit,
    Eye,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Building2,
    DollarSign,
    MapPin,
    Bed,
    Bath,
    Ruler,
    Calendar,
    RefreshCw,
    BarChart3,
} from 'lucide-react';
import Header from '@/components/common/Header/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Separator } from '@/components/ui/Separator';
import { listingsApi } from '@/lib/api/listings';
import { Property } from '@/lib/types/property';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from 'react-hot-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';

const MyListingsPage = () => {
    const [listings, setListings] = useState<Property[]>([]);
    const [filteredListings, setFilteredListings] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; listingId: number | null }>({
        open: false,
        listingId: null,
    });
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        pending: 0,
        draft: 0,
        featured: 0,
    });

    const router = useRouter();
    const { user } = useAuthStore();

    const fetchMyListings = async () => {
        try {
            setLoading(true);

            // Fetch user's listings - log the response
            console.log('Fetching user listings...');
            const response = await listingsApi.getUserProperties();
            console.log('API Response:', response);

            // Check if response is an array
            const userListings = Array.isArray(response) ? response : [];
            console.log('Processed listings:', userListings);

            setListings(userListings);
            setFilteredListings(userListings);

            // Calculate stats with proper typing
            const stats = {
                total: userListings.length,
                active: userListings.filter((l: Property) => l.is_active && l.approval_status === 'approved').length,
                pending: userListings.filter((l: Property) => l.approval_status === 'pending').length,
                draft: userListings.filter((l: Property) => !l.is_active).length,
                featured: userListings.filter((l: Property) => l.is_featured).length,
            };

            console.log('Calculated stats:', stats);
            setStats(stats);

        } catch (err) {
            console.error('Error fetching listings:', err);
            toast.error('Failed to load your listings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyListings();
    }, []);

    // Filter listings based on search and active tab
    useEffect(() => {
        let filtered = listings;

        // Apply tab filter
        if (activeTab === 'active') {
            filtered = filtered.filter((l: Property) => l.is_active && l.approval_status === 'approved');
        } else if (activeTab === 'pending') {
            filtered = filtered.filter((l: Property) => l.approval_status === 'pending');
        } else if (activeTab === 'draft') {
            filtered = filtered.filter((l: Property) => !l.is_active);
        } else if (activeTab === 'featured') {
            filtered = filtered.filter((l: Property) => l.is_featured);
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter((l: Property) =>
                l.title.toLowerCase().includes(term) ||
                (l.description?.toLowerCase() || '').includes(term) ||
                l.specific_location.toLowerCase().includes(term) ||
                l.city?.name.toLowerCase().includes(term)
            );
        }

        setFilteredListings(filtered);
    }, [searchTerm, activeTab, listings]);

    const handleDeleteListing = async () => {
        if (!deleteDialog.listingId) return;

        try {
            await listingsApi.deleteProperty(deleteDialog.listingId);
            toast.success('Listing deleted successfully');
            fetchMyListings();
        } catch (err) {
            toast.error('Failed to delete listing');
        } finally {
            setDeleteDialog({ open: false, listingId: null });
        }
    };

    const getStatusBadge = (property: Property) => {
        if (!property.is_active) {
            return (
                <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <Clock className="h-3 w-3 mr-1" />
                    Draft
                </Badge>
            );
        }

        switch (property.approval_status) {
            case 'pending':
                return (
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Review
                    </Badge>
                );
            case 'approved':
                return (
                    <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                    </Badge>
                );
            case 'changes_requested':
                return (
                    <Badge variant="warning" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Changes Requested
                    </Badge>
                );
            default:
                return null;
        }
    };

    const getPropertyTypeBadge = (type: string) => {
        const typeLabels: Record<string, string> = {
            house: 'House',
            apartment: 'Apartment',
            villa: 'Villa',
            commercial: 'Commercial',
            land: 'Land',
            office: 'Office',
            warehouse: 'Warehouse',
            farm: 'Farm',
            hotel: 'Hotel',
            other: 'Other',
        };

        return (
            <Badge variant="outline" className="capitalize">
                {typeLabels[type] || type}
            </Badge>
        );
    };

    const getListingTypeBadge = (type: string) => {
        return (
            <Badge variant={type === 'for_sale' ? 'default' : 'outline'}>
                {type === 'for_sale' ? 'For Sale' : 'For Rent'}
            </Badge>
        );
    };

    const handleReset = () => {
        setSearchTerm('');
        setActiveTab('all');
    };

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <Header />
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        My Listings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Manage all your property listings in one place
                    </p>
                </div>

                <div className="flex items-center space-x-3 mt-4 md:mt-0">
                    <Button
                        variant="outline"
                        onClick={fetchMyListings}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => router.push('/listings/create')}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Listing
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Listings
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total}
                                </p>
                            </div>
                            <Building2 className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Active
                                </p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {stats.active}
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
                                    Pending
                                </p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {stats.pending}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Drafts
                                </p>
                                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                                    {stats.draft}
                                </p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-gray-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Featured
                                </p>
                                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {stats.featured}
                                </p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter */}
            <Card className="mb-8">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search your listings by title, location, or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                                <TabsList className="grid grid-cols-5 sm:inline-flex">
                                    <TabsTrigger value="all">All</TabsTrigger>
                                    <TabsTrigger value="active">Active</TabsTrigger>
                                    <TabsTrigger value="pending">Pending</TabsTrigger>
                                    <TabsTrigger value="draft">Drafts</TabsTrigger>
                                    <TabsTrigger value="featured">Featured</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                >
                                    Reset Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Listings Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Your Listings ({filteredListings.length})
                    </h2>
                    {filteredListings.length > 0 && (
                        <p className="text-sm text-gray-500">
                            Showing {filteredListings.length} of {listings.length} listings
                        </p>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : filteredListings.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="mx-auto max-w-md">
                                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {searchTerm || activeTab !== 'all' ? 'No matching listings found' : 'No listings yet'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    {searchTerm || activeTab !== 'all'
                                        ? 'Try adjusting your search or filter criteria'
                                        : 'Start by creating your first property listing'}
                                </p>
                                <Button
                                    onClick={() => router.push('/listings/create')}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First Listing
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredListings.map((listing) => (
                            <Card
                                key={listing.id}
                                className="hover:shadow-lg transition-shadow duration-200"
                            >
                                <CardContent className="p-0">
                                    {/* Property Image */}
                                    <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                                        {listing.images?.[0]?.image ? (
                                            <img
                                                src={listing.images[0].image}
                                                alt={listing.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                <Building2 className="h-12 w-12 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 flex space-x-2">
                                            {getStatusBadge(listing)}
                                            {listing.is_featured && (
                                                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                                    Featured
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="absolute top-3 right-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <Filter className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.push(`/listings/${listing.id}`)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/listings/${listing.id}/edit`)}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => setDeleteDialog({ open: true, listingId: listing.id })}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Property Details */}
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">
                                                    {listing.title}
                                                </h3>
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    <span className="line-clamp-1">
                                                        {listing.city?.name}, {listing.sub_city?.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(listing.price_etb, 'ETB')}
                                                </div>
                                                {listing.listing_type === 'for_rent' && listing.monthly_rent && (
                                                    <div className="text-sm text-gray-500">
                                                        {formatCurrency(listing.monthly_rent, 'ETB')}/mo
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Property Info */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="flex items-center space-x-2 text-sm">
                                                <Bed className="h-4 w-4 text-gray-400" />
                                                <span>{listing.bedrooms} beds</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm">
                                                <Bath className="h-4 w-4 text-gray-400" />
                                                <span>{listing.bathrooms} baths</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm">
                                                <Ruler className="h-4 w-4 text-gray-400" />
                                                <span>{listing.total_area} m²</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-sm">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                <span>{formatDate(listing.created_at)}</span>
                                            </div>
                                        </div>

                                        <Separator className="my-4" />

                                        {/* Actions and Stats */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                {getPropertyTypeBadge(listing.property_type)}
                                                {getListingTypeBadge(listing.listing_type)}
                                            </div>

                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    {listing.views_count}
                                                </div>
                                                <div className="flex items-center">
                                                    <BarChart3 className="h-3 w-3 mr-1" />
                                                    {listing.inquiry_count}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex space-x-2 mt-4">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => router.push(`/listings/${listing.id}`)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Details
                                            </Button>
                                            <Button
                                                variant="default"
                                                className="flex-1"
                                                onClick={() => router.push(`/listings/${listing.id}/edit`)}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, listingId: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Listing</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this listing? This action cannot be undone.
                            All associated images and data will be permanently removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: false, listingId: null })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteListing}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Listing
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyListingsPage;