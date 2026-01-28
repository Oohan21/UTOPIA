from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.utils import timezone
import uuid
import json

User = get_user_model()


class MarketStats(models.Model):
    city = models.ForeignKey(
        "real_estate.City", on_delete=models.CASCADE, null=True, blank=True
    )
    sub_city = models.ForeignKey(
        "real_estate.SubCity", on_delete=models.CASCADE, null=True, blank=True
    )
    property_type = models.CharField(max_length=20, blank=True)

    # Time period
    year = models.IntegerField()
    quarter = models.IntegerField()
    month = models.IntegerField(null=True, blank=True)

    # Statistics
    average_price = models.DecimalField(max_digits=15, decimal_places=2)
    median_price = models.DecimalField(max_digits=15, decimal_places=2)
    min_price = models.DecimalField(max_digits=15, decimal_places=2)
    max_price = models.DecimalField(max_digits=15, decimal_places=2)
    price_per_sqm = models.DecimalField(max_digits=15, decimal_places=2)

    # Market activity
    total_listings = models.IntegerField()
    new_listings = models.IntegerField()
    sold_listings = models.IntegerField()
    rented_listings = models.IntegerField()
    average_days_on_market = models.IntegerField()

    # Price changes
    price_change_qoq = models.DecimalField(
        max_digits=5, decimal_places=2
    )  # Quarter over quarter
    price_change_yoy = models.DecimalField(
        max_digits=5, decimal_places=2
    )  # Year over year

    # Inventory
    inventory_months = models.DecimalField(
        max_digits=5, decimal_places=2
    )  # Months of inventory

    # Data source
    data_source = models.CharField(max_length=100, default="UTOPIA")
    is_estimated = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("market statistics")
        verbose_name_plural = _("market statistics")
        unique_together = [
            "city",
            "sub_city",
            "property_type",
            "year",
            "quarter",
            "month",
        ]
        ordering = ["-year", "-quarter", "-month"]

    def __str__(self):
        location = f"{self.city.name if self.city else 'All'} - {self.sub_city.name if self.sub_city else 'All'}"
        return f"Market Stats: {location} - Q{self.quarter} {self.year}"


