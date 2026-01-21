# real_estate/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from .models import (
    City, SubCity, Amenity, Property, PropertyImage, 
    PropertyDocument, SavedSearch, TrackedProperty, Inquiry, 
    PropertyView, PropertyComparison, ComparisonSession, Message, MessageThread
)

@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_amharic', 'is_capital', 'is_active', 
                   'population', 'created_at')
    list_filter = ('is_active', 'is_capital', 'created_at')
    search_fields = ('name', 'name_amharic', 'description')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 50
    
    fieldsets = (
        (None, {
            'fields': ('name', 'name_amharic', 'slug', 'description')
        }),
        (_('Location'), {
            'fields': ('latitude', 'longitude', 'area_sqkm', 'population')
        }),
        (_('Status'), {
            'fields': ('is_capital', 'is_active')
        }),
        (_('Media'), {
            'fields': ('featured_image',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(SubCity)
class SubCityAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'zip_code', 'is_popular', 
                   'average_price_per_sqm', 'created_at')
    list_filter = ('city', 'is_popular', 'created_at')
    search_fields = ('name', 'name_amharic', 'zip_code', 'description')
    list_select_related = ('city',)
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 50
    
    fieldsets = (
        (None, {
            'fields': ('city', 'name', 'name_amharic', 'description')
        }),
        (_('Details'), {
            'fields': ('zip_code', 'population_density', 'average_price_per_sqm')
        }),
        (_('Status'), {
            'fields': ('is_popular',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_amharic', 'amenity_type', 'is_active')
    list_filter = ('amenity_type', 'is_active')
    search_fields = ('name', 'name_amharic', 'description')
    readonly_fields = ('created_at',)
    list_per_page = 50
    
    fieldsets = (
        (None, {
            'fields': ('name', 'name_amharic', 'amenity_type', 'icon')
        }),
        (_('Description'), {
            'fields': ('description',)
        }),
        (_('Status'), {
            'fields': ('is_active',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1
    readonly_fields = ('preview', 'uploaded_at')
    
    def preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 100px; '
                'border-radius: 5px; border: 1px solid #ddd;" />', 
                obj.image.url
            )
        return "-"
    preview.short_description = 'Preview'

class PropertyDocumentInline(admin.TabularInline):
    model = PropertyDocument
    extra = 1
    readonly_fields = ('uploaded_at',)

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'property_type', 'listing_type', 'city', 
                   'price_etb', 'is_verified', 'is_featured', 'is_active', 
                   'views_count', 'inquiry_count', 'save_count')
    list_filter = ('property_type', 'listing_type', 'property_status', 
                  'city', 'is_verified', 'is_featured', 'is_active', 
                  'is_premium')
    search_fields = ('title', 'title_amharic', 'description', 
                    'specific_location', 'property_id')
    readonly_fields = ('property_id', 'views_count', 'inquiry_count', 
                      'save_count', 'created_at', 'updated_at', 
                      'listed_date')
    inlines = [PropertyImageInline, PropertyDocumentInline]
    filter_horizontal = ('amenities',)
    list_per_page = 50
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('property_id', 'title', 'title_amharic', 'description', 
                      'description_amharic', 'property_type', 'listing_type', 
                      'property_status')
        }),
        (_('Ownership'), {
            'fields': ('owner', 'agent', 'developer')
        }),
        (_('Location'), {
            'fields': ('city', 'sub_city', 'specific_location', 'latitude', 
                      'longitude', 'address_line_1', 'address_line_2')
        }),
        (_('Specifications'), {
            'fields': ('bedrooms', 'bathrooms', 'total_area', 'plot_size', 
                      'built_year', 'floors', 'furnishing_type')
        }),
        (_('Pricing'), {
            'fields': ('price_etb', 'price_usd', 'price_negotiable', 
                      'monthly_rent', 'security_deposit', 'maintenance_fee', 
                      'property_tax')
        }),
        (_('Features'), {
            'fields': ('amenities', 'has_parking', 'has_garden', 'has_security',
                      'has_furniture', 'has_air_conditioning', 'has_heating',
                      'has_internet', 'has_generator', 'has_elevator',
                      'has_swimming_pool', 'has_gym', 'has_conference_room',
                      'is_pet_friendly', 'is_wheelchair_accessible', 
                      'has_backup_water')
        }),
        (_('Media & Documents'), {
            'fields': ('property_video', 'virtual_tour_url', 'video_url', 'has_title_deed',
                      'has_construction_permit', 'has_occupancy_certificate')
        }),
        (_('Status'), {
            'fields': ('is_featured', 'is_verified', 'is_active', 'is_premium',
                      'views_count', 'inquiry_count', 'save_count')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at', 'listed_date', 'expiry_date'),
            'classes': ('collapse',)
        }),
    )
    
    def price_per_sqm_display(self, obj):
        return f"{obj.price_per_sqm:,.2f} ETB/m²" if hasattr(obj, 'price_per_sqm') else "N/A"
    price_per_sqm_display.short_description = 'Price per SQM'
    
    def days_on_market_display(self, obj):
        days = obj.days_on_market if hasattr(obj, 'days_on_market') else 0
        if days < 30:
            color = 'green'
        elif days < 90:
            color = 'orange'
        else:
            color = 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} days</span>',
            color, days
        )
    days_on_market_display.short_description = 'Days on Market'

@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = ('id_short', 'property_title', 'user_display', 'inquiry_type', 
                    'status_badge', 'priority_badge', 'created_at', 'assigned_to_display')
    list_filter = ('status', 'priority', 'inquiry_type', 'category', 'source', 
                   'assigned_to', 'created_at', 'response_sent')
    search_fields = ('id', 'property__title', 'user__email', 'user__first_name', 
                     'user__last_name', 'full_name', 'email', 'phone', 'message')
    readonly_fields = ('id', 'created_at', 'updated_at', 'responded_at', 
                       'ip_address', 'user_agent', 'session_id')
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'property', 'user', 'inquiry_type', 'message', 
                       'contact_preference', 'full_name', 'email', 'phone')
        }),
        ('Status & Management', {
            'fields': ('status', 'priority', 'assigned_to', 'response_sent', 
                       'response_notes', 'responded_at', 'response_by')
        }),
        ('Additional Information', {
            'fields': ('scheduled_viewing', 'viewing_address', 'tags', 
                       'internal_notes', 'follow_up_date', 'category', 'source')
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent', 'session_id', 
                       'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def id_short(self, obj):
        return str(obj.id)[:8]
    id_short.short_description = 'ID'
    
    def property_title(self, obj):
        return obj.property.title[:50]
    property_title.short_description = 'Property'
    
    def user_display(self, obj):
        if obj.user:
            return f"{obj.user.email} ({obj.user.first_name} {obj.user.last_name})"
        return f"{obj.full_name} ({obj.email})"
    user_display.short_description = 'User'
    
    def assigned_to_display(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.email
        return "Unassigned"
    assigned_to_display.short_description = 'Assigned To'
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'contacted': 'blue',
            'viewing_scheduled': 'green',
            'follow_up': 'yellow',
            'closed': 'gray',
            'spam': 'red',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'
    
    def priority_badge(self, obj):
        colors = {
            'low': 'green',
            'medium': 'blue',
            'high': 'orange',
            'urgent': 'red',
        }
        color = colors.get(obj.priority, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">{}</span>',
            color, obj.get_priority_display()
        )
    priority_badge.short_description = 'Priority'
    priority_badge.admin_order_field = 'priority'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Optimize queries
        return qs.select_related('property', 'user', 'assigned_to', 'response_by')
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # Limit assignment to admin users only
        form.base_fields['assigned_to'].queryset = form.base_fields['assigned_to'].queryset.filter(
            user_type='admin', is_active=True
        )
        form.base_fields['response_by'].queryset = form.base_fields['response_by'].queryset.filter(
            is_active=True
        )
        return form

@admin.register(PropertyComparison)
class PropertyComparisonAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'property_count')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'name')
    filter_horizontal = ('properties',)
    readonly_fields = ('created_at', 'updated_at')
    
    def property_count(self, obj):
        return obj.properties.count()
    property_count.short_description = 'Properties'
    
    fieldsets = (
        (None, {
            'fields': ('user', 'name')
        }),
        (_('Properties'), {
            'fields': ('properties',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(ComparisonSession)
class ComparisonSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'property_count', 'created_at', 'last_accessed')
    list_filter = ('created_at',)
    search_fields = ('session_id',)
    
    def property_count(self, obj):
        return obj.properties.count()
    property_count.short_description = 'Properties'

@admin.register(SavedSearch)
class SavedSearchAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'is_active', 'email_alerts', 
                   'alert_frequency', 'match_count')
    list_filter = ('is_active', 'email_alerts', 'alert_frequency')
    search_fields = ('user__email', 'name')
    readonly_fields = ('created_at', 'updated_at', 'last_notified', 'match_count')
    
    fieldsets = (
        (None, {
            'fields': ('user', 'name', 'filters')
        }),
        (_('Alerts'), {
            'fields': ('is_active', 'email_alerts', 'alert_frequency', 
                      'last_notified', 'match_count')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(TrackedProperty)
class TrackedPropertyAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'tracking_type', 'notification_enabled')
    list_filter = ('tracking_type', 'notification_enabled')
    search_fields = ('user__email', 'property__title', 'notes')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        (None, {
            'fields': ('user', 'property', 'tracking_type')
        }),
        (_('Tracking Details'), {
            'fields': ('notes', 'notification_enabled', 'price_change_threshold')
        }),
        (_('Timestamps'), {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

@admin.register(PropertyView)
class PropertyViewAdmin(admin.ModelAdmin):
    list_display = ('property', 'user', 'ip_address', 'viewed_at')
    list_filter = ('viewed_at',)
    search_fields = ('property__title', 'user__email', 'ip_address', 'session_id')
    readonly_fields = ('viewed_at', 'user_agent')
    
    fieldsets = (
        (None, {
            'fields': ('property', 'user', 'ip_address')
        }),
        (_('Session Details'), {
            'fields': ('session_id', 'user_agent'),
            'classes': ('collapse',)
        }),
        (_('Timestamps'), {
            'fields': ('viewed_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'property', 'message_type', 
                   'is_read', 'created_at')
    list_filter = ('message_type', 'is_read', 'created_at')
    search_fields = ('sender__email', 'receiver__email', 
                    'property__title', 'content')
    readonly_fields = ('created_at', 'read_at')
    list_select_related = ('sender', 'receiver', 'property')
    
    fieldsets = (
        (None, {
            'fields': ('sender', 'receiver', 'property', 'inquiry')
        }),
        (_('Content'), {
            'fields': ('message_type', 'subject', 'content', 'attachment')
        }),
        (_('Status'), {
            'fields': ('is_read', 'read_at')
        }),
        (_('Timestamps'), {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

@admin.register(MessageThread)
class MessageThreadAdmin(admin.ModelAdmin):
    list_display = ('subject', 'property', 'participant_count', 
                   'last_message', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('subject', 'property__title')
    filter_horizontal = ('participants',)
    readonly_fields = ('created_at', 'updated_at')
    
    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = 'Participants'
