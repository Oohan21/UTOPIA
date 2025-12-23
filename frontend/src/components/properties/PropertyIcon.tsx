// components/properties/PropertyIcon.tsx
import React from 'react'
import { Home, Building, Store, Trees, Hotel, Briefcase, Warehouse, Building2, Star, Award } from 'lucide-react'

interface PropertyIconProps {
  type: string
  isPromoted?: boolean
  isFeatured?: boolean
  className?: string
}

export const PropertyIcon: React.FC<PropertyIconProps> = ({ 
  type, 
  isPromoted = false, 
  isFeatured = false,
  className = '' 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'house':
        return <Home className={className} />
      case 'apartment':
        return <Building className={className} />
      case 'villa':
        return <Building2 className={className} />
      case 'commercial':
        return <Store className={className} />
      case 'land':
        return <Trees className={className} />
      case 'office':
        return <Briefcase className={className} />
      case 'warehouse':
        return <Warehouse className={className} />
      case 'hotel':
        return <Hotel className={className} />
      default:
        return <Home className={className} />
    }
  }

  return (
    <div className="relative">
      {getIcon()}
      {isPromoted && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-500 flex items-center justify-center">
          <Star className="w-2 h-2 text-white" />
        </div>
      )}
      {isFeatured && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-purple-500 flex items-center justify-center">
          <Award className="w-2 h-2 text-white" />
        </div>
      )}
    </div>
  )
}