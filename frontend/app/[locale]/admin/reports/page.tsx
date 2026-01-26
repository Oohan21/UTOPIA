// src/app/[locale]/admin/reports/page.tsx - UPDATED WITH LANGUAGE & DARK MODE
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Users, Home, MessageSquare, DollarSign,
    TrendingUp, Download, RefreshCw, Activity,
    AlertCircle, BarChart3, FileText, Database,
    PieChart, LineChart, Shield, Receipt,
    Calendar, Filter
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { formatNumber } from '@/lib/utils/formatNumber';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import { Separator } from '@/components/ui/Separator';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

// Available report types based on backend
const REPORT_TYPES = [
    { id: 'user_report', name: 'userAnalytics', icon: Users, description: 'userAnalyticsDesc', category: 'analytical' },
    { id: 'property_report', name: 'propertyAnalytics', icon: Home, description: 'propertyAnalyticsDesc', category: 'analytical' },
    { id: 'inquiry_report', name: 'inquiryAnalytics', icon: MessageSquare, description: 'inquiryAnalyticsDesc', category: 'analytical' },
    { id: 'revenue_report', name: 'revenueAnalytics', icon: DollarSign, description: 'revenueAnalyticsDesc', category: 'analytical' },
    { id: 'performance_report', name: 'performanceReport', icon: Activity, description: 'performanceReportDesc', category: 'analytical' },
    { id: 'market_report', name: 'marketReport', icon: BarChart3, description: 'marketReportDesc', category: 'analytical' },
    { id: 'activity_report', name: 'activityReport', icon: LineChart, description: 'activityReportDesc', category: 'analytical' },
    { id: 'comprehensive_report', name: 'comprehensiveReport', icon: Database, description: 'comprehensiveReportDesc', category: 'analytical' },
    { id: 'full_report', name: 'systemSummary', icon: PieChart, description: 'systemSummaryDesc', category: 'analytical' },
];

const RAW_DATA_TYPES = [
    { id: 'users', name: 'usersData', icon: Users, description: 'usersDataDesc', category: 'raw' },
    { id: 'properties', name: 'propertiesData', icon: Home, description: 'propertiesDataDesc', category: 'raw' },
    { id: 'inquiries', name: 'inquiriesData', icon: MessageSquare, description: 'inquiriesDataDesc', category: 'raw' },
    { id: 'audit-logs', name: 'auditLogs', icon: Shield, description: 'auditLogsDesc', category: 'raw' },
    { id: 'transactions', name: 'transactions', icon: Receipt, description: 'transactionsDesc', category: 'raw' },
];

