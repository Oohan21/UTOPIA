from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserActivity, CustomUser, UserProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    # Make profile_picture optional and allow null
    profile_picture = serializers.ImageField(
        required=False,
        allow_null=True,
        max_length=None,
        allow_empty_file=False,
        use_url=True,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "user_type",
            "language_preference",
            "is_verified", "is_active",
            "is_premium",
            "profile_picture",
            "bio",
            "occupation",
            "company",
            "currency_preference",
            "email_notifications",
            "sms_notifications",
            "notification_enabled",
        ]
        read_only_fields = ["id", "email", "user_type"]

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
    new_password = serializers.CharField(
        required=True, 
        min_length=8,
        write_only=True
    )
    confirm_password = serializers.CharField(
        required=True, 
        min_length=8,
        write_only=True
    )
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
            })
        return attrs


class DeleteAccountSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, max_length=1000)
    password = serializers.CharField(required=False, write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
        extra_kwargs = {
            'date_of_birth': {'required': False, 'allow_null': True},
            'gender': {'required': False, 'allow_null': True},
            'address': {'required': False, 'allow_null': True},
        }