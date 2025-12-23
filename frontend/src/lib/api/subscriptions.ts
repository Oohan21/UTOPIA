// lib/api/subscriptions.ts - UPDATED
import apiClient from './client';
import {
    PropertyPromotionTier,
    PropertyPromotion
} from '@/lib/types/subscription';

export interface PromotionTiersResponse {
    count?: number;
    next?: string | null;
    previous?: string | null;
    results?: PropertyPromotionTier[];
    data?: PropertyPromotionTier[];
}

export const subscriptionApi = {
    // Property Promotion Tiers
    getPromotionTiers: async (): Promise<PropertyPromotionTier[]> => {
        try {
            const response = await apiClient.get<PromotionTiersResponse>('/subscriptions/promotion-tiers/');
            console.log('Promotion tiers API response:', response.data);

            // Handle different response formats
            const data = response.data;

            if (Array.isArray(data)) {
                return data;
            } else if (data?.results && Array.isArray(data.results)) {
                return data.results;
            } else if (data?.data && Array.isArray(data.data)) {
                return data.data;
            } else if (data && typeof data === 'object') {
                // Try to extract array from object values
                const values = Object.values(data);
                const arrayValue = values.find(v => Array.isArray(v));
                if (arrayValue) {
                    return arrayValue;
                }
            }

            console.warn('Unexpected API response format:', data);
            return [];

        } catch (error: any) {
            console.error('Error fetching promotion tiers:', error);
            throw error;
        }
    },

    // Calculate promotion price
    calculatePromotionPrice: async (data: {
        tier_type: string;
        duration_days: number;
        promo_code?: string;
    }) => {
        const response = await apiClient.post('/subscriptions/property-promotions/calculate_price/', data);
        return response.data;
    },

    // Initiate promotion payment
    initiatePromotionPayment: async (data: {
        property_id: number;
        tier_type: string;
        duration_days: number;
        promo_code?: string;
    }) => {
        try {
            console.log('Initiating payment with data:', data);

            const requestData = {
                property_id: data.property_id,
                tier_type: data.tier_type,
                duration_days: data.duration_days,
                ...(data.promo_code && { promo_code: data.promo_code })
            };

            console.log('Sending to backend endpoint:', '/subscriptions/payment/initiate/');
            console.log('Request data:', requestData);

            // This should match the Django URL pattern
            const response = await apiClient.post('/subscriptions/payment/initiate/', requestData);

            console.log('Backend payment response:', response.data);
            return response.data;

        } catch (error: any) {
            console.error('Payment initiation error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });

            // Provide more specific error messages
            if (error.response?.status === 404) {
                throw new Error('Payment endpoint not found. Please check backend configuration.');
            } else if (error.response?.status === 400) {
                throw new Error(`Invalid request: ${error.response.data?.error || 'Bad request'}`);
            } else if (error.response?.status === 403) {
                throw new Error('You do not have permission to promote this property.');
            } else if (error.response?.status === 404) {
                throw new Error('Property or promotion tier not found.');
            }

            throw new Error(error.response?.data?.error || 'Failed to initiate payment');
        }
    },

    // Verify payment
    verifyPayment: async (params: {
        tx_ref?: string;
        payment_id?: string;
        promotion_id?: string;
        property_id?: string;  // Add this if needed
    }) => {
        // Log the params to see what's being sent
        console.log('verifyPayment called with params:', params);

        // Filter out undefined parameters
        const cleanParams: Record<string, string> = {};

        if (params.tx_ref) cleanParams.tx_ref = params.tx_ref;
        if (params.payment_id) cleanParams.payment_id = params.payment_id;
        if (params.promotion_id) cleanParams.promotion_id = params.promotion_id;
        if (params.property_id) cleanParams.property_id = params.property_id;

        console.log('cleanParams being sent:', cleanParams);

        try {
            const response = await apiClient.get('/subscriptions/payment/verify/', {
                params: cleanParams
            });
            return response.data;
        } catch (error: any) {
            console.error('Error verifying payment:', error.response?.data || error.message);
            throw error;
        }
    },

    // Get user promotions
    getUserPromotions: async () => {
        const response = await apiClient.get<PropertyPromotion[]>('/subscriptions/property-promotions/');
        return response.data;
    },

    // Dashboard
    getPromotionsDashboard: async () => {
        const response = await apiClient.get('/subscriptions/dashboard/');
        return response.data;
    },

    // Apply promo code
    applyPromoCode: async (code: string, amount: number) => {
        const response = await apiClient.post('/subscriptions/apply-promo-code/', {
            code,
            amount
        });
        return response.data;
    }
};