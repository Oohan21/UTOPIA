// Create a new file: components/SavePropertyButton.tsx
'use client'; // Add this at the top

import React, { useState } from 'react';
import { Heart, HeartOff } from 'lucide-react';
import { Property } from '@/lib/types/property';
import { listingsApi } from '@/lib/api/listings';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';

interface SavePropertyButtonProps {
    property: Property;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showCount?: boolean;
    className?: string;
}

export const SavePropertyButton: React.FC<SavePropertyButtonProps> = ({
    property,
    variant = 'ghost',
    size = 'icon',
    showCount = false,
    className = ''
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(property.is_saved || false);
    const [saveCount, setSaveCount] = useState(property.save_count || 0);
    const { toast } = useToast();

    const handleSaveToggle = async () => {
        if (isLoading) return;
        
        setIsLoading(true);
        try {
            if (isSaved) {
                // Unsave
                await listingsApi.unsaveProperty(property.id);
                setSaveCount(prev => Math.max(0, prev - 1));
                setIsSaved(false);
                toast({
                    title: "Removed from saved",
                    description: "Property removed from your saved list",
                });
            } else {
                // Save
                await listingsApi.saveProperty(property.id);
                setSaveCount(prev => prev + 1);
                setIsSaved(true);
                toast({
                    title: "Property saved",
                    description: "Property added to your saved list",
                });
            }
        } catch (error: any) {
            console.error('Error toggling save:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to save property",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleSaveToggle}
            disabled={isLoading}
            className={`relative ${className}`}
            aria-label={isSaved ? "Remove from saved" : "Save property"}
        >
            {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isSaved ? (
                <HeartOff className="h-4 w-4 fill-current text-red-500" />
            ) : (
                <Heart className="h-4 w-4" />
            )}
            
            {showCount && saveCount > 0 && (
                <span className="ml-2 text-sm">{saveCount}</span>
            )}
            
            {!showCount && (
                <span className="sr-only">
                    {isSaved ? "Remove from saved" : "Save property"}
                </span>
            )}
        </Button>
    );
};