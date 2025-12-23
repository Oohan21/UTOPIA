// components/inquiries/InquiryStats.tsx
import React from 'react'
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Users, Inbox, Clock, TrendingUp, AlertTriangle, Zap, CheckCircle } from 'lucide-react'

interface InquiryStatsProps {
  stats: {
    total: number
    new_today: number
    unassigned: number
    urgent: number
    avg_response_time_hours: number
    response_rate: number
    conversion_rate: number
  }
  onFilterChange: (key: string, value: any) => void
}

export function InquiryStats({ stats, onFilterChange }: InquiryStatsProps) {
  const statCards = [
    {
      title: 'Total Inquiries',
      value: stats.total,
      icon: Inbox,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => onFilterChange('status', [])
    },
    {
      title: 'New Today',
      value: stats.new_today,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        onFilterChange('created_at__gte', today.toISOString())
      }
    },
    {
      title: 'Unassigned',
      value: stats.unassigned,
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      onClick: () => onFilterChange('assigned_to', 'unassigned')
    },
    {
      title: 'Urgent',
      value: stats.urgent,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      onClick: () => onFilterChange('priority', ['urgent'])
    },
    {
      title: 'Avg Response Time',
      value: `${stats.avg_response_time_hours.toFixed(1)}h`,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Average time to respond'
    },
    {
      title: 'Response Rate',
      value: `${stats.response_rate.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Inquiries responded to'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((stat, index) => (
        <Card 
          key={index} 
          className={`${stat.bgColor} border-0 cursor-pointer hover:shadow-md transition-shadow`}
          onClick={stat.onClick}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className={`text-2xl font-bold mt-1 ${stat.color}`}>
                  {stat.value}
                </h3>
                {stat.description && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                )}
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}