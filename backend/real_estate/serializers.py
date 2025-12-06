# serializers.py
from rest_framework import serializers
from django.db.models import Min, Max, Avg
from .models import Property, PropertyImage, City, SubCity, Amenity, User, PropertyComparison

class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    """
    A ModelSerializer that takes an additional `fields` argument that
    controls which fields should be displayed.
    """
    def __init__(self, *args, **kwargs):
        # Don't pass the 'fields' arg up to the superclass
        fields = kwargs.pop('fields', None)

        # Instantiate the superclass normally
        super().__init__(*args, **kwargs)

        if fields is not None:
            # Drop any fields that are not specified in the `fields` argument.
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)

class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name', 'name_amharic', 'slug', 'is_capital', 'is_active']

class SubCitySerializer(serializers.ModelSerializer):
    city = CitySerializer(read_only=True)
    
    class Meta:
        model = SubCity
        fields = ['id', 'name', 'name_amharic', 'city', 'is_popular']

class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'is_primary', 'caption', 'alt_text', 'order']

class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ['id', 'name', 'name_amharic', 'amenity_type', 'icon', 'description']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone_number', 'user_type', 'is_verified']

class PropertySerializer(serializers.ModelSerializer):
    city = CitySerializer(read_only=True)
    sub_city = SubCitySerializer(read_only=True)
    owner = UserSerializer(read_only=True)
    agent = UserSerializer(read_only=True, allow_null=True)
    developer = UserSerializer(read_only=True, allow_null=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    images = PropertyImageSerializer(many=True, read_only=True)
    property_video = serializers.FileField(required=False, allow_null=True)
    
    price_per_sqm = serializers.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        read_only=True,
        source='get_price_per_sqm'
    )
    days_on_market = serializers.IntegerField(read_only=True, source='get_days_on_market')
    
    class Meta:
        model = Property
        fields = [
            'id', 'property_id', 'title', 'title_amharic', 'description', 'description_amharic',
            'property_type', 'listing_type', 'property_status', 'owner', 'agent', 'developer',
            'city', 'sub_city', 'specific_location', 'latitude', 'longitude',
            'address_line_1', 'address_line_2', 'bedrooms', 'bathrooms', 'total_area',
            'plot_size', 'built_year', 'floors', 'furnishing_type', 'price_etb',
            'price_usd', 'price_negotiable', 'monthly_rent', 'security_deposit',
            'maintenance_fee', 'property_tax', 'amenities', 'images',
            'has_parking', 'has_garden', 'has_security', 'has_furniture',
            'has_air_conditioning', 'has_heating', 'has_internet', 'has_generator',
            'has_elevator', 'has_swimming_pool', 'has_gym', 'has_conference_room',
            'is_pet_friendly', 'is_wheelchair_accessible', 'has_backup_water',
            'is_featured', 'is_verified', 'is_active', 'is_premium',
            'views_count', 'inquiry_count', 'save_count', 'virtual_tour_url',
            'video_url', 'has_title_deed', 'has_construction_permit',
            'has_occupancy_certificate', 'created_at', 'updated_at',
            'listed_date', 'expiry_date', 'property_video', 'price_per_sqm', 'days_on_market'
        ]

class ComparisonPropertySerializer(PropertySerializer):
    """Simplified property serializer for comparison"""
    class Meta:
        model = Property
        fields = [
            'id', 'property_id', 'title', 'property_type', 'listing_type',
            'city', 'sub_city', 'bedrooms', 'bathrooms', 'total_area',
            'price_etb', 'monthly_rent', 'price_per_sqm', 'built_year',
            'has_parking', 'has_garden', 'has_security', 'has_furniture',
            'has_air_conditioning', 'has_generator', 'has_elevator',
            'is_pet_friendly', 'virtual_tour_url', 'is_verified'
        ]

class PropertyComparisonSerializer(DynamicFieldsModelSerializer):
    properties = ComparisonPropertySerializer(many=True, read_only=True)
    comparison_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyComparison
        fields = ['id', 'name', 'properties', 'comparison_summary', 'created_at', 'updated_at']
        read_only_fields = ['user']
    
    def get_comparison_summary(self, obj):
        properties = obj.properties.all()
        if properties.count() == 0:
            return {}
        
        summary = {
            'count': properties.count(),
            'price_range': {
                'min': properties.aggregate(min=Min('price_etb'))['min'],
                'max': properties.aggregate(max=Max('price_etb'))['max'],
                'avg': properties.aggregate(avg=Avg('price_etb'))['avg'],
            },
            'area_range': {
                'min': properties.aggregate(min=Min('total_area'))['min'],
                'max': properties.aggregate(max=Max('total_area'))['max'],
                'avg': properties.aggregate(avg=Avg('total_area'))['avg'],
            },
            'bedrooms_range': {
                'min': properties.aggregate(min=Min('bedrooms'))['min'],
                'max': properties.aggregate(max=Max('bedrooms'))['max'],
                'avg': properties.aggregate(avg=Avg('bedrooms'))['avg'],
            },
        }
        return summary

class ComparisonMatrixSerializer(serializers.Serializer):
    """Serializer for comparison matrix data"""
    fields = serializers.ListField(child=serializers.CharField())
    properties = ComparisonPropertySerializer(many=True)
    matrix = serializers.DictField()

class AddToComparisonSerializer(serializers.Serializer):
    property_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=10
    )