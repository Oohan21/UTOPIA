# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'search-history', views.SearchHistoryViewSet, basename='search-history')
router.register(r'saved-searches', views.SavedSearchViewSet, basename='saved-searches')

urlpatterns = [
    path('', include(router.urls)),
    # Properties
    path("properties/", views.PropertyListView.as_view(), name="property-list"),
    path("properties/<int:id>/", views.PropertyDetailView.as_view(), name="property-detail"),
    path(
        "properties/featured/",
        views.FeaturedPropertiesView.as_view(),
        name="featured-properties",
    ),
    path(
        "listings/my-listings/", views.UserPropertiesView.as_view(), name="user-properties"
    ),
    path(
        "properties/<int:id>/track_view/",
        views.TrackPropertyView.as_view(),
        name="track-property-view",
    ),
    path('listings/<int:id>/save/', views.save_property_view, name='save_property'),
    path('listings/<int:id>/unsave/', views.unsave_property_view, name='unsave_property'),
    path('listings/saved/', views.get_saved_properties_view, name='get_saved_properties'),
    # Cities
    path("cities/", views.CityListView.as_view(), name="city-list"),
    path("sub-cities/", views.SubCityListView.as_view(), name="sub-city-list"),
    path("amenities/", views.AmenityListView.as_view(), name="amenity-list"),
    path('search-history/track/', views.track_search, name='track-search'),
    path('search-history/recent/', views.get_recent_searches, name='recent-searches'),
    path('debug/inquiry-count/<int:property_id>/', views.debug_inquiry_count, name='debug_inquiry_count'),
]