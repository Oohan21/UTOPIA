'use client'

import React, { useState, useEffect } from 'react';
import { useInquiries } from '@/lib/hooks/useInquiries';
import Header from "@/components/common/Header/Header";
import { useInquiryStats } from '@/lib/hooks/useInquiryStats';
import { InquiryListItem } from '@/components/inquiries/InquiryListItem';
import { InquiryFilters } from '@/components/inquiries/InquiryFilters';
import { InquiryStats } from '@/components/inquiries/InquiryStats';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Pagination } from '@/components/ui/Pagination';
import {
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  Inbox,
  CheckCircle,
  Calendar,
  Users
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { InquiryFilters as FiltersType } from '@/lib/types/inquiry';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const InquiriesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('inquiries');
  const isAdmin = user?.user_type === 'admin';
  const [bulkAction, setBulkAction] = useState<string>('');
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<FiltersType>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInquiries, setSelectedInquiries] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const {
    inquiries,
    loading,
    error,
    pagination,
    fetchInquiries,
    assignToMe,
    markAsContacted,
    exportInquiries,
    bulkUpdate,
    isAdmin: hookIsAdmin,
  } = useInquiries();

  const { stats, loading: statsLoading } = useInquiryStats();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const tabFilters: FiltersType = { ...filters };

    switch (activeTab) {
      case 'pending':
        tabFilters.status = 'pending';
        break;
      case 'assigned':
        tabFilters.assigned_to = user?.id;
        break;
      case 'urgent':
        tabFilters.priority = 'urgent';
        tabFilters.status = 'pending';
        break;
      case 'unassigned':
        tabFilters.assigned_to = 'unassigned';
        break;
      case 'closed':
        tabFilters.status = 'closed';
        break;
    }

    fetchInquiries(tabFilters);
  }, [activeTab, filters, user?.id]);

  const handleFilterChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  const handleAssign = async (id: string) => {
    try {
      await assignToMe(id);
      toast({
        title: t('success'),
        description: t('assignedSuccess'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('assignFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleContact = async (id: string) => {
    try {
      await markAsContacted(id, t('markedAsContacted'));
      toast({
        title: t('success'),
        description: t('contactedSuccess'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('contactedFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      await exportInquiries(filters);
      toast({
        title: t('success'),
        description: t('exportSuccess'),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('exportFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async (action: string, data?: any) => {
    if (selectedInquiries.length === 0) {
      toast({
        title: t('warning'),
        description: t('noInquiriesSelected'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await bulkUpdate({
        inquiry_ids: selectedInquiries,
        ...data,
      });
      setSelectedInquiries([]);
      toast({
        title: t('success'),
        description: t('bulkActionSuccess'),
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('bulkActionFailed'),
        variant: 'destructive',
      });
    }
  };

  const toggleSelectInquiry = (id: string) => {
    setSelectedInquiries(prev =>
      prev.includes(id)
        ? prev.filter(inquiryId => inquiryId !== id)
        : [...prev, id]
    );
  };

  const selectAllInquiries = () => {
    if (selectedInquiries.length === inquiries.length) {
      setSelectedInquiries([]);
    } else {
      setSelectedInquiries(inquiries.map(inquiry => inquiry.id));
    }
  };

  const getTabCount = (tab: string) => {
    if (!stats) return 0;

    switch (tab) {
      case 'pending':
        return stats.status_distribution.pending || 0;
      case 'urgent':
        return stats.overview.urgent;
      case 'unassigned':
        return stats.overview.unassigned;
      case 'assigned':
        return stats.overview.total - stats.overview.unassigned;
      case 'closed':
        return stats.status_distribution.closed || 0;
      default:
        return stats.overview.total;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header/>
        <div className="container mx-auto px-3 md:px-4 py-8">
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header/>
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 md:mt-2">
              {t('subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button 
                onClick={handleExport}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                {t('exportCSV')}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? t('hideFilters') : t('showFilters')}
            </Button>

            <Button
              variant="outline"
              onClick={() => fetchInquiries(filters)}
              disabled={loading}
              className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        {isAdmin && stats && (
          <div className="mb-6 md:mb-8">
            <InquiryStats stats={stats} loading={statsLoading} />
          </div>
        )}

        {/* Bulk Actions */}
        {selectedInquiries.length > 0 && isAdmin && (
          <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                <div>
                  <p className="font-medium dark:text-gray-300">
                    {t('selected', { count: selectedInquiries.length })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={bulkAction}
                    onValueChange={(value) => {
                      setBulkAction(value);
                      if (value) {
                        handleBulkAction(value);
                        setBulkAction('');
                      }
                    }}
                  >
                    <SelectTrigger className="w-full md:w-[180px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 dark:text-gray-300">
                      <SelectValue placeholder={t('bulkActions')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                      <SelectItem value="assign" className="dark:text-gray-300 dark:hover:bg-gray-700">
                        {t('assignSelected')}
                      </SelectItem>
                      <SelectItem value="contact" className="dark:text-gray-300 dark:hover:bg-gray-700">
                        {t('markContactedSelected')}
                      </SelectItem>
                      <SelectItem value="close" className="dark:text-gray-300 dark:hover:bg-gray-700">
                        {t('closeSelected')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInquiries([])}
                    className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t('clearSelection')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="mb-6">
            <InquiryFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              adminView={isAdmin}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 bg-gray-100 dark:bg-gray-800 p-1">
            <TabsTrigger 
              value="all" 
              className={cn(
                "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
              )}
            >
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">{t('all')}</span>
              <Badge variant="secondary" className="ml-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                {getTabCount('all')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="pending"
              className={cn(
                "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
              )}
            >
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('pending')}</span>
              <Badge variant="secondary" className="ml-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                {getTabCount('pending')}
              </Badge>
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger 
                  value="urgent"
                  className={cn(
                    "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                    "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                  )}
                >
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                  <span className="hidden sm:inline">{t('urgent')}</span>
                  <Badge variant="destructive" className="ml-1">
                    {getTabCount('urgent')}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="unassigned"
                  className={cn(
                    "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                    "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                  )}
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('unassigned')}</span>
                  <Badge variant="secondary" className="ml-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                    {getTabCount('unassigned')}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger 
                  value="assigned"
                  className={cn(
                    "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                    "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
                  )}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('assigned')}</span>
                  <Badge variant="secondary" className="ml-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                    {getTabCount('assigned')}
                  </Badge>
                </TabsTrigger>
              </>
            )}
            <TabsTrigger 
              value="closed"
              className={cn(
                "flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900",
                "data-[state=active]:text-gray-900 dark:data-[state=active]:text-white"
              )}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t('closed')}</span>
              <Badge variant="secondary" className="ml-1 bg-gray-200 dark:bg-gray-700 dark:text-gray-300">
                {getTabCount('closed')}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Inquiries List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardContent className="pt-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : inquiries.length === 0 ? (
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardContent className="pt-12 pb-12 text-center">
                <Inbox className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('noInquiriesFound')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {filters && Object.keys(filters).length > 0
                    ? t('tryChangingFilters')
                    : t('noInquiriesYet')}
                </p>
                {filters && Object.keys(filters).length > 0 && (
                  <Button 
                    variant="outline"
                    onClick={handleResetFilters}
                    className="border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t('clearFilters') || 'Clear Filters'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Selection Checkbox for Admin */}
              {isAdmin && (
                <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedInquiries.length === inquiries.length && inquiries.length > 0}
                    onChange={selectAllInquiries}
                    className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('selectAll', { count: inquiries.length })}
                  </span>
                </div>
              )}

              {/* Inquiries List */}
              {inquiries.map(inquiry => (
                <div key={inquiry.id} className="flex items-start gap-3">
                  {isAdmin && (
                    <input
                      type="checkbox"
                      checked={selectedInquiries.includes(inquiry.id)}
                      onChange={() => toggleSelectInquiry(inquiry.id)}
                      className="mt-5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                    />
                  )}
                  <div className="flex-1">
                    <InquiryListItem
                      inquiry={inquiry}
                      onAssign={handleAssign}
                      onContact={handleContact}
                      showActions={isAdmin}
                      isAdmin={isAdmin}
                    />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              onPageChange={(page) => {
                fetchInquiries({ ...filters, page });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InquiriesPage;