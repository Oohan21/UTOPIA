
'use client'

import React from 'react'
import Image from 'next/image'
import { Home } from 'lucide-react'

interface PropertyImageProps {
  src?: string
  alt: string
  className?: string
  fill?: boolean
  sizes?: string
}

const PropertyImage: React.FC<PropertyImageProps> = ({
  src,
  alt,
  className = 'object-cover',
  fill = true,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
}) => {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <Home className="h-12 w-12 text-muted-foreground" />
      </div>
    )
  }

  const isExternal = src.startsWith('http://') || src.startsWith('https://')
  
  if (isExternal) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={(e) => {
          e.currentTarget.src = '/placeholder-image.jpg'
        }}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      onError={(e) => {
        e.currentTarget.src = '/placeholder-image.jpg'
      }}
    />
  )
}

export default PropertyImage