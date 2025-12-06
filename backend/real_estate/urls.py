# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FeaturedPropertiesView, PropertyListView, PropertyDetailView,
    CityListView, SubCityListView, AmenityListView
)

urlpatterns = [
    # Properties
    path('properties/', PropertyListView.as_view(), name='property-list'),
    path('properties/<int:id>/', PropertyDetailView.as_view(), name='property-detail'),
    path('properties/featured/', FeaturedPropertiesView.as_view(), name='featured-properties'),
    
    # Cities
    path('cities/', CityListView.as_view(), name='city-list'),
    path('sub-cities/', SubCityListView.as_view(), name='sub-city-list'),
    path('amenities/', AmenityListView.as_view(), name='amenity-list'),
    
    # You might also want these:
    path('properties/<int:id>/increment_views/', PropertyDetailView.as_view(), name='increment-views'),
]