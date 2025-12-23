'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { X, Maximize2, Navigation, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), {
  ssr: false
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

interface MapModalProps {
  latitude: number | string | null | undefined
  longitude: number | string | null | undefined
  title: string
  address: string
  city: string
  subCity: string
  price: string
  propertyType: string
  trigger?: React.ReactNode
}

// Helper function to format coordinates safely
const formatCoordinate = (coord: number | string | null | undefined): string => {
  if (coord === null || coord === undefined || coord === '') {
    return 'N/A'
  }
  
  const num = typeof coord === 'string' ? parseFloat(coord) : coord
  
  if (isNaN(num as number)) {
    return 'Invalid'
  }
  
  return Number(num).toFixed(6)
}

export function MapModal({
  latitude,
  longitude,
  title,
  address,
  city,
  subCity,
  price,
  propertyType,
  trigger
}: MapModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Safely parse coordinates for validation
  const parsedLat = typeof latitude === 'string' ? parseFloat(latitude) : latitude
  const parsedLng = typeof longitude === 'string' ? parseFloat(longitude) : longitude
  
  const isValidLocation = (
    parsedLat !== null && 
    parsedLat !== undefined && 
    parsedLng !== null && 
    parsedLng !== undefined &&
    !isNaN(parsedLat) && 
    !isNaN(parsedLng) &&
    Math.abs(parsedLat) <= 90 &&
    Math.abs(parsedLng) <= 180
  )

  if (!isValidLocation) {
    return (
      <Button variant="outline" disabled>
        <Maximize2 className="mr-2 h-4 w-4" />
        View Map (No Location)
      </Button>
    )
  }

  // Type assertion since we've validated above
  const propertyCenter: [number, number] = [parsedLat as number, parsedLng as number]

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${parsedLat},${parsedLng}`
    window.open(url, '_blank')
  }

  const handleDownloadMap = () => {
    // This would generate and download a map image
    // For now, open Google Maps static image
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${parsedLat},${parsedLng}&zoom=15&size=800x400&markers=color:red%7C${parsedLat},${parsedLng}&key=YOUR_API_KEY`
    window.open(staticMapUrl, '_blank')
  }

  const handleShareMap = () => {
    const text = `Check out this property location: ${title}`
    const url = `https://www.google.com/maps?q=${parsedLat},${parsedLng}`
    
    if (navigator.share) {
      navigator.share({
        title: `${title} - Location`,
        text: text,
        url: url,
      })
    } else {
      navigator.clipboard.writeText(url)
        .then(() => alert('Map link copied to clipboard!'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Maximize2 className="h-4 w-4" />
            Fullscreen Map
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Property Location Map</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {title} • {subCity}, {city}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetDirections}
                className="gap-2"
              >
                <Navigation className="h-4 w-4" />
                Directions
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Map Section */}
          <div className="flex-1 relative">
            <MapContainer
              center={propertyCenter}
              zoom={16}
              className="h-full w-full"
              scrollWheelZoom={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={propertyCenter}>
                <Popup className="custom-popup">
                  <div className="p-3 min-w-[200px]">
                    <div className="font-semibold mb-2">{title}</div>
                    <div className="text-sm text-muted-foreground mb-2">{address}</div>
                    <Badge className="mb-2">{propertyType}</Badge>
                    <div className="font-medium text-primary">{price}</div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg bg-white hover:bg-white/90"
                onClick={handleDownloadMap}
                title="Download Map"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg bg-white hover:bg-white/90"
                onClick={handleShareMap}
                title="Share Map"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sidebar with Details */}
          <div className="w-96 border-l bg-background overflow-y-auto p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Location Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Address</p>
                    <p className="font-medium">{address}</p>
                    <p className="text-sm">{subCity}, {city}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Coordinates</p>
                    <div className="font-mono text-sm bg-muted p-2 rounded mt-1">
                      {formatCoordinate(latitude)}, {formatCoordinate(longitude)}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Property Price</p>
                    <p className="text-xl font-bold text-primary">{price}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Nearby Places</h3>
                <div className="space-y-2">
                  {[
                    { name: 'Schools & Universities', distance: '1.2km', count: 5 },
                    { name: 'Hospitals & Clinics', distance: '0.8km', count: 3 },
                    { name: 'Shopping Centers', distance: '2.1km', count: 8 },
                    { name: 'Restaurants & Cafes', distance: '0.5km', count: 12 },
                    { name: 'Public Transport', distance: '0.3km', count: 4 },
                  ].map((place, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                      onClick={() => {
                        // This would typically show these places on the map
                        console.log(`Show ${place.name} on map`)
                      }}
                    >
                      <div>
                        <p className="font-medium text-sm">{place.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {place.count} places • {place.distance} away
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        View
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Transport Options</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <span className="text-xl">🚕</span>
                    <div className="text-left">
                      <p className="font-medium">Taxi Service</p>
                      <p className="text-xs text-muted-foreground">Available 24/7</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <span className="text-xl">🚌</span>
                    <div className="text-left">
                      <p className="font-medium">Public Bus</p>
                      <p className="text-xs text-muted-foreground">Route 45, 78, 102</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <span className="text-xl">🚗</span>
                    <div className="text-left">
                      <p className="font-medium">Ride Hailing</p>
                      <p className="text-xs text-muted-foreground">Bolt, Ride, Feres</p>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}