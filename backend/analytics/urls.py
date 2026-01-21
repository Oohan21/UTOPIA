# analytics/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'market-trends', views.MarketTrendViewSet, basename='market-trend')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', views.AnalyticsDashboardView.as_view(), name='analytics-dashboard'),
    path('market-overview/', views.MarketAnalyticsView.as_view(), name='market-overview'),
    path('price-analysis/', views.PriceAnalyticsView.as_view(), name='price-analysis'),
    path('demand-analysis/', views.DemandAnalyticsView.as_view(), name='demand-analysis'),
    path('platform/', views.PlatformMetricsView.as_view(), name='platform-metrics'),
    path('export/', views.AnalyticsExportView.as_view(), name='analytics-export'),
    path('users/<int:user_id>/', views.UserAnalyticsView.as_view(), name='user-analytics'),
    path('users/me/', views.UserAnalyticsView.as_view(), name='my-analytics'),
    path('admin/all-users/', views.AdminUserAnalyticsView.as_view(), name='admin-all-users-analytics'),
    
    # Add these new endpoints:
    path('user-growth/', views.UserGrowthView.as_view(), name='user-growth'),
    path('daily-activity/', views.DailyActivityView.as_view(), name='daily-activity'),
    path('platform-analytics/', views.PlatformAnalyticsView.as_view(), name='platform-analytics'),
]