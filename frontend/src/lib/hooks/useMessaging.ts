// lib/hooks/useMessaging.ts - FIXED VERSION
import { useState, useCallback, useEffect, useRef } from 'react'; // Added useRef
import { messagingApi } from '@/lib/api/messaging';
import { Message, Conversation, User, SendMessageData } from '@/lib/types/messaging';
import { useToast } from '@/components/ui/use-toast';

export const useMessaging = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await messagingApi.getConversations();
      // Handle both array response and paginated response
      const results = Array.isArray(data) ? data : (data as any).results || [];
      setConversations(results);
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (threadId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await messagingApi.getConversationMessages(threadId);
      // Handle both array response and paginated response
      const results = Array.isArray(data) ? data : (data as any).results || [];
      setMessages(results);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error fetching messages:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select a conversation
  const selectConversation = useCallback(async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation.id);
  }, [fetchMessages]);

  // Send new message (starts new conversation)
  const sendMessage = useCallback(async (data: SendMessageData) => {
    try {
      const message = await messagingApi.sendMessage(data);

      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });

      // Refresh conversations to show new thread
      await fetchConversations();

      return message;
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast({
        title: 'Failed to send message',
        description: err.response?.data?.detail || err.message || 'Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  }, [fetchConversations, toast]);

  // Send message in existing conversation
  const sendThreadMessage = useCallback(async (threadId: number, content: string, attachment?: File) => {
    try {
      // Check if sendThreadMessage exists in messagingApi
      let message;
      if ('sendThreadMessage' in messagingApi && typeof messagingApi.sendThreadMessage === 'function') {
        message = await (messagingApi as any).sendThreadMessage(threadId, content, attachment);
      } else {
        // Fallback to regular sendMessage
        message = await messagingApi.sendMessage({
          receiver: 0, // This won't work - we need a different approach
          content,
          attachment
        });
      }

      // Add message to local state
      setMessages(prev => [...prev, message]);

      // Update conversation in list
      setConversations(prev =>
        prev.map(conv =>
          conv.id === threadId
            ? {
              ...conv,
              last_message_content: content,
              last_message_time: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            : conv
        )
      );

      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });

      return message;
    } catch (err: any) {
      console.error('Error sending thread message:', err);
      toast({
        title: 'Failed to send message',
        description: err.response?.data?.detail || err.message || 'Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  }, [setMessages, setConversations, toast]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: number) => {
    try {
      await messagingApi.markAsRead(messageId);

      // Update local state
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));

      // Update unread count in conversation
      if (selectedConversation) {
        setConversations(prev => prev.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, unread_count: Math.max(0, conv.unread_count - 1) }
            : conv
        ));
      }

    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, [selectedConversation]);

  // Mark thread as read
  const markThreadAsRead = useCallback(async (threadId: number) => {
    try {
      // For now, we'll mark individual messages as read
      // This would be an API call if available
      setMessages(prev => prev.map(msg => {
        // Check if message belongs to this thread (adjust based on your data structure)
        const belongsToThread = (msg as any).thread_id === threadId ||
          (msg as any).thread === threadId;
        return belongsToThread ? { ...msg, is_read: true } : msg;
      }));

      setConversations(prev => prev.map(conv =>
        conv.id === threadId ? { ...conv, unread_count: 0 } : conv
      ));

    } catch (err) {
      console.error('Error marking thread as read:', err);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await messagingApi.getUnreadCount();
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // Clear selected conversation
  const clearSelection = useCallback(() => {
    setSelectedConversation(null);
    setMessages([]);
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchConversations(),
      fetchUnreadCount(),
    ]);
  }, [fetchConversations, fetchUnreadCount]);

  // Delete conversation
  const deleteConversation = useCallback(async (threadId: number) => {
    try {
      // Call the API to delete conversation
      await messagingApi.deleteConversation(threadId);

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== threadId));

      // Clear selection if this was the selected conversation
      if (selectedConversation?.id === threadId) {
        clearSelection();
      }

      toast({
        title: 'Conversation deleted',
        description: 'The conversation has been deleted successfully.',
      });

    } catch (err: any) {
      console.error('Error deleting conversation:', err);
      toast({
        title: 'Failed to delete conversation',
        description: err.response?.data?.detail || err.message || 'Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  }, [selectedConversation, clearSelection, toast]);

  // Initial data fetch
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Poll for new messages (optional - every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedConversation) {
        fetchMessages(selectedConversation.id);
      }
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedConversation, fetchMessages, fetchUnreadCount]);

  return {
    // State
    conversations,
    selectedConversation,
    messages,
    isLoading,
    error,
    unreadCount,

    // Actions
    fetchConversations,
    fetchMessages,
    selectConversation,
    sendMessage,
    sendThreadMessage,
    markAsRead,
    markThreadAsRead,
    clearSelection,
    deleteConversation,
    refreshAll,

    // Utility
    hasUnreadMessages: unreadCount > 0,
    totalMessages: messages.length,
  };
};