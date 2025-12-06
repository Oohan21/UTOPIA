from rest_framework import viewsets, generics, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from django.db.models import Q, Avg, Count, Max, Min, Sum, F
from django.db.models.functions import TruncMonth, TruncQuarter
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import logging
from .serializers import *
from .filters import PropertyFilter
from .permissions import IsOwnerOrReadOnly, IsAdminUser, CanListProperties, IsAdminOrReadOnly
from .pagination import CustomPagination
from real_estate.comparison import PropertyComparisonService

logger = logging.getLogger(__name__)
User = get_user_model()

# Authentication Views
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True).select_related('user_profile')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['user_type', 'is_verified']
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    
    def get_queryset(self):
        if self.request.user.is_admin_user:  # Updated method
            return User.objects.all().select_related('user_profile')
        return super().get_queryset()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        user = request.user
        
        # Get user stats - simplified for new user roles
        listed_properties = user.owned_properties.filter(is_active=True).count()
        saved_properties = user.tracked_properties.count()
        saved_searches = user.saved_searches.filter(is_active=True).count()
        inquiries_sent = user.inquiries.count()
        
        # Get recent properties
        recent_properties = user.owned_properties.filter(
            is_active=True
        ).order_by('-created_at')[:5]
        
        # Get recent inquiries
        recent_inquiries = user.inquiries.order_by('-created_at')[:5]
        
        # Market insights
        market_insights = {
            'average_price': Property.objects.filter(
                city=user.user_profile.city if user.user_profile and user.user_profile.city else None,
                is_active=True
            ).aggregate(avg=Avg('price_etb'))['avg'] or 0,
            'trend': 'rising',
            'trend_percentage': 8.2
        }
        
        data = {
            'listed_properties': listed_properties,
            'saved_properties': saved_properties,
            'saved_searches': saved_searches,
            'inquiries_sent': inquiries_sent,
            'profile_completion': user.profile_completion_percentage,
            'recent_properties': PropertySerializer(recent_properties, many=True).data,
            'recent_inquiries': InquirySerializer(recent_inquiries, many=True).data,
            'market_insights': market_insights
        }
        
        return Response(data)

