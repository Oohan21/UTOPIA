from rest_framework import serializers
from .models import MarketTrend, CityAnalytics, UserAnalytics, PlatformAnalytics
from real_estate.serializers import CitySerializer

class MarketTrendSerializer(serializers.ModelSerializer):
    date = serializers.DateField(format="%Y-%m-%d")
    
    class Meta:
        model = MarketTrend
        fields = '__all__'

class CityAnalyticsSerializer(serializers.ModelSerializer):
    city = CitySerializer(read_only=True)
    city_id = serializers.IntegerField(write_only=True)
    period_start = serializers.DateField(format="%Y-%m-%d")
    period_end = serializers.DateField(format="%Y-%m-%d")
    
    class Meta:
        model = CityAnalytics
        fields = '__all__'

class UserAnalyticsSerializer(serializers.ModelSerializer):
    date = serializers.DateField(format="%Y-%m-%d")
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = UserAnalytics
        fields = '__all__'

class PlatformAnalyticsSerializer(serializers.ModelSerializer):
    date = serializers.DateField(format="%Y-%m-%d")
    
    class Meta:
        model = PlatformAnalytics
        fields = '__all__'

class MarketOverviewSerializer(serializers.Serializer):
    """Market overview summary"""
    total_listings = serializers.IntegerField()
    active_listings = serializers.IntegerField()
    new_listings_today = serializers.IntegerField()
    average_price = serializers.DecimalField(max_digits=15, decimal_places=2)
    price_change_weekly = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_views_today = serializers.IntegerField()
    total_inquiries_today = serializers.IntegerField()
    market_health = serializers.CharField()
    top_performing_cities = serializers.JSONField()
    property_type_distribution = serializers.JSONField()
    price_distribution = serializers.JSONField()

class PriceAnalysisSerializer(serializers.Serializer):
    """Price analysis data"""
    price_range = serializers.JSONField()
    average_prices_by_city = serializers.JSONField()
    average_prices_by_property_type = serializers.JSONField()
    price_trends = serializers.JSONField()
    price_forecast = serializers.JSONField()

class DemandAnalysisSerializer(serializers.Serializer):
    """Demand analysis data"""
    demand_by_city = serializers.JSONField()
    demand_by_property_type = serializers.JSONField()
    view_to_inquiry_ratio = serializers.JSONField()
    days_on_market_average = serializers.JSONField()
    seasonal_trends = serializers.JSONField()