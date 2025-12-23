// components/inquiries/InquiryTimeline.tsx
import React from 'react'
import { Card, CardContent } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { User, MessageSquare, Calendar, Phone, Mail, Clock, CheckCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/formatDate'

interface TimelineEvent {
  id: number
  type: 'status_change' | 'note_added' | 'viewing_scheduled' | 'message_sent'
  title: string
  description?: string
  user?: {
    name: string
    role: string
  }
  timestamp: string
  metadata?: {
    status?: string
    priority?: string
    contact_method?: string
  }
}

interface InquiryTimelineProps {
  events: TimelineEvent[]
  className?: string
}

export function InquiryTimeline({ events, className = '' }: InquiryTimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return CheckCircle
      case 'note_added':
        return MessageSquare
      case 'viewing_scheduled':
        return Calendar
      case 'message_sent':
        return MessageSquare
      default:
        return Clock
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'status_change':
        return 'bg-blue-100 text-blue-600'
      case 'note_added':
        return 'bg-green-100 text-green-600'
      case 'viewing_scheduled':
        return 'bg-purple-100 text-purple-600'
      case 'message_sent':
        return 'bg-amber-100 text-amber-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="divide-y">
          {events.map((event, index) => {
            const Icon = getEventIcon(event.type)
            const colorClass = getEventColor(event.type)
            
            return (
              <div key={event.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    )}
                    
                    {event.metadata && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.metadata.status && (
                          <Badge variant="outline" className="text-xs">
                            Status: {event.metadata.status}
                          </Badge>
                        )}
                        {event.metadata.priority && (
                          <Badge variant="outline" className="text-xs">
                            Priority: {event.metadata.priority}
                          </Badge>
                        )}
                        {event.metadata.contact_method && (
                          <Badge variant="outline" className="text-xs">
                            Via: {event.metadata.contact_method}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {event.user && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="p-1 rounded-full bg-muted">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {event.user.name} • {event.user.role}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {events.length === 0 && (
          <div className="p-6 text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">No activity recorded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}