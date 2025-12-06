# views.py
from rest_framework import generics, filters, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Property, City, SubCity, Amenity
from .serializers import PropertySerializer, CitySerializer, SubCitySerializer, AmenitySerializer

class FeaturedPropertiesView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Property.objects.filter(
            is_featured=True, 
            is_active=True,
            property_status='available'
        ).select_related(
            'city', 'sub_city', 'owner', 'agent', 'developer'
        ).prefetch_related(
            'amenities', 'images'
        ).order_by('-created_at')[:10]

class PropertyListView(generics.ListAPIView):
    serializer_class = PropertySerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'property_type': ['exact'],
        
        'city': ['exact'],
        'sub_city': ['exact'],
        'bedrooms': ['gte', 'lte'],
        'bathrooms': ['gte', 'lte'],
        'price_etb': ['gte', 'lte'],
        'total_area': ['gte', 'lte'],
        'is_featured': ['exact'],
        'is_verified': ['exact'],
        'has_parking': ['exact'],
        'has_security': ['exact'],
        'has_garden': ['exact'],
        'has_furniture': ['exact'],
    }
    search_fields = ['title', 'description', 'specific_location', 'city__name', 'sub_city__name']
    ordering_fields = ['price_etb', 'total_area', 'bedrooms', 'created_at', 'views_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Property.objects.filter(
            is_active=True,
            property_status='available'
        ).select_related(
            'city', 'sub_city', 'owner', 'agent', 'developer'
        ).prefetch_related(
            'amenities', 'images'
        )
        return queryset

class PropertyDetailView(generics.RetrieveUpdateAPIView):  # Changed from RetrieveAPIView
    serializer_class = PropertySerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Add this line
    lookup_field = 'id'
    
    def get_permissions(self):
        # Allow GET for everyone, but require authentication for PUT/PATCH
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            # For updates, users can only see their own properties (or admins)
            if self.request.user.is_authenticated:
                if self.request.user.user_type == 'admin':
                    return Property.objects.all()
                return Property.objects.filter(owner=self.request.user)
        # For GET requests, show all active properties
        return Property.objects.filter(is_active=True).select_related(
            'city', 'sub_city', 'owner', 'agent', 'developer'
        ).prefetch_related('amenities', 'images', 'documents')
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.increment_views()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class CityListView(generics.ListAPIView):
    queryset = City.objects.filter(is_active=True)
    serializer_class = CitySerializer
    permission_classes = [AllowAny]

class SubCityListView(generics.ListAPIView):
    serializer_class = SubCitySerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = SubCity.objects.all()
        city_id = self.request.query_params.get('city', None)
        if city_id is not None:
            queryset = queryset.filter(city_id=city_id)
        return queryset

class AmenityListView(generics.ListAPIView):
    serializer_class = AmenitySerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        return Amenity.objects.filter(is_active=True).order_by('amenity_type', 'name')