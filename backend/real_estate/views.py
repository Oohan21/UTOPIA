# views.py
from rest_framework import generics, filters, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action, api_view, permission_classes
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F, Q, Count, Avg, Max, Min
import json
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from .models import (
    Property,
    City,
    SubCity,
    Amenity,
    PropertyView,
    SavedSearch,
    SearchHistory,
    TrackedProperty
)
from .serializers import (
    PropertySerializer,
    CitySerializer,
    SubCitySerializer,
    AmenitySerializer,
    SearchHistorySerializer,
    SavedSearchSerializer,
)
from subscriptions.models import PropertyPromotion


class FeaturedPropertiesView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            Property.objects.filter(
                is_featured=True,
                is_active=True,
                property_status="available",
                approval_status="approved",  # CRITICAL: Only approved properties can be featured
            )
            .select_related("city", "sub_city", "owner", "agent", "developer")
            .prefetch_related("amenities", "images")
            .order_by("-created_at")[:10]
        )


class PropertyListView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [AllowAny]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = {
        "property_type": ["exact"],
        "city": ["exact"],
        "sub_city": ["exact"],
        "bedrooms": ["gte", "lte"],
        "bathrooms": ["gte", "lte"],
        "price_etb": ["gte", "lte"],
        "total_area": ["gte", "lte"],
        "is_featured": ["exact"],
        "is_verified": ["exact"],
        "has_parking": ["exact"],
        "has_security": ["exact"],
        "has_garden": ["exact"],
        "has_furniture": ["exact"],
    }
    search_fields = [
        "title",
        "description",
        "specific_location",
        "city__name",
        "sub_city__name",
    ]
    ordering_fields = [
        "price_etb",
        "total_area",
        "bedrooms",
        "created_at",
        "views_count",
    ]
    ordering = ["-created_at"]

    def get_queryset(self):
        # Base queryset for approved, active properties
        queryset = Property.objects.filter(
            approval_status="approved", is_active=True, property_status="available"
        )

        # If user is authenticated, also include their own pending properties
        if self.request.user.is_authenticated:
            user_properties = Property.objects.filter(owner=self.request.user)
            queryset = queryset | user_properties.filter(
                approval_status="pending", is_active=True
            )

        return (
            queryset.select_related("city", "sub_city", "owner", "agent", "developer")
            .prefetch_related("amenities", "images")
            .distinct()
        )


class PropertyDetailView(
    generics.RetrieveUpdateAPIView
):  # Changed from RetrieveAPIView
    serializer_class = PropertySerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Add this line
    lookup_field = "id"

    def get_permissions(self):
        # Allow GET for everyone, but require authentication for PUT/PATCH
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if self.request.method == "GET":
            if self.request.user.is_authenticated and (
                self.request.user.is_staff
                or self.request.user.is_superuser
                or self.request.user.user_type == "admin"
            ):
                return Property.objects.all()

            if self.request.user.is_authenticated:
                user_properties = Property.objects.filter(owner=self.request.user)

                # Also show approved properties
                approved_properties = Property.objects.filter(
                    approval_status="approved",
                    is_active=True,
                    property_status="available",
                )
                return user_properties | approved_properties

            return Property.objects.filter(
                approval_status="approved", is_active=True, property_status="available"
            )

        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            if self.request.user.is_authenticated:
                if (
                    self.request.user.user_type == "admin"
                    or self.request.user.is_staff
                    or self.request.user.is_superuser
                ):
                    return Property.objects.all()
                return Property.objects.filter(owner=self.request.user)

        return Property.objects.none()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.increment_views()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()

        # Handle image deletions
        if "deleted_images" in request.data:
            deleted_image_ids = request.data.getlist("deleted_images")
            instance.images.filter(id__in=deleted_image_ids).delete()

        # Handle file uploads
        if "images" in request.FILES:
            images = request.FILES.getlist("images")
            for image in images:
                PropertyImage.objects.create(
                    property=instance, image=image, is_primary=False
                )

        if "property_video" in request.FILES:
            instance.property_video = request.FILES["property_video"]

        # Create serializer with partial data (excluding files)
        data = request.data.copy()

        # Handle latitude/longitude conversion
        if "latitude" in data and data["latitude"] == "":
            data["latitude"] = None
        if "longitude" in data and data["longitude"] == "":
            data["longitude"] = None

        # Handle amenities
        if "amenities" in data:
            amenities = data.getlist("amenities")
            instance.amenities.set(amenities)
            data.pop("amenities", None)  # Remove from serializer data

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Save the instance
        self.perform_update(serializer)

        # Handle documents if any
        if "documents" in request.FILES:
            documents = request.FILES.getlist("documents")
            for doc in documents:
                PropertyDocument.objects.create(
                    property=instance,
                    document=doc,
                    document_type="other",
                    title=doc.name,
                )

        return Response(serializer.data)


