from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PropertyPromotionTierViewSet,
    PropertyPromotionViewSet,
    InitiatePromotionPaymentView,
    ChapaWebhookView,
    VerifyPaymentView,
    UserPromotionsDashboardView,
)

router = DefaultRouter()
router.register(r'promotion-tiers', PropertyPromotionTierViewSet, basename='promotion-tier')
router.register(r'property-promotions', PropertyPromotionViewSet, basename='property-promotion')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', UserPromotionsDashboardView.as_view(), name='promotions-dashboard'),
    path('payment/initiate/', InitiatePromotionPaymentView.as_view(), name='initiate-payment'),
    path('payment/webhook/', ChapaWebhookView.as_view(), name='chapa-webhook'),
    path('payment/verify/', VerifyPaymentView.as_view(), name='verify-payment'),
]