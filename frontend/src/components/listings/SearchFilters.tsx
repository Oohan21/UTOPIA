// components/listings/SearchFilters.tsx
import React, { useState } from 'react'
import { useSearchStore } from '@/lib/store/searchStore'
import { listingsApi } from '@/lib/api/listings'
import { useQuery } from '@tanstack/react-query'
import {
    PROPERTY_TYPES,
    LISTING_TYPES,
    BEDROOM_OPTIONS,
    BATHROOM_OPTIONS,
    FURNISHING_TYPES,
    SORT_OPTIONS
} from '@/lib/utils/constants'
import { Search, Filter, X, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Label } from '@/components/ui/Label'
import { City, SubCity, PropertyFilters } from '@/lib/types/property'

// Define the props interface
interface SearchFiltersProps {
  filters: PropertyFilters;
  onChange: (newFilters: Partial<PropertyFilters>) => void;
}

export default function SearchFilters({ filters, onChange }: SearchFiltersProps) {
    const { saveSearch } = useSearchStore()
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
    const [saveDialogOpen, setSaveDialogOpen] = useState(false)
    const [searchName, setSearchName] = useState('')

    // Fetch cities
    const { data: citiesData, isLoading: isLoadingCities } = useQuery({
        queryKey: ['cities'],
        queryFn: () => listingsApi.getCities(),
    })

    const cities: City[] = Array.isArray(citiesData) ? citiesData : []

    // Fetch sub-cities when city is selected
    const { data: subCitiesData, isLoading: isLoadingSubCities } = useQuery({
        queryKey: ['subCities', filters.city],
        queryFn: () => listingsApi.getSubCities(filters.city),
        enabled: !!filters.city,
    })

    const subCities: SubCity[] = Array.isArray(subCitiesData) ? subCitiesData : []

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // Trigger search by updating filters
        onChange(filters) // Call the onChange prop with current filters
    }

    const handleReset = () => {
        onChange({
            search: '',
            min_price: undefined,
            max_price: undefined,
            min_bedrooms: undefined,
            max_bedrooms: undefined,
            min_area: undefined,
            max_area: undefined,
            listing_type: undefined,
            property_type: undefined,
            city: undefined,
            sub_city: undefined,
            has_parking: undefined,
            has_garden: undefined,
            has_security: undefined,
            has_furniture: undefined,
            is_featured: undefined,
            is_verified: undefined,
            min_bathrooms: undefined,
            furnishing_type: undefined,
            built_year: undefined,
        })
    }

    const handleSaveSearch = async () => {
        if (!searchName.trim()) return

        await saveSearch(searchName)
        setSearchName('')
        setSaveDialogOpen(false)
    }

    const handleInputChange = (updates: Partial<PropertyFilters>) => {
        onChange(updates)
    }

    const cityOptions = cities.map((city) => ({
        value: city.id.toString(),
        label: city.name,
    }))

    const subCityOptions = subCities.map((subCity) => ({
        value: subCity.id.toString(),
        label: subCity.name,
    }))

    return (
        <div className="rounded-lg border bg-card p-4">
            <form onSubmit={handleSearch} className="space-y-4">
                {/* Main Search */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Search Input */}
                    <div className="lg:col-span-2">
                        <Input
                            placeholder="Search properties, locations, keywords..."
                            value={filters.search || ''}
                            onChange={(e) => handleInputChange({ search: e.target.value })}
                            className="h-11"
                            startIcon={<Search className="h-4 w-4" />}
                        />
                    </div>

                    {/* Property Type */}
                    <Select
                        placeholder="Property Type"
                        value={filters.property_type}
                        onValueChange={(value) => handleInputChange({ property_type: value })}
                        options={PROPERTY_TYPES}
                    />

                    {/* Listing Type */}
                    <Select
                        placeholder="Listing Type"
                        value={filters.listing_type}
                        onValueChange={(value) => handleInputChange({ listing_type: value })}
                        options={LISTING_TYPES}
                    />
                </div>

                {/* Advanced Filters Toggle */}
                <div className="flex items-center justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        {isAdvancedOpen ? 'Hide' : 'Show'} Advanced Filters
                        {isAdvancedOpen ? (
                            <ChevronUp className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                    <div className="flex items-center gap-2">
                        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="outline" size="sm">
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Search
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Save Search</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label htmlFor="search-name">Search Name</Label>
                                        <Input
                                            id="search-name"
                                            value={searchName}
                                            onChange={(e) => setSearchName(e.target.value)}
                                            placeholder="My search..."
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setSaveDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSaveSearch} disabled={!searchName.trim()}>
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                        <Button type="submit" size="sm">
                            <Search className="mr-2 h-4 w-4" />
                            Search
                        </Button>
                    </div>
                </div>

                {/* Advanced Filters */}
                {isAdvancedOpen && (
                    <div className="grid gap-4 border-t pt-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Location */}
                        <Select
                            placeholder="City"
                            value={filters.city?.toString()}
                            onValueChange={(value) => handleInputChange({ 
                                city: parseInt(value), 
                                sub_city: undefined 
                            })}
                            options={cityOptions}
                            disabled={isLoadingCities}
                        />

                        <Select
                            placeholder="Sub City"
                            value={filters.sub_city?.toString()}
                            onValueChange={(value) => handleInputChange({ sub_city: parseInt(value) })}
                            options={subCityOptions}
                            disabled={!filters.city || isLoadingSubCities}
                        />

                        {/* Price Range */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">Price Range (ETB)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.min_price || ''}
                                    onChange={(e) => handleInputChange({ 
                                        min_price: e.target.value ? parseInt(e.target.value) : undefined 
                                    })}
                                />
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.max_price || ''}
                                    onChange={(e) => handleInputChange({ 
                                        max_price: e.target.value ? parseInt(e.target.value) : undefined 
                                    })}
                                />
                            </div>
                        </div>

                        {/* Bedrooms & Bathrooms */}
                        <div className="grid grid-cols-2 gap-2">
                            <Select
                                placeholder="Bedrooms"
                                value={filters.min_bedrooms?.toString()}
                                onValueChange={(value) => handleInputChange({ min_bedrooms: parseInt(value) })}
                                options={BEDROOM_OPTIONS}
                            />
                            <Select
                                placeholder="Bathrooms"
                                value={filters.min_bathrooms?.toString()}
                                onValueChange={(value) => handleInputChange({ min_bathrooms: parseInt(value) })}
                                options={BATHROOM_OPTIONS}
                            />
                        </div>

                        {/* Area Range */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">Area (m²)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.min_area || ''}
                                    onChange={(e) => handleInputChange({ 
                                        min_area: e.target.value ? parseInt(e.target.value) : undefined 
                                    })}
                                />
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.max_area || ''}
                                    onChange={(e) => handleInputChange({ 
                                        max_area: e.target.value ? parseInt(e.target.value) : undefined 
                                    })}
                                />
                            </div>
                        </div>

                        {/* Furnishing Type */}
                        <Select
                            placeholder="Furnishing"
                            value={filters.furnishing_type}
                            onValueChange={(value) => handleInputChange({ furnishing_type: value })}
                            options={FURNISHING_TYPES}
                        />

                        {/* Built Year */}
                        <Input
                            type="number"
                            placeholder="Built Year"
                            value={filters.built_year || ''}
                            onChange={(e) => handleInputChange({ 
                                built_year: e.target.value ? parseInt(e.target.value) : undefined 
                            })}
                            min="1800"
                            max="2100"
                        />

                        {/* Features */}
                        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="parking"
                                    checked={filters.has_parking || false}
                                    onCheckedChange={(checked) => handleInputChange({ has_parking: checked as boolean })}
                                />
                                <label htmlFor="parking" className="text-sm cursor-pointer">Parking</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="garden"
                                    checked={filters.has_garden || false}
                                    onCheckedChange={(checked) => handleInputChange({ has_garden: checked as boolean })}
                                />
                                <label htmlFor="garden" className="text-sm cursor-pointer">Garden</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="security"
                                    checked={filters.has_security || false}
                                    onCheckedChange={(checked) => handleInputChange({ has_security: checked as boolean })}
                                />
                                <label htmlFor="security" className="text-sm cursor-pointer">Security</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="furniture"
                                    checked={filters.has_furniture || false}
                                    onCheckedChange={(checked) => handleInputChange({ has_furniture: checked as boolean })}
                                />
                                <label htmlFor="furniture" className="text-sm cursor-pointer">Furnished</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="aircon"
                                    checked={false}
                                    onCheckedChange={() => {
                                        // Add air conditioning filter if needed
                                    }}
                                />
                                <label htmlFor="aircon" className="text-sm cursor-pointer">Air Conditioning</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="pet_friendly"
                                    checked={false}
                                    onCheckedChange={() => {
                                        // Add pet friendly filter if needed
                                    }}
                                />
                                <label htmlFor="pet_friendly" className="text-sm cursor-pointer">Pet Friendly</label>
                            </div>
                        </div>

                        {/* Verification & Premium */}
                        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="featured"
                                    checked={filters.is_featured || false}
                                    onCheckedChange={(checked) => handleInputChange({ is_featured: checked as boolean })}
                                />
                                <label htmlFor="featured" className="text-sm cursor-pointer">Featured Only</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="verified"
                                    checked={filters.is_verified || false}
                                    onCheckedChange={(checked) => handleInputChange({ is_verified: checked as boolean })}
                                />
                                <label htmlFor="verified" className="text-sm cursor-pointer">Verified Only</label>
                            </div>
                        </div>

                        {/* Sort */}
                        <Select
                            placeholder="Sort By"
                            value={filters.sort_by}
                            onValueChange={(value) => handleInputChange({ sort_by: value })}
                            options={SORT_OPTIONS}
                        />
                    </div>
                )}
            </form>
        </div>
    )
}