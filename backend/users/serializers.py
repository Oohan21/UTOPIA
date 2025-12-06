from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

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
