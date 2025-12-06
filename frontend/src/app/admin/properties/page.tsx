'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
import { adminApi } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
    Building2,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    Star,
    TrendingUp,
    Home,
    Building,
    Download,
    MoreVertical,
    Warehouse,
    Hotel,
    Trees,
    Briefcase
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils/formatCurrency'

const PROPERTY_TYPES = [
    { value: 'house', label: 'House' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'land', label: 'Land' },
    { value: 'office', label: 'Office' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'farm', label: 'Farm' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'other', label: 'Other' },
]

const PROPERTY_STATUS = [
    { value: 'available', label: 'Available' },
    { value: 'pending', label: 'Pending' },
    { value: 'sold', label: 'Sold' },
    { value: 'rented', label: 'Rented' },
    { value: 'off_market', label: 'Off Market' },
]

export default function AdminPropertiesPage() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [propertyType, setPropertyType] = useState('')
    const [propertyStatus, setPropertyStatus] = useState('')
    const [page, setPage] = useState(1)
    const pageSize = 20

    const { data: propertiesData, isLoading } = useQuery({
        queryKey: ['admin-properties', { search, propertyType, propertyStatus, page }],
        queryFn: () => adminApi.getPropertiesAdmin({
            search,
            property_type: propertyType || undefined,
            property_status: propertyStatus || undefined,
            page,
            page_size: pageSize
        }),
    })

    const deletePropertyMutation = useMutation({
        mutationFn: (propertyId: number) => adminApi.deletePropertyAdmin(propertyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
            toast.success('Property deleted successfully')
        },
        onError: () => {
            toast.error('Failed to delete property')
        },
    })

    const updatePropertyMutation = useMutation({
        mutationFn: ({ propertyId, data }: { propertyId: number; data: any }) =>
            adminApi.updatePropertyAdmin(propertyId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
            toast.success('Property updated successfully')
        },
        onError: () => {
            toast.error('Failed to update property')
        },
    })

    const properties = propertiesData?.results || []
    const totalCount = propertiesData?.count || 0
    const totalPages = Math.ceil(totalCount / pageSize)

    const handleDeleteProperty = (propertyId: number, title: string) => {
        if (window.confirm(`Are you sure you want to delete property "${title}"? This action cannot be undone.`)) {
            deletePropertyMutation.mutate(propertyId)
        }
    }

    const handleToggleFeatured = (property: any) => {
        updatePropertyMutation.mutate({
            propertyId: property.id,
            data: { is_featured: !property.is_featured }
        })
    }

    const handleToggleVerified = (property: any) => {
        updatePropertyMutation.mutate({
            propertyId: property.id,
            data: { is_verified: !property.is_verified }
        })
    }

    const handleToggleActive = (property: any) => {
        updatePropertyMutation.mutate({
            propertyId: property.id,
            data: { is_active: !property.is_active }
        })
    }

    const handleExportProperties = async () => {
        try {
            const blob = await adminApi.exportData('properties', 'csv')
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `properties-export-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success('Properties exported successfully')
        } catch (error) {
            toast.error('Failed to export properties')
        }
    }

    const getPropertyTypeIcon = (type: string) => {
        const icons: Record<string, React.ReactNode> = {
            house: <Home className="h-4 w-4" />,
            apartment: <Home className="h-4 w-4" />, 
            commercial: <Building className="h-4 w-4" />,
            land: <Trees className="h-4 w-4" />,
            villa: <Home className="h-4 w-4" />,
            office: <Briefcase className="h-4 w-4" />,
            warehouse: <Warehouse className="h-4 w-4" />,
            farm: <Trees className="h-4 w-4" />,
            hotel: <Hotel className="h-4 w-4" />,
        }
        return icons[type] || <Building2 className="h-4 w-4" />
    }

    const getPropertyTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            house: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            apartment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            commercial: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            land: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            villa: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            office: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
            warehouse: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
            farm: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
            hotel: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
        }
        return colors[type] || 'bg-gray-100 text-gray-800'
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            sold: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            rented: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            off_market: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Property Management</h1>
                    <p className="text-muted-foreground">
                        Manage properties, listings, and property-related operations
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportProperties}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button asChild>
                        <Link href="/admin/properties/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Property
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">Search</label>
                            <Input
                                placeholder="Search properties..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">Property Type</label>
                            <Select
                                placeholder="All types"
                                options={PROPERTY_TYPES}
                                value={propertyType}
                                onValueChange={setPropertyType}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">Status</label>
                            <Select
                                placeholder="All status"
                                options={PROPERTY_STATUS}
                                value={propertyStatus}
                                onValueChange={setPropertyStatus}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">Featured</label>
                            <Select
                                placeholder="All"
                                options={[
                                    { value: 'true', label: 'Featured' },
                                    { value: 'false', label: 'Not Featured' },
                                ]}
                                value=""
                                onValueChange={() => { }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Properties Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Properties ({totalCount})
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="text-center">
                                <div className="mb-4 animate-spin">
                                    <Building2 className="h-8 w-8 text-primary" />
                                </div>
                                <p>Loading properties...</p>
                            </div>
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="flex h-64 items-center justify-center">
                            <div className="text-center">
                                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-4 text-gray-500">No properties found</p>
                                {search && (
                                    <p className="text-sm text-gray-400">Try adjusting your search filters</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-3 text-left">Property</th>
                                        <th className="px-4 py-3 text-left">Type & Location</th>
                                        <th className="px-4 py-3 text-left">Price</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Stats</th>
                                        <th className="px-4 py-3 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {properties.map((property: any) => (
                                        <tr key={property.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                                                        {property.images?.[0]?.image ? (
                                                            <img
                                                                src={property.images[0].image}
                                                                alt={property.title}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <Building2 className="h-8 w-8 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium line-clamp-1">{property.title}</p>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            {property.is_featured && (
                                                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                                                                    <Star className="mr-1 h-3 w-3" />
                                                                    Featured
                                                                </Badge>
                                                            )}
                                                            {property.is_verified && (
                                                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                                                    <CheckCircle className="mr-1 h-3 w-3" />
                                                                    Verified
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        {getPropertyTypeIcon(property.property_type)}
                                                        <Badge className={`capitalize ${getPropertyTypeColor(property.property_type)}`}>
                                                            {property.property_type}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {property.city?.name}, {property.sub_city?.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {property.bedrooms} bed • {property.bathrooms} bath • {property.total_area}m²
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-lg">
                                                        {formatCurrency(property.price_etb)}
                                                    </p>
                                                    {property.listing_type === 'for_rent' && property.monthly_rent && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatCurrency(property.monthly_rent)}/month
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-2">
                                                    <Badge className={`capitalize ${getStatusColor(property.property_status)}`}>
                                                        {property.property_status}
                                                    </Badge>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            {property.is_active ? (
                                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4 text-red-500" />
                                                            )}
                                                            <span>{property.is_active ? 'Active' : 'Inactive'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="h-4 w-4" />
                                                        <span>{property.views_count || 0} views</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <TrendingUp className="h-4 w-4" />
                                                        <span>{property.inquiry_count || 0} inquiries</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Listed: {new Date(property.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/admin/properties/${property.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/admin/properties/${property.id}/edit`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleToggleFeatured(property)}>
                                                                {property.is_featured ? (
                                                                    <>
                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                        Remove Featured
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Star className="mr-2 h-4 w-4" />
                                                                        Mark as Featured
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleToggleVerified(property)}>
                                                                {property.is_verified ? (
                                                                    <>
                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                        Unverify
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                        Verify
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleToggleActive(property)}>
                                                                {property.is_active ? (
                                                                    <>
                                                                        <XCircle className="mr-2 h-4 w-4" />
                                                                        Deactivate
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                                        Activate
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProperty(property.id, property.title)}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
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

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} properties
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                const pageNum = i + 1
                                                if (totalPages <= 5) return pageNum
                                                if (page <= 3) return i + 1
                                                if (page >= totalPages - 2) return totalPages - 4 + i
                                                return page - 2 + i
                                            }).map((pageNum) => (
                                                <Button
                                                    key={pageNum}
                                                    variant={page === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </Button>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            disabled={page === totalPages}
                                            onClick={() => setPage(page + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Properties</p>
                            <p className="text-3xl font-bold">{totalCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Featured</p>
                            <p className="text-3xl font-bold">
                                {properties.filter((p: any) => p.is_featured).length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Verified</p>
                            <p className="text-3xl font-bold">
                                {properties.filter((p: any) => p.is_verified).length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">For Sale</p>
                            <p className="text-3xl font-bold">
                                {properties.filter((p: any) => p.listing_type === 'for_sale').length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}