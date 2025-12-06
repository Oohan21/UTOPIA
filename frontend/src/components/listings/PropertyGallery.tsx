// components/listings/PropertyGallery.tsx
'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Play, Video, Download as DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScrollArea } from '@/components/ui/Scroll-area'
import SafeImage from '@/components/common/SafeImage'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog"

interface PropertyGalleryProps {
  images: any[]
  propertyTitle: string
  propertyVideo?: string
}

const PropertyGallery: React.FC<PropertyGalleryProps> = ({ 
  images, 
  propertyTitle, 
  propertyVideo 
}) => {
  const [activeImage, setActiveImage] = useState(0)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  const primaryImage = images.find(img => img.is_primary) || images[0]

  const handlePreviousImage = () => {
    setActiveImage((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleNextImage = () => {
    setActiveImage((prev) => (prev + 1) % images.length)
  }

  const currentImage = images[activeImage] || primaryImage

  return (
    <div className="space-y-4">
      {/* Main Image/Video Display */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        {propertyVideo && (
          <div className="absolute right-2 top-2 z-10">
            <Badge className="bg-blue-500 text-white">
              <Video className="mr-1 h-3 w-3" />
              Video Available
            </Badge>
          </div>
        )}
        
        {images.length > 0 ? (
          <SafeImage
            src={currentImage?.image}
            alt={`${propertyTitle} - ${activeImage + 1}`}
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <SafeImage src={null} alt="No image available" />
          </div>
        )}
        
        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handlePreviousImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleNextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Video Play Button */}
        {propertyVideo && (
          <Button
            variant="ghost"
            size="lg"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={() => setIsVideoModalOpen(true)}
          >
            <Play className="h-6 w-6" />
            <span className="ml-2">Watch Video</span>
          </Button>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 rounded-full bg-background/80 px-3 py-1 text-sm backdrop-blur-sm">
            {activeImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <ScrollArea>
          <div className="flex gap-2 pb-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setActiveImage(index)}
                className={`relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                  activeImage === index 
                    ? 'ring-2 ring-primary ring-offset-2' 
                    : 'opacity-75 hover:opacity-100 hover:ring-1 hover:ring-muted'
                }`}
              >
                <SafeImage
                  src={image.image}
                  alt={`${propertyTitle} - ${index + 1}`}
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Video Modal */}
      {propertyVideo && (
        <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Property Video Tour</DialogTitle>
              <DialogDescription>
                Watch the video tour of {propertyTitle}
              </DialogDescription>
            </DialogHeader>
            <div className="relative aspect-video">
              <video
                src={propertyVideo}
                controls
                className="h-full w-full rounded-lg"
                title={propertyTitle}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = propertyVideo
                  link.download = `${propertyTitle.replace(/\s+/g, '_')}_video.mp4`
                  link.click()
                }}
              >
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download Video
              </Button>
              <Button onClick={() => setIsVideoModalOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default PropertyGallery