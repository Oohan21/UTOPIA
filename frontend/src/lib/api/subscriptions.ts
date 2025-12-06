// lib/api/subscriptions.ts - NEW FILE
import apiClient from './client';
import {
    SubscriptionPlan, UserSubscription,
    PropertyPromotionTier, PropertyPromotion
} from '@/lib/types/subscription';

export const subscriptionApi = {
    // Subscription Plans (Optional)
    getPlans: async () => {
        const response = await apiClient.get<{ results: SubscriptionPlan[] }>('/subscription-plans/');
        return response.data.results;
    },

    getUserPlans: async () => {
        const response = await apiClient.get<SubscriptionPlan[]>('/subscription-plans/for_user/');
        return response.data;
    },

    getCurrentSubscription: async () => {
        try {
            const response = await apiClient.get<UserSubscription>('/user-subscriptions/current/');
            return response.data;
        } catch (error: any) {
            // If 404 or "No active subscription", return null
            if (error.response?.status === 404 || error.response?.data?.detail === 'No active subscription') {
                return null;
            }
            throw error;
        }
    },

    subscribe: async (data: {
        plan_id: number;
        payment_method: string;
        billing_cycle: 'monthly' | 'yearly';
        promo_code?: string;
    }) => {
        const response = await apiClient.post('/user-subscriptions/subscribe/', data);
        return response.data;
    },

    cancelSubscription: async (subscriptionId: number) => {
        const response = await apiClient.post(`/user-subscriptions/${subscriptionId}/cancel/`);
        return response.data;
    },

    // Property Promotion Tiers (Required)
    getPromotionTiers: async () => {
        const response = await apiClient.get<PropertyPromotionTier[]>('/promotion-tiers/');
        return response.data;
    },

    calculatePromotionPrice: async (tier_id: number, duration_days: number) => {
        const response = await apiClient.post('/property-promotions/calculate_price/', {
            tier_id,
            duration_days
        });
        return response.data;
    },

    purchasePromotion: async (data: {
        property_id: number;
        tier_id: number;
        duration_days: number;
        payment_method: string;
    }) => {
        const response = await apiClient.post('/property-promotions/purchase/', data);
        return response.data;
    },

    activatePromotion: async (promotionId: number) => {
        const response = await apiClient.post(`/property-promotions/${promotionId}/activate/`);
        return response.data;
    },

    getUserPromotions: async () => {
        const response = await apiClient.get<PropertyPromotion[]>('/property-promotions/');
        return response.data;
    },

    // Dashboard
    getDashboard: async () => {
        const response = await apiClient.get('/subscriptions/dashboard/');
        return response.data;
    },

    // Payment
    processPayment: async (paymentId: string, transactionId: string) => {
        const response = await apiClient.post(`/payments/${paymentId}/process/`, {
            transaction_id: transactionId
        });
        return response.data;
    }
};