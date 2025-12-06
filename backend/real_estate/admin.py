# real_estate/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from .models import (
    City, SubCity, Amenity, Property, PropertyImage, 
    PropertyDocument, SavedSearch, TrackedProperty, Inquiry, 
    PropertyView, PropertyComparison, ComparisonSession
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
    list_display = ('property', 'user', 'inquiry_type', 'status', 'priority', 
                   'response_sent')
    list_filter = ('inquiry_type', 'status', 'priority', 'response_sent')
    search_fields = ('property__title', 'user__email', 'full_name', 
                    'email', 'phone', 'message')
    readonly_fields = ('created_at', 'updated_at', 'responded_at')
    list_select_related = ('property', 'user', 'assigned_to')
    list_per_page = 50
    
    fieldsets = (
        (_('Basic Information'), {
            'fields': ('property', 'user', 'inquiry_type', 'message')
        }),
        (_('Contact Information'), {
            'fields': ('full_name', 'email', 'phone', 'contact_preference')
        }),
        (_('Status & Assignment'), {
            'fields': ('status', 'priority', 'assigned_to')
        }),
        (_('Response'), {
            'fields': ('response_sent', 'response_notes', 'responded_at')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

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