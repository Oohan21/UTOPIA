'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { MapPin, Navigation, Search, ZoomIn, ZoomOut } from 'lucide-react'

interface LocationMapPickerProps {
  initialLocation?: { lat: number; lng: number }
  onLocationSelect: (lat: number, lng: number, address: string) => void
}

export default function LocationMapPicker({
  initialLocation,
  onLocationSelect
}: LocationMapPickerProps) {
  const [location, setLocation] = useState(
    initialLocation || { lat: 9.032, lng: 38.746 } // Default: Addis Ababa
  )
  const [zoom, setZoom] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [address, setAddress] = useState('')

  // This is a simplified map component - in production, you'd integrate with Google Maps or Mapbox
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Convert click coordinates to lat/lng (simplified)
    const lat = location.lat + ((rect.height / 2 - y) / 100) * (1 / zoom)
    const lng = location.lng + ((x - rect.width / 2) / 100) * (1 / zoom)
    
    const newLocation = { lat, lng }
    setLocation(newLocation)
    // In production, you'd reverse geocode here
    setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // In production, you'd geocode the search query
      // This is a mock implementation
      const mockLocations: Record<string, { lat: number; lng: number; address: string }> = {
        'addis ababa': { lat: 9.032, lng: 38.746, address: 'Addis Ababa, Ethiopia' },
        'bole': { lat: 8.996, lng: 38.799, address: 'Bole, Addis Ababa' },
        'mexico': { lat: 8.982, lng: 38.763, address: 'Mexico Square, Addis Ababa' },
        'piassa': { lat: 9.038, lng: 38.750, address: 'Piazza, Addis Ababa' }
      }

      const key = searchQuery.toLowerCase()
      if (mockLocations[key]) {
        const loc = mockLocations[key]
        setLocation({ lat: loc.lat, lng: loc.lng })
        setAddress(loc.address)
        setZoom(15)
      }
    }
  }

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          setAddress('Your current location')
          setZoom(15)
        },
        () => {
          setAddress('Unable to get your location')
        }
      )
    }
  }

  const handleConfirm = () => {
    onLocationSelect(location.lat, location.lng, address)
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a location..."
            className="pl-10"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
        <Button variant="outline" onClick={handleUseCurrentLocation}>
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Container */}
      <Card className="flex-1 relative overflow-hidden bg-muted">
        {/* Simplified Map Visualization */}
        <div 
          className="w-full h-full relative cursor-crosshair"
          onClick={handleMapClick}
        >
          {/* Grid background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-gray-100">
            {/* Simulated streets */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`h-${i}`}
                className="absolute w-full h-[1px] bg-gray-300"
                style={{ top: `${i * 10}%` }}
              />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`v-${i}`}
                className="absolute h-full w-[1px] bg-gray-300"
                style={{ left: `${i * 10}%` }}
              />
            ))}
          </div>

          {/* Marker at selected location */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: '50%',
              top: '50%'
            }}
          >
            <MapPin className="h-8 w-8 text-red-600 fill-red-600" />
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setZoom(Math.min(20, zoom + 1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setZoom(Math.max(1, zoom - 1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded">
            Click on map to set location • Zoom: {zoom}x
          </div>
        </div>
      </Card>

      {/* Location Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Latitude</Label>
            <Input
              type="number"
              step="any"
              value={location.lat}
              onChange={(e) => setLocation(prev => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Longitude</Label>
            <Input
              type="number"
              step="any"
              value={location.lng}
              onChange={(e) => setLocation(prev => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Address</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address or click on map"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleConfirm} className="flex-1">
            Use This Location
          </Button>
        </div>
      </div>
    </div>
  )
}