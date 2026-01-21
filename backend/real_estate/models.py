from django.db import models
from django.db.models.signals import post_save
from django.db.models import F, Q, Count, Avg, Max, Min  
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import decimal
from django.utils.text import slugify
import uuid

User = get_user_model()


class City(models.Model):
    name = models.CharField(max_length=100)
    name_amharic = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    population = models.IntegerField(null=True, blank=True)
    area_sqkm = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    latitude = models.DecimalField(
        max_digits=10, decimal_places=8, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=11, decimal_places=8, null=True, blank=True
    )
    is_capital = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    featured_image = models.ImageField(upload_to="cities/", null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("city")
        verbose_name_plural = _("cities")
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["is_active"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class SubCity(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="sub_cities")
    name = models.CharField(max_length=100)
    name_amharic = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    population_density = models.CharField(
        max_length=50, blank=True
    )  # Low, Medium, High
    average_price_per_sqm = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    is_popular = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("sub city")
        verbose_name_plural = _("sub cities")
        ordering = ["city", "name"]
        unique_together = ["city", "name"]

    def __str__(self):
        return f"{self.city.name} - {self.name}"


class Amenity(models.Model):
    AMENITY_TYPES = (
        ("general", "General"),
        ("security", "Security"),
        ("recreational", "Recreational"),
        ("utility", "Utility"),
        ("transport", "Transport"),
        ("commercial", "Commercial"),
    )

    name = models.CharField(max_length=100)
    name_amharic = models.CharField(max_length=100, blank=True)
    amenity_type = models.CharField(
        max_length=20, choices=AMENITY_TYPES, default="general"
    )
    icon = models.CharField(max_length=50, blank=True) 
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = _("amenity")
        verbose_name_plural = _("amenities")
        ordering = ["amenity_type", "name"]

    def __str__(self):
        return self.name


class Property(models.Model):
    PROPERTY_TYPES = (
        ("house", "House"),
        ("apartment", "Apartment/Condo"),
        ("villa", "Villa"),
        ("commercial", "Commercial"),
        ("land", "Land"),
        ("office", "Office Space"),
        ("warehouse", "Warehouse"),
        ("farm", "Farm"),
        ("hotel", "Hotel"),
        ("other", "Other"),
    )

    PROPERTY_STATUS = (
        ("available", "Available"),
        ("pending", "Pending"),
        ("sold", "Sold"),
        ("rented", "Rented"),
        ("off_market", "Off Market"),
    )

    LISTING_TYPES = (
        ("for_sale", "For Sale"),
        ("for_rent", "For Rent"),
    )

    FURNISHING_TYPES = (
        ("unfurnished", "Unfurnished"),
        ("semi_furnished", "Semi-Furnished"),
        ("fully_furnished", "Fully Furnished"),
    )

    APPROVAL_STATUS = (
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('changes_requested', 'Changes Requested'),
    )
    
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS,
        default='pending'
    )
    approval_notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_properties'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    # Basic Information
    property_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=200)
    title_amharic = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    description_amharic = models.TextField(blank=True)
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES)
    listing_type = models.CharField(
        max_length=20, choices=LISTING_TYPES, default="for_sale"
    )
    property_status = models.CharField(
        max_length=20, choices=PROPERTY_STATUS, default="available"
    )

    # Ownership and Management
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="owned_properties"
    )
    agent = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_properties",
    )
    developer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="developed_properties",
    )

    # Location
    city = models.ForeignKey(City, on_delete=models.CASCADE)
    sub_city = models.ForeignKey(SubCity, on_delete=models.CASCADE)
    specific_location = models.CharField(max_length=200)
    latitude = models.DecimalField(
        max_digits=17, decimal_places=15, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=18, decimal_places=15, null=True, blank=True
    )
    address_line_1 = models.CharField(max_length=200, blank=True)
    address_line_2 = models.CharField(max_length=200, blank=True)

    # Specifications
    bedrooms = models.IntegerField(
        validators=[MinValueValidator(0)],
        null=True,  # Allow null for commercial/land properties
        blank=True,
        default=0,
    )
    bathrooms = models.IntegerField(
        validators=[MinValueValidator(0)],
        null=True,  # Allow null for commercial/land properties
        blank=True,
        default=0,
    )
    total_area = models.DecimalField(max_digits=10, decimal_places=2)  # in m²
    plot_size = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )  # in m²
    built_year = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1800), MaxValueValidator(2100)],
    )
    floors = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    furnishing_type = models.CharField(
        max_length=20, choices=FURNISHING_TYPES, default="unfurnished"
    )

    # Pricing
    price_etb = models.DecimalField(max_digits=15, decimal_places=2)
    price_usd = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    price_negotiable = models.BooleanField(default=False)
    monthly_rent = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    security_deposit = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    maintenance_fee = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )
    property_tax = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True
    )

    # Features (ManyToMany for better querying)
    amenities = models.ManyToManyField(Amenity, related_name="properties", blank=True)

    # Boolean features
    has_parking = models.BooleanField(default=False)
    has_garden = models.BooleanField(default=False)
    has_security = models.BooleanField(default=False)
    has_furniture = models.BooleanField(default=False)
    has_air_conditioning = models.BooleanField(default=False)
    has_heating = models.BooleanField(default=False)
    has_internet = models.BooleanField(default=False)
    has_generator = models.BooleanField(default=False)
    has_elevator = models.BooleanField(default=False)
    has_swimming_pool = models.BooleanField(default=False)
    has_gym = models.BooleanField(default=False)
    has_conference_room = models.BooleanField(default=False)
    is_pet_friendly = models.BooleanField(default=False)
    is_wheelchair_accessible = models.BooleanField(default=False)
    has_backup_water = models.BooleanField(default=False)

    # Status
    is_featured = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_premium = models.BooleanField(default=False)
    views_count = models.IntegerField(default=0)
    inquiry_count = models.IntegerField(default=0)
    save_count = models.IntegerField(default=0)

    # Virtual Tour
    virtual_tour_url = models.URLField(blank=True)
    video_url = models.URLField(blank=True)
    property_video = models.FileField(
        upload_to="property_videos/%Y/%m/%d/",
        null=True,
        blank=True,
        help_text="Upload property video tour",
    )

    # Documentation
    has_title_deed = models.BooleanField(default=False)
    has_construction_permit = models.BooleanField(default=False)
    has_occupancy_certificate = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    listed_date = models.DateTimeField(default=timezone.now)
    expiry_date = models.DateTimeField(null=True, blank=True)

    # Promotion fields
    promotion_tier = models.CharField(
        max_length=20,
        choices=[("basic", "Basic"), ("standard", "Standard"), ("premium", "Premium")],
        default="basic",
    )
    promotion_start = models.DateTimeField(null=True, blank=True)
    promotion_end = models.DateTimeField(null=True, blank=True)
    promotion_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    is_promoted = models.BooleanField(default=False)

    class Meta:
        verbose_name = _("property")
        verbose_name_plural = _("properties")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["property_type"]),
            models.Index(fields=["listing_type"]),
            models.Index(fields=["property_status"]),
            models.Index(fields=["city", "sub_city"]),
            models.Index(fields=["price_etb"]),
            models.Index(fields=["bedrooms"]),
            models.Index(fields=["is_featured"]),
            models.Index(fields=["is_verified"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["is_promoted", "promotion_end"]),
            models.Index(fields=["promotion_tier", "created_at"]),
            models.Index(fields=['approval_status', 'is_active']),
            models.Index(fields=['approved_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.price_etb} ETB"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
    
        if not is_new:
            try:
                original = Property.objects.get(pk=self.pk)
                self._original_approval_status = original.approval_status
                self._original_is_promoted = original.is_promoted
            except Property.DoesNotExist:
                self._original_approval_status = self.approval_status
                self._original_is_promoted = self.is_promoted
        else:
            self._original_approval_status = 'pending'
            self._original_is_promoted = False
    
        if is_new:
            is_promoted_property = (
                self.promotion_tier and self.promotion_tier != 'basic' or
                self.is_promoted or
                kwargs.pop('auto_approve_if_promoted', False)
            )
        
            if is_promoted_property:
                self.approval_status = 'approved'
                self.is_active = True
                if self.owner:
                    self.approved_by = self.owner
                    self.approved_at = timezone.now()
                print(f"Auto-approving new promoted property: {self.title}")
            else:
                self.approval_status = 'pending'
                self.is_active = False
            
                if self.owner and (self.owner.is_staff or self.owner.is_superuser):
                    self.approval_status = 'approved'
                    self.is_active = True
                    self.approved_by = self.owner
                    self.approved_at = timezone.now()
    
        if not is_new:
            if not self._original_is_promoted and self.is_promoted:
                print(f"Property {self.id} was just promoted")
    
                if self.approval_status != 'approved':
                    self.approval_status = 'approved'
                    self.is_active = True
                    if not self.approved_by and self.owner:
                        self.approved_by = self.owner
                    if not self.approved_at:
                        self.approved_at = timezone.now()
        
            if self._original_approval_status != self.approval_status:
                if self.approval_status == 'approved' and self._original_approval_status != 'approved':
                    self.is_active = True
                    self.approved_at = timezone.now()
                    if not self.approved_by and self.owner:
                        self.approved_by = self.owner
                elif self.approval_status != 'approved':
                    self.is_active = False
    
        if self.is_promoted and not self.promotion_tier:
            self.promotion_tier = 'standard'  
    
        super().save(*args, **kwargs)

    def __init__(self, *args, **kwargs):
       super().__init__(*args, **kwargs)
       self._original_approval_status = self.approval_status
       self._original_is_promoted = self.is_promoted

    def get_price_display(self):
        if self.listing_type == "for_rent":
            if self.monthly_rent:
                return f"{self.monthly_rent:,} ETB/month"
            return "Price not specified"

        if self.price_etb:
            return f"{self.price_etb:,} ETB"
        return "Price not specified"

    @property
    def price_per_sqm(self):
        if self.price_etb and self.total_area and self.total_area != 0:
            return (self.price_etb / Decimal(self.total_area)).quantize(Decimal('0.01'))
        return Decimal('0')

    @property
    def is_promotion_active(self):
        """Check if property has an active promotion"""
        return self.promotions.filter(status="active", end_date__gt=timezone.now()).exists()

    @property
    def days_on_market(self):
        from django.utils import timezone

        if not self.listed_date:
            return 0
        return (timezone.now() - self.listed_date).days

    @property
    def key_features(self):
        """Get key features for comparison"""
        features = []

        if self.has_parking:
            features.append("Parking")
        if self.has_garden:
            features.append("Garden")
        if self.has_security:
            features.append("Security")
        if self.has_furniture:
            features.append("Furnished")
        if self.has_air_conditioning:
            features.append("Air Conditioning")
        if self.has_elevator:
            features.append("Elevator")
        if self.is_pet_friendly:
            features.append("Pet Friendly")

        return features

    def get_comparison_data(self):
        """Get structured data for comparison"""
        return {
            "id": self.id,
            "title": self.title,
            "price": self.price_etb,
            "monthly_rent": self.monthly_rent,
            "price_per_sqm": self.price_per_sqm,
            "area": self.total_area,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "property_type": self.property_type,
            "listing_type": self.listing_type,
            "city": self.city.name if self.city else None,
            "sub_city": self.sub_city.name if self.sub_city else None,
            "features": self.key_features,
            "built_year": self.built_year,
            "is_verified": self.is_verified,
            "virtual_tour": bool(self.virtual_tour_url),
            "days_on_market": self.days_on_market,
            "images": (
                [img.image.url for img in self.images.all()[:3]]
                if self.images.exists()
                else []
            ),
        }

    @property
    def is_approved(self):
        """Check if property is approved and active"""
        return (
            self.approval_status == 'approved' 
            and self.is_active 
            and self.property_status == 'available'
        )

    def toggle_save(self, user):
        """
        Toggle save status for a user
        Returns: (is_saved, save_count)
        """
        from .models import TrackedProperty
        
        # Check if already saved
        tracked = TrackedProperty.objects.filter(
            user=user,
            property=self
        ).first()
        
        if tracked:
            # Unsaved it
            tracked.delete()
            if self.save_count > 0:
                self.save_count -= 1
                self.save(update_fields=['save_count'])
            return False, self.save_count
        else:
            # Save it
            TrackedProperty.objects.create(
                user=user,
                property=self,
                tracking_type='interested',
                notification_enabled=True
            )
            self.save_count += 1
            self.save(update_fields=['save_count'])
            return True, self.save_count
    
    def sync_inquiry_count(self):
        """
        Sync inquiry count with actual database count
        Useful for fixing counts if they get out of sync
        """
        from django.db.models import Count
        
        actual_count = self.inquiries.count()
        
        if self.inquiry_count != actual_count:
            self.inquiry_count = actual_count
            self.save(update_fields=['inquiry_count'])
            print(f"🔄 Synced property {self.id} inquiry count: {self.inquiry_count}")
        
        return self.inquiry_count
    
    def get_inquiry_count(self):
        """
        Get the actual count from database (not cached)
        """
        return self.inquiries.count()
        
    def get_tracking_info(self, user):
        """Get tracking info for a specific user"""
        try:
            tracked = TrackedProperty.objects.filter(
                user=user,
                property=self
            ).first()
            
            if tracked:
                return {
                    'tracking_type': tracked.tracking_type,
                    'tracked_at': tracked.created_at,
                    'tracked_id': tracked.id,
                    'notification_enabled': tracked.notification_enabled,
                    'notes': tracked.notes
                }
        except TrackedProperty.DoesNotExist:
            pass
        return None
    
    # Add this property method to check if property is saved by a user
    def is_saved_by_user(self, user):
        """Check if property is saved by a specific user"""
        if not user or not user.is_authenticated:
            return False
            
        return TrackedProperty.objects.filter(
            user=user,
            property=self
        ).exists()

class PropertyImage(models.Model):
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="property_images/%Y/%m/%d/")
    is_primary = models.BooleanField(default=False)
    caption = models.CharField(max_length=200, blank=True)
    alt_text = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["order", "-is_primary"]
        verbose_name = _("property image")
        verbose_name_plural = _("property images")

    def __str__(self):
        return f"Image for {self.property.title}"


class PropertyDocument(models.Model):
    DOCUMENT_TYPES = (
        ("title_deed", "Title Deed"),
        ("construction_permit", "Construction Permit"),
        ("occupancy_certificate", "Occupancy Certificate"),
        ("floor_plan", "Floor Plan"),
        ("site_plan", "Site Plan"),
        ("other", "Other"),
    )

    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="documents"
    )
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    document = models.FileField(upload_to="property_documents/%Y/%m/%d/")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = _("property document")
        verbose_name_plural = _("property documents")

    def __str__(self):
        return f"{self.document_type} - {self.property.title}"


class SavedSearch(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="saved_searches"
    )
    name = models.CharField(max_length=100)
    filters = models.JSONField()  # Store all filter criteria as JSON
    is_active = models.BooleanField(default=True)
    email_alerts = models.BooleanField(default=True)
    alert_frequency = models.CharField(
        max_length=20,
        choices=[
            ("daily", "Daily"),
            ("weekly", "Weekly"),
            ("instant", "Instant"),
        ],
        default="daily",
    )
    last_notified = models.DateTimeField(null=True, blank=True)
    match_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("saved search")
        verbose_name_plural = _("saved searches")
        unique_together = ["user", "name"]

    def __str__(self):
        return f"{self.user.email} - {self.name}"


class TrackedProperty(models.Model):
    TRACKING_TYPES = (
        ("homeowner", "Homeowner"),
        ("landlord", "Landlord"),
        ("interested", "Interested"),
        ("comparison", "Comparison"),
        ("investment", "Investment"),
    )

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="tracked_properties"
    )
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    tracking_type = models.CharField(max_length=20, choices=TRACKING_TYPES)
    notes = models.TextField(blank=True)
    notification_enabled = models.BooleanField(default=True)
    price_change_threshold = models.DecimalField(
        max_digits=5, decimal_places=2, default=5.0
    )  # percentage
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = _("tracked property")
        verbose_name_plural = _("tracked properties")
        unique_together = ["user", "property", "tracking_type"]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} tracks {self.property.title}"

