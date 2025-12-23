// lib/hooks/useUserActivity.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import apiClient from '@/lib/api/client';

interface Activity {
  id: number;
  activity_type: string;
  activity_type_display: string;
  metadata: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
  user_email: string;
}

interface ActivityStats {
  total_activities: number;
  recent_activity_counts: Record<string, number>;
  last_30_days_total: number;
}

interface ActivitySummary {
  today_activities: number;
  week_activities: number;
  month_activities: number;
  activity_counts: Array<{activity_type: string; count: number}>;
  latest_activity: Activity | null;
  total_activities: number;
}

interface UserStats {
  total_logins: number;
  total_properties_viewed: number;
  total_properties_saved: number;
  total_inquiries_sent: number;
  total_searches: number;
  last_activity: string;
  total_properties: number;
  active_properties: number;
  sold_properties: number;
  rented_properties: number;
  total_views: number;
  total_inquiries: number;
  active_promotions: number;
}

export const useUserActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserActivities();
      fetchActivitySummary();
      fetchUserStats();
    }
  }, [user]);

  const fetchUserActivities = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/auth/activities/', {
        params: {
          page_size: 10,
          ordering: '-created_at'
        }
      });
      setActivities(response.data.results || []);
      setActivityStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivitySummary = async () => {
    try {
      const response = await apiClient.get('/auth/activities/summary/');
      setActivitySummary(response.data);
    } catch (error) {
      console.error('Error fetching activity summary:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await apiClient.get('/auth/dashboard/');
      
      // Extract user stats from dashboard response
      const userData = response.data.user || {};
      const statsData = response.data.stats || {};
      const activityData = response.data.activity || {};
      const financialData = response.data.financial || {};
      
      setStats({
        total_logins: userData.total_logins || 0,
        total_properties_viewed: userData.total_properties_viewed || 0,
        total_properties_saved: userData.total_properties_saved || 0,
        total_inquiries_sent: userData.total_inquiries_sent || 0,
        total_searches: userData.total_searches || 0,
        last_activity: response.data.last_activity || new Date().toISOString(),
        total_properties: statsData.total_properties || 0,
        active_properties: statsData.active_properties || 0,
        sold_properties: statsData.sold_properties || 0,
        rented_properties: statsData.rented_properties || 0,
        total_views: statsData.total_views || 0,
        total_inquiries: statsData.total_inquiries || 0,
        active_promotions: financialData.active_promotions || 0,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Set default values
      setStats({
        total_logins: user?.total_logins || 0,
        total_properties_viewed: user?.total_properties_viewed || 0,
        total_properties_saved: user?.total_properties_saved || 0,
        total_inquiries_sent: user?.total_inquiries_sent || 0,
        total_searches: user?.total_searches || 0,
        last_activity: user?.last_activity || new Date().toISOString(),
        total_properties: 0,
        active_properties: 0,
        sold_properties: 0,
        rented_properties: 0,
        total_views: 0,
        total_inquiries: 0,
        active_promotions: 0,
      });
    }
  };

  // Function to create a new activity (can be called from components)
  const createActivity = async (activityType: string, metadata: any = {}) => {
    try {
      await apiClient.post('/auth/activities/create/', {
        activity_type: activityType,
        metadata: metadata
      });
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  return {
    activities,
    activityStats,
    activitySummary,
    stats,
    isLoading,
    refetch: fetchUserActivities,
    createActivity
  };
};