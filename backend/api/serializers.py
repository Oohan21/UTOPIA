# api/serializers.py (FIXED VERSION)
from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from users.models import CustomUser, UserProfile, UserActivity
from real_estate.models import (
    City,
    SubCity,
    Property,
    PropertyImage,
    Amenity,
    SavedSearch,
    TrackedProperty,
    Inquiry,
    PropertyView,
    PropertyComparison,
    ComparisonSession,
    Message,
    MessageThread,
)
from api.models import MarketStats, PropertyValuation, Notification, AuditLog

User = get_user_model()


class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    """
    A ModelSerializer that takes an additional `fields` argument that
    controls which fields should be displayed.
    """

    def __init__(self, *args, **kwargs):
        fields = kwargs.pop("fields", None)
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
        token["email"] = user.email
        token["user_type"] = user.user_type
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name
        token["is_verified"] = user.is_verified

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Get tokens
        refresh = self.get_token(self.user)

        # Add extra responses
        data.update(
            {
                "user": UserSerializer(self.user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "Login successful",
            }
        )

        return data


class UserProfileSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = UserProfile
        fields = "__all__"
        read_only_fields = ["user"]


class UserSerializer(DynamicFieldsModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    profile_completion = serializers.ReadOnlyField(
        source="profile_completion_percentage"
    )

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "user_type",
            "phone_number",
            "profile_picture",
            "bio",
            "language_preference",
            "currency_preference",
            "is_verified",
            "is_active",
            "is_premium",
            "occupation",
            "company",
            "profile",
            "profile_completion",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "is_verified",
            "is_active",
            "created_at",
            "updated_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "email",
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
            "user_type": {"required": False, "default": "user"},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )

        # Ensure user_type is either 'admin' or 'user', default to 'user'
        user_type = attrs.get("user_type", "user")
        if user_type not in ["admin", "user"]:
            attrs["user_type"] = "user"

        return attrs

    def create(self, validated_data):
        # Ensure user_type is valid
        user_type = validated_data.get("user_type", "user")
        if user_type not in ["admin", "user"]:
            validated_data["user_type"] = "user"

        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data)

        # Create user profile
        UserProfile.objects.create(user=user)

        # Log activity
        UserActivity.objects.create(
            user=user,
            activity_type="profile_update",
            ip_address=self.context["request"].META.get("REMOTE_ADDR"),
            user_agent=self.context["request"].META.get("HTTP_USER_AGENT", ""),
        )

        return user


# Real estate serializers
class CitySerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = City
        fields = "__all__"


class SubCitySerializer(DynamicFieldsModelSerializer):
    city = CitySerializer(read_only=True)

    class Meta:
        model = SubCity
        fields = "__all__"


class AmenitySerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = Amenity
        fields = "__all__"