export default function AdminReportsPage() {
    const t = useTranslations('admin.reports');
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>(
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [activeTab, setActiveTab] = useState('analytical');
    const [selectedReport, setSelectedReport] = useState<string>('user_report');

    const loadReport = async () => {
        try {
            setLoading(true);
            const reportData = await adminApi.getSystemReport();
            setReport(reportData);
        } catch (error) {
            console.error('Failed to load report:', error);
            toast.error(t('loadFailed'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReport();
    }, []);

    const handleExport = async (reportType: string, customDates = false) => {
        try {
            setExporting(reportType);
            
            if (customDates && activeTab === 'analytical') {
                await adminApi.generateCustomReport(reportType, startDate, endDate, 'csv');
                toast.success(t('exportSuccess', { name: getReportName(reportType) }));
            } else {
                await adminApi.exportData(reportType, 'csv');
                toast.success(t('exportSuccess', { name: getReportName(reportType) }));
            }
        } catch (error: any) {
            console.error('Export failed:', error);
            
            if (error?.message?.includes('not found') || error?.response?.status === 404) {
                toast.error(t('notAvailable', { name: getReportName(reportType) }));
            } else if (error?.response?.status === 403) {
                toast.error(t('permissionDenied'));
            } else if (error?.response?.status === 500) {
                toast.error(t('serverError'));
            } else {
                toast.error(error.message || t('exportFailed'));
            }
        } finally {
            setExporting(null);
        }
    };

    const handleCustomExport = async () => {
        try {
            setExporting('custom');
            await adminApi.generateCustomReport(selectedReport, startDate, endDate, 'csv');
            toast.success(t('customExportSuccess', { name: getReportName(selectedReport) }));
        } catch (error: any) {
            console.error('Custom export failed:', error);
            toast.error(error.message || t('exportFailed'));
        } finally {
            setExporting(null);
        }
    };

    const getReportName = (id: string) => {
        const allReports = [...REPORT_TYPES, ...RAW_DATA_TYPES];
        return t(allReports.find(r => r.id === id)?.name || id);
    };

    const renderStatCard = (title: string, value: number | string, icon: React.ReactNode, change?: number) => (
        <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {typeof value === 'number' ? formatNumber(value) : value}
                </div>
                {change !== undefined && !isNaN(change) && (
                    <p className={`text-xs ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} flex items-center mt-1`}>
                        <TrendingUp className={`w-3 h-3 mr-1 ${change >= 0 ? '' : 'rotate-180'}`} />
                        {change >= 0 ? '+' : ''}{Number(change).toFixed(1)}%
                    </p>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-3 md:px-4 py-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                            {t('title')}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1 md:mt-2">
                            {t('subtitle')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={loadReport}
                            disabled={loading}
                            className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            {t('refresh')}
                        </Button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <Card key={i} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <CardHeader>
                                    <Skeleton className="h-4 w-[100px] bg-gray-300 dark:bg-gray-700" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-[150px] mb-2 bg-gray-300 dark:bg-gray-700" />
                                    <Skeleton className="h-4 w-[80px] bg-gray-300 dark:bg-gray-700" />
                                </CardContent>
                            </Card>
                        ))
                    ) : report ? (
                        <>
                            {renderStatCard(
                                t('stats.totalUsers'),
                                report.total_users || 0,
                                <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            )}
                            {renderStatCard(
                                t('stats.activeProperties'),
                                report.active_properties || 0,
                                <Home className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            )}
                            {renderStatCard(
                                t('stats.monthlyRevenue'),
                                formatCurrency(report.revenue_month || 0),
                                <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />,
                                report.revenue_growth
                            )}
                            {renderStatCard(
                                t('stats.totalInquiries'),
                                report.total_inquiries || 0,
                                <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            )}
                        </>
                    ) : null}
                </div>

                {/* Custom Export Section */}
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-white">{t('customExport.title')}</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                            {t('customExport.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">{t('customExport.reportType')}</Label>
                                <div className="relative">
                                    <select
                                        value={selectedReport}
                                        onChange={(e) => setSelectedReport(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {REPORT_TYPES.map((reportType) => (
                                            <option key={reportType.id} value={reportType.id} className="bg-white dark:bg-gray-800">
                                                {t(reportType.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">{t('customExport.startDate')}</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-gray-700 dark:text-gray-300">{t('customExport.endDate')}</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {t('customExport.summary', {
                                        report: getReportName(selectedReport),
                                        start: startDate,
                                        end: endDate
                                    })}
                                </span>
                            </div>
                            
                            <Button
                                onClick={handleCustomExport}
                                disabled={exporting === 'custom'}
                                className="min-w-[200px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                            >
                                {exporting === 'custom' ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        {t('customExport.generating')}
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        {t('customExport.generate')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Separator className="bg-gray-200 dark:bg-gray-700" />

                {/* Export Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1">
                        <TabsTrigger 
                            value="analytical" 
                            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                        >
                            <BarChart3 className="w-4 h-4" />
                            {t('tabs.analytical')}
                        </TabsTrigger>
                        <TabsTrigger 
                            value="raw" 
                            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                        >
                            <FileText className="w-4 h-4" />
                            {t('tabs.raw')}
                        </TabsTrigger>
                    </TabsList>

                    {/* Analytical Reports Tab */}
                    <TabsContent value="analytical" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {REPORT_TYPES.map((reportType) => (
                                <Card key={reportType.id} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                                                    <reportType.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <CardTitle className="text-lg text-gray-900 dark:text-white">
                                                    {t(reportType.name)}
                                                </CardTitle>
                                            </div>
                                            <Badge variant="outline" className="border-blue-200 dark:border-blue-800">
                                                {t('badges.analytical')}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-gray-600 dark:text-gray-400">
                                            {t(reportType.description)}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            onClick={() => handleExport(reportType.id, false)}
                                            disabled={exporting === reportType.id}
                                            className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            variant="outline"
                                        >
                                            {exporting === reportType.id ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    {t('exporting')}
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    {t('exportAsCSV')}
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Raw Data Exports Tab */}
                    <TabsContent value="raw" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {RAW_DATA_TYPES.map((dataType) => (
                                <Card key={dataType.id} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                                    <dataType.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                </div>
                                                <CardTitle className="text-lg text-gray-900 dark:text-white">
                                                    {t(dataType.name)}
                                                </CardTitle>
                                            </div>
                                            <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                                                {t('badges.raw')}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-gray-600 dark:text-gray-400">
                                            {t(dataType.description)}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button
                                            onClick={() => handleExport(dataType.id, false)}
                                            disabled={exporting === dataType.id}
                                            className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            variant="outline"
                                        >
                                            {exporting === dataType.id ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    {t('exporting')}
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    {t('exportAsCSV')}
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Quick Export Section */}
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-white">{t('quickExports.title')}</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                            {t('quickExports.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Button
                                onClick={() => handleExport('user_report', false)}
                                disabled={exporting === 'user_report'}
                                variant="outline"
                                className="h-24 flex flex-col items-center justify-center border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <Users className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400" />
                                <span>{t('quickExports.userReport')}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('badges.analytical')}</span>
                            </Button>
                            
                            <Button
                                onClick={() => handleExport('property_report', false)}
                                disabled={exporting === 'property_report'}
                                variant="outline"
                                className="h-24 flex flex-col items-center justify-center border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <Home className="w-6 h-6 mb-2 text-green-600 dark:text-green-400" />
                                <span>{t('quickExports.propertyReport')}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('badges.analytical')}</span>
                            </Button>
                            
                            <Button
                                onClick={() => handleExport('users', false)}
                                disabled={exporting === 'users'}
                                variant="outline"
                                className="h-24 flex flex-col items-center justify-center border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <Users className="w-6 h-6 mb-2 text-blue-600 dark:text-blue-400" />
                                <span>{t('quickExports.usersData')}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('badges.raw')}</span>
                            </Button>
                            
                            <Button
                                onClick={() => handleExport('properties', false)}
                                disabled={exporting === 'properties'}
                                variant="outline"
                                className="h-24 flex flex-col items-center justify-center border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <Home className="w-6 h-6 mb-2 text-green-600 dark:text-green-400" />
                                <span>{t('quickExports.propertiesData')}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('badges.raw')}</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Information Section */}
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-white">{t('information.title')}</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">
                            {t('information.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <AlertTitle className="text-blue-800 dark:text-blue-300">{t('information.note')}</AlertTitle>
                            <AlertDescription className="text-blue-700 dark:text-blue-400">
                                {t('information.noteDescription')}
                            </AlertDescription>
                        </Alert>
                        
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">{t('information.analytical.title')}</h4>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <li>• {t('information.analytical.aggregated')}</li>
                                    <li>• {t('information.analytical.dateRange')}</li>
                                    <li>• {t('information.analytical.summary')}</li>
                                </ul>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">{t('information.raw.title')}</h4>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <li>• {t('information.raw.complete')}</li>
                                    <li>• {t('information.raw.allRecords')}</li>
                                    <li>• {t('information.raw.direct')}</li>
                                </ul>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">{t('information.custom.title')}</h4>
                                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <li>• {t('information.custom.specific')}</li>
                                    <li>• {t('information.custom.selected')}</li>
                                    <li>• {t('information.custom.csv')}</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}