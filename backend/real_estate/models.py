from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
import decimal
from django.utils.text import slugify
import uuid

# Get the custom user model
User = get_user_model()

class City(models.Model):
    name = models.CharField(max_length=100)
    name_amharic = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    population = models.IntegerField(null=True, blank=True)
    area_sqkm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    is_capital = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    featured_image = models.ImageField(upload_to='cities/', null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('city')
        verbose_name_plural = _('cities')
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name

class SubCity(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='sub_cities')
    name = models.CharField(max_length=100)
    name_amharic = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    population_density = models.CharField(max_length=50, blank=True)  # Low, Medium, High
    average_price_per_sqm = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    is_popular = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('sub city')
        verbose_name_plural = _('sub cities')
        ordering = ['city', 'name']
        unique_together = ['city', 'name']
    
    def __str__(self):
        return f"{self.city.name} - {self.name}"

class Amenity(models.Model):
    AMENITY_TYPES = (
        ('general', 'General'),
        ('security', 'Security'),
        ('recreational', 'Recreational'),
        ('utility', 'Utility'),
        ('transport', 'Transport'),
        ('commercial', 'Commercial'),
    )
    
    name = models.CharField(max_length=100)
    name_amharic = models.CharField(max_length=100, blank=True)
    amenity_type = models.CharField(max_length=20, choices=AMENITY_TYPES, default='general')
    icon = models.CharField(max_length=50, blank=True)  # FontAwesome icon class
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = _('amenity')
        verbose_name_plural = _('amenities')
        ordering = ['amenity_type', 'name']
    
    def __str__(self):
        return self.name

class Property(models.Model):
    PROPERTY_TYPES = (
        ('house', 'House'),
        ('apartment', 'Apartment/Condo'),
        ('villa', 'Villa'),
        ('commercial', 'Commercial'),
        ('land', 'Land'),
        ('office', 'Office Space'),
        ('warehouse', 'Warehouse'),
        ('farm', 'Farm'),
        ('hotel', 'Hotel'),
        ('other', 'Other'),
    )
    
    PROPERTY_STATUS = (
        ('available', 'Available'),
        ('pending', 'Pending'),
        ('sold', 'Sold'),
        ('rented', 'Rented'),
        ('off_market', 'Off Market'),
    )
    
    LISTING_TYPES = (
        ('for_sale', 'For Sale'),
        ('for_rent', 'For Rent'),
        ('for_lease', 'For Lease'),
        ('auction', 'Auction'),
    )
    
    FURNISHING_TYPES = (
        ('unfurnished', 'Unfurnished'),
        ('semi_furnished', 'Semi-Furnished'),
        ('fully_furnished', 'Fully Furnished'),
    )
    
    # Basic Information
    property_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    title = models.CharField(max_length=200)
    title_amharic = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    description_amharic = models.TextField(blank=True)
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES)
    listing_type = models.CharField(max_length=20, choices=LISTING_TYPES, default='for_sale')
    property_status = models.CharField(max_length=20, choices=PROPERTY_STATUS, default='available')
    
    # Ownership and Management
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_properties')
    agent = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                            related_name='managed_properties')
    developer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                related_name='developed_properties')
    
    # Location
    city = models.ForeignKey(City, on_delete=models.CASCADE)
    sub_city = models.ForeignKey(SubCity, on_delete=models.CASCADE)
    specific_location = models.CharField(max_length=200)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    address_line_1 = models.CharField(max_length=200, blank=True)
    address_line_2 = models.CharField(max_length=200, blank=True)
    
    # Specifications
    bedrooms = models.IntegerField(
        validators=[MinValueValidator(0)],
        null=True,  # Allow null for commercial/land properties
        blank=True,
        default=0
    )
    bathrooms = models.IntegerField(
        validators=[MinValueValidator(0)],
        null=True,  # Allow null for commercial/land properties  
        blank=True,
        default=0
    )
    total_area = models.DecimalField(max_digits=10, decimal_places=2)  # in m²
    plot_size = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # in m²
    built_year = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1800), MaxValueValidator(2100)])
    floors = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    furnishing_type = models.CharField(max_length=20, choices=FURNISHING_TYPES, default='unfurnished')
    
    # Pricing
    price_etb = models.DecimalField(max_digits=15, decimal_places=2)
    price_usd = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    price_negotiable = models.BooleanField(default=False)
    monthly_rent = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    security_deposit = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    maintenance_fee = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    property_tax = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Features (ManyToMany for better querying)
    amenities = models.ManyToManyField(Amenity, related_name='properties', blank=True)
    
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
        upload_to='property_videos/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text='Upload property video tour'
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
        choices=[
            ('basic', 'Basic'),
            ('standard', 'Standard'),
            ('featured', 'Featured'),
            ('premium', 'Premium'),
            ('urgent', 'Urgent')
        ],
        default='basic'
    )
    promotion_start = models.DateTimeField(null=True, blank=True)
    promotion_end = models.DateTimeField(null=True, blank=True)
    promotion_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    is_promoted = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = _('property')
        verbose_name_plural = _('properties')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['property_type']),
            models.Index(fields=['listing_type']),
            models.Index(fields=['property_status']),
            models.Index(fields=['city', 'sub_city']),
            models.Index(fields=['price_etb']),
            models.Index(fields=['bedrooms']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_promoted', 'promotion_end']),
            models.Index(fields=['promotion_tier', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.price_etb} ETB"
    
    def get_price_display(self):
        if self.listing_type == 'for_rent':
            if self.monthly_rent:
                return f"{self.monthly_rent:,} ETB/month"
            return "Price not specified"
    
        if self.price_etb:
            return f"{self.price_etb:,} ETB"
        return "Price not specified"
    
    @property
    def price_per_sqm(self):
        if self.listing_type == 'for_rent':
            price = self.monthly_rent
        else:
            price = self.price_etb
    
        if price is None or price <= 0:
            return Decimal('0')
        if self.total_area is None or self.total_area <= 0:
            return Decimal('0')
    
        try:
            return price / self.total_area
        except (TypeError, ZeroDivisionError, decimal.InvalidOperation):
            return Decimal('0')

    @property
    def is_promotion_active(self):
        return self.is_promoted and self.promotion_end and self.promotion_end > timezone.now()
    
    @property
    def days_on_market(self):
        from django.utils import timezone
        if not self.listed_date:
            return 0
        return (timezone.now() - self.listed_date).days
    
    def increment_views(self):
        self.views_count += 1
        self.save(update_fields=['views_count'])

    @property
    def key_features(self):
        """Get key features for comparison"""
        features = []
        
        if self.has_parking:
            features.append('Parking')
        if self.has_garden:
            features.append('Garden')
        if self.has_security:
            features.append('Security')
        if self.has_furniture:
            features.append('Furnished')
        if self.has_air_conditioning:
            features.append('Air Conditioning')
        if self.has_elevator:
            features.append('Elevator')
        if self.is_pet_friendly:
            features.append('Pet Friendly')
        
        return features
    
    def get_comparison_data(self):
        """Get structured data for comparison"""
        return {
            'id': self.id,
            'title': self.title,
            'price': self.price_etb,
            'monthly_rent': self.monthly_rent,
            'price_per_sqm': self.price_per_sqm,
            'area': self.total_area,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'property_type': self.property_type,
            'listing_type': self.listing_type,
            'city': self.city.name if self.city else None,
            'sub_city': self.sub_city.name if self.sub_city else None,
            'features': self.key_features,
            'built_year': self.built_year,
            'is_verified': self.is_verified,
            'virtual_tour': bool(self.virtual_tour_url),
            'days_on_market': self.days_on_market,
            'images': [img.image.url for img in self.images.all()[:3]] if self.images.exists() else []
        }

class PropertyImage(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='property_images/%Y/%m/%d/')
    is_primary = models.BooleanField(default=False)
    caption = models.CharField(max_length=200, blank=True)
    alt_text = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)
    uploaded_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['order', '-is_primary']
        verbose_name = _('property image')
        verbose_name_plural = _('property images')
    
    def __str__(self):
        return f"Image for {self.property.title}"

class PropertyDocument(models.Model):
    DOCUMENT_TYPES = (
        ('title_deed', 'Title Deed'),
        ('construction_permit', 'Construction Permit'),
        ('occupancy_certificate', 'Occupancy Certificate'),
        ('floor_plan', 'Floor Plan'),
        ('site_plan', 'Site Plan'),
        ('other', 'Other'),
    )
    
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    document = models.FileField(upload_to='property_documents/%Y/%m/%d/')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = _('property document')
        verbose_name_plural = _('property documents')
    
    def __str__(self):
        return f"{self.document_type} - {self.property.title}"

class SavedSearch(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_searches')
    name = models.CharField(max_length=100)
    filters = models.JSONField()  # Store all filter criteria as JSON
    is_active = models.BooleanField(default=True)
    email_alerts = models.BooleanField(default=True)
    alert_frequency = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('instant', 'Instant'),
    ], default='daily')
    last_notified = models.DateTimeField(null=True, blank=True)
    match_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('saved search')
        verbose_name_plural = _('saved searches')
        unique_together = ['user', 'name']
    
    def __str__(self):
        return f"{self.user.email} - {self.name}"

