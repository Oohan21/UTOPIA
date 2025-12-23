// src/components/dashboard/RealtimeAnalytics.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { io, Socket } from 'socket.io-client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { formatNumber } from '@/lib/utils/formatNumber';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Activity, Users, Eye, MessageSquare, TrendingUp, AlertCircle } from 'lucide-react';

interface RealtimeEvent {
  id: string;
  type: 'property_view' | 'inquiry' | 'user_registration' | 'property_listing' | 'payment';
  timestamp: string;
  data: any;
}

export const RealtimeAnalytics: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const [recentEvents, setRecentEvents] = useState<RealtimeEvent[]>([]);
  const [metrics, setMetrics] = useState({
    propertyViews: 0,
    inquiries: 0,
    registrations: 0,
    listings: 0,
    payments: 0
  });
  const [timeRange, setTimeRange] = useState('5m');

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000', {
      path: '/ws/analytics',
      transports: ['websocket'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('realtime_metrics', (data) => {
      setActiveUsers(data.active_users);
    });

    newSocket.on('realtime_event', (event: RealtimeEvent) => {
      setRecentEvents(prev => [event, ...prev.slice(0, 9)]);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        [event.type === 'property_view' ? 'propertyViews' :
         event.type === 'inquiry' ? 'inquiries' :
         event.type === 'user_registration' ? 'registrations' :
         event.type === 'property_listing' ? 'listings' : 'payments']: 
         prev[event.type === 'property_view' ? 'propertyViews' :
              event.type === 'inquiry' ? 'inquiries' :
              event.type === 'user_registration' ? 'registrations' :
              event.type === 'property_listing' ? 'listings' : 'payments'] + 1
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Simulated real-time data
  const realtimeData = [
    { time: 'Now', users: activeUsers, views: metrics.propertyViews, inquiries: metrics.inquiries },
    { time: '-1m', users: Math.max(0, activeUsers - 2), views: Math.max(0, metrics.propertyViews - 5), inquiries: Math.max(0, metrics.inquiries - 1) },
    { time: '-2m', users: Math.max(0, activeUsers - 4), views: Math.max(0, metrics.propertyViews - 10), inquiries: Math.max(0, metrics.inquiries - 2) },
    { time: '-3m', users: Math.max(0, activeUsers - 3), views: Math.max(0, metrics.propertyViews - 8), inquiries: Math.max(0, metrics.inquiries - 1) },
    { time: '-4m', users: Math.max(0, activeUsers - 1), views: Math.max(0, metrics.propertyViews - 3), inquiries: Math.max(0, metrics.inquiries - 0) },
    { time: '-5m', users: Math.max(0, activeUsers - 5), views: Math.max(0, metrics.propertyViews - 12), inquiries: Math.max(0, metrics.inquiries - 3) }
  ];

  const getEventIcon = (type: RealtimeEvent['type']) => {
    switch (type) {
      case 'property_view': return <Eye className="h-4 w-4" />;
      case 'inquiry': return <MessageSquare className="h-4 w-4" />;
      case 'user_registration': return <Users className="h-4 w-4" />;
      case 'property_listing': return <Activity className="h-4 w-4" />;
      case 'payment': return <TrendingUp className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: RealtimeEvent['type']) => {
    switch (type) {
      case 'property_view': return 'bg-blue-100 text-blue-800';
      case 'inquiry': return 'bg-green-100 text-green-800';
      case 'user_registration': return 'bg-purple-100 text-purple-800';
      case 'property_listing': return 'bg-yellow-100 text-yellow-800';
      case 'payment': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventData = (event: RealtimeEvent) => {
    switch (event.type) {
      case 'property_view':
        return `Viewed property: ${event.data.property_title}`;
      case 'inquiry':
        return `Inquiry for: ${event.data.property_title}`;
      case 'user_registration':
        return `New user: ${event.data.email}`;
      case 'property_listing':
        return `New listing: ${event.data.property_title}`;
      case 'payment':
        return `Payment: ${formatCurrency(event.data.amount, 'ETB')}`;
      default:
        return 'Unknown event';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Real-time Analytics</h2>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange} placeholder="Time Range">
            <SelectContent>
              <SelectItem value="1m">Last minute</SelectItem>
              <SelectItem value="5m">Last 5 minutes</SelectItem>
              <SelectItem value="15m">Last 15 minutes</SelectItem>
              <SelectItem value="1h">Last hour</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setRecentEvents([]);
              setMetrics({
                propertyViews: 0,
                inquiries: 0,
                registrations: 0,
                listings: 0,
                payments: 0
              });
            }}
          >
            Clear Data
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-800">WebSocket Disconnected</div>
                <div className="text-sm text-yellow-600">
                  Real-time data is not being received. Check your connection.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              {formatNumber(activeUsers)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Currently online
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Property Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              {formatNumber(metrics.propertyViews)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Last {timeRange}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Inquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              {formatNumber(metrics.inquiries)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Last {timeRange}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              New Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-yellow-600" />
              {formatNumber(metrics.listings)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Last {timeRange}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              {formatNumber(metrics.payments)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Last {timeRange}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="activity">Activity Stream</TabsTrigger>
          <TabsTrigger value="metrics">Live Metrics</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        {/* Activity Stream Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Activity Stream</CardTitle>
              <CardDescription>
                Real-time events from the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event, index) => (
                    <div
                      key={`${event.id}-${index}`}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${getEventColor(event.type)}`}>
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {formatEventData(event)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(event.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {event.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="mb-2">No recent activity</div>
                    <div className="text-sm">Events will appear here in real-time</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>
                  Real-time user engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">
                        {formatNumber(activeUsers)}
                      </div>
                      <div className="text-sm text-blue-600 mt-1">Active Users</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">
                        {formatNumber(metrics.propertyViews)}
                      </div>
                      <div className="text-sm text-green-600 mt-1">Page Views</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sessions Started</span>
                      <span className="font-medium">{formatNumber(Math.floor(activeUsers * 0.3))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg. Session Duration</span>
                      <span className="font-medium">4m 32s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bounce Rate</span>
                      <span className="font-medium">32%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Metrics</CardTitle>
                <CardDescription>
                  Real-time conversion tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">
                        {metrics.inquiries}
                      </div>
                      <div className="text-sm text-purple-600 mt-1">Inquiries</div>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-700">
                        {metrics.payments}
                      </div>
                      <div className="text-sm text-indigo-600 mt-1">Payments</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Conversion Rate</span>
                      <span className="font-medium text-green-600">
                        {metrics.propertyViews > 0 
                          ? ((metrics.inquiries / metrics.propertyViews) * 100).toFixed(1)
                          : '0'}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg. Response Time</span>
                      <span className="font-medium">2m 15s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="font-medium text-green-600">94.5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Users Trend</CardTitle>
                <CardDescription>
                  Real-time user count over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={realtimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        name="Active Users" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Volume</CardTitle>
                <CardDescription>
                  Views and inquiries over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={realtimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="views" 
                        name="Property Views" 
                        stroke="#10b981" 
                        fill="#10b98122"
                        isAnimationActive={false}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="inquiries" 
                        name="Inquiries" 
                        stroke="#8b5cf6" 
                        fill="#8b5cf622"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Event Distribution</CardTitle>
              <CardDescription>
                Real-time event breakdown by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { type: 'Views', count: metrics.propertyViews, color: '#3b82f6' },
                    { type: 'Inquiries', count: metrics.inquiries, color: '#10b981' },
                    { type: 'Registrations', count: metrics.registrations, color: '#8b5cf6' },
                    { type: 'Listings', count: metrics.listings, color: '#f59e0b' },
                    { type: 'Payments', count: metrics.payments, color: '#ef4444' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey="count" 
                      name="Event Count"
                      fill="#8884d8"
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Real-time system performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">245ms</div>
              <div className="text-sm text-gray-500 mt-1">Avg Response Time</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">99.92%</div>
              <div className="text-sm text-gray-500 mt-1">API Availability</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">0.8%</div>
              <div className="text-sm text-gray-500 mt-1">Error Rate</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">1.2s</div>
              <div className="text-sm text-gray-500 mt-1">Page Load Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};