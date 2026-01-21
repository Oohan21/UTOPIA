// lib/hooks/useUserActivity.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { authApi } from '@/lib/api/auth'; // Use authApi instead of direct apiClient

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
    if (user && user.id) {
      fetchUserActivities();
      fetchActivitySummary();
      fetchUserStats();
    }
  }, [user]);

  const fetchUserActivities = async () => {
    try {
      setIsLoading(true);
      
      // Use the correct endpoint with pagination
      const response = await authApi.getUserActivities(10); // Or use direct apiClient
      
      if (response.results) {
        setActivities(response.results);
      }
      if (response.stats) {
        setActivityStats(response.stats);
      }
    } catch (error) {
      console.error('Error fetching user activities:', error);
      // Fallback: create mock data for testing
      if (process.env.NODE_ENV === 'development') {
        const mockActivities: Activity[] = [
          {
            id: 1,
            activity_type: 'login',
            activity_type_display: 'User Login',
            metadata: { title: 'Logged in successfully' },
            created_at: new Date().toISOString(),
            user_email: user?.email || '',
          },
          {
            id: 2,
            activity_type: 'property_view',
            activity_type_display: 'Property Viewed',
            metadata: { title: 'Viewed Luxury Villa', description: 'Viewed property #123' },
            created_at: new Date(Date.now() - 3600000).toISOString(),
            user_email: user?.email || '',
          },
        ];
        setActivities(mockActivities);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivitySummary = async () => {
    try {
      // Use authApi for activity summary
      const response = await authApi.getActivitySummary();
      setActivitySummary(response);
    } catch (error) {
      console.error('Error fetching activity summary:', error);
      // Fallback mock data
      setActivitySummary({
        today_activities: 5,
        week_activities: 25,
        month_activities: 100,
        activity_counts: [
          { activity_type: 'property_view', count: 45 },
          { activity_type: 'login', count: 20 },
          { activity_type: 'search', count: 15 },
        ],
        latest_activity: activities[0] || null,
        total_activities: 150,
      });
    }
  };

  const fetchUserStats = async () => {
    try {
      // Use authApi for user stats
      const response = await authApi.getUserStats();
      
      // Extract user stats from response
      if (response.user) {
        setStats({
          total_logins: response.user.total_logins || 0,
          total_properties_viewed: response.user.total_properties_viewed || 0,
          total_properties_saved: response.user.total_properties_saved || 0,
          total_inquiries_sent: response.user.total_inquiries_sent || 0,
          total_searches: response.user.total_searches || 0,
          last_activity: response.last_activity || new Date().toISOString(),
          total_properties: response.stats?.total_properties || 0,
          active_properties: response.stats?.active_properties || 0,
          sold_properties: response.stats?.sold_properties || 0,
          rented_properties: response.stats?.rented_properties || 0,
          total_views: response.stats?.total_views || 0,
          total_inquiries: response.stats?.total_inquiries || 0,
          active_promotions: response.financial?.active_promotions || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Fallback to user data
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

  const createActivity = async (activityType: string, metadata: any = {}) => {
    try {
      await authApi.createActivity(activityType, metadata);
      // Refresh activities after creating a new one
      fetchUserActivities();
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