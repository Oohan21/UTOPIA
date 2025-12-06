# api/serializers.py (FIXED VERSION)
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from users.models import CustomUser, UserProfile, UserActivity
from real_estate.models import (
    City, SubCity, Property, PropertyImage, Amenity,
    SavedSearch, TrackedProperty, Inquiry, PropertyView, PropertyComparison, ComparisonSession
)
from api.models import MarketStats, PropertyValuation, Notification, AuditLog

User = get_user_model()

class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    """
    A ModelSerializer that takes an additional `fields` argument that
    controls which fields should be displayed.
    """
    def __init__(self, *args, **kwargs):
        fields = kwargs.pop('fields', None)
        super().__init__(*args, **kwargs)

        if fields is not None:
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['user_type'] = user.user_type
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['is_verified'] = user.is_verified
        
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Get tokens
        refresh = self.get_token(self.user)
        
        # Add extra responses
        data.update({
            'user': UserSerializer(self.user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Login successful'
        })
        
        return data

class UserProfileSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['user']

class UserSerializer(DynamicFieldsModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    profile_completion = serializers.ReadOnlyField(source='profile_completion_percentage')
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'user_type',
            'phone_number', 'profile_picture', 'bio', 'language_preference',
            'currency_preference', 'is_verified', 'is_active', 'is_premium',
            'occupation', 'company', 'profile', 'profile_completion',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_verified', 'is_active', 'created_at', 'updated_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone_number', 'user_type',
            'password', 'password2'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'phone_number': {'required': True},
            'user_type': {'required': False, 'default': 'user'},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Ensure user_type is either 'admin' or 'user', default to 'user'
        user_type = attrs.get('user_type', 'user')
        if user_type not in ['admin', 'user']:
            attrs['user_type'] = 'user'
        
        return attrs
    
    def create(self, validated_data):
        # Ensure user_type is valid
        user_type = validated_data.get('user_type', 'user')
        if user_type not in ['admin', 'user']:
            validated_data['user_type'] = 'user'
        
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        # Log activity
        UserActivity.objects.create(
            user=user,
            activity_type='profile_update',
            ip_address=self.context['request'].META.get('REMOTE_ADDR'),
            user_agent=self.context['request'].META.get('HTTP_USER_AGENT', '')
        )
        
        return user

# Real estate serializers
class CitySerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = City
        fields = '__all__'

class SubCitySerializer(DynamicFieldsModelSerializer):
    city = CitySerializer(read_only=True)
    
    class Meta:
        model = SubCity
        fields = '__all__'

class AmenitySerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = Amenity
        fields = '__all__'

class PropertyImageSerializer(DynamicFieldsModelSerializer):
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = PropertyImage
        fields = ['id', 'image', 'is_primary', 'caption', 'alt_text', 'order', 'uploaded_at']
    
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        elif obj.image:
            return obj.image.url
        return None

class PropertySerializer(DynamicFieldsModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    property_video = serializers.FileField(required=False, allow_null=True)
    city = CitySerializer(read_only=True)
    sub_city = SubCitySerializer(read_only=True)
    owner = UserSerializer(read_only=True)
    agent = UserSerializer(read_only=True)
    amenities = AmenitySerializer(many=True, read_only=True)
    
    # Computed fields
    price_per_sqm = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    days_on_market = serializers.IntegerField(read_only=True)
    price_display = serializers.CharField(read_only=True, source='get_price_display')
    
    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = [
            'property_id', 'views_count', 'inquiry_count', 'save_count',
            'created_at', 'updated_at', 'listed_date', 'days_on_market'
        ]

# api/serializers.py - UPDATED PropertyCreateSerializer
class PropertyCreateSerializer(DynamicFieldsModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    property_video = serializers.FileField(required=False, allow_null=True)
    amenities = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Amenity.objects.all(),
        required=False
    )
    
    class Meta:
        model = Property
        exclude = ['owner', 'views_count', 'inquiry_count', 'save_count']
        read_only_fields = ['property_id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Extract many-to-many fields first
        amenities_data = validated_data.pop('amenities', [])
        images = validated_data.pop('images', [])
        property_video = validated_data.pop('property_video', None)
        
        # Create the property instance
        property_obj = Property.objects.create(**validated_data)
        
        # Add amenities (many-to-many)
        if amenities_data:
            property_obj.amenities.set(amenities_data)
        
        # Add video if provided
        if property_video:
            property_obj.property_video = property_video
            property_obj.save()
        
        # Add images
        for i, image in enumerate(images):
            PropertyImage.objects.create(
                property=property_obj,
                image=image,
                is_primary=(i == 0),
                order=i
            )
        
        return property_obj

    def update(self, instance, validated_data):
        # Extract many-to-many fields first
        amenities_data = validated_data.pop('amenities', None)
        images = validated_data.pop('images', [])
        property_video = validated_data.pop('property_video', None)
        
        # Update video if provided
        if property_video is not None:
            instance.property_video = property_video
        
        # Update instance fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Update amenities if provided
        if amenities_data is not None:
            instance.amenities.set(amenities_data)
        
        # Handle images if provided
        if images:
            # Delete existing images and add new ones
            instance.images.all().delete()
            for i, image in enumerate(images):
                PropertyImage.objects.create(
                    property=instance,
                    image=image,
                    is_primary=(i == 0),
                    order=i
                )
        
        return instance

class SavedSearchSerializer(DynamicFieldsModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = SavedSearch
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at', 'last_notified', 'match_count']

class TrackedPropertySerializer(DynamicFieldsModelSerializer):
    property = PropertySerializer(read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TrackedProperty
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

class InquirySerializer(DynamicFieldsModelSerializer):
    property = PropertySerializer(read_only=True)
    user = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    
    class Meta:
        model = Inquiry
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at', 'responded_at']

# API models serializers
class MarketStatsSerializer(DynamicFieldsModelSerializer):
    city = CitySerializer(read_only=True)
    sub_city = SubCitySerializer(read_only=True)
    
    class Meta:
        model = MarketStats
        fields = '__all__'

class PropertyValuationSerializer(DynamicFieldsModelSerializer):
    city = CitySerializer(read_only=True)
    sub_city = SubCitySerializer(read_only=True)
    
    class Meta:
        model = PropertyValuation
        fields = '__all__'
        read_only_fields = ['valuation_date']

class NotificationSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['created_at', 'read_at', 'sent_at']

class AuditLogSerializer(DynamicFieldsModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = ['created_at']

# Dashboard serializers
class DashboardStatsSerializer(serializers.Serializer):
    total_properties = serializers.IntegerField()
    total_users = serializers.IntegerField()
    total_inquiries = serializers.IntegerField()
    total_valuations = serializers.IntegerField()
    revenue_month = serializers.DecimalField(max_digits=15, decimal_places=2)
    revenue_growth = serializers.DecimalField(max_digits=5, decimal_places=2)
    
    # Property types distribution
    property_type_distribution = serializers.DictField(
        child=serializers.IntegerField()
    )
    
    # Recent activities
    recent_activities = serializers.ListField()

class UserDashboardSerializer(serializers.Serializer):
    listed_properties = serializers.IntegerField()
    saved_properties = serializers.IntegerField()
    saved_searches = serializers.IntegerField()
    inquiries_sent = serializers.IntegerField()
    profile_completion = serializers.IntegerField()
    
    # Recent properties
    recent_properties = PropertySerializer(many=True)
    
    # Recent inquiries
    recent_inquiries = InquirySerializer(many=True)
    
    # Market insights
    market_insights = serializers.DictField()

# Comparison serializers
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
        
        from django.db.models import Min, Max, Avg
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