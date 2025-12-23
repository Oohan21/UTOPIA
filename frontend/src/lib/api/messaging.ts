// lib/api.ts
import apiClient from './client';
import {
    Message,
    MessageThread,
    QuickContact,
    MessageStats,
    CreateMessageData,
    ThreadMessageData
} from '@/lib/types/messaging';

export const messagingApi = {
    // Messages
    getMessages: async (params?: {
        thread?: number;
        property?: number;
        inquiry?: number;
        unread?: boolean;
        page?: number;
        page_size?: number;
    }) => {
        const queryParams = new URLSearchParams();

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value));
                }
            });
        }

        const url = `/messages/${queryParams.toString() ? `?${queryParams}` : ''}`;
        const response = await apiClient.get(url);
        return response.data;
    },

    sendMessage: async (data: CreateMessageData) => {
        const formData = new FormData();

        try {
            // Add all fields to FormData 
            formData.append('receiver', data.receiver.toString());
            formData.append('message_type', data.message_type);
            formData.append('content', data.content);

            if (data.subject) {
                formData.append('subject', data.subject);
            }

            if (data.property) {
                formData.append('property', data.property.toString());
            }

            if (data.inquiry) {
                formData.append('inquiry', data.inquiry.toString());
            }

            if (data.attachment) {
                // Validate file size (10MB limit)
                if (data.attachment.size > 10 * 1024 * 1024) {
                    throw new Error('File size must be less than 10MB');
                }
                formData.append('attachment', data.attachment);
            }

            const response = await apiClient.post('/messages/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error: any) {
            console.error('Error sending message:', error);
            if (error.response?.data) {
                throw new Error(JSON.stringify(error.response.data));
            }
            throw error;
        }
    },

    markMessageAsRead: async (messageId: number) => {
        const response = await apiClient.post(`/messages/${messageId}/mark_as_read/`);
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await apiClient.get('/messages/unread_count/');
        return response.data;
    },

    // Message Threads
    getMessageThreads: async (params?: {
        property?: number;
        inquiry?: number;
        is_active?: boolean;
        page?: number;
        page_size?: number;
    }) => {
        const queryParams = new URLSearchParams();

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value));
                }
            });
        }

        const url = `/message-threads/${queryParams.toString() ? `?${queryParams}` : ''}`;
        const response = await apiClient.get(url);
        return response.data;
    },

    getThreadMessages: async (threadId: number, params?: {
        page?: number;
        page_size?: number;
    }) => {
        const queryParams = new URLSearchParams();

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value));
                }
            });
        }

        const url = `/message-threads/${threadId}/messages/${queryParams.toString() ? `?${queryParams}` : ''}`;
        const response = await apiClient.get(url);
        return response.data;
    },

    sendThreadMessage: async (threadId: number, data: ThreadMessageData) => {
        const formData = new FormData();
        formData.append('content', data.content);

        if (data.message_type) {
            formData.append('message_type', data.message_type);
        }

        if (data.attachment) {
            // Validate file size (10MB limit)
            if (data.attachment.size > 10 * 1024 * 1024) {
                throw new Error('File size must be less than 10MB');
            }
            formData.append('attachment', data.attachment);
        }

        const response = await apiClient.post(
            `/message-threads/${threadId}/send_message/`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    },

    markThreadAsRead: async (threadId: number) => {
        const response = await apiClient.post(`/message-threads/${threadId}/mark_all_read/`);
        return response.data;
    },

    archiveThread: async (threadId: number) => {
        const response = await apiClient.post(`/message-threads/${threadId}/archive/`);
        return response.data;
    },

    unarchiveThread: async (threadId: number) => {
        const response = await apiClient.post(`/message-threads/${threadId}/unarchive/`);
        return response.data;
    },

    // Quick Contacts
    getQuickContacts: async () => {
        const response = await apiClient.get('/message-threads/quick-contacts/');
        return response.data;
    },

    // Analytics
    getMessageAnalytics: async () => {
        const response = await apiClient.get('/message/analytics/');
        return response.data;
    },

    // Bulk Operations
    bulkMarkAsRead: async (messageIds: number[]) => {
        const response = await apiClient.post('/message/bulk/', {
            message_ids: messageIds,
            action: 'mark_read'
        });
        return response.data;
    },

    bulkDelete: async (messageIds: number[]) => {
        const response = await apiClient.post('/message/bulk/', {
            message_ids: messageIds,
            action: 'delete'
        });
        return response.data;
    }
};