class UserPropertiesView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return all properties owned by the current user
        return (
            Property.objects.filter(owner=self.request.user)
            .select_related("city", "sub_city", "owner", "agent", "developer")
            .prefetch_related("amenities", "images")
            .order_by("-created_at")
        )

class CityListView(generics.ListAPIView):
    queryset = City.objects.filter(is_active=True)
    serializer_class = CitySerializer
    permission_classes = [AllowAny]


class SubCityListView(generics.ListAPIView):
    serializer_class = SubCitySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = SubCity.objects.all()
        city_id = self.request.query_params.get("city", None)
        if city_id is not None:
            queryset = queryset.filter(city_id=city_id)
        return queryset


class AmenityListView(generics.ListAPIView):
    serializer_class = AmenitySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Amenity.objects.filter(is_active=True).order_by("amenity_type", "name")


from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

@method_decorator(csrf_exempt, name='dispatch')
class TrackPropertyView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = (
        PropertySerializer 
    )

    def post(self, request, id):
        try:
            property = Property.objects.get(id=id)

            # Get unique viewer identifier
            viewer_id = self.get_viewer_id(request)

            today = timezone.now().date()
            today_start = timezone.datetime.combine(today, datetime.min.time())
            today_start = timezone.make_aware(today_start)

            if request.user.is_authenticated:
                # Check by user for today
                already_viewed_today = PropertyView.objects.filter(
                    property=property, user=request.user, viewed_at__gte=today_start
                ).exists()
            else:
                # Check by session for today
                already_viewed_today = (
                    PropertyView.objects.filter(
                        property=property,
                        session_id=viewer_id,
                        viewed_at__gte=today_start,
                    ).exists()
                    if viewer_id
                    else False
                )

            # Only increment if this is the first view today
            if not already_viewed_today:
                Property.objects.filter(id=id).update(views_count=F("views_count") + 1)
                property.refresh_from_db()

            # Always create a view record for analytics
            PropertyView.objects.create(
                property=property,
                user=request.user if request.user.is_authenticated else None,
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
                session_id=viewer_id or "",
                viewed_at=timezone.now(),
            )

            return Response(
                {
                    "status": "success",
                    "views_count": property.views_count,
                    "already_viewed_today": already_viewed_today,
                    "message": (
                        "View counted"
                        if not already_viewed_today
                        else "View already counted today"
                    ),
                }
            )

        except Property.DoesNotExist:
            return Response({"error": "Property not found"}, status=404)
        except Exception as e:
            return Response(
                {"status": "error", "message": f"Failed to track view: {str(e)}"},
                status=500,
            )

    def get_viewer_id(self, request):
        """Get session ID for anonymous users"""
        if hasattr(request, "session"):
            if not request.session.session_key:
                request.session.create()
            return request.session.session_key
        return None

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip

class SearchHistoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user search history with promotion tracking
    """

    serializer_class = SearchHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return search history for the current user with promotion filtering
        """
        user = self.request.user

        # Admins can see all search history
        if user.is_staff or user.is_superuser:
            queryset = SearchHistory.objects.all()
        else:
            queryset = SearchHistory.objects.filter(user=user)

        # Filter by date range if provided
        days = self.request.query_params.get("days")
        if days and days.isdigit():
            date_threshold = timezone.now() - timedelta(days=int(days))
            queryset = queryset.filter(created_at__gte=date_threshold)

        # Filter by search type if provided
        search_type = self.request.query_params.get("search_type")
        if search_type:
            queryset = queryset.filter(search_type=search_type)

        # Filter by query if provided
        query = self.request.query_params.get("query")
        if query:
            queryset = queryset.filter(query__icontains=query)

        # Filter by promotion tier if provided
        promotion_tier = self.request.query_params.get("promotion_tier")
        if promotion_tier:
            queryset = queryset.filter(promotion_tier=promotion_tier)

        # Filter by promoted_only if provided
        promoted_only = self.request.query_params.get("promoted_only")
        if promoted_only is not None:
            if promoted_only.lower() in ["true", "1", "yes"]:
                queryset = queryset.filter(promoted_only=True)
            elif promoted_only.lower() in ["false", "0", "no"]:
                queryset = queryset.filter(promoted_only=False)

        return queryset.select_related(
            "user", "clicked_result", "clicked_promotion", "clicked_promotion__tier"
        ).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        """
        Save a search to history with proper validation
        """
        try:
            data = request.data.copy()

            # Ensure filters is a dict
            if "filters" in data:
                if isinstance(data["filters"], str):
                    try:
                        data["filters"] = json.loads(data["filters"])
                    except json.JSONDecodeError:
                        data["filters"] = {}
            else:
                data["filters"] = {}

            # Ensure search_type is valid
            valid_search_types = [
                "manual",
                "saved_search",
                "quick_filter",
                "promotion_search",
                "map_search",
                "price_alert",
            ]
            if data.get("search_type") not in valid_search_types:
                data["search_type"] = "manual"

            # Ensure results_count is a number
            if "results_count" in data:
                try:
                    data["results_count"] = int(data["results_count"])
                except (ValueError, TypeError):
                    data["results_count"] = 0
            else:
                data["results_count"] = 0

            # Add user if authenticated
            if request.user.is_authenticated:
                data["user"] = request.user.id

            # Add session info for anonymous users
            if hasattr(request, "session"):
                if not request.session.session_key:
                    request.session.create()
                data["session_id"] = request.session.session_key

            # Add IP and user agent using the model's method
            from .models import SearchHistory

            data["ip_address"] = SearchHistory.get_client_ip(request)
            data["user_agent"] = request.META.get("HTTP_USER_AGENT", "")[:500]

            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            search_history = serializer.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"Error creating search history: {str(e)}")
            return Response(
                {"error": "Failed to save search history", "details": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["get"])
    def popular(self, request):
        """
        Get popular searches across all users
        """
        try:
            days = request.query_params.get("days", 30)
            limit = min(int(request.query_params.get("limit", 10)), 50)

            try:
                days = int(days)
            except ValueError:
                days = 30

            # Get popular searches using Django ORM
            from django.db.models import Count
            from datetime import timedelta

            date_threshold = timezone.now() - timedelta(days=days)

            popular_searches = (
                SearchHistory.objects.filter(
                    created_at__gte=date_threshold, query__isnull=False, query__gt=""
                )
                .values("query")
                .annotate(
                    count=Count("id"),
                )
                .order_by("-count")[:limit]
            )

            # Format the response
            formatted_results = []
            for search in popular_searches:
                formatted_results.append(
                    {
                        "query": search["query"],
                        "count": search["count"],
                    }
                )

            return Response(
                {"popular_searches": formatted_results, "days": days, "limit": limit}
            )

        except Exception as e:
            print(f"Error in popular searches: {str(e)}")
            # Return a fallback response
            return Response(
                {
                    "popular_searches": [
                        {"query": "Bole", "count": 45},
                        {"query": "3 bedroom house", "count": 32},
                        {"query": "Apartment for rent", "count": 28},
                        {"query": "Office space", "count": 21},
                        {"query": "Commercial property", "count": 18},
                    ],
                    "days": 30,
                    "limit": 10,
                    "error": str(e),
                }
            )

    @action(detail=False, methods=["get"])
    def promotion_insights(self, request):
        """
        Get insights about promotion-related searches
        """
        tier_type = request.query_params.get("tier_type")
        days = request.query_params.get("days", 30)

        try:
            days = int(days)
        except ValueError:
            days = 30

        # Get promotion insights using the model method
        insights = SearchHistory.get_promotion_insights(tier_type=tier_type, days=days)

        return Response(
            {
                "tier_type": tier_type,
                "days": days,
                "insights": insights["insights"],
                "popular_promoted_searches": insights["popular_promoted_searches"],
            }
        )

    @action(detail=False, methods=["get"])
    def suggestions(self, request):
        """
        Get search suggestions based on user's history
        """
        query = request.query_params.get("q", "").strip()

        if len(query) < 2:
            return Response({"suggestions": []})

        user = request.user
        suggestions = []

        # Get recent searches for the current user/session
        if user.is_authenticated:
            recent_searches = (
                SearchHistory.objects.filter(user=user, query__icontains=query)
                .values("query")
                .distinct()[:5]
            )
        else:
            session_key = (
                request.session.session_key if hasattr(request, "session") else None
            )
            if session_key:
                recent_searches = (
                    SearchHistory.objects.filter(
                        session_id=session_key, query__icontains=query
                    )
                    .values("query")
                    .distinct()[:5]
                )
            else:
                recent_searches = []

        suggestions = [item["query"] for item in recent_searches if item["query"]]

        # If not enough suggestions, add popular ones
        if len(suggestions) < 3:
            from django.db.models import Count
            from datetime import timedelta

            week_ago = timezone.now() - timedelta(days=7)
            popular = (
                SearchHistory.objects.filter(
                    created_at__gte=week_ago, query__icontains=query
                )
                .values("query")
                .annotate(count=Count("id"))
                .order_by("-count")[:5]
            )

            for item in popular:
                if item["query"] not in suggestions:
                    suggestions.append(item["query"])

        return Response({"suggestions": suggestions[:5]})

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """
        Get search statistics for the current user with promotion stats
        """
        user = request.user

        # Calculate date ranges
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        # Get counts
        total_searches = SearchHistory.objects.filter(user=user).count()
        weekly_searches = SearchHistory.objects.filter(
            user=user, created_at__date__gte=week_ago
        ).count()
        monthly_searches = SearchHistory.objects.filter(
            user=user, created_at__date__gte=month_ago
        ).count()

        # Get promotion-related stats
        promotion_searches = SearchHistory.objects.filter(
            user=user, promoted_only=True
        ).count()

        promotion_tier_searches = (
            SearchHistory.objects.filter(user=user, promotion_tier__isnull=False)
            .values("promotion_tier")
            .annotate(count=Count("id"), avg_results=Avg("results_count"))
        )

        # Get most common search types
        search_types = (
            SearchHistory.objects.filter(user=user)
            .values("search_type")
            .annotate(count=Count("id"), avg_results=Avg("results_count"))
            .order_by("-count")
        )

        # Get most searched queries
        top_queries = (
            SearchHistory.objects.filter(user=user, query__isnull=False, query__gt="")
            .values("query")
            .annotate(
                count=Count("id"),
                last_searched=Max("created_at"),
                avg_results=Avg("results_count"),
                promoted_searches=Count("id", filter=Q(promoted_only=True)),
            )
            .order_by("-count")[:10]
        )

        # Get average results per search
        avg_results = (
            SearchHistory.objects.filter(user=user).aggregate(
                avg_results=Avg("results_count")
            )["avg_results"]
            or 0
        )

        # Get click-through rate for promoted searches
        promoted_clicks = SearchHistory.objects.filter(
            user=user, promoted_only=True, clicked_result__isnull=False
        ).count()

        promoted_ctr = (
            (promoted_clicks / promotion_searches * 100)
            if promotion_searches > 0
            else 0
        )

        return Response(
            {
                "total_searches": total_searches,
                "weekly_searches": weekly_searches,
                "monthly_searches": monthly_searches,
                "average_results": avg_results,
                "promotion_stats": {
                    "promotion_searches": promotion_searches,
                    "promotion_tiers": list(promotion_tier_searches),
                    "promoted_click_through_rate": promoted_ctr,
                    "promoted_clicks": promoted_clicks,
                },
                "search_types": list(search_types),
                "top_queries": list(top_queries),
                "first_search_date": SearchHistory.objects.filter(user=user).aggregate(
                    first_date=Min("created_at")
                )["first_date"],
                "last_search_date": SearchHistory.objects.filter(user=user).aggregate(
                    last_date=Max("created_at")
                )["last_date"],
            }
        )

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """
        Clear all search history for the current user
        """
        user = request.user
        
        try:
            # Delete user's search history
            deleted_count, _ = SearchHistory.objects.filter(user=user).delete()
            
            return Response({
                'status': 'success',
                'message': f'Cleared {deleted_count} search history records',
                'deleted_count': deleted_count
            })
            
        except Exception as e:
            return Response({
                'error': 'Failed to clear search history',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["post"])
    def save(self, request, pk=None):
        """
        Save a search from history as a saved search with promotion context
        """
        try:
            search_history = self.get_object()
            user = request.user

            # Get name for saved search
            name = request.data.get("name")
            if not name:
                # Generate name based on search content
                if search_history.query:
                    name = f"Search: {search_history.query[:50]}"
                elif search_history.promoted_only:
                    name = f"Promoted Search {search_history.created_at.date()}"
                elif search_history.promotion_tier:
                    name = f"{search_history.promotion_tier.title()} Tier Search"
                else:
                    name = f"Search from {search_history.created_at.date()}"

            # Check if this search is already saved
            existing_saved = SavedSearch.objects.filter(user=user, name=name).exists()

            if existing_saved:
                return Response(
                    {"error": "A saved search with this name already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create saved search with promotion context
            saved_search_data = {
                "user": user,
                "name": name,
                "filters": search_history.filters or {},
                "is_active": True,
                "email_alerts": request.data.get("email_alerts", True),
                "alert_frequency": request.data.get("alert_frequency", "daily"),
                "match_count": search_history.results_count,
            }

            # Add promotion-specific data to filters
            if search_history.promoted_only:
                saved_search_data["filters"]["is_promoted"] = True
            elif search_history.promotion_tier:
                saved_search_data["filters"][
                    "promotion_tier"
                ] = search_history.promotion_tier

            saved_search = SavedSearch.objects.create(**saved_search_data)

            serializer = SavedSearchSerializer(saved_search)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except SearchHistory.DoesNotExist:
            return Response(
                {"error": "Search history not found"}, status=status.HTTP_404_NOT_FOUND
            )


class SavedSearchViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing saved searches with promotion filtering
    """

    serializer_class = SavedSearchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedSearch.objects.filter(user=self.request.user).order_by(
            "-created_at"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def execute(self, request, pk=None):
        """
        Execute a saved search and return results with promotion filtering
        """
        try:
            saved_search = self.get_object()
            filters = saved_search.filters

            # Convert filters to queryset parameters
            properties = Property.objects.filter(
                approval_status="approved", is_active=True, property_status="available"
            )

            # Apply promotion filters if present
            if filters.get("is_promoted"):
                properties = properties.filter(is_promoted=True)

            if filters.get("promotion_tier"):
                properties = properties.filter(promotion_tier=filters["promotion_tier"])

            # Apply regular filters (existing code)
            if filters.get("city"):
                properties = properties.filter(city_id=filters["city"])

            if filters.get("sub_city"):
                properties = properties.filter(sub_city_id=filters["sub_city"])

            if filters.get("property_type"):
                properties = properties.filter(property_type=filters["property_type"])

            if filters.get("listing_type"):
                properties = properties.filter(listing_type=filters["listing_type"])

            if filters.get("min_price"):
                properties = properties.filter(price_etb__gte=filters["min_price"])

            if filters.get("max_price"):
                properties = properties.filter(price_etb__lte=filters["max_price"])

            if filters.get("min_bedrooms"):
                properties = properties.filter(bedrooms__gte=filters["min_bedrooms"])

            if filters.get("min_area"):
                properties = properties.filter(total_area__gte=filters["min_area"])

            if filters.get("max_area"):
                properties = properties.filter(total_area__lte=filters["max_area"])

            # Apply boolean filters
            if filters.get("has_parking"):
                properties = properties.filter(has_parking=True)

            if filters.get("has_garden"):
                properties = properties.filter(has_garden=True)

            if filters.get("has_security"):
                properties = properties.filter(has_security=True)

            if filters.get("is_featured"):
                properties = properties.filter(is_featured=True)

            if filters.get("is_verified"):
                properties = properties.filter(is_verified=True)

            # Apply search query if present
            if filters.get("search"):
                from django.db.models import Q

                properties = properties.filter(
                    Q(title__icontains=filters["search"])
                    | Q(description__icontains=filters["search"])
                    | Q(specific_location__icontains=filters["search"])
                )

            # Ordering - prioritize promoted properties
            ordering = filters.get("ordering")
            if ordering:
                properties = properties.order_by(ordering)
            else:
                # Default ordering: promoted first, then by date
                properties = properties.order_by(
                    "-is_promoted", "-promotion_tier", "-created_at"
                )

            # Pagination
            page_size = min(int(filters.get("page_size", 20)), 100)
            page_number = int(filters.get("page", 1))

            # Calculate pagination
            total_count = properties.count()
            total_pages = (total_count + page_size - 1) // page_size

            # Get paginated results
            start = (page_number - 1) * page_size
            end = start + page_size
            paginated_properties = properties[start:end]

            # Update match count
            saved_search.match_count = total_count
            saved_search.save()

            # Create search history for this execution with promotion context
            history_data = {
                "filters": filters,
                "search_type": "saved_search",
                "results_count": total_count,
                "ip_address": self.get_client_ip(request),
                "user_agent": request.META.get("HTTP_USER_AGENT", "")[:500],
            }

            # Add promotion context to history
            if filters.get("is_promoted"):
                history_data["promoted_only"] = True
            elif filters.get("promotion_tier"):
                history_data["promotion_tier"] = filters["promotion_tier"]

            SearchHistory.objects.create(user=request.user, **history_data)

            serializer = PropertySerializer(paginated_properties, many=True)

            return Response(
                {
                    "results": serializer.data,
                    "pagination": {
                        "count": total_count,
                        "page": page_number,
                        "page_size": page_size,
                        "total_pages": total_pages,
                        "has_next": page_number < total_pages,
                        "has_previous": page_number > 1,
                    },
                    "filters": filters,
                    "promotion_filtered": bool(
                        filters.get("is_promoted") or filters.get("promotion_tier")
                    ),
                    "saved_search_id": saved_search.id,
                    "saved_search_name": saved_search.name,
                }
            )

        except SavedSearch.DoesNotExist:
            return Response(
                {"error": "Saved search not found"}, status=status.HTTP_404_NOT_FOUND
            )


@api_view(["POST"])
@permission_classes([AllowAny])
def track_search(request):
    """
    Track a search (for both authenticated and anonymous users) with promotion support
    """
    try:
        data = request.data

        # Prepare search data with promotion fields
        search_data = {
            "query": data.get("query", ""),
            "filters": data.get("filters", {}),
            "results_count": data.get("results_count", 0),
            "search_type": data.get("search_type", "manual"),
            "search_duration": data.get("search_duration"),
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "radius_km": data.get("radius_km"),
            "price_alert_set": data.get("price_alert_set", False),
            "price_alert_threshold": data.get("price_alert_threshold"),
            "promotion_tier": data.get("promotion_tier"),
            "promoted_only": data.get("promoted_only", False),
            "sort_by": data.get("sort_by", "-created_at"),
            "page": data.get("page", 1),
        }

        # Convert filters to dict if it's a string
        if isinstance(search_data["filters"], str):
            try:
                search_data["filters"] = json.loads(search_data["filters"])
            except json.JSONDecodeError:
                search_data["filters"] = {}

        # Get clicked result if provided
        clicked_result_id = data.get("clicked_result_id")
        clicked_result = None
        if clicked_result_id:
            try:
                clicked_result = Property.objects.get(id=clicked_result_id)
            except Property.DoesNotExist:
                pass

        # Get clicked promotion if provided
        clicked_promotion_id = data.get("clicked_promotion_id")
        clicked_promotion = None
        if clicked_promotion_id:
            try:
                clicked_promotion = PropertyPromotion.objects.get(
                    id=clicked_promotion_id
                )
            except PropertyPromotion.DoesNotExist:
                pass

        # Create the search history record using the model method
        history_record = SearchHistory.create_from_request(request, search_data)

        # Associate clicked result if available
        if clicked_result:
            history_record.clicked_result = clicked_result
            history_record.save(update_fields=["clicked_result"])

        # Associate clicked promotion if available
        if clicked_promotion:
            history_record.clicked_promotion = clicked_promotion
            history_record.save(update_fields=["clicked_promotion"])

        # Log activity for authenticated users
        if request.user.is_authenticated:
            log_user_activity(
                request.user,
                'search',
                {
                    'query': search_data['query'],
                    'filters': search_data['filters'],
                    'results_count': search_data['results_count']
                },
                request=request
            )

        return Response(
            {
                "status": "success",
                "search_id": history_record.id,
                "created_at": history_record.created_at,
                "has_promotion": clicked_promotion is not None,
                "promotion_tier": history_record.promotion_tier,
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)}, status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_recent_searches(request):
    """
    Get recent searches for the current user/session
    """
    limit = min(int(request.query_params.get("limit", 10)), 50)

    # Determine user or session identifier
    if request.user.is_authenticated:
        # Get user's recent searches
        recent_searches = (
            SearchHistory.objects.filter(user=request.user)
            .select_related("clicked_result")
            .order_by("-created_at")[:limit]
        )
    else:
        # Get session-based searches
        session_key = (
            request.session.session_key if hasattr(request, "session") else None
        )
        if session_key:
            recent_searches = (
                SearchHistory.objects.filter(session_id=session_key)
                .select_related("clicked_result")
                .order_by("-created_at")[:limit]
            )
        else:
            recent_searches = SearchHistory.objects.none()

    serializer = SearchHistorySerializer(recent_searches, many=True)
    return Response(
        {"recent_searches": serializer.data, "total_count": len(serializer.data)}
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_property_view(request, id):
    """
    Save a property to user's tracked properties
    """
    try:
        property = Property.objects.get(id=id)
        user = request.user
        
        # Check if property is already saved
        existing_track = TrackedProperty.objects.filter(
            user=user, 
            property=property
        ).first()
        
        if existing_track:
            # Already saved - we can either toggle or return error
            return Response({
                'status': 'already_saved',
                'message': 'Property already saved to your tracked list',
                'tracking_type': existing_track.tracking_type
            }, status=status.HTTP_200_OK)
        
        # Create new tracked property
        tracked_property = TrackedProperty.objects.create(
            user=user,
            property=property,
            tracking_type='interested',
            notification_enabled=True
        )
        
        # Log the activity
        log_user_activity(
            user,
            'property_save',
            {'property_id': property.id, 'property_title': property.title},
            request=request
        )
        
        # Increment save count on property
        Property.objects.filter(id=id).update(
            save_count=F('save_count') + 1
        )
        property.refresh_from_db()
        
        return Response({
            'status': 'success',
            'message': 'Property saved successfully',
            'save_count': property.save_count,
            'tracked_property_id': tracked_property.id
        }, status=status.HTTP_201_CREATED)
        
    except Property.DoesNotExist:
        return Response(
            {'error': 'Property not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to save property: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unsave_property_view(request, id):
    """
    Remove a property from user's tracked properties
    """
    try:
        property = Property.objects.get(id=id)
        user = request.user
        
        # Check if property is saved
        tracked_property = TrackedProperty.objects.filter(
            user=user, 
            property=property
        ).first()
        
        if not tracked_property:
            return Response({
                'status': 'not_saved',
                'message': 'Property not in your saved list'
            }, status=status.HTTP_200_OK)
        
        # Delete the tracked property
        tracked_property.delete()
        
        # Decrement save count (ensure it doesn't go below 0)
        Property.objects.filter(id=id, save_count__gt=0).update(
            save_count=F('save_count') - 1
        )
        property.refresh_from_db()
        
        return Response({
            'status': 'success',
            'message': 'Property removed from saved list',
            'save_count': property.save_count
        }, status=status.HTTP_200_OK)
        
    except Property.DoesNotExist:
        return Response(
            {'error': 'Property not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to remove property: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Add to views.py or update existing view
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_saved_properties_view(request):
    """
    Get all properties saved by the current user
    """
    try:
        user = request.user
        
        # Get all tracked properties for the user using the correct relationship
        tracked_properties = TrackedProperty.objects.filter(
            user=user
        ).select_related(
            'property',
            'property__city',
            'property__sub_city',
            'property__owner'
        ).prefetch_related(
            'property__images'
        ).order_by('-created_at')
        
        # Serialize the properties
        properties_data = []
        for tracked in tracked_properties:
            # Get the property from the tracked relationship
            property = tracked.property
            
            # Serialize the property
            property_data = PropertySerializer(
                property, 
                context={'request': request}
            ).data
            
            # Add tracking info - check if tracking_info exists in the response
            tracking_info = {
                'tracking_type': tracked.tracking_type,
                'tracked_at': tracked.created_at,
                'tracked_id': tracked.id,
                'notification_enabled': tracked.notification_enabled,
                'notes': tracked.notes or ''
            }
            
            # Merge tracking info into property data
            property_data['tracking_info'] = tracking_info
            
            # Add is_saved flag for frontend
            property_data['is_saved'] = True
            
            properties_data.append(property_data)
        
        return Response({
            'count': len(properties_data),
            'results': properties_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        print(f"Error in get_saved_properties_view: {str(e)}")
        traceback.print_exc()
        return Response(
            {'error': f'Failed to get saved properties: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def debug_inquiry_count(request, property_id):
    """
    Debug endpoint to check inquiry count status
    """
    try:
        property = Property.objects.get(id=property_id)
        
        # Get actual count from database
        actual_count = property.inquiries.count()
        
        # Get cached count from property model
        cached_count = property.inquiry_count
        
        return Response({
            'property_id': property.id,
            'property_title': property.title,
            'cached_inquiry_count': cached_count,
            'actual_inquiry_count': actual_count,
            'in_sync': cached_count == actual_count,
            'inquiries': list(property.inquiries.values('id', 'created_at', 'inquiry_type')[:10])
        })
        
    except Property.DoesNotExist:
        return Response({'error': 'Property not found'}, status=404)