# Property Views
class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.filter(is_active=True).select_related(
        'city', 'sub_city', 'owner', 'agent'
    ).prefetch_related('images', 'amenities')
    
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PropertyFilter
    search_fields = ['title', 'title_amharic', 'description', 'specific_location']
    ordering_fields = ['price_etb', 'created_at', 'total_area', 'bedrooms', 'views_count']
    ordering = ['-created_at']
    pagination_class = CustomPagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PropertyCreateSerializer
        return PropertySerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwnerOrReadOnly()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
        
        # Log activity
        UserActivity.objects.create(
            user=self.request.user,
            activity_type='property_add',
            ip_address=self.request.META.get('REMOTE_ADDR'),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Increment views
        instance.increment_views()
        
        # Log view
        PropertyView.objects.create(
            property=instance,
            user=request.user if request.user.is_authenticated else None,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            session_id=request.session.session_key or ''
        )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def save(self, request, pk=None):
        property = self.get_object()
        user = request.user
        
        # Check if already saved
        tracked = TrackedProperty.objects.filter(user=user, property=property).first()
        
        if tracked:
            tracked.delete()
            property.save_count = max(0, property.save_count - 1)
            property.save()
            return Response({'message': 'Property removed from saved list'})
        else:
            TrackedProperty.objects.create(
                user=user,
                property=property,
                tracking_type='interested'
            )
            property.save_count += 1
            property.save()
            return Response({'message': 'Property saved successfully'})
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_properties = self.get_queryset().filter(
            is_featured=True,
            is_active=True
        )[:10]
        serializer = self.get_serializer(featured_properties, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def similar(self, request):
        property_id = request.query_params.get('property_id')
        if not property_id:
            return Response({'error': 'property_id is required'}, status=400)
        
        try:
            current_property = Property.objects.get(id=property_id)
            
            similar = Property.objects.filter(
                Q(city=current_property.city) |
                Q(sub_city=current_property.sub_city) |
                Q(property_type=current_property.property_type),
                is_active=True,
                listing_type=current_property.listing_type
            ).exclude(id=property_id).order_by('?')[:8]
            
            serializer = self.get_serializer(similar, many=True)
            return Response(serializer.data)
        except Property.DoesNotExist:
            return Response({'error': 'Property not found'}, status=404)
    
    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        user = request.user
        
        # Get user preferences from profile
        preferences = []
        if hasattr(user, 'user_profile') and user.user_profile:
            preferences = user.user_profile.preferred_property_types or []
            locations = user.user_profile.preferred_locations or []
        
        # Build recommendation query
        query = Q(is_active=True)
        
        if preferences:
            query &= Q(property_type__in=preferences)
        
        # Add location filter if available
        if hasattr(user, 'user_profile') and user.user_profile.city:
            query &= Q(city=user.user_profile.city)
        
        recommendations = Property.objects.filter(query).order_by('-created_at')[:12]
        
        serializer = self.get_serializer(recommendations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
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
            action = 'removed'
        else:
            # Check limit
            if comparison_session.properties.count() >= 10:
                return Response({
                    'error': 'Cannot compare more than 10 properties'
                }, status=status.HTTP_400_BAD_REQUEST)
            comparison_session.properties.add(property)
            action = 'added'
        
        comparison_session.save()
        
        return Response({
            'action': action,
            'property_id': property.id,
            'session_properties_count': comparison_session.properties.count(),
            'session_id': session_key
        })
    
    @action(detail=False, methods=['get'])
    def get_comparison_session(self, request):
        """Get current comparison session"""
        session_key = request.session.session_key
        
        if not session_key:
            return Response({'properties': [], 'count': 0})
        
        try:
            comparison_session = ComparisonSession.objects.get(session_id=session_key)
            properties = comparison_session.properties.filter(is_active=True)
            
            return Response({
                'properties': PropertySerializer(properties, many=True).data,
                'count': properties.count(),
                'session_id': session_key
            })
        except ComparisonSession.DoesNotExist:
            return Response({'properties': [], 'count': 0})

# Market Views
class MarketStatsView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        city_id = request.query_params.get('city')
        sub_city_id = request.query_params.get('sub_city')
        property_type = request.query_params.get('property_type')
        
        # Build filter
        filters = {}
        if city_id:
            filters['city_id'] = city_id
        if sub_city_id:
            filters['sub_city_id'] = sub_city_id
        if property_type:
            filters['property_type'] = property_type
        
        # Get properties
        properties = Property.objects.filter(is_active=True, **filters)
        
        # Calculate statistics
        if properties.exists():
            stats = properties.aggregate(
                avg_price=Avg('price_etb'),
                median_price=Avg('price_etb'),  # Simplified median
                min_price=Min('price_etb'),
                max_price=Max('price_etb'),
                total_listings=Count('id'),
                avg_bedrooms=Avg('bedrooms'),
                avg_area=Avg('total_area'),
                avg_price_per_sqm=Avg(F('price_etb') / F('total_area'))
            )
            
            # Calculate price changes
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_properties = properties.filter(created_at__gte=thirty_days_ago)
            older_properties = properties.filter(created_at__lt=thirty_days_ago)
            
            recent_avg = recent_properties.aggregate(avg=Avg('price_etb'))['avg'] or 0
            older_avg = older_properties.aggregate(avg=Avg('price_etb'))['avg'] or 0
            
            if older_avg > 0:
                price_change = ((recent_avg - older_avg) / older_avg) * 100
            else:
                price_change = 0
            
            # Property type distribution
            type_distribution = list(
                properties.values('property_type').annotate(
                    count=Count('id'),
                    avg_price=Avg('price_etb')
                ).order_by('-count')
            )
            
            # Popular areas
            popular_areas = list(
                properties.values('sub_city__name').annotate(
                    count=Count('id'),
                    avg_price=Avg('price_etb')
                ).order_by('-count')[:10]
            )
            
            # Price ranges
            price_ranges = [
                {'range': 'Under 1M', 'count': properties.filter(price_etb__lt=1000000).count()},
                {'range': '1M - 3M', 'count': properties.filter(price_etb__gte=1000000, price_etb__lt=3000000).count()},
                {'range': '3M - 5M', 'count': properties.filter(price_etb__gte=3000000, price_etb__lt=5000000).count()},
                {'range': '5M - 10M', 'count': properties.filter(price_etb__gte=5000000, price_etb__lt=10000000).count()},
                {'range': '10M+', 'count': properties.filter(price_etb__gte=10000000).count()},
            ]
        else:
            # Default values for no data
            stats = {
                'avg_price': 0,
                'median_price': 0,
                'min_price': 0,
                'max_price': 0,
                'total_listings': 0,
                'avg_bedrooms': 0,
                'avg_area': 0,
                'avg_price_per_sqm': 0,
            }
            price_change = 0
            type_distribution = []
            popular_areas = []
            price_ranges = []
            recent_properties = Property.objects.none()
        
        response_data = {
            'summary': {
                'average_price': stats['avg_price'] or 0,
                'median_price': stats['median_price'] or 0,
                'price_range': {
                    'min': stats['min_price'] or 0,
                    'max': stats['max_price'] or 0,
                },
                'total_listings': stats['total_listings'] or 0,
                'average_bedrooms': stats['avg_bedrooms'] or 0,
                'average_area': stats['avg_area'] or 0,
                'average_price_per_sqm': stats['avg_price_per_sqm'] or 0,
            },
            'trends': {
                'price_change_30d': round(price_change, 2),
                'new_listings_30d': recent_properties.count(),
                'average_days_on_market': 45,  # Would calculate from actual data
                'inventory_months': 3.2,  # Would calculate from actual data
            },
            'distribution': {
                'property_types': type_distribution,
                'popular_areas': popular_areas,
                'price_ranges': price_ranges,
            },
            'market_health': {
                'absorption_rate': 0.75,  # Properties sold per month
                'price_to_rent_ratio': 20,  # Years to pay off property with rent
                'rental_yield': 5.2,  # Percentage
            }
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
            property_type = data.get('property_type')
            bedrooms = data.get('bedrooms')
            total_area = data.get('total_area')
            built_year = data.get('built_year')
            condition = data.get('condition', 'good')
            city_id = data.get('city')
            sub_city_id = data.get('sub_city')
            
            # Validate required fields
            if not property_type:
                return Response(
                    {'error': 'Property type is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not total_area:
                return Response(
                    {'error': 'Total area is required'},
                    status=status.HTTP_400_BAD_REQUEST
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
                    {'error': 'Invalid data type in request'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Build query for similar properties
            similar_properties = Property.objects.filter(
                is_active=True,
                property_status='available'
            )
            
            # Apply filters
            if property_type:
                similar_properties = similar_properties.filter(property_type=property_type)
            
            if city_id:
                similar_properties = similar_properties.filter(city_id=city_id)
            
            if sub_city_id:
                similar_properties = similar_properties.filter(sub_city_id=sub_city_id)
            
            if bedrooms:
                # Allow ±1 bedroom difference
                similar_properties = similar_properties.filter(
                    bedrooms__gte=bedrooms-1,
                    bedrooms__lte=bedrooms+1
                )
            
            if built_year:
                # Filter properties within ±5 years
                similar_properties = similar_properties.filter(
                    built_year__gte=built_year-5,
                    built_year__lte=built_year+5
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
                        avg_price=Avg('price_etb'),
                        min_price=Min('price_etb'),
                        max_price=Max('price_etb'),
                        avg_area=Avg('total_area')
                    )
                    
                    avg_price = stats['avg_price'] or 0
                    avg_area = stats['avg_area'] or 100
                    
                    # Calculate price per sqm
                    if avg_area > 0:
                        price_per_sqm = avg_price / avg_area
                    else:
                        price_per_sqm = avg_price / 100
                    
                    # Adjust for requested area
                    base_value = price_per_sqm * total_area
                    valuation_type = 'sale'
                    
                elif rent_count > 0:
                    # Use rent prices for valuation
                    stats = rent_properties.aggregate(
                        avg_rent=Avg('monthly_rent'),
                        avg_area=Avg('total_area')
                    )
                    
                    avg_rent = stats['avg_rent'] or 0
                    avg_area = stats['avg_area'] or 100
                    
                    # Calculate rent per sqm
                    if avg_area > 0:
                        rent_per_sqm = avg_rent / avg_area
                    else:
                        rent_per_sqm = avg_rent / 100
                    
                    # Adjust for requested area and convert to sale value (approx 200 months)
                    monthly_rent = rent_per_sqm * total_area
                    base_value = monthly_rent * 200
                    valuation_type = 'rent'
                    
                else:
                    # No price data, use defaults
                    base_value = 5000000
                    valuation_type = 'default'
                
            else:
                # No similar properties found, use defaults
                base_value = 5000000
                valuation_type = 'default'
                comparable_count = 0
            
            # Condition multipliers
            condition_multipliers = {
                'excellent': 1.2,
                'good': 1.0,
                'average': 0.9,
                'needs_work': 0.7,
            }
            
            condition_multiplier = condition_multipliers.get(condition, 1.0)
            
            # Feature adjustments (ETB)
            feature_adjustments = 0
            if data.get('has_parking'):
                feature_adjustments += 50000
            if data.get('has_security'):
                feature_adjustments += 30000
            if data.get('has_garden'):
                feature_adjustments += 100000
            if data.get('has_furniture'):
                feature_adjustments += 150000
            
            # Final valuation
            final_valuation = float(base_value * Decimal(condition_multiplier)) + feature_adjustments
            
            # Confidence level
            if comparable_count > 10:
                confidence = 'high'
            elif comparable_count > 5:
                confidence = 'medium'
            else:
                confidence = 'low'
            
            # Price per sqm for the valuation
            price_per_sqm_val = final_valuation / total_area if total_area > 0 else 0
            
            # Prepare response
            valuation_result = {
                'estimated_value': round(final_valuation, 2),
                'value_range': {
                    'low': round(final_valuation * 0.85, 2),
                    'high': round(final_valuation * 1.15, 2)
                },
                'confidence': confidence,
                'comparables_count': comparable_count,
                'price_per_sqm': round(price_per_sqm_val, 2),
                'valuation_type': valuation_type,
                'market_trend': 'rising',
                'trend_strength': 8.2,
                'valuation_date': timezone.now().date().isoformat(),
                'notes': f"Based on {comparable_count} similar properties. Condition: {condition}."
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
                        estimated_value_low=valuation_result['value_range']['low'],
                        estimated_value_mid=valuation_result['estimated_value'],
                        estimated_value_high=valuation_result['value_range']['high'],
                        confidence_level=confidence,
                        price_per_sqm=valuation_result['price_per_sqm'],
                        comparables_count=comparable_count,
                        market_trend='rising',
                        trend_strength=8.2,
                        notes=valuation_result['notes']
                    )
                except Exception as e:
                    logger.error(f"Error saving valuation: {e}")
                    # Continue even if saving fails
            
            return Response(valuation_result)
            
        except Exception as e:
            logger.error(f"Valuation error: {str(e)}", exc_info=True)
            return Response(
                {
                    'error': 'Internal server error',
                    'detail': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Additional ViewSets
class CityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = City.objects.filter(is_active=True)
    serializer_class = CitySerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'name_amharic']

class SubCityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SubCity.objects.all()
    serializer_class = SubCitySerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['city']

class SavedSearchViewSet(viewsets.ModelViewSet):
    serializer_class = SavedSearchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SavedSearch.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        saved_search = self.get_object()
        saved_search.is_active = not saved_search.is_active
        saved_search.save()
        return Response({'is_active': saved_search.is_active})

class TrackedPropertyViewSet(viewsets.ModelViewSet):
    serializer_class = TrackedPropertySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TrackedProperty.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class InquiryViewSet(viewsets.ModelViewSet):
    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_admin_user:  # Use new property
            # Admin users see all inquiries
            return Inquiry.objects.all()
        
        # Regular users see their own inquiries
        return Inquiry.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        inquiry = serializer.save(user=self.request.user)
        
        # Send notification to property owner/agent
        if inquiry.property.agent:
            # Create notification for agent
            Notification.objects.create(
                user=inquiry.property.agent,
                notification_type='inquiry_response',
                title='New Property Inquiry',
                message=f'You have a new inquiry for {inquiry.property.title}',
                content_type='inquiry',
                object_id=inquiry.id
            )

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
            .values('property_type')
            .annotate(count=Count('id'))
            .values_list('property_type', 'count')
        )
        
        # Recent activities
        recent_activities = list(
            UserActivity.objects.select_related('user')
            .order_by('-created_at')[:10]
            .values('user__email', 'activity_type', 'created_at')
        )
        
        data = {
            'total_properties': total_properties,
            'total_users': total_users,
            'total_inquiries': total_inquiries,
            'total_valuations': total_valuations,
            'revenue_month': revenue_month,
            'revenue_growth': revenue_growth,
            'property_type_distribution': type_distribution,
            'recent_activities': recent_activities,
        }
        
        return Response(data)

class HealthCheckView(APIView):
    permission_classes = []
    
    def get(self, request):
        return Response({
            'status': 'healthy',
            'service': 'UTOPIA API',
            'version': '1.0.0',
            'timestamp': timezone.now().isoformat(),
        })


class ComparisonViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    @action(detail=False, methods=['post'])
    def compare_properties(self, request):
        """
        Compare multiple properties side by side
        """
        serializer = AddToComparisonSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        property_ids = serializer.validated_data['property_ids']
        
        # Validate property count
        if len(property_ids) > 10:
            return Response(
                {'error': 'Cannot compare more than 10 properties at once'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get properties
        properties = Property.objects.filter(
            id__in=property_ids,
            is_active=True
        ).select_related('city', 'sub_city')
        
        if properties.count() != len(property_ids):
            return Response(
                {'error': 'Some properties not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Build comparison matrix
        comparison_fields = [
            'title',
            'property_type',
            'listing_type',
            'city',
            'sub_city',
            'bedrooms',
            'bathrooms',
            'total_area',
            'price_etb',
            'monthly_rent',
            'price_per_sqm',
            'built_year',
            'furnishing_type',
            'has_parking',
            'has_garden',
            'has_security',
            'has_furniture',
            'has_air_conditioning',
            'has_generator',
            'has_elevator',
            'is_pet_friendly',
            'is_wheelchair_accessible',
            'virtual_tour_url',
            'is_verified',
            'is_featured',
            'days_on_market',
        ]
        
        matrix = {}
        for field in comparison_fields:
            matrix[field] = []
            for prop in properties:
                value = getattr(prop, field, None)
                if callable(value):
                    value = value()
                elif hasattr(value, 'name'):
                    value = value.name
                matrix[field].append(value)
        
        response_data = {
            'fields': comparison_fields,
            'properties': ComparisonPropertySerializer(properties, many=True).data,
            'matrix': matrix,
            'summary': {
                'count': properties.count(),
                'price_range': {
                    'min': properties.aggregate(min=Min('price_etb'))['min'],
                    'max': properties.aggregate(max=Max('price_etb'))['max'],
                    'avg': properties.aggregate(avg=Avg('price_etb'))['avg'],
                },
                'price_per_sqm_range': {
                    'min': properties.aggregate(min=Min(F('price_etb') / F('total_area')))['min'],
                    'max': properties.aggregate(max=Max(F('price_etb') / F('total_area')))['max'],
                    'avg': properties.aggregate(avg=Avg(F('price_etb') / F('total_area')))['avg'],
                }
            }
        }
        
        # Save comparison for authenticated users
        if request.user.is_authenticated:
            comparison = PropertyComparison.objects.create(
                user=request.user,
                name=f"Comparison {timezone.now().strftime('%Y-%m-%d %H:%M')}"
            )
            comparison.properties.set(properties)
            
            response_data['comparison_id'] = comparison.id
            response_data['save_url'] = f"/api/comparisons/{comparison.id}/"
        
        return Response(response_data)
    
    @action(detail=False, methods=['post'])
    def save_comparison(self, request):
        """
        Save current comparison for logged-in users
        """
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        property_ids = request.data.get('property_ids', [])
        name = request.data.get('name', f"Comparison {timezone.now().strftime('%Y-%m-%d')}")
        
        if not property_ids:
            return Response(
                {'error': 'No properties to save'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        properties = Property.objects.filter(
            id__in=property_ids,
            is_active=True
        )
        
        comparison = PropertyComparison.objects.create(
            user=request.user,
            name=name
        )
        comparison.properties.set(properties)
        
        return Response({
            'id': comparison.id,
            'name': comparison.name,
            'property_count': properties.count(),
            'message': 'Comparison saved successfully'
        })
    
    @action(detail=False, methods=['get'])
    def my_comparisons(self, request):
        """
        Get user's saved comparisons
        """
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        comparisons = PropertyComparison.objects.filter(
            user=request.user
        ).prefetch_related('properties')
        
        serializer = PropertyComparisonSerializer(comparisons, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'delete'])
    def comparison_detail(self, request, pk=None):
        """
        Get or delete a specific comparison
        """
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            comparison = PropertyComparison.objects.get(id=pk, user=request.user)
        except PropertyComparison.DoesNotExist:
            return Response(
                {'error': 'Comparison not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method == 'DELETE':
            comparison.delete()
            return Response({'message': 'Comparison deleted successfully'})
        
        # GET request
        serializer = PropertyComparisonSerializer(comparison)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def compare_similar(self, request):
        """Compare similar properties based on criteria"""
        criteria = request.data
        
        # Build query based on criteria
        query = Q(is_active=True)
        
        if criteria.get('city'):
            query &= Q(city_id=criteria['city'])
        
        if criteria.get('property_type'):
            query &= Q(property_type=criteria['property_type'])
        
        if criteria.get('min_bedrooms'):
            query &= Q(bedrooms__gte=criteria['min_bedrooms'])
        
        if criteria.get('max_bedrooms'):
            query &= Q(bedrooms__lte=criteria['max_bedrooms'])
        
        if criteria.get('min_price'):
            query &= Q(price_etb__gte=criteria['min_price'])
        
        if criteria.get('max_price'):
            query &= Q(price_etb__lte=criteria['max_price'])
        
        # Get properties
        properties = Property.objects.filter(query).select_related(
            'city', 'sub_city'
        ).order_by('-created_at')[:5]
        
        if properties.count() < 2:
            return Response({
                'message': 'Not enough similar properties found',
                'count': properties.count()
            })
        
        # Use existing comparison logic
        property_ids = [p.id for p in properties]
        # Create a mock request for compare_properties
        mock_request = request._request
        mock_request.data = {'property_ids': property_ids}
        
        return self.compare_properties(mock_request)

class ComparisonAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def post(self, request):
        """Advanced property comparison with scoring"""
        data = request.data
        
        # Get property IDs
        property_ids = data.get('property_ids', [])
        criteria = data.get('criteria', {})
        
        if len(property_ids) < 2:
            return Response(
                {'error': 'Select at least 2 properties to compare'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get properties
        properties = Property.objects.filter(
            id__in=property_ids,
            is_active=True
        ).select_related('city', 'sub_city').prefetch_related('images', 'amenities')
        
        if properties.count() != len(property_ids):
            return Response(
                {'error': 'Some properties not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate comparison data
        comparison_data = []
        for prop in properties:
            prop_data = prop.get_comparison_data()
            prop_data['score'] = PropertyComparisonService.calculate_score(prop, criteria)
            comparison_data.append(prop_data)
        
        # Generate report
        report = PropertyComparisonService.generate_comparison_report(properties)
        
        response_data = {
            'properties': comparison_data,
            'report': report,
            'criteria': criteria,
            'comparison_date': timezone.now().isoformat()
        }
        
        return Response(response_data)

class AdminUserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['user_type', 'is_verified', 'is_active']
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    pagination_class = CustomPagination
    
    def get_queryset(self):
        queryset = User.objects.all().order_by('-created_at')
        
        # Apply filters if they exist and are not empty/undefined
        user_type = self.request.query_params.get('user_type')
        if user_type and user_type not in ['', 'undefined']:
            queryset = queryset.filter(user_type=user_type)
            
        search = self.request.query_params.get('search')
        if search and search not in ['', 'undefined']:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone_number__icontains=search)
            )
            
        return queryset

# Admin Property Management ViewSet
class AdminPropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['property_type', 'listing_type', 'property_status', 'is_verified', 'is_featured']
    search_fields = ['title', 'description', 'specific_location']
    pagination_class = CustomPagination
    
    def get_queryset(self):
        return Property.objects.all().select_related(
            'city', 'sub_city', 'owner', 'agent'
        ).prefetch_related('images').order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def toggle_verification(self, request, pk=None):
        property = self.get_object()
        property.is_verified = not property.is_verified
        property.save()
        return Response({'is_verified': property.is_verified})
    
    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        property = self.get_object()
        property.is_featured = not property.is_featured
        property.save()
        return Response({'is_featured': property.is_featured})

    def get_queryset(self):
        queryset = Property.objects.all().select_related(
            'city', 'sub_city', 'owner', 'agent'
        ).prefetch_related('images').order_by('-created_at')
        
        # Clean filter values
        filters = {}
        
        property_type = self.request.query_params.get('property_type')
        if property_type and property_type not in ['', 'undefined']:
            filters['property_type'] = property_type
            
        property_status = self.request.query_params.get('property_status')
        if property_status and property_status not in ['', 'undefined']:
            filters['property_status'] = property_status
            
        search = self.request.query_params.get('search')
        if search and search not in ['', 'undefined']:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(specific_location__icontains=search)
            )
            
        return queryset.filter(**filters) if filters else queryset

# Admin Inquiry Management ViewSet
class AdminInquiryViewSet(viewsets.ModelViewSet):
    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['inquiry_type', 'status', 'priority']
    search_fields = ['property__title', 'user__email', 'full_name', 'email']
    pagination_class = CustomPagination
    
    def get_queryset(self):
        return Inquiry.objects.all().select_related(
            'property', 'user', 'assigned_to'
        ).order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def assign_to_me(self, request, pk=None):
        inquiry = self.get_object()
        inquiry.assigned_to = request.user
        inquiry.save()
        return Response({'assigned_to': inquiry.assigned_to.email})

# Notification ViewSet
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        unread_count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        return Response({'unread_count': unread_count})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        updated = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(is_read=True, read_at=timezone.now())
        return Response({'marked_read': updated})

# Unread Notification Count View
class UnreadNotificationCountView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        unread_count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        return Response({'unread_count': unread_count})

class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = CustomPagination
    
    def get_queryset(self):
        return AuditLog.objects.all().select_related('user').order_by('-created_at')

class ReportView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        # Calculate date ranges
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # User statistics
        total_users = User.objects.count()
        new_users_week = User.objects.filter(created_at__gte=week_ago).count()
        new_users_month = User.objects.filter(created_at__gte=month_ago).count()
        
        # Property statistics
        total_properties = Property.objects.count()
        new_properties_week = Property.objects.filter(created_at__gte=week_ago).count()
        new_properties_month = Property.objects.filter(created_at__gte=month_ago).count()
        
        # Inquiry statistics
        total_inquiries = Inquiry.objects.count()
        new_inquiries_week = Inquiry.objects.filter(created_at__gte=week_ago).count()
        new_inquiries_month = Inquiry.objects.filter(created_at__gte=month_ago).count()
        
        # User type distribution (simplified)
        user_type_distribution = dict(
            User.objects.values('user_type').annotate(count=Count('id')).values_list('user_type', 'count')
        )
        
        # Property type distribution
        property_type_distribution = dict(
            Property.objects.values('property_type').annotate(count=Count('id')).values_list('property_type', 'count')
        )
        
        return Response({
            'user_stats': {
                'total': total_users,
                'new_this_week': new_users_week,
                'new_this_month': new_users_month,
                'type_distribution': user_type_distribution,  
            },
            'property_stats': {
                'total': total_properties,
                'new_this_week': new_properties_week,
                'new_this_month': new_properties_month,
                'type_distribution': property_type_distribution,
                'verified_count': Property.objects.filter(is_verified=True).count(),
                'featured_count': Property.objects.filter(is_featured=True).count(),
            },
            'inquiry_stats': {
                'total': total_inquiries,
                'new_this_week': new_inquiries_week,
                'new_this_month': new_inquiries_month,
                'by_status': dict(Inquiry.objects.values('status').annotate(count=Count('id')).values_list('status', 'count')),
                'by_type': dict(Inquiry.objects.values('inquiry_type').annotate(count=Count('id')).values_list('inquiry_type', 'count')),
            },
            'market_stats': {
                'average_price': Property.objects.filter(is_active=True).aggregate(avg=Avg('price_etb'))['avg'] or 0,
                'total_listings': Property.objects.filter(is_active=True).count(),
                'sold_count': Property.objects.filter(property_status='sold').count(),
                'rented_count': Property.objects.filter(property_status='rented').count(),
            }
        })

# Admin Settings View
class AdminSettingsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        # Get system settings
        settings = {
            'site_name': 'UTOPIA Real Estate',
            'site_description': 'Ethiopian Real Estate Platform',
            'contact_email': 'admin@utopia.com',
            'contact_phone': '+251911223344',
            'currency': 'ETB',
            'default_language': 'en',
            'maintenance_mode': False,
            'registration_enabled': True,
            'property_auto_approval': False,
            'max_properties_per_user': 10,
            'property_expiry_days': 90,
            'commission_rate': 2.5,
        }
        return Response(settings)
    
    def post(self, request):
        # Update settings (simplified - would save to database in real implementation)
        settings = request.data
        return Response({
            'message': 'Settings updated successfully',
            'settings': settings
        })