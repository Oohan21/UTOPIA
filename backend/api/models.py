from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

User = get_user_model()

class MarketStats(models.Model):
    city = models.ForeignKey('real_estate.City', on_delete=models.CASCADE, null=True, blank=True)
    sub_city = models.ForeignKey('real_estate.SubCity', on_delete=models.CASCADE, null=True, blank=True)
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
    price_change_qoq = models.DecimalField(max_digits=5, decimal_places=2)  # Quarter over quarter
    price_change_yoy = models.DecimalField(max_digits=5, decimal_places=2)  # Year over year
    
    # Inventory
    inventory_months = models.DecimalField(max_digits=5, decimal_places=2)  # Months of inventory
    
    # Data source
    data_source = models.CharField(max_length=100, default='UTOPIA')
    is_estimated = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('market statistics')
        verbose_name_plural = _('market statistics')
        unique_together = ['city', 'sub_city', 'property_type', 'year', 'quarter', 'month']
        ordering = ['-year', '-quarter', '-month']
    
    def __str__(self):
        location = f"{self.city.name if self.city else 'All'} - {self.sub_city.name if self.sub_city else 'All'}"
        return f"Market Stats: {location} - Q{self.quarter} {self.year}"

class PropertyValuation(models.Model):
    CONFIDENCE_LEVELS = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )
    
    property = models.ForeignKey('real_estate.Property', on_delete=models.CASCADE, 
                                related_name='valuations', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    # Input parameters
    city = models.ForeignKey('real_estate.City', on_delete=models.CASCADE, null=True, blank=True)
    sub_city = models.ForeignKey('real_estate.SubCity', on_delete=models.CASCADE, null=True, blank=True)
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
    market_trend = models.CharField(max_length=50, blank=True)  # rising, falling, stable
    trend_strength = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    notes = models.TextField(blank=True)
    valuation_date = models.DateField(default=timezone.now)
    
    class Meta:
        verbose_name = _('property valuation')
        verbose_name_plural = _('property valuations')
        ordering = ['-valuation_date']
    
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
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    data = models.JSONField(default=dict)  # Additional data
    
    # Link to related object
    content_type = models.CharField(max_length=50, blank=True)  # e.g., 'property', 'inquiry'
    object_id = models.IntegerField(null=True, blank=True)
    
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
        ]
    
    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"

class AuditLog(models.Model):
    ACTION_TYPES = (
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('export', 'Export'),
    )
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)
    
    # Changes
    changes = models.JSONField(default=dict)  # Track field changes
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = _('audit log')
        verbose_name_plural = _('audit logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'action_type']),
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_action_type_display()} {self.model_name} by {self.user.email if self.user else 'System'}"