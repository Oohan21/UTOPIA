# subscriptions/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SubscriptionPlanViewSet, UserSubscriptionViewSet,
    PropertyPromotionTierViewSet, PropertyPromotionViewSet,
    UserDashboardView
)

router = DefaultRouter()
router.register(r'subscription-plans', SubscriptionPlanViewSet, basename='subscription-plan')
router.register(r'user-subscriptions', UserSubscriptionViewSet, basename='user-subscription')
router.register(r'promotion-tiers', PropertyPromotionTierViewSet, basename='promotion-tier')
router.register(r'property-promotions', PropertyPromotionViewSet, basename='property-promotion')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', UserDashboardView.as_view(), name='subscription-dashboard'),
]