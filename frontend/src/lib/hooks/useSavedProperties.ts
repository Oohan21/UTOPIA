// src/lib/hooks/useSavedProperties.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Property } from '@/lib/types/property';
import { listingsApi } from '@/lib/api/listings';

interface UseSavedPropertiesReturn {
    savedProperties: Property[];
    isLoading: boolean;
    error: string | null;
    isPropertySaved: (propertyId: number) => boolean;
    toggleSaveProperty: (property: Property) => Promise<void>;
    refreshSavedProperties: () => Promise<void>;
}

export const useSavedProperties = (): UseSavedPropertiesReturn => {
    const [savedProperties, setSavedProperties] = useState<Property[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch saved properties
    const fetchSavedProperties = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await listingsApi.getSavedProperties();
            setSavedProperties(response.results || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch saved properties');
            console.error('Error fetching saved properties:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check if a property is saved
    const isPropertySaved = useCallback((propertyId: number): boolean => {
        return savedProperties.some(prop => prop.id === propertyId);
    }, [savedProperties]);

    // Toggle save status for a property
    const toggleSaveProperty = useCallback(async (property: Property) => {
        try {
            const isCurrentlySaved = isPropertySaved(property.id);
            
            if (isCurrentlySaved) {
                await listingsApi.unsaveProperty(property.id);
                setSavedProperties(prev => 
                    prev.filter(p => p.id !== property.id)
                );
            } else {
                await listingsApi.saveProperty(property.id);
                // Add to saved properties list
                setSavedProperties(prev => [
                    { ...property, is_saved: true, save_count: property.save_count + 1 },
                    ...prev
                ]);
            }
        } catch (err: any) {
            console.error('Error toggling save property:', err);
            throw err;
        }
    }, [isPropertySaved]);

    // Initial fetch
    useEffect(() => {
        fetchSavedProperties();
    }, [fetchSavedProperties]);

    return {
        savedProperties,
        isLoading,
        error,
        isPropertySaved,
        toggleSaveProperty,
        refreshSavedProperties: fetchSavedProperties
    };
};