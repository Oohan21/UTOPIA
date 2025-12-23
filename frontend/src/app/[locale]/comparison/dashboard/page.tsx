// src/app/comparison/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/common/Header/Header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Home, 
  Download,
  Share2,
  Sparkles,
  Users,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { useComparison } from '@/lib/hooks/useComparison'
import { comparisonApi } from '@/lib/api/comparison'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import toast from 'react-hot-toast'

export default function ComparisonDashboardPage() {
  const { savedComparisons } = useComparison()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    loadDashboardData()
  }, [timeRange])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setLastUpdated(new Date().toLocaleTimeString())
      const response = await comparisonApi.getComparisonDashboard()
      setDashboardData(response.data)
      toast.success('Dashboard data loaded successfully', {
        duration: 3000,
        icon: '✅',
      })
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error)
      
      // If the endpoint doesn't exist yet, use fallback data
      if (error.response?.status === 404) {
        toast.error('Dashboard endpoint not available. Using local data.', {
          duration: 4000,
          icon: '⚠️',
        })
        setDashboardData(getFallbackData())
      } else if (error.message?.includes('Network Error')) {
        toast.error('Network error. Check your connection.', {
          duration: 4000,
          icon: '📡',
        })
        setDashboardData(getFallbackData())
      } else {
        toast.error('Failed to load dashboard data', {
          duration: 4000,
          icon: '❌',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getFallbackData = () => {
    // Fallback data using existing saved comparisons
    const totalComparisons = savedComparisons.length || 0
    const totalProperties = savedComparisons.reduce((sum, comp) => 
      sum + (comp.properties?.length || 0), 0
    )
    const avgPropertiesPerComparison = totalComparisons > 0 
      ? totalProperties / totalComparisons 
      : 0
    
    // Analyze property types from saved comparisons
    const propertyTypes: Record<string, number> = {}
    savedComparisons.forEach(comp => {
      comp.properties?.forEach((prop: any) => {
        const type = prop.property_type || 'Unknown'
        propertyTypes[type] = (propertyTypes[type] || 0) + 1
      })
    })

    const preferredPropertyTypes = Object.entries(propertyTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Generate timeline data
    const timeline = generateTimelineData(savedComparisons)

    return {
      overview: {
        total_comparisons: totalComparisons,
        avg_properties_per_comparison: avgPropertiesPerComparison.toFixed(1),
        comparison_frequency: avgPropertiesPerComparison > 2 ? 'high' : 'low'
      },
      comparison_habits: {
        comparison_frequency: totalComparisons > 10 ? 'high' : 'low',
        preferred_property_types: preferredPropertyTypes,
        most_active_day: new Date().toLocaleDateString('en-US', { weekday: 'long' })
      },
      comparison_timeline: timeline,
      most_compared_properties: getMostComparedProperties(savedComparisons),
      saved_comparisons: savedComparisons.slice(0, 5).map(comp => ({
        ...comp,
        property_count: comp.properties?.length || 0
      }))
    }
  }

  const generateTimelineData = (comparisons: any[]) => {
    // Generate last 30 days timeline
    const timeline = []
    const now = new Date()
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date()
      date.setDate(now.getDate() - i)
      
      const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      // Count comparisons on this day
      const count = comparisons.filter(comp => {
        const compDate = new Date(comp.created_at)
        return compDate.toDateString() === date.toDateString()
      }).length
      
      timeline.push({
        date: dateString,
        count: count
      })
    }
    
    return timeline
  }

  const getMostComparedProperties = (comparisons: any[]) => {
    // Count how many times each property appears in comparisons
    const propertyCounts: Record<number, { property: any, count: number }> = {}
    
    comparisons.forEach(comp => {
      comp.properties?.forEach((prop: any) => {
        if (!propertyCounts[prop.id]) {
          propertyCounts[prop.id] = { property: prop, count: 0 }
        }
        propertyCounts[prop.id].count++
      })
    })
    
    return Object.values(propertyCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item, index) => ({
        id: item.property.id,
        title: item.property.title || `Property ${item.property.id}`,
        property_type: item.property.property_type || 'Unknown',
        city: { name: item.property.city?.name || 'Unknown' },
        comparison_count: item.count
      }))
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-medium mb-2">Loading Dashboard</h3>
            <p className="text-muted-foreground">Fetching your comparison analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  const data = dashboardData || getFallbackData()
  const isUsingFallbackData = !dashboardData

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto py-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Comparison Analytics</h1>
            <p className="text-muted-foreground">
              Track your property comparison activity and insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isUsingFallbackData && (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Using Local Data
              </Badge>
            )}
            {lastUpdated && (
              <div className="text-sm text-muted-foreground">
                Updated: {lastUpdated}
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={loadDashboardData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Comparisons</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {data.overview?.total_comparisons || 0}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-3">
                All time saved comparisons
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Properties/Comparison</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {parseFloat(data.overview?.avg_properties_per_comparison || 0).toFixed(1)}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-3">
                Average properties per comparison
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Most Compared Type</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {data.comparison_habits?.preferred_property_types?.[0]?.type || 'None'}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-3">
                {data.comparison_habits?.preferred_property_types?.[0]?.count || 0} properties
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saved Comparisons</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {savedComparisons.length}
                  </h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-3">
                Available for review
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Comparison Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Comparison Activity</CardTitle>
              <CardDescription>
                Your comparison activity timeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.comparison_timeline?.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.comparison_timeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }}
                        name="Comparisons"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center border rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No timeline data available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Start saving comparisons to see your activity
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Property Type Distribution</CardTitle>
              <CardDescription>
                Types of properties you compare
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.comparison_habits?.preferred_property_types?.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.comparison_habits.preferred_property_types}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => 
                          `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {data.comparison_habits.preferred_property_types.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => [`${value} properties`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center border rounded-lg">
                  <div className="text-center">
                    <Home className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No property type data</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Compare different property types to see distribution
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Most Compared Properties */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Most Compared Properties</CardTitle>
            <CardDescription>
              Properties you compare most frequently
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.most_compared_properties?.length > 0 ? (
              <div className="space-y-4">
                {data.most_compared_properties.map((property: any, index: number) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <span className="font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{property.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {property.property_type} • {property.city?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">
                        {property.comparison_count || 0} comparisons
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No frequently compared properties</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Properties you compare frequently will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Comparisons */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Comparisons</CardTitle>
            <CardDescription>
              Your most recent property comparisons
            </CardDescription>
          </CardHeader>
          <CardContent>
            {savedComparisons.length > 0 ? (
              <div className="space-y-4">
                {savedComparisons.slice(0, 5).map((comparison: any) => (
                  <div 
                    key={comparison.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => {
                      // You could navigate to the comparison detail view
                      console.log('View comparison:', comparison.id)
                    }}
                  >
                    <div>
                      <h4 className="font-medium">{comparison.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(comparison.created_at).toLocaleDateString()}
                        </span>
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {comparison.properties?.length || 0} properties
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle view action
                          toast.success('Loading comparison...', {
                            duration: 2000,
                            icon: '📊',
                          })
                        }}
                      >
                        View
                      </Button>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle reuse action
                          toast.success('Comparison loaded for reuse', {
                            duration: 2000,
                            icon: '🔄',
                          })
                        }}
                      >
                        Reuse
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No saved comparisons yet</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Save your comparisons to see them here
                </p>
                <Button 
                  onClick={() => window.location.href = '/comparison'}
                  className="mt-2"
                >
                  Start Comparing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights Section */}
        <Card className="mt-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Comparison Insights
            </CardTitle>
            <CardDescription>
              Personalized recommendations based on your comparison habits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="font-medium">Comparison Pattern</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  You typically compare {parseFloat(data.overview?.avg_properties_per_comparison || 0).toFixed(1)} properties at a time.
                  {parseFloat(data.overview?.avg_properties_per_comparison || 0) < 3 && 
                    ' Consider comparing 3-5 properties for better insights.'}
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Home className="h-4 w-4 text-green-600" />
                  </div>
                  <h4 className="font-medium">Property Preference</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.comparison_habits?.preferred_property_types?.[0]?.type 
                    ? `You focus on ${data.comparison_habits.preferred_property_types[0].type} properties. This helps narrow down your search.`
                    : 'Your property preferences are varied. Try focusing on specific types for better results.'
                  }
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <h4 className="font-medium">Activity Level</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.overview?.total_comparisons > 5 
                    ? `You have ${data.overview?.total_comparisons} saved comparisons. Great job tracking your research!`
                    : 'Start saving more comparisons to build your property research history.'}
                </p>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                  </div>
                  <h4 className="font-medium">Next Steps</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.overview?.total_comparisons < 3 
                    ? 'Try saving more comparisons to get better insights.' 
                    : 'Review your saved comparisons to identify patterns in your preferences.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Banner */}
        {isUsingFallbackData && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-800">Dashboard API in Development</h4>
                <p className="text-sm text-amber-700 mt-1">
                  This dashboard is currently using locally calculated data. 
                  The full analytics API is being implemented and will provide more detailed insights.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-white text-amber-800">
                    Local Mode
                  </Badge>
                  <span className="text-xs text-amber-600">
                    Data source: Your saved comparisons
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}