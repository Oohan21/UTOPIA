'use client'

import React, { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Map } from 'leaflet'

// Dynamically import Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />
})

const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), {
  ssr: false
})

const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), {
  ssr: false
})

const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), {
  ssr: false
})

interface PropertyMapProps {
  latitude: number | string | null | undefined
  longitude: number | string | null | undefined
  title: string
  address: string
  city: string
  subCity: string
  price: string
  propertyType: string
  showControls?: boolean
  className?: string
  zoom?: number
}

// Helper functions...
const parseCoordinate = (coord: number | string | null | undefined): number | null => {
  if (coord === null || coord === undefined || coord === '') {
    return null
  }
  
  const num = typeof coord === 'string' ? parseFloat(coord) : coord
  
  if (isNaN(num as number)) {
    return null
  }
  
  return Number(num)
}

const formatCoordinate = (coord: number | string | null | undefined): string => {
  const parsed = parseCoordinate(coord)
  
  if (parsed === null) {
    return 'N/A'
  }
  
  return parsed.toFixed(6)
}

export function PropertyMap({
  latitude,
  longitude,
  title,
  address,
  city,
  subCity,
  price,
  propertyType,
  showControls = true,
  className = 'h-80',
  zoom = 15
}: PropertyMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const mapRef = useRef<Map | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Parse coordinates
  const parsedLat = parseCoordinate(latitude)
  const parsedLng = parseCoordinate(longitude)
  
  const isValidLocation = (
    parsedLat !== null && 
    parsedLng !== null &&
    Math.abs(parsedLat) <= 90 &&
    Math.abs(parsedLng) <= 180
  )

  // Set map as ready after a small delay
  useEffect(() => {
    if (isClient && isValidLocation && !isMapReady) {
      const timer = setTimeout(() => {
        setIsMapReady(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isClient, isValidLocation, isMapReady])

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Handle directions...
  const handleGetDirections = () => {
    if (!isValidLocation || !parsedLat || !parsedLng) return
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${parsedLat},${parsedLng}`
    window.open(url, '_blank')
  }

  const handleShareLocation = () => {
    if (!isValidLocation || !parsedLat || !parsedLng) return
    
    const text = `Check out this property at ${title} - ${address}, ${subCity}, ${city}`
    const url = `https://www.google.com/maps?q=${parsedLat},${parsedLng}`
    
    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
        url: url,
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(url)
        .then(() => alert('Location link copied to clipboard!'))
        .catch(console.error)
    }
  }

  const handleViewOnGoogleMaps = () => {
    if (!isValidLocation || !parsedLat || !parsedLng) return
    
    const url = `https://www.google.com/maps?q=${parsedLat},${parsedLng}`
    window.open(url, '_blank')
  }

  // Reset view function
  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.setView([parsedLat!, parsedLng!], zoom)
    }
  }

  if (!isClient) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Map
          </CardTitle>
          <CardDescription>
            Loading map...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (!isValidLocation) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Map
          </CardTitle>
          <CardDescription>
            Location coordinates not available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
            <div className="text-center">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No location data available
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                The property owner hasn't provided exact coordinates
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const propertyCenter: [number, number] = [parsedLat!, parsedLng!]

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Location & Map</CardTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{subCity}, {city}</span>
                <Badge variant="outline" className="text-xs">
                  {propertyType}
                </Badge>
              </div>
            </div>
          </div>
          {showControls && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetDirections}
                className="gap-1.5"
              >
                <Navigation className="h-4 w-4" />
                Directions
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Interactive Map */}
        <div className="rounded-lg overflow-hidden border border-border shadow-lg relative" style={{ height: '256px' }}>
          {isMapReady && (
            <MapContainer
              key={`${parsedLat}-${parsedLng}-${Date.now()}`}
              center={propertyCenter}
              zoom={zoom}
              className="h-full w-full rounded-lg"
              scrollWheelZoom={true}
              zoomControl={true}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetmap.org</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={propertyCenter}>
                <Popup>
                  <div className="p-2">
                    <div className="font-semibold text-sm mb-1">{title}</div>
                    <div className="text-xs text-muted-foreground mb-1">{address}</div>
                    <div className="text-xs font-medium text-primary">{price}</div>
                    <div className="text-xs mt-2">
                      <Button
                        size="sm"
                        className="w-full mt-1 h-6 text-xs"
                        onClick={handleGetDirections}
                      >
                        Get Directions
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          )}
          
          {/* Loading overlay */}
          {!isMapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center">
                <MapPin className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
          
          {/* Map Controls Overlay */}
          {isMapReady && (
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full shadow-lg bg-white hover:bg-white/90"
                onClick={handleResetView}
                title="Reset view"
              >
                <span className="text-xs">📍</span>
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full shadow-lg bg-white hover:bg-white/90"
                onClick={handleViewOnGoogleMaps}
                title="Open in Google Maps"
              >
                <span className="text-xs font-semibold">G</span>
              </Button>
            </div>
          )}
        </div>

        {/* Address Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address Details
            </h4>
            <div className="text-sm space-y-1">
              <p className="font-medium">{title}</p>
              <p className="text-muted-foreground">{address}</p>
              <p className="text-muted-foreground">{subCity}, {city}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  Coordinates
                </Badge>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {formatCoordinate(latitude)}, {formatCoordinate(longitude)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Quick Actions</h4>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetDirections}
                className="justify-start gap-2"
              >
                <Navigation className="h-4 w-4" />
                Get Directions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareLocation}
                className="justify-start gap-2"
              >
                <MapPin className="h-4 w-4" />
                Share Location
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewOnGoogleMaps}
                className="justify-start gap-2"
              >
                <span className="font-semibold">G</span>
                Open in Google Maps
              </Button>
            </div>
          </div>
        </div>

        {/* Nearby Places Info */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold text-sm mb-3">Nearby Areas & Landmarks</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Schools', 'Hospitals', 'Shopping', 'Transport'].map((item) => (
              <div
                key={item}
                className="text-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                onClick={() => {
                  // This would typically open a modal with nearby places
                  console.log(`Search nearby ${item}`)
                }}
              >
                <div className="text-xs font-medium">{item}</div>
                <div className="text-xs text-muted-foreground mt-1">Search nearby</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}