// lib/api/payment.ts - NEW/UPDATED
import apiClient from './client';

export const paymentApi = {
    // Handle Chapa callback
    handleChapaCallback: async (data: {
        tx_ref: string;
        status: string;
        transaction_id?: string;
    }) => {
        const response = await apiClient.post('/subscriptions/payment/webhook/', data);
        return response.data;
    },

    // Verify payment status
    verifyPaymentStatus: async (paymentId: string) => {
        const response = await apiClient.get(`/payments/${paymentId}/status/`);
        return response.data;
    },

    // Get payment history
    getPaymentHistory: async () => {
        const response = await apiClient.get('/payments/history/');
        return response.data;
    },

    // Retry failed payment
    retryPayment: async (paymentId: string) => {
        const response = await apiClient.post(`/payments/${paymentId}/retry/`);
        return response.data;
    }
};