class TrackedProperty(models.Model):
    TRACKING_TYPES = (
        ('homeowner', 'Homeowner'),
        ('landlord', 'Landlord'),
        ('interested', 'Interested'),
        ('comparison', 'Comparison'),
        ('investment', 'Investment'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tracked_properties')
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    tracking_type = models.CharField(max_length=20, choices=TRACKING_TYPES)
    notes = models.TextField(blank=True)
    notification_enabled = models.BooleanField(default=True)
    price_change_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=5.0)  # percentage
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = _('tracked property')
        verbose_name_plural = _('tracked properties')
        unique_together = ['user', 'property']
    
    def __str__(self):
        return f"{self.user.email} tracks {self.property.title}"

class Inquiry(models.Model):
    INQUIRY_TYPES = (
        ('general', 'General Inquiry'),
        ('viewing', 'Viewing Request'),
        ('price', 'Price Inquiry'),
        ('details', 'More Details'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('contacted', 'Contacted'),
        ('viewing_scheduled', 'Viewing Scheduled'),
        ('follow_up', 'Follow Up Required'),
        ('closed', 'Closed'),
        ('spam', 'Spam'),
    )
    
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='inquiries')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inquiries')
    inquiry_type = models.CharField(max_length=20, choices=INQUIRY_TYPES, default='general')
    message = models.TextField()
    contact_preference = models.CharField(max_length=20, choices=[
        ('call', 'Call'),
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
        ('any', 'Any'),
    ], default='any')
    
    # Contact Information (in case user is not logged in)
    full_name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                  related_name='assigned_inquiries')
    priority = models.CharField(max_length=10, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ], default='medium')
    
    # Response tracking
    response_sent = models.BooleanField(default=False)
    response_notes = models.TextField(blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('inquiry')
        verbose_name_plural = _('inquiries')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Inquiry for {self.property.title} by {self.user.email if self.user else self.email}"

class PropertyView(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='property_views')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    session_id = models.CharField(max_length=100, blank=True)
    viewed_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = _('property view')
        verbose_name_plural = _('property views')
        indexes = [
            models.Index(fields=['property', 'viewed_at']),
            models.Index(fields=['user', 'viewed_at']),
        ]
    
    def __str__(self):
        return f"View of {self.property.title} at {self.viewed_at}"

class PropertyComparison(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='property_comparisons')
    name = models.CharField(max_length=100, blank=True)
    properties = models.ManyToManyField(Property, related_name='comparisons')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('property comparison')
        verbose_name_plural = _('property comparisons')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Comparison by {self.user.email} ({self.properties.count()} properties)"

class ComparisonSession(models.Model):
    session_id = models.CharField(max_length=100)
    properties = models.ManyToManyField(Property)
    created_at = models.DateTimeField(default=timezone.now)
    last_accessed = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('comparison session')
        verbose_name_plural = _('comparison sessions')