import { useState, useCallback } from 'react';
import { inquiryApi } from '@/lib/api/inquiry';
import { 
  Inquiry, 
  InquiryActivity,
  InquiryMessage,
  UpdateInquiryData,
  ScheduleViewingData
} from '@/lib/types/inquiry';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './useAuth';

export const useInquiry = (inquiryId?: string) => {
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [activities, setActivities] = useState<InquiryActivity[]>([]);
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const isAdmin = user?.user_type === 'admin';
  const canManage = isAdmin || inquiry?.user_info?.id === user?.id;

  // Load inquiry data
  const loadInquiry = useCallback(async (id?: string) => {
    const targetId = id || inquiryId;
    if (!targetId) {
      setError('Inquiry ID is required');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Load inquiry details
      const inquiryData = await inquiryApi.getInquiry(targetId);
      setInquiry(inquiryData);

      // Load activities if user has permission
      if (canManage || isAdmin) {
        try {
          const activitiesData = await inquiryApi.getInquiryActivity(targetId);
          setActivities(activitiesData);
        } catch (activityErr) {
          console.warn('Failed to load activities:', activityErr);
        }
      }

      // Load messages
      try {
        const messagesData = await inquiryApi.getInquiryMessages(targetId);
        setMessages(messagesData);
      } catch (messageErr) {
        console.warn('Failed to load messages:', messageErr);
      }

      return inquiryData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load inquiry';
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
  }, [inquiryId, canManage, isAdmin, toast]);

  // Update inquiry
  const updateInquiry = useCallback(async (data: UpdateInquiryData) => {
    if (!inquiryId) {
      throw new Error('Inquiry ID is required');
    }

    try {
      setLoading(true);
      const updated = await inquiryApi.updateInquiry(inquiryId, data);
      setInquiry(updated);
      toast({
        title: 'Success',
        description: 'Inquiry updated successfully!',
      });
      return updated;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update inquiry';
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
  }, [inquiryId, toast]);

  // Assign to me
  const assignToMe = useCallback(async () => {
    if (!inquiryId) {
      throw new Error('Inquiry ID is required');
    }

    try {
      setLoading(true);
      const updated = await inquiryApi.assignToMe(inquiryId);
      setInquiry(updated);
      toast({
        title: 'Success',
        description: 'Inquiry assigned to you!',
      });
      return updated;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to assign inquiry';
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
  }, [inquiryId, toast]);

  // Mark as contacted
  const markAsContacted = useCallback(async (notes?: string) => {
    if (!inquiryId) {
      throw new Error('Inquiry ID is required');
    }

    try {
      setLoading(true);
      const updated = await inquiryApi.markAsContacted(inquiryId, notes);
      setInquiry(updated);
      toast({
        title: 'Success',
        description: 'Inquiry marked as contacted!',
      });
      return updated;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to mark as contacted';
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
  }, [inquiryId, toast]);

  // Schedule viewing
  const scheduleViewing = useCallback(async (data: ScheduleViewingData) => {
    if (!inquiryId) {
      throw new Error('Inquiry ID is required');
    }

    try {
      setLoading(true);
      const updated = await inquiryApi.scheduleViewing(inquiryId, data);
      setInquiry(updated);
      toast({
        title: 'Success',
        description: 'Viewing scheduled successfully!',
      });
      return updated;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to schedule viewing';
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
  }, [inquiryId, toast]);

  // Close inquiry
  const closeInquiry = useCallback(async (notes?: string) => {
    if (!inquiryId) {
      throw new Error('Inquiry ID is required');
    }

    try {
      setLoading(true);
      const updated = await inquiryApi.closeInquiry(inquiryId, notes);
      setInquiry(updated);
      toast({
        title: 'Success',
        description: 'Inquiry closed successfully!',
      });
      return updated;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to close inquiry';
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
  }, [inquiryId, toast]);

  // Send message
  const sendMessage = useCallback(async (data: { message: string; attachment?: File; subject?: string }) => {
    if (!inquiryId) {
      throw new Error('Inquiry ID is required');
    }

    try {
      setLoading(true);
      const message = await inquiryApi.sendInquiryMessage(inquiryId, data);
      
      // Add to messages list
      setMessages(prev => [...prev, message]);
      
      toast({
        title: 'Success',
        description: 'Message sent!',
      });
      return message;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to send message';
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
  }, [inquiryId, toast]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: number) => {
    try {
      await inquiryApi.markMessageAsRead(messageId);
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg
      ));
    } catch (err) {
      console.error('Failed to mark message as read:', err);
    }
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    if (!inquiryId) return;
    
    try {
      setRefreshing(true);
      await loadInquiry(inquiryId);
    } finally {
      setRefreshing(false);
    }
  }, [inquiryId, loadInquiry]);

  // Clear data
  const clear = useCallback(() => {
    setInquiry(null);
    setActivities([]);
    setMessages([]);
    setError(null);
  }, []);

  // Set inquiry ID and load
  const setInquiryId = useCallback(async (id: string) => {
    await loadInquiry(id);
  }, [loadInquiry]);

  return {
    // State
    inquiry,
    activities,
    messages,
    loading,
    refreshing,
    error,
    
    // Permissions
    isAdmin,
    canManage,
    
    // Actions
    loadInquiry,
    updateInquiry,
    assignToMe,
    markAsContacted,
    scheduleViewing,
    closeInquiry,
    sendMessage,
    markMessageAsRead,
    refresh,
    clear,
    setInquiryId,
    
    // Helpers
    hasUnreadMessages: messages.some(msg => !msg.is_read && msg.receiver.id === user?.id),
    unreadMessageCount: messages.filter(msg => !msg.is_read && msg.receiver.id === user?.id).length,
    
    // Status helpers
    isPending: inquiry?.status === 'pending',
    isContacted: inquiry?.status === 'contacted',
    isViewingScheduled: inquiry?.status === 'viewing_scheduled',
    isFollowUp: inquiry?.status === 'follow_up',
    isClosed: inquiry?.status === 'closed',
    isSpam: inquiry?.status === 'spam',
    
    // Priority helpers
    isLowPriority: inquiry?.priority === 'low',
    isMediumPriority: inquiry?.priority === 'medium',
    isHighPriority: inquiry?.priority === 'high',
    isUrgentPriority: inquiry?.priority === 'urgent',
  };
};