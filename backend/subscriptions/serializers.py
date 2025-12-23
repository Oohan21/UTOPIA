from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import PropertyPromotionTier, PropertyPromotion, Payment, PromoCode

User = get_user_model()

class PropertyPromotionTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyPromotionTier
        fields = [
            'id', 'name', 'tier_type', 'description',
            'price_7', 'price_30', 'price_60', 'price_90',
            'features', 'search_position', 'badge_color',
            'is_active', 'display_order'
        ]

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'user', 'promotion', 'amount_etb',
            'payment_method', 'transaction_id', 'chapa_reference',
            'status', 'paid_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'promotion', 'created_at', 'updated_at']

class PropertyPromotionSerializer(serializers.ModelSerializer):
    tier = PropertyPromotionTierSerializer(read_only=True)
    property_title = serializers.CharField(source='listed_property.title', read_only=True)
    property_id = serializers.IntegerField(source='listed_property.id', read_only=True)
    is_active = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    amount_paid = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyPromotion
        fields = [
            'id', 'listed_property', 'property_id', 'property_title',
            'tier', 'duration_days', 'start_date', 'end_date',
            'status', 'is_active', 'days_remaining', 'amount_paid',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_is_active(self, obj):
        return obj.is_active()
    
    def get_days_remaining(self, obj):
        return obj.days_remaining()
    
    def get_amount_paid(self, obj):
        return obj.get_amount_paid()

# Request serializers
class PurchasePromotionSerializer(serializers.Serializer):
    property_id = serializers.IntegerField(required=True)
    tier_type = serializers.ChoiceField(
        choices=['basic', 'standard', 'premium'],
        required=True
    )
    duration_days = serializers.ChoiceField(
        choices=[7, 30, 60, 90],
        required=True
    )
    promo_code = serializers.CharField(required=False, allow_blank=True)

class CalculatePromotionPriceSerializer(serializers.Serializer):
    tier_type = serializers.ChoiceField(
        choices=['basic', 'standard', 'premium'],
        required=True
    )
    duration_days = serializers.ChoiceField(
        choices=[7, 30, 60, 90],
        required=True
    )
    promo_code = serializers.CharField(required=False, allow_blank=True)