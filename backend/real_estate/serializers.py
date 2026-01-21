# serializers.py
from rest_framework import serializers
from django.db.models import Min, Max, Avg
import decimal
from .models import Property, PropertyImage, City, SubCity, Amenity, User, PropertyComparison, SavedSearch, SearchHistory

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
        fields = ['id', 'name', 'name_amharic', 'description', 'slug', 
                 'latitude', 'longitude', 'is_capital', 'is_active', 'featured_image']

class SubCitySerializer(serializers.ModelSerializer):
    city = CitySerializer(read_only=True)
    city_id = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(),
        source='city',
        write_only=True
    )
    city_name = serializers.SerializerMethodField() 
    class Meta:
        model = SubCity
        fields = ['id', 'city', 'city_id', 'city_name', 'name', 'name_amharic', 'description',
                 'zip_code', 'population_density', 'average_price_per_sqm',
                 'is_popular', 'created_at', 'updated_at']

    def get_city_name(self, obj):
        # Return the city name from the related City object
        return obj.city.name if obj.city else None

class PropertyImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'is_primary', 'caption', 'alt_text', 'order', 'uploaded_at']
    
    def get_image(self, obj):
        request = self.context.get('request')
        
        if obj.image:
            # Return absolute URL if we have a request context
            if request:
                return request.build_absolute_uri(obj.image.url)
            # Otherwise return the relative URL
            return obj.image.url
        return None

