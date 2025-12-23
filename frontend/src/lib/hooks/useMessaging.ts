// app/lib/hooks/useMessaging.tsx
import { useState, useCallback, useEffect } from 'react';
import { messagingApi } from '@/lib/api/messaging';
import { Message, MessageThread, QuickContact, MessageStats } from '@/lib/types/messaging';
import { useToast } from '@/components/ui/use-toast';

interface CreateMessageData {
  receiver: number;
  property?: number;
  inquiry?: number;
  message_type: string;
  subject?: string;
  content: string;
  attachment?: File;
}

interface ThreadMessageData {
  content: string;
  attachment?: File;
  message_type?: string;
}

export const useMessaging = () => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickContacts, setQuickContacts] = useState<QuickContact[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreads, setSelectedThreads] = useState<number[]>([]);
  const { toast } = useToast();

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await messagingApi.getMessageThreads();
      setThreads(data.results || []);
    } catch (err) {
      setError('Failed to load message threads');
      console.error('Error fetching threads:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async (threadId?: number, params?: any) => {
    try {
      setIsLoading(true);
      setError(null);
      let data;

      if (threadId) {
        data = await messagingApi.getThreadMessages(threadId, params);
      } else {
        data = await messagingApi.getMessages(params);
      }

      setMessages(data.results || []);
      return data;
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch quick contacts
  const fetchQuickContacts = useCallback(async () => {
    try {
      const data = await messagingApi.getQuickContacts();
      setQuickContacts(data);
    } catch (err) {
      console.error('Error fetching quick contacts:', err);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await messagingApi.getMessageAnalytics();
      setStats(data);
    } catch (err) {
      console.error('Error fetching message analytics:', err);
      setStats({
        response_rate: 0,
        avg_response_time: 'N/A',
        weekly_activity: [0, 0, 0, 0, 0, 0, 0],
        top_contacts: [],
        total_messages: 0,
        unread_count: 0,
        active_conversations: 0,
        total_threads: 0,
        weekly_activity_count: 0,
      });
    }
  }, []);

  // Send new message
  const sendMessage = useCallback(async (data: CreateMessageData) => {
    try {
      const result = await messagingApi.sendMessage(data);
      
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });
      
      // Refresh threads and contacts
      await Promise.all([
        fetchThreads(),
        fetchQuickContacts(),
      ]);
      
      return result;
    } catch (err: any) {
      toast({
        title: 'Failed to send message',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast, fetchThreads, fetchQuickContacts]);

  // Send thread message
  const sendThreadMessage = useCallback(async (threadId: number, data: ThreadMessageData) => {
    try {
      const result = await messagingApi.sendThreadMessage(threadId, data);
      
      // Refresh messages and threads
      await Promise.all([
        fetchMessages(threadId),
        fetchThreads(),
      ]);
      
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });
      
      return result;
    } catch (err: any) {
      toast({
        title: 'Failed to send message',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  }, [fetchMessages, fetchThreads, toast]);

  // Mark single message as read
  const markAsRead = useCallback(async (messageId: number) => {
    try {
      await messagingApi.markMessageAsRead(messageId);
      
      // Update local state
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
      
      setThreads(prev => prev.map(thread => ({
        ...thread,
        unread_count: thread.last_message?.id === messageId ? 
          Math.max(0, (thread.unread_count || 0) - 1) : thread.unread_count
      })));
      
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, []);

  // Mark thread as read
  const markThreadAsRead = useCallback(async (threadId: number) => {
    try {
      await messagingApi.markThreadAsRead(threadId);
      
      // Update local state
      setThreads(prev => prev.map(thread =>
        thread.id === threadId ? { ...thread, unread_count: 0 } : thread
      ));
      
      // Also update messages in this thread
      setMessages(prev => prev.map(msg =>
        msg.thread_last_message === threadId ? { ...msg, is_read: true } : msg
      ));
      
    } catch (err) {
      console.error('Error marking thread as read:', err);
    }
  }, []);

  // Archive thread
  const archiveThread = useCallback(async (threadId: number) => {
    try {
      await messagingApi.archiveThread(threadId);
      
      // Update local state
      setThreads(prev => prev.map(thread =>
        thread.id === threadId ? { ...thread, is_active: false } : thread
      ));
      
      toast({
        title: "Success",
        description: "Thread archived successfully.",
      });
      
    } catch (err: any) {
      console.error('Error archiving thread:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to archive thread.",
      });
    }
  }, [toast]);

  // Unarchive thread
  const unarchiveThread = useCallback(async (threadId: number) => {
    try {
      await messagingApi.unarchiveThread(threadId);
      
      // Update local state
      setThreads(prev => prev.map(thread =>
        thread.id === threadId ? { ...thread, is_active: true } : thread
      ));
      
      toast({
        title: "Success",
        description: "Thread unarchived successfully.",
      });
      
    } catch (err: any) {
      console.error('Error unarchiving thread:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to unarchive thread.",
      });
    }
  }, [toast]);

  // Bulk mark as read
  const bulkMarkAsRead = useCallback(async (messageIds: number[]) => {
    try {
      await messagingApi.bulkMarkAsRead(messageIds);
      
      // Update local state
      setMessages(prev => prev.map(msg =>
        messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
      ));
      
      // Clear selection
      setSelectedThreads([]);
      
      toast({
        title: "Success",
        description: `${messageIds.length} message(s) marked as read.`,
      });
      
    } catch (err: any) {
      console.error('Error in bulk mark as read:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to mark messages as read.",
      });
    }
  }, [toast]);

  // Bulk delete
  const bulkDelete = useCallback(async (messageIds: number[]) => {
    try {
      await messagingApi.bulkDelete(messageIds);
      
      // Update local state
      setMessages(prev => prev.filter(msg => !messageIds.includes(msg.id)));
      
      // Clear selection
      setSelectedThreads([]);
      
      toast({
        title: "Success",
        description: `${messageIds.length} message(s) deleted.`,
        variant: "destructive",
      });
      
    } catch (err: any) {
      console.error('Error in bulk delete:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to delete messages.",
      });
    }
  }, [toast]);

  // Toggle thread selection
  const toggleThreadSelection = useCallback((threadId: number) => {
    setSelectedThreads(prev => 
      prev.includes(threadId) 
        ? prev.filter(id => id !== threadId)
        : [...prev, threadId]
    );
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedThreads([]);
  }, []);

  // Select all threads
  const selectAllThreads = useCallback(() => {
    setSelectedThreads(threads.map(thread => thread.id));
  }, [threads]);

  // Star/unstar thread (mock function)
  const toggleStarThread = useCallback(async (threadId: number) => {
    try {
      // This would be an API call in real implementation
      setThreads(prev => prev.map(thread =>
        thread.id === threadId ? { ...thread, is_starred: !thread.is_starred } : thread
      ));
      
      toast({
        title: "Success",
        description: "Thread star status updated.",
      });
      
    } catch (err: any) {
      console.error('Error toggling star:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update star status.",
      });
    }
  }, [toast]);

  // Mute/unmute thread (mock function)
  const toggleMuteThread = useCallback(async (threadId: number) => {
    try {
      // This would be an API call in real implementation
      setThreads(prev => prev.map(thread =>
        thread.id === threadId ? { ...thread, is_muted: !thread.is_muted } : thread
      ));
      
      toast({
        title: "Success",
        description: "Thread mute status updated.",
      });
      
    } catch (err: any) {
      console.error('Error toggling mute:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update mute status.",
      });
    }
  }, [toast]);

  // Pin/unpin thread (mock function)
  const togglePinThread = useCallback(async (threadId: number) => {
    try {
      // This would be an API call in real implementation
      setThreads(prev => {
        const updated = prev.map(thread =>
          thread.id === threadId ? { ...thread, is_pinned: !thread.is_pinned } : thread
        );
        // Sort: pinned first, then by date
        return updated.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      });
      
      toast({
        title: "Success",
        description: "Thread pin status updated.",
      });
      
    } catch (err: any) {
      console.error('Error toggling pin:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to update pin status.",
      });
    }
  }, [toast]);

  // Block user (mock function)
  const blockUser = useCallback(async (userId: number) => {
    try {
      // This would be an API call in real implementation
      toast({
        title: "User Blocked",
        description: "User has been blocked successfully.",
        variant: "destructive",
      });
      
    } catch (err: any) {
      console.error('Error blocking user:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to block user.",
      });
    }
  }, [toast]);

  // Report thread (mock function)
  const reportThread = useCallback(async (threadId: number, reason: string) => {
    try {
      // This would be an API call in real implementation
      toast({
        title: "Thread Reported",
        description: "Thread has been reported for review.",
        variant: "destructive",
      });
      
    } catch (err: any) {
      console.error('Error reporting thread:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to report thread.",
      });
    }
  }, [toast]);

  // Export conversation (mock function)
  const exportConversation = useCallback(async (threadId: number) => {
    try {
      // This would generate and download a file in real implementation
      toast({
        title: "Export Started",
        description: "Conversation export has been initiated.",
      });
      
      // Simulate file download
      setTimeout(() => {
        const element = document.createElement('a');
        const text = `Conversation Export - Thread ${threadId}\n\nGenerated at: ${new Date().toLocaleString()}`;
        const file = new Blob([text], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `conversation-${threadId}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        toast({
          title: "Export Complete",
          description: "Conversation has been exported.",
        });
      }, 1000);
      
    } catch (err: any) {
      console.error('Error exporting conversation:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to export conversation.",
      });
    }
  }, [toast]);

  // Copy thread link
  const copyThreadLink = useCallback((threadId: number) => {
    const link = `${window.location.origin}/messages/thread/${threadId}`;
    navigator.clipboard.writeText(link)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Thread link copied to clipboard.",
        });
      })
      .catch(err => {
        console.error('Error copying link:', err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to copy link.",
        });
      });
  }, [toast]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchThreads(),
      fetchQuickContacts(),
      fetchStats(),
    ]);
  }, [fetchThreads, fetchQuickContacts, fetchStats]);

  // Initial data fetch
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    // State
    threads,
    messages,
    quickContacts,
    stats,
    isLoading,
    error,
    selectedThreads,
    
    // Actions
    fetchThreads,
    fetchMessages,
    fetchQuickContacts,
    fetchStats,
    sendMessage,
    sendThreadMessage,
    markAsRead,
    markThreadAsRead,
    archiveThread,
    unarchiveThread,
    bulkMarkAsRead,
    bulkDelete,
    toggleThreadSelection,
    clearSelection,
    selectAllThreads,
    toggleStarThread,
    toggleMuteThread,
    togglePinThread,
    blockUser,
    reportThread,
    exportConversation,
    copyThreadLink,
    refreshAll,
    
    // Utility
    hasUnreadMessages: (stats?.unread_count || 0) > 0,
    totalUnreadCount: stats?.unread_count || 0,
    selectedCount: selectedThreads.length,
  };
};