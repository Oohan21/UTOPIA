# subscriptions/serializers.py - UPDATED FOR HYBRID MODEL
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    SubscriptionPlan, UserSubscription, 
    PropertyPromotionTier, PropertyPromotion, Payment
)

User = get_user_model()

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    monthly_price = serializers.SerializerMethodField()
    yearly_price = serializers.SerializerMethodField()
    yearly_savings = serializers.SerializerMethodField()
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'plan_type', 'description',
            'price_etb', 'billing_cycle',
            'max_properties', 'property_discount',
            'priority_support', 'advanced_analytics',
            'bulk_upload', 'featured_properties_included',
            'is_active', 'is_popular', 'display_order',
            'monthly_price', 'yearly_price', 'yearly_savings'
        ]
    
    def get_monthly_price(self, obj):
        if obj.billing_cycle == 'monthly':
            return obj.price_etb
        return obj.price_etb / 12
    
    def get_yearly_price(self, obj):
        if obj.billing_cycle == 'yearly':
            return obj.price_etb
        return obj.price_etb * 12
    
    def get_yearly_savings(self, obj):
        if obj.billing_cycle == 'yearly':
            monthly_equivalent = obj.price_etb / 12
            return (monthly_equivalent * 12) - obj.price_etb
        return 0

class PropertyPromotionTierSerializer(serializers.ModelSerializer):
    discounted_price = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyPromotionTier
        fields = [
            'id', 'name', 'tier_type', 'description',
            'price_7_days', 'price_30_days', 'price_90_days',
            'features', 'search_priority', 'homepage_featured',
            'email_inclusion', 'social_media_promotion', 'badge_display',
            'discounted_price'
        ]
    
    def get_discounted_price(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            subscription = request.user.subscriptions.filter(status='active').first()
            if subscription:
                discount = subscription.plan.property_discount
                return {
                    '7_days': obj.price_7_days * (1 - discount / 100),
                    '30_days': obj.price_30_days * (1 - discount / 100),
                    '90_days': obj.price_90_days * (1 - discount / 100) if obj.price_90_days else None
                }
        return None

class UserSubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = UserSubscription
        fields = [
            'id', 'user', 'user_email', 'plan', 'status',
            'start_date', 'end_date', 'auto_renew',
            'amount_paid', 'payment_reference',
            'is_active', 'days_remaining', 'created_at'
        ]
        read_only_fields = ['created_at']

class PropertyPromotionSerializer(serializers.ModelSerializer):
    tier = PropertyPromotionTierSerializer(read_only=True)
    property_title = serializers.CharField(source='property.title', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = PropertyPromotion
        fields = [
            'id', 'promotion_id', 'property', 'property_title',
            'tier', 'original_price', 'discount_applied',
            'final_price', 'duration_days', 'start_date',
            'end_date', 'status', 'is_active', 'created_at'
        ]

# Request/Response serializers
class SubscribeRequestSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField(required=True)
    payment_method = serializers.CharField(max_length=50, required=True)
    billing_cycle = serializers.ChoiceField(choices=['monthly', 'yearly'], required=True)
    promo_code = serializers.CharField(max_length=50, required=False, allow_blank=True)

class PurchasePromotionSerializer(serializers.Serializer):
    property_id = serializers.IntegerField(required=True)
    tier_id = serializers.IntegerField(required=True)
    duration_days = serializers.IntegerField(required=True)
    payment_method = serializers.CharField(max_length=50, required=True)

class CalculatePromotionPriceSerializer(serializers.Serializer):
    tier_id = serializers.IntegerField(required=True)
    duration_days = serializers.IntegerField(required=True)