class Inquiry(models.Model):
    INQUIRY_TYPES = (
        ("general", "General Inquiry"),
        ("viewing", "Viewing Request"),
        ("price", "Price Inquiry"),
        ("details", "More Details"),
    )

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("contacted", "Contacted"),
        ("viewing_scheduled", "Viewing Scheduled"),
        ("follow_up", "Follow Up Required"),
        ("closed", "Closed"),
        ("spam", "Spam"),
    )

    PRIORITY_CHOICES = (
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
    )

    CATEGORY_CHOICES = (
        ("buyer", "Buyer Inquiry"),
        ("seller", "Seller Inquiry"),
        ("general", "General Inquiry"),
    )

    SOURCE_CHOICES = (
        ("website", "Website Form"),
        ("phone", "Phone Call"),
        ("email", "Email"),
        ("whatsapp", "WhatsApp"),
        ("walk_in", "Walk-in"),
        ("referral", "Referral"),
    )

    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="inquiries"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="inquiries", null=True, blank=True
    )
    inquiry_type = models.CharField(
        max_length=20, choices=INQUIRY_TYPES, default="general"
    )
    message = models.TextField()
    contact_preference = models.CharField(
        max_length=20,
        choices=[
            ("call", "Call"),
            ("email", "Email"),
            ("whatsapp", "WhatsApp"),
            ("any", "Any"),
        ],
        default="any",
    )

    # Contact Information (for anonymous inquiries)
    full_name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)

    # Status and Management
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default="medium"
    )
    
    # Assignment - only admins can be assigned
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_inquiries",
        limit_choices_to={'user_type': 'admin'}  # Only admins can be assigned
    )

    # Response tracking
    response_sent = models.BooleanField(default=False)
    response_notes = models.TextField(blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    response_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="responded_inquiries"
    )

    # Additional fields
    scheduled_viewing = models.DateTimeField(null=True, blank=True)
    viewing_address = models.CharField(max_length=500, blank=True)
    tags = models.JSONField(default=list, blank=True)
    internal_notes = models.TextField(blank=True)
    follow_up_date = models.DateTimeField(null=True, blank=True)
    category = models.CharField(
        max_length=50, choices=CATEGORY_CHOICES, default="general"
    )
    source = models.CharField(
        max_length=50, choices=SOURCE_CHOICES, default="website"
    )

    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    session_id = models.CharField(max_length=100, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("inquiry")
        verbose_name_plural = _("inquiries")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['assigned_to', 'created_at']),
            models.Index(fields=['property', 'created_at']),
            models.Index(fields=['follow_up_date']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['email', 'created_at']),
        ]

    def __str__(self):
        if self.user:
            return f"Inquiry #{self.id} - {self.user.email} - {self.property.title}"
        return f"Inquiry #{self.id} - {self.full_name} - {self.property.title}"

    def get_is_urgent(self):
        """Check if inquiry requires urgent attention"""
        from django.utils import timezone
        from datetime import timedelta
        
        urgent_statuses = ['pending', 'viewing_scheduled']
        is_high_priority = self.priority in ['high', 'urgent']
        is_recent = self.created_at >= timezone.now() - timedelta(hours=24)
        
        return is_high_priority and self.status in urgent_statuses and is_recent

    def get_response_time_hours(self):
        """Calculate response time in hours"""
        if self.responded_at:
            return (self.responded_at - self.created_at).total_seconds() / 3600
        return None

    def get_user_display_name(self):
        """Get user's display name"""
        if self.user:
            return f"{self.user.first_name} {self.user.last_name}"
        return self.full_name or "Anonymous"

    def get_user_email_address(self):
        """Get user's email"""
        if self.user:
            return self.user.email
        return self.email

    def get_days_since_creation(self):
        """Get days since inquiry was created"""
        from django.utils import timezone
        return (timezone.now() - self.created_at).days

    def get_has_scheduled_viewing(self):
        """Check if viewing is scheduled"""
        return self.scheduled_viewing is not None

    def get_is_overdue_followup(self):
        """Check if follow-up is overdue"""
        from django.utils import timezone
        if self.follow_up_date:
            return self.follow_up_date < timezone.now() and self.status != 'closed'
        return False


    def get_status_display_name(self):
        """Get display name for status"""
        return dict(self.STATUS_CHOICES).get(self.status, self.status)

    def get_priority_display_name(self):
        """Get display name for priority"""
        return dict(self.PRIORITY_CHOICES).get(self.priority, self.priority)

    def get_inquiry_type_display_name(self):
        """Get display name for inquiry type"""
        return dict(self.INQUIRY_TYPES).get(self.inquiry_type, self.inquiry_type)

    def get_category_display_name(self):
        """Get display name for category"""
        return dict(self.CATEGORY_CHOICES).get(self.category, self.category)

    def get_source_display_name(self):
        """Get display name for source"""
        return dict(self.SOURCE_CHOICES).get(self.source, self.source)

    def get_contact_preference_display_name(self):
        """Get display name for contact preference"""
        choices = dict([
            ("call", "Call"),
            ("email", "Email"),
            ("whatsapp", "WhatsApp"),
            ("any", "Any"),
        ])
        return choices.get(self.contact_preference, self.contact_preference)

    # ========== BUSINESS LOGIC METHODS ==========

    def save(self, *args, **kwargs):
        """Override save to add automatic timestamp updates"""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Log creation if new
        if is_new:
            try:
                # Use F() expression to avoid race conditions
                from django.db.models import F
                self.property.inquiry_count = F('inquiry_count') + 1
                self.property.save(update_fields=['inquiry_count'])
                
                # IMPORTANT: Refresh from database to get the updated value
                self.property.refresh_from_db()
                
                print(f"✅ Inquiry created. Property {self.property.id} inquiry count updated to: {self.property.inquiry_count}")
            except Exception as e:
                print(f"❌ Error updating property inquiry count: {str(e)}")

        if is_new:
            try:
                from users.models import UserActivity
                UserActivity.objects.create(
                    user=self.user if self.user else None,
                    activity_type="inquiry_created",
                    ip_address=self.ip_address,
                    user_agent=self.user_agent,
                    metadata={
                        "inquiry_id": str(self.id),
                        "property_id": self.property.id,
                        "inquiry_type": self.inquiry_type
                    }
                )
            except Exception:
                pass  # Skip logging if users app not available

    def mark_as_contacted(self, user=None, notes=""):
        """Mark inquiry as contacted"""
        from django.utils import timezone
        
        self.status = 'contacted'
        self.responded_at = timezone.now()
        self.response_sent = True
        if user:
            self.response_by = user
        if notes:
            self.response_notes = notes
        self.save()

    def schedule_viewing(self, date_time, address, notes=""):
        """Schedule a property viewing"""
        from django.utils import timezone
        
        self.status = 'viewing_scheduled'
        self.scheduled_viewing = date_time
        self.viewing_address = address
        if notes:
            self.response_notes = notes
        self.responded_at = timezone.now()
        self.response_sent = True
        self.save()

    def assign_to_admin(self, admin_user):
        """Assign inquiry to an admin"""
        if admin_user.user_type != 'admin':
            raise ValueError("Only admin users can be assigned inquiries")
        
        self.assigned_to = admin_user
        self.save()
        
        # Log the assignment
        try:
            from users.models import UserActivity
            UserActivity.objects.create(
                user=admin_user,
                activity_type="inquiry_assigned",
                ip_address=self.ip_address,
                user_agent=self.user_agent,
                metadata={
                    "inquiry_id": str(self.id),
                    "property_title": self.property.title
                }
            )
        except Exception:
            pass

    def close_inquiry(self, user=None, notes=""):
        """Close the inquiry"""
        from django.utils import timezone
        
        self.status = 'closed'
        if user:
            self.response_by = user
        if notes:
            self.response_notes = notes
        if not self.responded_at:
            self.responded_at = timezone.now()
        self.response_sent = True
        self.save()

    def can_view(self, user):
        """Check if user can view this inquiry"""
        if user.user_type == 'admin':
            return True
        return self.user == user or self.property.owner == user

    def can_update(self, user):
        """Check if user can update this inquiry"""
        if user.user_type == 'admin':
            return True
        return self.user == user

    def get_status_color(self):
        """Get color for status display"""
        status_colors = {
            'pending': 'warning',
            'contacted': 'info',
            'viewing_scheduled': 'success',
            'follow_up': 'warning',
            'closed': 'secondary',
            'spam': 'danger',
        }
        return status_colors.get(self.status, 'secondary')

    def get_priority_color(self):
        """Get color for priority display"""
        priority_colors = {
            'low': 'success',
            'medium': 'info',
            'high': 'warning',
            'urgent': 'danger',
        }
        return priority_colors.get(self.priority, 'secondary')

    def to_dict(self):
        """Convert inquiry to dictionary for serialization"""
        return {
            'id': str(self.id),
            'property_id': self.property.id,
            'property_title': self.property.title,
            'user_id': self.user.id if self.user else None,
            'user_display_name': self.get_user_display_name(),
            'inquiry_type': self.inquiry_type,
            'status': self.status,
            'priority': self.priority,
            'created_at': self.created_at.isoformat(),
            'is_urgent': self.get_is_urgent(),
            'response_time_hours': self.get_response_time_hours(),
        }

    def add_tag(self, tag):
        """Add a tag to the inquiry"""
        if not self.tags:
            self.tags = []
        if tag not in self.tags:
            self.tags.append(tag)
            self.save()

    def remove_tag(self, tag):
        """Remove a tag from the inquiry"""
        if self.tags and tag in self.tags:
            self.tags.remove(tag)
            self.save()

    def clear_tags(self):
        """Clear all tags from the inquiry"""
        self.tags = []
        self.save()

    @classmethod
    def get_open_inquiries(cls):
        """Get all open (non-closed) inquiries"""
        return cls.objects.exclude(status='closed').exclude(status='spam')

    @classmethod
    def get_urgent_inquiries(cls):
        """Get all urgent inquiries"""
        from django.utils import timezone
        from datetime import timedelta
        
        urgent_threshold = timezone.now() - timedelta(hours=24)
        return cls.objects.filter(
            status='pending',
            priority__in=['high', 'urgent'],
            created_at__gte=urgent_threshold
        )

    @classmethod
    def get_unassigned_inquiries(cls):
        """Get all unassigned inquiries"""
        return cls.objects.filter(assigned_to__isnull=True).exclude(status='closed')

    @classmethod
    def get_user_inquiries(cls, user):
        """Get all inquiries for a user"""
        if user.user_type == 'admin':
            return cls.objects.all()
        return cls.objects.filter(user=user)

    @classmethod
    def create_anonymous_inquiry(cls, property, full_name, email, phone, message, 
                                  inquiry_type='general', **kwargs):
        """Create an inquiry from anonymous user"""
        from django.utils import timezone
        
        return cls.objects.create(
            property=property,
            full_name=full_name,
            email=email,
            phone=phone,
            message=message,
            inquiry_type=inquiry_type,
            **kwargs
        )

    @classmethod
    def get_stats(cls, user=None):
        """Get inquiry statistics"""
        from django.db.models import Count, Q
        from django.utils import timezone
        from datetime import timedelta
        
        queryset = cls.objects.all()
        
        if user and user.user_type != 'admin':
            queryset = queryset.filter(user=user)
        
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        stats = queryset.aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            closed=Count('id', filter=Q(status='closed')),
            responded=Count('id', filter=Q(response_sent=True)),
            recent=Count('id', filter=Q(created_at__gte=thirty_days_ago))
        )
        
        # Calculate average response time
        responded_inquiries = queryset.filter(responded_at__isnull=False)
        total_response_hours = 0
        count = 0
        
        for inquiry in responded_inquiries:
            response_time = inquiry.get_response_time_hours()
            if response_time:
                total_response_hours += response_time
                count += 1
        
        if count > 0:
            stats['avg_response_hours'] = total_response_hours / count
        else:
            stats['avg_response_hours'] = 0
        
        return stats
        
