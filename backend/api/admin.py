# api/admin.py (FIXED VERSION)
from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from .models import MarketStats, PropertyValuation, Notification, AuditLog

@admin.register(MarketStats)
class MarketStatsAdmin(admin.ModelAdmin):
    list_display = ('location_display', 'property_type', 'year', 'quarter', 
                   'month', 'average_price', 'total_listings', 'data_source', 
                   'is_estimated')
    list_filter = ('year', 'quarter', 'property_type', 'data_source', 
                  'is_estimated')
    search_fields = ('city__name', 'sub_city__name', 'property_type')
    readonly_fields = ()  # Only include fields that exist in the model
    list_per_page = 50
    
    def location_display(self, obj):
        if obj.city and obj.sub_city:
            return f"{obj.city.name} - {obj.sub_city.name}"
        elif obj.city:
            return obj.city.name
        elif obj.sub_city:
            return obj.sub_city.name
        return "National"
    location_display.short_description = 'Location'
    
    def get_readonly_fields(self, request, obj=None):
        # Dynamically determine readonly fields
        readonly = []
        if obj:  # Editing an existing object
            if hasattr(obj, 'created_at'):
                readonly.append('created_at')
            if hasattr(obj, 'updated_at'):
                readonly.append('updated_at')
        return readonly
    
    fieldsets = (
        (_('Location & Type'), {
            'fields': ('city', 'sub_city', 'property_type')
        }),
        (_('Time Period'), {
            'fields': ('year', 'quarter', 'month')
        }),
        (_('Price Statistics'), {
            'fields': ('average_price', 'median_price', 'min_price', 
                      'max_price', 'price_per_sqm')
        }),
        (_('Market Activity'), {
            'fields': ('total_listings', 'new_listings', 'sold_listings', 
                      'rented_listings', 'average_days_on_market')
        }),
        (_('Price Changes'), {
            'fields': ('price_change_qoq', 'price_change_yoy')
        }),
        (_('Inventory'), {
            'fields': ('inventory_months',)
        }),
        (_('Data Source'), {
            'fields': ('data_source', 'is_estimated')
        }),
    )

@admin.register(PropertyValuation)
class PropertyValuationAdmin(admin.ModelAdmin):
    list_display = ('property_display', 'city', 'sub_city', 'property_type', 
                   'estimated_value_mid', 'confidence_level', 'comparables_count', 
                   'valuation_date')
    list_filter = ('confidence_level', 'property_type', 'valuation_date')
    search_fields = ('property__title', 'user__email', 'city__name', 
                    'sub_city__name')
    readonly_fields = ()  # Empty initially
    list_per_page = 50
    
    def property_display(self, obj):
        if obj.property:
            return obj.property.title
        return "Manual Valuation"
    property_display.short_description = 'Property'
    
    def get_readonly_fields(self, request, obj=None):
        # Dynamically determine readonly fields
        readonly = []
        if obj:  # Editing an existing object
            # Only add fields that exist on the model
            if hasattr(obj, 'valuation_date'):
                readonly.append('valuation_date')
            if hasattr(obj, 'created_at'):
                readonly.append('created_at')
            if hasattr(obj, 'updated_at'):
                readonly.append('updated_at')
        return readonly
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('property', 'user', 'valuation_date')
        }),
        (_('Location & Type'), {
            'fields': ('city', 'sub_city', 'property_type')
        }),
        (_('Input Parameters'), {
            'fields': ('bedrooms', 'total_area', 'built_year')
        }),
        (_('Valuation Results'), {
            'fields': ('estimated_value_low', 'estimated_value_mid', 
                      'estimated_value_high', 'confidence_level', 
                      'price_per_sqm')
        }),
        (_('Comparable Properties'), {
            'fields': ('comparables_count', 'comparables_ids')
        }),
        (_('Market Context'), {
            'fields': ('market_trend', 'trend_strength', 'notes')
        }),
    )

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'title', 'is_read', 
                   'is_sent', 'sent_via')
    list_filter = ('notification_type', 'is_read', 'is_sent', 'sent_via')
    search_fields = ('user__email', 'title', 'message', 'content_type__model')
    readonly_fields = ()  # Empty initially
    list_per_page = 50
    
    def get_readonly_fields(self, request, obj=None):
        # Dynamically determine readonly fields
        readonly = []
        if obj:  # Editing an existing object
            if hasattr(obj, 'created_at'):
                readonly.append('created_at')
            if hasattr(obj, 'read_at'):
                readonly.append('read_at')
            if hasattr(obj, 'sent_at'):
                readonly.append('sent_at')
        return readonly
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('user', 'notification_type', 'title', 'message')
        }),
        (_('Related Object'), {
            'fields': ('content_type', 'object_id', 'data')
        }),
        (_('Delivery Status'), {
            'fields': ('is_read', 'is_sent', 'sent_via', 'read_at', 'sent_at')
        }),
        (_('Timestamps'), {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user_display', 'action_type', 'model_name', 'object_id', 
                   'ip_address')
    list_filter = ('action_type', 'model_name')
    search_fields = ('user__email', 'model_name', 'object_id', 'object_repr', 
                    'ip_address')
    readonly_fields = ()  # Empty initially
    list_per_page = 50
    
    def user_display(self, obj):
        if obj.user:
            return obj.user.email
        return "System"
    user_display.short_description = 'User'
    
    def get_readonly_fields(self, request, obj=None):
        # Dynamically determine readonly fields
        readonly = []
        if obj:  # Editing an existing object
            if hasattr(obj, 'created_at'):
                readonly.append('created_at')
            if hasattr(obj, 'changes'):
                readonly.append('changes')
            if hasattr(obj, 'user_agent'):
                readonly.append('user_agent')
        return readonly
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('user', 'action_type', 'model_name')
        }),
        (_('Object Details'), {
            'fields': ('object_id', 'object_repr', 'changes')
        }),
        (_('Request Details'), {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    actions = ['send_digest']

    def send_digest(self, request, queryset):
        """Admin action to trigger digest send for selected notifications' users"""
        from django.core.management import call_command
        users = set(n.user for n in queryset if n.user)
        for u in users:
            # We call management command which will collect all deferred notifs per user
            call_command('send_notification_digest')
        self.message_user(request, f"Triggered digest send for {len(users)} users")
    send_digest.short_description = 'Send digest for selected notifications'