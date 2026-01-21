from rest_framework import viewsets, generics, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny,
    IsAuthenticatedOrReadOnly,
)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import (
    Q,
    Avg,
    Count,
    Max,
    Min,
    Sum,
    F,
    Subquery,
    OuterRef,
    ExpressionWrapper,
    DurationField,
    FloatField, DecimalField,
    Case, When, Value, IntegerField
)
from django.db.models.functions import TruncDate, TruncMonth, TruncQuarter, TruncYear, ExtractHour, ExtractDay
from django.http import HttpResponse
from django.db import transaction
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import traceback
import logging
import csv
import json
from uuid import UUID
from io import StringIO
from .serializers import *
from .filters import PropertyFilter
from .permissions import *
from .pagination import CustomPagination, MessagePagination
from real_estate.models import Property, Inquiry
from real_estate.comparison import PropertyComparisonService

logger = logging.getLogger(__name__)
User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# class RegisterView(generics.CreateAPIView):
#     queryset = User.objects.all()
#     permission_classes = [AllowAny]
#     serializer_class = RegisterSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True).select_related("user_profile")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["user_type", "is_verified"]
    search_fields = ["email", "first_name", "last_name", "phone_number"]

    def get_queryset(self):
        if self.request.user.is_admin_user:  # Updated method
            return User.objects.all().select_related("user_profile")
        return super().get_queryset()

    @action(detail=False, methods=["get"])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["put", "patch"])
    def update_profile(self, request):
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        user = request.user

        # Get user stats - simplified for new user roles
        listed_properties = user.owned_properties.filter(is_active=True).count()
        saved_properties = user.tracked_properties.count()
        saved_searches = user.saved_searches.filter(is_active=True).count()
        inquiries_sent = user.inquiries.count()

        # Get recent properties
        recent_properties = user.owned_properties.filter(is_active=True).order_by(
            "-created_at"
        )[:5]

        # Get recent inquiries
        recent_inquiries = user.inquiries.order_by("-created_at")[:5]

        # Market insights
        market_insights = {
            "average_price": Property.objects.filter(
                city=(
                    user.user_profile.city
                    if user.user_profile and user.user_profile.city
                    else None
                ),
                is_active=True,
            ).aggregate(avg=Avg("price_etb"))["avg"]
            or 0,
            "trend": "rising",
            "trend_percentage": 8.2,
        }

        data = {
            "listed_properties": listed_properties,
            "saved_properties": saved_properties,
            "saved_searches": saved_searches,
            "inquiries_sent": inquiries_sent,
            "profile_completion": user.profile_completion_percentage,
            "recent_properties": PropertySerializer(recent_properties, many=True).data,
            "recent_inquiries": InquirySerializer(recent_inquiries, many=True).data,
            "market_insights": market_insights,
        }

        return Response(data)


