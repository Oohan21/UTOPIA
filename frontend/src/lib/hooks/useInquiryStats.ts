import { useState, useCallback, useEffect } from 'react';
import { inquiryApi } from '@/lib/api/inquiry';
import { InquiryDashboardStats } from '@/lib/types/inquiry';
import { useToast } from '@/components/ui/use-toast';

export const useInquiryStats = (autoFetch = true) => {
  const [stats, setStats] = useState<InquiryDashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inquiryApi.getDashboardStats();
      setStats(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch inquiry stats';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const refresh = useCallback(() => {
    return fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (autoFetch) {
      fetchStats();
    }
  }, [autoFetch, fetchStats]);

  // Helper methods for common calculations
  const getStatusPercentage = useCallback((status: string) => {
    if (!stats?.status_distribution?.[status] || !stats?.overview?.total) {
      return 0;
    }
    return (stats.status_distribution[status] / stats.overview.total) * 100;
  }, [stats]);

  const getPriorityPercentage = useCallback((priority: string) => {
    if (!stats?.priority_distribution?.[priority] || !stats?.overview?.total) {
      return 0;
    }
    return (stats.priority_distribution[priority] / stats.overview.total) * 100;
  }, [stats]);

  const getResponseTimeColor = useCallback((hours: number) => {
    if (hours <= 2) return 'success';
    if (hours <= 8) return 'warning';
    return 'error';
  }, []);

  const getResponseRateColor = useCallback((rate: number) => {
    if (rate >= 90) return 'success';
    if (rate >= 70) return 'warning';
    return 'error';
  }, []);

  return {
    // State
    stats,
    loading,
    error,
    
    // Actions
    fetchStats,
    refresh,
    clearError: () => setError(null),
    
    // Helper methods
    getStatusPercentage,
    getPriorityPercentage,
    getResponseTimeColor,
    getResponseRateColor,
    
    // Computed values
    total: stats?.overview?.total || 0,
    newToday: stats?.overview?.new_today || 0,
    newThisWeek: stats?.overview?.new_this_week || 0,
    unassigned: stats?.overview?.unassigned || 0,
    urgent: stats?.overview?.urgent || 0,
    avgResponseTime: stats?.performance?.avg_response_time_hours || 0,
    responseRate: stats?.performance?.response_rate || 0,
    conversionRate: stats?.performance?.conversion_rate || 0,
    recentActivities: stats?.recent_activities || [],
    adminStats: stats?.admin_stats || null,
  };
};