class PropertyView(models.Model):
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="property_views"
    )
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    session_id = models.CharField(max_length=100, blank=True)
    viewed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = _("property view")
        verbose_name_plural = _("property views")
        indexes = [
            models.Index(fields=["property", "viewed_at"]),
            models.Index(fields=["user", "viewed_at"]),
        ]

    def __str__(self):
        return f"View of {self.property.title} at {self.viewed_at}"


class PropertyComparison(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="property_comparisons"
    )
    name = models.CharField(max_length=100, blank=True)
    properties = models.ManyToManyField(Property, related_name="comparisons")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("property comparison")
        verbose_name_plural = _("property comparisons")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Comparison by {self.user.email} ({self.properties.count()} properties)"


class ComparisonSession(models.Model):
    session_id = models.CharField(max_length=100)
    properties = models.ManyToManyField(Property)
    created_at = models.DateTimeField(default=timezone.now)
    last_accessed = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("comparison session")
        verbose_name_plural = _("comparison sessions")

class Message(models.Model):
    """
    Direct messaging between users
    """
    MESSAGE_TYPES = (
        ('inquiry', 'Inquiry Related'),
        ('general', 'General'),
        ('offer', 'Offer/Proposal'),
        ('viewing', 'Viewing Arrangement'),
        ('negotiation', 'Negotiation'),
    )
    
    sender = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='sent_messages'
    )
    receiver = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='received_messages'
    )
    property = models.ForeignKey(
        Property, 
        on_delete=models.CASCADE, 
        related_name='messages',
        null=True,
        blank=True
    )
    inquiry = models.ForeignKey(
        'Inquiry',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='messages'
    )
    
    message_type = models.CharField(
        max_length=20, 
        choices=MESSAGE_TYPES, 
        default='general'
    )
    subject = models.CharField(max_length=200, blank=True, null=True)
    content = models.TextField()
    
    # Attachment support
    attachment = models.FileField(
        upload_to='message_attachments/%Y/%m/%d/',
        null=True,
        blank=True
    )

    thread = models.ForeignKey(
        'MessageThread',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='thread_messages'  
    )
    
    # Read status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = _('message')
        verbose_name_plural = _('messages')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sender', 'receiver', 'created_at']),
            models.Index(fields=['property', 'created_at']),
            models.Index(fields=['is_read', 'created_at']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.email} to {self.receiver.email}"
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class MessageThread(models.Model):
    """
    Thread for grouping related messages
    """
    participants = models.ManyToManyField(User, related_name='message_threads')
    property = models.ForeignKey(
        Property, 
        on_delete=models.CASCADE, 
        related_name='threads',
        null=True,
        blank=True
    )
    inquiry = models.ForeignKey(
        'Inquiry',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='threads'
    )
    
    subject = models.CharField(max_length=200)
    last_message = models.ForeignKey(
        'Message',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='thread_last_message'
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('message thread')
        verbose_name_plural = _('message threads')
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Thread: {self.subject}"
    
    def update_last_message(self, message):
        self.last_message = message
        self.updated_at = timezone.now()
        self.save(update_fields=['last_message', 'updated_at'])

class SearchHistory(models.Model):
    """Model to track user search history"""
    SEARCH_TYPES = (
        ('manual', 'Manual Search'),
        ('saved_search', 'Saved Search'),
        ('quick_filter', 'Quick Filter'),
        ('map_search', 'Map Search'),
        ('promotion_search', 'Promotion Search'),
        ('price_alert', 'Price Alert'),
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='search_history',
        null=True,
        blank=True  # Allow anonymous searches
    )
    
    # Search query (for text searches)
    query = models.CharField(max_length=500, blank=True)
    
    # Filters used in JSON format
    filters = models.JSONField(default=dict, blank=True)
    
    # Search metadata
    search_type = models.CharField(
        max_length=20,
        choices=SEARCH_TYPES,
        default='manual'
    )
    
    # Promotion context (if applicable)
    TIER_CHOICES = [
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
    ]

    promotion_tier = models.CharField(
        max_length=20,
        choices=TIER_CHOICES,
        null=True,
        blank=True
    )
    promoted_only = models.BooleanField(default=False)
    
    # Results information
    results_count = models.IntegerField(default=0)
    session_id = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # For price alerts
    price_alert_set = models.BooleanField(default=False)
    price_alert_threshold = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Performance metrics
    search_duration = models.FloatField(null=True, blank=True)  # in seconds
    clicked_result = models.ForeignKey(
        'Property',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='search_clicks'
    )
    clicked_promotion = models.ForeignKey(
        'subscriptions.PropertyPromotion',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='search_clicks'
    )
    
    # Location context (if available)
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True
    )
    longitude = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True
    )
    radius_km = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Sorting and pagination
    sort_by = models.CharField(max_length=100, blank=True)
    page = models.IntegerField(default=1)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('search history')
        verbose_name_plural = _('search histories')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['session_id', 'created_at']),
            models.Index(fields=['query', 'created_at']),
            models.Index(fields=['search_type', 'created_at']),
            models.Index(fields=['results_count', 'created_at']),
            models.Index(fields=['promotion_tier', 'created_at']),
            models.Index(fields=['promoted_only', 'created_at']),
        ]
    
    def __str__(self):
        if self.user:
            return f"Search by {self.user.email} at {self.created_at}"
        elif self.session_id:
            return f"Search (anonymous: {self.session_id}) at {self.created_at}"
        else:
            return f"Search at {self.created_at}"
    
    @property
    def is_anonymous(self):
        return not self.user
    
    @property
    def filter_summary(self):
        """Get human-readable filter summary"""
        filters = self.filters or {}
        summary_parts = []
        
        if self.query:
            summary_parts.append(f'"{self.query}"')
        
        if filters.get('property_type'):
            type_map = dict(Property.PROPERTY_TYPES)
            prop_type = filters['property_type']
            display_type = type_map.get(prop_type, prop_type.replace('_', ' ').title())
            summary_parts.append(display_type)
        
        if filters.get('city'):
            try:
                city = City.objects.get(id=filters['city'])
                summary_parts.append(f"in {city.name}")
            except City.DoesNotExist:
                pass
        
        if filters.get('min_price') and filters.get('max_price'):
            summary_parts.append(f"{filters['min_price']:,}-{filters['max_price']:,} ETB")
        elif filters.get('min_price'):
            summary_parts.append(f"from {filters['min_price']:,} ETB")
        elif filters.get('max_price'):
            summary_parts.append(f"up to {filters['max_price']:,} ETB")
        
        if filters.get('bedrooms'):
            bedrooms = filters['bedrooms']
            summary_parts.append(f"{bedrooms}+ bed")
        
        if self.promoted_only:
            summary_parts.append("Promoted Only")
        elif self.promotion_tier:
            summary_parts.append(f"{self.promotion_tier.title()} Tier")
        
        return ' • '.join(summary_parts) or "Search"
    
    @classmethod
    def get_popular_searches(cls, days=30, limit=10, include_promoted=False):
        """Get popular searches from the last N days"""
        from django.db.models import Count, Avg, Q
    
        date_threshold = timezone.now() - timedelta(days=days)
    
        queryset = cls.objects.filter(
            created_at__gte=date_threshold,
            query__isnull=False,
            query__gt=''
        )
    
        if include_promoted:
            queryset = queryset.filter(
                Q(promoted_only=True) | Q(promotion_tier__isnull=False)
            )
    
        popular = queryset.values('query').annotate(
            count=Count('id'),
            avg_results=Avg('results_count'),
            user_count=Count('user', distinct=True),
            promoted_searches=Count('id', filter=Q(promoted_only=True))
        ).order_by('-count')[:limit]
    
        return list(popular)
    
    @classmethod
    def get_promotion_insights(cls, tier_type=None, days=30):
        """Get insights about promotion searches"""
        from django.db.models import Count, Avg, Q
        from datetime import timedelta
        
        date_threshold = timezone.now() - timedelta(days=days)
        
        queryset = cls.objects.filter(
            created_at__gte=date_threshold
        )
        
        if tier_type:
            queryset = queryset.filter(promotion_tier=tier_type)
        
        insights = queryset.aggregate(
            total_searches=Count('id'),
            promoted_searches=Count('id', filter=Q(promoted_only=True)),
            avg_results=Avg('results_count', filter=Q(promoted_only=True)),
            avg_duration=Avg('search_duration', filter=Q(promoted_only=True)),
            unique_users=Count('user', distinct=True, filter=Q(promoted_only=True))
        )
        
        # Get popular promotion searches
        popular_promoted = cls.objects.filter(
            created_at__gte=date_threshold,
            promoted_only=True
        ).values('query').annotate(
            count=Count('id'),
            click_rate=Avg('clicked_result', filter=Q(clicked_result__isnull=False))
        ).order_by('-count')[:10]
        
        return {
            'insights': insights,
            'popular_promoted_searches': list(popular_promoted)
        }
    
    @classmethod
    def create_from_request(cls, request, search_data):
        """Create a search history record from request data"""
        from django.utils import timezone
        
        # Prepare data
        history_data = {
            'query': search_data.get('query', ''),
            'filters': search_data.get('filters', {}),
            'results_count': search_data.get('results_count', 0),
            'search_type': search_data.get('search_type', 'manual'),
            'search_duration': search_data.get('search_duration'),
            'clicked_result_id': search_data.get('clicked_result_id'),
            'clicked_promotion_id': search_data.get('clicked_promotion_id'),
            'latitude': search_data.get('latitude'),
            'longitude': search_data.get('longitude'),
            'radius_km': search_data.get('radius_km'),
            'promotion_tier': search_data.get('promotion_tier'),
            'promoted_only': search_data.get('promoted_only', False),
            'price_alert_set': search_data.get('price_alert_set', False),
            'price_alert_threshold': search_data.get('price_alert_threshold'),
            'sort_by': search_data.get('sort_by', ''),
            'page': search_data.get('page', 1),
        }
        
        # Add user if authenticated
        if request.user.is_authenticated:
            history_data['user'] = request.user
        
        # Add session info for anonymous users
        if hasattr(request, 'session'):
            if not request.session.session_key:
                request.session.create()
            history_data['session_id'] = request.session.session_key
        
        # Add IP and user agent
        history_data['ip_address'] = cls.get_client_ip(request)
        history_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')[:500]
        
        # Clean empty values
        history_data = {k: v for k, v in history_data.items() if v not in [None, '']}
        
        # Create the record
        return cls.objects.create(**history_data)

    # models.py - Add to SearchHistory class

    @classmethod
    def get_search_suggestions(cls, user, query, limit=5):
        """
        Get search suggestions for a user based on their history
        """
        suggestions = []
    
    # For authenticated users
        if hasattr(user, 'id') and user.id:
        # Get user's recent searches containing the query
            recent_searches = cls.objects.filter(
                user=user,
                query__isnull=False,
                query__icontains=query
            ).order_by('-created_at').values('query').distinct()[:limit]
        
            suggestions = [search['query'] for search in recent_searches if search['query']]
    
    # For session-based (anonymous) users
        elif hasattr(user, 'session_key') and user.session_key:
            recent_searches = cls.objects.filter(
                session_id=user.session_key,
                query__isnull=False,
                query__icontains=query
            ).order_by('-created_at').values('query').distinct()[:limit]
        
            suggestions = [search['query'] for search in recent_searches if search['query']]
    
    # If we don't have enough suggestions, add popular ones
        if len(suggestions) < limit:
            try:
               # Get popular searches from last 7 days
                seven_days_ago = timezone.now() - timedelta(days=7)
                popular_searches = cls.objects.filter(
                    created_at__gte=seven_days_ago,
                    query__isnull=False,
                    query__icontains=query
                ).values('query').annotate(
                    count=Count('id')
                ).order_by('-count')[:limit]
            
                for search in popular_searches:
                    query_text = search['query']
                    if query_text and query_text not in suggestions:
                        suggestions.append(query_text)
                
                    if len(suggestions) >= limit:
                        break
            except Exception as e:
                print(f"Error getting popular suggestions: {str(e)}")
    
        return suggestions[:limit]
    
    @staticmethod
    def get_client_ip(request):
        """Extract client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

@receiver(post_save, sender=Inquiry)
def update_property_inquiry_count(sender, instance, created, **kwargs):
    if created:
        Property.objects.filter(id=instance.property.id).update(
            inquiry_count=F('inquiry_count') + 1
        )