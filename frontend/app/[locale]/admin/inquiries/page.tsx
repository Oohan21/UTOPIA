// src/app/admin/inquiries/page.tsx - UPDATED FOR DARK MODE
'use client'

import React, { useState, useEffect } from 'react';
import { useInquiries } from '@/lib/hooks/useInquiries';
import { useInquiryStats } from '@/lib/hooks/useInquiryStats';
import { useAuth } from '@/lib/hooks/useAuth';
import { InquiryFilters } from '@/components/inquiries/InquiryFilters';
import { InquiryListItem } from '@/components/inquiries/InquiryListItem';
import { InquiryStats } from '@/components/inquiries/InquiryStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Pagination } from '@/components/ui/Pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import {
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  Inbox,
  CheckCircle,
  Users,
  MessageSquare,
  Calendar,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Shield,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { InquiryFilters as FiltersType } from '@/lib/types/inquiry';
import { useTranslations } from 'next-intl';

export default function AdminInquiriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('inquiries');
  
  const [bulkAction, setBulkAction] = useState<string>('');
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<FiltersType>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInquiries, setSelectedInquiries] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Use the custom hooks
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
    bulkDelete,
    toggleInquirySelection,
    selectAllInquiries,
    clearSelection,
    goToPage,
    changePageSize,
    refresh,
    isAdmin
  } = useInquiries();

  const { 
    stats, 
    loading: statsLoading,
    fetchStats 
  } = useInquiryStats();

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
        break;
      case 'unassigned':
        tabFilters.assigned_to = 'unassigned';
        break;
      case 'closed':
        tabFilters.status = 'closed';
        break;
      case 'viewing_scheduled':
        tabFilters.status = 'viewing_scheduled';
        break;
      case 'follow_up':
        tabFilters.status = 'follow_up';
        break;
    }

    fetchInquiries(tabFilters);
  }, [activeTab, filters, user?.id, fetchInquiries]);

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
        title: 'Success',
        description: 'Inquiry assigned to you',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign inquiry',
        variant: 'destructive',
      });
    }
  };

  const handleContact = async (id: string) => {
    try {
      await markAsContacted(id, 'Marked as contacted via admin dashboard');
      toast({
        title: 'Success',
        description: 'Inquiry marked as contacted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark as contacted',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      await exportInquiries(filters);
      toast({
        title: 'Success',
        description: 'Inquiries exported successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export inquiries',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedInquiries.size === 0) {
      toast({
        title: 'Warning',
        description: 'No inquiries selected',
        variant: 'default',
      });
      return;
    }

    try {
      const inquiryIds = Array.from(selectedInquiries);
      
      switch (action) {
        case 'assign':
          await bulkUpdate({
            inquiry_ids: inquiryIds,
            assigned_to: user?.id || null
          });
          break;
        case 'contact':
          await bulkUpdate({
            inquiry_ids: inquiryIds,
            status: 'contacted'
          });
          break;
        case 'close':
          await bulkUpdate({
            inquiry_ids: inquiryIds,
            status: 'closed'
          });
          break;
        case 'delete':
          await bulkDelete();
          break;
        default:
          throw new Error('Invalid bulk action');
      }

      clearSelection();
      setBulkAction('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to perform bulk action',
        variant: 'destructive',
      });
    }
  };

  const getTabCount = (tab: string) => {
    if (!stats) return 0;

    switch (tab) {
      case 'pending':
        return stats.status_distribution?.pending || 0;
      case 'urgent':
        return stats.overview?.urgent || 0;
      case 'unassigned':
        return stats.overview?.unassigned || 0;
      case 'assigned':
        return (stats.overview?.total || 0) - (stats.overview?.unassigned || 0);
      case 'closed':
        return stats.status_distribution?.closed || 0;
      case 'viewing_scheduled':
        return stats.status_distribution?.['viewing_scheduled'] || 0;
      case 'follow_up':
        return stats.status_distribution?.['follow_up'] || 0;
      default:
        return stats.overview?.total || 0;
    }
  };

  const handleRefreshAll = async () => {
    await Promise.all([refresh(), fetchStats()]);
    toast({
      title: 'Refreshed',
      description: 'Data has been refreshed',
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading inquiries...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleExport} 
            disabled={loading}
            className="dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('exportCSV')}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {showFilters ? (
              <EyeOff className="w-4 h-4 mr-2" />
            ) : (
              <Filter className="w-4 h-4 mr-2" />
            )}
            {showFilters ? t('hideFilters') : t('showFilters')}
          </Button>

          <Button
            variant="outline"
            onClick={handleRefreshAll}
            disabled={loading || statsLoading}
            className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading || statsLoading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-8">
          <InquiryStats stats={stats} loading={statsLoading} />
        </div>
      )}

      {/* Bulk Actions */}
      {selectedInquiries.size > 0 && (
        <Card className="mb-6 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-6 dark:bg-gray-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedInquiries.size} inquiry{selectedInquiries.size !== 1 ? 'ies' : ''} selected
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose an action to apply to all selected inquiries
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={bulkAction}
                  onValueChange={(value) => {
                    setBulkAction(value);
                    if (value) {
                      handleBulkAction(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px] dark:border-gray-700 dark:bg-gray-700 dark:text-white">
                    <SelectValue placeholder="Bulk Actions" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="assign" className="dark:text-gray-300 dark:hover:bg-gray-700">
                      Assign to Me
                    </SelectItem>
                    <SelectItem value="contact" className="dark:text-gray-300 dark:hover:bg-gray-700">
                      Mark as Contacted
                    </SelectItem>
                    <SelectItem value="close" className="dark:text-gray-300 dark:hover:bg-gray-700">
                      Close Inquiries
                    </SelectItem>
                    <SelectItem value="delete" className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700">
                      Delete Inquiries
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => clearSelection()}
                  className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
            adminView={true}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 overflow-x-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex min-w-max p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <TabsTrigger 
              value="all" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              <Inbox className="w-4 h-4" />
              {t('all')}
              <Badge variant="secondary" className="ml-1 dark:bg-gray-600 dark:text-white">
                {getTabCount('all')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="pending" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              <AlertCircle className="w-4 h-4" />
              {t('pending')}
              <Badge variant="secondary" className="ml-1 dark:bg-gray-600 dark:text-white">
                {getTabCount('pending')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="urgent" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
              {t('urgent')}
              <Badge variant="destructive" className="ml-1">
                {getTabCount('urgent')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="unassigned" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              {t('unassigned')}
              <Badge variant="secondary" className="ml-1 dark:bg-gray-600 dark:text-white">
                {getTabCount('unassigned')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="assigned" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              <CheckCircle className="w-4 h-4" />
              {t('assigned')}
              <Badge variant="secondary" className="ml-1 dark:bg-gray-600 dark:text-white">
                {getTabCount('assigned')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="viewing_scheduled" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              <Calendar className="w-4 h-4" />
              {t('viewing')}
              <Badge variant="secondary" className="ml-1 dark:bg-gray-600 dark:text-white">
                {getTabCount('viewing_scheduled')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="follow_up" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              <MessageSquare className="w-4 h-4" />
              {t('follow_up')}
              <Badge variant="secondary" className="ml-1 dark:bg-gray-600 dark:text-white">
                {getTabCount('follow_up')}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="closed" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              <CheckCircle className="w-4 h-4" />
              {t('closed')}
              <Badge variant="secondary" className="ml-1 dark:bg-gray-600 dark:text-white">
                {getTabCount('closed')}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      {/* Selection Checkbox */}
      {inquiries.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
          <input
            type="checkbox"
            checked={selectedInquiries.size === inquiries.length && inquiries.length > 0}
            onChange={() => {
              if (selectedInquiries.size === inquiries.length) {
                clearSelection();
              } else {
                selectAllInquiries();
              }
            }}
            className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-500"
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('selectAll', { count: inquiries.length })}
          </span>
          {selectedInquiries.size > 0 && (
            <span className="text-sm font-medium ml-auto text-gray-900 dark:text-white">
              {selectedInquiries.size} {t('selected')}
            </span>
          )}
        </div>
      )}

      {/* Inquiries List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="dark:bg-gray-800 dark:border-gray-700">
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
          <Card className="dark:bg-gray-800 dark:border-gray-700">
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
                  className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {t('clearFilters')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Inquiries List */}
            {inquiries.map(inquiry => (
              <div key={inquiry.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedInquiries.has(inquiry.id)}
                  onChange={() => toggleInquirySelection(inquiry.id)}
                  className="mt-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-500"
                />
                <div className="flex-1">
                  <InquiryListItem
                    inquiry={inquiry}
                    onAssign={handleAssign}
                    onContact={handleContact}
                    showActions={true}
                    isAdmin={true}
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('showingRange', {
                start: (pagination.current_page - 1) * 20 + 1,
                end: Math.min(pagination.current_page * 20, pagination.count),
                total: pagination.count
              })}
            </div>
            <Pagination
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              onPageChange={(page) => goToPage(page)}
              className="dark:text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}