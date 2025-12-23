from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
import uuid

User = get_user_model()


class PropertyPromotionTier(models.Model):
    """Promotion tiers for properties - 3 tiers only"""

    TIER_TYPES = (
        ("basic", "Basic"),
        ("standard", "Standard"),
        ("premium", "Premium"),
    )

    name = models.CharField(max_length=100)
    tier_type = models.CharField(max_length=20, choices=TIER_TYPES, unique=True)
    description = models.TextField()

    # Fixed prices for specific durations
    price_7 = models.IntegerField(default=0)  # 7 days
    price_30 = models.IntegerField()  # 30 days
    price_60 = models.IntegerField()  # 60 days
    price_90 = models.IntegerField(null=True, blank=True)  # 90 days

    # Features
    features = models.JSONField(default=list)

    # Visibility
    search_position = models.IntegerField(default=50)  # Lower = higher in search
    badge_color = models.CharField(max_length=20, default="gray")

    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["display_order"]
        verbose_name = "Promotion Tier"
        verbose_name_plural = "Promotion Tiers"

    def __str__(self):
        return f"{self.name} - {self.price_30} ETB"

    def get_price(self, days=30):
        """Get price for specific duration"""
        if days == 7:
            return self.price_7
        elif days == 30:
            return self.price_30
        elif days == 60:
            return self.price_60
        elif days == 90 and self.price_90:
            return self.price_90
        else:
            return self.price_30


class Payment(models.Model):
    """Payment model for promotions only"""

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    # Linked promotion
    promotion = models.ForeignKey(
        "PropertyPromotion",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payment",
    )

    amount_etb = models.IntegerField()
    payment_method = models.CharField(max_length=50, default="chapa")
    transaction_id = models.CharField(max_length=100, blank=True)
    chapa_reference = models.CharField(max_length=100, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    paid_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Payment"
        verbose_name_plural = "Payments"

    def __str__(self):
        payment_id_str = str(self.id)
        return f"Payment {payment_id_str[:8]} - {self.amount_etb} ETB"

    def mark_completed(self, transaction_id, chapa_reference=""):
        self.status = "completed"
        self.paid_at = timezone.now()
        self.transaction_id = transaction_id
        self.chapa_reference = chapa_reference
        self.save()


class PropertyPromotion(models.Model):
    """Property promotion - required for visibility"""

    STATUS_CHOICES = (
        ("pending", "Pending Payment"),
        ("active", "Active"),
        ("expired", "Expired"),
        ("failed", "Payment Failed"),
    )

    DURATION_CHOICES = (
        (7, "7 days"),
        (30, "30 days"),
        (60, "60 days"),
        (90, "90 days"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    listed_property = models.ForeignKey(
        "real_estate.Property", on_delete=models.CASCADE, related_name="promotions"
    )
    tier = models.ForeignKey(PropertyPromotionTier, on_delete=models.PROTECT)

    # Duration
    duration_days = models.IntegerField(choices=DURATION_CHOICES, default=30)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Property Promotion"
        verbose_name_plural = "Property Promotions"

    def __str__(self):
        return f"{self.listed_property.title} - {self.tier.name} ({self.duration_days} days)"

    def is_active(self):
        return (
            self.status == "active" and self.end_date and self.end_date > timezone.now()
        )

    def days_remaining(self):
        if self.is_active():
            return (self.end_date - timezone.now()).days
        return 0

    def get_amount_paid(self):
        """Get amount paid from associated payment"""
        # Access payment through reverse relation
        try:
            payment = self.payment.first() 
            if payment and payment.status == "completed":
                return payment.amount_etb
        except AttributeError:
            pass
        return 0

    def activate(self):
        """Activate promotion after payment"""
        try:
            with transaction.atomic():
                # Update promotion status
                self.status = "active"
                self.start_date = timezone.now()
                self.end_date = timezone.now() + timezone.timedelta(
                    days=self.duration_days
                )
                self.save()

                # Update property
                property_obj = self.listed_property
                print(f"\nOriginal property state:")
                print(f"  ID: {property_obj.id}")
                print(f"  Title: {property_obj.title}")
                print(f"  is_promoted: {property_obj.is_promoted}")
                print(f"  promotion_tier: {property_obj.promotion_tier}")
                print(f"  is_featured: {property_obj.is_featured}")

                property_obj.is_promoted = True
                property_obj.promotion_tier = self.tier.tier_type
                property_obj.promotion_start = timezone.now()
                property_obj.promotion_end = self.end_date
                property_obj.promotion_price = self.get_amount_paid()
                property_obj.is_premium = True

                print(f"DEBUG: Tier type: {self.tier.tier_type}")
                print(f"DEBUG: Before setting featured: {property_obj.is_featured}")
            
                # Set featured status for premium tier
                if self.tier.tier_type == "premium":
                    property_obj.is_featured = True
                    print(f"DEBUG: Setting featured to True")
            
                print(f"\nUpdated property state before save:")
                print(f"  is_promoted: {property_obj.is_promoted}")
                print(f"  promotion_tier: {property_obj.promotion_tier}")
                print(f"  promotion_start: {property_obj.promotion_start}")
                print(f"  promotion_end: {property_obj.promotion_end}")
                print(f"  promotion_price: {property_obj.promotion_price}")
                print(f"  is_premium: {property_obj.is_premium}")
                print(f"  is_featured: {property_obj.is_featured}")

                property_obj.save()

                property_obj.refresh_from_db()
                print(f"After refresh from DB:")
                print(f"  is_promoted: {property_obj.is_promoted}")
                print(f"  promotion_tier: {property_obj.promotion_tier}")
                print(f"  is_featured: {property_obj.is_featured}")

                # Send notification
                self.send_activation_notification()
                return True

        except Exception as e:
            print(f"\n=== DEBUG: ERROR ACTIVATING PROMOTION ===")
            print(f"Error: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            print(f"=== DEBUG: END ERROR ===\n")
            return False

    def send_activation_notification(self):
        """Send notification about promotion activation"""
        try:
            from django.core.mail import send_mail
            from django.conf import settings

            subject = f"Property Promotion Activated"
            message = f"""
            Hello {self.user.get_full_name() or self.user.email},
            
            Your property promotion is now active!
            
            Property: {self.listed_property.title}
            Tier: {self.tier.name}
            Duration: {self.duration_days} days
            Valid Until: {self.end_date.strftime('%Y-%m-%d')}
            
            Your property will now receive increased visibility.
            
            Thank you,
            {settings.SITE_NAME if hasattr(settings, 'SITE_NAME') else 'Property Platform'}
            """

            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [self.user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Failed to send notification: {e}")


class PromoCode(models.Model):
    """Promo codes for promotions"""

    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.IntegerField(default=10)
    max_uses = models.IntegerField(default=100)
    times_used = models.IntegerField(default=0)
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "Promo Code"
        verbose_name_plural = "Promo Codes"

    def __str__(self):
        return f"{self.code} - {self.discount_percent}%"

    def is_valid(self):
        return (
            self.is_active
            and self.valid_until > timezone.now()
            and self.times_used < self.max_uses
        )

    def apply_discount(self, amount):
        """Apply discount to amount"""
        if self.is_valid():
            discount = amount * (self.discount_percent / 100)
            self.times_used += 1
            self.save()
            return max(0, int(amount - discount))
        return amount