class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ['id', 'name', 'name_amharic', 'amenity_type', 'icon', 
                 'description', 'is_active', 'created_at']

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
    latitude = serializers.DecimalField(
        max_digits=10, 
        decimal_places=8, 
        required=False, 
        allow_null=True,
        min_value=-90,
        max_value=90
    )
    
    longitude = serializers.DecimalField(
        max_digits=11, 
        decimal_places=8, 
        required=False, 
        allow_null=True,
        min_value=-180,
        max_value=180
    )
    
    price_per_sqm = serializers.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        read_only=True,
    )
    days_on_market = serializers.IntegerField(read_only=True, source='get_days_on_market')
    is_active = serializers.BooleanField(default=True, write_only=True)
    is_saved = serializers.SerializerMethodField()
    save_count = serializers.IntegerField(read_only=True)
    inquiry_count = serializers.IntegerField(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='owner',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Property
        fields = [
            'id', 'property_id', 'title', 'title_amharic', 'description', 'description_amharic',
            'property_type', 'listing_type', 'property_status', 'owner', 'agent', 'developer',
            'city', 'sub_city', 'specific_location',
            'address_line_1', 'address_line_2', 'latitude', 'longitude', 'bedrooms', 'bathrooms', 'total_area',
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
            'has_occupancy_certificate', 'created_at', 'updated_at', 'is_saved', 'owner_id',
            'listed_date', 'expiry_date', 'property_video', 'price_per_sqm', 'days_on_market'
        ]
        read_only_fields = ['views_count', 'inquiry_count', 'save_count', 'owner']

    def create(self, validated_data):
        # Set owner from request context if not provided
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['owner'] = request.user
        elif 'owner' not in validated_data:
            # If no owner provided and no request context, raise error
            raise serializers.ValidationError({"owner": "This field is required."})
        return super().create(validated_data)

    def get_images(self, obj):
        images = obj.images.all()
        return PropertyImageSerializer(images, many=True).data

    def validate(self, data):
        """Add validation for latitude/longitude"""
        errors = {}
        
        # Handle latitude validation
        if 'latitude' in data:
            lat = data['latitude']
            if lat is not None:
                try:
                    # Convert to Decimal if it's a string
                    if isinstance(lat, str):
                        lat = decimal.Decimal(lat)
                        data['latitude'] = lat
                    
                    if lat < decimal.Decimal('-90') or lat > decimal.Decimal('90'):
                        errors['latitude'] = ['Latitude must be between -90 and 90']
                except (decimal.InvalidOperation, ValueError):
                    errors['latitude'] = ['Invalid latitude value']
        
        # Handle longitude validation
        if 'longitude' in data:
            lon = data['longitude']
            if lon is not None:
                try:
                    # Convert to Decimal if it's a string
                    if isinstance(lon, str):
                        lon = decimal.Decimal(lon)
                        data['longitude'] = lon
                    
                    if lon < decimal.Decimal('-180') or lon > decimal.Decimal('180'):
                        errors['longitude'] = ['Longitude must be between -180 and 180']
                except (decimal.InvalidOperation, ValueError):
                    errors['longitude'] = ['Invalid longitude value']
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return data
    
    def to_internal_value(self, data):
        """Convert empty strings to None before validation"""
        # Create a mutable copy
        data = data.copy()
        
        # Handle latitude
        if 'latitude' in data:
            lat_value = data['latitude']
            if lat_value == '' or lat_value is None:
                data['latitude'] = None
        
        # Handle longitude
        if 'longitude' in data:
            lon_value = data['longitude']
            if lon_value == '' or lon_value is None:
                data['longitude'] = None
        
        return super().to_internal_value(data)

    def get_is_saved(self, obj):
        """
        Check if the current user has saved this property
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.is_saved_by_user(request.user)
        return False

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
    property_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Property.objects.all(),
        source='properties',
        write_only=True,
        required=False
    )
    comparison_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyComparison
        fields = ['id', 'name', 'properties', 'property_ids', 'comparison_summary', 'created_at', 'updated_at']
        read_only_fields = ['user']
    
    def create(self, validated_data):
        # Extract properties from validated_data
        properties = validated_data.pop('properties', [])
        
        # Get user from request context
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        
        # Create the comparison
        comparison = PropertyComparison.objects.create(**validated_data)
        
        # Add properties if any
        if properties:
            comparison.properties.set(properties)
        
        return comparison

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

# serializers.py - Update SearchHistorySerializer

class SearchHistorySerializer(serializers.ModelSerializer):
    """Serializer for SearchHistory model"""
    clicked_result_title = serializers.CharField(source='clicked_result.title', read_only=True)
    clicked_result_price = serializers.DecimalField(
        source='clicked_result.price_etb', 
        max_digits=15, 
        decimal_places=2, 
        read_only=True
    )
    clicked_result_image = serializers.SerializerMethodField()
    
    # Add promotion fields if needed
    clicked_promotion_tier = serializers.CharField(
        source='clicked_promotion.tier.tier_type',
        read_only=True
    )
    promotion_tier_display = serializers.CharField(
        source='promotion_tier',
        read_only=True
    )
    
    class Meta:
        model = SearchHistory
        fields = [
            'id', 'user', 'query', 'filters', 'search_type', 'results_count',
            'session_id', 'ip_address', 'user_agent',
            'clicked_result', 'clicked_result_title', 'clicked_result_price', 'clicked_result_image',
            'clicked_promotion', 'clicked_promotion_tier',
            'price_alert_set', 'price_alert_threshold', 'search_duration',
            'latitude', 'longitude', 'radius_km', 'promotion_tier', 'promotion_tier_display',
            'promoted_only', 'sort_by', 'page', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user', 'session_id', 'ip_address', 'user_agent']
    
    def get_clicked_result_image(self, obj):
        """Get primary image of clicked property"""
        if obj.clicked_result and obj.clicked_result.images.exists():
            primary_image = obj.clicked_result.images.filter(is_primary=True).first()
            if primary_image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(primary_image.image.url)
                return primary_image.image.url
            first_image = obj.clicked_result.images.first()
            if first_image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first_image.image.url)
                return first_image.image.url
        return None
    
    def to_representation(self, instance):
        """Custom representation to include filter breakdown and promotion info"""
        representation = super().to_representation(instance)
        
        # Add filter breakdown for easy frontend consumption
        filters = representation.get('filters', {})
        if filters:
            filter_breakdown = []
            
            if filters.get('property_type'):
                type_map = dict(Property.PROPERTY_TYPES)
                prop_type = filters['property_type']
                display_type = type_map.get(prop_type, prop_type.replace('_', ' ').title())
                filter_breakdown.append(f"Type: {display_type}")
            
            if filters.get('city'):
                try:
                    city = City.objects.get(id=filters['city'])
                    filter_breakdown.append(f"City: {city.name}")
                except City.DoesNotExist:
                    filter_breakdown.append(f"City ID: {filters['city']}")
            
            if filters.get('sub_city'):
                try:
                    sub_city = SubCity.objects.get(id=filters['sub_city'])
                    filter_breakdown.append(f"Area: {sub_city.name}")
                except SubCity.DoesNotExist:
                    filter_breakdown.append(f"Area ID: {filters['sub_city']}")
            
            if filters.get('min_price') and filters.get('max_price'):
                filter_breakdown.append(f"Price: {filters['min_price']:,} - {filters['max_price']:,} ETB")
            elif filters.get('min_price'):
                filter_breakdown.append(f"Min Price: {filters['min_price']:,} ETB")
            elif filters.get('max_price'):
                filter_breakdown.append(f"Max Price: {filters['max_price']:,} ETB")
            
            if filters.get('bedrooms'):
                filter_breakdown.append(f"Bedrooms: {filters['bedrooms']}+")
            
            if filters.get('has_parking'):
                filter_breakdown.append("Parking")
            
            if filters.get('is_featured'):
                filter_breakdown.append("Featured")
            
            if filters.get('is_verified'):
                filter_breakdown.append("Verified")
            
            # Add promotion filters if present
            if representation.get('promoted_only'):
                filter_breakdown.append("Promoted Only")
            elif representation.get('promotion_tier'):
                tier_map = {
                    'basic': 'Basic Tier',
                    'standard': 'Standard Tier', 
                    'premium': 'Premium Tier'
                }
                tier_name = tier_map.get(representation['promotion_tier'], representation['promotion_tier'].title())
                filter_breakdown.append(tier_name)
            
            representation['filter_breakdown'] = filter_breakdown
        
        return representation
    
    def create(self, validated_data):
        """Create search history with user context"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        
        # Extract filters from query if not provided
        if not validated_data.get('filters') and validated_data.get('query'):
            validated_data['filters'] = {'search': validated_data['query']}
        
        return super().create(validated_data)


class SavedSearchSerializer(serializers.ModelSerializer):
    """Serializer for SavedSearch model"""
    last_match_date = serializers.DateTimeField(source='last_notified', read_only=True)
    filter_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = SavedSearch
        fields = [
            'id', 'name', 'filters', 'filter_summary',
            'is_active', 'email_alerts', 'alert_frequency',
            'last_match_date', 'match_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'match_count', 'last_notified']
    
    def get_filter_summary(self, obj):
        """Create a human-readable filter summary"""
        filters = obj.filters
        summary_parts = []
        
        if filters.get('property_type'):
            summary_parts.append(filters['property_type'].replace('_', ' ').title())
        
        if filters.get('city'):
            # You might want to fetch city name here
            summary_parts.append(f"in {filters['city']}")
        
        if filters.get('min_price') and filters.get('max_price'):
            summary_parts.append(f"Price: {filters['min_price']:,} - {filters['max_price']:,} ETB")
        elif filters.get('min_price'):
            summary_parts.append(f"Min: {filters['min_price']:,} ETB")
        elif filters.get('max_price'):
            summary_parts.append(f"Max: {filters['max_price']:,} ETB")
        
        if filters.get('bedrooms'):
            summary_parts.append(f"{filters['bedrooms']}+ bedrooms")
        
        if filters.get('has_parking'):
            summary_parts.append("Parking")
        
        if filters.get('is_featured'):
            summary_parts.append("Featured")
        
        return ' • '.join(summary_parts)
    
    def validate_filters(self, value):
        """Validate filter structure"""
        # Basic validation to ensure filters are a dict
        if not isinstance(value, dict):
            raise serializers.ValidationError("Filters must be a JSON object")
        
        # You can add more specific validation here
        return value