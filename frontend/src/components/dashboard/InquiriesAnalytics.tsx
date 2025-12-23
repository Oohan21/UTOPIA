// src/components/dashboard/InquiriesAnalytics.tsx
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
import { formatNumber } from '@/lib/utils/formatNumber';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { MessageSquare, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

export const InquiriesAnalytics: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('30d');

  const { data: inquiriesData, isLoading } = useQuery({
    queryKey: ['user-inquiries'],
    queryFn: () => listingsApi.getInquiries()
  });

  // Mock analytics data
  const inquiriesAnalytics = {
    totalInquiries: 245,
    responded: 210,
    pending: 35,
    avgResponseTime: '2h 15m',
    conversionRate: 18.5,
    
    statusDistribution: [
      { name: 'Responded', value: 210, color: '#10b981' },
      { name: 'Pending', value: 35, color: '#f59e0b' },
      { name: 'Archived', value: 0, color: '#6b7280' }
    ],

    monthlyTrends: [
      { month: 'Jan', inquiries: 32, responses: 28, conversions: 6 },
      { month: 'Feb', inquiries: 38, responses: 34, conversions: 7 },
      { month: 'Mar', inquiries: 45, responses: 40, conversions: 9 },
      { month: 'Apr', inquiries: 42, responses: 38, conversions: 8 },
      { month: 'May', inquiries: 52, responses: 48, conversions: 10 },
      { month: 'Jun', inquiries: 58, responses: 52, conversions: 12 }
    ],

    inquiryTypes: [
      { name: 'General Inquiry', value: 98, percentage: 40 },
      { name: 'Property Details', value: 73, percentage: 30 },
      { name: 'Price Negotiation', value: 49, percentage: 20 },
      { name: 'Scheduling Visit', value: 25, percentage: 10 }
    ],

    recentInquiries: inquiriesData?.results?.slice(0, 5) || []
  };

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading inquiry analytics...</div>
      </div>
    );
  }

  // Custom label renderer for Pie chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip for Pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm">
            {formatNumber(data.value)} inquiries
          </p>
          <p className="text-sm text-gray-500">
            {data.percentage ? `${data.percentage}% of total` : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inquiry Analytics</h2>
          <p className="text-gray-600 mt-1">
            Track and analyze customer inquiries
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter} placeholder="Status">
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
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
              Total Inquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              {formatNumber(inquiriesAnalytics.totalInquiries)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              All-time inquiries
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {((inquiriesAnalytics.responded / inquiriesAnalytics.totalInquiries) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {inquiriesAnalytics.responded} responded
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Avg. Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              {inquiriesAnalytics.avgResponseTime}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Time to first response
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
              {inquiriesAnalytics.conversionRate}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Inquiry to sale/rent
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Inquiry Trends</CardTitle>
            <CardDescription>
              Inquiries and responses over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inquiriesAnalytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inquiries" name="Inquiries" fill="#3b82f6" />
                  <Bar dataKey="responses" name="Responses" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inquiry Types</CardTitle>
            <CardDescription>
              Breakdown of inquiry categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inquiriesAnalytics.inquiryTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inquiriesAnalytics.inquiryTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Inquiries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inquiries</CardTitle>
          <CardDescription>
            Latest customer inquiries requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiriesAnalytics.recentInquiries.length > 0 ? (
                  inquiriesAnalytics.recentInquiries.map((inquiry: any) => (
                    <TableRow key={inquiry.id}>
                      <TableCell>
                        <div className="font-medium">
                          {inquiry.property?.title || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {inquiry.property?.property_type || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {inquiry.user?.first_name} {inquiry.user?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {inquiry.user?.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {inquiry.inquiry_type || 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            inquiry.status === 'responded'
                              ? 'default'
                              : inquiry.status === 'pending'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {inquiry.status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(inquiry.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Respond
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No recent inquiries found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Response Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Response Rate</span>
                <span className="font-medium text-green-600">
                  {((inquiriesAnalytics.responded / inquiriesAnalytics.totalInquiries) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg. First Response</span>
                <span className="font-medium">{inquiriesAnalytics.avgResponseTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Industry Average</span>
                <span className="font-medium">4h 30m</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Conversion Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="font-medium text-green-600">
                  {inquiriesAnalytics.conversionRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Industry Average</span>
                <span className="font-medium">12.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Estimated Value</span>
                <span className="font-medium">24.5M ETB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span className="text-sm">Respond within 1 hour to increase conversions by 40%</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span className="text-sm">Follow up within 24 hours for 30% better results</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span className="text-sm">Personalized responses have 2x higher conversion</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};