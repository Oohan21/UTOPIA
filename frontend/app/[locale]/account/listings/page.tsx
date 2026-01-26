'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/common/Header/Header";
import {
    Search,
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
    RefreshCw,
    BarChart3,
    Grid,
    List,
    X as XIcon,
    Smartphone,
    Filter,
    ChevronDown,
    Menu,
    ChevronRight,
    TrendingUp,
    Eye as EyeIcon,
    MessageSquare,
    Calendar,
    MapPin,
    Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { listingsApi } from '@/lib/api/listings';
import { Property } from '@/lib/types/property';
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
import PropertyCard from '@/components/listings/PropertyCard';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const MyListingsPage = () => {
    const [listings, setListings] = useState<Property[]>([]);
    const [filteredListings, setFilteredListings] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
        promoted: 0,
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const router = useRouter();
    const { user } = useAuthStore();
    const t = useTranslations();
    const tCommon = useTranslations('common');
    const tListings = useTranslations('listings');
    const tMyListings = useTranslations('myListings');
    const tErrors = useTranslations('errors');
    const tSuccess = useTranslations('success');

    const fetchMyListings = async () => {
        try {
            setLoading(true);

            // Fetch user's listings
            console.log('Fetching user listings...');
            const response = await listingsApi.getUserProperties();
            console.log('API Response:', response);

            // Check if response is an array
            const userListings = Array.isArray(response) ? response : [];
            console.log('Processed listings:', userListings);

            setListings(userListings);
            setFilteredListings(userListings);

            // Calculate stats with proper logic
            const stats = {
                total: userListings.length,
                // Active: is_active AND approved
                active: userListings.filter((l: Property) =>
                    l.is_active && l.approval_status === 'approved'
                ).length,
                // Pending: not draft AND pending approval
                pending: userListings.filter((l: Property) =>
                    l.is_active && l.approval_status === 'pending'
                ).length,
                // Draft: not active (is_active = false)
                draft: userListings.filter((l: Property) => !l.is_active).length,
                // Featured: is_featured flag
                featured: userListings.filter((l: Property) => l.is_featured).length,
                // Promoted: is_promoted flag
                promoted: userListings.filter((l: Property) => l.is_promoted).length,
            };

            console.log('Calculated stats:', stats);
            setStats(stats);

        } catch (err) {
            console.error('Error fetching listings:', err);
            toast.error(tErrors('failedToLoadListings') || 'Failed to load your listings');
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
            filtered = filtered.filter((l: Property) =>
                l.is_active && l.approval_status === 'approved'
            );
        } else if (activeTab === 'pending') {
            filtered = filtered.filter((l: Property) =>
                l.is_active && l.approval_status === 'pending'
            );
        } else if (activeTab === 'draft') {
            filtered = filtered.filter((l: Property) => !l.is_active);
        } else if (activeTab === 'featured') {
            filtered = filtered.filter((l: Property) => l.is_featured);
        } else if (activeTab === 'promoted') {
            filtered = filtered.filter((l: Property) => l.is_promoted);
        } else if (activeTab === 'rejected') {
            filtered = filtered.filter((l: Property) => l.approval_status === 'rejected');
        } else if (activeTab === 'changes_requested') {
            filtered = filtered.filter((l: Property) => l.approval_status === 'changes_requested');
        }

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter((l: Property) =>
                l.title.toLowerCase().includes(term) ||
                (l.description?.toLowerCase() || '').includes(term) ||
                (l.specific_location?.toLowerCase() || '').includes(term) ||
                (l.city?.name?.toLowerCase() || '').includes(term) ||
                (l.sub_city?.name?.toLowerCase() || '').includes(term)
            );
        }

        setFilteredListings(filtered);
    }, [searchTerm, activeTab, listings]);

    const handleDeleteListing = async () => {
        if (!deleteDialog.listingId) return;

        try {
            await listingsApi.deleteProperty(deleteDialog.listingId);
            toast.success(tSuccess('listingDeleted') || 'Listing deleted successfully');
            fetchMyListings();
        } catch (err) {
            toast.error(tErrors('failedToDeleteListing') || 'Failed to delete listing');
        } finally {
            setDeleteDialog({ open: false, listingId: null });
        }
    };

    const getStatusBadge = (property: Property) => {
        // Active listings with different approval statuses
        switch (property.approval_status) {
            case 'pending':
                return (
                    <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 text-xs px-2 py-0.5">
                        <Clock className="h-3 w-3 mr-1" />
                        {tMyListings('status.pendingReview')}
                    </Badge>
                );
            case 'approved':
                return (
                    <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-0.5">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {tMyListings('status.active')}
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 text-xs px-2 py-0.5">
                        <XCircle className="h-3 w-3 mr-1" />
                        {tMyListings('status.rejected')}
                    </Badge>
                );
            case 'changes_requested':
                return (
                    <Badge variant="warning" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 text-xs px-2 py-0.5">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {tMyListings('status.changesRequested')}
                    </Badge>
                );
            default:
                // If no approval_status but is_active, show as active
                return property.is_active ? (
                    <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-0.5">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {tMyListings('status.active')}
                    </Badge>
                ) : null;
        }
    };

    const handleReset = () => {
        setSearchTerm('');
        setActiveTab('all');
        setShowMobileFilters(false);
    };

    // Render PropertyCard with custom actions for user listings
    const renderPropertyCard = (property: Property) => {
        return (
            <div key={property.id} className="relative group">
                {/* Custom actions overlay for user listings */}
                <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 shadow-lg h-7 w-7 md:h-9 md:w-9"
                            >
                                <Eye className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <DropdownMenuItem onClick={() => router.push(`/listings/${property.id}`)} className="dark:text-gray-300 dark:hover:bg-gray-700">
                                <Eye className="h-4 w-4 mr-2" />
                                {tMyListings('actions.viewDetails')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/listings/${property.id}/edit`)} className="dark:text-gray-300 dark:hover:bg-gray-700">
                                <Edit className="h-4 w-4 mr-2" />
                                {tMyListings('actions.editListing')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700"
                                onClick={() => setDeleteDialog({ open: true, listingId: property.id })}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {tMyListings('actions.delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Status badge overlay */}
                <div className="absolute top-3 left-3 z-10">
                    {getStatusBadge(property)}
                </div>

                {/* Additional badges for featured/promoted */}
                {property.is_promoted && (
                    <div className="absolute top-10 left-3 z-10" style={{ top: property.is_featured ? '3.5rem' : '3rem' }}>
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 text-xs px-2 py-0.5">
                            {tMyListings('status.promoted')}
                        </Badge>
                    </div>
                )}

                {/* Property Card component */}
                <PropertyCard
                    property={property}
                    viewMode={viewMode === 'list' ? 'list' : 'grid'}
                    showComparisonButton={false}
                    showSaveButton={false}
                    showPromotionBadge={true}
                    showStatusBadge={false}
                    showFeatures={viewMode === 'list'}
                    className={viewMode === 'list' ? 'mb-4' : 'h-full'}
                />

                {/* Additional stats for user listings */}
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between text-sm text-gray-500 dark:text-gray-400 px-1 gap-2">
                    <div className="flex items-center flex-wrap gap-3 md:gap-4">
                        <div className="flex items-center">
                            <EyeIcon className="h-3 w-3 mr-1" />
                            <span className="text-xs md:text-sm">{property.views_count || 0} {tListings('stats.views')}</span>
                        </div>
                        <div className="flex items-center">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            <span className="text-xs md:text-sm">{property.inquiry_count || 0} {tListings('stats.inquiries')}</span>
                        </div>
                        <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span className="text-xs md:text-sm">{formatDate(property.created_at)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <Header />
            <div className="container mx-auto py-4 md:py-6 px-3 md:px-4">
                {/* Mobile Menu Toggle */}
                <div className="lg:hidden mb-6">
                    <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <div className="flex items-center gap-3">
                            <Menu className="h-5 w-5" />
                            <span className="font-medium">
                                {tCommon('myListings') || 'My Listings'}
                            </span>
                        </div>
                        <ChevronRight className={cn(
                            "h-5 w-5 transition-transform",
                            mobileMenuOpen ? "rotate-90" : ""
                        )} />
                    </Button>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar - Hidden on mobile, shown when menu is open */}
                    <div className={cn(
                        "lg:w-64 flex-shrink-0",
                        mobileMenuOpen ? "block" : "hidden lg:block"
                    )}>
                        <div className="sticky top-8 space-y-6 max-h-[calc(100vh-4rem)] overflow-visible">
                            {/* Quick Stats Card */}
                            <Card className="border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                                <CardContent className="p-4 md:p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        {tMyListings('listingOverview')}
                                    </h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: tMyListings('stats.totalListings'), value: stats.total, icon: Building2, color: 'text-blue-500' },
                                            { label: tMyListings('stats.active'), value: stats.active, icon: CheckCircle, color: 'text-green-500' },
                                            { label: tMyListings('stats.pending'), value: stats.pending, icon: Clock, color: 'text-yellow-500' },
                                            { label: tMyListings('stats.drafts'), value: stats.draft, icon: Clock, color: 'text-gray-500' },
                                            { label: tMyListings('stats.featured'), value: stats.featured, icon: TrendingUp, color: 'text-purple-500' },
                                            { label: tMyListings('stats.promoted'), value: stats.promoted, icon: DollarSign, color: 'text-amber-500' },
                                        ].map((stat, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
                                                </div>
                                                <span className="font-bold text-gray-900 dark:text-white">{stat.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions Card */}
                            <Card className="border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                                <CardContent className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        {tMyListings('quickActions')}
                                    </h3>
                                    <div className="space-y-2">
                                        <Button
                                            onClick={() => router.push('/listings/create')}
                                            className="w-full justify-start gap-2"
                                            size="sm"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {tMyListings('addNewListing')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={fetchMyListings}
                                            disabled={loading}
                                            className="w-full justify-start gap-2"
                                            size="sm"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                            {tMyListings('refreshList')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                                            className="w-full justify-start gap-2 lg:hidden"
                                            size="sm"
                                        >
                                            <Filter className="h-4 w-4" />
                                            {showMobileFilters ? tMyListings('hideFilters') : tMyListings('showFilters')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    {tCommon('myListings') || 'My Listings'}
                                </h1>
                                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 md:mt-2">
                                    {tMyListings('pageDescription')}
                                </p>
                            </div>

                            <div className="flex items-center space-x-2 md:space-x-3">
                                <Button
                                    variant="outline"
                                    onClick={fetchMyListings}
                                    disabled={loading}
                                    size="sm"
                                    className="gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    <span className="hidden sm:inline">{tMyListings('refresh')}</span>
                                </Button>
                                <Button
                                    onClick={() => router.push('/listings/create')}
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">{tMyListings('addNewListing')}</span>
                                </Button>
                            </div>
                        </div>

                        {/* Mobile Filters Overlay */}
                        {showMobileFilters && (
                            <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowMobileFilters(false)}>
                                <div className="absolute right-0 top-0 h-full w-3/4 max-w-sm bg-white dark:bg-gray-800 p-4 overflow-y-auto"
                                    onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tMyListings('filters')}</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowMobileFilters(false)}
                                            className="text-gray-500 dark:text-gray-400"
                                        >
                                            <XIcon className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        {/* Search */}
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder={tMyListings('searchPlaceholder')}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 pr-10"
                                            />
                                            {searchTerm && (
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                >
                                                    <XIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Tabs */}
                                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                            <TabsList className="grid grid-cols-3 w-full">
                                                <TabsTrigger value="all" className="text-xs">{tListings('filters.all') || 'All'}</TabsTrigger>
                                                <TabsTrigger value="draft" className="text-xs">{tMyListings('stats.active')}</TabsTrigger>
                                                <TabsTrigger value="pending" className="text-xs">{tMyListings('stats.pending')}</TabsTrigger>
                                                <TabsTrigger value="active" className="text-xs">{tMyListings('stats.drafts')}</TabsTrigger>
                                                <TabsTrigger value="featured" className="text-xs">{tMyListings('stats.featured')}</TabsTrigger>
                                                <TabsTrigger value="promoted" className="text-xs">{tMyListings('stats.promoted')}</TabsTrigger>
                                            </TabsList>
                                        </Tabs>

                                        {/* View Mode Toggle */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tMyListings('viewMode')}</span>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setViewMode('grid')}
                                                    className="h-8 w-8"
                                                >
                                                    <Grid className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant={viewMode === 'list' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setViewMode('list')}
                                                    className="h-8 w-8"
                                                >
                                                    <List className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleReset}
                                            className="w-full"
                                        >
                                            {tMyListings('resetFilters')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Search and Filter - Desktop */}
                        <Card className="mb-6 md:mb-8 border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
                            <CardContent className="p-4 md:p-6">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder={tMyListings('searchPlaceholder')}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 pr-10"
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                <XIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                                                <TabsList className="grid grid-cols-3 sm:inline-flex text-xs md:text-sm">
                                                    <TabsTrigger value="all" className="text-xs md:text-sm px-2 md:px-3">{tListings('filters.all') || 'All'}</TabsTrigger>
                                                    <TabsTrigger value="draft" className="text-xs md:text-sm px-2 md:px-3">{tMyListings('stats.active')}</TabsTrigger>
                                                    <TabsTrigger value="pending" className="text-xs md:text-sm px-2 md:px-3">{tMyListings('stats.pending')}</TabsTrigger>
                                                    <TabsTrigger value="active" className="text-xs md:text-sm px-2 md:px-3">{tMyListings('stats.drafts')}</TabsTrigger>
                                                    <TabsTrigger value="featured" className="text-xs md:text-sm px-2 md:px-3">{tMyListings('stats.featured')}</TabsTrigger>
                                                    <TabsTrigger value="promoted" className="text-xs md:text-sm px-2 md:px-3">{tMyListings('stats.promoted')}</TabsTrigger>
                                                </TabsList>
                                            </Tabs>

                                            {/* View Mode Toggle */}
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setViewMode('grid')}
                                                    className="h-8 w-8 md:h-9 md:w-9"
                                                >
                                                    <Grid className="h-3 w-3 md:h-4 md:w-4" />
                                                </Button>
                                                <Button
                                                    variant={viewMode === 'list' ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setViewMode('list')}
                                                    className="h-8 w-8 md:h-9 md:w-9"
                                                >
                                                    <List className="h-3 w-3 md:h-4 md:w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleReset}
                                            >
                                                {tMyListings('resetFilters')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Listings Grid */}
                        <div className="space-y-4 md:space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                                    {tMyListings('results.yourListings')} ({filteredListings.length})
                                </h2>
                                {filteredListings.length > 0 && (
                                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                        {tMyListings('results.showing', { showing: filteredListings.length, total: listings.length })}
                                    </p>
                                )}
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center h-48 md:h-64">
                                    <LoadingSpinner size="lg" />
                                </div>
                            ) : filteredListings.length === 0 ? (
                                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <CardContent className="py-8 md:py-12 text-center">
                                        <div className="mx-auto max-w-md">
                                            <Building2 className="h-10 w-10 md:h-12 md:w-12 mx-auto text-gray-400 mb-3 md:mb-4" />
                                            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                {searchTerm || activeTab !== 'all' 
                                                    ? tMyListings('emptyStates.noMatchingListings') 
                                                    : tMyListings('emptyStates.noListings')}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 md:mb-6">
                                                {searchTerm || activeTab !== 'all'
                                                    ? tMyListings('emptyStates.noMatchingDescription')
                                                    : tMyListings('emptyStates.startCreating')}
                                            </p>
                                            <Button
                                                onClick={() => router.push('/listings/create')}
                                                size="sm"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                {tMyListings('emptyStates.createFirstListing')}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : viewMode === 'list' ? (
                                // List View
                                <div className="space-y-4 md:space-y-6">
                                    {filteredListings.map((listing) => renderPropertyCard(listing))}
                                </div>
                            ) : (
                                // Grid View
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    {filteredListings.map((listing) => renderPropertyCard(listing))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, listingId: null })}>
                <DialogContent className="bg-white dark:bg-gray-800">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">{tMyListings('deleteListingTitle')}</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-400">
                            {tMyListings('deleteListingDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog({ open: false, listingId: null })}
                            className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {tMyListings('cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteListing}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {tMyListings('deleteListing')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyListingsPage;