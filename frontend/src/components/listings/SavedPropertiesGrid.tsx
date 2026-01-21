// src/components/listings/SavedPropertiesGrid.tsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HeartOff, Eye, MessageSquare, MapPin } from 'lucide-react';
import { useSavedProperties } from '@/lib/hooks/useSavedProperties';
import PropertyGallery from '@/components/listings/PropertyGallery';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { Skeleton } from '@/components/ui/Skeleton';
import { Property } from '@/lib/types/property';

export const SavedPropertiesGrid: React.FC = () => {
    const { 
        savedProperties, 
        isLoading, 
        error, 
        toggleSaveProperty,
        refreshSavedProperties 
    } = useSavedProperties();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-48 w-full" />
                        <CardContent className="p-4">
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2 mb-4" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={refreshSavedProperties}>
                    Try Again
                </Button>
            </div>
        );
    }

    if (savedProperties.length === 0) {
        return (
            <div className="text-center py-12">
                <HeartOff className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No saved properties yet
                </h3>
                <p className="text-gray-600 mb-6">
                    Save properties you're interested in to view them here
                </p>
                <Button asChild>
                    <a href="/listings">Browse Properties</a>
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProperties.map((property: Property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                        <PropertyGallery 
                            images={property.images || []} 
                            propertyTitle={property.title}
                            propertyVideo={property.property_video}
                            propertyId={property.id}
                            showThumbnails={false}
                        />
                        
                        {/* Tracking badge */}
                        {property.tracking_info && (
                            <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded capitalize">
                                {property.tracking_info.tracking_type}
                            </div>
                        )}
                        
                        {/* Save button */}
                        <button
                            onClick={() => toggleSaveProperty(property)}
                            className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                            aria-label="Remove from saved"
                        >
                            <HeartOff className="h-5 w-5 text-red-500 fill-current" />
                        </button>
                    </div>
                    
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg line-clamp-1 flex-1 mr-2">
                                {property.title}
                            </h3>
                            <span className="font-bold text-lg whitespace-nowrap">
                                {property.listing_type === 'for_rent' 
                                    ? property.monthly_rent 
                                        ? `${formatCurrency(property.monthly_rent)}/month`
                                        : 'Price on request'
                                    : formatCurrency(property.price_etb)
                                }
                            </span>
                        </div>
                        
                        <div className="flex items-center text-gray-600 text-sm mb-3">
                            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="line-clamp-1">
                                {property.city?.name || 'Unknown'} • {property.sub_city?.name || 'Unknown'}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="text-center">
                                <div className="font-semibold">{property.bedrooms || 0}</div>
                                <div className="text-xs text-gray-600">Beds</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold">{property.bathrooms || 0}</div>
                                <div className="text-xs text-gray-600">Baths</div>
                            </div>
                            <div className="text-center">
                                <div className="font-semibold">{property.total_area || 0}</div>
                                <div className="text-xs text-gray-600">m²</div>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                asChild
                                className="flex-1"
                            >
                                <a href={`/properties/${property.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                </a>
                            </Button>
                            
                            <Button 
                                size="sm"
                                asChild
                                className="flex-1"
                            >
                                <a href={`/properties/${property.id}?tab=inquiry`}>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Inquire
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};