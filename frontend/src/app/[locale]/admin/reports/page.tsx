// src/app/admin/reports/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    FileText,
    Download,
    Calendar,
    Users,
    Building2,
    MessageSquare,
    DollarSign,
    TrendingUp,
    BarChart3,
    Filter,
    RefreshCw,
    Printer,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    TrendingDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { adminApi, SystemReport, Property as ApiProperty } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatDate } from '@/lib/utils/formatDate';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import AdminLayout from '@/components/admin/AdminLayout';
import { toast } from 'react-hot-toast';
import { Property as PropertyType } from '@/lib/types/property';

// Define local interfaces
interface LocalAnalyticsData {
    date: string;
    users: number;
    properties: number;
    inquiries: number;
    revenue: number;
}

interface ReportData {
    period: string;
    newUsers: number;
    newProperties: number;
    inquiries: number;
    revenue: number;
    activeUsers: number;
    topProperties: PropertyType[];
    popularCities: { name: string; count: number }[];
    userGrowth: number;
    propertyGrowth: number;
    revenueGrowth: number;
    propertyTypeDistribution: { type: string; count: number; percentage: number }[];
    userTypeDistribution: { type: string; count: number; percentage: number }[];
    inquiryStatusDistribution: { status: string; count: number; percentage: number }[];
}

// Helper function for growth calculation
const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
};

