// components/properties/PromotionBenefits.tsx - NEW FILE
'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TrendingUp, Star, Crown, Zap, Mail, BarChart, Target, Eye } from 'lucide-react'

interface PromotionBenefitsProps {
  tier: string
}

const benefitsConfig = {
  standard: {
    title: 'Standard Promotion Benefits',
    description: 'Perfect for getting good visibility and faster results',
    features: [
      {
        icon: TrendingUp,
        title: 'Top 20 in Search Results',
        description: 'Your property appears in top 20 for relevant searches',
        color: 'bg-blue-100 text-blue-800'
      },
      {
        icon: Mail,
        title: 'Email Notifications',
        description: 'Automatic email alerts to matching buyers',
        color: 'bg-green-100 text-green-800'
      },
      {
        icon: BarChart,
        title: 'Basic Analytics',
        description: 'View basic performance metrics',
        color: 'bg-purple-100 text-purple-800'
      },
      {
        icon: Target,
        title: '30-Day Guarantee',
        description: 'Guaranteed visibility for 30 days',
        color: 'bg-orange-100 text-orange-800'
      },
      {
        icon: Eye,
        title: 'Increased Views',
        description: 'Get 3-5x more views on your listing',
        color: 'bg-red-100 text-red-800'
      }
    ]
  },
  premium: {
    title: 'Premium Package Benefits',
    description: 'All-in-one marketing solution for serious sellers',
    features: [
      {
        icon: Crown,
        title: 'TOP Position',
        description: 'Top position in all relevant searches',
        color: 'bg-purple-100 text-purple-800'
      },
      {
        icon: Star,
        title: 'Homepage Featured',
        description: 'Dedicated section on homepage',
        color: 'bg-yellow-100 text-yellow-800'
      },
      {
        icon: Zap,
        title: 'Dedicated Campaign',
        description: 'Personalized email marketing campaign',
        color: 'bg-blue-100 text-blue-800'
      },
      {
        icon: TrendingUp,
        title: 'Social Media Ads',
        description: 'Targeted social media advertising',
        color: 'bg-green-100 text-green-800'
      }
    ]
  }
}

export function PromotionBenefits({ tier }: PromotionBenefitsProps) {
  const config = benefitsConfig[tier as keyof typeof benefitsConfig]
  if (!config) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge className={`${tier === 'standard' ? 'bg-blue-100 text-blue-800' : 
                           tier === 'featured' ? 'bg-yellow-100 text-yellow-800' : 
                           'bg-purple-100 text-purple-800'}`}>
            {tier.toUpperCase()}
          </Badge>
          {config.title}
        </CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {config.features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="flex gap-3 p-3 rounded-lg border">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${feature.color} p-2`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Stats for Standard Tier */}
        {tier === 'standard' && (
          <div className="mt-6 rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
            <h4 className="mb-3 font-semibold text-blue-800 dark:text-blue-300">
              Standard Promotion Stats
            </h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">3-5x</div>
                <p className="text-xs text-blue-700 dark:text-blue-400">More Views</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">2-3x</div>
                <p className="text-xs text-green-700 dark:text-green-400">More Inquiries</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">85%</div>
                <p className="text-xs text-purple-700 dark:text-purple-400">Faster Sale</p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">30</div>
                <p className="text-xs text-orange-700 dark:text-orange-400">Days Guaranteed</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}