class PropertyValuation(models.Model):
    CONFIDENCE_LEVELS = (
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    )

    property = models.ForeignKey(
        "real_estate.Property",
        on_delete=models.CASCADE,
        related_name="valuations",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    # Input parameters
    city = models.ForeignKey(
        "real_estate.City", on_delete=models.CASCADE, null=True, blank=True
    )
    sub_city = models.ForeignKey(
        "real_estate.SubCity", on_delete=models.CASCADE, null=True, blank=True
    )
    property_type = models.CharField(max_length=20)
    bedrooms = models.IntegerField()
    total_area = models.DecimalField(max_digits=10, decimal_places=2)
    built_year = models.IntegerField(null=True, blank=True)

    # Valuation results
    estimated_value_low = models.DecimalField(max_digits=15, decimal_places=2)
    estimated_value_mid = models.DecimalField(max_digits=15, decimal_places=2)
    estimated_value_high = models.DecimalField(max_digits=15, decimal_places=2)
    confidence_level = models.CharField(max_length=20, choices=CONFIDENCE_LEVELS)
    price_per_sqm = models.DecimalField(max_digits=15, decimal_places=2)

    # Comparable properties
    comparables_count = models.IntegerField()
    comparables_ids = models.JSONField(default=list)  # List of comparable property IDs

    # Market context
    market_trend = models.CharField(
        max_length=50, blank=True
    )  # rising, falling, stable
    trend_strength = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    notes = models.TextField(blank=True)
    valuation_date = models.DateField(default=timezone.now)

    class Meta:
        verbose_name = _("property valuation")
        verbose_name_plural = _("property valuations")
        ordering = ["-valuation_date"]

    def __str__(self):
        return f"Valuation: {self.property_type} - {self.estimated_value_mid} ETB"


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('property_match', 'Property Match'),
        ('price_change', 'Price Change'),
        ('new_listing', 'New Listing'),
        ('inquiry_response', 'Inquiry Response'),
        ('system', 'System Notification'),
        ('promotional', 'Promotional'),
        ('property_approved', 'Property Approved'),
        ('property_rejected', 'Property Rejected'),
        ('property_changes_requested', 'Property Changes Requested'),
        ('viewing_scheduled', 'Viewing Scheduled'),
        ('inquiry_status_changed', 'Inquiry Status Changed'),
        ('inquiry_assigned', 'Inquiry Assigned'),
        ('message_received', 'Message Received'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict)  # Additional data
    
    # Link to related object
    content_type = models.CharField(max_length=50, blank=True)  # e.g., 'property', 'inquiry', 'message'
    object_id = models.CharField(max_length=100, null=True, blank=True)  
    
    # Status
    is_read = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    sent_via = models.CharField(max_length=20, choices=[
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push'),
        ('in_app', 'In-App'),
    ], default='in_app')
    
    created_at = models.DateTimeField(default=timezone.now)
    read_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = _('notification')
        verbose_name_plural = _('notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
            models.Index(fields=['content_type', 'object_id']),
        ]
    
    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"

class NotificationPreference(models.Model):
    """User notification preferences"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Email notifications
    email_enabled = models.BooleanField(default=True)
    email_property_approved = models.BooleanField(default=True)
    email_property_rejected = models.BooleanField(default=True)
    email_property_changes = models.BooleanField(default=True)
    email_inquiry_response = models.BooleanField(default=True)
    email_messages = models.BooleanField(default=True)
    email_promotions = models.BooleanField(default=False)
    email_system = models.BooleanField(default=True)
    
    # Push notifications
    push_enabled = models.BooleanField(default=True)
    push_property_approved = models.BooleanField(default=True)
    push_property_rejected = models.BooleanField(default=True)
    push_property_changes = models.BooleanField(default=True)
    push_inquiry_response = models.BooleanField(default=True)
    push_messages = models.BooleanField(default=True)
    push_promotions = models.BooleanField(default=False)
    
    # SMS notifications
    sms_enabled = models.BooleanField(default=False)
    sms_urgent = models.BooleanField(default=True)
    
    # Frequency
    notification_frequency = models.CharField(max_length=20, choices=[
        ('immediate', 'Immediate'),
        ('daily', 'Daily Digest'),
        ('weekly', 'Weekly Digest'),
    ], default='immediate')
    
    # Quiet hours
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('notification preference')
        verbose_name_plural = _('notification preferences')
    
    def __str__(self):
        return f"Notification preferences for {self.user.email}"

class AuditLog(models.Model):
    ACTION_TYPES = (
        ("create", "Create"),
        ("update", "Update"),
        ("delete", "Delete"),
        ("view", "View"),
        ("login", "Login"),
        ("logout", "Logout"),
        ("export", "Export"),
        ("register", "Register"),
        ("password_change", "Password Change"),
        ("password_reset", "Password Reset"),
        ("profile_update", "Profile Update"),
        ("email_verification", "Email Verification"),
        ("phone_verification", "Phone Verification"),
        ("promotion_purchase", "Promotion Purchase"),
        ("property_save", "Property Save"),
        ("property_unsave", "Property Unsave"),
        ("search", "Search"),
        ("inquiry_create", "Inquiry Create"),
        ("message_send", "Message Send"),
        ("notification_send", "Notification Send"),
        ("role_change", "Role Change"),
        ("status_change", "Status Change"),
        ("bulk_action", "Bulk Action"),
    )

    MODEL_TYPES = (
        ("User", "User"),
        ("Property", "Property"),
        ("Inquiry", "Inquiry"),
        ("City", "City"),
        ("SubCity", "Sub City"),
        ("Amenity", "Amenity"),
        ("Notification", "Notification"),
        ("MarketStats", "Market Stats"),
        ("PropertyValuation", "Property Valuation"),
        ("Message", "Message"),
        ("Payment", "Payment"),
        ("PropertyPromotion", "Property Promotion"),
        ("SavedSearch", "Saved Search"),
        ("TrackedProperty", "Tracked Property"),
        ("Comparison", "Comparison"),
        ("System", "System"),
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    model_name = models.CharField(max_length=100, choices=MODEL_TYPES)
    object_id = models.CharField(max_length=100, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)

    # Changes
    changes = models.JSONField(default=dict)  # Track field changes
    old_values = models.JSONField(default=dict, blank=True)  # Old values before change
    new_values = models.JSONField(default=dict, blank=True)  # New values after change
    
    # Request/Client info
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_path = models.CharField(max_length=500, blank=True)
    request_method = models.CharField(max_length=10, blank=True)
    
    # Additional metadata
    session_id = models.CharField(max_length=100, blank=True)
    browser = models.CharField(max_length=100, blank=True)
    os = models.CharField(max_length=100, blank=True)
    device = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = _("audit log")
        verbose_name_plural = _("audit logs")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "action_type"]),
            models.Index(fields=["model_name", "object_id"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["action_type"]),
            models.Index(fields=["ip_address"]),
        ]

    def __str__(self):
        return f"{self.get_action_type_display()} {self.model_name} by {self.user.email if self.user else 'System'}"

    @classmethod
    def log_action(cls, user, action_type, model_name, object_id="", object_repr="", 
                   changes=None, old_values=None, new_values=None, request=None):
        """Helper method to create audit logs"""
        if changes is None:
            changes = {}
        if old_values is None:
            old_values = {}
        if new_values is None:
            new_values = {}
        
        log = cls(
            user=user,
            action_type=action_type,
            model_name=model_name,
            object_id=str(object_id),
            object_repr=str(object_repr)[:200],
            changes=changes,
            old_values=old_values,
            new_values=new_values,
        )
        
        # Add request info if available
        if request:
            log.ip_address = cls.get_client_ip(request)
            log.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
            log.request_path = request.path[:500]
            log.request_method = request.method
            if hasattr(request, 'session') and request.session.session_key:
                log.session_id = request.session.session_key
            
            # Parse user agent for browser/OS info
            log.browser = cls.parse_user_agent(log.user_agent, 'browser')[:100]
            log.os = cls.parse_user_agent(log.user_agent, 'os')[:100]
            log.device = cls.parse_user_agent(log.user_agent, 'device')[:100]
        
        log.save()
        return log
    
    @staticmethod
    def get_client_ip(request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
    
    @staticmethod
    def parse_user_agent(user_agent, info_type='browser'):
        """Simple user agent parser"""
        user_agent = (user_agent or '').lower()
        
        if info_type == 'browser':
            if 'chrome' in user_agent:
                return 'Chrome'
            elif 'firefox' in user_agent:
                return 'Firefox'
            elif 'safari' in user_agent and 'chrome' not in user_agent:
                return 'Safari'
            elif 'edge' in user_agent:
                return 'Edge'
            elif 'opera' in user_agent:
                return 'Opera'
            return 'Unknown'
        
        elif info_type == 'os':
            if 'windows' in user_agent:
                return 'Windows'
            elif 'mac' in user_agent:
                return 'macOS'
            elif 'linux' in user_agent:
                return 'Linux'
            elif 'android' in user_agent:
                return 'Android'
            elif 'iphone' in user_agent or 'ipad' in user_agent:
                return 'iOS'
            return 'Unknown'
        
        elif info_type == 'device':
            if 'mobile' in user_agent:
                return 'Mobile'
            elif 'tablet' in user_agent:
                return 'Tablet'
            return 'Desktop'
        
        return 'Unknown'


# Signal receivers for comprehensive audit logging
@receiver(post_save, sender=User)
def log_user_activity(sender, instance, created, **kwargs):
    """Log user creation and updates"""
    from django.db.models import Model
    from django.http import HttpRequest
    
    # Get the current request if available
    request = None
    try:
        from django.contrib.auth import get_user
        from django.utils.functional import SimpleLazyObject
        user = get_user(instance._state.db)
        if isinstance(user, SimpleLazyObject):
            user = user._wrapped
        if hasattr(user, '_request'):
            request = user._request
    except:
        pass
    
    if created:
        action = 'register'
        changes = {
            'email': instance.email,
            'user_type': instance.user_type,
            'first_name': instance.first_name,
            'last_name': instance.last_name,
        }
    else:
        action = 'update'
        changes = {}
        # Compare with original if available
        if hasattr(instance, '_original_state'):
            original = instance._original_state
            for field in ['email', 'user_type', 'first_name', 'last_name', 
                         'phone_number', 'is_active', 'is_verified']:
                if getattr(instance, field) != original.get(field):
                    changes[field] = {
                        'old': original.get(field),
                        'new': getattr(instance, field)
                    }
    
    if changes or created:
        AuditLog.log_action(
            user=instance if not created else None,
            action_type=action,
            model_name='User',
            object_id=instance.id,
            object_repr=instance.email,
            changes=changes,
            request=request
        )


@receiver(post_save, sender='users.UserActivity')
def log_user_activity_model(sender, instance, created, **kwargs):
    """Log user activities (login, logout, etc.)"""
    if created:
        action_map = {
            'login': 'login',
            'logout': 'logout',
            'profile_update': 'profile_update',
            'property_view': 'view',
            'property_save': 'property_save',
            'property_unsave': 'property_unsave',
            'search': 'search',
            'inquiry': 'inquiry_create',
            'message_sent': 'message_send',
            'message_received': 'notification_send',
        }
        
        action_type = action_map.get(instance.activity_type, instance.activity_type)
        
        # Get request from metadata if available
        request = None
        if instance.metadata and 'request_info' in instance.metadata:
            # We could reconstruct a mock request here if needed
            pass
        
        AuditLog.log_action(
            user=instance.user,
            action_type=action_type,
            model_name='User' if instance.activity_type in ['login', 'logout', 'profile_update'] else 'Property',
            object_id=instance.user.id if instance.user else '',
            object_repr=instance.user.email if instance.user else 'Anonymous',
            changes={'activity_type': instance.activity_type, 'metadata': instance.metadata},
            request=request
        )


# Signal for Property model
@receiver(post_save, sender='real_estate.Property')
def log_property_activity(sender, instance, created, **kwargs):
    """Log property creation and updates"""
    request = None
    
    if created:
        action = 'create'
        changes = {
            'title': instance.title,
            'property_type': instance.property_type,
            'listing_type': instance.listing_type,
            'price_etb': str(instance.price_etb),
            'approval_status': instance.approval_status,
        }
    else:
        action = 'update'
        changes = {}
        # Check for specific field changes
        if hasattr(instance, '_original_approval_status'):
            if instance.approval_status != instance._original_approval_status:
                changes['approval_status'] = {
                    'old': instance._original_approval_status,
                    'new': instance.approval_status
                }
        if hasattr(instance, '_original_is_promoted'):
            if instance.is_promoted != instance._original_is_promoted:
                changes['is_promoted'] = {
                    'old': instance._original_is_promoted,
                    'new': instance.is_promoted
                }
    
    if changes or created:
        AuditLog.log_action(
            user=instance.owner,
            action_type=action,
            model_name='Property',
            object_id=instance.id,
            object_repr=instance.title,
            changes=changes,
            request=request
        )


# Signal for Inquiry model
@receiver(post_save, sender='real_estate.Inquiry')
def log_inquiry_activity(sender, instance, created, **kwargs):
    """Log inquiry creation and updates"""
    request = None
    
    if created:
        action = 'create'
        changes = {
            'property': str(instance.property.id),
            'inquiry_type': instance.inquiry_type,
            'status': instance.status,
            'priority': instance.priority,
        }
    else:
        action = 'update'
        changes = {}
        # Track status changes
        if hasattr(instance, '_original_status'):
            if instance.status != instance._original_status:
                changes['status'] = {
                    'old': instance._original_status,
                    'new': instance.status
                }
    
    if changes or created:
        user_email = instance.user.email if instance.user else instance.email or 'Anonymous'
        AuditLog.log_action(
            user=instance.user,
            action_type=action,
            model_name='Inquiry',
            object_id=str(instance.id),
            object_repr=f"Inquiry #{str(instance.id).split('-')[0]} for {instance.property.title}",
            changes=changes,
            request=request
        )


# Signal for Message model
@receiver(post_save, sender='real_estate.Message')
def log_message_activity(sender, instance, created, **kwargs):
    """Log message sending"""
    if created:
        AuditLog.log_action(
            user=instance.sender,
            action_type='message_send',
            model_name='Message',
            object_id=instance.id,
            object_repr=f"Message from {instance.sender.email} to {instance.receiver.email}",
            changes={
                'receiver': instance.receiver.email,
                'message_type': instance.message_type,
                'has_attachment': bool(instance.attachment),
            },
            request=None
        )


# Signal for Payment model
@receiver(post_save, sender='subscriptions.Payment')
def log_payment_activity(sender, instance, created, **kwargs):
    """Log payment activities"""
    if created:
        action = 'create'
        changes = {
            'amount_etb': instance.amount_etb,
            'payment_method': instance.payment_method,
            'status': instance.status,
        }
    else:
        action = 'update'
        changes = {}
        if hasattr(instance, '_original_status'):
            if instance.status != instance._original_status:
                changes['status'] = {
                    'old': instance._original_status,
                    'new': instance.status
                }
                if instance.status == 'completed':
                    action = 'promotion_purchase'
    
    if changes or created:
        AuditLog.log_action(
            user=instance.user,
            action_type=action,
            model_name='Payment',
            object_id=str(instance.id),
            object_repr=f"Payment {str(instance.id)[:8]} - {instance.amount_etb} ETB",
            changes=changes,
            request=None
        )


# Signal for bulk actions
@receiver(m2m_changed)
def log_bulk_activity(sender, instance, action, model, pk_set, **kwargs):
    """Log bulk actions like mass deletions, updates"""
    if action in ['pre_delete', 'post_delete']:
        if model.__name__ == 'User':
            action_type = 'bulk_action'
            changes = {
                'action': 'delete',
                'count': len(pk_set),
                'user_ids': list(pk_set)
            }
            
            # Try to get user from request context
            user = None
            try:
                from django.contrib.auth import get_user
                from django.utils.functional import SimpleLazyObject
                request_user = get_user(instance._state.db)
                if isinstance(request_user, SimpleLazyObject):
                    request_user = request_user._wrapped
                if hasattr(request_user, 'is_authenticated') and request_user.is_authenticated:
                    user = request_user
            except:
                pass
            
            AuditLog.log_action(
                user=user,
                action_type=action_type,
                model_name='User',
                object_id='',
                object_repr=f'Bulk delete {len(pk_set)} users',
                changes=changes,
                request=None
            )