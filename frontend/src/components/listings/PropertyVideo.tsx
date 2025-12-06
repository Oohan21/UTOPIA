// components/properties/PropertyVideo.tsx
import React from 'react'
import { Play, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PropertyVideoProps {
  videoUrl?: string
  title: string
}

export default function PropertyVideo({ videoUrl, title }: PropertyVideoProps) {
  if (!videoUrl) return null

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
  const isVimeo = videoUrl.includes('vimeo.com')
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Video Tour</h3>
      
      {isYouTube || isVimeo ? (
        // Embed external video
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <iframe
            src={isYouTube 
              ? `https://www.youtube.com/embed/${videoUrl.split('v=')[1]?.split('&')[0]}`
              : `https://player.vimeo.com/video/${videoUrl.split('vimeo.com/')[1]}`
            }
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        // Local video file
        <div className="space-y-2">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            <video
              src={videoUrl}
              controls
              className="h-full w-full object-contain"
              title={title}
            >
              <track kind="captions" />
            </video>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={videoUrl} download={`${title.replace(/\s+/g, '_')}_video.mp4`}>
              <Download className="mr-2 h-4 w-4" />
              Download Video
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}