class PropertyImageSerializer(DynamicFieldsModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = PropertyImage
        fields = [
            "id",
            "image",
            "is_primary",
            "caption",
            "alt_text",
            "order",
            "uploaded_at",
        ]

    def get_image(self, obj):
        request = self.context.get("request")
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
    price_per_sqm = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    days_on_market = serializers.IntegerField(read_only=True)
    price_display = serializers.CharField(read_only=True, source="get_price_display")
    approval_status = serializers.CharField(read_only=True)
    approval_notes = serializers.CharField(read_only=True)
    approved_by = UserSerializer(read_only=True)
    approved_at = serializers.DateTimeField(read_only=True)
    rejection_reason = serializers.CharField(read_only=True)
    is_approved = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Property
        fields = "__all__"
        read_only_fields = [
            "property_id",
            "views_count",
            "inquiry_count",
            "save_count",
            "created_at",
            "updated_at",
            "listed_date",
            "days_on_market",
            "approval_status",
            "approval_notes",
            "approved_by",
            "approved_at",
            "rejection_reason",
            "is_approved",
        ]

    def get_is_approved(self, obj):
        return obj.approval_status == "approved"


# api/serializers.py - UPDATED PropertyCreateSerializer
class PropertyCreateSerializer(DynamicFieldsModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    property_video = serializers.FileField(required=False, allow_null=True)
    amenities = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Amenity.objects.all(), required=False
    )

    class Meta:
        model = Property
        exclude = ["owner", "views_count", "inquiry_count", "save_count"]
        read_only_fields = [
            "property_id",
            "created_at",
            "updated_at",
            "approval_status",
            "approved_by",
            "approved_at",
            "rejection_reason",
            "approval_notes",
        ]

    def create(self, validated_data):
        request = self.context.get("request")

        # Extract many-to-many fields first
        amenities_data = validated_data.pop("amenities", [])
        images = validated_data.pop("images", [])
        property_video = validated_data.pop("property_video", None)

        # Set approval status before creating the instance
        if request and request.user:
            if request.user.is_staff or request.user.is_superuser:
                validated_data["approval_status"] = "approved"
                validated_data["approved_by"] = request.user
                validated_data["approved_at"] = timezone.now()
                validated_data["is_active"] = True
            else:
                validated_data["approval_status"] = "pending"
                validated_data["is_active"] = False  # Not active until approved

        # Create the property instance with all data
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
                property=property_obj, image=image, is_primary=(i == 0), order=i
            )

        return property_obj

    def update(self, instance, validated_data):
        # Extract many-to-many fields first
        amenities_data = validated_data.pop("amenities", None)
        images = validated_data.pop("images", [])
        property_video = validated_data.pop("property_video", None)

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
                    property=instance, image=image, is_primary=(i == 0), order=i
                )

        return instance


