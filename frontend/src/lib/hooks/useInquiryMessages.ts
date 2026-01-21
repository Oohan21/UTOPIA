import { useState, useCallback } from 'react';
import { inquiryApi } from '@/lib/api/inquiry';
import { InquiryMessage } from '@/lib/types/inquiry';
import { useToast } from '@/components/ui/use-toast';

export const useInquiryMessages = (inquiryId?: string) => {
  const [messages, setMessages] = useState<InquiryMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  
  const { toast } = useToast();

  // Load messages
  const loadMessages = useCallback(async (id?: string) => {
    const targetId = id || inquiryId;
    if (!targetId) {
      setError('Inquiry ID is required');
      return [];
    }

    try {
      setLoading(true);
      setError(null);
      const messagesData = await inquiryApi.getInquiryMessages(targetId);
      setMessages(messagesData);
      return messagesData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load messages';
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
  const sendMessage = useCallback(async (data: { message: string; attachment?: File; subject?: string }, targetId?: string) => {
    const id = targetId || inquiryId;
    if (!id) {
      throw new Error('Inquiry ID is required');
    }

    try {
      setSending(true);
      const message = await inquiryApi.sendInquiryMessage(id, data);
      
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
      setSending(false);
    }
  }, [inquiryId, toast]);

  // Mark as read
  const markAsRead = useCallback(async (messageId: number) => {
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

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadMessages = messages.filter(msg => !msg.is_read);
    
    try {
      await Promise.all(unreadMessages.map(msg => inquiryApi.markMessageAsRead(msg.id)));
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        ({ ...msg, is_read: true, read_at: new Date().toISOString() })
      ));
    } catch (err) {
      console.error('Failed to mark all messages as read:', err);
    }
  }, [messages]);

  // Refresh messages
  const refresh = useCallback(async () => {
    if (inquiryId) {
      await loadMessages(inquiryId);
    }
  }, [inquiryId, loadMessages]);

  // Clear messages
  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Set inquiry ID and load
  const setInquiryId = useCallback(async (id: string) => {
    await loadMessages(id);
  }, [loadMessages]);

  return {
    // State
    messages,
    loading,
    sending,
    error,
    
    // Actions
    loadMessages,
    sendMessage,
    markAsRead,
    markAllAsRead,
    refresh,
    clear,
    setInquiryId,
    
    // Computed values
    unreadCount: messages.filter(msg => !msg.is_read).length,
    hasUnread: messages.some(msg => !msg.is_read),
    lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
    
    // Helper methods
    getMessageById: (id: number) => messages.find(msg => msg.id === id),
    getMessagesBySender: (senderId: number) => messages.filter(msg => msg.sender.id === senderId),
    getMessagesByDate: (date: string) => messages.filter(msg => msg.created_at.startsWith(date)),
  };
};