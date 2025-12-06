import django_filters
from django.db.models import Q
from real_estate.models import Property

class PropertyFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    min_price = django_filters.NumberFilter(field_name='price_etb', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price_etb', lookup_expr='lte')
    min_bedrooms = django_filters.NumberFilter(field_name='bedrooms', lookup_expr='gte')
    max_bedrooms = django_filters.NumberFilter(field_name='bedrooms', lookup_expr='lte')
    min_area = django_filters.NumberFilter(field_name='total_area', lookup_expr='gte')
    max_area = django_filters.NumberFilter(field_name='total_area', lookup_expr='lte')
    min_bathrooms = django_filters.NumberFilter(field_name='bathrooms', lookup_expr='gte')
    
    # Feature filters
    has_parking = django_filters.BooleanFilter(field_name='has_parking')
    has_garden = django_filters.BooleanFilter(field_name='has_garden')
    has_security = django_filters.BooleanFilter(field_name='has_security')
    has_furniture = django_filters.BooleanFilter(field_name='has_furniture')
    has_air_conditioning = django_filters.BooleanFilter(field_name='has_air_conditioning')
    
    # Date filters
    listed_after = django_filters.DateFilter(field_name='listed_date', lookup_expr='gte')
    listed_before = django_filters.DateFilter(field_name='listed_date', lookup_expr='lte')
    
    class Meta:
        model = Property
        fields = {
            'listing_type': ['exact'],
            'property_type': ['exact', 'in'],
            'property_status': ['exact'],
            'city': ['exact'],
            'sub_city': ['exact'],
            'furnishing_type': ['exact'],
            'is_featured': ['exact'],
            'is_verified': ['exact'],
            'is_premium': ['exact'],
            'built_year': ['gte', 'lte'],
        }
    
    def filter_search(self, queryset, name, value):
        if value:
            return queryset.filter(
                Q(title__icontains=value) |
                Q(title_amharic__icontains=value) |
                Q(description__icontains=value) |
                Q(description_amharic__icontains=value) |
                Q(specific_location__icontains=value) |
                Q(city__name__icontains=value) |
                Q(sub_city__name__icontains=value)
            )
        return queryset