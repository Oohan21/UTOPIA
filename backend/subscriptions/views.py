# subscriptions/views.py - FIXED
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from decimal import Decimal

from .models import (
    SubscriptionPlan, UserSubscription,
    PropertyPromotionTier, PropertyPromotion, PromoCode
)
from .serializers import (
    SubscriptionPlanSerializer, UserSubscriptionSerializer,
    PropertyPromotionTierSerializer, PropertyPromotionSerializer,
    SubscribeRequestSerializer, PurchasePromotionSerializer,
    CalculatePromotionPriceSerializer
)
from real_estate.models import Property

class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """Optional subscription plans"""
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]

class UserSubscriptionViewSet(viewsets.ModelViewSet):
    """User subscriptions"""
    serializer_class = UserSubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserSubscription.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current active subscription"""
        subscription = UserSubscription.objects.filter(
            user=request.user,
            status='active'
        ).first()
        
        if subscription and subscription.is_active():
            serializer = self.get_serializer(subscription)
            return Response(serializer.data)
        return Response({'detail': 'No active subscription'}, status=404)
    
    @action(detail=False, methods=['post'])
    def subscribe(self, request):
        """Subscribe to a plan (optional)"""
        serializer = SubscribeRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        try:
            plan = SubscriptionPlan.objects.get(id=serializer.validated_data['plan_id'])
            billing_cycle = serializer.validated_data['billing_cycle']
            
            # Calculate price based on billing cycle
            if billing_cycle == 'monthly':
                price = plan.monthly_price
                end_date = timezone.now() + timezone.timedelta(days=30)
            else:  # yearly
                price = plan.yearly_price
                end_date = timezone.now() + timezone.timedelta(days=365)
            
            with transaction.atomic():
                # Create subscription
                subscription = UserSubscription.objects.create(
                    user=request.user,
                    plan=plan,
                    status='active',
                    amount_paid=price,
                    end_date=end_date,
                    auto_renew=True
                )
                
                return Response({
                    'success': True,
                    'message': f'Subscribed to {plan.name}',
                    'subscription': self.get_serializer(subscription).data,
                    'payment_required': price > 0
                })
                
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel subscription"""
        subscription = self.get_object()
        subscription.status = 'canceled'
        subscription.auto_renew = False
        subscription.save()
        
        return Response({
            'success': True,
            'message': 'Subscription canceled'
        })

class PropertyPromotionTierViewSet(viewsets.ReadOnlyModelViewSet):
    """Required promotion tiers"""
    queryset = PropertyPromotionTier.objects.filter(is_active=True)
    serializer_class = PropertyPromotionTierSerializer
    permission_classes = [AllowAny]

class PropertyPromotionViewSet(viewsets.ModelViewSet):
    """Property promotions"""
    serializer_class = PropertyPromotionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PropertyPromotion.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def calculate_price(self, request):
        """Calculate promotion price with subscription discount"""
        serializer = CalculatePromotionPriceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        try:
            tier = PropertyPromotionTier.objects.get(id=serializer.validated_data['tier_id'])
            duration_days = serializer.validated_data['duration_days']
            
            # Get user's active subscription for discount
            subscription = UserSubscription.objects.filter(
                user=request.user,
                status='active'
            ).first()
            
            price = tier.get_price(duration_days)
            
            # Apply subscription discount
            if subscription:
                discount = subscription.plan.property_discount
                price = price * (1 - discount / 100)
            
            return Response({
                'tier_name': tier.name,
                'duration_days': duration_days,
                'original_price': tier.price_30,
                'discount_applied': tier.price_30 - price if subscription else 0,
                'final_price': round(price),
                'has_subscription_discount': bool(subscription)
            })
            
        except PropertyPromotionTier.DoesNotExist:
            return Response({'error': 'Promotion tier not found'}, status=404)
    
    @action(detail=False, methods=['post'])
    def purchase(self, request):
        """Purchase promotion for a property (REQUIRED for visibility)"""
        serializer = PurchasePromotionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        try:
            property_obj = Property.objects.get(
                id=serializer.validated_data['property_id'],
                owner=request.user
            )
            tier = PropertyPromotionTier.objects.get(id=serializer.validated_data['tier_id'])
            duration_days = serializer.validated_data['duration_days']
            payment_method = serializer.validated_data['payment_method']
            
            # Get subscription for discount
            subscription = UserSubscription.objects.filter(
                user=request.user,
                status='active'
            ).first()
            
            with transaction.atomic():
                # Calculate price
                base_price = tier.get_price(duration_days)
                
                # Apply subscription discount
                if subscription:
                    discount = subscription.plan.property_discount
                    final_price = base_price * (1 - discount / 100)
                else:
                    final_price = base_price
                
                # Apply promo code if provided
                promo_code = serializer.validated_data.get('promo_code')
                if promo_code:
                    try:
                        promo = PromoCode.objects.get(code=promo_code, is_active=True)
                        if promo.is_valid():
                            final_price = promo.apply_discount(final_price)
                    except PromoCode.DoesNotExist:
                        pass
                
                # Create promotion
                promotion = PropertyPromotion.objects.create(
                    user=request.user,
                    property=property_obj,
                    tier=tier,
                    amount_paid=int(final_price),
                    payment_method=payment_method,
                    duration_days=duration_days,
                    status='pending',
                    payment_status='pending'
                )
                
                return Response({
                    'success': True,
                    'message': 'Promotion ready for payment',
                    'promotion_id': str(promotion.id),
                    'amount': final_price,
                    'requires_payment': final_price > 0
                })
                
        except Property.DoesNotExist:
            return Response({'error': 'Property not found or not owned by user'}, status=404)
        except PropertyPromotionTier.DoesNotExist:
            return Response({'error': 'Promotion tier not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate promotion after payment"""
        promotion = self.get_object()
        
        if promotion.status != 'pending':
            return Response({'error': 'Promotion already activated or expired'}, status=400)
        
        promotion.activate()
        
        return Response({
            'success': True,
            'message': 'Promotion activated successfully',
            'promotion': self.get_serializer(promotion).data
        })

class UserDashboardView(APIView):
    """Simple dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        subscription = UserSubscription.objects.filter(
            user=request.user,
            status='active'
        ).first()
        
        active_promotions = PropertyPromotion.objects.filter(
            user=request.user,
            status='active'
        ).count()
        
        total_spent = sum(
            PropertyPromotion.objects.filter(
                user=request.user,
                status='active'
            ).values_list('amount_paid', flat=True)
        )
        
        return Response({
            'subscription': UserSubscriptionSerializer(subscription).data if subscription else None,
            'stats': {
                'active_promotions': active_promotions,
                'total_spent': total_spent,
                'subscription_discount': subscription.plan.property_discount if subscription else 0
            }
        })