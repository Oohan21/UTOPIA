from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'cities', views.CityViewSet)
router.register(r'sub-cities', views.SubCityViewSet)
router.register(r'properties', views.PropertyViewSet)
router.register(r'saved-searches', views.SavedSearchViewSet, basename='savedsearch')
router.register(r'tracked-properties', views.TrackedPropertyViewSet, basename='trackedproperty')
router.register(r'inquiries', views.InquiryViewSet, basename='inquiry')
router.register(r'comparisons', views.ComparisonViewSet, basename='comparison')
# Add admin endpoints
router.register(r'admin/users', views.AdminUserViewSet, basename='admin-user')
router.register(r'admin/properties', views.AdminPropertyViewSet, basename='admin-property')
router.register(r'admin/inquiries', views.AdminInquiryViewSet, basename='admin-inquiry')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    
    # Authentication
    path('auth/token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    
    # Market & Analytics
    path('market-stats/', views.MarketStatsView.as_view(), name='market-stats'),
    path('property-valuation/', views.PropertyValuationView.as_view(), name='property-valuation'),
    
    # Dashboard
    path('dashboard/admin/', views.AdminDashboardView.as_view(), name='admin-dashboard'),

    # Comparison
    path('properties/compare/', views.ComparisonViewSet.as_view({'post': 'compare_properties'}), name='compare-properties'),
    path('properties/save-comparison/', views.ComparisonViewSet.as_view({'post': 'save_comparison'}), name='save-comparison'),
    path('my-comparisons/', views.ComparisonViewSet.as_view({'get': 'my_comparisons'}), name='my-comparisons'),
    path('comparisons/similar/', views.ComparisonViewSet.as_view({'post': 'compare_similar'}), name='compare-similar'),
    
    # Admin specific
    path('admin/audit-logs/', views.AuditLogListView.as_view(), name='audit-logs'),
    path('admin/reports/', views.ReportView.as_view(), name='reports'),
    path('admin/settings/', views.AdminSettingsView.as_view(), name='admin-settings'),
    
    # Health check
    path('health/', views.HealthCheckView.as_view(), name='health-check'),
]