class SavedSearchSerializer(DynamicFieldsModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = SavedSearch
        fields = "__all__"
        read_only_fields = [
            "user",
            "created_at",
            "updated_at",
            "last_notified",
            "match_count",
        ]


class TrackedPropertySerializer(DynamicFieldsModelSerializer):
    property = PropertySerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = TrackedProperty
        fields = "__all__"
        read_only_fields = ["user", "created_at"]


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model"""
    sender = serializers.SerializerMethodField()
    receiver = serializers.SerializerMethodField()
    property = serializers.SerializerMethodField()
    attachment = serializers.SerializerMethodField()
    formatted_time = serializers.SerializerMethodField()
    is_my_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id',
            'sender',
            'receiver',
            'property',
            'inquiry',
            'message_type',
            'subject',
            'content',
            'attachment',
            'is_read',
            'read_at',
            'formatted_time',
            'is_my_message',
            'created_at',
        ]
        read_only_fields = ['created_at', 'is_read', 'read_at']
    
    def get_sender(self, obj):
        return {
            'id': obj.sender.id,
            'first_name': obj.sender.first_name,
            'last_name': obj.sender.last_name,
            'email': obj.sender.email,
            'profile_picture': obj.sender.profile_picture.url if obj.sender.profile_picture else None,
            'user_type': obj.sender.user_type,
            'is_verified': obj.sender.is_verified
        }
    
    def get_receiver(self, obj):
        return {
            'id': obj.receiver.id,
            'first_name': obj.receiver.first_name,
            'last_name': obj.receiver.last_name,
            'email': obj.receiver.email,
            'profile_picture': obj.receiver.profile_picture.url if obj.receiver.profile_picture else None,
            'user_type': obj.receiver.user_type,
            'is_verified': obj.receiver.is_verified
        }
    
    def get_property(self, obj):
        if obj.property:
            return {
                'id': obj.property.id,
                'title': obj.property.title,
                'price_etb': obj.property.price_etb,
                'city': obj.property.city.name if obj.property.city else None,
                'sub_city': obj.property.sub_city.name if obj.property.sub_city else None,
            }
        return None
    
    def get_attachment(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None
    
    def get_formatted_time(self, obj):
        """Format time for display (e.g., "2 hours ago")"""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 365:
            years = diff.days // 365
            return f"{years} year{'s' if years > 1 else ''} ago"
        elif diff.days > 30:
            months = diff.days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"
        elif diff.days > 7:
            weeks = diff.days // 7
            return f"{weeks} week{'s' if weeks > 1 else ''} ago"
        elif diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"
    
    def get_is_my_message(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.sender == request.user
        return False


class CreateMessageSerializer(serializers.ModelSerializer):
    """Serializer for creating new messages"""
    attachment = serializers.FileField(required=False, allow_null=True)
    
    class Meta:
        model = Message
        fields = [
            'receiver',
            'property',
            'inquiry',
            'message_type',
            'subject',
            'content',
            'attachment',
            'thread_last_message',
        ]
    
    def validate(self, data):
        # Validate receiver exists and is active
        receiver = data.get('receiver')
        if not User.objects.filter(id=receiver.id, is_active=True).exists():
            raise serializers.ValidationError({
                'receiver': 'Receiver not found or inactive'
            })
        
        # Validate property if provided
        property = data.get('property')
        if property and not property.is_active:
            raise serializers.ValidationError({
                'property': 'Property is not active'
            })
        
        # Validate content length
        content = data.get('content', '')
        if len(content.strip()) == 0:
            raise serializers.ValidationError({
                'content': 'Message content cannot be empty'
            })
        
        if len(content) > 5000:
            raise serializers.ValidationError({
                'content': 'Message content cannot exceed 5000 characters'
            })
        
        return data


class ThreadMessageSerializer(serializers.Serializer):
    """Serializer for sending messages within a thread"""
    content = serializers.CharField(required=True, max_length=5000)
    attachment = serializers.FileField(required=False, allow_null=True)
    message_type = serializers.CharField(default='general', required=False)
    
    def validate_content(self, value):
        if len(value.strip()) == 0:
            raise serializers.ValidationError('Message content cannot be empty')
        return value


class MessageThreadSerializer(serializers.ModelSerializer):
    """Serializer for MessageThread model"""
    participants = serializers.SerializerMethodField()
    property = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    participant_info = serializers.SerializerMethodField()
    formatted_last_activity = serializers.SerializerMethodField()
    
    class Meta:
        model = MessageThread
        fields = [
            'id',
            'participants',
            'property',
            'inquiry',
            'subject',
            'last_message',
            'is_active',
            'unread_count',
            'participant_info',
            'formatted_last_activity',
            'created_at',
            'updated_at',
        ]
    
    def get_participants(self, obj):
        return [
            {
                'id': participant.id,
                'first_name': participant.first_name,
                'last_name': participant.last_name,
                'email': participant.email,
                'profile_picture': participant.profile_picture.url if participant.profile_picture else None,
                'user_type': participant.user_type,
                'is_verified': participant.is_verified
            }
            for participant in obj.participants.all()
        ]
    
    def get_property(self, obj):
        if obj.property:
            return {
                'id': obj.property.id,
                'title': obj.property.title,
                'price_etb': obj.property.price_etb,
                'city': obj.property.city.name if obj.property.city else None,
                'sub_city': obj.property.sub_city.name if obj.property.sub_city else None,
                'main_image': self._get_property_image(obj.property)
            }
        return None
    
    def _get_property_image(self, property_obj):
        """Get primary property image URL"""
        primary_image = property_obj.images.filter(is_primary=True).first()
        if primary_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary_image.image.url)
            return primary_image.image.url
        
        # Fallback to first image
        first_image = property_obj.images.first()
        if first_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        
        return None
    
    def get_last_message(self, obj):
        if obj.last_message:
            return MessageSerializer(obj.last_message, context=self.context).data
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return Message.objects.filter(
                thread_last_message=obj,
                receiver=request.user,
                is_read=False
            ).count()
        return 0
    
    def get_participant_info(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return None
        
        # Find the other participant
        other_participants = obj.participants.exclude(id=request.user.id)
        if not other_participants.exists():
            return None
        
        other_user = other_participants.first()
        return {
            'id': other_user.id,
            'name': f"{other_user.first_name} {other_user.last_name}",
            'email': other_user.email,
            'profile_picture': other_user.profile_picture.url if other_user.profile_picture else None,
            'user_type': other_user.user_type,
            'is_verified': other_user.is_verified
        }
    
    def get_formatted_last_activity(self, obj):
        """Format last activity time"""
        last_activity = obj.updated_at or obj.created_at
        now = timezone.now()
        diff = now - last_activity
        
        if diff.days > 365:
            years = diff.days // 365
            return f"{years} year{'s' if years > 1 else ''} ago"
        elif diff.days > 30:
            months = diff.days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"
        elif diff.days > 7:
            weeks = diff.days // 7
            return f"{weeks} week{'s' if weeks > 1 else ''} ago"
        elif diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"


class QuickContactSerializer(serializers.Serializer):
    """Serializer for quick contacts"""
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    profile_picture = serializers.URLField(allow_null=True)
    user_type = serializers.CharField()
    is_verified = serializers.BooleanField()
    unread_count = serializers.IntegerField()
    last_message_at = serializers.DateTimeField()
    thread_id = serializers.IntegerField(allow_null=True)
    property = serializers.DictField(allow_null=True)


class MessageAnalyticsSerializer(serializers.Serializer):
    """Serializer for message analytics"""
    response_rate = serializers.FloatField()
    avg_response_time = serializers.CharField()
    weekly_activity = serializers.ListField(child=serializers.IntegerField())
    top_contacts = serializers.ListField(child=serializers.DictField())
    total_messages = serializers.IntegerField()
    unread_count = serializers.IntegerField()
    active_conversations = serializers.IntegerField()
    total_threads = serializers.IntegerField()
    weekly_activity_count = serializers.IntegerField()

class InquiryMessageSerializer(serializers.Serializer):
    """Serializer for sending messages related to an inquiry"""

    message = serializers.CharField(required=True, max_length=2000)
    attachment = serializers.FileField(required=False, allow_null=True)


# api/serializers.py - Fix the InquirySerializer

class InquirySerializer(serializers.ModelSerializer):
    property = PropertySerializer(source='property_rel', read_only=True)
    property_id = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.filter(is_active=True),
        write_only=True,
        source='property_rel'
    )
    city_name = serializers.CharField(source='property_rel.city.name', read_only=True)
    sub_city_name = serializers.CharField(source='property_rel.sub_city.name', read_only=True)
    user = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    
    # For writing assignment
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        write_only=True,
        source='assigned_to',
        required=False,
        allow_null=True
    )
    
    # Additional fields
    is_urgent = serializers.BooleanField(read_only=True)
    response_time = serializers.FloatField(read_only=True, allow_null=True)
    property_title = serializers.CharField(source='property_rel.title', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Inquiry
        fields = [
            'id', 'property', 'property_id', 'user', 'user_full_name',
            'inquiry_type', 'message', 'contact_preference',
            'full_name', 'email', 'phone',
            'status', 'priority', 'assigned_to', 'assigned_to_id',
            'response_sent', 'response_notes', 'responded_at',
            'scheduled_viewing', 'viewing_address',
            'tags', 'internal_notes', 'follow_up_date',
            'category', 'source',
            'created_at', 'updated_at',
            'is_urgent', 'response_time', 'property_title', 'city_name', 'sub_city_name'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'response_sent', 'responded_at', 
            'user', 'property', 'is_urgent', 'response_time'
        ]
    
    def get_user_full_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return obj.full_name or 'Anonymous'
    
    def validate(self, data):
        # Ensure either logged in user or contact info is provided
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            if not data.get('full_name') or not data.get('email'):
                raise serializers.ValidationError(
                    "Full name and email are required for anonymous inquiries"
                )
        return data
    
    def create(self, validated_data):
        print("=== SERIALIZER CREATE METHOD ===")
        print(f"Validated data keys: {list(validated_data.keys())}")
        
        # Get user from request context
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
            print(f"Set user: {request.user.id}")
        
        # Create the inquiry
        try:
            inquiry = Inquiry.objects.create(**validated_data)
            print(f"Inquiry created with ID: {inquiry.id}")
            return inquiry
        except Exception as e:
            print(f"Error creating inquiry: {str(e)}")
            raise

class InquiryUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating inquiries (admin/agent use)"""

    class Meta:
        model = Inquiry
        fields = [
            "status",
            "priority",
            "assigned_to",
            "response_notes",
            "scheduled_viewing",
            "viewing_address",
            "tags",
            "internal_notes",
            "follow_up_date",
            "category",
        ]

    def validate_status(self, value):
        """Validate status transitions"""
        instance = self.instance
        if instance and instance.status == "closed" and value != "closed":
            raise serializers.ValidationError(
                "Cannot reopen a closed inquiry. Create a new inquiry instead."
            )
        return value


class InquiryDashboardSerializer(serializers.Serializer):
    """Serializer for inquiry dashboard data"""

    overview = serializers.DictField()
    status_distribution = serializers.DictField()
    priority_distribution = serializers.DictField()
    performance = serializers.DictField()
    time_periods = serializers.DictField()


# API models serializers
class MarketStatsSerializer(DynamicFieldsModelSerializer):
    city = CitySerializer(read_only=True)
    sub_city = SubCitySerializer(read_only=True)

    class Meta:
        model = MarketStats
        fields = "__all__"


class PropertyValuationSerializer(DynamicFieldsModelSerializer):
    city = CitySerializer(read_only=True)
    sub_city = SubCitySerializer(read_only=True)

    class Meta:
        model = PropertyValuation
        fields = "__all__"
        read_only_fields = ["valuation_date"]


class NotificationSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ["created_at", "read_at", "sent_at"]


class AuditLogSerializer(DynamicFieldsModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = "__all__"
        read_only_fields = ["created_at"]


# Dashboard serializers
class DashboardStatsSerializer(serializers.Serializer):
    total_properties = serializers.IntegerField()
    total_users = serializers.IntegerField()
    total_inquiries = serializers.IntegerField()
    total_valuations = serializers.IntegerField()
    revenue_month = serializers.DecimalField(max_digits=15, decimal_places=2)
    revenue_growth = serializers.DecimalField(max_digits=5, decimal_places=2)

    # Property types distribution
    property_type_distribution = serializers.DictField(child=serializers.IntegerField())

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
            "id",
            "property_id",
            "title",
            "property_type",
            "listing_type",
            "city",
            "sub_city",
            "bedrooms",
            "bathrooms",
            "total_area",
            "price_etb",
            "monthly_rent",
            "price_per_sqm",
            "built_year",
            "has_parking",
            "has_garden",
            "has_security",
            "has_furniture",
            "has_air_conditioning",
            "has_generator",
            "has_elevator",
            "is_pet_friendly",
            "virtual_tour_url",
            "is_verified",
        ]


class PropertyComparisonSerializer(DynamicFieldsModelSerializer):
    properties = ComparisonPropertySerializer(many=True, read_only=True)
    comparison_summary = serializers.SerializerMethodField()

    class Meta:
        model = PropertyComparison
        fields = [
            "id",
            "name",
            "properties",
            "comparison_summary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user"]

    def get_comparison_summary(self, obj):
        properties = obj.properties.all()
        if properties.count() == 0:
            return {}

        from django.db.models import Min, Max, Avg

        summary = {
            "count": properties.count(),
            "price_range": {
                "min": properties.aggregate(min=Min("price_etb"))["min"],
                "max": properties.aggregate(max=Max("price_etb"))["max"],
                "avg": properties.aggregate(avg=Avg("price_etb"))["avg"],
            },
            "area_range": {
                "min": properties.aggregate(min=Min("total_area"))["min"],
                "max": properties.aggregate(max=Max("total_area"))["max"],
                "avg": properties.aggregate(avg=Avg("total_area"))["avg"],
            },
            "bedrooms_range": {
                "min": properties.aggregate(min=Min("bedrooms"))["min"],
                "max": properties.aggregate(max=Max("bedrooms"))["max"],
                "avg": properties.aggregate(avg=Avg("bedrooms"))["avg"],
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
        child=serializers.IntegerField(), min_length=1, max_length=10
    )
