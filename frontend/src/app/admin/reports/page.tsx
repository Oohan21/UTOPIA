// src/app/admin/reports/page.tsx
'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
    BarChart3,
    Download,
    Users,
    Home,
    DollarSign,
    TrendingUp,
    Calendar,
    FileText,
    PieChart,
    LineChart,
    Filter,
    RefreshCw,
    Loader2,
    Activity,
    Target,
    Clock,
    CheckCircle
} from 'lucide-react'
import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import {
    BaseSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

// Report type options
const REPORT_TYPES = [
    { value: 'monthly', label: 'Monthly Report' },
    { value: 'quarterly', label: 'Quarterly Report' },
    { value: 'yearly', label: 'Yearly Report' },
    { value: 'user_analytics', label: 'User Analytics' },
    { value: 'property_analytics', label: 'Property Analytics' },
    { value: 'financial', label: 'Financial Report' },
]

// Date range options
const DATE_RANGES = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
]

export default function AdminReportsPage() {
    const [reportType, setReportType] = useState('monthly')
    const [dateRange, setDateRange] = useState('current_month')
    const [customStartDate, setCustomStartDate] = useState('')
    const [customEndDate, setCustomEndDate] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')

    // Fetch system stats
    const { data: adminStats, isLoading: statsLoading, refetch } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: () => adminApi.getAdminDashboard(),  
    })

    // Mock data for charts (in a real app, this would come from API)
    const monthlyData = [
        { month: 'Jan', users: 65, properties: 120, inquiries: 85, revenue: 45000 },
        { month: 'Feb', users: 78, properties: 135, inquiries: 92, revenue: 52000 },
        { month: 'Mar', users: 92, properties: 155, inquiries: 110, revenue: 61000 },
        { month: 'Apr', users: 105, properties: 170, inquiries: 125, revenue: 68000 },
        { month: 'May', users: 120, properties: 190, inquiries: 140, revenue: 75000 },
        { month: 'Jun', users: 135, properties: 210, inquiries: 155, revenue: 82000 },
    ]

    const propertyTypeData = [
        { type: 'House', count: 45, percentage: 30 },
        { type: 'Apartment', count: 65, percentage: 43 },
        { type: 'Commercial', count: 20, percentage: 13 },
        { type: 'Land', count: 15, percentage: 10 },
        { type: 'Other', count: 5, percentage: 4 },
    ]

    const userTypeData = [
        { type: 'Buyer', count: 85, percentage: 45 },
        { type: 'Seller', count: 45, percentage: 24 },
        { type: 'Agent', count: 35, percentage: 18 },
        { type: 'Landlord', count: 15, percentage: 8 },
        { type: 'Developer', count: 10, percentage: 5 },
    ]

    const handleGenerateReport = async () => {
        try {
            setIsGenerating(true)
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000))

            // In a real app, this would call an API endpoint
            // const report = await adminApi.generateReport({
            //   report_type: reportType,
            //   date_range: dateRange,
            //   start_date: customStartDate,
            //   end_date: customEndDate
            // })

            toast.success('Report generated successfully')
        } catch (error) {
            toast.error('Failed to generate report')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleExportReport = (format: 'pdf' | 'csv' | 'excel') => {
        toast.loading(`Exporting report as ${format.toUpperCase()}...`)
        // Simulate export
        setTimeout(() => {
            toast.dismiss()
            toast.success(`Report exported as ${format.toUpperCase()}`)
        }, 1500)
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
                    <p className="text-muted-foreground">
                        Generate and analyze system performance reports
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Advanced Filters
                    </Button>
                    <Button onClick={handleGenerateReport} disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Generate Report
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Report Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Report Configuration</CardTitle>
                    <CardDescription>Configure report parameters and filters</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="report-type">Report Type</Label>
                            <BaseSelect
                                value={reportType}
                                onValueChange={setReportType}
                            >
                                <SelectTrigger id="report-type">
                                    <SelectValue placeholder="Select report type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {REPORT_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </BaseSelect>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date-range">Date Range</Label>
                            <BaseSelect
                                value={dateRange}
                                onValueChange={setDateRange}
                            >
                                <SelectTrigger id="date-range">
                                    <SelectValue placeholder="Select date range" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DATE_RANGES.map((range) => (
                                        <SelectItem key={range.value} value={range.value}>
                                            {range.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </BaseSelect>
                        </div>

                        <div className="flex items-end gap-2">
                            <Button className="w-full" onClick={() => refetch()}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh Data
                            </Button>
                        </div>
                    </div>

                    {dateRange === 'custom' && (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="start-date">Start Date</Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-date">End Date</Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
                <CardHeader>
                    <CardTitle>Export Options</CardTitle>
                    <CardDescription>Export your reports in different formats</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => handleExportReport('pdf')}>
                            <FileText className="mr-2 h-4 w-4" />
                            Export as PDF
                        </Button>
                        <Button variant="outline" onClick={() => handleExportReport('csv')}>
                            <Download className="mr-2 h-4 w-4" />
                            Export as CSV
                        </Button>
                        <Button variant="outline" onClick={() => handleExportReport('excel')}>
                            <Download className="mr-2 h-4 w-4" />
                            Export as Excel
                        </Button>
                        <Button variant="outline">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Print Report
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for Different Reports */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="users">User Analytics</TabsTrigger>
                    <TabsTrigger value="properties">Property Analytics</TabsTrigger>
                    <TabsTrigger value="financial">Financial</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                        <p className="text-3xl font-bold">
                                            {statsLoading ? '...' : adminStats?.total_users || 0}
                                        </p>
                                        <p className="text-sm text-green-600 dark:text-green-400">+12% from last month</p>
                                    </div>
                                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Active Properties</p>
                                        <p className="text-3xl font-bold">
                                            {statsLoading ? '...' : adminStats?.active_properties || 0}
                                        </p>
                                        <p className="text-sm text-green-600 dark:text-green-400">+8% from last month</p>
                                    </div>
                                    <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                                        <Home className="h-5 w-5 text-green-600 dark:text-green-300" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                                        <p className="text-3xl font-bold">
                                            {statsLoading ? '...' : formatCurrency(adminStats?.revenue_month || 0)}
                                        </p>
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                            +{adminStats?.revenue_growth || 0}% growth
                                        </p>
                                    </div>
                                    <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                                        <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                                        <p className="text-3xl font-bold">
                                            {statsLoading ? '...' : `${adminStats?.avg_response_time || 0}m`}
                                        </p>
                                        <p className="text-sm text-green-600 dark:text-green-400">-15% from last month</p>
                                    </div>
                                    <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 mt-6 md:grid-cols-2">
                        {/* Monthly Performance */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" />
                                    Monthly Performance
                                </CardTitle>
                                <CardDescription>Key metrics over the last 6 months</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {monthlyData.map((month) => (
                                        <div key={month.month} className="flex items-center justify-between">
                                            <span className="font-medium">{month.month}</span>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="outline">{month.users} Users</Badge>
                                                <Badge variant="outline">{month.properties} Properties</Badge>
                                                <Badge variant="outline">{month.inquiries} Inquiries</Badge>
                                                <span className="font-medium">{formatCurrency(month.revenue)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* System Health */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    System Health
                                </CardTitle>
                                <CardDescription>Overall system performance metrics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Storage Used</span>
                                            <span className="text-sm font-medium">
                                                {statsLoading ? '...' : `${(adminStats?.storage_used || 0).toFixed(1)} GB`}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full"
                                                style={{ width: `${Math.min((adminStats?.storage_used || 0) / 100 * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Active Users</span>
                                            <span className="text-sm font-medium">
                                                {statsLoading ? '...' : `${adminStats?.active_users || 0} users`}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${Math.min(((adminStats?.active_users || 0) / (adminStats?.total_users || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Property Approval Rate</span>
                                            <span className="text-sm font-medium">
                                                {statsLoading ? '...' : '92%'}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 rounded-full"
                                                style={{ width: '92%' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Inquiry Response Rate</span>
                                            <span className="text-sm font-medium">
                                                {statsLoading ? '...' : '88%'}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-orange-500 rounded-full"
                                                style={{ width: '88%' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* User Analytics Tab */}
                <TabsContent value="users">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    User Distribution
                                </CardTitle>
                                <CardDescription>Breakdown of users by type</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {userTypeData.map((item) => (
                                        <div key={item.type} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{item.type}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {item.count} users ({item.percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    User Growth
                                </CardTitle>
                                <CardDescription>New user registrations over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium">Total Registrations</p>
                                            <p className="text-2xl font-bold">{adminStats?.total_users || 0}</p>
                                        </div>
                                        <CheckCircle className="h-8 w-8 text-green-500" />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Verified Users</span>
                                            <Badge variant="outline" className="bg-green-50 text-green-700">
                                                {Math.round(((adminStats?.active_users || 0) / (adminStats?.total_users || 1)) * 100)}%
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Active This Month</span>
                                            <Badge variant="outline">
                                                +{(adminStats?.total_users || 0) * 0.12} new
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Agent Conversions</span>
                                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                                15 this month
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Property Analytics Tab */}
                <TabsContent value="properties">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Home className="h-5 w-5" />
                                    Property Type Distribution
                                </CardTitle>
                                <CardDescription>Breakdown of properties by type</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {propertyTypeData.map((item) => (
                                        <div key={item.type} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{item.type}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {item.count} properties ({item.percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Property Status
                                </CardTitle>
                                <CardDescription>Current status of listed properties</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                <p className="text-sm font-medium">Available</p>
                                                <p className="text-2xl font-bold">
                                                    {Math.round((adminStats?.active_properties || 0) * 0.65)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                <p className="text-sm font-medium">Sold/Rented</p>
                                                <p className="text-2xl font-bold">
                                                    {Math.round((adminStats?.active_properties || 0) * 0.25)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                                <p className="text-sm font-medium">Pending</p>
                                                <p className="text-2xl font-bold">
                                                    {Math.round((adminStats?.active_properties || 0) * 0.08)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                                <p className="text-sm font-medium">Featured</p>
                                                <p className="text-2xl font-bold">
                                                    {Math.round((adminStats?.active_properties || 0) * 0.12)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Average Days on Market</span>
                                            <span className="font-medium">45 days</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Average Price</span>
                                            <span className="font-medium">{formatCurrency(4500000)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Price per SQM</span>
                                            <span className="font-medium">{formatCurrency(15000)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Revenue Overview
                                </CardTitle>
                                <CardDescription>Monthly revenue breakdown</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-sm font-medium">Total Revenue (YTD)</p>
                                        <p className="text-2xl font-bold">{formatCurrency(520000)}</p>
                                    </div>

                                    <div className="space-y-3">
                                        {monthlyData.map((month) => (
                                            <div key={month.month} className="flex items-center justify-between">
                                                <span className="font-medium">{month.month}</span>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-medium">{formatCurrency(month.revenue)}</span>
                                                    <Badge variant="outline" className={
                                                        month.revenue > 60000 ? 'bg-green-50 text-green-700' :
                                                            month.revenue > 50000 ? 'bg-blue-50 text-blue-700' :
                                                                'bg-yellow-50 text-yellow-700'
                                                    }>
                                                        {month.revenue > 60000 ? 'High' :
                                                            month.revenue > 50000 ? 'Medium' : 'Low'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChart className="h-5 w-5" />
                                    Revenue Sources
                                </CardTitle>
                                <CardDescription>Breakdown by revenue source</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                            <span className="font-medium">Premium Listings</span>
                                            <span className="font-bold">{formatCurrency(250000)}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded">
                                            <span className="font-medium">Agent Commissions</span>
                                            <span className="font-bold">{formatCurrency(150000)}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                                            <span className="font-medium">Featured Properties</span>
                                            <span className="font-bold">{formatCurrency(80000)}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
                                            <span className="font-medium">Advertisements</span>
                                            <span className="font-bold">{formatCurrency(40000)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">Growth Rate</span>
                                            <Badge className="bg-green-100 text-green-800">
                                                +{adminStats?.revenue_growth || 0}%
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="font-medium">Projected Next Month</span>
                                            <span className="font-bold">{formatCurrency(90000)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                            <p className="text-3xl font-bold">8.2%</p>
                            <p className="text-sm text-green-600 dark:text-green-400">+1.2% from last month</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">Avg. Property Value</p>
                            <p className="text-3xl font-bold">{formatCurrency(4500000)}</p>
                            <p className="text-sm text-green-600 dark:text-green-400">+5.5% from last quarter</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">User Engagement</p>
                            <p className="text-3xl font-bold">78%</p>
                            <p className="text-sm text-green-600 dark:text-green-400">+3.2% from last month</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground">Customer Satisfaction</p>
                            <p className="text-3xl font-bold">4.8/5</p>
                            <p className="text-sm text-green-600 dark:text-green-400">Based on 245 reviews</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}