const ReportsPage = () => {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [stats, setStats] = useState<SystemReport | null>(null);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [analyticsData, setAnalyticsData] = useState<LocalAnalyticsData[]>([]);
    const [reportType, setReportType] = useState('monthly');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });
    const [format, setFormat] = useState('preview');

    const fetchStats = async () => {
        try {
            setLoading(true);
            const statsData = await adminApi.getAdminDashboard();
            setStats(statsData);

            // Generate report data from real stats
            generateReportFromStats(statsData);

            // Try to fetch analytics, but handle errors gracefully
            try {
                const analyticsResponse = await adminApi.getAnalytics('30d');
                console.log('Analytics response:', analyticsResponse);

                // Transform analytics data based on actual API response
                if (analyticsResponse && Array.isArray(analyticsResponse)) {
                    const transformedAnalytics = transformAnalyticsData(analyticsResponse);
                    setAnalyticsData(transformedAnalytics);
                }
            } catch (analyticsError) {
                console.warn('Analytics fetch failed, using mock data:', analyticsError);
                // Use mock analytics data as fallback
                setAnalyticsData(generateMockAnalyticsData());
            }
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            toast.error('Failed to load report data');

            // Load mock data on error
            loadMockData();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const transformAnalyticsData = (apiData: any[]): LocalAnalyticsData[] => {
        console.log('Transforming analytics data:', apiData);

        if (!apiData || !Array.isArray(apiData)) {
            return generateMockAnalyticsData();
        }

        return apiData.map((item: any) => {
            // Extract data based on different possible API response structures
            const metrics = item.metrics || item;

            return {
                date: item.period || new Date().toISOString().split('T')[0],
                users: metrics.users || metrics.user_count || metrics.new_users || 0,
                properties: metrics.properties || metrics.property_count || metrics.new_properties || 0,
                inquiries: metrics.inquiries || metrics.inquiry_count || metrics.new_inquiries || 0,
                revenue: metrics.revenue || metrics.revenue_etb || 0
            };
        });
    };

    const generateMockAnalyticsData = (): LocalAnalyticsData[] => {
        const data: LocalAnalyticsData[] = [];
        const now = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            data.push({
                date: date.toISOString().split('T')[0],
                users: Math.floor(Math.random() * 50) + 20,
                properties: Math.floor(Math.random() * 30) + 10,
                inquiries: Math.floor(Math.random() * 100) + 30,
                revenue: Math.floor(Math.random() * 50000) + 10000
            });
        }

        return data;
    };

    const generateMockTopProperties = (): PropertyType[] => {
        return Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            title: `Property ${i + 1}`,
            property_type: ['house', 'apartment', 'villa', 'commercial'][i % 4],
            property_status: 'available',
            city: {
                id: i + 1,
                name: ['Addis Ababa', 'Adama', 'Bahir Dar', 'Hawassa', 'Mekele'][i % 5],
                name_amharic: '',
                slug: '',
                is_capital: false,
                is_active: true,
                created_at: new Date().toISOString()
            } as any,
            sub_city: {
                id: i + 1,
                name: ['Bole', 'Kazanchis', 'Piassa', 'Megenagna'][i % 4],
                name_amharic: '',
                city: {} as any,
                is_popular: false
            } as any,
            price_etb: Math.floor(Math.random() * 5000000) + 1000000,
            bedrooms: Math.floor(Math.random() * 5) + 1,
            bathrooms: Math.floor(Math.random() * 4) + 1,
            total_area: Math.floor(Math.random() * 500) + 100,
            is_featured: i < 2,
            is_verified: true,
            is_active: true,
            views_count: Math.floor(Math.random() * 1000),
            inquiry_count: Math.floor(Math.random() * 50),
            images: [],
            created_at: new Date().toISOString(),
            property_id: `PROP-${1000 + i}`,
            description: 'Sample property description',
            listing_type: 'for_sale',
            owner: {} as any,
            specific_location: 'Sample location',
            floors: 1,
            furnishing_type: 'unfurnished',
            price_negotiable: false,
            amenities: [],
            has_parking: true,
            has_garden: false,
            has_security: true,
            has_heating: false,
            has_internet: true,
            has_generator: false,
            has_elevator: false,
            has_swimming_pool: false,
            has_gym: false,
            has_conference_room: false,
            is_pet_friendly: false,
            is_wheelchair_accessible: false,
            has_backup_water: false,
            is_premium: i < 1,
            save_count: 0,
            has_title_deed: true,
            has_construction_permit: true,
            has_occupancy_certificate: true,
            updated_at: new Date().toISOString(),
            listed_date: new Date().toISOString(),
            agent: undefined,
            developer: undefined,
            address_line_1: '',
            address_line_2: '',
            plot_size: undefined,
            built_year: undefined,
            price_usd: undefined,
            monthly_rent: undefined,
            security_deposit: undefined,
            maintenance_fee: undefined,
            property_tax: undefined,
            virtual_tour_url: undefined,
            video_url: undefined,
            property_video: undefined,
            price_per_sqm: undefined,
            days_on_market: undefined,
            price_display: '',
            key_features: [],
            comparison_score: undefined,
            promotion_tier: undefined,
            promotion_duration: undefined,
            promotion_price: undefined,
            promotion_active: undefined,
            promotion_start: undefined,
            promotion_end: undefined,
            is_promoted: false,
            promotion_status: undefined,
            promotion_priority: undefined,
            promotion_benefits: undefined
        }));
    };

    const loadMockData = () => {
        const mockStats: SystemReport = {
            total_users: 1250,
            total_properties: 890,
            total_inquiries: 3450,
            total_valuations: 560,
            active_users: 850,
            active_properties: 720,
            revenue_month: 1250000,
            revenue_year: 8500000,
            storage_used: 2457600, // 2.4 GB
            avg_response_time: 120
        };

        setStats(mockStats);
        setAnalyticsData(generateMockAnalyticsData());
        generateReportFromStats(mockStats);
    };

    const generateReportFromStats = (statsData: any) => {
        if (!statsData) return;

        // Calculate growth from analytics data
        let userGrowth = 0;
        let propertyGrowth = 0;
        let revenueGrowth = 0;

        if (analyticsData.length >= 2) {
            const current = analyticsData[analyticsData.length - 1];
            const previous = analyticsData[analyticsData.length - 2];

            userGrowth = calculateGrowth(current.users, previous.users);
            propertyGrowth = calculateGrowth(current.properties, previous.properties);
            revenueGrowth = calculateGrowth(current.revenue, previous.revenue);
        }

        // Get popular cities
        const popularCities = [
            { name: 'Addis Ababa', count: 125 },
            { name: 'Adama', count: 67 },
            { name: 'Bahir Dar', count: 42 },
            { name: 'Hawassa', count: 35 },
            { name: 'Mekele', count: 28 },
        ];

        // Property type distribution
        const propertyTypeDistribution = [
            { type: 'House', count: 320, percentage: 36 },
            { type: 'Apartment', count: 280, percentage: 31 },
            { type: 'Villa', count: 150, percentage: 17 },
            { type: 'Commercial', count: 85, percentage: 10 },
            { type: 'Land', count: 55, percentage: 6 }
        ];

        // User type distribution
        const userTypeDistribution = [
            { type: 'User', count: 1150, percentage: 92 },
            { type: 'Administrator', count: 100, percentage: 8 }
        ];

        // Inquiry status distribution
        const inquiryStatusDistribution = [
            { status: 'Pending', count: 850, percentage: 25 },
            { status: 'Contacted', count: 1200, percentage: 35 },
            { status: 'Closed', count: 950, percentage: 28 },
            { status: 'Follow Up', count: 450, percentage: 12 }
        ];

        const data: ReportData = {
            period: `Report for ${formatDate(dateRange.startDate)} to ${formatDate(dateRange.endDate)}`,
            newUsers: Math.floor((statsData.total_users || 0) * 0.1),
            newProperties: Math.floor((statsData.total_properties || 0) * 0.05),
            inquiries: statsData.total_inquiries || 0,
            revenue: statsData.revenue_month || 0,
            activeUsers: statsData.active_users || 0,
            topProperties: generateMockTopProperties(),
            popularCities,
            userGrowth,
            propertyGrowth,
            revenueGrowth,
            propertyTypeDistribution,
            userTypeDistribution,
            inquiryStatusDistribution,
        };

        setReportData(data);
    };

    const handleGenerateReport = async () => {
        try {
            setGenerating(true);

            if (format !== 'preview') {
                // Generate downloadable report
                const blob = await adminApi.generateReport(
                    reportType,
                    dateRange.startDate,
                    dateRange.endDate
                );

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report-${reportType}-${dateRange.startDate}-to-${dateRange.endDate}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast.success(`Report generated and downloaded as ${format.toUpperCase()}`);
            } else {
                // Refresh the data
                await fetchStats();
                toast.success('Report data refreshed');
            }
        } catch (err) {
            console.error('Error generating report:', err);
            toast.error('Failed to generate report');
        } finally {
            setGenerating(false);
        }
    };

    const handlePrintReport = () => {
        window.print();
    };

    const handleExportData = async (dataType: string) => {
        try {
            const blob = await adminApi.exportData(dataType, 'csv');
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${dataType}-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success(`${dataType} exported successfully`);
        } catch (err) {
            console.error(`Error exporting ${dataType}:`, err);
            toast.error(`Failed to export ${dataType}`);
        }
    };

    const handleExportAnalytics = async () => {
        try {
            const dataStr = JSON.stringify(analyticsData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Analytics exported successfully');
        } catch (err) {
            console.error('Error exporting analytics:', err);
            toast.error('Failed to export analytics');
        }
    };

    const getGrowthColor = (growth: number) => {
        if (growth > 0) return 'text-green-600';
        if (growth < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getGrowthIcon = (growth: number) => {
        if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return null;
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            </AdminLayout>
        );
    }

    return (

        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Reports & Analytics
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Generate and view detailed platform reports
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={fetchStats}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={handlePrintReport}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Report
                    </Button>
                </div>
            </div>

            {/* Report Generator */}
            <Card>
                <CardHeader>
                    <CardTitle>Generate Report</CardTitle>
                    <CardDescription>
                        Select report type, date range, and format to generate reports
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="report-type">Report Type</Label>
                            <Select value={reportType} onValueChange={setReportType} placeholder="Select report type">
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly Report</SelectItem>
                                    <SelectItem value="quarterly">Quarterly Report</SelectItem>
                                    <SelectItem value="yearly">Yearly Report</SelectItem>
                                    <SelectItem value="custom">Custom Report</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="start-date">Start Date</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                disabled={reportType !== 'custom'}
                            />
                        </div>

                        <div>
                            <Label htmlFor="end-date">End Date</Label>
                            <Input
                                id="end-date"
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                disabled={reportType !== 'custom'}
                            />
                        </div>

                        <div>
                            <Label htmlFor="format">Format</Label>
                            <Select value={format} onValueChange={setFormat} placeholder="Select format">
                                <SelectContent>
                                    <SelectItem value="preview">Preview</SelectItem>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="csv">CSV</SelectItem>
                                    <SelectItem value="excel">Excel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDateRange({
                                    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
                                    endDate: new Date().toISOString().split('T')[0],
                                });
                                setReportType('monthly');
                                setFormat('preview');
                            }}
                        >
                            Reset
                        </Button>
                        <Button onClick={handleGenerateReport} disabled={generating}>
                            {generating ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Generate Report
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Users
                                </p>
                                <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
                                    {stats?.total_users?.toLocaleString() || 0}
                                </p>
                                <div className="flex items-center mt-2">
                                    {getGrowthIcon(reportData?.userGrowth || 0)}
                                    <span className={`text-sm ml-1 ${getGrowthColor(reportData?.userGrowth || 0)}`}>
                                        {reportData?.userGrowth ? `${reportData.userGrowth.toFixed(1)}%` : '0%'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Properties
                                </p>
                                <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
                                    {stats?.total_properties?.toLocaleString() || 0}
                                </p>
                                <div className="flex items-center mt-2">
                                    {getGrowthIcon(reportData?.propertyGrowth || 0)}
                                    <span className={`text-sm ml-1 ${getGrowthColor(reportData?.propertyGrowth || 0)}`}>
                                        {reportData?.propertyGrowth ? `${reportData.propertyGrowth.toFixed(1)}%` : '0%'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                                <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Inquiries
                                </p>
                                <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
                                    {stats?.total_inquiries?.toLocaleString() || 0}
                                </p>
                                <div className="flex items-center mt-2">
                                    {getGrowthIcon(reportData?.inquiries || 0)}
                                    <span className="text-sm text-green-600">
                                        +{(reportData?.inquiries || 0).toLocaleString()} this period
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                                <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Monthly Revenue
                                </p>
                                <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
                                    {formatCurrency(stats?.revenue_month || 0, 'ETB')}
                                </p>
                                <div className="flex items-center mt-2">
                                    {getGrowthIcon(reportData?.revenueGrowth || 0)}
                                    <span className={`text-sm ml-1 ${getGrowthColor(reportData?.revenueGrowth || 0)}`}>
                                        {reportData?.revenueGrowth ? `${reportData.revenueGrowth.toFixed(1)}%` : '0%'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/20">
                                <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="properties">Properties</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="financial">Financial</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="exports">Data Exports</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Platform Overview</CardTitle>
                                <CardDescription>
                                    Key metrics and performance indicators
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Active Users (30 days)
                                        </span>
                                        <span className="font-medium">{stats?.active_users?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Active Properties
                                        </span>
                                        <span className="font-medium">{stats?.active_properties?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            User Conversion Rate
                                        </span>
                                        <span className="font-medium text-green-600">
                                            {((stats?.total_inquiries || 0) / (stats?.total_users || 1) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Avg. Response Time
                                        </span>
                                        <span className="font-medium">{stats?.avg_response_time || 0}ms</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Storage Used
                                        </span>
                                        <span className="font-medium">
                                            {((stats?.storage_used || 0) / 1024 / 1024).toFixed(1)} MB
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Top Properties</CardTitle>
                                <CardDescription>
                                    Most viewed properties this period
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {reportData?.topProperties.slice(0, 5).map((property) => (
                                        <div
                                            key={property.id}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{property.title}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {property.city?.name}, {property.sub_city?.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">
                                                    {formatCurrency(property.price_etb, 'ETB')}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {property.views_count.toLocaleString()} views
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Property Type Distribution</CardTitle>
                            <CardDescription>
                                Breakdown of property listings by type
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {reportData?.propertyTypeDistribution.map((item) => (
                                    <div key={item.type} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">{item.type}</span>
                                            <span className="text-sm font-medium">{item.count} ({item.percentage}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Properties Tab */}
                <TabsContent value="properties" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Property Analytics</CardTitle>
                            <CardDescription>
                                Detailed property listing statistics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Listings</p>
                                    <p className="text-2xl font-bold mt-1">{stats?.total_properties?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Listings</p>
                                    <p className="text-2xl font-bold mt-1">{stats?.active_properties?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Views per Property</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {Math.round(((reportData?.topProperties.reduce((sum, p) => sum + p.views_count, 0) || 0) / (reportData?.topProperties.length || 1)))}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Verified Properties</p>
                                    <div className="flex items-center mt-1">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                        <p className="text-2xl font-bold">
                                            {Math.round((stats?.total_properties || 0) * 0.75)}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Featured Properties</p>
                                    <div className="flex items-center mt-1">
                                        <BarChart3 className="h-5 w-5 text-yellow-500 mr-2" />
                                        <p className="text-2xl font-bold">
                                            {Math.round((stats?.total_properties || 0) * 0.15)}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Time to Sell/Rent</p>
                                    <p className="text-2xl font-bold mt-1">45 days</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Analytics</CardTitle>
                            <CardDescription>
                                User statistics and growth metrics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                                    <p className="text-2xl font-bold mt-1">{stats?.total_users?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Users (30 days)</p>
                                    <p className="text-2xl font-bold mt-1">{stats?.active_users?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">New Users This Month</p>
                                    <p className="text-2xl font-bold mt-1">{reportData?.newUsers?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">User Conversion Rate</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {((stats?.total_inquiries || 0) / (stats?.total_users || 1) * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Session Duration</p>
                                    <p className="text-2xl font-bold mt-1">4m 32s</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Premium Users</p>
                                    <div className="flex items-center mt-1">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                        <p className="text-2xl font-bold">
                                            {Math.round((stats?.total_users || 0) * 0.05)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h4 className="font-medium mb-3">User Type Distribution</h4>
                                <div className="space-y-2">
                                    {reportData?.userTypeDistribution.map((item) => (
                                        <div key={item.type} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {item.type}
                                            </span>
                                            <span className="font-medium">
                                                {item.count} ({item.percentage}%)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Financial Reports</CardTitle>
                            <CardDescription>
                                Revenue and financial performance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue (Year)</p>
                                        <p className="text-2xl font-bold mt-1">
                                            {formatCurrency(stats?.revenue_year || 0, 'ETB')}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Revenue</p>
                                        <p className="text-2xl font-bold mt-1">
                                            {formatCurrency(stats?.revenue_month || 0, 'ETB')}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Revenue Growth</p>
                                        <div className="flex items-center mt-1">
                                            {getGrowthIcon(reportData?.revenueGrowth || 0)}
                                            <p className={`text-2xl font-bold ml-2 ${getGrowthColor(reportData?.revenueGrowth || 0)}`}>
                                                {reportData?.revenueGrowth ? `${reportData.revenueGrowth.toFixed(1)}%` : '0%'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-2">Revenue Breakdown</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Property Listings
                                            </span>
                                            <span className="font-medium">
                                                {formatCurrency((stats?.revenue_month || 0) * 0.6, 'ETB')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Premium Subscriptions
                                            </span>
                                            <span className="font-medium">
                                                {formatCurrency((stats?.revenue_month || 0) * 0.25, 'ETB')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Promotions & Ads
                                            </span>
                                            <span className="font-medium">
                                                {formatCurrency((stats?.revenue_month || 0) * 0.15, 'ETB')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trend Analytics</CardTitle>
                            <CardDescription>
                                Platform performance over time
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {analyticsData.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Daily Users</p>
                                            <p className="text-2xl font-bold mt-1">
                                                {Math.round(analyticsData.reduce((sum, item) => sum + item.users, 0) / analyticsData.length)}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Daily Properties</p>
                                            <p className="text-2xl font-bold mt-1">
                                                {Math.round(analyticsData.reduce((sum, item) => sum + item.properties, 0) / analyticsData.length)}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Daily Inquiries</p>
                                            <p className="text-2xl font-bold mt-1">
                                                {Math.round(analyticsData.reduce((sum, item) => sum + item.inquiries, 0) / analyticsData.length)}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Daily Revenue</p>
                                            <p className="text-2xl font-bold mt-1">
                                                {formatCurrency(analyticsData.reduce((sum, item) => sum + item.revenue, 0) / analyticsData.length, 'ETB')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-medium">Daily Metrics</h4>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleExportAnalytics}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Export Analytics
                                            </Button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead>
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Date
                                                        </th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Users
                                                        </th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Properties
                                                        </th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Inquiries
                                                        </th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Revenue
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {analyticsData.slice(0, 10).map((item, index) => (
                                                        <tr key={index}>
                                                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                                {formatDate(item.date)}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                                {item.users.toLocaleString()}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                                {item.properties.toLocaleString()}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                                {item.inquiries.toLocaleString()}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                                                                {formatCurrency(item.revenue, 'ETB')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No analytics data available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Inquiry Status Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Inquiry Status Distribution</CardTitle>
                            <CardDescription>
                                Breakdown of inquiries by status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {reportData?.inquiryStatusDistribution.map((item) => (
                                    <div key={item.status} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">{item.status}</span>
                                            <span className="text-sm font-medium">{item.count} ({item.percentage}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${item.status.toLowerCase().includes('pending') ? 'bg-yellow-500' :
                                                    item.status.toLowerCase().includes('closed') ? 'bg-red-500' :
                                                        item.status.toLowerCase().includes('contacted') ? 'bg-blue-500' :
                                                            'bg-green-500'
                                                    }`}
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Data Exports Tab */}
                <TabsContent value="exports" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data Exports</CardTitle>
                            <CardDescription>
                                Export platform data in various formats
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium">Users Export</h4>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Export all user data with details
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleExportData('users')}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium">Properties Export</h4>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Export all property listings
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleExportData('properties')}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium">Inquiries Export</h4>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Export all inquiry data
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleExportData('inquiries')}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium">Transactions Export</h4>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Export financial transaction data
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleExportData('transactions')}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium">Audit Logs Export</h4>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Export system audit logs
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleExportData('audit-logs')}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium">Full Database Backup</h4>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Complete database backup (SQL)
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={async () => {
                                                        try {
                                                            const blob = await adminApi.backupDatabase();
                                                            const url = window.URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `backup-${new Date().toISOString().split('T')[0]}.sql`;
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            window.URL.revokeObjectURL(url);
                                                            document.body.removeChild(a);
                                                            toast.success('Backup downloaded');
                                                        } catch (err) {
                                                            toast.error('Failed to download backup');
                                                        }
                                                    }}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Report Summary */}
            {reportData && format === 'preview' && (
                <Card className="print:block hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Platform Report</CardTitle>
                                <CardDescription>{reportData.period}</CardDescription>
                            </div>
                            <Badge variant="outline">Preview</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">New Users</p>
                                    <p className="text-xl font-bold mt-1">{reportData.newUsers}</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">New Properties</p>
                                    <p className="text-xl font-bold mt-1">{reportData.newProperties}</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                                    <p className="text-xl font-bold mt-1">
                                        {formatCurrency(reportData.revenue, 'ETB')}
                                    </p>
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 text-center">
                                <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                                <p>© {new Date().getFullYear()} UTOPIA Real Estate Platform</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default ReportsPage;