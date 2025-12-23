from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Avg, Count, Sum, Max, Min
from decimal import Decimal

User = get_user_model()

class MarketTrend(models.Model):
    """Daily market trend analysis"""
    date = models.DateField(unique=True)
    
    # Overall market metrics
    total_listings = models.IntegerField(default=0)
    active_listings = models.IntegerField(default=0)
    new_listings = models.IntegerField(default=0)
    sold_listings = models.IntegerField(default=0)
    rented_listings = models.IntegerField(default=0)
    
    # Price metrics
    average_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    median_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    min_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    max_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Demand metrics
    total_views = models.IntegerField(default=0)
    total_inquiries = models.IntegerField(default=0)
    average_days_on_market = models.IntegerField(default=0)
    
    # Price changes
    price_change_daily = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_change_weekly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_change_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Market health indicators
    inventory_months = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    absorption_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_to_rent_ratio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rental_yield = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        verbose_name = 'Market Trend'
        verbose_name_plural = 'Market Trends'
    
    def __str__(self):
        return f"Market Trend - {self.date}"
    
    @classmethod
    def generate_daily_trend(cls):
        """Generate daily market trend analysis"""
        from real_estate.models import Property
        from datetime import date, timedelta
        
        today = date.today()
        yesterday = today - timedelta(days=1)
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Get properties
        properties = Property.objects.filter(is_active=True)
        new_properties = properties.filter(created_at__date=today)
        sold_properties = properties.filter(property_status='sold', updated_at__date=today)
        rented_properties = properties.filter(property_status='rented', updated_at__date=today)
        
        # Calculate metrics
        total_listings = properties.count()
        active_listings = properties.filter(property_status='available').count()
        
        # Price calculations
        sale_properties = properties.filter(listing_type='for_sale', price_etb__gt=0)
        rent_properties = properties.filter(listing_type='for_rent', monthly_rent__gt=0)
        
        avg_price = sale_properties.aggregate(avg=Avg('price_etb'))['avg'] or Decimal('0')
        
        # Calculate price changes
        yesterday_trend = cls.objects.filter(date=yesterday).first()
        week_ago_trend = cls.objects.filter(date=week_ago).first()
        month_ago_trend = cls.objects.filter(date=month_ago).first()
        
        price_change_daily = Decimal('0')
        price_change_weekly = Decimal('0')
        price_change_monthly = Decimal('0')
        
        if yesterday_trend and yesterday_trend.average_price > 0:
            price_change_daily = ((avg_price - yesterday_trend.average_price) / yesterday_trend.average_price) * 100
        
        if week_ago_trend and week_ago_trend.average_price > 0:
            price_change_weekly = ((avg_price - week_ago_trend.average_price) / week_ago_trend.average_price) * 100
        
        if month_ago_trend and month_ago_trend.average_price > 0:
            price_change_monthly = ((avg_price - month_ago_trend.average_price) / month_ago_trend.average_price) * 100
        
        # Market health indicators (simplified calculations)
        inventory_months = Decimal('0')
        if sold_properties.count() > 0:
            inventory_months = Decimal(total_listings) / Decimal(sold_properties.count())
        
        absorption_rate = Decimal('0')
        if total_listings > 0:
            absorption_rate = (Decimal(sold_properties.count()) / Decimal(total_listings)) * 100
        
        # Create trend record
        trend = cls.objects.create(
            date=today,
            total_listings=total_listings,
            active_listings=active_listings,
            new_listings=new_properties.count(),
            sold_listings=sold_properties.count(),
            rented_listings=rented_properties.count(),
            average_price=avg_price,
            median_price=avg_price,  # Simplified median
            min_price=sale_properties.aggregate(min=Min('price_etb'))['min'] or Decimal('0'),
            max_price=sale_properties.aggregate(max=Max('price_etb'))['max'] or Decimal('0'),
            total_views=properties.aggregate(total=Sum('views_count'))['total'] or 0,
            total_inquiries=properties.aggregate(total=Sum('inquiry_count'))['total'] or 0,
            price_change_daily=price_change_daily,
            price_change_weekly=price_change_weekly,
            price_change_monthly=price_change_monthly,
            inventory_months=inventory_months,
            absorption_rate=absorption_rate,
            price_to_rent_ratio=Decimal('20.0'),  # Default value
            rental_yield=Decimal('5.2'),  # Default value
        )
        
        return trend

class CityAnalytics(models.Model):
    """City-level market analytics"""
    city = models.ForeignKey('real_estate.City', on_delete=models.CASCADE, related_name='analytics')
    period_start = models.DateField()
    period_end = models.DateField()
    period_type = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
    ])
    
    # Property metrics
    total_properties = models.IntegerField(default=0)
    properties_for_sale = models.IntegerField(default=0)
    properties_for_rent = models.IntegerField(default=0)
    
    # Price metrics
    avg_sale_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    avg_rent_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    price_per_sqm = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Demand metrics
    total_views = models.IntegerField(default=0)
    total_inquiries = models.IntegerField(default=0)
    avg_days_on_market = models.IntegerField(default=0)
    
    # Market movement
    properties_sold = models.IntegerField(default=0)
    properties_rented = models.IntegerField(default=0)
    
    # Trends
    price_trend = models.CharField(max_length=20, choices=[
        ('rising', 'Rising'),
        ('falling', 'Falling'),
        ('stable', 'Stable'),
    ], default='stable')
    demand_trend = models.CharField(max_length=20, choices=[
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ], default='medium')
    
    # Insights
    key_insights = models.JSONField(default=dict)
    recommendations = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['city', 'period_start', 'period_end', 'period_type']
        ordering = ['-period_end']
    
    def __str__(self):
        return f"{self.city.name} Analytics - {self.period_start} to {self.period_end}"

class UserAnalytics(models.Model):
    """User behavior analytics"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analytics')
    date = models.DateField()
    
    # Activity metrics
    login_count = models.IntegerField(default=0)
    property_views = models.IntegerField(default=0)
    property_saves = models.IntegerField(default=0)
    searches_performed = models.IntegerField(default=0)
    inquiries_sent = models.IntegerField(default=0)
    
    # Time metrics
    total_session_time = models.IntegerField(default=0)  # in minutes
    avg_session_time = models.IntegerField(default=0)    # in minutes
    
    # Conversion metrics
    properties_listed = models.IntegerField(default=0)
    promotions_purchased = models.IntegerField(default=0)
    total_spent = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Preferences
    most_viewed_property_types = models.JSONField(default=list)
    preferred_locations = models.JSONField(default=list)
    price_range_preference = models.JSONField(default=dict)
    
    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.email} Analytics - {self.date}"

class PlatformAnalytics(models.Model):
    """Overall platform analytics"""
    date = models.DateField(unique=True)
    
    # User metrics
    total_users = models.IntegerField(default=0)
    new_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    user_growth_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Property metrics
    total_properties = models.IntegerField(default=0)
    verified_properties = models.IntegerField(default=0)
    featured_properties = models.IntegerField(default=0)
    promoted_properties = models.IntegerField(default=0)
    
    # Engagement metrics
    total_page_views = models.IntegerField(default=0)
    avg_session_duration = models.IntegerField(default=0)  # in seconds
    bounce_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Transaction metrics
    total_inquiries = models.IntegerField(default=0)
    successful_contacts = models.IntegerField(default=0)
    total_promotions = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Performance metrics
    api_response_time = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # in ms
    error_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    server_uptime = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
        verbose_name_plural = 'Platform Analytics'
    
    def __str__(self):
        return f"Platform Analytics - {self.date}"