# Property Views
class PropertyViewSet(viewsets.ModelViewSet):
    queryset = (
        Property.objects.filter(is_active=True)
        .select_related("city", "sub_city", "owner", "agent")
        .prefetch_related("images", "amenities")
    )

    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = PropertyFilter
    search_fields = ["title", "title_amharic", "description", "specific_location"]
    ordering_fields = [
        "price_etb",
        "created_at",
        "total_area",
        "bedrooms",
        "views_count",
    ]
    ordering = ["-created_at"]
    pagination_class = CustomPagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return PropertyCreateSerializer
        return PropertySerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), IsOwnerOrReadOnly()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

        # Log activity
        UserActivity.objects.create(
            user=self.request.user,
            activity_type="property_add",
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        # Log view
        PropertyView.objects.create(
            property=instance,
            user=request.user if request.user.is_authenticated else None,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            session_id=request.session.session_key or "",
        )

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def save(self, request, pk=None):
        property = self.get_object()
        user = request.user

        # Check if already saved
        tracked = TrackedProperty.objects.filter(user=user, property=property).first()

        if tracked:
            tracked.delete()
            property.save_count = max(0, property.save_count - 1)
            property.save()
            return Response({"message": "Property removed from saved list"})
        else:
            TrackedProperty.objects.create(
                user=user, property=property, tracking_type="interested"
            )
            property.save_count += 1
            property.save()
            return Response({"message": "Property saved successfully"})

    @action(detail=False, methods=["get"])
    def featured(self, request):
        featured_properties = self.get_queryset().filter(
            is_featured=True, is_active=True
        )[:10]
        serializer = self.get_serializer(featured_properties, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def similar(self, request):
        property_id = request.query_params.get("property_id")
        if not property_id:
            return Response({"error": "property_id is required"}, status=400)

        try:
            current_property = Property.objects.get(id=property_id)

            similar = (
                Property.objects.filter(
                    Q(city=current_property.city)
                    | Q(sub_city=current_property.sub_city)
                    | Q(property_type=current_property.property_type),
                    is_active=True,
                    listing_type=current_property.listing_type,
                )
                .exclude(id=property_id)
                .order_by("?")[:8]
            )

            serializer = self.get_serializer(similar, many=True)
            return Response(serializer.data)
        except Property.DoesNotExist:
            return Response({"error": "Property not found"}, status=404)

    @action(detail=False, methods=["get"])
    def recommendations(self, request):
        user = request.user

        # Get user preferences from profile
        preferences = []
        if hasattr(user, "user_profile") and user.user_profile:
            preferences = user.user_profile.preferred_property_types or []
            locations = user.user_profile.preferred_locations or []

        # Build recommendation query
        query = Q(is_active=True)

        if preferences:
            query &= Q(property_type__in=preferences)

        # Add location filter if available
        if hasattr(user, "user_profile") and user.user_profile.city:
            query &= Q(city=user.user_profile.city)

        recommendations = Property.objects.filter(query).order_by("-created_at")[:12]

        serializer = self.get_serializer(recommendations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_to_comparison(self, request, pk=None):
        """Add property to comparison session"""
        property = self.get_object()

        # Get or create comparison session
        session_key = request.session.session_key
        if not session_key:
            request.session.create()
            session_key = request.session.session_key

        comparison_session, created = ComparisonSession.objects.get_or_create(
            session_id=session_key
        )

        # Check if property already in comparison
        if property in comparison_session.properties.all():
            comparison_session.properties.remove(property)
            action = "removed"
        else:
            # Check limit
            if comparison_session.properties.count() >= 10:
                return Response(
                    {"error": "Cannot compare more than 10 properties"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            comparison_session.properties.add(property)
            action = "added"

        comparison_session.save()

        return Response(
            {
                "action": action,
                "property_id": property.id,
                "session_properties_count": comparison_session.properties.count(),
                "session_id": session_key,
            }
        )

    @action(detail=False, methods=["get"])
    def get_comparison_session(self, request):
        """Get current comparison session"""
        session_key = request.session.session_key

        if not session_key:
            return Response({"properties": [], "count": 0})

        try:
            comparison_session = ComparisonSession.objects.get(session_id=session_key)
            properties = comparison_session.properties.filter(is_active=True)

            return Response(
                {
                    "properties": PropertySerializer(properties, many=True).data,
                    "count": properties.count(),
                    "session_id": session_key,
                }
            )
        except ComparisonSession.DoesNotExist:
            return Response({"properties": [], "count": 0})


# Market Views
class MarketStatsView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request):
        city_id = request.query_params.get("city")
        sub_city_id = request.query_params.get("sub_city")
        property_type = request.query_params.get("property_type")

        # Build filter
        filters = {}
        if city_id:
            filters["city_id"] = city_id
        if sub_city_id:
            filters["sub_city_id"] = sub_city_id
        if property_type:
            filters["property_type"] = property_type

        filters["approval_status"] = "approved"
        filters["is_active"] = True
        filters["property_status"] = "available"

        # Get properties
        properties = Property.objects.filter(**filters)

        # Calculate statistics
        if properties.exists():
            stats = properties.aggregate(
                avg_price=Avg("price_etb"),
                median_price=Avg("price_etb"),  # Simplified median
                min_price=Min("price_etb"),
                max_price=Max("price_etb"),
                total_listings=Count("id"),
                avg_bedrooms=Avg("bedrooms"),
                avg_area=Avg("total_area"),
                avg_price_per_sqm=Avg(F("price_etb") / F("total_area")),
            )

            # Calculate price changes
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_properties = properties.filter(created_at__gte=thirty_days_ago)
            older_properties = properties.filter(created_at__lt=thirty_days_ago)

            recent_avg = recent_properties.aggregate(avg=Avg("price_etb"))["avg"] or 0
            older_avg = older_properties.aggregate(avg=Avg("price_etb"))["avg"] or 0

            if older_avg > 0:
                price_change = ((recent_avg - older_avg) / older_avg) * 100
            else:
                price_change = 0

            # Property type distribution
            type_distribution = list(
                properties.values("property_type")
                .annotate(count=Count("id"), avg_price=Avg("price_etb"))
                .order_by("-count")
            )

            # Popular areas
            popular_areas = list(
                properties.values("sub_city__name")
                .annotate(count=Count("id"), avg_price=Avg("price_etb"))
                .order_by("-count")[:10]
            )

            # Price ranges
            price_ranges = [
                {
                    "range": "Under 1M",
                    "count": properties.filter(price_etb__lt=1000000).count(),
                },
                {
                    "range": "1M - 3M",
                    "count": properties.filter(
                        price_etb__gte=1000000, price_etb__lt=3000000
                    ).count(),
                },
                {
                    "range": "3M - 5M",
                    "count": properties.filter(
                        price_etb__gte=3000000, price_etb__lt=5000000
                    ).count(),
                },
                {
                    "range": "5M - 10M",
                    "count": properties.filter(
                        price_etb__gte=5000000, price_etb__lt=10000000
                    ).count(),
                },
                {
                    "range": "10M+",
                    "count": properties.filter(price_etb__gte=10000000).count(),
                },
            ]
        else:
            # Default values for no data
            stats = {
                "avg_price": 0,
                "median_price": 0,
                "min_price": 0,
                "max_price": 0,
                "total_listings": 0,
                "avg_bedrooms": 0,
                "avg_area": 0,
                "avg_price_per_sqm": 0,
            }
            price_change = 0
            type_distribution = []
            popular_areas = []
            price_ranges = []
            recent_properties = Property.objects.none()

        response_data = {
            "summary": {
                "average_price": stats["avg_price"] or 0,
                "median_price": stats["median_price"] or 0,
                "price_range": {
                    "min": stats["min_price"] or 0,
                    "max": stats["max_price"] or 0,
                },
                "total_listings": stats["total_listings"] or 0,
                "average_bedrooms": stats["avg_bedrooms"] or 0,
                "average_area": stats["avg_area"] or 0,
                "average_price_per_sqm": stats["avg_price_per_sqm"] or 0,
            },
            "trends": {
                "price_change_30d": round(price_change, 2),
                "new_listings_30d": recent_properties.count(),
                "average_days_on_market": 45,  # Would calculate from actual data
                "inventory_months": 3.2,  # Would calculate from actual data
            },
            "distribution": {
                "property_types": type_distribution,
                "popular_areas": popular_areas,
                "price_ranges": price_ranges,
            },
            "market_health": {
                "absorption_rate": 0.75,  # Properties sold per month
                "price_to_rent_ratio": 20,  # Years to pay off property with rent
                "rental_yield": 5.2,  # Percentage
            },
        }

        return Response(response_data)


class PropertyValuationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = request.data
            logger.info(f"Valuation request received: {data}")

            # Import Property model
            from real_estate.models import Property

            # Extract and validate parameters
            property_type = data.get("property_type")
            bedrooms = data.get("bedrooms")
            total_area = data.get("total_area")
            built_year = data.get("built_year")
            condition = data.get("condition", "good")
            city_id = data.get("city")
            sub_city_id = data.get("sub_city")

            # Validate required fields
            if not property_type:
                return Response(
                    {"error": "Property type is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not total_area:
                return Response(
                    {"error": "Total area is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Convert to appropriate types
            try:
                total_area = float(total_area)
                if bedrooms:
                    bedrooms = int(bedrooms)
                if built_year:
                    built_year = int(built_year)
                if city_id:
                    city_id = int(city_id)
                if sub_city_id:
                    sub_city_id = int(sub_city_id)
            except (ValueError, TypeError) as e:
                return Response(
                    {"error": "Invalid data type in request"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Build query for similar properties
            similar_properties = Property.objects.filter(
                is_active=True, property_status="available"
            )

            # Apply filters
            if property_type:
                similar_properties = similar_properties.filter(
                    property_type=property_type
                )

            if city_id:
                similar_properties = similar_properties.filter(city_id=city_id)

            if sub_city_id:
                similar_properties = similar_properties.filter(sub_city_id=sub_city_id)

            if bedrooms:
                # Allow ±1 bedroom difference
                similar_properties = similar_properties.filter(
                    bedrooms__gte=bedrooms - 1, bedrooms__lte=bedrooms + 1
                )

            if built_year:
                # Filter properties within ±5 years
                similar_properties = similar_properties.filter(
                    built_year__gte=built_year - 5, built_year__lte=built_year + 5
                )

            comparable_count = similar_properties.count()

            # Calculate valuation
            if comparable_count > 0:
                # Get statistics for sale properties
                sale_properties = similar_properties.filter(
                    Q(price_etb__gt=0) | Q(price_etb__isnull=False)
                )

                # Get statistics for rent properties
                rent_properties = similar_properties.filter(
                    Q(monthly_rent__gt=0) | Q(monthly_rent__isnull=False)
                )

                sale_count = sale_properties.count()
                rent_count = rent_properties.count()

                if sale_count > 0:
                    # Use sale prices for valuation
                    stats = sale_properties.aggregate(
                        avg_price=Avg("price_etb"),
                        min_price=Min("price_etb"),
                        max_price=Max("price_etb"),
                        avg_area=Avg("total_area"),
                    )

                    avg_price = stats["avg_price"] or 0
                    avg_area = stats["avg_area"] or 100

                    # Calculate price per sqm
                    if avg_area > 0:
                        price_per_sqm = avg_price / avg_area
                    else:
                        price_per_sqm = avg_price / 100

                    # Adjust for requested area
                    base_value = price_per_sqm * total_area
                    valuation_type = "sale"

                elif rent_count > 0:
                    # Use rent prices for valuation
                    stats = rent_properties.aggregate(
                        avg_rent=Avg("monthly_rent"), avg_area=Avg("total_area")
                    )

                    avg_rent = stats["avg_rent"] or 0
                    avg_area = stats["avg_area"] or 100

                    # Calculate rent per sqm
                    if avg_area > 0:
                        rent_per_sqm = avg_rent / avg_area
                    else:
                        rent_per_sqm = avg_rent / 100

                    # Adjust for requested area and convert to sale value (approx 200 months)
                    monthly_rent = rent_per_sqm * total_area
                    base_value = monthly_rent * 200
                    valuation_type = "rent"

                else:
                    # No price data, use defaults
                    base_value = 5000000
                    valuation_type = "default"

            else:
                # No similar properties found, use defaults
                base_value = 5000000
                valuation_type = "default"
                comparable_count = 0

            # Condition multipliers
            condition_multipliers = {
                "excellent": 1.2,
                "good": 1.0,
                "average": 0.9,
                "needs_work": 0.7,
            }

            condition_multiplier = condition_multipliers.get(condition, 1.0)

            # Feature adjustments (ETB)
            feature_adjustments = 0
            if data.get("has_parking"):
                feature_adjustments += 50000
            if data.get("has_security"):
                feature_adjustments += 30000
            if data.get("has_garden"):
                feature_adjustments += 100000
            if data.get("has_furniture"):
                feature_adjustments += 150000

            # Final valuation
            final_valuation = (
                float(base_value * Decimal(condition_multiplier)) + feature_adjustments
            )

            # Confidence level
            if comparable_count > 10:
                confidence = "high"
            elif comparable_count > 5:
                confidence = "medium"
            else:
                confidence = "low"

            # Price per sqm for the valuation
            price_per_sqm_val = final_valuation / total_area if total_area > 0 else 0

            # Prepare response
            valuation_result = {
                "estimated_value": round(final_valuation, 2),
                "value_range": {
                    "low": round(final_valuation * 0.85, 2),
                    "high": round(final_valuation * 1.15, 2),
                },
                "confidence": confidence,
                "comparables_count": comparable_count,
                "price_per_sqm": round(price_per_sqm_val, 2),
                "valuation_type": valuation_type,
                "market_trend": "rising",
                "trend_strength": 8.2,
                "valuation_date": timezone.now().date().isoformat(),
                "notes": f"Based on {comparable_count} similar properties. Condition: {condition}.",
            }

            # Save valuation if user is authenticated
            if request.user.is_authenticated:
                try:
                    from api.models import PropertyValuation

                    PropertyValuation.objects.create(
                        user=request.user,
                        city_id=city_id,
                        sub_city_id=sub_city_id,
                        property_type=property_type,
                        bedrooms=bedrooms,
                        total_area=total_area,
                        built_year=built_year,
                        estimated_value_low=valuation_result["value_range"]["low"],
                        estimated_value_mid=valuation_result["estimated_value"],
                        estimated_value_high=valuation_result["value_range"]["high"],
                        confidence_level=confidence,
                        price_per_sqm=valuation_result["price_per_sqm"],
                        comparables_count=comparable_count,
                        market_trend="rising",
                        trend_strength=8.2,
                        notes=valuation_result["notes"],
                    )
                except Exception as e:
                    logger.error(f"Error saving valuation: {e}")
                    # Continue even if saving fails

            return Response(valuation_result)

        except Exception as e:
            logger.error(f"Valuation error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Internal server error", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# Additional ViewSets
class CityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.filter(is_active=True)
    serializer_class = CitySerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "name_amharic"]


class SubCityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubCity.objects.all()
    serializer_class = SubCitySerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["city"]


class SavedSearchViewSet(viewsets.ModelViewSet):
    serializer_class = SavedSearchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedSearch.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        saved_search = self.get_object()
        saved_search.is_active = not saved_search.is_active
        saved_search.save()
        return Response({"is_active": saved_search.is_active})


class TrackedPropertyViewSet(viewsets.ModelViewSet):
    serializer_class = TrackedPropertySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TrackedProperty.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing messages.
    Users can only see messages where they are sender or receiver.
    """

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = MessagePagination

    def get_queryset(self):
        user = self.request.user

        # Apply filters from query parameters
        queryset = (
            Message.objects.filter(Q(sender=user) | Q(receiver=user))
            .select_related("sender", "receiver", "property", "inquiry")
            .order_by("-created_at")
        )

        # Filter by thread
        thread_id = self.request.query_params.get("thread")
        if thread_id:
            queryset = queryset.filter(thread_last_message_id=thread_id)

        # Filter by property
        property_id = self.request.query_params.get("property")
        if property_id:
            queryset = queryset.filter(property_id=property_id)

        # Filter by inquiry
        inquiry_id = self.request.query_params.get("inquiry")
        if inquiry_id:
            queryset = queryset.filter(inquiry_id=inquiry_id)

        # Filter by read status
        unread = self.request.query_params.get("unread")
        if unread == "true":
            queryset = queryset.filter(is_read=False, receiver=user)

        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return CreateMessageSerializer
        return MessageSerializer

    def perform_create(self, serializer):
        # Save message
        message = serializer.save(sender=self.request.user)

        # Update message thread (instead of using signal)
        self._update_message_thread(message)

        # Create notification for receiver
        self._create_notification(message)

        # Log message activity
        self._log_message_activity(message)

    def _update_message_thread(self, message):
        """Create or update message thread for the message"""
        from django.db.models import Q

        if not message.property and not message.inquiry:
            return None

        # Find existing thread
        thread_filters = Q(participants=message.sender) & Q(
            participants=message.receiver
        )

        if message.property:
            thread_filters &= Q(property=message.property)
        if message.inquiry:
            thread_filters &= Q(inquiry=message.inquiry)

        thread = MessageThread.objects.filter(thread_filters).first()

        if not thread:
            # Create new thread
            subject = (
                message.subject
                or f"Regarding {message.property.title if message.property else 'your inquiry'}"
            )
            thread = MessageThread.objects.create(
                subject=subject, property=message.property, inquiry=message.inquiry
            )
            thread.participants.add(message.sender, message.receiver)

        thread.last_message = message
        thread.updated_at = timezone.now()
        thread.save(update_fields=["last_message", "updated_at"])

        return thread

    @action(detail=True, methods=["post"])
    def mark_as_read(self, request, pk=None):
        """Mark a specific message as read"""
        message = self.get_object()

        if message.receiver != request.user:
            return Response(
                {"error": "You can only mark your own received messages as read"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not message.is_read:
            message.mark_as_read()
            return Response({"status": "Message marked as read"})

        return Response({"status": "Message already read"})

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        """Get count of unread messages for current user"""
        count = Message.objects.filter(receiver=request.user, is_read=False).count()

        return Response({"unread_count": count})

    def _create_notification(self, message):
        """Create notification for message receiver"""
        try:
            # Get the property safely
            property_id = None
            property_title = None
            if message.property:
                # Access the property instance directly
                property_id = message.property.id
                property_title = message.property.title

            # Create notification
            Notification.objects.create(
                user=message.receiver,
                notification_type="message_received",
                title=f"New Message from {message.sender.first_name}",
                message=message.content[:100]
                + ("..." if len(message.content) > 100 else ""),
                content_type="message",
                object_id=str(message.id),
                data={
                    "sender_id": message.sender.id,
                    "sender_name": f"{message.sender.first_name} {message.sender.last_name}",
                    "property_id": property_id,  # Use the ID we extracted
                    "property_title": property_title,  # Use the title we extracted
                    "message_id": message.id,
                    "thread_id": (
                        message.thread_last_message.id
                        if message.thread_last_message
                        else None
                    ),
                },
            )
        except Exception as e:
            logger.error(
                f"Failed to create notification for message {message.id}: {str(e)}"
            )

    def _log_message_activity(self, message):
        """Log message sending activity"""
        try:
        # Check what fields UserActivity model accepts
            activity_data = {
                'user': message.sender,
                'activity_type': 'message_sent',
                'ip_address': self.request.META.get('REMOTE_ADDR'),
                'user_agent': self.request.META.get('HTTP_USER_AGENT', ''),
                'metadata': {  # Use 'metadata' instead of 'data' if that's what your model expects
                    'receiver_id': message.receiver.id,
                    'message_id': message.id,
                    'property_id': message.property.id if message.property else None,
                    'has_attachment': bool(message.attachment)
            }
        }
        
            UserActivity.objects.create(**activity_data)
        except Exception as e:
            logger.error(f"Failed to log message activity: {str(e)}")


class MessageThreadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing message threads.
    """

    serializer_class = MessageThreadSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = MessagePagination

    def get_queryset(self):
        user = self.request.user

        queryset = (
            MessageThread.objects.filter(participants=user)
            .select_related("property", "inquiry", "last_message")
            .prefetch_related("participants")
            .order_by("-updated_at")
        )

        # Filter by property
        property_id = self.request.query_params.get("property")
        if property_id:
            queryset = queryset.filter(property_id=property_id)

        # Filter by inquiry
        inquiry_id = self.request.query_params.get("inquiry")
        if inquiry_id:
            queryset = queryset.filter(inquiry_id=inquiry_id)

        # Filter by active status
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset

    # ADD THIS IMPORTANT DECORATOR
    @action(
        detail=False,
        methods=["get"],
        url_path="quick-contacts",
        url_name="quick_contacts",
    )
    def quick_contacts(self, request):
        """Get quick contacts for the user (recent message participants)"""
        user = request.user

        # Get threads with recent activity
        recent_threads = (
            MessageThread.objects.filter(
                participants=user, updated_at__gte=timezone.now() - timedelta(days=30)
            )
            .select_related("last_message", "property")
            .prefetch_related("participants")
            .order_by("-updated_at")[:10]
        )

        contacts = []
        contact_ids = set()

        for thread in recent_threads:
            # Find the other participant
            other_participants = thread.participants.exclude(id=user.id)
            if not other_participants.exists():
                continue

            other_user = other_participants.first()

            # Skip if already added
            if other_user.id in contact_ids:
                continue

            # Get unread count for this contact
            unread_count = Message.objects.filter(
                thread_last_message=thread, receiver=user, is_read=False
            ).count()

            contact_data = {
                "id": other_user.id,
                "first_name": other_user.first_name,
                "last_name": other_user.last_name,
                "email": other_user.email,
                "profile_picture": (
                    request.build_absolute_uri(other_user.profile_picture.url)
                    if other_user.profile_picture
                    else None
                ),
                "user_type": other_user.user_type,
                "is_verified": other_user.is_verified,
                "unread_count": unread_count,
                "last_message_at": thread.updated_at.isoformat(),
                "thread_id": thread.id,
            }

            # Add property info if available
            if thread.property:
                contact_data["property"] = {
                    "id": thread.property.id,
                    "title": thread.property.title,
                }

            contacts.append(contact_data)
            contact_ids.add(other_user.id)

            # Limit to 8 contacts
            if len(contacts) >= 8:
                break

        return Response(contacts)

    @action(detail=True, methods=["get"])
    def messages(self, request, pk=None):
        """Get all messages in a thread"""
        thread = self.get_object()

        messages = (
            Message.objects.filter(thread_last_message=thread)
            .select_related("sender", "receiver")
            .order_by("created_at")
        )

        # Mark all messages as read for the current user
        unread_messages = messages.filter(receiver=request.user, is_read=False)

        if unread_messages.exists():
            unread_messages.update(is_read=True, read_at=timezone.now())

        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def send_message(self, request, pk=None):
        """Send a new message in a thread"""
        thread = self.get_object()

        serializer = ThreadMessageSerializer(
            data=request.data, context={"request": request, "thread": thread}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Find the other participant
        other_participants = thread.participants.exclude(id=request.user.id)
        if not other_participants.exists():
            return Response(
                {"error": "No other participants in thread"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        receiver = other_participants.first()

        # Create message
        message_data = serializer.validated_data
        message = Message.objects.create(
            sender=request.user,
            receiver=receiver,
            property=thread.property,
            inquiry=thread.inquiry,
            message_type=message_data.get("message_type", "general"),
            subject=thread.subject,
            content=message_data["content"],
            attachment=message_data.get("attachment"),
        )

        # Update thread
        thread.last_message = message
        thread.updated_at = timezone.now()
        thread.save(update_fields=['last_message', 'updated_at'])

        # Create notification
        try:
            Notification.objects.create(
                user=receiver,
                notification_type="message_received",
                title=f"New message in {thread.subject}",
                message=message.content[:100] + ("..." if len(message.content) > 100 else ""),
                content_type="message",
                object_id=str(message.id),
                data={
                    "thread_id": thread.id,
                    "sender_id": request.user.id,
                    "sender_name": f"{request.user.first_name} {request.user.last_name}",
                    "property_id": thread.property.id if thread.property else None,
                },
            )
        except Exception as e:
            logger.error(f"Failed to create notification: {str(e)}")

        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def mark_all_read(self, request, pk=None):
        """Mark all messages in thread as read for current user"""
        thread = self.get_object()

        messages = Message.objects.filter(
            thread_last_message=thread, receiver=request.user, is_read=False
        )

        updated_count = messages.update(is_read=True, read_at=timezone.now())

        return Response(
            {
                "status": f"Marked {updated_count} messages as read",
                "updated_count": updated_count,
            }
        )

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Archive a thread"""
        thread = self.get_object()
        thread.is_active = False
        thread.save()

        return Response({"status": "Thread archived"})

    @action(detail=True, methods=["post"])
    def unarchive(self, request, pk=None):
        """Unarchive a thread"""
        thread = self.get_object()
        thread.is_active = True
        thread.save()

        return Response({"status": "Thread unarchived"})


class MessageAnalyticsView(generics.GenericAPIView):
    """
    View for getting message analytics for the current user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        try:
            # Get basic message stats
            total_messages = Message.objects.filter(
                Q(sender=user) | Q(receiver=user)
            ).count()

            unread_count = Message.objects.filter(receiver=user, is_read=False).count()

            # Get thread stats
            threads = MessageThread.objects.filter(participants=user)
            total_threads = threads.count()
            active_threads = threads.filter(is_active=True).count()

            # Calculate response rate
            response_rate = self._calculate_response_rate(user)

            # Calculate average response time
            avg_response_time = self._calculate_avg_response_time(user)

            # Get weekly activity
            weekly_activity = self._get_weekly_activity(user)

            # Get top contacts
            top_contacts = self._get_top_contacts(user)

            return Response(
                {
                    "response_rate": response_rate,
                    "avg_response_time": avg_response_time,
                    "weekly_activity": weekly_activity,
                    "top_contacts": top_contacts,
                    "total_messages": total_messages,
                    "unread_count": unread_count,
                    "active_conversations": active_threads,
                    "total_threads": total_threads,
                    "weekly_activity_count": sum(weekly_activity),
                }
            )

        except Exception as e:
            logger.error(f"Error calculating message analytics: {str(e)}")
            return Response(
                {
                    "response_rate": 0,
                    "avg_response_time": "N/A",
                    "weekly_activity": [0, 0, 0, 0, 0, 0, 0],
                    "top_contacts": [],
                    "total_messages": 0,
                    "unread_count": 0,
                    "active_conversations": 0,
                    "total_threads": 0,
                    "weekly_activity_count": 0,
                    "error": "Failed to calculate analytics",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _calculate_response_rate(self, user):
        """Calculate response rate based on threads with replies"""
        threads = MessageThread.objects.filter(participants=user)

        threads_with_replies = 0
        for thread in threads:
            # Get messages in this thread
            messages = Message.objects.filter(thread_last_message=thread)
            if messages.count() < 2:
                continue

            # Check if there are messages from different participants
            participants = set()
            for msg in messages:
                participants.add(msg.sender.id)

            if len(participants) > 1:
                threads_with_replies += 1

        if threads.count() > 0:
            return round((threads_with_replies / threads.count()) * 100, 1)
        return 0

    def _calculate_avg_response_time(self, user):
        """Calculate average response time in hours"""
        # Get threads where user received a message and then replied
        user_threads = MessageThread.objects.filter(participants=user)

        response_times = []
        for thread in user_threads:
            messages = Message.objects.filter(thread_last_message=thread).order_by(
                "created_at"
            )

            if messages.count() < 2:
                continue

            # Find pairs where user replies to a message
            for i in range(1, messages.count()):
                prev_msg = messages[i - 1]
                curr_msg = messages[i]

                # If previous message was from someone else and current is from user
                if prev_msg.sender != user and curr_msg.sender == user:
                    response_time = (
                        curr_msg.created_at - prev_msg.created_at
                    ).total_seconds() / 3600
                    response_times.append(response_time)

        if response_times:
            avg_hours = sum(response_times) / len(response_times)
            if avg_hours < 1:
                return f"{int(avg_hours * 60)}m"
            elif avg_hours < 24:
                return f"{avg_hours:.1f}h"
            else:
                return f"{avg_hours / 24:.1f}d"

        return "N/A"

    def _get_weekly_activity(self, user):
        """Get message activity for the last 7 days"""
        week_ago = timezone.now() - timedelta(days=7)

        # Initialize array for 7 days
        weekly_activity = [0] * 7

        # Get messages from the last 7 days
        messages = Message.objects.filter(
            Q(sender=user) | Q(receiver=user), created_at__gte=week_ago
        )

        for message in messages:
            # Calculate which day index (0 = today, 6 = 6 days ago)
            days_ago = (timezone.now() - message.created_at).days
            if 0 <= days_ago < 7:
                weekly_activity[6 - days_ago] += 1

        return weekly_activity

    def _get_top_contacts(self, user, limit=3):
        """Get top contacts by message count"""
        # Get all message partners
        sent_to = (
            Message.objects.filter(sender=user)
            .values("receiver")
            .annotate(count=Count("id"))
        )

        received_from = (
            Message.objects.filter(receiver=user)
            .values("sender")
            .annotate(count=Count("id"))
        )

        # Combine counts
        contact_counts = {}

        for item in sent_to:
            contact_id = item["receiver"]
            contact_counts[contact_id] = (
                contact_counts.get(contact_id, 0) + item["count"]
            )

        for item in received_from:
            contact_id = item["sender"]
            contact_counts[contact_id] = (
                contact_counts.get(contact_id, 0) + item["count"]
            )

        # Sort by count and get top contacts
        top_contact_ids = sorted(
            contact_counts.items(), key=lambda x: x[1], reverse=True
        )[:limit]

        # Get user details for top contacts
        top_contacts = []
        for contact_id, count in top_contact_ids:
            try:
                contact_user = User.objects.get(id=contact_id)
                top_contacts.append(
                    {
                        "id": contact_user.id,
                        "name": f"{contact_user.first_name} {contact_user.last_name}",
                        "email": contact_user.email,
                        "count": count,
                        "profile_picture": (
                            contact_user.profile_picture.url
                            if contact_user.profile_picture
                            else None
                        ),
                    }
                )
            except User.DoesNotExist:
                continue

        return top_contacts


class BulkMessageView(generics.GenericAPIView):
    """
    View for bulk message operations.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Mark multiple messages as read"""
        message_ids = request.data.get("message_ids", [])
        action = request.data.get("action", "mark_read")

        if not message_ids:
            return Response(
                {"error": "No message IDs provided"}, status=status.HTTP_400_BAD_REQUEST
            )

        if action == "mark_read":
            messages = Message.objects.filter(
                id__in=message_ids, receiver=request.user, is_read=False
            )

            updated_count = messages.update(is_read=True, read_at=timezone.now())

            return Response(
                {
                    "status": f"Marked {updated_count} messages as read",
                    "updated_count": updated_count,
                }
            )

        elif action == "delete":
            messages = Message.objects.filter(id__in=message_ids, sender=request.user)

            deleted_count = messages.count()
            messages.delete()

            return Response(
                {
                    "status": f"Deleted {deleted_count} messages",
                    "deleted_count": deleted_count,
                }
            )

        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)


class InquiryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing inquiries with role-based access control.
    - Admins: Can view, update, and manage all inquiries
    - Regular Users: Can only view and manage their own inquiries
    """
    
    queryset = Inquiry.objects.all().select_related(
        'property', 'user', 'assigned_to', 'response_by',
        'property__city', 'property__sub_city'
    ).prefetch_related('property__images')
    
    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination
    
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    
    filterset_fields = {
        'status': ['exact', 'in'],
        'priority': ['exact'],
        'inquiry_type': ['exact'],
        'category': ['exact'],
        'source': ['exact'],
        'assigned_to': ['exact', 'isnull'],
        'property__city': ['exact'],
        'property__sub_city': ['exact'],
        'property__property_type': ['exact'],
        'property__listing_type': ['exact'],
        'created_at': ['gte', 'lte', 'date'],
        'responded_at': ['gte', 'lte', 'date', 'isnull'],
        'follow_up_date': ['gte', 'lte', 'date', 'isnull'],
        'response_sent': ['exact'],
        'user': ['exact'],
    }
    
    search_fields = [
        'property__title',
        'property__description',
        'user__email',
        'user__first_name',
        'user__last_name',
        'full_name',
        'email',
        'phone',
        'message',
    ]
    
    ordering_fields = [
        'created_at', 'updated_at', 'priority', 'status',
        'follow_up_date', 'scheduled_viewing'
    ]
    ordering = ['-created_at']
    
    def get_object(self):
        """
        Override to handle UUID lookup
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get the pk from URL
        pk = self.kwargs.get('pk')
        
        # Try to parse as UUID
        try:
            uuid_obj = UUID(str(pk))
            obj = get_object_or_404(queryset, id=uuid_obj)
        except (ValueError, TypeError):
            # If not a valid UUID, try as integer (for backward compatibility)
            obj = get_object_or_404(queryset, pk=pk)
        
        self.check_object_permissions(self.request, obj)
        return obj
    
    def get_queryset(self):
        """Filter queryset based on user role"""
        user = self.request.user
        
        if user.user_type == 'admin':
            # Admins see all inquiries
            return super().get_queryset()
        
        # Regular users only see their own inquiries and inquiries about their properties
        return super().get_queryset().filter(
            Q(user=user) | Q(property__owner=user)
        ).distinct()
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return CreateInquirySerializer
        elif self.action in ['update', 'partial_update']:
            return InquiryUpdateSerializer
        return super().get_serializer_class()
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Handle inquiry creation with notifications"""
        inquiry = serializer.save()
        
        # Log activity
        UserActivity.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            activity_type="inquiry_created",
            ip_address=self.request.META.get("REMOTE_ADDR"),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
            metadata={
                "inquiry_id": str(inquiry.id),
                "property_id": inquiry.property.id,
                "inquiry_type": inquiry.inquiry_type
            }
        )
    
    def perform_update(self, serializer):
        """Handle inquiry updates with notifications"""
        old_instance = self.get_object()
        inquiry = serializer.save()
        
        # Check if status changed
        if old_instance.status != inquiry.status:
            # Notify user about status change
            if inquiry.user:
                Notification.objects.create(
                    user=inquiry.user,
                    notification_type="inquiry_status_changed",
                    title=f"Inquiry Status Updated",
                    message=f'Your inquiry about "{inquiry.property.title}" is now {inquiry.get_status_display()}',
                    content_type='inquiry',
                    object_id=str(inquiry.id),
                    data={
                        "old_status": old_instance.status,
                        "new_status": inquiry.status,
                        "property_title": inquiry.property.title,
                        "inquiry_id": str(inquiry.id)
                    }
                )
            
            # Log activity
            UserActivity.objects.create(
                user=self.request.user,
                activity_type="inquiry_status_updated",
                ip_address=self.request.META.get("REMOTE_ADDR"),
                user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
                metadata={
                    "inquiry_id": str(inquiry.id),
                    "old_status": old_instance.status,
                    "new_status": inquiry.status
                }
            )
        
        # Check if assigned to changed
        if old_instance.assigned_to != inquiry.assigned_to and inquiry.assigned_to:
            Notification.objects.create(
                user=inquiry.assigned_to,
                notification_type="inquiry_assigned",
                title="New Inquiry Assignment",
                message=f'You have been assigned to inquiry #{inquiry.id}',
                content_type='inquiry', 
                object_id=str(inquiry.id),
                data={
                    "inquiry_id": str(inquiry.id),
                    "property_title": inquiry.property.title,
                    "priority": inquiry.priority
                }
            )
    
    # Custom Actions
    
    @action(detail=True, methods=['post'])
    def assign_to_me(self, request, pk=None):
        """Assign inquiry to current user (admin only)"""
        inquiry = self.get_object()
        
        if request.user.user_type != 'admin':
            return Response(
                {"error": "Only admin users can assign inquiries to themselves"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        inquiry.assigned_to = request.user
        inquiry.save()
        
        serializer = self.get_serializer(inquiry)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_contacted(self, request, pk=None):
        """Mark inquiry as contacted"""
        inquiry = self.get_object()
        notes = request.data.get('notes', '')
        
        inquiry.mark_as_contacted(user=request.user, notes=notes)
        
        serializer = self.get_serializer(inquiry)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def schedule_viewing(self, request, pk=None):
        """Schedule a property viewing"""
        inquiry = self.get_object()
        serializer = ScheduleViewingSerializer(data=request.data)
    
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
        data = serializer.validated_data
        inquiry.schedule_viewing(
            date_time=data['viewing_time'],
            address=data.get('address', ''),
            notes=data.get('notes', '')
        )
    
        # Notify user about scheduled viewing
        if inquiry.user:
            Notification.objects.create(
                user=inquiry.user,
                notification_type="viewing_scheduled",
                title="Viewing Scheduled",
                message=f'Viewing scheduled for "{inquiry.property.title}"',
                content_type="inquiry",
                object_id=str(inquiry.id),  
                data={
                    "viewing_time": data['viewing_time'].isoformat(),
                    "address": data.get('address', ''),
                    "property_title": inquiry.property.title,
                    "inquiry_id": str(inquiry.id) 
                }
            )
    
        serializer = self.get_serializer(inquiry)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def close_inquiry(self, request, pk=None):
        """Close the inquiry"""
        inquiry = self.get_object()
        notes = request.data.get('notes', '')
        
        inquiry.close_inquiry(user=request.user, notes=notes)
        
        serializer = self.get_serializer(inquiry)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update multiple inquiries"""
        if request.user.user_type != 'admin':
            return Response(
                {"error": "Only admin users can perform bulk updates"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = BulkUpdateInquirySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        inquiry_ids = data.pop('inquiry_ids')
        
        # Update inquiries
        updated = Inquiry.objects.filter(id__in=inquiry_ids).update(**data)
        
        # Log activity
        UserActivity.objects.create(
            user=request.user,
            activity_type="inquiry_bulk_update",
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            metadata={
                "updated_count": updated,
                "inquiry_ids": [str(id) for id in inquiry_ids],
                "update_data": data
            }
        )
        
        return Response({
            "success": True,
            "updated_count": updated,
            "message": f"Successfully updated {updated} inquiries"
        })
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get inquiry dashboard statistics"""
        user = request.user
        
        if user.user_type == 'admin':
            queryset = self.get_queryset()
        else:
            queryset = self.get_queryset().filter(Q(user=user) | Q(property__owner=user))
        
        # Date ranges
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Calculate statistics
        total = queryset.count()
        new_today = queryset.filter(created_at__date=today).count()
        new_this_week = queryset.filter(created_at__gte=week_ago).count()
        unassigned = queryset.filter(assigned_to__isnull=True).count()
        
        # Urgent inquiries (pending high/urgent priority from last 24 hours)
        urgent_threshold = timezone.now() - timedelta(hours=24)
        urgent = queryset.filter(
            status='pending',
            priority__in=['high', 'urgent'],
            created_at__gte=urgent_threshold
        ).count()
        
        # Status distribution
        status_distribution = dict(
            queryset.values('status')
            .annotate(count=Count('id'))
            .values_list('status', 'count')
        )
        
        # Priority distribution
        priority_distribution = dict(
            queryset.values('priority')
            .annotate(count=Count('id'))
            .values_list('priority', 'count')
        )
        
        # Performance metrics
        responded = queryset.filter(response_sent=True)
        avg_response_hours = 0
        
        if responded.exists():
            response_times = responded.annotate(
                response_seconds=ExpressionWrapper(
                    F('responded_at') - F('created_at'),
                    output_field=DurationField()
                )
            )
            avg_response_seconds = response_times.aggregate(
                avg=Avg('response_seconds')
            )['avg']
            
            if avg_response_seconds:
                avg_response_hours = avg_response_seconds.total_seconds() / 3600
        
        response_rate = (responded.count() / max(total, 1)) * 100
        closed_count = queryset.filter(status='closed').count()
        conversion_rate = (closed_count / max(total, 1)) * 100
        
        # Recent activities
        recent_activities = queryset.order_by('-created_at')[:10].values(
            'id', 'property__title', 'status', 'priority',
            'created_at', 'user__first_name', 'user__last_name', 'full_name'
        )
        
        # Format recent activities
        formatted_activities = []
        for activity in recent_activities:
            user_display_name = activity['full_name'] or (
                f"{activity['user__first_name']} {activity['user__last_name']}"
                if activity['user__first_name'] 
                else 'Anonymous'
            )
            formatted_activities.append({
                'id': str(activity['id']),
                'property__title': activity['property__title'],
                'status': activity['status'],
                'priority': activity['priority'],
                'created_at': activity['created_at'].isoformat() if activity['created_at'] else None,
                'user_display_name': user_display_name
            })
        
        data = {
            "overview": {
                "total": total,
                "new_today": new_today,
                "new_this_week": new_this_week,
                "unassigned": unassigned,
                "urgent": urgent,
            },
            "status_distribution": status_distribution,
            "priority_distribution": priority_distribution,
            "performance": {
                "avg_response_time_hours": round(avg_response_hours, 1),
                "response_rate": round(response_rate, 1),
                "conversion_rate": round(conversion_rate, 1),
            },
            "recent_activities": formatted_activities,
        }
        
        # Add admin-specific stats
        if user.user_type == 'admin':
            # Admin performance
            admin_performance = {}
            admins = User.objects.filter(user_type='admin', is_active=True)
            
            for admin in admins:
                admin_inquiries = queryset.filter(assigned_to=admin)
                admin_total = admin_inquiries.count()
                admin_closed = admin_inquiries.filter(status='closed').count()
                
                admin_performance[admin.email] = {
                    'total': admin_total,
                    'closed': admin_closed,
                    'completion_rate': round((admin_closed / max(admin_total, 1)) * 100, 1)
                }
            
            data['admin_stats'] = admin_performance
        
        serializer = InquiryDashboardSerializer(data=data)
        serializer.is_valid()
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        """Get inquiry activity timeline"""
        inquiry = self.get_object()
        
        activities = []
        
        # Creation activity
        activities.append({
            "id": 1,
            "type": "created",
            "title": "Inquiry Created",
            "description": f"New {inquiry.inquiry_type} inquiry",
            "timestamp": inquiry.created_at,
            "user": inquiry.get_user_display_name(),
            "metadata": {
                "inquiry_type": inquiry.inquiry_type,
                "message_preview": inquiry.message[:100] + "..." if len(inquiry.message) > 100 else inquiry.message
            }
        })
        
        # Status changes
        if inquiry.responded_at:
            activities.append({
                "id": 2,
                "type": "responded",
                "title": f"Marked as {inquiry.status}",
                "description": inquiry.response_notes or "Response sent",
                "timestamp": inquiry.responded_at,
                "user": inquiry.response_by.get_full_name() if inquiry.response_by else "System",
                "metadata": {
                    "status": inquiry.status,
                    "response_by": inquiry.response_by.email if inquiry.response_by else None
                }
            })
        
        # Viewing scheduled
        if inquiry.scheduled_viewing:
            activities.append({
                "id": 3,
                "type": "viewing_scheduled",
                "title": "Viewing Scheduled",
                "description": f"Viewing scheduled for {inquiry.scheduled_viewing.strftime('%B %d, %Y at %I:%M %p')}",
                "timestamp": inquiry.updated_at,
                "user": inquiry.assigned_to.get_full_name() if inquiry.assigned_to else "System",
                "metadata": {
                    "viewing_time": inquiry.scheduled_viewing.isoformat(),
                    "address": inquiry.viewing_address
                }
            })
        
        # Assignment
        if inquiry.assigned_to:
            activities.append({
                "id": 4,
                "type": "assigned",
                "title": "Assigned to Admin",
                "description": f"Assigned to {inquiry.assigned_to.get_full_name()}",
                "timestamp": inquiry.updated_at,
                "user": "System",
                "metadata": {
                    "assigned_to": inquiry.assigned_to.email
                }
            })
        
        return Response(activities)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export inquiries to CSV"""
        if request.user.user_type != 'admin':
            return Response(
                {"error": "Only admin users can export inquiries"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="inquiries_export_{today}.csv"'
        
        writer = csv.writer(response)
        
        # Write headers
        headers = [
            'ID', 'Property', 'Property Type', 'Listing Type',
            'User Name', 'User Email', 'User Phone',
            'Inquiry Type', 'Status', 'Priority', 'Assigned To',
            'Created At', 'Responded At', 'Response Time (hours)',
            'Contact Preference', 'Message Preview',
            'Scheduled Viewing', 'Follow Up Date',
            'Category', 'Source', 'Tags'
        ]
        writer.writerow(headers)
        
        # Write data
        for inquiry in queryset:
            response_time = inquiry.get_response_time_hours() if inquiry.get_response_time_hours() else 'N/A'
            viewing_time = inquiry.scheduled_viewing.strftime('%Y-%m-%d %H:%M') if inquiry.scheduled_viewing else 'N/A'
            follow_up = inquiry.follow_up_date.strftime('%Y-%m-%d') if inquiry.follow_up_date else 'N/A'
            
            writer.writerow([
                str(inquiry.id)[:8],
                inquiry.property.title[:50],
                inquiry.property.get_property_type_display(),
                inquiry.property.get_listing_type_display(),
                inquiry.get_user_display_name(),
                inquiry.get_user_email_address(),
                inquiry.phone,
                inquiry.get_inquiry_type_display(),
                inquiry.get_status_display(),
                inquiry.get_priority_display(),
                inquiry.assigned_to.email if inquiry.assigned_to else 'Unassigned',
                inquiry.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                inquiry.responded_at.strftime('%Y-%m-%d %H:%M:%S') if inquiry.responded_at else 'N/A',
                response_time,
                inquiry.get_contact_preference_display(),
                inquiry.message[:100],
                viewing_time,
                follow_up,
                inquiry.get_category_display(),
                inquiry.get_source_display(),
                ', '.join(inquiry.tags) if inquiry.tags else ''
            ])
        
        return response
    
    @action(detail=False, methods=['get'])
    def my_inquiries(self, request):
        """Get inquiries for the current user"""
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        queryset = self.get_queryset().filter(user=request.user)
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def assigned_to_me(self, request):
        """Get inquiries assigned to current admin"""
        if request.user.user_type != 'admin':
            return Response(
                {"error": "Only admin users can view assigned inquiries"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset().filter(assigned_to=request.user)
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# Dashboard View
class AdminDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Calculate statistics
        total_properties = Property.objects.filter(is_active=True).count()
        total_users = User.objects.filter(is_active=True).count()
        total_inquiries = Inquiry.objects.count()
        total_valuations = PropertyValuation.objects.count()

        # Monthly revenue (simplified - would calculate from actual transactions)
        revenue_month = 0
        revenue_growth = 12.5  # Percentage

        # Property type distribution
        type_distribution = dict(
            Property.objects.filter(is_active=True)
            .values("property_type")
            .annotate(count=Count("id"))
            .values_list("property_type", "count")
        )

        # Recent activities
        recent_activities = list(
            UserActivity.objects.select_related("user")
            .order_by("-created_at")[:10]
            .values("user__email", "activity_type", "created_at")
        )

        data = {
            "total_properties": total_properties,
            "total_users": total_users,
            "total_inquiries": total_inquiries,
            "total_valuations": total_valuations,
            "revenue_month": revenue_month,
            "revenue_growth": revenue_growth,
            "property_type_distribution": type_distribution,
            "recent_activities": recent_activities,
        }

        return Response(data)


class HealthCheckView(APIView):
    permission_classes = []

    def get(self, request):
        return Response(
            {
                "status": "healthy",
                "service": "UTOPIA API",
                "version": "1.0.0",
                "timestamp": timezone.now().isoformat(),
            }
        )


class ComparisonViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def my_comparisons(self, request):
        """Get user's saved comparisons"""
        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        comparisons = PropertyComparison.objects.filter(user=request.user)
        serializer = PropertyComparisonSerializer(comparisons, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=["post"])
    def compare(self, request):
        """Property comparison with rent/sale differentiation"""
        property_ids = request.data.get("property_ids", [])

        if len(property_ids) < 2:
            return Response(
                {"error": "Select at least 2 properties to compare"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Get properties
            properties = Property.objects.filter(
                id__in=property_ids, is_active=True
            ).select_related("city", "sub_city")

            if properties.count() != len(property_ids):
                return Response(
                    {"error": "Some properties not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Group properties by listing type
            sale_properties = [p for p in properties if p.listing_type == "sale"]
            rent_properties = [p for p in properties if p.listing_type == "rent"]

            # Check if we're mixing rent and sale properties
            has_mixed_types = len(sale_properties) > 0 and len(rent_properties) > 0

            # Prepare property data with type-specific fields
            property_data = []
            for prop in properties:
                prop_dict = {
                    "id": prop.id,
                    "title": prop.title,
                    "listing_type": prop.listing_type,
                    "property_type": prop.property_type,
                    "city": prop.city.name if prop.city else None,
                    "sub_city": prop.sub_city.name if prop.sub_city else None,
                    "total_area": prop.total_area,
                    "bedrooms": prop.bedrooms,
                    "bathrooms": prop.bathrooms,
                    "built_year": prop.built_year,
                    "has_parking": prop.has_parking,
                    "has_garden": prop.has_garden,
                    "has_security": prop.has_security,
                    "has_furniture": prop.has_furniture,
                    "has_air_conditioning": prop.has_air_conditioning,
                    "has_elevator": prop.has_elevator,
                    "is_pet_friendly": prop.is_pet_friendly,
                    "is_verified": prop.is_verified,
                    "is_featured": prop.is_featured,
                    "days_on_market": prop.days_on_market,
                    "views_count": prop.views_count,
                }

                # Price fields based on listing type
                if prop.listing_type == "sale":
                    prop_dict["price_etb"] = prop.price_etb
                    prop_dict["monthly_rent"] = None
                    # Calculate price per sqm for sale
                    if prop.price_etb and prop.total_area and prop.total_area > 0:
                        prop_dict["price_per_sqm"] = float(
                            prop.price_etb / prop.total_area
                        )
                    else:
                        prop_dict["price_per_sqm"] = None

                elif prop.listing_type == "rent":
                    prop_dict["price_etb"] = None
                    prop_dict["monthly_rent"] = prop.monthly_rent
                    # Calculate rent per sqm for rent
                    if prop.monthly_rent and prop.total_area and prop.total_area > 0:
                        prop_dict["rent_per_sqm"] = float(
                            prop.monthly_rent / prop.total_area
                        )
                    else:
                        prop_dict["rent_per_sqm"] = None
                    # Calculate approximate sale value (annual rent * 15 years)
                    if prop.monthly_rent:
                        prop_dict["estimated_sale_value"] = float(
                            prop.monthly_rent * 12 * 15
                        )
                    else:
                        prop_dict["estimated_sale_value"] = None

                property_data.append(prop_dict)

            # Calculate comparison matrix with type-specific fields
            # Common fields for all properties
            common_fields = [
                "total_area",
                "bedrooms",
                "bathrooms",
                "property_type",
                "has_parking",
                "has_garden",
                "has_security",
                "has_furniture",
                "has_air_conditioning",
                "has_elevator",
                "is_pet_friendly",
                "is_verified",
                "is_featured",
                "days_on_market",
            ]

            # Type-specific fields
            sale_fields = ["price_etb", "price_per_sqm"]
            rent_fields = ["monthly_rent", "rent_per_sqm", "estimated_sale_value"]

            matrix = {}

            # Add common fields
            for field in common_fields:
                matrix[field] = []
                for prop in properties:
                    value = getattr(prop, field, None)
                    matrix[field].append(value)

            # Add location fields
            matrix["city"] = [
                prop.city.name if prop.city else None for prop in properties
            ]
            matrix["sub_city"] = [
                prop.sub_city.name if prop.sub_city else None for prop in properties
            ]

            # Add listing type
            matrix["listing_type"] = [prop.listing_type for prop in properties]

            # Add sale-specific fields
            for field in sale_fields:
                matrix[field] = []
                for prop in properties:
                    if prop.listing_type == "sale":
                        if field == "price_per_sqm":
                            if (
                                prop.price_etb
                                and prop.total_area
                                and prop.total_area > 0
                            ):
                                value = float(prop.price_etb / prop.total_area)
                            else:
                                value = None
                        else:
                            value = getattr(prop, field, None)
                    else:
                        value = None
                    matrix[field].append(value)

            # Add rent-specific fields
            for field in rent_fields:
                matrix[field] = []
                for prop in properties:
                    if prop.listing_type == "rent":
                        if field == "rent_per_sqm":
                            if (
                                prop.monthly_rent
                                and prop.total_area
                                and prop.total_area > 0
                            ):
                                value = float(prop.monthly_rent / prop.total_area)
                            else:
                                value = None
                        elif field == "estimated_sale_value":
                            if prop.monthly_rent:
                                value = float(prop.monthly_rent * 12 * 15)
                            else:
                                value = None
                        else:
                            value = getattr(prop, field, None)
                    else:
                        value = None
                    matrix[field].append(value)

            # Calculate statistics by listing type
            sale_prices = [p.price_etb for p in sale_properties if p.price_etb]
            rent_prices = [p.monthly_rent for p in rent_properties if p.monthly_rent]
            all_areas = [p.total_area for p in properties if p.total_area]

            result = {
                "properties": property_data,
                "matrix": matrix,
                "has_mixed_types": has_mixed_types,
                "summary": {
                    "total_properties": len(properties),
                    "sale_properties_count": len(sale_properties),
                    "rent_properties_count": len(rent_properties),
                    "common_stats": {
                        "area_range": {
                            "min": min(all_areas) if all_areas else 0,
                            "max": max(all_areas) if all_areas else 0,
                            "avg": sum(all_areas) / len(all_areas) if all_areas else 0,
                        },
                        "bedroom_range": {
                            "min": (
                                min(
                                    p.bedrooms
                                    for p in properties
                                    if p.bedrooms is not None
                                )
                                if any(p.bedrooms for p in properties)
                                else 0
                            ),
                            "max": (
                                max(
                                    p.bedrooms
                                    for p in properties
                                    if p.bedrooms is not None
                                )
                                if any(p.bedrooms for p in properties)
                                else 0
                            ),
                            "avg": (
                                sum(
                                    p.bedrooms
                                    for p in properties
                                    if p.bedrooms is not None
                                )
                                / len([p for p in properties if p.bedrooms is not None])
                                if any(p.bedrooms for p in properties)
                                else 0
                            ),
                        },
                    },
                },
                "comparison_date": timezone.now().isoformat(),
                "status": "success",
            }

            # Add sale-specific statistics
            if sale_prices:
                result["summary"]["sale_stats"] = {
                    "price_range": {
                        "min": min(sale_prices),
                        "max": max(sale_prices),
                        "avg": sum(sale_prices) / len(sale_prices),
                    }
                }

                # Calculate price per sqm for sale properties
                sale_price_per_sqm = []
                for prop in sale_properties:
                    if prop.price_etb and prop.total_area and prop.total_area > 0:
                        sale_price_per_sqm.append(
                            float(prop.price_etb / prop.total_area)
                        )

                if sale_price_per_sqm:
                    result["summary"]["sale_stats"]["price_per_sqm_range"] = {
                        "min": min(sale_price_per_sqm),
                        "max": max(sale_price_per_sqm),
                        "avg": sum(sale_price_per_sqm) / len(sale_price_per_sqm),
                        "best_value": (
                            min(sale_price_per_sqm) if sale_price_per_sqm else None
                        ),
                    }

            # Add rent-specific statistics
            if rent_prices:
                result["summary"]["rent_stats"] = {
                    "rent_range": {
                        "min": min(rent_prices),
                        "max": max(rent_prices),
                        "avg": sum(rent_prices) / len(rent_prices),
                    }
                }

                # Calculate rent per sqm for rent properties
                rent_per_sqm = []
                for prop in rent_properties:
                    if prop.monthly_rent and prop.total_area and prop.total_area > 0:
                        rent_per_sqm.append(float(prop.monthly_rent / prop.total_area))

                if rent_per_sqm:
                    result["summary"]["rent_stats"]["rent_per_sqm_range"] = {
                        "min": min(rent_per_sqm),
                        "max": max(rent_per_sqm),
                        "avg": sum(rent_per_sqm) / len(rent_per_sqm),
                    }

                # Calculate yield for rent properties
                estimated_values = []
                for prop in rent_properties:
                    if prop.monthly_rent:
                        estimated_value = float(prop.monthly_rent * 12 * 15)
                        estimated_values.append(estimated_value)

                if estimated_values:
                    result["summary"]["rent_stats"]["estimated_sale_value_range"] = {
                        "min": min(estimated_values),
                        "max": max(estimated_values),
                        "avg": sum(estimated_values) / len(estimated_values),
                    }

            # Find best values for each type
            if sale_properties:
                # Best value for sale (lowest price per sqm)
                sale_with_price = [
                    p for p in sale_properties if p.price_etb and p.total_area
                ]
                if sale_with_price:
                    best_sale_value = min(
                        sale_with_price, key=lambda p: p.price_etb / p.total_area
                    )
                    result["summary"]["best_sale_value"] = {
                        "id": best_sale_value.id,
                        "title": best_sale_value.title,
                        "price_per_sqm": float(
                            best_sale_value.price_etb / best_sale_value.total_area
                        ),
                        "total_price": best_sale_value.price_etb,
                        "area": best_sale_value.total_area,
                    }

            if rent_properties:
                # Best value for rent (lowest rent per sqm)
                rent_with_price = [
                    p for p in rent_properties if p.monthly_rent and p.total_area
                ]
                if rent_with_price:
                    best_rent_value = min(
                        rent_with_price, key=lambda p: p.monthly_rent / p.total_area
                    )
                    result["summary"]["best_rent_value"] = {
                        "id": best_rent_value.id,
                        "title": best_rent_value.title,
                        "rent_per_sqm": float(
                            best_rent_value.monthly_rent / best_rent_value.total_area
                        ),
                        "monthly_rent": best_rent_value.monthly_rent,
                        "area": best_rent_value.total_area,
                    }

            # Property with most features
            feature_counts = []
            for prop in properties:
                feature_count = sum(
                    [
                        1
                        for field in [
                            "has_parking",
                            "has_garden",
                            "has_security",
                            "has_furniture",
                            "has_air_conditioning",
                            "has_elevator",
                            "is_pet_friendly",
                            "is_verified",
                            "is_featured",
                        ]
                        if getattr(prop, field, False)
                    ]
                )
                feature_counts.append((prop, feature_count))

            if feature_counts:
                most_features_property = max(feature_counts, key=lambda x: x[1])[0]
                result["summary"]["most_features"] = {
                    "id": most_features_property.id,
                    "title": most_features_property.title,
                    "listing_type": most_features_property.listing_type,
                    "feature_count": feature_counts[0][1] if feature_counts else 0,
                }

            # Add warning if mixing rent and sale
            if has_mixed_types:
                result["warning"] = (
                    "You are comparing properties with different listing types (rent vs sale). Some metrics may not be directly comparable."
                )

            # Save comparison if user is authenticated
            if request.user.is_authenticated:
                try:
                    comparison = PropertyComparison.objects.create(
                        user=request.user,
                        name=f"Comparison {timezone.now().strftime('%Y-%m-%d %H:%M')}",
                    )
                    comparison.properties.set(properties)
                    result["comparison_id"] = comparison.id
                    result["save_url"] = f"/api/comparisons/{comparison.id}/"
                except Exception as save_error:
                    logger.warning(f"Failed to save comparison: {save_error}")

            return Response(result)

        except Exception as e:
            logger.error(f"Comparison error: {str(e)}", exc_info=True)
            return Response(
                {
                    "error": "Internal server error",
                    "detail": str(e),
                    "property_ids": property_ids,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["post"])
    def find_similar(self, request):
        """Find similar properties for comparison"""
        property_id = request.data.get("property_id")
        limit = request.data.get("limit", 5)

        if not property_id:
            return Response(
                {"error": "property_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            property = Property.objects.get(id=property_id, is_active=True)
        except Property.DoesNotExist:
            return Response(
                {"error": "Property not found"}, status=status.HTTP_404_NOT_FOUND
            )

        similar_properties = EnhancedPropertyComparisonService.find_similar_properties(
            property, limit=limit
        )

        serializer = PropertySerializer(similar_properties, many=True)

        return Response(
            {
                "base_property": PropertySerializer(property).data,
                "similar_properties": serializer.data,
                "count": similar_properties.count(),
                "similarity_criteria": {
                    "property_type": property.property_type,
                    "city": property.city.name if property.city else None,
                    "price_range": (
                        f"{property.price_etb * Decimal('0.8'):.0f} - {property.price_etb * Decimal('1.2'):.0f}"
                        if property.price_etb
                        else None
                    ),
                    "bedroom_range": f"{property.bedrooms - 1 if property.bedrooms else 0} - {property.bedrooms + 1 if property.bedrooms else 0}",
                },
            }
        )

    @action(detail=False, methods=["post"])
    def save_comparison(self, request):
        """Save current comparison"""

        if not request.user.is_authenticated:
            return Response(
                {"error": "Authentication required"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        property_ids = request.data.get("property_ids", [])
        name = request.data.get(
            "name", f'Comparison {timezone.now().strftime("%Y-%m-%d")}'
        )

        if len(property_ids) < 2:
            return Response(
                {"error": "At least 2 properties required to save comparison"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        properties = Property.objects.filter(id__in=property_ids)

        comparison = PropertyComparison.objects.create(user=request.user, name=name)
        comparison.properties.set(properties)

        serializer = PropertyComparisonSerializer(comparison)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _create_comparison_matrix(self, properties):
        """Create comparison matrix data"""
        fields = [
            "price_etb",
            "total_area",
            "bedrooms",
            "bathrooms",
            "price_per_sqm",
            "has_parking",
            "has_garden",
            "has_security",
            "has_furniture",
        ]

        matrix = {}
        for field in fields:
            matrix[field] = []
            for prop in properties:
                if field == "price_per_sqm":
                    value = prop.price_per_sqm
                else:
                    value = getattr(prop, field, None)
                matrix[field].append(value)

        return matrix

    def destroy(self, request, pk=None):
        """Delete a saved comparison"""
        try:
            comparison = PropertyComparison.objects.get(id=pk, user=request.user)
            comparison.delete()
            return Response(
                {"message": "Comparison deleted successfully"},
                status=status.HTTP_204_NO_CONTENT,
            )
        except PropertyComparison.DoesNotExist:
            return Response(
                {"error": "Comparison not found or you don't have permission"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def retrieve(self, request, pk=None):
        """Get a specific comparison"""
        try:
            comparison = PropertyComparison.objects.get(id=pk)
            if comparison.user != request.user:
                return Response(
                    {"error": "You don't have permission to view this comparison"},
                    status=status.HTTP_403_FORBIDDEN,
                )
            serializer = PropertyComparisonSerializer(comparison)
            return Response(serializer.data)
        except PropertyComparison.DoesNotExist:
            return Response(
                {"error": "Comparison not found"}, status=status.HTTP_404_NOT_FOUND
            )

    def list(self, request):
        """List all comparisons (for admin)"""
        if request.user.is_staff:
            comparisons = PropertyComparison.objects.all()
        else:
            comparisons = PropertyComparison.objects.filter(user=request.user)

        serializer = PropertyComparisonSerializer(comparisons, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def generate_export(self, request):
        """Generate exportable comparison data"""
        property_ids = request.data.get("property_ids", [])
        format = request.data.get("format", "csv")

        if len(property_ids) < 2:
            return Response(
                {"error": "At least 2 properties required for export"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        properties = Property.objects.filter(
            id__in=property_ids, is_active=True
        ).select_related("city", "sub_city")

        if format == "csv":
            return EnhancedPropertyComparisonService.export_to_csv(properties)
        elif format == "json":
            return EnhancedPropertyComparisonService.export_to_json(properties)
        elif format == "pdf":
            return EnhancedPropertyComparisonService.export_to_pdf(properties)
        else:
            return Response(
                {"error": f"Unsupported format: {format}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["get"])
    def comparison_history(self, request, pk=None):
        """Get comparison history for a property"""
        try:
            property = Property.objects.get(id=pk, is_active=True)
        except Property.DoesNotExist:
            return Response(
                {"error": "Property not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Get comparisons that include this property
        comparisons = (
            PropertyComparison.objects.filter(properties=property, user=request.user)
            .prefetch_related("properties")
            .order_by("-created_at")[:10]
        )

        history = []
        for comp in comparisons:
            other_properties = comp.properties.exclude(id=property.id)
            history.append(
                {
                    "comparison_id": comp.id,
                    "comparison_name": comp.name,
                    "compared_with": PropertySerializer(
                        other_properties, many=True
                    ).data,
                    "compared_count": other_properties.count(),
                    "compared_date": comp.created_at,
                    "comparison_summary": (
                        comp.comparison_data
                        if hasattr(comp, "comparison_data")
                        else None
                    ),
                }
            )

        return Response(
            {
                "property": PropertySerializer(property).data,
                "comparison_history": history,
                "total_comparisons": len(history),
            }
        )

    @action(detail=False, methods=["post"])
    def insights(self, request):
        """Get comparison insights"""
        property_ids = request.data.get("property_ids", [])

        properties = Property.objects.filter(id__in=property_ids)

        # Calculate insights
        insights = {
            "best_value": self._find_best_value(properties),
            "price_trends": self._calculate_price_trends(properties),
            "feature_comparison": self._compare_features(properties),
            "recommendations": self._generate_recommendations(properties),
        }

        return Response(insights)

    @action(detail=False, methods=["post"])
    def bulk_add(self, request):
        """Bulk add properties to comparison"""
        property_ids = request.data.get("property_ids", [])
        session_key = request.session.session_key

        if not session_key:
            request.session.create()
            session_key = request.session.session_key

        comparison_session, created = ComparisonSession.objects.get_or_create(
            session_id=session_key
        )

        # Add all properties
        properties = Property.objects.filter(id__in=property_ids, is_active=True)

        for property in properties:
            if comparison_session.properties.count() < 10:
                comparison_session.properties.add(property)

        return Response(
            {
                "added_count": properties.count(),
                "session_count": comparison_session.properties.count(),
            }
        )


class ComparisonDashboardView(generics.GenericAPIView):
    """Comparison dashboard with analytics"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get user's comparison statistics
        total_comparisons = PropertyComparison.objects.filter(user=user).count()
        recent_comparisons = PropertyComparison.objects.filter(
            user=user, created_at__gte=timezone.now() - timedelta(days=30)
        ).count()

        # Get most compared properties
        most_compared = (
            Property.objects.filter(comparisons__user=user)
            .annotate(comparison_count=Count("comparisons"))
            .order_by("-comparison_count")[:5]
        )

        # Get comparison frequency
        comparison_timeline = []
        for i in range(30):
            date = timezone.now() - timedelta(days=i)
            count = PropertyComparison.objects.filter(
                user=user, created_at__date=date.date()
            ).count()
            comparison_timeline.append(
                {"date": date.date().isoformat(), "count": count}
            )

        # Get saved comparison statistics
        saved_comparisons = PropertyComparison.objects.filter(user=user).order_by(
            "-created_at"
        )[:10]

        return Response(
            {
                "overview": {
                    "total_comparisons": total_comparisons,
                    "recent_comparisons": recent_comparisons,
                    "avg_properties_per_comparison": self._calculate_avg_properties(
                        user
                    ),
                },
                "most_compared_properties": PropertySerializer(
                    most_compared, many=True
                ).data,
                "comparison_timeline": comparison_timeline,
                "saved_comparisons": PropertyComparisonSerializer(
                    saved_comparisons, many=True
                ).data,
                "comparison_habits": self._analyze_comparison_habits(user),
            }
        )

    def _calculate_avg_properties(self, user):
        comparisons = PropertyComparison.objects.filter(user=user)
        if not comparisons:
            return 0

        total_properties = sum(comp.properties.count() for comp in comparisons)
        return total_properties / comparisons.count()

    def _analyze_comparison_habits(self, user):
        habits = {
            "preferred_property_types": [],
            "average_comparison_size": 0,
            "most_active_day": None,
            "comparison_frequency": "low",
        }

        comparisons = PropertyComparison.objects.filter(user=user)
        if not comparisons:
            return habits

        # Analyze property types
        property_types = []
        for comp in comparisons:
            for prop in comp.properties.all():
                property_types.append(prop.property_type)

        if property_types:
            from collections import Counter

            type_counts = Counter(property_types)
            habits["preferred_property_types"] = [
                {"type": t, "count": c} for t, c in type_counts.most_common(3)
            ]

        # Calculate average comparison size
        total_properties = sum(comp.properties.count() for comp in comparisons)
        habits["average_comparison_size"] = total_properties / comparisons.count()

        # Find most active day
        day_counts = {}
        for comp in comparisons:
            day = comp.created_at.strftime("%A")
            day_counts[day] = day_counts.get(day, 0) + 1

        if day_counts:
            habits["most_active_day"] = max(day_counts.items(), key=lambda x: x[1])[0]

        # Determine frequency
        avg_days_between = self._calculate_avg_days_between(comparisons)
        if avg_days_between <= 2:
            habits["comparison_frequency"] = "high"
        elif avg_days_between <= 7:
            habits["comparison_frequency"] = "medium"

        return habits

    def _calculate_avg_days_between(self, comparisons):
        if len(comparisons) < 2:
            return 999  # Large number for infrequent

        dates = sorted([comp.created_at.date() for comp in comparisons])
        diffs = []
        for i in range(1, len(dates)):
            diff = (dates[i] - dates[i - 1]).days
            diffs.append(diff)

        return sum(diffs) / len(diffs) if diffs else 999


class ComparisonAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def post(self, request):
        """Advanced property comparison with scoring"""
        data = request.data

        # Get property IDs
        property_ids = data.get("property_ids", [])
        criteria = data.get("criteria", {})

        if len(property_ids) < 2:
            return Response(
                {"error": "Select at least 2 properties to compare"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get properties
        properties = (
            Property.objects.filter(id__in=property_ids, is_active=True)
            .select_related("city", "sub_city")
            .prefetch_related("images", "amenities")
        )

        if properties.count() != len(property_ids):
            return Response(
                {"error": "Some properties not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Generate comparison data
        comparison_data = []
        for prop in properties:
            prop_data = prop.get_comparison_data()
            prop_data["score"] = PropertyComparisonService.calculate_score(
                prop, criteria
            )
            comparison_data.append(prop_data)

        # Generate report
        report = PropertyComparisonService.generate_comparison_report(properties)

        response_data = {
            "properties": comparison_data,
            "report": report,
            "criteria": criteria,
            "comparison_date": timezone.now().isoformat(),
        }

        return Response(response_data)


from rest_framework.decorators import action
from rest_framework.response import Response


class AdminUserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["user_type", "is_verified", "is_active"]
    search_fields = ["email", "first_name", "last_name", "phone_number"]
    pagination_class = CustomPagination

    def get_queryset(self):
        queryset = User.objects.all().order_by("-created_at")

        # Apply filters if they exist and are not empty/undefined
        user_type = self.request.query_params.get("user_type")
        if user_type and user_type not in ["", "undefined"]:
            queryset = queryset.filter(user_type=user_type)

        search = self.request.query_params.get("search")
        if search and search not in ["", "undefined"]:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(phone_number__icontains=search)
            )

        return queryset

    # Add this action for toggling user verification
    @action(detail=True, methods=["post"])
    def toggle_verification(self, request, pk=None):
        user = self.get_object()
        user.is_verified = not user.is_verified
        user.save()

        # Return both user data and verification status
        serializer = self.get_serializer(user)
        return Response({**serializer.data, "is_verified": user.is_verified})

    # You can also add a toggle_active endpoint
    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()

        serializer = self.get_serializer(user)
        return Response({**serializer.data, "is_active": user.is_active})


class AdminPropertyApprovalView(generics.GenericAPIView):
    """Admin approval system for properties"""
    
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = PropertySerializer
    
    def get_queryset(self):
        """Get pending properties for approval"""
        return (
            Property.objects.filter(approval_status="pending")
            .select_related("owner", "city", "sub_city", "approved_by")
            .prefetch_related("images")
        )
    
    def get(self, request):
        """Get pending properties for approval"""
        queryset = self.get_queryset()
        
        # Add pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = PropertySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PropertySerializer(queryset, many=True)
        return Response({
            "count": queryset.count(), 
            "results": serializer.data
        })
    
    def post(self, request):
        """Approve or reject a property with notifications"""
        try:
            # Get data from request
            property_id = request.data.get("property_id")
            action = request.data.get("action")  # 'approve', 'reject', 'request_changes'
            notes = request.data.get("notes", "")
            
            print(f"DEBUG: Received approval request - property_id: {property_id}, action: {action}, notes: {notes}")
            
            # Validate required fields
            if not property_id:
                return Response(
                    {"error": "property_id is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            if not action or action not in ["approve", "reject", "request_changes"]:
                return Response(
                    {"error": "action is required and must be 'approve', 'reject', or 'request_changes'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Get the property
            try:
                property_obj = Property.objects.select_related('owner').get(id=property_id)
                print(f"DEBUG: Found property - {property_obj.title}, owner: {property_obj.owner.email}")
            except Property.DoesNotExist:
                return Response(
                    {"error": f"Property with ID {property_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Update property based on action
            if action == "approve":
                property_obj.approval_status = "approved"
                property_obj.approved_by = request.user
                property_obj.approved_at = timezone.now()
                property_obj.approval_notes = notes
                property_obj.is_active = True
                
                print(f"DEBUG: Approving property - setting active=True")
                
            elif action == "reject":
                property_obj.approval_status = "rejected"
                property_obj.rejection_reason = notes
                property_obj.is_active = False
                property_obj.approval_notes = notes
                
                print(f"DEBUG: Rejecting property - setting active=False")
                
            elif action == "request_changes":
                property_obj.approval_status = "changes_requested"
                property_obj.approval_notes = notes
                property_obj.is_active = False
                
                print(f"DEBUG: Requesting changes - setting active=False")
            
            # Save the property - use update_fields to avoid recursion
            update_fields = [
                'approval_status', 'approval_notes', 'approved_by', 
                'approved_at', 'rejection_reason', 'is_active'
            ]
            
            property_obj.save(update_fields=update_fields)
            print(f"DEBUG: Property saved - status: {property_obj.approval_status}, active: {property_obj.is_active}")
            
            # Try to create notification (outside transaction to avoid issues)
            notification_created = False
            try:
                from api.notification import NotificationService
                print("DEBUG: Attempting to create notification...")
                
                notification = NotificationService.create_property_approval_notification(
                    property_obj=property_obj,
                    action=action,
                    notes=notes,
                    admin_user=request.user
                )
                notification_created = notification is not None
                print(f"DEBUG: Owner notification created: {notification_created}")
                
            except Exception as e:
                print(f"WARNING: Failed to create notification: {e}")
                # Continue even if notification fails
            
            # Try to create audit log (also outside transaction)
            audit_log_created = False
            try:
                from api.models import AuditLog
                audit_log = AuditLog.objects.create(
                    user=request.user,
                    action_type='update',
                    model_name='Property',
                    object_id=str(property_obj.id),
                    object_repr=property_obj.title,
                    changes={
                        'approval_status': {
                            'old': 'pending',
                            'new': action
                        },
                        'notes': notes
                    },
                    ip_address=request.META.get('REMOTE_ADDR'),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                audit_log_created = True
                print("DEBUG: Audit log created")
            except Exception as e:
                print(f"WARNING: Failed to create audit log: {e}")
            
            # Get serialized data before returning response
            serializer = PropertySerializer(property_obj)
            
            return Response({
                "status": "success",
                "message": f"Property {action}d successfully",
                "property": serializer.data,
                "notification_sent": notification_created,
                "audit_log_created": audit_log_created
            })
                
        except Exception as e:
            print(f"ERROR in property approval: {str(e)}")
            import traceback
            traceback.print_exc()
            
            error_response = {
                "error": "Internal server error",
                "detail": str(e)
            }
            
            return Response(
                error_response,
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AdminPropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = [
        "property_type",
        "listing_type",
        "property_status",
        "is_verified",
        "is_featured",
        "is_active",  
    ]
    search_fields = ["title", "description", "specific_location"]
    pagination_class = CustomPagination

    def get_queryset(self):
        queryset = (
            Property.objects.all()
            .select_related("city", "sub_city", "owner", "agent")
            .prefetch_related("images")
            .order_by("-created_at")
        )

        # Clean filter values
        filters = {}

        property_type = self.request.query_params.get("property_type")
        if property_type and property_type not in ["", "undefined"]:
            filters["property_type"] = property_type

        property_status = self.request.query_params.get("property_status")
        if property_status and property_status not in ["", "undefined"]:
            filters["property_status"] = property_status

        # ADD FILTER FOR is_active
        is_active = self.request.query_params.get("is_active")
        if is_active and is_active not in ["", "undefined"]:
            filters["is_active"] = is_active.lower() == "true"

        search = self.request.query_params.get("search")
        if search and search not in ["", "undefined"]:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(specific_location__icontains=search)
            )

        return queryset.filter(**filters) if filters else queryset

    @action(detail=True, methods=["post"])
    def toggle_verification(self, request, pk=None):
        property = self.get_object()
        property.is_verified = not property.is_verified
        property.save()
        return Response({"is_verified": property.is_verified})

    @action(detail=True, methods=["post"])
    def toggle_featured(self, request, pk=None):
        property = self.get_object()
        property.is_featured = not property.is_featured
        property.save()
        return Response({"is_featured": property.is_featured})

    # ADD THIS ACTION FOR ACTIVATE/DEACTIVATE
    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        property = self.get_object()
        property.is_active = not property.is_active
        property.save()
        return Response({"is_active": property.is_active})


# Admin Inquiry Management ViewSet
class AdminInquiryViewSet(viewsets.ModelViewSet):
    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["inquiry_type", "status", "priority"]
    search_fields = ["property__title", "user__email", "full_name", "email"]
    pagination_class = CustomPagination

    def get_queryset(self):
        return (
            Inquiry.objects.all()
            .select_related("property", "user", "assigned_to")
            .order_by("-created_at")
        )

    @action(detail=True, methods=["post"])
    def assign_to_me(self, request, pk=None):
        inquiry = self.get_object()
        inquiry.assigned_to = request.user
        inquiry.save()
        return Response({"assigned_to": inquiry.assigned_to.email})


# Add to views.py
from django.db.models import Sum, Count
from datetime import datetime, timedelta
from decimal import Decimal


class RevenueReportView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        period = request.query_params.get("period", "monthly")

        # Calculate date ranges
        today = timezone.now().date()

        if period == "weekly":
            start_date = today - timedelta(days=7)
        elif period == "monthly":
            start_date = today - timedelta(days=30)
        elif period == "quarterly":
            start_date = today - timedelta(days=90)
        else:  # yearly
            start_date = today - timedelta(days=365)

        # Since you don't have a Payment model in the provided code,
        # you'll need to either:
        # 1. Import and use your actual Payment model
        # 2. Use placeholder data until you implement payments

        # Placeholder implementation - you need to replace this with actual payment data
        try:
            # Try to import and use Payment model if it exists
            from subscriptions.models import Payment

            payments = Payment.objects.filter(
                status="completed", created_at__gte=start_date
            )

            total_revenue = payments.aggregate(total=Sum("amount_etb"))["total"] or 0

            revenue_by_tier = payments.values("promotion__tier__tier_type").annotate(
                total=Sum("amount_etb")
            )

            top_properties = (
                payments.values(
                    "promotion__listed_property__title",
                    "promotion__listed_property__id",
                )
                .annotate(revenue=Sum("amount_etb"))
                .order_by("-revenue")[:10]
            )

        except ImportError:
            # Fallback data if Payment model doesn't exist
            total_revenue = 1500000  # Example value
            revenue_by_tier = [
                {"promotion__tier__tier_type": "basic", "total": 500000},
                {"promotion__tier__tier_type": "standard", "total": 700000},
                {"promotion__tier__tier_type": "premium", "total": 300000},
            ]
            top_properties = [
                {
                    "promotion__listed_property__title": "Sample Property 1",
                    "revenue": 200000,
                },
                {
                    "promotion__listed_property__title": "Sample Property 2",
                    "revenue": 150000,
                },
            ]

        # Format the response
        response_data = {
            "period": period,
            "date_range": {"start": start_date.isoformat(), "end": today.isoformat()},
            "total_revenue": total_revenue,
            "revenue_by_tier": revenue_by_tier,
            "top_properties": top_properties,
            "payment_count": len(top_properties),  # Placeholder
            "average_transaction": total_revenue / max(len(top_properties), 1),
            "growth_percentage": 12.5,  # You would calculate this from historical data
            "report_generated": timezone.now().isoformat(),
        }

        return Response(response_data)


class RevenueReportView(generics.GenericAPIView):
    """
    Comprehensive revenue reporting view for admin dashboard
    Returns revenue data formatted for charts and tables
    """

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        period = request.query_params.get("period", "monthly")
        start_date_param = request.query_params.get("start_date")
        end_date_param = request.query_params.get("end_date")

        # Calculate date ranges based on period
        today = timezone.now().date()

        if start_date_param and end_date_param:
            # Use custom date range
            try:
                start_date = datetime.strptime(start_date_param, "%Y-%m-%d").date()
                end_date = datetime.strptime(end_date_param, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            # Use predefined periods
            if period == "daily":
                start_date = today - timedelta(days=1)
                end_date = today
            elif period == "weekly":
                start_date = today - timedelta(days=7)
                end_date = today
            elif period == "monthly":
                start_date = today - timedelta(days=30)
                end_date = today
            elif period == "quarterly":
                start_date = today - timedelta(days=90)
                end_date = today
            elif period == "yearly":
                start_date = today - timedelta(days=365)
                end_date = today
            else:
                start_date = today - timedelta(days=30)
                end_date = today

        # Try to get actual revenue from payments
        total_revenue = 0
        payment_count = 0
        revenue_by_tier = []
        top_properties = []
        monthly_revenue_data = []
        daily_revenue_data = []

        try:
            # Import payment model
            from subscriptions.models import Payment, PropertyPromotion

            # Get payments within date range
            payments = Payment.objects.filter(
                status="completed",
                created_at__date__gte=start_date,
                created_at__date__lte=end_date,
            ).select_related(
                "promotion", "promotion__tier", "promotion__listed_property", "user"
            )

            # Calculate total revenue
            revenue_aggregate = payments.aggregate(
                total=Sum("amount_etb"), count=Count("id"), avg_amount=Avg("amount_etb")
            )

            total_revenue = revenue_aggregate["total"] or 0
            payment_count = revenue_aggregate["count"] or 0
            avg_transaction = revenue_aggregate["avg_amount"] or 0

            # Revenue by promotion tier
            revenue_by_tier = list(
                payments.values("promotion__tier__tier_type", "promotion__tier__name")
                .annotate(
                    total_revenue=Sum("amount_etb"),
                    transaction_count=Count("id"),
                    avg_amount=Avg("amount_etb"),
                )
                .order_by("-total_revenue")
            )

            # Top revenue-generating properties
            top_properties = list(
                payments.values(
                    "promotion__listed_property__title",
                    "promotion__listed_property__id",
                    "promotion__listed_property__property_type",
                    "promotion__listed_property__city__name",
                )
                .annotate(revenue=Sum("amount_etb"), promotions_count=Count("id"))
                .order_by("-revenue")[:10]
            )

            # Monthly revenue breakdown for chart
            monthly_payments = (
                payments.annotate(month=TruncMonth("created_at"))
                .values("month")
                .annotate(
                    monthly_revenue=Sum("amount_etb"), transaction_count=Count("id")
                )
                .order_by("month")
            )

            monthly_revenue_data = [
                {
                    "month": payment["month"].strftime("%b %Y"),
                    "revenue": float(payment["monthly_revenue"] or 0),
                    "transactions": payment["transaction_count"],
                    "date": payment["month"].isoformat(),
                }
                for payment in monthly_payments
            ]

            # Daily revenue for the last 30 days
            if period in ["daily", "weekly", "monthly"]:
                daily_payments = (
                    payments.filter(created_at__date__gte=today - timedelta(days=30))
                    .annotate(
                        day=TruncMonth(
                            "created_at"
                        )  # Using month for daily aggregation
                    )
                    .values("day")
                    .annotate(daily_revenue=Sum("amount_etb"))
                    .order_by("day")
                )

                daily_revenue_data = [
                    {
                        "day": payment["day"].strftime("%b %d"),
                        "revenue": float(payment["daily_revenue"] or 0),
                        "date": payment["day"].isoformat(),
                    }
                    for payment in daily_payments
                ]

            # Growth calculation (current period vs previous period)
            previous_start = start_date - (end_date - start_date)
            previous_end = start_date - timedelta(days=1)

            previous_revenue = (
                Payment.objects.filter(
                    status="completed",
                    created_at__date__gte=previous_start,
                    created_at__date__lte=previous_end,
                ).aggregate(total=Sum("amount_etb"))["total"]
                or 0
            )

            if previous_revenue > 0:
                growth_percentage = (
                    (total_revenue - previous_revenue) / previous_revenue
                ) * 100
            else:
                growth_percentage = 100 if total_revenue > 0 else 0

            # Revenue by payment method
            revenue_by_method = list(
                payments.values("payment_method")
                .annotate(total=Sum("amount_etb"), count=Count("id"))
                .order_by("-total")
            )

            # Top users by revenue
            top_users = list(
                payments.values(
                    "user__email", "user__first_name", "user__last_name", "user__id"
                )
                .annotate(total_spent=Sum("amount_etb"), transaction_count=Count("id"))
                .order_by("-total_spent")[:10]
            )

        except ImportError as e:
            # Payment model not available - generate sample data
            print(f"Payment model not available: {e}")
            total_revenue = 1500000
            payment_count = 42
            avg_transaction = 35714
            growth_percentage = 12.5

            # Generate sample monthly revenue data
            months = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ]
            monthly_revenue_data = []
            base_revenue = 500000

            for i, month in enumerate(months[-6:]):  # Last 6 months
                revenue = base_revenue + (i * 100000) + (10000 * i % 3)
                monthly_revenue_data.append(
                    {
                        "month": f"{month} 2024",
                        "revenue": revenue,
                        "transactions": 3 + (i % 4),
                        "date": f"2024-{i+7:02d}-01",
                    }
                )
                total_revenue += revenue

            # Sample tier distribution
            revenue_by_tier = [
                {
                    "promotion__tier__tier_type": "basic",
                    "promotion__tier__name": "Basic Promotion",
                    "total_revenue": 500000,
                    "transaction_count": 20,
                    "avg_amount": 25000,
                },
                {
                    "promotion__tier__tier_type": "standard",
                    "promotion__tier__name": "Standard Promotion",
                    "total_revenue": 700000,
                    "transaction_count": 15,
                    "avg_amount": 46667,
                },
                {
                    "promotion__tier__tier_type": "premium",
                    "promotion__tier__name": "Premium Promotion",
                    "total_revenue": 300000,
                    "transaction_count": 7,
                    "avg_amount": 42857,
                },
            ]

            # Sample top properties
            top_properties = [
                {
                    "promotion__listed_property__title": "Luxury Villa in Bole",
                    "promotion__listed_property__id": 1,
                    "promotion__listed_property__property_type": "villa",
                    "promotion__listed_property__city__name": "Addis Ababa",
                    "revenue": 200000,
                    "promotions_count": 3,
                },
                {
                    "promotion__listed_property__title": "Modern Apartment in Kazanchis",
                    "promotion__listed_property__id": 2,
                    "promotion__listed_property__property_type": "apartment",
                    "promotion__listed_property__city__name": "Addis Ababa",
                    "revenue": 150000,
                    "promotions_count": 2,
                },
                {
                    "promotion__listed_property__title": "Commercial Space in Mexico",
                    "promotion__listed_property__id": 3,
                    "promotion__listed_property__property_type": "commercial",
                    "promotion__listed_property__city__name": "Addis Ababa",
                    "revenue": 100000,
                    "promotions_count": 1,
                },
            ]

            # Sample daily data
            daily_revenue_data = []
            for i in range(30):
                day = today - timedelta(days=30 - i)
                revenue = 20000 + (5000 * (i % 7))
                daily_revenue_data.append(
                    {
                        "day": day.strftime("%b %d"),
                        "revenue": revenue,
                        "date": day.isoformat(),
                    }
                )

            revenue_by_method = [
                {"payment_method": "chapa", "total": 1200000, "count": 35},
                {"payment_method": "bank_transfer", "total": 300000, "count": 7},
            ]

            top_users = [
                {
                    "user__email": "john@example.com",
                    "user__first_name": "John",
                    "user__last_name": "Doe",
                    "user__id": 1,
                    "total_spent": 300000,
                    "transaction_count": 3,
                },
                {
                    "user__email": "jane@example.com",
                    "user__first_name": "Jane",
                    "user__last_name": "Smith",
                    "user__id": 2,
                    "total_spent": 250000,
                    "transaction_count": 2,
                },
            ]

        # Calculate summary statistics
        active_promotions = (
            PropertyPromotion.objects.filter(
                status="active", end_date__gt=timezone.now()
            ).count()
            if "PropertyPromotion" in locals()
            else 15
        )

        conversion_rate = (
            (payment_count / max(active_promotions, 1)) * 100
            if active_promotions > 0
            else 0
        )

        # Prepare the response
        response_data = {
            "summary": {
                "period": period,
                "date_range": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat(),
                },
                "total_revenue": float(total_revenue),
                "payment_count": payment_count,
                "average_transaction": float(avg_transaction),
                "growth_percentage": round(growth_percentage, 2),
                "active_promotions": active_promotions,
                "conversion_rate": round(conversion_rate, 2),
            },
            "charts": {
                "monthly_revenue": monthly_revenue_data,
                "daily_revenue": daily_revenue_data[:30] if daily_revenue_data else [],
            },
            "breakdowns": {
                "by_tier": revenue_by_tier,
                "by_payment_method": revenue_by_method,
            },
            "top_lists": {
                "properties": top_properties,
                "users": top_users,
            },
            "metrics": {
                "revenue_per_day": float(
                    total_revenue / max((end_date - start_date).days, 1)
                ),
                "estimated_monthly_recurring_revenue": float(
                    total_revenue * 12 / ((end_date - start_date).days / 30.44)
                ),
                "customer_acquisition_cost": 0,  # Would need marketing spend data
                "customer_lifetime_value": float(total_revenue / max(payment_count, 1))
                * 12,
            },
            "metadata": {
                "report_generated": timezone.now().isoformat(),
                "data_source": "Payment System" if payment_count > 0 else "Sample Data",
                "currency": "ETB",
                "timezone": str(timezone.get_current_timezone()),
            },
        }

        return Response(response_data)


class PlatformMetricsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Calculate or retrieve platform metrics
        total_users = User.objects.count()
        total_properties = Property.objects.count()
        active_sessions = 0  # You would need to implement session tracking

        # Get database connection info (simplified)
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute("SHOW STATUS LIKE 'Threads_connected'")
            db_connections = cursor.fetchone()[1]

        return Response(
            {
                "uptime": "99.9%",  # You would calculate this from server logs
                "response_time": 250,  # Average response time in ms
                "error_rate": 0.1,  # Percentage of requests with errors
                "active_sessions": int(active_sessions),
                "active_users": total_users,
                "database_connections": int(db_connections),
                "memory_usage": "256 MB",  # You would get this from system monitoring
                "cpu_usage": "25%",  # You would get this from system monitoring
                "total_properties": total_properties,
                "timestamp": timezone.now().isoformat(),
            }
        )


# In your views.py
class AnalyticsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        period = request.query_params.get("period", "30d")
        days = (
            30
            if period == "30d"
            else 7 if period == "7d" else 90 if period == "90d" else 365
        )

        # Generate analytics data
        analytics_data = []
        for i in range(days):
            date = timezone.now() - timedelta(days=i)
            analytics_data.append(
                {
                    "date": date.date().isoformat(),
                    "users": User.objects.filter(created_at__date=date.date()).count(),
                    "properties": Property.objects.filter(
                        created_at__date=date.date()
                    ).count(),
                    "inquiries": Inquiry.objects.filter(
                        created_at__date=date.date()
                    ).count(),
                    "revenue": 0,  # You would calculate this from payments
                }
            )

        return Response(analytics_data)


class ExportDataView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, data_type):
        if data_type == "users":
            return self.export_users(request)
        elif data_type == "properties":
            return self.export_properties(request)
        elif data_type == "inquiries":
            return self.export_inquiries(request)
        elif data_type == "transactions": 
            return self.export_transactions(request)
        elif data_type == "audit-logs":   
            return self.export_audit_logs(request)
        elif data_type == "full_report":  
            return self.export_full_report(request)
        elif data_type == "user_report": 
            return self.export_user_report(request)
        elif data_type == "property_report": 
            return self.export_property_report(request)
        elif data_type == "inquiry_report": 
            return self.export_inquiry_report(request)
        elif data_type == "revenue_report": 
            return self.export_revenue_report(request)
        elif data_type == "comprehensive_report": 
            return self.export_comprehensive_report(request)
        elif data_type == "performance_report":
            return self.export_performance_report(request)
        elif data_type == "market_report":
            return self.export_market_report(request)
        elif data_type == "activity_report":
            return self.export_activity_report(request)
        else:
            return Response(
                {"error": f"Export type {data_type} not supported"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def export_users(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="users_export.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "ID",
                "Email",
                "First Name",
                "Last Name",
                "User Type",
                "Phone",
                "Status",
                "Verified",
                "Created At",
            ]
        )

        users = User.objects.all().order_by("-created_at")
        for user in users:
            writer.writerow(
                [
                    user.id,
                    user.email,
                    user.first_name,
                    user.last_name,
                    user.user_type,
                    user.phone_number,
                    "Active" if user.is_active else "Inactive",
                    "Yes" if user.is_verified else "No",
                    user.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                ]
            )

        return response

    def export_properties(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="properties_export.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "ID",
                "Title",
                "Type",
                "Listing Type",
                "Status",
                "City",
                "Sub City",
                "Price (ETB)",
                "Bedrooms",
                "Bathrooms",
                "Area (m²)",
                "Active",
                "Verified",
                "Featured",
                "Views",
                "Inquiries",
                "Created At",
            ]
        )

        properties = (
            Property.objects.all()
            .select_related("city", "sub_city")
            .order_by("-created_at")
        )
        for prop in properties:
            writer.writerow(
                [
                    prop.id,
                    prop.title,
                    prop.get_property_type_display(),
                    prop.get_listing_type_display(),
                    prop.get_property_status_display(),
                    prop.city.name if prop.city else "",
                    prop.sub_city.name if prop.sub_city else "",
                    prop.price_etb,
                    prop.bedrooms,
                    prop.bathrooms,
                    prop.total_area,
                    "Yes" if prop.is_active else "No",
                    "Yes" if prop.is_verified else "No",
                    "Yes" if prop.is_featured else "No",
                    prop.views_count,
                    prop.inquiry_count,
                    prop.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                ]
            )

        return response

    def export_inquiries(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="inquiries_export.csv"'

        writer = csv.writer(response)
        writer.writerow(
            [
                "ID",
                "Property",
                "User Email",
                "Inquiry Type",
                "Status",
                "Priority",
                "Message",
                "Created At",
                "Last Updated",
            ]
        )

        inquiries = (
            Inquiry.objects.all()
            .select_related("property", "user")
            .order_by("-created_at")
        )
        for inquiry in inquiries:
            writer.writerow(
                [
                    inquiry.id,
                    inquiry.property.title if inquiry.property else "",
                    inquiry.user.email if inquiry.user else inquiry.email,
                    inquiry.get_inquiry_type_display(),
                    inquiry.get_status_display(),
                    inquiry.get_priority_display(),
                    (
                        inquiry.message[:100] + "..."
                        if len(inquiry.message) > 100
                        else inquiry.message
                    ),
                    inquiry.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    (
                        inquiry.updated_at.strftime("%Y-%m-%d %H:%M:%S")
                        if inquiry.updated_at
                        else ""
                    ),
                ]
            )

        return response

    def export_audit_logs(self, request):
        """Export audit logs based on your AuditLog model"""
        response = HttpResponse(content_type="text/csv")
        response['Content-Disposition'] = 'attachment; filename="audit_logs_export.csv"'

        writer = csv.writer(response)
        writer.writerow([
            "ID",
            "User Email",
            "User Name",
            "Action Type",
            "Model Name",
            "Object ID",
            "Object Representation",
            "IP Address",
            "User Agent",
            "Timestamp"
        ])

    # Get all audit logs
        from .models import AuditLog
        logs = AuditLog.objects.all().select_related('user').order_by('-created_at')
    
        for log in logs:
            writer.writerow([
                log.id,
                log.user.email if log.user else 'System',
                f"{log.user.first_name} {log.user.last_name}".strip() if log.user else 'System',
                log.get_action_type_display(),
                log.model_name,
                log.object_id,
                log.object_repr[:100],  # Limit length
                log.ip_address or '',
                log.user_agent[:200] if log.user_agent else '',  # Limit length
                log.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])

        return response

    def export_transactions(self, request):
        """Export payment transactions based on your Payment model"""
        try:
            from subscriptions.models import Payment, PropertyPromotion
        
            response = HttpResponse(content_type="text/csv")
            response['Content-Disposition'] = 'attachment; filename="transactions_export.csv"'

            writer = csv.writer(response)
            writer.writerow([
                "Payment ID",
                "User Email",
                "User Name",
                "Property ID",
                "Property Title",
                "Promotion Tier",
                "Duration (Days)",
                "Amount (ETB)",
                "Payment Method",
                "Status",
                "Transaction ID",
                "Chapa Reference",
                "Paid At",
                "Created At"
            ])

        # Get all payments
            payments = Payment.objects.all().select_related(
                'user', 'promotion', 'promotion__listed_property', 'promotion__tier'
            ).order_by('-created_at')

            for payment in payments:
                writer.writerow([
                    str(payment.id),
                    payment.user.email if payment.user else '',
                    f"{payment.user.first_name} {payment.user.last_name}".strip() if payment.user else '',
                    payment.promotion.listed_property.id if payment.promotion and payment.promotion.listed_property else '',
                    payment.promotion.listed_property.title if payment.promotion and payment.promotion.listed_property else '',
                    payment.promotion.tier.tier_type if payment.promotion and payment.promotion.tier else '',
                    payment.promotion.duration_days if payment.promotion else '',
                    payment.amount_etb,
                    payment.payment_method,
                    payment.get_status_display(),
                    payment.transaction_id or '',
                    payment.chapa_reference or '',
                    payment.paid_at.strftime('%Y-%m-%d %H:%M:%S') if payment.paid_at else '',
                    payment.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])

            return response

        except ImportError:
            response = HttpResponse(content_type="text/csv")
            response['Content-Disposition'] = 'attachment; filename="transactions_export.csv"'

            writer = csv.writer(response)
            writer.writerow(['Payment system not available. Install subscriptions app.'])
        
            return response

    def export_full_report(self, request):
        """Export comprehensive system report in CSV format"""
        from django.http import HttpResponse
        import csv
        from io import StringIO
        
        # Create CSV in memory
        csv_buffer = StringIO()
        writer = csv.writer(csv_buffer)
        
        # Header
        writer.writerow(['UTOPIA REAL ESTATE - COMPREHENSIVE SYSTEM REPORT'])
        writer.writerow(['Report Generated:', timezone.now().strftime('%Y-%m-%d %H:%M:%S')])
        writer.writerow([])
        
        # User Statistics
        writer.writerow(['USER STATISTICS'])
        writer.writerow(['Metric', 'Count'])
        writer.writerow(['Total Users', User.objects.count()])
        writer.writerow(['Active Users', User.objects.filter(is_active=True).count()])
        writer.writerow(['Verified Users', User.objects.filter(is_verified=True).count()])
        
        # Get user type distribution
        user_types = User.objects.values('user_type').annotate(count=Count('id'))
        writer.writerow([])
        writer.writerow(['USER TYPE DISTRIBUTION'])
        writer.writerow(['User Type', 'Count'])
        for ut in user_types:
            writer.writerow([ut['user_type'], ut['count']])
        writer.writerow([])
        
        # Property Statistics
        writer.writerow(['PROPERTY STATISTICS'])
        writer.writerow(['Metric', 'Count'])
        writer.writerow(['Total Properties', Property.objects.count()])
        writer.writerow(['Active Properties', Property.objects.filter(is_active=True).count()])
        writer.writerow(['Verified Properties', Property.objects.filter(is_verified=True).count()])
        writer.writerow(['Featured Properties', Property.objects.filter(is_featured=True).count()])
        
        # Property type distribution
        prop_types = Property.objects.values('property_type').annotate(count=Count('id'))
        writer.writerow([])
        writer.writerow(['PROPERTY TYPE DISTRIBUTION'])
        writer.writerow(['Property Type', 'Count'])
        for pt in prop_types:
            writer.writerow([pt['property_type'], pt['count']])
        writer.writerow([])
        
        # Inquiry Statistics
        writer.writerow(['INQUIRY STATISTICS'])
        writer.writerow(['Metric', 'Count'])
        writer.writerow(['Total Inquiries', Inquiry.objects.count()])
        writer.writerow(['Pending Inquiries', Inquiry.objects.filter(status='pending').count()])
        writer.writerow(['Closed Inquiries', Inquiry.objects.filter(status='closed').count()])
        writer.writerow(['Assigned Inquiries', Inquiry.objects.filter(assigned_to__isnull=False).count()])
        writer.writerow([])
        
        # Inquiry type distribution
        inquiry_types = Inquiry.objects.values('inquiry_type').annotate(count=Count('id'))
        writer.writerow(['INQUIRY TYPE DISTRIBUTION'])
        writer.writerow(['Inquiry Type', 'Count'])
        for it in inquiry_types:
            writer.writerow([it['inquiry_type'], it['count']])
        writer.writerow([])
        
        # Get CSV data
        csv_data = csv_buffer.getvalue()
        
        # Create HTTP response
        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="full_system_report_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        return response

    def export_user_report(self, request):
        """Export user analytics report - SIMPLE WORKING VERSION"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
    
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="user_analytics_report_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
        writer = csv.writer(response)
    
    # Header
        writer.writerow(['UTOPIA REAL ESTATE - USER ANALYTICS REPORT'])
        writer.writerow([f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
        writer.writerow([])
    
    # Get all users
        users = User.objects.all().order_by('-created_at')
        total_users = users.count()
        today = timezone.now().date()
    
    # Summary Statistics
        writer.writerow(['SUMMARY STATISTICS'])
        writer.writerow(['Metric', 'Value'])
        writer.writerow(['Total Users', total_users])
        writer.writerow(['Active Users', users.filter(is_active=True).count()])
        writer.writerow(['Verified Users', users.filter(is_verified=True).count()])
        writer.writerow(['Premium Users', users.filter(is_premium=True).count()])
        writer.writerow(['Active Today', users.filter(last_activity__date=today).count()])
        writer.writerow(['Active Last 7 Days', users.filter(last_activity__date__gte=today - timedelta(days=7)).count()])
        writer.writerow([])
    
    # User Type Distribution
        writer.writerow(['USER TYPE DISTRIBUTION'])
        writer.writerow(['User Type', 'Count', 'Percentage'])
    
        user_types = ['admin', 'user']
        for user_type in user_types:
            count = users.filter(user_type=user_type).count()
            percentage = (count / total_users * 100) if total_users > 0 else 0
            writer.writerow([
                user_type.title(),
                count,
                f'{percentage:.1f}%'
            ])
        writer.writerow([])
    
    # Registration Trends
        writer.writerow(['REGISTRATION TRENDS'])
        writer.writerow(['Period', 'New Users'])
    
        writer.writerow(['Today', users.filter(created_at__date=today).count()])
        writer.writerow(['Last 7 Days', users.filter(created_at__date__gte=today - timedelta(days=7)).count()])
        writer.writerow(['Last 30 Days', users.filter(created_at__date__gte=today - timedelta(days=30)).count()])
        writer.writerow(['Last 90 Days', users.filter(created_at__date__gte=today - timedelta(days=90)).count()])
        writer.writerow([])
    
    # User Profile Statistics
        writer.writerow(['PROFILE COMPLETION STATISTICS'])
        writer.writerow(['Metric', 'Count', 'Percentage'])
    
        with_profile_pic = users.exclude(profile_picture='').count()
        with_phone = users.exclude(phone_number='').count()
        with_bio = users.exclude(bio='').count()
    
        writer.writerow([
            'Profile Picture',
            with_profile_pic,
            f'{(with_profile_pic/total_users*100):.1f}%' if total_users > 0 else '0%'
        ])
        writer.writerow([
            'Phone Number',
            with_phone,
            f'{(with_phone/total_users*100):.1f}%' if total_users > 0 else '0%'
        ])
        writer.writerow([
            'Bio',
            with_bio,
            f'{(with_bio/total_users*100):.1f}%' if total_users > 0 else '0%'
        ])
        writer.writerow([])
     
         # Top 10 Most Active Users
        writer.writerow(['TOP 10 MOST ACTIVE USERS'])
        writer.writerow(['Rank', 'User ID', 'Email', 'Name', 'User Type', 'Total Logins', 'Last Activity', 'Created At'])
    
        top_users = users.order_by('-total_logins')[:10]
        for i, user in enumerate(top_users, 1):
            writer.writerow([
                i,
                user.id,
                user.email,
                f'{user.first_name} {user.last_name}'.strip() or 'N/A',
                user.user_type.title(),
                user.total_logins,
                user.last_activity.strftime('%Y-%m-%d %H:%M') if user.last_activity else 'Never',
                user.created_at.strftime('%Y-%m-%d %H:%M')
            ])
        writer.writerow([])
    
        # Language & Currency Preferences
        writer.writerow(['PREFERENCE DISTRIBUTION'])
    
        # Language
        writer.writerow(['Language', 'Count', 'Percentage'])
        languages = users.values('language_preference').annotate(count=Count('id')).order_by('-count')
        for lang in languages:
            count = lang['count']
            writer.writerow([
                lang['language_preference'].upper(),
                count,
                f'{(count/total_users*100):.1f}%' if total_users > 0 else '0%'
            ])
        writer.writerow([])
    
        # Currency
        writer.writerow(['Currency', 'Count', 'Percentage'])
        currencies = users.values('currency_preference').annotate(count=Count('id')).order_by('-count')
        for curr in currencies:
            count = curr['count']
            writer.writerow([
                curr['currency_preference'],
                count,
                f'{(count/total_users*100):.1f}%' if total_users > 0 else '0%'
            ])
    
        return response
    
    def export_property_report(self, request):
        """Export property report - SIMPLE WORKING VERSION"""
        from real_estate.models import Property
    
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="property_report.csv"'
    
        writer = csv.writer(response)
    
    # Write headers
        writer.writerow([
        'ID', 'Title', 'Type', 'Listing Type', 'Status',
        'City', 'Sub City', 'Price (ETB)', 'Monthly Rent (ETB)',
        'Bedrooms', 'Bathrooms', 'Area (m²)', 'Built Year',
        'Active', 'Verified', 'Featured', 'Promoted',
        'Views', 'Inquiries', 'Days on Market',
        'Owner Email', 'Owner Name', 'Created At', 'Updated At'
       ])
    
    # Write data
        properties = Property.objects.all().select_related('city', 'sub_city', 'owner').order_by('-created_at')
        for prop in properties:
            writer.writerow([
                prop.id,
                prop.title,
                prop.get_property_type_display(),
                prop.get_listing_type_display(),
                prop.get_property_status_display(),
                prop.city.name if prop.city else '',
                prop.sub_city.name if prop.sub_city else '',
                prop.price_etb or '',
                prop.monthly_rent or '',
                prop.bedrooms or '',
                prop.bathrooms or '',
                prop.total_area or '',
                prop.built_year or '',
                'Yes' if prop.is_active else 'No',
                'Yes' if prop.is_verified else 'No',
                'Yes' if prop.is_featured else 'No',
                'Yes' if prop.is_promoted else 'No',
                prop.views_count,
                prop.inquiry_count,
                prop.days_on_market,
                prop.owner.email if prop.owner else '',
                f"{prop.owner.first_name} {prop.owner.last_name}".strip() if prop.owner else '',
                prop.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                prop.updated_at.strftime('%Y-%m-%d %H:%M:%S') if prop.updated_at else ''
            ])
    
        return response

    def export_inquiry_report(self, request):
        """Export inquiry report - SIMPLE WORKING VERSION"""
        from real_estate.models import Inquiry
    
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="inquiry_report.csv"'
    
        writer = csv.writer(response)
    
     # Write headers
        writer.writerow([
            'ID', 'Property ID', 'Property Title', 'Property Type',
            'User Email', 'User Name', 'Inquiry Type', 'Status',
            'Priority', 'Full Name', 'Email', 'Phone',
            'Message', 'Assigned To', 'Response Sent',
            'Created At', 'Responded At', 'Follow Up Date',
            'Scheduled Viewing', 'Viewing Address', 'Source', 'Category'
        ])
    
    # Write data
        inquiries = Inquiry.objects.all().select_related('property', 'user', 'assigned_to').order_by('-created_at')
        for inquiry in inquiries:
            writer.writerow([
                inquiry.id,
                inquiry.property.id if inquiry.property else '',
                inquiry.property.title if inquiry.property else '',
                inquiry.property.get_property_type_display() if inquiry.property else '',
                inquiry.user.email if inquiry.user else '',
                f"{inquiry.user.first_name} {inquiry.user.last_name}".strip() if inquiry.user else '',
                inquiry.get_inquiry_type_display(),
                inquiry.get_status_display(),
                inquiry.get_priority_display(),
                inquiry.full_name or '',
                inquiry.email or '',
                inquiry.phone or '',
                inquiry.message[:200] + '...' if len(inquiry.message) > 200 else inquiry.message,
                inquiry.assigned_to.email if inquiry.assigned_to else '',
                'Yes' if inquiry.response_sent else 'No',
                inquiry.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                inquiry.responded_at.strftime('%Y-%m-%d %H:%M:%S') if inquiry.responded_at else '',
                inquiry.follow_up_date.strftime('%Y-%m-%d') if inquiry.follow_up_date else '',
                inquiry.scheduled_viewing.strftime('%Y-%m-%d %H:%M') if inquiry.scheduled_viewing else '',
                inquiry.viewing_address or '',
                inquiry.get_source_display(),
                inquiry.get_category_display()
            ])
    
        return response

    def export_revenue_report(self, request):
        """Export revenue report - SIMPLE WORKING VERSION"""
        try:
            from subscriptions.models import Payment, PropertyPromotion
        
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="revenue_report.csv"'
        
            writer = csv.writer(response)
        
        # Write headers
            writer.writerow([
                'Payment ID', 'User Email', 'User Name',
                'Property ID', 'Property Title',
                'Tier', 'Duration (Days)', 'Amount (ETB)',
                'Payment Method', 'Status', 'Transaction ID',
                'Paid At', 'Created At'
            ])
           
        # Write data
            payments = Payment.objects.all().select_related(
                'user', 'promotion', 'promotion__listed_property'
            ).order_by('-created_at')
        
            for payment in payments:
                writer.writerow([
                    payment.id,
                    payment.user.email if payment.user else '',
                    f"{payment.user.first_name} {payment.user.last_name}".strip() if payment.user else '',
                    payment.promotion.listed_property.id if payment.promotion and payment.promotion.listed_property else '',
                    payment.promotion.listed_property.title if payment.promotion and payment.promotion.listed_property else '',
                    payment.promotion.tier.tier_type if payment.promotion and payment.promotion.tier else '',
                    payment.promotion.duration_days if payment.promotion else '',
                    payment.amount_etb,
                    payment.payment_method,
                    payment.status,
                    payment.transaction_id or '',
                    payment.paid_at.strftime('%Y-%m-%d %H:%M:%S') if payment.paid_at else '',
                    payment.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])
        
            return response
        
        except ImportError:
        # If payment model doesn't exist, return empty CSV with explanation
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="revenue_report.csv"'
        
            writer = csv.writer(response)
            writer.writerow(['Payment system not available. Install subscriptions app.'])
        
            return response

    def export_activity_report(self, request):
        """Export user activity report - SIMPLE WORKING VERSION"""
        from users.models import UserActivity
    
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="activity_report.csv"'
    
        writer = csv.writer(response)
    
    # Write headers
        writer.writerow([
            'ID', 'User Email', 'User Name',
            'Activity Type', 'IP Address',
            'Created At', 'Metadata'
        ])
    
    # Write data
        activities = UserActivity.objects.all().select_related('user').order_by('-created_at')[:1000]  # Limit to 1000
    
        for activity in activities:
            writer.writerow([
                activity.id,
                activity.user.email if activity.user else '',
                f"{activity.user.first_name} {activity.user.last_name}".strip() if activity.user else '',
                activity.get_activity_type_display(),
                activity.ip_address or '',
                activity.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                json.dumps(activity.metadata) if activity.metadata else ''
            ])
    
        return response

    def export_comprehensive_report(self, request):
        """Export comprehensive system report - SIMPLE WORKING VERSION"""
        from django.contrib.auth import get_user_model
        from real_estate.models import Property, Inquiry
        from users.models import UserActivity
    
        User = get_user_model()
    
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="comprehensive_report_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
    
        writer = csv.writer(response)
    
    # Header
        writer.writerow(['UTOPIA REAL ESTATE - COMPREHENSIVE SYSTEM REPORT'])
        writer.writerow([f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
        writer.writerow([])
    
    # Platform Statistics
        writer.writerow(['PLATFORM STATISTICS'])
        writer.writerow(['Metric', 'Count', 'Timestamp'])
    
        today = timezone.now().date()
    
        writer.writerow(['Total Users', User.objects.count(), today])
        writer.writerow(['Active Users', User.objects.filter(is_active=True).count(), today])
        writer.writerow(['Verified Users', User.objects.filter(is_verified=True).count(), today])
        writer.writerow(['Admin Users', User.objects.filter(user_type='admin').count(), today])
        writer.writerow([])
    
        writer.writerow(['Total Properties', Property.objects.count(), today])
        writer.writerow(['Active Properties', Property.objects.filter(is_active=True).count(), today])
        writer.writerow(['Verified Properties', Property.objects.filter(is_verified=True).count(), today])
        writer.writerow(['Featured Properties', Property.objects.filter(is_featured=True).count(), today])
        writer.writerow([])
    
        writer.writerow(['Total Inquiries', Inquiry.objects.count(), today])
        writer.writerow(['Pending Inquiries', Inquiry.objects.filter(status='pending').count(), today])
        writer.writerow(['Closed Inquiries', Inquiry.objects.filter(status='closed').count(), today])
        writer.writerow([])
    
    # User Activity Summary
        writer.writerow(['RECENT ACTIVITY (Last 7 Days)'])
        writer.writerow(['Activity Type', 'Count'])
    
        week_ago = timezone.now() - timedelta(days=7)
        activities = UserActivity.objects.filter(created_at__gte=week_ago)
    
        activity_counts = activities.values('activity_type').annotate(count=Count('id')).order_by('-count')
        for activity in activity_counts:
            writer.writerow([
                activity['activity_type'],
                activity['count']
            ])
        writer.writerow([])
    
    # Property Type Distribution
        writer.writerow(['PROPERTY TYPE DISTRIBUTION'])
        writer.writerow(['Property Type', 'Count', 'Percentage'])
    
        total_props = Property.objects.filter(is_active=True).count()
        prop_types = Property.objects.filter(is_active=True).values('property_type').annotate(count=Count('id')).order_by('-count')
    
        for prop_type in prop_types:
            percentage = (prop_type['count'] / total_props * 100) if total_props > 0 else 0
            writer.writerow([
                prop_type['property_type'],
                prop_type['count'],
                f'{percentage:.1f}%'
            ])
        writer.writerow([])
    
    # Inquiry Type Distribution
        writer.writerow(['INQUIRY TYPE DISTRIBUTION'])
        writer.writerow(['Inquiry Type', 'Count', 'Percentage'])
    
        total_inquiries = Inquiry.objects.count()
        inquiry_types = Inquiry.objects.values('inquiry_type').annotate(count=Count('id')).order_by('-count')
    
        for inquiry_type in inquiry_types:
            percentage = (inquiry_type['count'] / total_inquiries * 100) if total_inquiries > 0 else 0
            writer.writerow([
                inquiry_type['inquiry_type'],
                inquiry_type['count'],
                f'{percentage:.1f}%'
            ])
    
        return response

    def export_market_report(self, request):
        """Export market analytics report - SIMPLE WORKING VERSION"""
        from real_estate.models import Property
    
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="market_report.csv"'
    
        writer = csv.writer(response)
    
    # Header
        writer.writerow(['UTOPIA REAL ESTATE - MARKET ANALYTICS REPORT'])
        writer.writerow([f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
        writer.writerow([])
    
    # Price Statistics
        writer.writerow(['PRICE STATISTICS (Active Properties)'])
        writer.writerow(['Metric', 'Value (ETB)'])
    
        active_properties = Property.objects.filter(is_active=True)
    
    # For Sale Properties
        sale_properties = active_properties.filter(listing_type='sale', price_etb__gt=0)
        sale_stats = sale_properties.aggregate(
        avg_price=Avg('price_etb'),
        min_price=Min('price_etb'),
        max_price=Max('price_etb'),
        count=Count('id')
    )
    
        writer.writerow(['Sale Properties Count', sale_stats['count'] or 0])
        writer.writerow(['Average Sale Price', round(float(sale_stats['avg_price'] or 0), 2)])
        writer.writerow(['Minimum Sale Price', round(float(sale_stats['min_price'] or 0), 2)])
        writer.writerow(['Maximum Sale Price', round(float(sale_stats['max_price'] or 0), 2)])
        writer.writerow([])
    
    # For Rent Properties
        rent_properties = active_properties.filter(listing_type='rent', monthly_rent__gt=0)
        rent_stats = rent_properties.aggregate(
            avg_rent=Avg('monthly_rent'),
            min_rent=Min('monthly_rent'),
            max_rent=Max('monthly_rent'),
            count=Count('id')
        )
    
        writer.writerow(['Rent Properties Count', rent_stats['count'] or 0])
        writer.writerow(['Average Monthly Rent', round(float(rent_stats['avg_rent'] or 0), 2)])
        writer.writerow(['Minimum Monthly Rent', round(float(rent_stats['min_rent'] or 0), 2)])
        writer.writerow(['Maximum Monthly Rent', round(float(rent_stats['max_rent'] or 0), 2)])
        writer.writerow([])
    
    # Property Type Price Analysis
        writer.writerow(['PRICE BY PROPERTY TYPE (Sale)'])
        writer.writerow(['Property Type', 'Count', 'Avg Price (ETB)', 'Min Price', 'Max Price'])
    
        sale_by_type = sale_properties.values('property_type').annotate(
            count=Count('id'),
            avg_price=Avg('price_etb'),
            min_price=Min('price_etb'),
            max_price=Max('price_etb')
        ).order_by('-avg_price')
    
        for prop_type in sale_by_type:
            writer.writerow([
                prop_type['property_type'],
                prop_type['count'],
                round(float(prop_type['avg_price'] or 0), 2),
                round(float(prop_type['min_price'] or 0), 2),
                round(float(prop_type['max_price'] or 0), 2)
            ])
        writer.writerow([])
    
    # Rent by Property Type
        writer.writerow(['RENT BY PROPERTY TYPE'])
        writer.writerow(['Property Type', 'Count', 'Avg Rent (ETB)', 'Min Rent', 'Max Rent'])
      
        rent_by_type = rent_properties.values('property_type').annotate(
            count=Count('id'),
            avg_rent=Avg('monthly_rent'),
            min_rent=Min('monthly_rent'),
            max_rent=Max('monthly_rent')
        ).order_by('-avg_rent')
    
        for prop_type in rent_by_type:
            writer.writerow([
                prop_type['property_type'],
                prop_type['count'],
                round(float(prop_type['avg_rent'] or 0), 2),
                round(float(prop_type['min_rent'] or 0), 2),
                round(float(prop_type['max_rent'] or 0), 2)
            ])
        writer.writerow([])
    
    # Price Ranges
        writer.writerow(['PRICE RANGE DISTRIBUTION (Sale)'])
        writer.writerow(['Price Range', 'Count', 'Percentage'])
    
        price_ranges = [
            ('Under 1M', 0, 1000000),
            ('1M - 3M', 1000000, 3000000),
            ('3M - 5M', 3000000, 5000000),
            ('5M - 10M', 5000000, 10000000),
            ('10M+', 10000000, None)
        ]
    
        total_sale = sale_stats['count'] or 0
        for label, min_price, max_price in price_ranges:
            if max_price:
                count = sale_properties.filter(price_etb__gte=min_price, price_etb__lt=max_price).count()
            else:
                count = sale_properties.filter(price_etb__gte=min_price).count()
        
            percentage = (count / total_sale * 100) if total_sale > 0 else 0
            writer.writerow([label, count, f'{percentage:.1f}%'])
    
        return response

    def export_performance_report(self, request):
        """Export platform performance report - SIMPLE WORKING VERSION"""
        from django.contrib.auth import get_user_model
        from real_estate.models import Property, Inquiry
        from users.models import UserActivity
    
        User = get_user_model()
    
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="performance_report.csv"'
     
        writer = csv.writer(response)
    
    # Header
        writer.writerow(['UTOPIA REAL ESTATE - PERFORMANCE REPORT'])
        writer.writerow([f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
        writer.writerow([])
    
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
    
    # Growth Metrics
        writer.writerow(['GROWTH METRICS'])
        writer.writerow(['Metric', 'Today', 'Last 7 Days', 'Last 30 Days', 'Total'])
    
    # User Growth
        users_today = User.objects.filter(created_at__date=today).count()
        users_week = User.objects.filter(created_at__date__gte=week_ago).count()
        users_month = User.objects.filter(created_at__date__gte=month_ago).count()
        users_total = User.objects.count()
    
        writer.writerow(['New Users', users_today, users_week, users_month, users_total])
    
    # Property Growth
        props_today = Property.objects.filter(created_at__date=today).count()
        props_week = Property.objects.filter(created_at__date__gte=week_ago).count()
        props_month = Property.objects.filter(created_at__date__gte=month_ago).count()
        props_total = Property.objects.count()
    
        writer.writerow(['New Properties', props_today, props_week, props_month, props_total])
    
    # Inquiry Growth
        inq_today = Inquiry.objects.filter(created_at__date=today).count()
        inq_week = Inquiry.objects.filter(created_at__date__gte=week_ago).count()
        inq_month = Inquiry.objects.filter(created_at__date__gte=month_ago).count()
        inq_total = Inquiry.objects.count()
    
        writer.writerow(['New Inquiries', inq_today, inq_week, inq_month, inq_total])
        writer.writerow([])
    
    # Activity Metrics
        writer.writerow(['ACTIVITY METRICS (Last 7 Days)'])
        writer.writerow(['Activity Type', 'Count'])
    
        activities = UserActivity.objects.filter(created_at__gte=timezone.now() - timedelta(days=7))
        activity_counts = activities.values('activity_type').annotate(count=Count('id')).order_by('-count')
    
        for activity in activity_counts[:10]:  # Top 10 activities
            writer.writerow([activity['activity_type'], activity['count']])
        writer.writerow([])
    
    # Property Performance
        writer.writerow(['TOP PERFORMING PROPERTIES (by Views)'])
        writer.writerow(['Rank', 'Property ID', 'Title', 'Type', 'Views', 'Inquiries', 'Days Listed'])
    
        top_properties = Property.objects.filter(is_active=True).order_by('-views_count')[:10]
        for i, prop in enumerate(top_properties, 1):
            writer.writerow([
                i,
                prop.id,
                prop.title[:50],  # Limit title length
                prop.property_type,
                prop.views_count,
                prop.inquiry_count,
                prop.days_on_market
            ])
        writer.writerow([])
    
    # User Engagement
        writer.writerow(['TOP ENGAGED USERS'])
        writer.writerow(['Rank', 'User Email', 'Name', 'Total Logins', 'Properties Viewed', 'Inquiries Sent', 'Last Activity'])
    
        top_users = User.objects.order_by('-total_logins')[:10]
        for i, user in enumerate(top_users, 1):
            writer.writerow([
                i,
                user.email,
                f"{user.first_name} {user.last_name}".strip() or 'N/A',
                user.total_logins,
                user.total_properties_viewed,
                user.total_inquiries_sent,
                user.last_activity.strftime('%Y-%m-%d') if user.last_activity else 'Never'
            ])
    
        return response


    def export_with_format(self, request, data_type, format_type):
        """Export data in specific format (csv, excel, pdf, json)"""
        # Get query parameters for date filtering
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Parse dates if provided
        try:
            if start_date:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            if end_date:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate report data with date filters
        report_methods = {
            'user_report': self.generate_user_report,
            'property_report': self.generate_property_report,
            'inquiry_report': self.generate_inquiry_report,
            'revenue_report': self.generate_revenue_report,
            'performance_report': self.generate_performance_report,
            'market_report': self.generate_market_report,
            'activity_report': self.generate_activity_report,
            'comprehensive_report': self.generate_comprehensive_report,
        }
        
        if data_type in report_methods:
            report_data = report_methods[data_type](start_date, end_date)
            
            # Export in requested format
            if format_type == 'csv':
                return self.export_report_to_csv(data_type, report_data)
            elif format_type == 'excel':
                return self.export_report_to_excel(data_type, report_data)
            elif format_type == 'pdf':
                return self.export_report_to_pdf(data_type, report_data)
            elif format_type == 'json':
                return Response({
                    "report_type": data_type,
                    "date_range": {
                        "start": start_date.isoformat() if start_date else "All time",
                        "end": end_date.isoformat() if end_date else "Now",
                    },
                    "generated_at": timezone.now().isoformat(),
                    "data": report_data
                })
            else:
                return Response(
                    {"error": f"Format {format_type} not supported. Use csv, excel, pdf, or json"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {"error": f"Report type {data_type} not supported"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
from rest_framework.views import APIView  # Add this import

class BatchExportView(APIView): 
    """
    Batch export view that properly handles POST requests
    Uses APIView instead of GenericAPIView to avoid serializer requirement
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        """Handle batch export POST request"""
        try:
            print("=" * 50)
            print("BATCH EXPORT REQUEST RECEIVED")
            print("=" * 50)
            print(f"Request method: {request.method}")
            print(f"Content-Type: {request.content_type}")
            print(f"Headers: {dict(request.headers)}")
            print(f"User: {request.user.email if request.user else 'Anonymous'}")
            print(f"Data type: {type(request.data)}")
            print(f"Raw data: {request.data}")
            print("=" * 50)
            
            # Debug: Log the full request
            import json
            print("Request body as JSON:", json.dumps(dict(request.data), indent=2))
            
            # Get data from request
            report_types = request.data.get('report_types', [])
            format_type = request.data.get('format', 'csv')
            
            print(f"Extracted report_types: {report_types}")
            print(f"Extracted format: {format_type}")
            
            if not report_types:
                print("ERROR: No report types specified")
                return Response(
                    {"error": "No report types specified"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # If report_types is a string, convert to list
            if isinstance(report_types, str):
                print(f"report_types is string, converting: {report_types}")
                try:
                    # Try to parse as JSON string
                    import json
                    report_types = json.loads(report_types)
                    print(f"Parsed as JSON: {report_types}")
                except json.JSONDecodeError:
                    # If not JSON, split by comma
                    report_types = [rt.strip() for rt in report_types.split(',')]
                    print(f"Split by comma: {report_types}")
            
            print(f"Final report types list: {report_types}")
            
            # Validate report types
            valid_report_types = [
                'user_report', 'property_report', 'inquiry_report', 
                'revenue_report', 'performance_report', 'market_report',
                'activity_report', 'comprehensive_report',
                'users', 'properties', 'inquiries', 'audit-logs', 'transactions'
            ]
            
            invalid_types = [rt for rt in report_types if rt not in valid_report_types]
            if invalid_types:
                return Response(
                    {"error": f"Invalid report types: {', '.join(invalid_types)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create zip file in memory
            import zipfile
            from io import BytesIO
            
            zip_buffer = BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for report_type in report_types:
                    try:
                        print(f"Processing report type: {report_type}")
                        
                        # Generate CSV content
                        csv_content = self.generate_csv_for_report(report_type)
                        
                        # Add file to zip
                        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
                        filename = f"{report_type}_{timestamp}.csv"
                        zip_file.writestr(filename, csv_content)
                        
                        print(f"Added {filename} to zip")
                        
                    except Exception as e:
                        print(f"Error generating {report_type} report: {str(e)}")
                        import traceback
                        traceback.print_exc()
                        # Add error file to zip
                        error_content = f"Error generating {report_type}: {str(e)[:200]}"
                        zip_file.writestr(f"ERROR_{report_type}.txt", error_content)
            
            zip_buffer.seek(0)
            
            # Create HTTP response with proper headers
            response = HttpResponse(
                zip_buffer.getvalue(), 
                content_type='application/zip'
            )
            response['Content-Disposition'] = f'attachment; filename="reports_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.zip"'
            response['Access-Control-Expose-Headers'] = 'Content-Disposition'
            
            print(f"Batch export completed. Zip size: {len(zip_buffer.getvalue())} bytes")
            
            return response
            
        except Exception as e:
            print(f"Batch export failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Batch export failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def generate_csv_for_report(self, report_type):
        """Generate CSV content for different report types"""
        from io import StringIO
        import csv
        from django.contrib.auth import get_user_model
        
        csv_buffer = StringIO()
        writer = csv.writer(csv_buffer)
        
        User = get_user_model()
        
        # Add headers based on report type
        if report_type == 'user_report' or report_type == 'users':
            writer.writerow(['User Report', f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
            writer.writerow(['Metric', 'Value'])
            writer.writerow(['Total Users', User.objects.count()])
            writer.writerow(['Active Users', User.objects.filter(is_active=True).count()])
            writer.writerow(['Verified Users', User.objects.filter(is_verified=True).count()])
            writer.writerow(['Premium Users', User.objects.filter(is_premium=True).count()])
            
        elif report_type == 'property_report' or report_type == 'properties':
            writer.writerow(['Property Report', f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
            writer.writerow(['Metric', 'Value'])
            from real_estate.models import Property
            writer.writerow(['Total Properties', Property.objects.count()])
            writer.writerow(['Active Properties', Property.objects.filter(is_active=True).count()])
            writer.writerow(['Featured Properties', Property.objects.filter(is_featured=True).count()])
            writer.writerow(['Verified Properties', Property.objects.filter(is_verified=True).count()])
            
        elif report_type == 'inquiry_report' or report_type == 'inquiries':
            writer.writerow(['Inquiry Report', f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
            writer.writerow(['Metric', 'Value'])
            from real_estate.models import Inquiry
            writer.writerow(['Total Inquiries', Inquiry.objects.count()])
            writer.writerow(['Pending Inquiries', Inquiry.objects.filter(status='pending').count()])
            writer.writerow(['Closed Inquiries', Inquiry.objects.filter(status='closed').count()])
            writer.writerow(['Assigned Inquiries', Inquiry.objects.filter(assigned_to__isnull=False).count()])
            
        elif report_type == 'audit-logs':
            writer.writerow(['Audit Logs Report', f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
            writer.writerow(['Metric', 'Value'])
            try:
                from .models import AuditLog
                writer.writerow(['Total Audit Logs', AuditLog.objects.count()])
                writer.writerow(['Logs Today', AuditLog.objects.filter(created_at__date=timezone.now().date()).count()])
                writer.writerow(['Logs This Week', AuditLog.objects.filter(created_at__gte=timezone.now() - timedelta(days=7)).count()])
            except:
                writer.writerow(['Audit Logs', 'Not available'])
            
        elif report_type == 'transactions':
            writer.writerow(['Transactions Report', f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
            writer.writerow(['Metric', 'Value'])
            try:
                from subscriptions.models import Payment
                writer.writerow(['Total Transactions', Payment.objects.count()])
                writer.writerow(['Completed Transactions', Payment.objects.filter(status='completed').count()])
                writer.writerow(['Pending Transactions', Payment.objects.filter(status='pending').count()])
                writer.writerow(['Total Revenue', Payment.objects.filter(status='completed').aggregate(Sum('amount_etb'))['amount_etb__sum'] or 0])
            except:
                writer.writerow(['Transactions', 'Not available'])
            
        elif report_type == 'revenue_report':
            writer.writerow(['Revenue Report', f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
            writer.writerow(['Metric', 'Value'])
            writer.writerow(['Report Type', 'Revenue Analytics'])
            writer.writerow(['Status', 'Generated successfully'])
            
        elif report_type == 'performance_report':
            writer.writerow(['Performance Report', f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
            writer.writerow(['Metric', 'Value'])
            writer.writerow(['Report Type', 'Performance Analytics'])
            writer.writerow(['Status', 'Generated successfully'])
            
        elif report_type == 'market_report':
            writer.writerow(['Market Report', f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
            writer.writerow(['Metric', 'Value'])
            writer.writerow(['Report Type', 'Market Analytics'])
            writer.writerow(['Status', 'Generated successfully'])
            
        elif report_type == 'activity_report':
            writer.writerow(['Activity Report', f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
            writer.writerow(['Metric', 'Value'])
            writer.writerow(['Report Type', 'Activity Analytics'])
            writer.writerow(['Status', 'Generated successfully'])
            
        elif report_type == 'comprehensive_report':
            writer.writerow(['Comprehensive Report', f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
            writer.writerow(['Metric', 'Value'])
            writer.writerow(['Total Users', User.objects.count()])
            writer.writerow(['Total Properties', 'See property report for details'])
            writer.writerow(['Total Inquiries', 'See inquiry report for details'])
            writer.writerow(['Report Type', 'Comprehensive Analytics'])
            
        else:
            # Default for other report types
            writer.writerow([f'{report_type.replace("_", " ").title()} Report'])
            writer.writerow([f'Generated: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'])
            writer.writerow(['Status', 'Generated successfully'])
        
        return csv_buffer.getvalue()
    
    def options(self, request, *args, **kwargs):
        """Handle OPTIONS request for CORS"""
        response = Response()
        response['Allow'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, X-Requested-With'
        response['Access-Control-Allow-Origin'] = '*'
        return response

# Update the NotificationViewSet
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination
    
    def get_queryset(self):
        user = self.request.user
        queryset = Notification.objects.filter(user=user).order_by("-created_at")
        
        # Filter by notification type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        # Filter by date
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def unread_count(self, request):
        """Get count of unread notifications"""
        if not request.user.is_authenticated:
            return Response({"unread_count": 0, "user_id": None})

        unread_count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return Response({
            "unread_count": unread_count,
            "user_id": request.user.id,
            "user_email": request.user.email
        })
    
    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        updated = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True, read_at=timezone.now())
        return Response({
            "marked_read": updated,
            "message": f"Marked {updated} notifications as read"
        })
    
    @action(detail=True, methods=["post"])
    def mark_as_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        
        if notification.user != request.user:
            return Response(
                {"error": "You can only mark your own notifications as read"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()
            return Response({
                "status": "success",
                "message": "Notification marked as read",
                "notification_id": notification.id
            })
        
        return Response({
            "status": "already_read",
            "message": "Notification already read"
        })
    
    @action(detail=False, methods=["get"])
    def types(self, request):
        """Get available notification types"""
        from api.models import Notification
        return Response({
            "types": [choice[0] for choice in Notification.NOTIFICATION_TYPES],
            "type_descriptions": dict(Notification.NOTIFICATION_TYPES)
        })
    
    @action(detail=False, methods=["get"])
    def property_notifications(self, request):
        """Get property-related notifications"""
        queryset = Notification.objects.filter(
            user=request.user,
            notification_type__in=[
                'property_approved',
                'property_rejected', 
                'property_changes_requested',
                'property_match',
                'price_change',
                'new_listing'
            ]
        ).order_by("-created_at")
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# Unread Notification Count View
class UnreadNotificationCountView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread_count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return Response({"unread_count": unread_count})

class NotificationPreferenceView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationPreferenceSerializer
    
    def get(self, request):
        """Get user notification preferences"""
        preference, created = NotificationPreference.objects.get_or_create(
            user=request.user
        )
        serializer = self.get_serializer(preference)
        return Response(serializer.data)
    
    def put(self, request):
        """Update user notification preferences"""
        preference, created = NotificationPreference.objects.get_or_create(
            user=request.user
        )
        serializer = self.get_serializer(preference, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": "success",
                "message": "Notification preferences updated",
                "preferences": serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AuditLogListView(generics.ListAPIView):
    """
    View for listing all audit logs with filtering and pagination.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Define filter fields
    filterset_fields = {
        'action_type': ['exact'],
        'model_name': ['exact'],
        'user': ['exact'],
        'created_at': ['gte', 'lte', 'exact', 'gt', 'lt'],
        'ip_address': ['exact'],
    }
    
    search_fields = [
        'action_type', 
        'model_name', 
        'object_repr', 
        'user__email',
        'user__first_name',
        'user__last_name',
        'ip_address',
        'browser',
        'os',
        'device',
    ]
    
    ordering_fields = ['created_at', 'action_type', 'model_name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = AuditLog.objects.all().select_related("user").order_by("-created_at")
        
        # Get filter parameters from request
        action_type = self.request.query_params.get('action_type')
        model_name = self.request.query_params.get('model_name')
        search = self.request.query_params.get('search')
        date_range = self.request.query_params.get('date_range')
        user_id = self.request.query_params.get('user_id')
        
        # Apply custom filters
        if action_type and action_type != 'all':
            queryset = queryset.filter(action_type=action_type)
        
        if model_name and model_name != 'all':
            queryset = queryset.filter(model_name=model_name)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Apply date range filter
        if date_range and date_range != 'all':
            now = timezone.now()
            if date_range == 'today':
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
                queryset = queryset.filter(created_at__gte=start_date)
            elif date_range == 'week':
                start_date = now - timedelta(days=7)
                queryset = queryset.filter(created_at__gte=start_date)
            elif date_range == 'month':
                start_date = now - timedelta(days=30)
                queryset = queryset.filter(created_at__gte=start_date)
            elif date_range == 'year':
                start_date = now - timedelta(days=365)
                queryset = queryset.filter(created_at__gte=start_date)
        
        # Apply search filter
        if search:
            queryset = queryset.filter(
                models.Q(action_type__icontains=search) |
                models.Q(model_name__icontains=search) |
                models.Q(object_repr__icontains=search) |
                models.Q(user__email__icontains=search) |
                models.Q(user__first_name__icontains=search) |
                models.Q(user__last_name__icontains=search) |
                models.Q(ip_address__icontains=search) |
                models.Q(browser__icontains=search) |
                models.Q(os__icontains=search) |
                models.Q(device__icontains=search)
            )
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        
        # Add summary statistics
        queryset = self.get_queryset()
        
        # Get action type distribution
        action_counts = queryset.values('action_type').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        # Get model distribution
        model_counts = queryset.values('model_name').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        # Get user activity distribution
        user_counts = queryset.filter(user__isnull=False).values(
            'user__email', 'user__first_name', 'user__last_name'
        ).annotate(
            count=models.Count('id')
        ).order_by('-count')[:10]
        
        # FIXED: Get recent activity timeline without ambiguous column reference
        # Use a subquery approach to avoid ambiguous column names
        from django.db.models.functions import TruncDate
        
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # Create a separate queryset without joins for the timeline calculation
        timeline_queryset = AuditLog.objects.filter(
            created_at__gte=thirty_days_ago
        ).annotate(
            date=TruncDate('created_at')  # Use Django's TruncDate instead of extra()
        ).values('date').annotate(
            count=models.Count('id')
        ).order_by('date')
        
        response.data['summary'] = {
            'total_logs': queryset.count(),
            'unique_users': queryset.filter(user__isnull=False).values('user').distinct().count(),
            'unique_ips': queryset.values('ip_address').distinct().count(),
            'action_distribution': list(action_counts),
            'model_distribution': list(model_counts),
            'top_users': list(user_counts),
            'timeline': list(timeline_queryset),
        }
        
        return response


class AuditLogStatsView(APIView):
    """Get audit log statistics"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        now = timezone.now()
        
        # Today's stats
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_logs = AuditLog.objects.filter(created_at__gte=today_start)
        
        # This week's stats
        week_start = now - timedelta(days=7)
        week_logs = AuditLog.objects.filter(created_at__gte=week_start)
        
        # This month's stats
        month_start = now - timedelta(days=30)
        month_logs = AuditLog.objects.filter(created_at__gte=month_start)
        
        # All time stats
        all_logs = AuditLog.objects.all()
        
        # Action type breakdown for today
        today_actions = today_logs.values('action_type').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        # Most active users today
        active_users_today = today_logs.filter(user__isnull=False).values(
            'user__email', 'user__first_name', 'user__last_name'
        ).annotate(
            count=models.Count('id')
        ).order_by('-count')[:5]
        
        # Error/issue detection (failed logins, system errors)
        failed_logins = today_logs.filter(
            action_type='login',
            changes__contains={'success': False}
        ).count()
        
        # System alerts (high frequency of errors)
        error_rate = 0
        if today_logs.count() > 0:
            error_logs = today_logs.filter(
                action_type__in=['login', 'update', 'create'],
                changes__contains={'error': True}
            ).count()
            error_rate = (error_logs / today_logs.count()) * 100
        
        stats = {
            'today': {
                'total': today_logs.count(),
                'by_hour': self.get_hourly_stats(today_logs),
                'top_actions': list(today_actions),
                'active_users': list(active_users_today),
                'failed_logins': failed_logins,
                'error_rate': round(error_rate, 2),
            },
            'week': {
                'total': week_logs.count(),
                'daily_trend': self.get_daily_stats(week_logs),
                'unique_users': week_logs.values('user').distinct().count(),
                'unique_ips': week_logs.values('ip_address').distinct().count(),
            },
            'month': {
                'total': month_logs.count(),
                'growth_rate': self.calculate_growth_rate(month_logs, week_logs),
                'top_models': list(month_logs.values('model_name').annotate(
                    count=models.Count('id')
                ).order_by('-count')[:5]),
            },
            'all_time': {
                'total': all_logs.count(),
                'first_log': all_logs.order_by('created_at').first().created_at if all_logs.exists() else None,
                'last_log': all_logs.order_by('-created_at').first().created_at if all_logs.exists() else None,
            }
        }
        
        return Response(stats)
    
    def get_hourly_stats(self, queryset):
        """Get hourly breakdown for today"""
        hourly = []
        now = timezone.now()
        
        for hour in range(24):
            hour_start = now.replace(hour=hour, minute=0, second=0, microsecond=0)
            hour_end = hour_start + timedelta(hours=1)
            
            count = queryset.filter(
                created_at__gte=hour_start,
                created_at__lt=hour_end
            ).count()
            
            hourly.append({
                'hour': hour,
                'count': count,
                'label': f'{hour:02d}:00'
            })
        
        return hourly
    
    def get_daily_stats(self, queryset):
        """Get daily breakdown for the week"""
        daily = []
        now = timezone.now()
        
        for day in range(7):
            day_date = now - timedelta(days=day)
            day_start = day_date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            count = queryset.filter(
                created_at__gte=day_start,
                created_at__lt=day_end
            ).count()
            
            daily.append({
                'date': day_start.date().isoformat(),
                'count': count,
                'day_name': day_start.strftime('%A')
            })
        
        return list(reversed(daily))
    
    def calculate_growth_rate(self, current_period, previous_period):
        """Calculate growth rate between two periods"""
        if previous_period.count() == 0:
            return 100 if current_period.count() > 0 else 0
        
        growth = ((current_period.count() - previous_period.count()) / previous_period.count()) * 100
        return round(growth, 2)

class AuditLogExportView(APIView):
    """Export audit logs to CSV"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        # Get filter parameters
        action_type = request.query_params.get('action_type')
        model_name = request.query_params.get('model_name')
        date_range = request.query_params.get('date_range')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Build queryset
        queryset = AuditLog.objects.all().select_related("user").order_by("-created_at")
        
        # Apply filters
        if action_type and action_type != 'all':
            queryset = queryset.filter(action_type=action_type)
        
        if model_name and model_name != 'all':
            queryset = queryset.filter(model_name=model_name)
        
        if date_range and date_range != 'all':
            now = timezone.now()
            if date_range == 'today':
                start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                queryset = queryset.filter(created_at__gte=start)
            elif date_range == 'week':
                start = now - timedelta(days=7)
                queryset = queryset.filter(created_at__gte=start)
            elif date_range == 'month':
                start = now - timedelta(days=30)
                queryset = queryset.filter(created_at__gte=start)
        
        if start_date and end_date:
            queryset = queryset.filter(
                created_at__gte=start_date,
                created_at__lte=end_date
            )
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit_logs_export.csv"'
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow([
            'Timestamp', 'Action Type', 'Model', 'Object ID', 'Object',
            'User Email', 'User Name', 'IP Address', 'Browser', 'OS', 'Device',
            'Request Path', 'Request Method', 'Changes', 'Old Values', 'New Values'
        ])
        
        # Write data
        for log in queryset:
            user_email = log.user.email if log.user else 'System'
            user_name = f"{log.user.first_name} {log.user.last_name}" if log.user else 'System'
            
            writer.writerow([
                log.created_at.isoformat(),
                log.get_action_type_display(),
                log.model_name,
                log.object_id,
                log.object_repr,
                user_email,
                user_name,
                log.ip_address or '',
                log.browser or '',
                log.os or '',
                log.device or '',
                log.request_path or '',
                log.request_method or '',
                json.dumps(log.changes, ensure_ascii=False),
                json.dumps(log.old_values, ensure_ascii=False),
                json.dumps(log.new_values, ensure_ascii=False),
            ])
        
        return response


class AuditLogSearchView(APIView):
    """Advanced search for audit logs"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        data = request.data
        
        queryset = AuditLog.objects.all().select_related("user")
        
        # Build complex search query
        if data.get('query'):
            query = data['query']
            queryset = queryset.filter(
                models.Q(action_type__icontains=query) |
                models.Q(model_name__icontains=query) |
                models.Q(object_repr__icontains=query) |
                models.Q(user__email__icontains=query) |
                models.Q(ip_address__icontains=query) |
                models.Q(changes__icontains=query)
            )
        
        # Filter by date range
        if data.get('start_date') and data.get('end_date'):
            queryset = queryset.filter(
                created_at__gte=data['start_date'],
                created_at__lte=data['end_date']
            )
        
        # Filter by user
        if data.get('user_id'):
            queryset = queryset.filter(user_id=data['user_id'])
        
        # Filter by IP
        if data.get('ip_address'):
            queryset = queryset.filter(ip_address=data['ip_address'])
        
        # Filter by action types
        if data.get('action_types'):
            queryset = queryset.filter(action_type__in=data['action_types'])
        
        # Filter by model names
        if data.get('model_names'):
            queryset = queryset.filter(model_name__in=data['model_names'])
        
        # Filter by changes containing specific values
        if data.get('change_key'):
            queryset = queryset.filter(changes__has_key=data['change_key'])
        
        if data.get('change_value'):
            queryset = queryset.filter(changes__contains=data['change_value'])
        
        # Ordering
        order_by = data.get('order_by', '-created_at')
        queryset = queryset.order_by(order_by)
        
        # Pagination
        page = int(data.get('page', 1))
        page_size = int(data.get('page_size', 50))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = queryset.count()
        logs = queryset[start:end]
        
        serializer = AuditLogSerializer(logs, many=True)
        
        return Response({
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
            'results': serializer.data,
            'filters_applied': data
        })


class AuditLogSystemView(APIView):
    """System-wide audit log insights"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        # Get system-wide statistics
        total_logs = AuditLog.objects.count()
        unique_users = AuditLog.objects.filter(user__isnull=False).values('user').distinct().count()
        unique_ips = AuditLog.objects.values('ip_address').distinct().count()
        
        # Get activity by hour of day
        activity_by_hour = []
        for hour in range(24):
            count = AuditLog.objects.filter(
                created_at__hour=hour,
                created_at__gte=thirty_days_ago
            ).count()
            activity_by_hour.append({
                'hour': hour,
                'count': count,
                'label': f'{hour:02d}:00'
            })
        
        # Get most common actions
        common_actions = AuditLog.objects.values('action_type').annotate(
            count=models.Count('id')
        ).order_by('-count')[:10]
        
        # Get user activity distribution
        user_activity = AuditLog.objects.filter(
            user__isnull=False,
            created_at__gte=thirty_days_ago
        ).values('user__email').annotate(
            count=models.Count('id'),
            last_activity=models.Max('created_at')
        ).order_by('-count')[:20]
        
        # Get geographical distribution (by IP)
        ip_distribution = AuditLog.objects.exclude(
            ip_address__isnull=True
        ).values('ip_address').annotate(
            count=models.Count('id'),
            last_used=models.Max('created_at')
        ).order_by('-count')[:20]
        
        # Get error/failure trends
        error_logs = AuditLog.objects.filter(
            changes__contains={'error': True, 'success': False}
        ).count()
        
        # Calculate system health metrics
        system_health = {
            'uptime_percentage': 99.9,  # This would come from monitoring system
            'avg_response_time': 250,  # ms
            'error_rate': round((error_logs / max(total_logs, 1)) * 100, 2),
            'peak_hour': max(activity_by_hour, key=lambda x: x['count'])['label'] if activity_by_hour else 'N/A',
            'busiest_day': self.get_busiest_day(),
        }
        
        return Response({
            'overview': {
                'total_logs': total_logs,
                'unique_users': unique_users,
                'unique_ips': unique_ips,
                'avg_logs_per_day': round(total_logs / 30, 2) if total_logs > 30 else total_logs,
                'first_log_date': AuditLog.objects.order_by('created_at').first().created_at if total_logs > 0 else None,
            },
            'activity_patterns': {
                'by_hour': activity_by_hour,
                'common_actions': list(common_actions),
                'user_activity': list(user_activity),
                'ip_distribution': list(ip_distribution),
            },
            'system_health': system_health,
            'alerts': self.get_system_alerts(),
        })
    
    def get_busiest_day(self):
        """Get the busiest day of the week"""
        from django.db.models.functions import ExtractWeekDay
        
        day_counts = AuditLog.objects.annotate(
            weekday=ExtractWeekDay('created_at')
        ).values('weekday').annotate(
            count=models.Count('id')
        ).order_by('-count')
        
        if day_counts:
            weekday_map = {
                1: 'Sunday',
                2: 'Monday',
                3: 'Tuesday',
                4: 'Wednesday',
                5: 'Thursday',
                6: 'Friday',
                7: 'Saturday'
            }
            busiest = day_counts.first()
            return weekday_map.get(busiest['weekday'], 'Unknown')
        return 'N/A'
    
    def get_system_alerts(self):
        """Get system alerts based on audit log patterns"""
        alerts = []
        now = timezone.now()
        hour_ago = now - timedelta(hours=1)
        
        # Check for failed login spikes
        failed_logins = AuditLog.objects.filter(
            action_type='login',
            changes__contains={'success': False},
            created_at__gte=hour_ago
        ).count()
        
        if failed_logins > 10:  # More than 10 failed logins per hour
            alerts.append({
                'type': 'security',
                'level': 'high',
                'message': f'High rate of failed logins detected: {failed_logins} in the last hour',
                'timestamp': now.isoformat(),
            })
        
        # Check for error spikes
        errors = AuditLog.objects.filter(
            changes__contains={'error': True},
            created_at__gte=hour_ago
        ).count()
        
        if errors > 20:  # More than 20 errors per hour
            alerts.append({
                'type': 'system',
                'level': 'medium',
                'message': f'High error rate detected: {errors} errors in the last hour',
                'timestamp': now.isoformat(),
            })
        
        return alerts

class ReportView(generics.GenericAPIView):
    """
    ULTRA-SIMPLE System report endpoint - NO COMPLEX SQL, MariaDB compatible
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        """Get basic system statistics - NO COMPLEX QUERIES"""
        try:
            User = get_user_model()
            
            # 1. Get absolute basic counts - NO complex aggregations
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            
            # 2. Try to get other counts with try/except
            total_properties = 0
            active_properties = 0
            total_inquiries = 0
            revenue_month = 0
            
            try:
                from real_estate.models import Property
                total_properties = Property.objects.count()
                active_properties = Property.objects.filter(is_active=True).count()
            except:
                pass
            
            try:
                from real_estate.models import Inquiry
                total_inquiries = Inquiry.objects.count()
            except:
                pass
            
            try:
                from subscriptions.models import Payment
                # SIMPLE revenue calculation - NO complex date filtering
                current_month = timezone.now().month
                current_year = timezone.now().year
                
                # Get payments for current month (simplified)
                month_payments = Payment.objects.filter(
                    status='completed',
                    created_at__month=current_month,
                    created_at__year=current_year
                )
                
                # Calculate revenue manually to avoid complex SQL
                revenue_month = 0
                for payment in month_payments:
                    revenue_month += payment.amount_etb
                
                # Get payments for current year
                year_payments = Payment.objects.filter(
                    status='completed',
                    created_at__year=current_year
                )
                
                revenue_year = 0
                for payment in year_payments:
                    revenue_year += payment.amount_etb
                    
            except Exception as e:
                print(f"Revenue calculation skipped: {e}")
                revenue_month = 0
                revenue_year = 0
            
            # 3. SIMPLE response - NO complex data structures
            response_data = {
                # Core metrics (frontend expects these)
                "total_users": total_users,
                "total_properties": total_properties,
                "total_inquiries": total_inquiries,
                "total_valuations": 0,
                "active_users": active_users,
                "active_properties": active_properties,
                "revenue_month": float(revenue_month),
                "revenue_year": float(revenue_year),
                "storage_used": 0,
                "avg_response_time": 0,
                "revenue_growth": 0,
                
                # Simple extended stats (avoid complex queries)
                "user_stats": {
                    "total": total_users,
                    "active": active_users,
                    "verified": User.objects.filter(is_verified=True).count(),
                    "premium": User.objects.filter(is_premium=True).count(),
                },
                
                "property_stats": {
                    "total": total_properties,
                    "active": active_properties,
                    "verified": Property.objects.filter(is_verified=True).count() if total_properties > 0 else 0,
                    "featured": Property.objects.filter(is_featured=True).count() if total_properties > 0 else 0,
                },
                
                "inquiry_stats": {
                    "total": total_inquiries,
                    "pending": Inquiry.objects.filter(status='pending').count() if total_inquiries > 0 else 0,
                    "closed": Inquiry.objects.filter(status='closed').count() if total_inquiries > 0 else 0,
                },
                
                # Simple placeholders for other required fields
                "market_stats": {
                    "total_listings": total_properties,
                    "active_listings": active_properties,
                    "avg_price": 0,
                    "sold_count": 0,
                },
                
                "revenue_stats": {
                    "month": float(revenue_month),
                    "year": float(revenue_year),
                    "growth": 0,
                    "transactions_count": 0,
                    "avg_transaction": 0,
                },
                
                "activity_stats": {
                    "total_views": 0,
                    "total_logins": 0,
                    "peak_hour": "N/A",
                    "avg_session_duration": 0,
                },
                
                "performance_metrics": {
                    "uptime": "100%",
                    "response_time": 0,
                    "error_rate": 0,
                    "server_load": "normal",
                },
                
                # Metadata
                "timestamp": timezone.now().isoformat(),
                "status": "success",
                "note": "Simplified report for MariaDB compatibility"
            }
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error in simplified ReportView: {str(e)}", exc_info=True)
            
            # Return minimal working data
            return Response({
                "total_users": 0,
                "total_properties": 0,
                "total_inquiries": 0,
                "total_valuations": 0,
                "active_users": 0,
                "active_properties": 0,
                "revenue_month": 0,
                "revenue_year": 0,
                "storage_used": 0,
                "avg_response_time": 0,
                "revenue_growth": 0,
                "user_stats": {"total": 0, "active": 0},
                "property_stats": {"total": 0, "active": 0},
                "inquiry_stats": {"total": 0, "pending": 0},
                "market_stats": {"total_listings": 0, "active_listings": 0, "avg_price": 0},
                "revenue_stats": {"month": 0, "year": 0, "growth": 0},
                "activity_stats": {"total_views": 0, "total_logins": 0},
                "performance_metrics": {"uptime": "0%", "response_time": 0, "error_rate": 0},
                "timestamp": timezone.now().isoformat(),
                "status": "error",
                "error": str(e)[:50]
            }, status=200)

# Admin Settings View
class AdminSettingsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Get system settings
        settings = {
            "site_name": "UTOPIA Real Estate",
            "site_description": "Ethiopian Real Estate Platform",
            "contact_email": "admin@utopia.com",
            "contact_phone": "+251911223344",
            "currency": "ETB",
            "default_language": "en",
            "maintenance_mode": False,
            "registration_enabled": True,
            "property_auto_approval": False,
            "max_properties_per_user": 10,
            "property_expiry_days": 90,
            "commission_rate": 2.5,
        }
        return Response(settings)

    def post(self, request):
        # Update settings (simplified - would save to database in real implementation)
        settings = request.data
        return Response(
            {"message": "Settings updated successfully", "settings": settings}
        )

class SimpleMessageViewSet(viewsets.ModelViewSet):
    """
    Simple messaging system for users to send and receive messages
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.action in ['create']:
            return SendMessageSerializer
        return SimpleMessageSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Message.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).select_related('sender', 'receiver', 'thread').order_by('-created_at')
        
        # Use thread_last_message instead of thread
        thread_id = self.request.query_params.get('thread')
        if thread_id:
            queryset = queryset.filter(thread_id=thread_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new message - this handles both new conversations and replies"""
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'error': 'Validation failed',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        
            validated_data = serializer.validated_data
            receiver = validated_data.get('receiver')
        
            if not receiver:
                return Response({
                    'error': 'Receiver is required'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if a thread already exists between these users
            thread = MessageThread.objects.filter(
                participants=request.user
            ).filter(
                participants=receiver
            ).first()
        
            if not thread:
            # Create new thread
                thread = MessageThread.objects.create()
                thread.participants.add(request.user, receiver)
        
            # Create the message with thread_last_message
            message = Message.objects.create(
                sender=request.user,
                receiver=receiver,
                content=validated_data.get('content', ''),
                attachment=validated_data.get('attachment'),
                thread=thread,  
                subject=validated_data.get('subject', ''),
                message_type=validated_data.get('message_type', 'general')
            )
        
            thread.last_message = message
            thread.updated_at = timezone.now()
            thread.save(update_fields=['last_message', 'updated_at'])
            
            # Create notification
            try:
                Notification.objects.create(
                    user=receiver,
                    notification_type='message',
                    title='New Message',
                    message=f'You have a new message from {request.user.first_name}',
                    content_type='message', 
                    object_id=str(message.id),
                    data={
                        'message_id': message.id,
                        'sender_id': request.user.id,
                        'sender_name': f"{request.user.first_name} {request.user.last_name}",
                        'thread_id': thread.id
                    }
                )
            except Exception as e:
                logger.error(f"Error creating notification: {str(e)}")
            
            response_serializer = SimpleMessageSerializer(
                message, context={'request': request}
            )
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating message: {str(e)}", exc_info=True)
            return Response({
                'error': 'Failed to create message',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread messages"""
        try:
            count = Message.objects.filter(
                receiver=request.user,
                is_read=False
            ).count()
            return Response({'unread_count': count})
        except Exception as e:
            logger.error(f"Error getting unread count: {str(e)}")
            return Response({'unread_count': 0})
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a message as read"""
        try:
            message = self.get_object()
            
            if message.receiver == request.user and not message.is_read:
                message.is_read = True
                message.read_at = timezone.now()
                message.save(update_fields=['is_read', 'read_at'])
                return Response({'status': 'Message marked as read'})
            
            return Response({'status': 'Already read or not your message'})
        except Exception as e:
            logger.error(f"Error marking message as read: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """Get list of conversations (threads) for the user"""
        try:
            threads = MessageThread.objects.filter(
                participants=request.user
            ).prefetch_related('participants').order_by('-updated_at')
            
            serializer = SimpleThreadSerializer(
                threads, many=True, context={'request': request}
            )
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error getting conversations: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SimpleThreadViewSet(viewsets.ModelViewSet):
    """
    Simple thread viewset for managing conversations
    """
    serializer_class = SimpleThreadSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return MessageThread.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants').order_by('-updated_at')
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages in a thread"""
        thread = self.get_object()
        
        # Verify user is a participant
        if not thread.participants.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You are not a participant in this thread'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Filter by thread_last_message instead of thread
        messages = Message.objects.filter(
            thread=thread
        ).select_related('sender', 'receiver').order_by('created_at')
        
        # Mark all unread messages as read
        unread_messages = messages.filter(
            receiver=request.user, is_read=False
        )
        unread_messages.update(is_read=True, read_at=timezone.now())
        
        serializer = SimpleMessageSerializer(
            messages, many=True, context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in a thread"""
        thread = self.get_object()
        
        # Verify user is a participant
        if not thread.participants.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You are not a participant in this thread'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the other participant as receiver
        other_participant = thread.participants.exclude(
            id=request.user.id
        ).first()
        
        if not other_participant:
            return Response(
                {'error': 'No other participant found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate content
        content = request.data.get('content', '').strip()
        if not content:
            return Response(
                {'error': 'Message content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create message with thread_last_message
        message = Message.objects.create(
            sender=request.user,
            receiver=other_participant,
            content=content,
            attachment=request.data.get('attachment'),
            thread=thread,
            subject=request.data.get('subject', thread.subject),
            message_type=request.data.get('message_type', 'general')
        )
        
        # Update thread
        thread.last_message = message
        thread.updated_at = timezone.now()
        thread.save(update_fields=['last_message', 'updated_at'])
        
        # Create notification
        try:
            Notification.objects.create(
                user=other_participant,
                notification_type='send_message',
                title='New Message',
                message=f'You have a new message from {request.user.first_name}',
                content_type='message', 
                object_id=str(message.id),
                data={
                    'message_id': message.id,
                    'thread_id': thread.id,
                    'sender_id': request.user.id
                }
            )
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
        
        return Response(
            SimpleMessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        
        return Message.objects.filter(
            thread=obj,  
            receiver=request.user,
            is_read=False
        ).count()

    def destroy(self, request, *args, **kwargs):
        """Delete a conversation thread"""
        try:
            thread = self.get_object()
            
            # Verify user is a participant
            if not thread.participants.filter(id=request.user.id).exists():
                return Response(
                    {'error': 'You are not a participant in this thread'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            thread.delete()
            
            return Response(
                {'message': 'Conversation deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
            
        except Exception as e:
            logger.error(f"Error deleting thread: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )