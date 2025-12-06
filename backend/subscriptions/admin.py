# subscriptions/admin.py - COMPLETE FIXED VERSION
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    SubscriptionPlan, UserSubscription,
    PropertyPromotionTier, PropertyPromotion, PromoCode
)

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'plan_type', 'monthly_price', 'yearly_price', 
                   'property_discount', 'max_properties', 'is_active', 'is_popular')
    list_filter = ('plan_type', 'is_active', 'is_popular')
    search_fields = ('name', 'description')
    list_editable = ('is_active', 'is_popular', 'property_discount')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'plan_type', 'description', 'is_active', 'is_popular')
        }),
        ('Pricing', {
            'fields': ('monthly_price', 'yearly_price')
        }),
        ('Benefits', {
            'fields': ('property_discount', 'max_properties', 
                      'priority_support', 'analytics_access')
        }),
    )

@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'status', 'start_date', 'end_date',
                   'is_active_display', 'days_remaining_display', 'auto_renew')
    list_filter = ('status', 'plan', 'auto_renew', 'start_date')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Subscription Details', {
            'fields': ('user', 'plan', 'status', 'start_date', 'end_date', 'auto_renew')
        }),
        ('Payment', {
            'fields': ('amount_paid', 'payment_reference')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
    
    def is_active_display(self, obj):
        if obj.is_active():
            return format_html('<span style="color: green;">● Active</span>')
        return format_html('<span style="color: red;">● Inactive</span>')
    is_active_display.short_description = 'Active Status'
    
    def days_remaining_display(self, obj):
        days = obj.days_remaining()
        if days > 30:
            return format_html(f'<span style="color: green;">{days} days</span>')
        elif days > 7:
            return format_html(f'<span style="color: orange;">{days} days</span>')
        else:
            return format_html(f'<span style="color: red;">{days} days</span>')
    days_remaining_display.short_description = 'Days Remaining'

@admin.register(PropertyPromotionTier)
class PropertyPromotionTierAdmin(admin.ModelAdmin):
    list_display = ('name', 'tier_type', 'price_30', 'price_90', 
                   'search_position', 'is_active', 'display_order')
    list_filter = ('tier_type', 'is_active')
    search_fields = ('name', 'description')
    list_editable = ('is_active', 'display_order', 'price_30', 'price_90')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'tier_type', 'description', 'is_active', 'display_order')
        }),
        ('Pricing', {
            'fields': ('price_7', 'price_30', 'price_90')
        }),
        ('Features & Display', {
            'fields': ('features', 'search_position', 'badge_color')
        }),
    )

@admin.register(PropertyPromotion)
class PropertyPromotionAdmin(admin.ModelAdmin):
    list_display = ('property', 'user', 'tier', 'amount_paid', 'duration_days',
                   'status_display', 'is_active_display', 'created_at')
    list_filter = ('status', 'tier', 'payment_method')
    search_fields = ('property__title', 'user__email', 'payment_reference')
    readonly_fields = ('id', 'created_at')
    
    fieldsets = (
        ('Promotion Details', {
            'fields': ('property', 'user', 'tier', 'duration_days')
        }),
        ('Payment', {
            'fields': ('amount_paid', 'payment_method', 'payment_reference', 'payment_status')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Timestamps', {
            'fields': ('id', 'created_at')
        }),
    )
    
    def status_display(self, obj):
        status_colors = {
            'pending': 'orange',
            'active': 'green',
            'expired': 'gray',
            'failed': 'red'
        }
        color = status_colors.get(obj.status, 'black')
        return format_html(f'<span style="color: {color};">{obj.get_status_display()}</span>')
    status_display.short_description = 'Status'
    
    def is_active_display(self, obj):
        if obj.is_active():
            return format_html('<span style="color: green;">● Active</span>')
        return format_html('<span style="color: red;">● Inactive</span>')
    is_active_display.short_description = 'Active Now'

@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percent', 'times_used', 'max_uses',
                   'valid_until', 'is_active')
    list_filter = ('is_active', 'valid_until')
    search_fields = ('code',)
    list_editable = ('is_active', 'max_uses', 'discount_percent')
    
    fieldsets = (
        ('Code Details', {
            'fields': ('code', 'discount_percent', 'is_active')
        }),
        ('Usage Limits', {
            'fields': ('max_uses', 'times_used', 'valid_until')
        }),
    )