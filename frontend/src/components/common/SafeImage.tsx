// components/common/SafeImage.tsx
'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface SafeImageProps {
  src?: string | null
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fill = true,
  className = 'object-cover',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  onLoad,
  onError
}) => {
  const [hasError, setHasError] = useState(false)

  // Process the image URL to handle localhost and relative paths
  const getProcessedUrl = (url: string | null | undefined): string | null => {
    if (!url) return null
    
    // If URL is already absolute (with http/https), use it as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    // Handle relative URLs (common in Django)
    // If it starts with /media/, it's from Django
    if (url.startsWith('/media/')) {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      // Ensure we don't have double slashes
      const cleanApiBaseUrl = apiBaseUrl.replace(/\/$/, '')
      const cleanUrl = url.replace(/^\//, '')
      return `${cleanApiBaseUrl}/${cleanUrl}`
    }
    
    // For other relative paths, assume they're from the frontend
    if (url.startsWith('/')) {
      return url
    }
    
    return url
  }

  const processedUrl = getProcessedUrl(src)

  if (hasError || !processedUrl) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted ${className} ${
          fill ? 'absolute inset-0' : 'h-full w-full'
        }`}
      >
        <svg 
          className="h-12 w-12 text-muted-foreground" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
          />
        </svg>
      </div>
    )
  }

  return (
    <Image
      src={processedUrl}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized={true} // Always use unoptimized for external images
      onLoad={onLoad}
      onError={() => {
        setHasError(true)
        onError?.()
      }}
    />
  )
}

export default SafeImage