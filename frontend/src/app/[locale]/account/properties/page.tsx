// app/user/properties/page.tsx - Add approval status indicator
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listingsApi } from '@/lib/api/listings'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

export default function UserPropertiesPage() {
  const { data: properties, isLoading } = useQuery({
    queryKey: ['user-properties'],
    queryFn: () => listingsApi.getUserProperties(),
  })
  
  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Needs Changes
          </Badge>
        )
      case 'changes_requested':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Changes Requested
          </Badge>
        )
      default:
        return null
    }
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Properties</h1>
      
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties?.map((property) => (
            <Card key={property.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{property.title}</h3>
                  {getApprovalBadge(property.approval_status)}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {property.specific_location}
                </p>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="font-bold">
                    {property.price_etb?.toLocaleString()} ETB
                  </span>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {property.approval_status !== 'approved' && (
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Show admin notes if property was rejected or needs changes */}
                {(property.approval_status === 'rejected' || property.approval_status === 'changes_requested') && 
                 property.approval_notes && (
                  <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                    <p className="font-medium">Admin Notes:</p>
                    <p>{property.approval_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}