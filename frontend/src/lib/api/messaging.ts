// lib/api/messaging.ts - Updated API calls
import apiClient from './client';
import {
    Message,
    Conversation,
    SendMessageData,
    User
} from '@/lib/types/messaging';

export const messagingApi = {
    // Get all conversations
    getConversations: async (): Promise<Conversation[]> => {
        const response = await apiClient.get('/threads/');
        return response.data.results || response.data;
    },

    // Get messages in a conversation
    getConversationMessages: async (threadId: number): Promise<Message[]> => {
        const response = await apiClient.get(`/threads/${threadId}/messages/`);
        return response.data.results || response.data;
    },

    // Start new conversation - Use correct endpoint
    startConversation: async (data: SendMessageData): Promise<Message> => {
        const formData = new FormData();
        formData.append('receiver', data.receiver.toString());
        formData.append('content', data.content);

        if (data.attachment) {
            formData.append('attachment', data.attachment);
        }

        // Use the standard create endpoint
        const response = await apiClient.post('/messages/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    // Send message in existing conversation
    sendMessage: async (data: SendMessageData): Promise<Message> => {
        const formData = new FormData();
        formData.append('receiver', data.receiver.toString());
        formData.append('content', data.content);

        if (data.message_type) {
            formData.append('message_type', data.message_type);
        }

        if (data.subject) {
            formData.append('subject', data.subject);
        }

        if (data.property) {
            formData.append('property', data.property.toString());
        }

        if (data.attachment) {
            // Validate file size (10MB limit)
            if (data.attachment.size > 10 * 1024 * 1024) {
                throw new Error('File size must be less than 10MB');
            }
            formData.append('attachment', data.attachment);
        }

        console.log('Sending message to /messages/ endpoint with data:', {
            receiver: data.receiver,
            content: data.content.substring(0, 100) + '...',
            hasAttachment: !!data.attachment
        });

        // Use the messages endpoint for new conversations
        const response = await apiClient.post('/messages/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    sendThreadMessage: async (threadId: number, content: string, attachment?: File, subject?: string): Promise<Message> => {
        const formData = new FormData();
        formData.append('content', content);

        if (subject) {
            formData.append('subject', subject);
        }

        if (attachment) {
            // Validate file size (10MB limit)
            if (attachment.size > 10 * 1024 * 1024) {
                throw new Error('File size must be less than 10MB');
            }
            formData.append('attachment', attachment);
        }

        const response = await apiClient.post(
            `/threads/${threadId}/send_message/`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    },

    // Mark message as read
    markAsRead: async (messageId: number): Promise<void> => {
        await apiClient.post(`/messages/${messageId}/mark_as_read/`);
    },

    // Get unread count
    getUnreadCount: async (): Promise<{ unread_count: number }> => {
        const response = await apiClient.get('/messages/unread_count/');
        return response.data;
    },

    // Search users to message
    searchUsers: async (query: string): Promise<User[]> => {
        const response = await apiClient.get(`/users/?search=${query}&limit=10`);
        return response.data.results || response.data;
    },

    deleteConversation: async (threadId: number): Promise<void> => {
        try {
            console.log(`Attempting to delete thread: ${threadId}`);
            const response = await apiClient.delete(`/threads/${threadId}/`);
            console.log(`Delete successful for thread: ${threadId}`, response.data);
            return response.data;
        } catch (error: any) {
            console.error(`Error deleting thread ${threadId}:`, error);
            console.error('Response data:', error.response?.data);
            console.error('Response status:', error.response?.status);
            throw error;
        }
    },
};