# users/models.py (FIXED VERSION)
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from django.utils import timezone
import uuid

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('user_type', 'admin')
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_verified', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    USER_TYPES = (
        ('admin', 'Administrator'),
        ('user', 'User'),
    )
    
    # Make email field unique and use it as username
    email = models.EmailField(_('email address'), unique=True)
    username = models.CharField(_('username'), max_length=150, unique=False, blank=True, null=True)
    
    # User details
    user_type = models.CharField(max_length=20, choices=USER_TYPES, default='user')
    
    # Phone validation for Ethiopian numbers
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+251911223344'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(
        validators=[phone_regex], 
        max_length=17, 
        unique=True,
        blank=True,
        null=True
    )
    
    # Profile
    profile_picture = models.ImageField(
        upload_to='profiles/%Y/%m/%d/', 
        null=True, 
        blank=True,
        default='profiles/default.png'
    )
    bio = models.TextField(blank=True)
    
    # Preferences
    language_preference = models.CharField(max_length=10, default='en', choices=[('en', 'English'), ('am', 'Amharic')])
    currency_preference = models.CharField(max_length=10, default='ETB', choices=[('ETB', 'ETB'), ('USD', 'USD')])
    notification_enabled = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    
    # Verification
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    verification_sent_at = models.DateTimeField(null=True, blank=True)
    
    # User specific fields
    occupation = models.CharField(max_length=100, blank=True)
    company = models.CharField(max_length=200, blank=True)
    
    # Status
    is_approved = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    is_premium = models.BooleanField(default=False)
    premium_expiry = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    registration_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    # Analytics fields
    last_activity = models.DateTimeField(null=True, blank=True)
    total_logins = models.IntegerField(default=0)
    total_properties_viewed = models.IntegerField(default=0)
    total_properties_saved = models.IntegerField(default=0)
    total_inquiries_sent = models.IntegerField(default=0)
    total_searches = models.IntegerField(default=0)

    reset_token = models.UUIDField(default=uuid.uuid4, editable=False, null=True, blank=True)
    reset_token_sent_at = models.DateTimeField(null=True, blank=True)
    reset_token_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Marketing fields
    referral_code = models.CharField(max_length=20, unique=True, blank=True, null=True)
    referred_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    marketing_source = models.CharField(max_length=50, blank=True)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['user_type']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.email} ({self.get_user_type_display()})"
    
    def save(self, *args, **kwargs):
        # If username is not set, use email (without domain) as username
        if not self.username and self.email:
            self.username = self.email.split('@')[0]
        
        # Ensure email is lowercase
        if self.email:
            self.email = self.email.lower()
        
        super().save(*args, **kwargs)
    
    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email
    
    @property
    def is_admin_user(self):
        return self.user_type == 'admin' or self.is_staff or self.is_superuser
    
    @property
    def can_list_properties(self):
        # All authenticated users can list properties
        return True
    
    @property
    def profile_completion_percentage(self):
        fields = ['first_name', 'last_name', 'phone_number', 'profile_picture', 'bio']
        completed = sum(1 for field in fields if getattr(self, field))
        return int((completed / len(fields)) * 100)

    def update_activity(self):
        """Update user's last activity timestamp"""
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])
    
    def increment_logins(self):
        """Increment login counter"""
        self.total_logins += 1
        self.save(update_fields=['total_logins'])
    
    def increment_property_views(self):
        """Increment property views counter"""
        self.total_properties_viewed += 1
        self.save(update_fields=['total_properties_viewed'])
    
    def increment_property_saves(self):
        """Increment property saves counter"""
        self.total_properties_saved += 1
        self.save(update_fields=['total_properties_saved'])

class UserProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='user_profile')
    
    # Personal details
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], blank=True)
    marital_status = models.CharField(max_length=20, choices=[
        ('single', 'Single'), ('married', 'Married'), ('divorced', 'Divorced'), ('widowed', 'Widowed')
    ], blank=True)
    
    # Address
    address = models.TextField(blank=True)
    city = models.ForeignKey(
        'real_estate.City', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='user_profiles'
    )
    sub_city = models.ForeignKey(
        'real_estate.SubCity', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='user_profiles'
    )
    postal_code = models.CharField(max_length=20, blank=True)
    
    # Professional details
    occupation = models.CharField(max_length=100, blank=True)
    company = models.CharField(max_length=200, blank=True)
    website = models.URLField(blank=True)
    
    # Social links
    facebook_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    
    # Preferences
    preferred_property_types = models.JSONField(default=list)  # List of preferred property types
    budget_range_min = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    budget_range_max = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    preferred_locations = models.JSONField(default=list)  # List of preferred locations
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('user profile')
        verbose_name_plural = _('user profiles')
    
    def __str__(self):
        return f"Profile for {self.user.email}"

class UserActivity(models.Model):
    ACTIVITY_TYPES = (
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('property_view', 'Property Viewed'),
        ('property_save', 'Property Saved'),
        ('property_unsave', 'Property Unsaved'),
        ('search', 'Search Performed'),
        ('inquiry', 'Inquiry Sent'),
        ('property_add', 'Property Added'),
        ('property_edit', 'Property Edited'),
        ('profile_update', 'Profile Updated'),
        ('valuation_request', 'Valuation Requested'),
        ('promotion_purchase', 'Promotion Purchased'),
        ('promotion_cancel', 'Promotion Cancelled'),
        ('message_sent', 'Message Sent'),
        ('message_received', 'Message Received'),
    )
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)  
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = _('user activity')
        verbose_name_plural = _('user activities')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'activity_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.get_activity_type_display()} - {self.created_at}"