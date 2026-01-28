from rest_framework import viewsets, generics, filters, status
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
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
from real_estate.models import Property, Inquiry, City, SubCity, Amenity

logger = logging.getLogger(__name__)
User = get_user_model()


# Admin Location Management ViewSets
class AdminCityViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing cities with full CRUD operations"""
    queryset = City.objects.all()
    serializer_class = CitySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'name_amharic', 'description']
    ordering_fields = ['name', 'created_at', 'is_active', 'population']
    ordering = ['name']
    
    def get_queryset(self):
        queryset = City.objects.all()
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle city active status"""
        city = self.get_object()
        city.is_active = not city.is_active
        city.save()
        return Response({
            'id': city.id,
            'is_active': city.is_active,
            'message': f'City {city.name} is now {"active" if city.is_active else "inactive"}'
        })
    
    @action(detail=True, methods=['get'])
    def subcities(self, request, pk=None):
        """Get all sub-cities for this city"""
        city = self.get_object()
        subcities = city.sub_cities.all()
        serializer = SubCitySerializer(subcities, many=True)
        return Response({
            'city': CitySerializer(city).data,
            'subcities': serializer.data,
            'count': subcities.count()
        })


class AdminSubCityViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing sub-cities with full CRUD operations"""
    queryset = SubCity.objects.select_related('city').all()
    serializer_class = SubCitySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['city', 'is_popular']
    search_fields = ['name', 'name_amharic', 'description']
    ordering_fields = ['name', 'city__name', 'created_at', 'is_popular']
    ordering = ['city__name', 'name']
    
    @action(detail=True, methods=['post'])
    def toggle_popular(self, request, pk=None):
        """Toggle sub-city popular status"""
        subcity = self.get_object()
        subcity.is_popular = not subcity.is_popular
        subcity.save()
        return Response({
            'id': subcity.id,
            'is_popular': subcity.is_popular,
            'message': f'SubCity {subcity.name} is now {"popular" if subcity.is_popular else "not popular"}'
        })


class AdminAmenityViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing amenities with full CRUD operations"""
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['amenity_type', 'is_active']
    search_fields = ['name', 'name_amharic', 'description']
    ordering_fields = ['name', 'amenity_type', 'created_at', 'is_active']
    ordering = ['amenity_type', 'name']
    
    def get_queryset(self):
        queryset = Amenity.objects.all()
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle amenity active status"""
        amenity = self.get_object()
        amenity.is_active = not amenity.is_active
        amenity.save()
        return Response({
            'id': amenity.id,
            'is_active': amenity.is_active,
            'message': f'Amenity {amenity.name} is now {"active" if amenity.is_active else "inactive"}'
        })
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get amenities grouped by type"""
        amenity_types = Amenity.AMENITY_TYPES
        result = {}
        for type_code, type_name in amenity_types:
            amenities = self.queryset.filter(amenity_type=type_code, is_active=True)
            result[type_code] = {
                'type_name': type_name,
                'amenities': AmenitySerializer(amenities, many=True).data,
                'count': amenities.count()
            }
        return Response(result)
