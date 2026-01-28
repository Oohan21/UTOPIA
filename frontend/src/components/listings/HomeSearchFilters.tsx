// components/listings/HomeSearchFilters.tsx
'use client'

import React, { useState } from 'react'
import { useSearchStore } from '@/lib/store/searchStore'
import { listingsApi } from '@/lib/api/listings'
import SearchHistory from '@/components/listings/SearchHistory'
import { useQuery } from '@tanstack/react-query'
import {
    PROPERTY_TYPES,
    LISTING_TYPES,
} from '@/lib/utils/constants'
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { City } from '@/lib/types/property'

export default function HomeSearchFilters() {
    const { setFilters } = useSearchStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [propertyType, setPropertyType] = useState('')
    const [listingType, setListingType] = useState('')
    const [city, setCity] = useState<number>()

    // Fetch cities
    const { data: citiesData } = useQuery({
        queryKey: ['cities'],
        queryFn: () => listingsApi.getCities(),
    })

    const cities: City[] = Array.isArray(citiesData) ? citiesData : []

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()

        const filters: any = {}
        if (searchQuery) filters.search = searchQuery
        if (propertyType) filters.property_type = propertyType
        if (listingType) filters.listing_type = listingType
        if (city) filters.city = city

        setFilters(filters)

        // Navigate to listings page with filters
        window.location.href = `/listings?${new URLSearchParams(filters).toString()}`
    }

    const cityOptions = cities.map((city) => ({
        value: city.id.toString(),
        label: city.name,
    }))

    return (
        <div className="rounded-lg border bg-card p-4">
            <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                        <SearchHistory
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onSelectSearch={(filters) => {
                                if (filters.search !== undefined) {
                                    setSearchQuery(filters.search)
                                    // Navigate to listings with the search query
                                    const searchParams = new URLSearchParams()
                                    if (filters.search) searchParams.set('search', filters.search)
                                    if (propertyType) searchParams.set('property_type', propertyType)
                                    if (listingType) searchParams.set('listing_type', listingType)
                                    window.location.href = `/listings?${searchParams.toString()}`
                                }
                            }}
                        />
                    </div>

                    {/* Property Type */}
                    <Select
                        placeholder="Property Type"
                        value={propertyType}
                        onValueChange={setPropertyType}
                        options={PROPERTY_TYPES}
                    />

                    {/* Listing Type */}
                    <Select
                        placeholder="Listing Type"
                        value={listingType}
                        onValueChange={setListingType}
                        options={LISTING_TYPES}
                    />
                </div>

                <div className="flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearchQuery('')
                            setPropertyType('')
                            setListingType('')
                            setCity(undefined)
                        }}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                    <Button type="submit" size="sm">
                        <Search className="mr-2 h-4 w-4" />
                        Search
                    </Button>
                </div>
            </form>
        </div>
    )
}