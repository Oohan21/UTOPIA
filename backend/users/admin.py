# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import CustomUser, UserProfile, UserActivity

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'

@admin.register(CustomUser)
class UserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline]
    list_display = ('email', 'first_name', 'last_name', 'user_type', 
                   'is_verified', 'is_active', 'is_staff', 'created_at', 
                   'profile_completion_display')
    list_filter = ('user_type', 'is_verified', 'is_active', 'is_staff', 
                  'is_superuser', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    ordering = ('-created_at',)
    readonly_fields = ('last_login', 'created_at', 'updated_at', 
                      'verification_token', 'profile_completion_display')
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'phone_number', 
                                        'profile_picture', 'bio')}),
        (_('User Type & Status'), {'fields': ('user_type', 'is_premium', 'premium_expiry')}),
        (_('Verification'), {'fields': ('email_verified', 'phone_verified', 
                                       'is_verified', 'verification_token',
                                       'verification_sent_at')}),
        (_('Status'), {'fields': ('is_approved', 'is_active')}),
        (_('Permissions'), {'fields': ('is_staff', 'is_superuser', 'groups',
                                      'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'created_at', 'updated_at')}),
        (_('Security'), {'fields': ('last_login_ip', 'registration_ip')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'user_type'),
        }),
    )
    
    def get_inline_instances(self, request, obj=None):
        if not obj:
            return []
        return super().get_inline_instances(request, obj)
    
    def profile_completion_display(self, obj):
        percentage = obj.profile_completion_percentage
        color = 'green' if percentage >= 80 else 'orange' if percentage >= 50 else 'red'
        return format_html(
            '<div style="width: 100px; background-color: #eee; border-radius: 3px;">'
            '<div style="width: {}%; background-color: {}; color: white; '
            'text-align: center; border-radius: 3px; padding: 2px;">{}%</div>'
            '</div>',
            percentage, color, percentage
        )
    profile_completion_display.short_description = 'Profile Complete'

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'activity_type', 'ip_address', 'created_at')
    list_filter = ('activity_type', 'created_at')
    search_fields = ('user__email', 'ip_address', 'activity_type')
    readonly_fields = ('created_at', 'metadata', 'user_agent')
    date_hierarchy = None
    list_per_page = 50

    def created_at_display(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%Y-%m-%d %H:%M')
        return '-'
    created_at_display.short_description = 'Created At'
    
    fieldsets = (
        (None, {
            'fields': ('user', 'activity_type', 'ip_address')
        }),
        (_('Details'), {
            'fields': ('user_agent', 'metadata'),
            'classes': ('collapse',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at',)
        }),
    )