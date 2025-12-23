from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r"users", views.UserViewSet, basename="user")
router.register(r"cities", views.CityViewSet)
router.register(r"sub-cities", views.SubCityViewSet)
router.register(r"properties", views.PropertyViewSet)
router.register(r"saved-searches", views.SavedSearchViewSet, basename="savedsearch")
router.register(
    r"tracked-properties", views.TrackedPropertyViewSet, basename="trackedproperty"
)
router.register(r"inquiries", views.InquiryViewSet, basename="inquiry")
router.register(r"comparisons", views.ComparisonViewSet, basename="comparison")
# Add admin endpoints
router.register(r"admin/users", views.AdminUserViewSet, basename="admin-user")
router.register(
    r"admin/properties", views.AdminPropertyViewSet, basename="admin-property"
)
router.register(r"admin/inquiries", views.AdminInquiryViewSet, basename="admin-inquiry")
router.register(r'messages', views.MessageViewSet, basename='message')
router.register(r'message-threads', views.MessageThreadViewSet, basename='message-thread')
router.register(r"notifications", views.NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
    # Authentication
    path(
        "auth/token/",
        views.CustomTokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    # Market & Analytics
    path("market-stats/", views.MarketStatsView.as_view(), name="market-stats"),
    path(
        "property-valuation/",
        views.PropertyValuationView.as_view(),
        name="property-valuation",
    ),
    # Dashboard
    path(
        "admin/dashboard/", views.AdminDashboardView.as_view(), name="admin-dashboard"
    ),
    # Comparison
    path(
        "properties/compare/",
        views.ComparisonViewSet.as_view({"post": "compare_properties"}),
        name="compare-properties",
    ),
    path(
        "properties/save-comparison/",
        views.ComparisonViewSet.as_view({"post": "save_comparison"}),
        name="save-comparison",
    ),
    path(
        "comparison/dashboard/",
        views.ComparisonDashboardView.as_view(),
        name="comparison-dashboard",
    ),
    # Admin specific
    path("admin/audit-logs/", views.AuditLogListView.as_view(), name="audit-logs"),
    path("admin/reports/", views.ReportView.as_view(), name="reports"),
    path("admin/analytics/", views.AnalyticsView.as_view(), name="analytics"),
    path(
        "admin/platform-metrics/",
        views.PlatformMetricsView.as_view(),
        name="platform-metrics",
    ),
    path(
        "admin/revenue-report/",
        views.RevenueReportView.as_view(),
        name="revenue-report",
    ),
    path(
        "admin/export/<str:data_type>/",
        views.ExportDataView.as_view(),
        name="export-data",
    ),
    path("admin/settings/", views.AdminSettingsView.as_view(), name="admin-settings"),
    path(
        "admin/listings/pending/",
        views.AdminPropertyApprovalView.as_view(),
        name="pending-properties",
    ),
    path(
        "admin/listings/approve/",
        views.AdminPropertyApprovalView.as_view(),
        name="approve-property",
    ),
    # Message analytics
    path('message/analytics/', views.MessageAnalyticsView.as_view(), name='message-analytics'),
    
    # Bulk message operations
    path('message/bulk/', views.BulkMessageView.as_view(), name='bulk-messages'),
    
    # Message threads additional endpoints
    path('message-threads/<int:pk>/messages/', 
         views.MessageThreadViewSet.as_view({'get': 'messages'}), 
         name='thread-messages'),
    path('message-threads/<int:pk>/send_message/', 
         views.MessageThreadViewSet.as_view({'post': 'send_message'}), 
         name='thread-send-message'),
    path('message-threads/<int:pk>/mark_all_read/', 
         views.MessageThreadViewSet.as_view({'post': 'mark_all_read'}), 
         name='thread-mark-all-read'),
    path('message-threads/<int:pk>/archive/', 
         views.MessageThreadViewSet.as_view({'post': 'archive'}), 
         name='thread-archive'),
    path('message-threads/<int:pk>/unarchive/', 
         views.MessageThreadViewSet.as_view({'post': 'unarchive'}), 
          name='thread-unarchive'),
    
    # Messages additional endpoints
    path('messages/<int:pk>/mark_as_read/', 
         views.MessageViewSet.as_view({'post': 'mark_as_read'}), 
         name='message-mark-read'),
    path('messages/unread_count/', 
         views.MessageViewSet.as_view({'get': 'unread_count'}), 
         name='message-unread-count'),
    # Health check
    path("health/", views.HealthCheckView.as_view(), name="health-check"),
]
