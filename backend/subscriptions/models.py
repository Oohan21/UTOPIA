# subscriptions/models.py - FIXED VERSION
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import uuid

User = get_user_model()

class SubscriptionPlan(models.Model):
    """Optional subscription plans for power users"""
    
    PLAN_TYPES = (
        ("free", "Free"),
        ("basic", "Basic"),
        ("pro", "Professional"),
        ("agent", "Agent"),
    )
    
    name = models.CharField(max_length=100)
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES, default="free")
    description = models.TextField(blank=True)
    
    # Simple pricing
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    yearly_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Benefits (simple)
    property_discount = models.IntegerField(default=0)  # % discount on promotions
    max_properties = models.IntegerField(default=10)
    priority_support = models.BooleanField(default=False)
    analytics_access = models.BooleanField(default=False)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_popular = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ["monthly_price"]
    
    def __str__(self):
        return f"{self.name} - {self.monthly_price} ETB/month"
    
    def yearly_savings(self):
        """Calculate yearly savings"""
        if self.yearly_price > 0 and self.monthly_price > 0:
            monthly_total = self.monthly_price * 12
            return monthly_total - self.yearly_price
        return 0

class UserSubscription(models.Model):
    """User's optional subscription"""
    
    STATUS_CHOICES = (
        ("active", "Active"),
        ("canceled", "Canceled"),
        ("expired", "Expired"),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="subscriptions")
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField()
    auto_renew = models.BooleanField(default=True)
    
    # Simple payment tracking
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_reference = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.user.email} - {self.plan.name}"
    
    def is_active(self):
        return self.status == "active" and self.end_date > timezone.now()
    
    def days_remaining(self):
        if self.end_date > timezone.now():
            return (self.end_date - timezone.now()).days
        return 0

class PropertyPromotionTier(models.Model):
    """Required promotion tiers for properties"""
    
    TIER_TYPES = (
        ("basic", "Basic (Free)"),
        ("standard", "Standard"),
        ("featured", "Featured"),
        ("premium", "Premium"),
    )
    
    name = models.CharField(max_length=100)
    tier_type = models.CharField(max_length=20, choices=TIER_TYPES)
    description = models.TextField()
    
    # Simple pricing
    price_7 = models.IntegerField(default=0)  # 7 days
    price_30 = models.IntegerField()          # 30 days (main price)
    price_90 = models.IntegerField(null=True, blank=True)  # 90 days
    
    # Simple features as JSON
    features = models.JSONField(default=list)
    
    # Visibility metrics
    search_position = models.IntegerField(default=50)  # Lower = higher in search
    badge_color = models.CharField(max_length=20, default="gray")  # Tailwind color
    
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ["display_order"]
    
    def __str__(self):
        return f"{self.name} - {self.price_30} ETB"
    
    def get_price(self, days=30):
        """Get price for duration"""
        if days <= 7:
            return self.price_7
        elif days <= 30:
            return self.price_30
        else:
            return self.price_90 or (self.price_30 * (days // 30))

class PropertyPromotion(models.Model):
    """Required promotion for each property"""
    
    STATUS_CHOICES = (
        ("pending", "Pending Payment"),
        ("active", "Active"),
        ("expired", "Expired"),
        ("failed", "Payment Failed"),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    property = models.ForeignKey("real_estate.Property", on_delete=models.CASCADE)
    tier = models.ForeignKey(PropertyPromotionTier, on_delete=models.PROTECT)
    
    # Simple payment info - REMOVE foreign key to avoid circular reference
    amount_paid = models.IntegerField()
    payment_method = models.CharField(max_length=50)
    payment_reference = models.CharField(max_length=100, blank=True)
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    
    # Duration
    duration_days = models.IntegerField(default=30)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.property.title} - {self.tier.name}"
    
    def is_active(self):
        return self.status == "active" and self.end_date and self.end_date > timezone.now()
    
    def activate(self):
        """Activate promotion after payment"""
        self.status = "active"
        self.start_date = timezone.now()
        self.end_date = timezone.now() + timezone.timedelta(days=self.duration_days)
        self.save()
        
        # Update property
        self.property.is_premium = True
        self.property.promotion_tier = self.tier.tier_type
        self.property.promotion_end = self.end_date
        self.property.promotion_price = self.amount_paid
        self.property.save()

# 5. SIMPLE PAYMENT MODEL (for subscriptions only)
class Payment(models.Model):
    """Simple payment model for subscriptions only"""
    
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # For subscriptions only
    subscription = models.ForeignKey(
        UserSubscription,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    amount_etb = models.DecimalField(max_digits=15, decimal_places=2)
    payment_method = models.CharField(max_length=50)
    transaction_id = models.CharField(max_length=100, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    paid_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"Payment {self.id} - {self.amount_etb} ETB"
    
    def mark_completed(self, transaction_id):
        self.status = "completed"
        self.paid_at = timezone.now()
        self.transaction_id = transaction_id
        self.save()

class PromoCode(models.Model):
    """Simple promo codes"""
    
    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.IntegerField(default=10)
    max_uses = models.IntegerField(default=100)
    times_used = models.IntegerField(default=0)
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.code} - {self.discount_percent}%"
    
    def is_valid(self):
        return (
            self.is_active and 
            self.valid_until > timezone.now() and 
            self.times_used < self.max_uses
        )
    
    def apply_discount(self, amount):
        """Apply discount to amount"""
        if self.is_valid():
            discount = amount * (self.discount_percent / 100)
            self.times_used += 1
            self.save()
            return max(0, amount - discount)
        return amount