'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
import Link from 'next/link'
import {
    Search,
    Filter,
    Home,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
    Eye,
    Star,
    TrendingUp
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
import toast from 'react-hot-toast'
import { Property } from '@/lib/types/property'

export default function PropertyManagement() {
    const queryClient = useQueryClient()
    const [filters, setFilters] = useState({
        search: '',
        property_type: '',
        status: '',
        is_verified: '',
        is_featured: '',
    })

    const { data: propertiesData, isLoading } = useQuery({
        queryKey: ['admin-properties', filters],
        queryFn: () => {
            // Prepare filters for API call
            const apiFilters: any = {
                search: filters.search || undefined,
                property_type: filters.property_type || undefined,
                status: filters.status || undefined,
                page_size: 50,
            }
            
            // Convert string boolean values to actual booleans
            if (filters.is_verified !== '') {
                apiFilters.is_verified = filters.is_verified === 'true'
            }
            
            if (filters.is_featured !== '') {
                apiFilters.is_featured = filters.is_featured === 'true'
            }
            
            return listingsApi.getProperties(apiFilters)
        },
    })

    const properties: Property[] = propertiesData?.results || []
    const totalCount = propertiesData?.count || 0

    const toggleFeaturedMutation = useMutation({
        mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
            // Implement API call to toggle featured status
            // You should add this to your listingsApi
            console.log('Toggling featured status:', id, featured)
            return { id, featured }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
            toast.success('Featured status updated')
        }
    })

    const toggleVerifiedMutation = useMutation({
        mutationFn: async ({ id, verified }: { id: number; verified: boolean }) => {
            // Implement API call to toggle verified status
            // You should add this to your listingsApi
            console.log('Toggling verified status:', id, verified)
            return { id, verified }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
            toast.success('Verification status updated')
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            // Use the existing deleteProperty function from listingsApi
            return listingsApi.deleteProperty(id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
            toast.success('Property deleted')
        },
        onError: () => {
            toast.error('Failed to delete property')
        }
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return <Badge className="bg-green-100 text-green-800">Available</Badge>
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
            case 'sold':
                return <Badge className="bg-red-100 text-red-800">Sold</Badge>
            case 'rented':
                return <Badge className="bg-blue-100 text-blue-800">Rented</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* Header and Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Property Management</h1>
                    <p className="text-muted-foreground">
                        Manage all properties listed on the platform ({totalCount} total)
                    </p>
                </div>
                <Button>
                    <Home className="mr-2 h-4 w-4" />
                    Add New Property
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-5">
                        <Input
                            placeholder="Search properties..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            startIcon={<Search className="h-4 w-4" />}
                        />
                        <Select
                            placeholder="Property Type"
                            value={filters.property_type}
                            onValueChange={(value) => setFilters({ ...filters, property_type: value })}
                            options={[
                                { value: '', label: 'All Types' },
                                { value: 'house', label: 'House' },
                                { value: 'apartment', label: 'Apartment' },
                                { value: 'commercial', label: 'Commercial' },
                                { value: 'land', label: 'Land' },
                            ]}
                        />
                        <Select
                            placeholder="Status"
                            value={filters.status}
                            onValueChange={(value) => setFilters({ ...filters, status: value })}
                            options={[
                                { value: '', label: 'All Status' },
                                { value: 'available', label: 'Available' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'sold', label: 'Sold' },
                                { value: 'rented', label: 'Rented' },
                            ]}
                        />
                        <Select
                            placeholder="Verification"
                            value={filters.is_verified}
                            onValueChange={(value) => setFilters({ ...filters, is_verified: value })}
                            options={[
                                { value: '', label: 'All' },
                                { value: 'true', label: 'Verified' },
                                { value: 'false', label: 'Not Verified' },
                            ]}
                        />
                        <Select
                            placeholder="Featured"
                            value={filters.is_featured}
                            onValueChange={(value) => setFilters({ ...filters, is_featured: value })}
                            options={[
                                { value: '', label: 'All' },
                                { value: 'true', label: 'Featured' },
                                { value: 'false', label: 'Not Featured' },
                            ]}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Properties Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Properties</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="space-y-3 p-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
                            ))}
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="p-6 text-center">
                            <Home className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h4 className="mt-4 text-lg font-semibold">No properties found</h4>
                            <p className="text-muted-foreground">No properties match your filters.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="px-6 py-3 text-left text-sm font-medium">Property</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium">Type</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium">Price</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium">Verification</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium">Featured</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {properties.map((property: Property) => (
                                        <tr key={property.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/listings/${property.id}`}
                                                            className="font-medium hover:text-primary"
                                                        >
                                                            {property.title}
                                                        </Link>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {property.city?.name}, {property.sub_city?.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Listed: {formatDate(property.created_at)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="capitalize">
                                                    {property.property_type}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                {formatCurrency(property.price_etb)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(property.property_status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    size="sm"
                                                    variant={property.is_verified ? "default" : "outline"}
                                                    onClick={() => toggleVerifiedMutation.mutate({
                                                        id: property.id,
                                                        verified: !property.is_verified
                                                    })}
                                                    disabled={toggleVerifiedMutation.isPending}
                                                >
                                                    {property.is_verified ? (
                                                        <>
                                                            <CheckCircle className="mr-2 h-3 w-3" />
                                                            Verified
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="mr-2 h-3 w-3" />
                                                            Not Verified
                                                        </>
                                                    )}
                                                </Button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    size="sm"
                                                    variant={property.is_featured ? "default" : "outline"}
                                                    onClick={() => toggleFeaturedMutation.mutate({
                                                        id: property.id,
                                                        featured: !property.is_featured
                                                    })}
                                                    disabled={toggleFeaturedMutation.isPending}
                                                >
                                                    {property.is_featured ? (
                                                        <>
                                                            <Star className="mr-2 h-3 w-3" />
                                                            Featured
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Star className="mr-2 h-3 w-3" />
                                                            Feature
                                                        </>
                                                    )}
                                                </Button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        asChild
                                                    >
                                                        <Link href={`/listings/${property.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        asChild
                                                    >
                                                        <Link href={`/admin/properties/${property.id}/edit`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this property?')) {
                                                                deleteMutation.mutate(property.id)
                                                            }
                                                        }}
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Properties</p>
                                <p className="text-2xl font-bold">{totalCount}</p>
                            </div>
                            <Home className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Verified</p>
                                <p className="text-2xl font-bold">
                                    {properties.filter((p: Property) => p.is_verified).length}
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
                                <p className="text-sm text-muted-foreground">Featured</p>
                                <p className="text-2xl font-bold">
                                    {properties.filter((p: Property) => p.is_featured).length}
                                </p>
                            </div>
                            <Star className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Avg. Price</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(
                                        properties.reduce((acc: number, p: Property) => acc + p.price_etb, 0) / (properties.length || 1)
                                    )}
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}