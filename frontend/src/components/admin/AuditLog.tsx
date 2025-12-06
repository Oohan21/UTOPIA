'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, User, Clock, FileEdit, Trash2, Eye } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatDateTime } from '@/lib/utils/formatDate'

interface AuditLogEntry {
  id: number
  user: {
    email: string
    first_name: string
    last_name: string
  }
  action_type: string
  model_name: string
  object_id: string
  object_repr: string
  changes: Record<string, any>
  ip_address: string
  created_at: string
}

export default function AuditLog() {
  const [filters, setFilters] = useState({
    search: '',
    action_type: '',
    model_name: '',
    date_from: '',
    date_to: '',
  })

  const { data: auditLogs = [], isLoading } = useQuery<AuditLogEntry[]>({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        {
          id: 1,
          user: {
            email: 'admin@utopia.com',
            first_name: 'Admin',
            last_name: 'User'
          },
          action_type: 'create',
          model_name: 'Property',
          object_id: '123',
          object_repr: 'Beautiful Villa in Bole',
          changes: { title: 'Beautiful Villa in Bole', price_etb: 5000000 },
          ip_address: '192.168.1.1',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          user: {
            email: 'agent@utopia.com',
            first_name: 'John',
            last_name: 'Doe'
          },
          action_type: 'update',
          model_name: 'Property',
          object_id: '456',
          object_repr: 'Apartment in Kazanchis',
          changes: { price_etb: { old: 3000000, new: 2800000 } },
          ip_address: '192.168.1.2',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 3,
          user: {
            email: 'user@utopia.com',
            first_name: 'Jane',
            last_name: 'Smith'
          },
          action_type: 'view',
          model_name: 'Property',
          object_id: '789',
          object_repr: 'Commercial Space',
          changes: {},
          ip_address: '192.168.1.3',
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ]
    }
  })

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return <FileEdit className="h-4 w-4 text-green-500" />
      case 'update':
        return <FileEdit className="h-4 w-4 text-blue-500" />
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />
      case 'view':
        return <Eye className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'bg-green-100 text-green-800'
      case 'update':
        return 'bg-blue-100 text-blue-800'
      case 'delete':
        return 'bg-red-100 text-red-800'
      case 'view':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <p className="text-sm text-muted-foreground">
          Track all system activities and user actions
        </p>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Input
              placeholder="Search logs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              startIcon={<Search className="h-4 w-4" />}
            />
            <Select
              placeholder="Action Type"
              value={filters.action_type}
              onValueChange={(value) => setFilters({ ...filters, action_type: value })}
              options={[
                { value: 'create', label: 'Create' },
                { value: 'update', label: 'Update' },
                { value: 'delete', label: 'Delete' },
                { value: 'view', label: 'View' },
              ]}
            />
            <Select
              placeholder="Model"
              value={filters.model_name}
              onValueChange={(value) => setFilters({ ...filters, model_name: value })}
              options={[
                { value: 'Property', label: 'Property' },
                { value: 'User', label: 'User' },
                { value: 'Inquiry', label: 'Inquiry' },
              ]}
            />
            <Button variant="outline" className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Audit Log Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-full p-2 ${getActionColor(log.action_type)}`}>
                      {getActionIcon(log.action_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{log.action_type}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-medium">{log.model_name}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">ID: {log.object_id}</span>
                      </div>
                      <p className="mt-1 text-sm">{log.object_repr}</p>
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{log.user.first_name} {log.user.last_name}</span>
                          <span>({log.user.email})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateTime(log.created_at)}</span>
                        </div>
                        {log.ip_address && (
                          <div>
                            <span>IP: {log.ip_address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Changes Display */}
                {Object.keys(log.changes).length > 0 && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <h5 className="mb-2 text-sm font-medium">Changes:</h5>
                    <div className="space-y-1 text-sm">
                      {Object.entries(log.changes).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="font-medium">{key}:</span>
                          {typeof value === 'object' && value.old !== undefined ? (
                            <span>
                              <span className="text-red-600 line-through">{value.old}</span>
                              {' → '}
                              <span className="text-green-600">{value.new}</span>
                            </span>
                          ) : (
                            <span>{String(value)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}