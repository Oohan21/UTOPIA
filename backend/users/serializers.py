from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserActivity, CustomUser, UserProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(
        required=False,
        allow_null=True,
        max_length=None,
        allow_empty_file=False,
        use_url=True,
    )
    created_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S')

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'user_type',
            'phone_number', 'profile_picture', 'bio', 'is_verified', 'is_active', 'is_premium',
            'created_at', 'updated_at', 'is_staff', 'is_superuser', 'is_admin_user',
            'last_activity', 'total_logins', 'total_properties_viewed',
            'total_properties_saved', 'total_inquiries_sent', 'total_searches'
        ]
        read_only_fields = ["id", "email", "user_type", 'created_at', 'updated_at']

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            # Get request from context
            request = self.context.get('request')
            if request:
                # Return absolute URL
                return request.build_absolute_uri(obj.profile_picture.url)
            else:
                # Fallback: build URL manually
                from django.conf import settings
                base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
                # Replace /api with base URL for Django media
                media_base = base_url.replace('/api', '')
                return f"{media_base}{obj.profile_picture.url}"
        return None


    def update(self, instance, validated_data):
        # Handle profile picture
        profile_picture = validated_data.get("profile_picture")

        if profile_picture is not None:
            if profile_picture == "" or profile_picture is False:
                # Clear the profile picture
                instance.profile_picture.delete(save=False)
                instance.profile_picture = None
            else:
                # Set new profile picture
                instance.profile_picture = profile_picture

        # Update other fields
        for attr, value in validated_data.items():
            if attr != "profile_picture":
                setattr(instance, attr, value)

        instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "user_type",
            "password",
            "password2",
        ]
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
            "phone_number": {"required": True},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

class UserActivitySerializer(serializers.ModelSerializer):
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = UserActivity
        fields = [
            'id', 
            'activity_type', 
            'activity_type_display',
            'ip_address',
            'user_agent',
            'metadata',
            'created_at',
            'user_email'
        ]
        read_only_fields = ['id', 'created_at']

class UserActivityCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = ['activity_type', 'metadata']
        extra_kwargs = {
            'metadata': {'required': False, 'default': dict}
        }

class UserActivitiesResponseSerializer(serializers.Serializer):
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    results = UserActivitySerializer(many=True)

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True)
    
    def validate_current_password(self, value):
        # Optional: You can add specific validation for current password here
        return value
    
    def validate_new_password(self, value):
        # Add password strength validation
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long")
        
        # Optional: Add more strength validation
        if value.isdigit():
            raise serializers.ValidationError("Password cannot be entirely numeric")
        
        return value
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
            })
        
        # Check if new password is same as current password
        user = self.context['request'].user
        if user.check_password(data['new_password']):
            raise serializers.ValidationError({
                "new_password": "New password cannot be the same as current password"
            })
        
        return data


class DeleteAccountSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, max_length=1000)
    password = serializers.CharField(required=False, write_only=True)

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile (partial updates)"""
    class Meta:
        model = UserProfile
        fields = [
            'date_of_birth',
            'gender',
            'address',
            'city',
            'sub_city',
            'postal_code',
            'facebook_url',
            'twitter_url',
            'linkedin_url',
            'instagram_url',
            'preferred_property_types',
            'budget_range_min',
            'budget_range_max',
            'preferred_locations',
        ]
        read_only_fields = ['user']
        extra_kwargs = {
            'date_of_birth': {'required': False, 'allow_null': True},
            'gender': {'required': False, 'allow_null': True},
            'address': {'required': False, 'allow_null': True},
            'city': {'required': False, 'allow_null': True},
            'sub_city': {'required': False, 'allow_null': True},
            'postal_code': {'required': False, 'allow_null': True},
        }

class UserProfileSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)
    sub_city_name = serializers.CharField(source='sub_city.name', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']