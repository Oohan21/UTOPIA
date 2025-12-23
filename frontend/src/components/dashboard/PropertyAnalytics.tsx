// src/components/dashboard/PropertyAnalytics.tsx
'use client';

import React, { useState } from 'react';
import { listingsApi } from '@/lib/api/listings';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatNumber } from '@/lib/utils/formatNumber';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Eye, MessageSquare, Star, TrendingUp, Home, Calendar } from 'lucide-react';

export const PropertyAnalytics: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('30d');

  const { data: userProperties, isLoading } = useQuery({
    queryKey: ['user-properties'],
    queryFn: () => listingsApi.getUserProperties()
  });

  // Mock analytics data - replace with actual API calls
  const propertyAnalytics = {
    totalProperties: userProperties?.length || 0,
    totalViews: 12450,
    totalInquiries: 245,
    conversionRate: 1.97,
    avgDaysOnMarket: 45,
    topPerforming: userProperties?.[0] || null,
    
    performanceByProperty: userProperties?.map(prop => ({
      id: prop.id,
      title: prop.title,
      views: Math.floor(Math.random() * 1000) + 100,
      inquiries: Math.floor(Math.random() * 20) + 1,
      conversion: Math.random() * 3,
      daysListed: Math.floor(Math.random() * 60) + 1,
      price: prop.price_etb
    })) || [],

    monthlyTrends: [
      { month: 'Jan', views: 1850, inquiries: 32, conversions: 0.6 },
      { month: 'Feb', views: 2100, inquiries: 38, conversions: 0.7 },
      { month: 'Mar', views: 2450, inquiries: 45, conversions: 0.9 },
      { month: 'Apr', views: 2300, inquiries: 42, conversions: 0.8 },
      { month: 'May', views: 2750, inquiries: 52, conversions: 1.0 },
      { month: 'Jun', views: 3000, inquiries: 58, conversions: 1.2 }
    ],

    inquirySources: [
      { source: 'Platform Search', count: 145, percentage: 59 },
      { source: 'Promoted Listings', count: 65, percentage: 27 },
      { source: 'Direct Links', count: 25, percentage: 10 },
      { source: 'Other', count: 10, percentage: 4 }
    ]
  };

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading property analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Analytics</h2>
          <p className="text-gray-600 mt-1">
            Track performance of your listed properties
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedProperty} onValueChange={setSelectedProperty} placeholder="Select Property">
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {userProperties?.map((prop) => (
                <SelectItem key={prop.id} value={prop.id.toString()}>
                  {prop.title.substring(0, 30)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange} placeholder="Time Range">
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" />
              {propertyAnalytics.totalProperties}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Listed properties
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              {formatNumber(propertyAnalytics.totalViews)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Property views
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Inquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              {formatNumber(propertyAnalytics.totalInquiries)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Customer inquiries
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              {propertyAnalytics.conversionRate}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              View to inquiry rate
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance Trend</CardTitle>
            <CardDescription>
              Views and inquiries over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={propertyAnalytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="views" 
                    name="Views" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="inquiries" 
                    name="Inquiries" 
                    stroke="#10b981" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inquiry Sources</CardTitle>
            <CardDescription>
              Where your inquiries come from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={propertyAnalytics.inquirySources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {propertyAnalytics.inquirySources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Property Performance</CardTitle>
          <CardDescription>
            Detailed performance metrics for each property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-center">Views</TableHead>
                  <TableHead className="text-center">Inquiries</TableHead>
                  <TableHead className="text-center">Conversion</TableHead>
                  <TableHead className="text-center">Days Listed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propertyAnalytics.performanceByProperty.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="font-medium">{property.title}</div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(property.price, 'ETB')}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-medium">{formatNumber(property.views)}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-medium">{property.inquiries}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          property.conversion > 2
                            ? 'default'
                            : property.conversion > 1
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {property.conversion.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{property.daysListed} days</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {propertyAnalytics.topPerforming && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>
              Recommendations to improve your property listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-800 mb-2">Top Performing Property</div>
                <div className="text-sm">
                  "{propertyAnalytics.topPerforming.title}" has the highest conversion rate
                </div>
                <Button variant="link" className="p-0 h-auto text-blue-600 mt-2">
                  View Details →
                </Button>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="font-medium text-green-800 mb-2">Improvement Opportunity</div>
                <div className="text-sm">
                  Properties with professional photos get 3x more views
                </div>
                <Button variant="link" className="p-0 h-auto text-green-600 mt-2">
                  Upload Photos →
                </Button>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="font-medium text-purple-800 mb-2">Promotion Suggestion</div>
                <div className="text-sm">
                  Promote your listings to reach more potential buyers
                </div>
                <Button variant="link" className="p-0 h-auto text-purple-600 mt-2">
                  Promote Now →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};