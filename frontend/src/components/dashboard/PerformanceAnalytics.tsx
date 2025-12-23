// src/components/dashboard/PerformanceAnalytics.tsx
'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { formatNumber } from '@/lib/utils/formatNumber';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

export const PerformanceAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [metricType, setMetricType] = useState('all');

  // Mock performance data
  const performanceData = {
    apiPerformance: {
      averageResponseTime: 245,
      p95ResponseTime: 420,
      errorRate: 0.8,
      uptime: 99.92,
      dailyMetrics: [
        { date: 'Mon', responseTime: 230, requests: 12500, errors: 98 },
        { date: 'Tue', responseTime: 245, requests: 13800, errors: 110 },
        { date: 'Wed', responseTime: 218, requests: 14200, errors: 85 },
        { date: 'Thu', responseTime: 265, requests: 15600, errors: 124 },
        { date: 'Fri', responseTime: 240, requests: 16200, errors: 130 },
        { date: 'Sat', responseTime: 255, requests: 14800, errors: 118 },
        { date: 'Sun', responseTime: 232, requests: 13200, errors: 105 }
      ]
    },
    serverPerformance: {
      cpuUsage: 65,
      memoryUsage: 72,
      diskUsage: 45,
      networkTraffic: 1250,
      alerts: 3
    },
    userPerformance: {
      pageLoadTime: 2.8,
      searchResponseTime: 1.2,
      imageLoadTime: 1.5,
      apiSuccessRate: 99.2,
      satisfactionScore: 4.3
    },
    businessMetrics: {
      conversionRate: 4.2,
      retentionRate: 72.5,
      engagementScore: 8.5,
      growthRate: 18.3
    }
  };

  const getStatusColor = (value: number, type: 'responseTime' | 'error' | 'usage' | 'rate') => {
    switch (type) {
      case 'responseTime':
        if (value < 200) return 'text-green-600';
        if (value < 400) return 'text-yellow-600';
        return 'text-red-600';
      case 'error':
        if (value < 1) return 'text-green-600';
        if (value < 3) return 'text-yellow-600';
        return 'text-red-600';
      case 'usage':
        if (value < 70) return 'text-green-600';
        if (value < 85) return 'text-yellow-600';
        return 'text-red-600';
      case 'rate':
        if (value > 95) return 'text-green-600';
        if (value > 90) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
          <p className="text-gray-600 mt-1">
            System, API, and user performance metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange} placeholder="Time Range" >
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={metricType} onValueChange={setMetricType}placeholder="Metric Type">
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="server">Server</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              API Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(performanceData.apiPerformance.averageResponseTime, 'responseTime')}`}>
              {performanceData.apiPerformance.averageResponseTime}ms
            </div>
            <div className="text-sm text-gray-500 mt-1">
              p95: {performanceData.apiPerformance.p95ResponseTime}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(performanceData.apiPerformance.uptime, 'rate')}`}>
              {performanceData.apiPerformance.uptime.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Last 30 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(performanceData.apiPerformance.errorRate, 'error')}`}>
              {performanceData.apiPerformance.errorRate.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              API error percentage
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              User Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {performanceData.userPerformance.satisfactionScore}/5.0
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Average rating
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="server">Server Performance</TabsTrigger>
          <TabsTrigger value="user">User Experience</TabsTrigger>
          <TabsTrigger value="business">Business Metrics</TabsTrigger>
        </TabsList>

        {/* API Performance Tab */}
        <TabsContent value="api" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
                <CardDescription>
                  Daily average response time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData.apiPerformance.dailyMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis 
                        label={{ value: 'ms', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="responseTime" 
                        name="Response Time (ms)" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="errors" 
                        name="Errors" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Request Volume & Errors</CardTitle>
                <CardDescription>
                  Daily requests and error count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData.apiPerformance.dailyMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Area 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="requests" 
                        name="Requests" 
                        stroke="#10b981" 
                        fill="#10b98122" 
                      />
                      <Area 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="errors" 
                        name="Errors" 
                        stroke="#ef4444" 
                        fill="#ef444422" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Endpoint Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Performance</CardTitle>
              <CardDescription>
                Response times by API endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { endpoint: '/api/properties/search', avgTime: 180, p95: 320, calls: 45000 },
                  { endpoint: '/api/properties/{id}', avgTime: 120, p95: 210, calls: 32000 },
                  { endpoint: '/api/users/profile', avgTime: 90, p95: 160, calls: 28000 },
                  { endpoint: '/api/inquiries/create', avgTime: 210, p95: 380, calls: 15000 },
                  { endpoint: '/api/analytics/dashboard', avgTime: 320, p95: 520, calls: 8000 }
                ].map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{endpoint.endpoint}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatNumber(endpoint.calls)} calls
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{endpoint.avgTime}ms</div>
                      <div className="text-xs text-gray-500">p95: {endpoint.p95}ms</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Server Performance Tab */}
        <TabsContent value="server" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>CPU Usage</span>
                      <span className={getStatusColor(performanceData.serverPerformance.cpuUsage, 'usage')}>
                        {performanceData.serverPerformance.cpuUsage}%
                      </span>
                    </div>
                    <Progress value={performanceData.serverPerformance.cpuUsage} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Memory Usage</span>
                      <span className={getStatusColor(performanceData.serverPerformance.memoryUsage, 'usage')}>
                        {performanceData.serverPerformance.memoryUsage}%
                      </span>
                    </div>
                    <Progress value={performanceData.serverPerformance.memoryUsage} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Disk Usage</span>
                      <span className="text-gray-700">
                        {performanceData.serverPerformance.diskUsage}%
                      </span>
                    </div>
                    <Progress value={performanceData.serverPerformance.diskUsage} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      {performanceData.serverPerformance.alerts}
                    </div>
                    <div className="text-sm text-gray-500">Active Alerts</div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Network Traffic</span>
                      <span className="font-medium">
                        {formatNumber(performanceData.serverPerformance.networkTraffic)} GB/day
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Connections</span>
                      <span className="font-medium">1,245</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database Connections</span>
                      <span className="font-medium">42/100</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Server Metrics Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Server Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={[
                    { metric: 'CPU', value: performanceData.serverPerformance.cpuUsage },
                    { metric: 'Memory', value: performanceData.serverPerformance.memoryUsage },
                    { metric: 'Disk', value: performanceData.serverPerformance.diskUsage },
                    { metric: 'Network', value: performanceData.serverPerformance.networkTraffic / 50 },
                    { metric: 'Connections', value: 80 },
                    { metric: 'Uptime', value: performanceData.apiPerformance.uptime - 90 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis />
                    <Radar 
                      name="Performance" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Experience Tab */}
        <TabsContent value="user" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Page Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Page Load Time</span>
                      <span className={getStatusColor(performanceData.userPerformance.pageLoadTime * 1000, 'responseTime')}>
                        {performanceData.userPerformance.pageLoadTime}s
                      </span>
                    </div>
                    <Progress value={100 - (performanceData.userPerformance.pageLoadTime * 20)} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Search Response Time</span>
                      <span className="text-green-600">
                        {performanceData.userPerformance.searchResponseTime}s
                      </span>
                    </div>
                    <Progress value={100 - (performanceData.userPerformance.searchResponseTime * 50)} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Image Load Time</span>
                      <span className="text-green-600">
                        {performanceData.userPerformance.imageLoadTime}s
                      </span>
                    </div>
                    <Progress value={100 - (performanceData.userPerformance.imageLoadTime * 40)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Experience Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { metric: 'Page Load', value: performanceData.userPerformance.pageLoadTime },
                      { metric: 'Search', value: performanceData.userPerformance.searchResponseTime },
                      { metric: 'Images', value: performanceData.userPerformance.imageLoadTime },
                      { metric: 'API Success', value: performanceData.userPerformance.apiSuccessRate / 20 },
                      { metric: 'Satisfaction', value: performanceData.userPerformance.satisfactionScore * 20 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>User Feedback & Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-800">Most Common Issues</div>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Slow property search</span>
                      <Badge variant="outline">45 reports</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Image loading issues</span>
                      <Badge variant="outline">28 reports</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Payment processing delays</span>
                      <Badge variant="outline">15 reports</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="font-medium text-green-800">Positive Feedback</div>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>User interface design</span>
                      <Badge variant="outline" className="bg-green-100">92% positive</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Property information quality</span>
                      <Badge variant="outline" className="bg-green-100">88% positive</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Customer support</span>
                      <Badge variant="outline" className="bg-green-100">85% positive</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Metrics Tab */}
        <TabsContent value="business" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {performanceData.businessMetrics.conversionRate}%
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Visitor to inquiry rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Retention Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {performanceData.businessMetrics.retentionRate}%
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};