from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Sum, F, Q, Min, Max
from django.utils import timezone
from datetime import datetime, timedelta, time
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
import csv
import json
import psutil
import platform
from django.db import connection
import os
from .models import MarketTrend, CityAnalytics, UserAnalytics, PlatformAnalytics
from .serializers import (
    MarketTrendSerializer,
    CityAnalyticsSerializer,
    UserAnalyticsSerializer,
    PlatformAnalyticsSerializer,
    MarketOverviewSerializer,
    PriceAnalysisSerializer,
    DemandAnalysisSerializer,
)
from real_estate.models import Property, City, SubCity, PropertyView, Inquiry
from users.models import CustomUser, UserActivity
from api.permissions import *
from subscriptions.models import Payment


class MarketTrendViewSet(viewsets.ReadOnlyModelViewSet):
    """Market trend data"""

    queryset = MarketTrend.objects.all()
    serializer_class = MarketTrendSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        days = int(self.request.query_params.get("days", 30))
        date_from = timezone.now() - timedelta(days=days)
        return MarketTrend.objects.filter(date__gte=date_from).order_by("date")

    def list(self, request, *args, **kwargs):
        """Override list to return generated trends if no data exists"""
        queryset = self.get_queryset()

        # If no market trends exist, generate from property data
        if not queryset.exists():
            days = int(self.request.query_params.get("days", 30))

            # Try to generate from market overview first
            try:
                from .views import MarketAnalyticsView

                analytics_view = MarketAnalyticsView()
                trends = analytics_view.generate_market_trends_from_properties(days)

                # Create MarketTrend objects to return
                for trend_data in trends:
                    trend = MarketTrend(
                        date=datetime.fromisoformat(trend_data["date"]).date(),
                        total_listings=trend_data["total_listings"],
                        active_listings=trend_data["active_listings"],
                        new_listings=trend_data["new_listings"],
                        sold_listings=trend_data["sold_listings"],
                        rented_listings=trend_data["rented_listings"],
                        average_price=trend_data["average_price"],
                        total_views=trend_data["total_views"],
                        total_inquiries=trend_data["total_inquiries"],
                    )

                page = self.paginate_queryset(trends)
                if page is not None:
                    return self.get_paginated_response(page)

                return Response(trends)

            except Exception as e:
                # Return empty array if generation fails
                return Response([])

        # Serialize and return existing data
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class MarketAnalyticsView(generics.GenericAPIView):
    """Comprehensive market analytics"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get("period", "30d")

        if period == "7d":
            days = 7
        elif period == "90d":
            days = 90
        elif period == "365d":
            days = 365
        else:
            days = 30

        date_from = timezone.now() - timedelta(days=days)

        # Get today's date range
        from datetime import datetime, time

        today_start = timezone.make_aware(
            datetime.combine(timezone.now().date(), time.min)
        )
        today_end = timezone.make_aware(
            datetime.combine(timezone.now().date(), time.max)
        )

        # Get properties data
        properties = Property.objects.filter(created_at__gte=date_from, is_active=True)

        # Calculate market overview - FIXED TODAY'S METRICS
        overview = {
            "total_listings": properties.count(),
            "active_listings": properties.filter(property_status="available").count(),
            "new_listings_today": properties.filter(
                created_at__gte=today_start, created_at__lte=today_end
            ).count(),
            "average_price": properties.filter(price_etb__gt=0).aggregate(
                avg=Avg("price_etb")
            )["avg"]
            or 0,
            "price_change_weekly": self.calculate_price_change(7),
            "total_views_today": PropertyView.objects.filter(  # FIXED
                viewed_at__gte=today_start, viewed_at__lte=today_end
            ).count(),
            "total_inquiries_today": Inquiry.objects.filter(  # FIXED
                created_at__gte=today_start, created_at__lte=today_end
            ).count(),
            "total_inquiries": Inquiry.objects.count(),  # ADDED: Total inquiries
            "market_health": self.calculate_market_health(),
            "top_performing_cities": self.get_top_performing_cities(days),
            "property_type_distribution": self.get_property_type_distribution(days),
            "price_distribution": self.get_price_distribution(),
            "market_trends": self.get_market_trends_data(days),  # ADDED: Market trends
        }

        serializer = MarketOverviewSerializer(overview)
        return Response(serializer.data)

    def calculate_price_change(self, days):
        """Calculate price change over period"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)

        # Get properties listed within each date range
        start_avg = (
            Property.objects.filter(
                created_at__date__gte=start_date,
                created_at__date__lte=start_date,  # Single day
                price_etb__gt=0,
                is_active=True,
            ).aggregate(avg=Avg("price_etb"))["avg"]
            or 0
        )

        end_avg = (
            Property.objects.filter(
                created_at__date__gte=end_date,
                created_at__date__lte=end_date,  # Single day
                price_etb__gt=0,
                is_active=True,
            ).aggregate(avg=Avg("price_etb"))["avg"]
            or 0
        )

        if start_avg > 0:
            return ((end_avg - start_avg) / start_avg) * 100
        return 0

    def calculate_market_health(self):
        """Calculate market health score"""
        properties = Property.objects.filter(is_active=True)
        available = properties.filter(property_status="available").count()
        sold = properties.filter(property_status="sold").count()

        if properties.count() > 0:
            absorption = sold / properties.count()

            # Also consider days on market and inquiry-to-view ratio
            avg_days_on_market = self.get_average_days_on_market()
            inquiry_ratio = self.get_inquiry_to_view_ratio()

            # Composite score calculation
            if absorption > 0.4 and avg_days_on_market < 30 and inquiry_ratio > 0.05:
                return "Excellent"
            elif absorption > 0.25 and avg_days_on_market < 60 and inquiry_ratio > 0.03:
                return "Good"
            elif absorption > 0.1:
                return "Moderate"
        return "Slow"

    def get_top_performing_cities(self, days):
        """Get top performing cities"""
        date_from = timezone.now() - timedelta(days=days)

        cities = (
            City.objects.filter(
                property__created_at__gte=date_from, property__is_active=True
            )
            .annotate(
                property_count=Count("property"),
                avg_price=Avg("property__price_etb"),
                total_views=Sum("property__views_count"),
                total_inquiries=Sum("property__inquiry_count"),
                sold_count=Count(
                    "property", filter=Q(property__property_status="sold")
                ),
            )
            .filter(property_count__gt=0)
            .order_by("-property_count")[:10]
        )  # Increased to top 10

        return [
            {
                "name": city.name,
                "property_count": city.property_count,
                "average_price": city.avg_price or 0,
                "total_views": city.total_views or 0,
                "total_inquiries": city.total_inquiries or 0,
                "sold_properties": city.sold_count,
                "sell_through_rate": (
                    (city.sold_count / city.property_count * 100)
                    if city.property_count > 0
                    else 0
                ),
            }
            for city in cities
        ]

    def get_property_type_distribution(self, days):
        """Get property type distribution"""
        date_from = timezone.now() - timedelta(days=days)

        distribution = (
            Property.objects.filter(created_at__gte=date_from, is_active=True)
            .values("property_type")
            .annotate(
                count=Count("id"),
                avg_price=Avg("price_etb"),
                avg_views=Avg("views_count"),
                avg_inquiries=Avg("inquiry_count"),
                sold_count=Count("id", filter=Q(property_status="sold")),
            )
            .order_by("-count")
        )

        result = []
        for item in distribution:
            result.append(
                {
                    "property_type": item["property_type"],
                    "count": item["count"],
                    "avg_price": item["avg_price"] or 0,
                    "avg_views": item["avg_views"] or 0,
                    "avg_inquiries": item["avg_inquiries"] or 0,
                    "sold_count": item["sold_count"],
                    "percentage": (
                        (
                            item["count"]
                            / Property.objects.filter(
                                created_at__gte=date_from, is_active=True
                            ).count()
                            * 100
                        )
                        if Property.objects.filter(
                            created_at__gte=date_from, is_active=True
                        ).count()
                        > 0
                        else 0
                    ),
                }
            )

        return result

    def get_price_distribution(self):
        """Get price distribution with more detail"""
        price_ranges = [
            {"range": "Under 500K", "min": 0, "max": 500000},
            {"range": "500K - 1M", "min": 500000, "max": 1000000},
            {"range": "1M - 2M", "min": 1000000, "max": 2000000},
            {"range": "2M - 3M", "min": 2000000, "max": 3000000},
            {"range": "3M - 5M", "min": 3000000, "max": 5000000},
            {"range": "5M - 10M", "min": 5000000, "max": 10000000},
            {"range": "10M+", "min": 10000000, "max": None},
        ]

        total_properties = Property.objects.filter(is_active=True).count()
        distribution = []

        for price_range in price_ranges:
            query = Property.objects.filter(is_active=True, price_etb__gt=0)

            if price_range["min"] is not None:
                query = query.filter(price_etb__gte=price_range["min"])

            if price_range["max"] is not None:
                query = query.filter(price_etb__lt=price_range["max"])
            else:
                query = query.filter(price_etb__gte=10000000)

            count = query.count()
            avg_price = query.aggregate(avg=Avg("price_etb"))["avg"] or 0
            avg_views = query.aggregate(avg=Avg("views_count"))["avg"] or 0

            if count > 0:
                distribution.append(
                    {
                        "range": price_range["range"],
                        "count": count,
                        "percentage": (
                            (count / total_properties) * 100
                            if total_properties > 0
                            else 0
                        ),
                        "avg_price": avg_price,
                        "avg_views": avg_views,
                        "price_range": (
                            f"{price_range['min']:,} - {price_range['max']:,}"
                            if price_range["max"]
                            else f"{price_range['min']:,}+"
                        ),
                    }
                )

        return distribution

    def get_average_days_on_market(self):
        """Calculate average days on market"""
        sold_properties = Property.objects.filter(
            property_status="sold", listed_date__isnull=False, updated_at__isnull=False
        )

        if not sold_properties.exists():
            return 0

        total_days = 0
        count = 0

        for prop in sold_properties:
            if prop.listed_date and prop.updated_at:
                days = (prop.updated_at - prop.listed_date).days
                if days > 0:  # Only include valid days
                    total_days += days
                    count += 1

        return total_days / count if count > 0 else 0

    def get_inquiry_to_view_ratio(self):
        """Calculate inquiry to view conversion ratio"""
        total_views = (
            Property.objects.filter(is_active=True).aggregate(total=Sum("views_count"))[
                "total"
            ]
            or 0
        )

        total_inquiries = (
            Property.objects.filter(is_active=True).aggregate(
                total=Sum("inquiry_count")
            )["total"]
            or 0
        )

        if total_views > 0:
            return total_inquiries / total_views
        return 0

    def get_market_trends_data(self, days):
        """Get market trends data for the period"""
        date_from = timezone.now() - timedelta(days=days)

        # Get daily trends for the period
        trends = MarketTrend.objects.filter(date__gte=date_from).order_by("date")

        # If no market trends exist, create basic trend data
        if not trends.exists():
            return self.generate_basic_trends_data(days)

        # Convert trends to serializable format
        trend_data = []
        for trend in trends:
            trend_data.append(
                {
                    "date": trend.date.isoformat(),
                    "average_price": float(trend.average_price),
                    "active_listings": trend.active_listings,
                    "new_listings": trend.new_listings,
                    "sold_listings": trend.sold_listings,
                    "total_views": trend.total_views,
                    "total_inquiries": trend.total_inquiries,
                    "price_change_daily": float(trend.price_change_daily),
                    "inventory_months": float(trend.inventory_months),
                }
            )

        return trend_data

    def generate_basic_trends_data(self, days):
        """Generate basic trend data when no MarketTrend records exist"""
        from datetime import timedelta

        trend_data = []
        for i in range(days, -1, -1):
            current_date = timezone.now().date() - timedelta(days=i)

            # Get properties for this day
            properties = Property.objects.filter(
                created_at__date=current_date, is_active=True
            )

            avg_price = (
                properties.filter(price_etb__gt=0).aggregate(avg=Avg("price_etb"))[
                    "avg"
                ]
                or 0
            )

            active_listings = properties.filter(property_status="available").count()
            new_listings = Property.objects.filter(
                created_at__date=current_date
            ).count()
            sold_listings = properties.filter(property_status="sold").count()

            # Get views and inquiries for this day
            total_views = PropertyView.objects.filter(
                viewed_at__date=current_date
            ).count()

            total_inquiries = Inquiry.objects.filter(
                created_at__date=current_date
            ).count()

            trend_data.append(
                {
                    "date": current_date.isoformat(),
                    "average_price": float(avg_price),
                    "active_listings": active_listings,
                    "new_listings": new_listings,
                    "sold_listings": sold_listings,
                    "total_views": total_views,
                    "total_inquiries": total_inquiries,
                    "price_change_daily": 0,
                    "inventory_months": 0,
                }
            )

        return trend_data

    def generate_market_trends_from_properties(self, days=30):
        """Generate market trends from property data when no MarketTrend records exist"""
        from datetime import datetime, time, timedelta
        import json

        trends = []
        today = timezone.now().date()

        for i in range(days, -1, -1):
            current_date = today - timedelta(days=i)

            # Create timezone-aware datetime for the day
            day_start = timezone.make_aware(datetime.combine(current_date, time.min))
            day_end = timezone.make_aware(datetime.combine(current_date, time.max))

            # Get properties for this day
            properties = Property.objects.filter(
                created_at__gte=day_start, created_at__lte=day_end, is_active=True
            )

            # Get views and inquiries for this day
            views = PropertyView.objects.filter(
                viewed_at__gte=day_start, viewed_at__lte=day_end
            ).count()

            inquiries = Inquiry.objects.filter(
                created_at__gte=day_start, created_at__lte=day_end
            ).count()

            # Calculate average price
            avg_price = (
                properties.filter(price_etb__gt=0).aggregate(avg=Avg("price_etb"))[
                    "avg"
                ]
                or 0
            )

            # Create trend data
            trend_data = {
                "date": current_date.isoformat(),
                "total_listings": properties.count(),
                "active_listings": properties.filter(
                    property_status="available"
                ).count(),
                "new_listings": Property.objects.filter(
                    created_at__date=current_date
                ).count(),
                "sold_listings": properties.filter(property_status="sold").count(),
                "rented_listings": properties.filter(property_status="rented").count(),
                "average_price": float(avg_price),
                "price_change_daily": 0,
                "price_change_weekly": 0,
                "price_change_monthly": 0,
                "total_views": views,
                "total_inquiries": inquiries,
                "inventory_months": 0,
            }

            trends.append(trend_data)

        return trends


class PriceAnalyticsView(generics.GenericAPIView):
    """Price analytics"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Price range analysis
        price_range = self.get_price_range_analysis()

        # Average prices by city
        avg_prices_by_city = self.get_avg_prices_by_city()

        # Average prices by property type
        avg_prices_by_property_type = self.get_avg_prices_by_property_type()

        # Price trends
        price_trends = self.get_price_trends()

        # Price forecast (simplified)
        price_forecast = self.get_price_forecast()

        data = {
            "price_range": price_range,
            "average_prices_by_city": avg_prices_by_city,
            "average_prices_by_property_type": avg_prices_by_property_type,
            "price_trends": price_trends,
            "price_forecast": price_forecast,
        }

        serializer = PriceAnalysisSerializer(data)
        return Response(serializer.data)

    def get_price_range_analysis(self):
        """Analyze price ranges"""
        properties = Property.objects.filter(is_active=True, price_etb__gt=0)

        if not properties.exists():
            return {}

        stats = properties.aggregate(
            min_price=Min("price_etb"),
            max_price=Max("price_etb"),
            avg_price=Avg("price_etb"),
            median_price=Avg("price_etb"),  # Simplified median
        )

        return stats

    def get_avg_prices_by_city(self):
        """Get average prices by city"""
        cities = (
            City.objects.filter(property__is_active=True, property__price_etb__gt=0)
            .annotate(
                avg_price=Avg("property__price_etb"), property_count=Count("property")
            )
            .filter(property_count__gt=0)
            .order_by("-avg_price")[:10]
        )

        return [
            {
                "city": city.name,
                "avg_price": city.avg_price or 0,
                "property_count": city.property_count,
            }
            for city in cities
        ]

    def get_avg_prices_by_property_type(self):
        """Get average prices by property type"""
        prices = (
            Property.objects.filter(is_active=True, price_etb__gt=0)
            .values("property_type")
            .annotate(avg_price=Avg("price_etb"), count=Count("id"))
            .order_by("-avg_price")
        )

        return list(prices)

    def get_price_trends(self):
        """Get price trends over time"""
        trends = MarketTrend.objects.all().order_by("date")[:30]

        return MarketTrendSerializer(trends, many=True).data

    def get_price_forecast(self):
        """Simple price forecast"""
        trends = MarketTrend.objects.all().order_by("-date")[:7]

        if trends.count() < 2:
            return {"trend": "stable", "forecast": "insufficient_data"}

        recent_trends = list(trends)
        prices = [
            float(trend.average_price)
            for trend in recent_trends
            if trend.average_price > 0
        ]

        if len(prices) < 2:
            return {"trend": "stable", "forecast": "insufficient_data"}

        # Simple trend calculation
        price_change = ((prices[-1] - prices[0]) / prices[0]) * 100

        if price_change > 5:
            trend = "rising"
        elif price_change < -5:
            trend = "falling"
        else:
            trend = "stable"

        return {
            "current_trend": trend,
            "price_change_percentage": price_change,
            "forecast": f"Prices expected to continue {trend}",
            "confidence": "medium",
        }


class DemandAnalyticsView(generics.GenericAPIView):
    """Demand analytics"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Demand by city
        demand_by_city = self.get_demand_by_city()

        # Demand by property type
        demand_by_property_type = self.get_demand_by_property_type()

        # View to inquiry ratio
        view_to_inquiry_ratio = self.get_view_to_inquiry_ratio()

        # Days on market average
        days_on_market_average = self.get_days_on_market_average()

        # Seasonal trends (simplified)
        seasonal_trends = self.get_seasonal_trends()

        data = {
            "demand_by_city": demand_by_city,
            "demand_by_property_type": demand_by_property_type,
            "view_to_inquiry_ratio": view_to_inquiry_ratio,
            "days_on_market_average": days_on_market_average,
            "seasonal_trends": seasonal_trends,
        }

        serializer = DemandAnalysisSerializer(data)
        return Response(serializer.data)

    def get_demand_by_city(self):
        """Calculate demand by city based on views and inquiries"""
        cities = (
            City.objects.filter(property__is_active=True)
            .annotate(
                total_views=Sum("property__views_count"),
                total_inquiries=Sum("property__inquiry_count"),
                property_count=Count("property"),
            )
            .filter(property_count__gt=0)
            .order_by("-total_views")[:10]
        )

        return [
            {
                "city": city.name,
                "total_views": city.total_views or 0,
                "total_inquiries": city.total_inquiries or 0,
                "property_count": city.property_count,
                "demand_score": (city.total_views or 0) / max(city.property_count, 1),
            }
            for city in cities
        ]

    def get_demand_by_property_type(self):
        """Calculate demand by property type"""
        demand = (
            Property.objects.filter(is_active=True)
            .values("property_type")
            .annotate(
                total_views=Sum("views_count"),
                total_inquiries=Sum("inquiry_count"),
                count=Count("id"),
            )
            .order_by("-total_views")
        )

        return list(demand)

    def get_view_to_inquiry_ratio(self):
        """Calculate view to inquiry conversion ratio"""
        properties = Property.objects.filter(is_active=True)

        total_views = properties.aggregate(total=Sum("views_count"))["total"] or 0
        total_inquiries = properties.aggregate(total=Sum("inquiry_count"))["total"] or 0

        if total_views > 0:
            conversion_rate = (total_inquiries / total_views) * 100
        else:
            conversion_rate = 0

        return {
            "total_views": total_views,
            "total_inquiries": total_inquiries,
            "conversion_rate": conversion_rate,
            "industry_average": 2.5,  # Placeholder
        }

    def get_days_on_market_average(self):
        """Calculate average days on market"""
        from django.db.models.functions import ExtractDay
        from django.db.models import ExpressionWrapper, F, DurationField

        sold_properties = Property.objects.filter(
            property_status="sold", listed_date__isnull=False
        )

        if sold_properties.exists():
            # Calculate days on market for sold properties
            days_data = []
            for prop in sold_properties:
                if prop.listed_date and prop.updated_at:
                    days = (prop.updated_at - prop.listed_date).days
                    days_data.append(days)

            if days_data:
                avg_days = sum(days_data) / len(days_data)
                min_days = min(days_data)
                max_days = max(days_data)

                return {
                    "average_days": avg_days,
                    "minimum_days": min_days,
                    "maximum_days": max_days,
                    "sample_size": len(days_data),
                }

        return {
            "average_days": 45,  # Default estimate
            "minimum_days": 7,
            "maximum_days": 180,
            "sample_size": 0,
        }

    def get_seasonal_trends(self):
        """Get seasonal demand trends (simplified)"""
        # This would typically analyze data over multiple years
        # For now, return placeholder data
        return {
            "peak_season": "September - November",
            "low_season": "June - August",
            "seasonal_variation": "15-20%",
            "recommendation": "List properties during peak season for better visibility",
        }


class AnalyticsDashboardView(generics.GenericAPIView):
    """Comprehensive analytics dashboard"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_admin_user:
            return self.get_admin_dashboard()
        else:
            return self.get_user_dashboard(user)

    def get_admin_dashboard(self):
        """Admin analytics dashboard"""
        today_start = timezone.make_aware(
            datetime.combine(timezone.now().date(), time.min)
        )
        today_end = timezone.make_aware(
            datetime.combine(timezone.now().date(), time.max)
        )

        # Platform metrics - FIXED
        total_users = CustomUser.objects.count()
        new_users_today = CustomUser.objects.filter(
            created_at__gte=today_start, created_at__lte=today_end
        ).count()

        total_properties = Property.objects.count()
        active_properties = Property.objects.filter(is_active=True).count()

        sale_properties = Property.objects.filter(
            is_active=True, listing_type="sale"
        ).count()

        rent_properties = Property.objects.filter(
            is_active=True, listing_type="rent"
        ).count()

        # Revenue metrics
        total_revenue = (
            Payment.objects.filter(status="completed").aggregate(
                total=Sum("amount_etb")
            )["total"]
            or 0
        )

        revenue_today = (
            Payment.objects.filter(
                status="completed", paid_at__gte=today_start, paid_at__lte=today_end
            ).aggregate(total=Sum("amount_etb"))["total"]
            or 0
        )

        # Engagement metrics - FIXED TODAY'S METRICS
        total_views_today = PropertyView.objects.filter(
            viewed_at__gte=today_start, viewed_at__lte=today_end
        ).count()

        total_inquiries_today = Inquiry.objects.filter(
            created_at__gte=today_start, created_at__lte=today_end
        ).count()

        # Total inquiries (all time)
        total_inquiries = Inquiry.objects.count()

        # Performance metrics
        recent_errors = 0  # Would come from error monitoring
        api_performance = "Good"  # Would come from performance monitoring

        data = {
            "platform_metrics": {
                "total_users": total_users,
                "new_users_today": new_users_today,
                "total_properties": total_properties,
                "active_properties": active_properties,
                "verified_properties": Property.objects.filter(
                    is_verified=True
                ).count(),
                "featured_properties": Property.objects.filter(
                    is_featured=True
                ).count(),
                "sale_properties": sale_properties,
                "rent_properties": rent_properties,
            },
            "revenue_metrics": {
                "total_revenue": total_revenue,
                "revenue_today": revenue_today,
                "total_transactions": Payment.objects.filter(
                    status="completed"
                ).count(),
                "avg_transaction_value": Payment.objects.filter(
                    status="completed"
                ).aggregate(avg=Avg("amount_etb"))["avg"]
                or 0,
            },
            "engagement_metrics": {
                "total_views_today": total_views_today,
                "total_inquiries_today": total_inquiries_today,
                "total_inquiries": total_inquiries, 
                "active_users_today": CustomUser.objects.filter(
                    last_activity__gte=today_start, last_activity__lte=today_end
                ).count(),
                "user_retention_rate": self.calculate_retention_rate(),
            },
            "performance_metrics": {
                "api_performance": api_performance,
                "error_rate": recent_errors,
                "server_uptime": 99.9,  
                "response_time": 250,  
            },
            "recent_activity": self.get_recent_activity(),
            "top_performers": self.get_top_performers(),
        }

        return Response(data)

    def get_user_dashboard(self, user):
        """User analytics dashboard"""
        # User-specific metrics
        user_properties = user.owned_properties.filter(is_active=True)

        data = {
            "user_metrics": {
                "total_properties_listed": user_properties.count(),
                "active_properties": user_properties.filter(
                    property_status="available"
                ).count(),
                "sold_properties": user_properties.filter(
                    property_status="sold"
                ).count(),
                "rented_properties": user_properties.filter(
                    property_status="rented"
                ).count(),
                "total_views": user_properties.aggregate(total=Sum("views_count"))[
                    "total"
                ]
                or 0,
                "total_inquiries": user_properties.aggregate(
                    total=Sum("inquiry_count")
                )["total"]
                or 0,
                "profile_completion": user.profile_completion_percentage,
            },
            "performance_metrics": {
                "avg_days_on_market": self.calculate_user_avg_days_on_market(user),
                "view_to_inquiry_rate": self.calculate_user_conversion_rate(user),
                "response_rate": self.calculate_user_response_rate(user),
                "satisfaction_score": 4.5,  # Placeholder
            },
            "financial_metrics": {
                "total_spent": Payment.objects.filter(
                    user=user, status="completed"
                ).aggregate(total=Sum("amount_etb"))["total"]
                or 0,
                "active_promotions": user_properties.filter(is_promoted=True).count(),
                "promotion_budget": self.calculate_promotion_budget(user),
            },
            "recommendations": self.get_user_recommendations(user),
            "market_insights": self.get_user_market_insights(user),
        }

        return Response(data)

    def calculate_retention_rate(self):
        """Calculate user retention rate"""
        # Simplified calculation
        total_users = CustomUser.objects.count()
        active_users = CustomUser.objects.filter(
            last_activity__gte=timezone.now() - timedelta(days=7)
        ).count()

        if total_users > 0:
            return (active_users / total_users) * 100
        return 0

    def get_recent_activity(self):
        """Get recent platform activity"""
        recent_users = CustomUser.objects.order_by("-created_at")[:5]
        recent_properties = Property.objects.order_by("-created_at")[:5]
        recent_payments = Payment.objects.filter(status="completed").order_by(
            "-paid_at"
        )[:5]

        return {
            "recent_users": [
                {"email": user.email, "joined": user.created_at}
                for user in recent_users
            ],
            "recent_properties": [
                {
                    "title": prop.title,
                    "price": prop.price_etb,
                    "listed": prop.created_at,
                }
                for prop in recent_properties
            ],
            "recent_payments": [
                {
                    "amount": payment.amount_etb,
                    "user": payment.user.email,
                    "date": payment.paid_at,
                }
                for payment in recent_payments
            ],
        }

    def get_top_performers(self):
        """Get top performing properties and users"""
        top_properties = Property.objects.filter(is_active=True).order_by(
            "-views_count"
        )[:5]

        top_users = (
            CustomUser.objects.annotate(
                property_count=Count("owned_properties"),
                total_views=Sum("owned_properties__views_count"),
            )
            .filter(property_count__gt=0)
            .order_by("-total_views")[:5]
        )

        return {
            "top_properties": [
                {
                    "title": prop.title,
                    "views": prop.views_count,
                    "inquiries": prop.inquiry_count,
                    "city": prop.city.name if prop.city else "N/A",
                }
                for prop in top_properties
            ],
            "top_users": [
                {
                    "email": user.email,
                    "properties": user.property_count,
                    "total_views": user.total_views or 0,
                }
                for user in top_users
            ],
        }

    def calculate_user_avg_days_on_market(self, user):
        """Calculate average days on market for user's properties"""
        sold_properties = user.owned_properties.filter(property_status="sold")

        if not sold_properties.exists():
            return 0

        total_days = 0
        for prop in sold_properties:
            if prop.listed_date and prop.updated_at:
                days = (prop.updated_at - prop.listed_date).days
                total_days += days

        return total_days / sold_properties.count()

    def calculate_user_conversion_rate(self, user):
        """Calculate view to inquiry conversion rate for user's properties"""
        properties = user.owned_properties.filter(is_active=True)

        total_views = properties.aggregate(total=Sum("views_count"))["total"] or 0
        total_inquiries = properties.aggregate(total=Sum("inquiry_count"))["total"] or 0

        if total_views > 0:
            return (total_inquiries / total_views) * 100
        return 0

    def calculate_user_response_rate(self, user):
        """Calculate user's response rate to inquiries"""
        inquiries = user.inquiries_received.all()  # Assuming this relation exists

        if not inquiries.exists():
            return 0

        responded = inquiries.filter(response_sent=True).count()
        return (responded / inquiries.count()) * 100

    def calculate_promotion_budget(self, user):
        """Calculate user's promotion budget and spending"""
        total_spent = (
            Payment.objects.filter(user=user, status="completed").aggregate(
                total=Sum("amount_etb")
            )["total"]
            or 0
        )

        active_promotions = user.owned_properties.filter(is_promoted=True).count()

        return {
            "total_spent": total_spent,
            "active_promotions": active_promotions,
            "avg_promotion_cost": total_spent / max(active_promotions, 1),
            "recommended_budget": total_spent * 1.2,  # 20% increase recommendation
        }

    def get_user_recommendations(self, user):
        """Get personalized recommendations for user"""
        recommendations = []

        # Check profile completion
        if user.profile_completion_percentage < 80:
            recommendations.append(
                {
                    "type": "profile",
                    "message": "Complete your profile to increase credibility",
                    "priority": "high",
                }
            )

        # Check property photos
        properties_without_primary = user.owned_properties.filter(
            images__is_primary=False
        )
        if properties_without_primary.exists():
            recommendations.append(
                {
                    "type": "property",
                    "message": "Add primary photos to your properties",
                    "priority": "medium",
                }
            )

        # Check promotion opportunities
        if user.owned_properties.filter(
            is_promoted=False, created_at__lte=timezone.now() - timedelta(days=7)
        ).exists():
            recommendations.append(
                {
                    "type": "promotion",
                    "message": "Consider promoting older listings",
                    "priority": "low",
                }
            )

        return recommendations

    def get_user_market_insights(self, user):
        """Get market insights relevant to user"""
        # Get user's property locations
        user_cities = user.owned_properties.values_list("city", flat=True).distinct()

        insights = []

        for city_id in user_cities:
            city = City.objects.filter(id=city_id).first()
            if city:
                city_properties = Property.objects.filter(city=city, is_active=True)

                if city_properties.exists():
                    avg_price = (
                        city_properties.aggregate(avg=Avg("price_etb"))["avg"] or 0
                    )
                    user_avg = (
                        user.owned_properties.filter(city=city).aggregate(
                            avg=Avg("price_etb")
                        )["avg"]
                        or 0
                    )

                    price_comparison = "at market rate"
                    if user_avg > avg_price * 1.1:
                        price_comparison = "above market rate"
                    elif user_avg < avg_price * 0.9:
                        price_comparison = "below market rate"

                    insights.append(
                        {
                            "city": city.name,
                            "market_avg_price": avg_price,
                            "user_avg_price": user_avg,
                            "price_comparison": price_comparison,
                            "demand_level": self.calculate_city_demand_level(city),
                        }
                    )

        return insights

    def calculate_city_demand_level(self, city):
        """Calculate demand level for a city"""
        properties = Property.objects.filter(city=city, is_active=True)

        if not properties.exists():
            return "Low"

        avg_views = properties.aggregate(avg=Avg("views_count"))["avg"] or 0

        if avg_views > 100:
            return "High"
        elif avg_views > 50:
            return "Medium"
        else:
            return "Low"


class AnalyticsExportView(generics.GenericAPIView):
    """Export analytics data"""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        export_type = request.query_params.get("type", "market")
        format_type = request.query_params.get("format", "csv")

        if export_type == "market":
            return self.export_market_data(format_type)
        elif export_type == "users":
            return self.export_user_data(format_type)
        elif export_type == "properties":
            return self.export_property_data(format_type)
        elif export_type == "transactions":
            return self.export_transaction_data(format_type)
        else:
            return Response(
                {"error": "Invalid export type"}, status=status.HTTP_400_BAD_REQUEST
            )

    def export_market_data(self, format_type):
        """Export market data"""
        trends = MarketTrend.objects.all().order_by("-date")[:100]

        if format_type == "csv":
            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = 'attachment; filename="market_trends.csv"'

            writer = csv.writer(response)
            writer.writerow(
                [
                    "Date",
                    "Total Listings",
                    "Active Listings",
                    "New Listings",
                    "Sold Listings",
                    "Rented Listings",
                    "Average Price",
                    "Price Change Daily",
                    "Price Change Weekly",
                    "Price Change Monthly",
                    "Total Views",
                    "Total Inquiries",
                ]
            )

            for trend in trends:
                writer.writerow(
                    [
                        trend.date,
                        trend.total_listings,
                        trend.active_listings,
                        trend.new_listings,
                        trend.sold_listings,
                        trend.rented_listings,
                        trend.average_price,
                        trend.price_change_daily,
                        trend.price_change_weekly,
                        trend.price_change_monthly,
                        trend.total_views,
                        trend.total_inquiries,
                    ]
                )

            return response
        else:
            # JSON format
            serializer = MarketTrendSerializer(trends, many=True)
            return Response(serializer.data)

    def export_user_data(self, format_type):
        """Export user analytics data"""
        users = CustomUser.objects.all().order_by("-created_at")

        if format_type == "csv":
            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = (
                'attachment; filename="user_analytics.csv"'
            )

            writer = csv.writer(response)
            writer.writerow(
                [
                    "Email",
                    "User Type",
                    "Joined Date",
                    "Last Activity",
                    "Total Logins",
                    "Properties Viewed",
                    "Properties Saved",
                    "Inquiries Sent",
                    "Properties Listed",
                    "Profile Completion %",
                ]
            )

            for user in users:
                writer.writerow(
                    [
                        user.email,
                        user.user_type,
                        user.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                        (
                            user.last_activity.strftime("%Y-%m-%d %H:%M:%S")
                            if user.last_activity
                            else ""
                        ),
                        user.total_logins,
                        user.total_properties_viewed,
                        user.total_properties_saved,
                        user.total_inquiries_sent,
                        user.owned_properties.count(),
                        user.profile_completion_percentage,
                    ]
                )

            return response
        else:
            # Return summary data for JSON
            summary = {
                "total_users": users.count(),
                "active_users": users.filter(
                    last_activity__gte=timezone.now() - timedelta(days=7)
                ).count(),
                "user_types": list(
                    users.values("user_type").annotate(count=Count("id"))
                ),
                "growth_rate": self.calculate_user_growth_rate(),
            }
            return Response(summary)

    def export_property_data(self, format_type):
        """Export property analytics data"""
        properties = Property.objects.all().select_related("city", "sub_city")

        if format_type == "csv":
            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = (
                'attachment; filename="property_analytics.csv"'
            )

            writer = csv.writer(response)
            writer.writerow(
                [
                    "Title",
                    "Property Type",
                    "Listing Type",
                    "City",
                    "Sub City",
                    "Price (ETB)",
                    "Monthly Rent",
                    "Bedrooms",
                    "Bathrooms",
                    "Area (m²)",
                    "Views",
                    "Inquiries",
                    "Status",
                    "Featured",
                    "Verified",
                    "Promoted",
                    "Created Date",
                    "Days on Market",
                ]
            )

            for prop in properties:
                writer.writerow(
                    [
                        prop.title,
                        prop.property_type,
                        prop.listing_type,
                        prop.city.name if prop.city else "",
                        prop.sub_city.name if prop.sub_city else "",
                        prop.price_etb,
                        prop.monthly_rent,
                        prop.bedrooms,
                        prop.bathrooms,
                        prop.total_area,
                        prop.views_count,
                        prop.inquiry_count,
                        prop.property_status,
                        "Yes" if prop.is_featured else "No",
                        "Yes" if prop.is_verified else "No",
                        "Yes" if prop.is_promoted else "No",
                        prop.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                        prop.days_on_market,
                    ]
                )

            return response
        else:
            # Return summary for JSON
            summary = {
                "total_properties": properties.count(),
                "active_properties": properties.filter(is_active=True).count(),
                "property_type_distribution": list(
                    properties.values("property_type").annotate(count=Count("id"))
                ),
                "listing_type_distribution": list(
                    properties.values("listing_type").annotate(count=Count("id"))
                ),
                "status_distribution": list(
                    properties.values("property_status").annotate(count=Count("id"))
                ),
                "avg_price": properties.aggregate(avg=Avg("price_etb"))["avg"] or 0,
                "avg_views": properties.aggregate(avg=Avg("views_count"))["avg"] or 0,
            }
            return Response(summary)

    def export_transaction_data(self, format_type):
        """Export transaction/payment data"""
        payments = Payment.objects.all().select_related("user")

        if format_type == "csv":
            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = (
                'attachment; filename="transaction_analytics.csv"'
            )

            writer = csv.writer(response)
            writer.writerow(
                [
                    "Payment ID",
                    "User Email",
                    "Amount (ETB)",
                    "Payment Method",
                    "Status",
                    "Transaction ID",
                    "Chapa Reference",
                    "Created Date",
                    "Paid Date",
                    "Promotion ID",
                ]
            )

            for payment in payments:
                writer.writerow(
                    [
                        payment.id,
                        payment.user.email if payment.user else "",
                        payment.amount_etb,
                        payment.payment_method,
                        payment.status,
                        payment.transaction_id,
                        payment.chapa_reference,
                        payment.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                        (
                            payment.paid_at.strftime("%Y-%m-%d %H:%M:%S")
                            if payment.paid_at
                            else ""
                        ),
                        payment.promotion.id if payment.promotion else "",
                    ]
                )

            return response
        else:
            # Return summary for JSON
            summary = {
                "total_transactions": payments.count(),
                "completed_transactions": payments.filter(status="completed").count(),
                "total_revenue": payments.filter(status="completed").aggregate(
                    total=Sum("amount_etb")
                )["total"]
                or 0,
                "avg_transaction_value": payments.filter(status="completed").aggregate(
                    avg=Avg("amount_etb")
                )["avg"]
                or 0,
                "status_distribution": list(
                    payments.values("status").annotate(count=Count("id"))
                ),
                "revenue_by_month": self.get_revenue_by_month(),
            }
            return Response(summary)

    def calculate_user_growth_rate(self):
        """Calculate user growth rate"""
        today = timezone.now().date()
        month_ago = today - timedelta(days=30)

        users_month_ago = CustomUser.objects.filter(
            created_at__date__lte=month_ago
        ).count()
        users_today = CustomUser.objects.filter(created_at__date__lte=today).count()

        if users_month_ago > 0:
            return ((users_today - users_month_ago) / users_month_ago) * 100
        return 0

    def get_revenue_by_month(self):
        """Get revenue breakdown by month"""
        from django.db.models.functions import TruncMonth

        revenue_by_month = (
            Payment.objects.filter(status="completed")
            .annotate(month=TruncMonth("paid_at"))
            .values("month")
            .annotate(total_revenue=Sum("amount_etb"), transaction_count=Count("id"))
            .order_by("-month")[:12]
        )

        return list(revenue_by_month)


from users.models import CustomUser  # Make sure this import is at the top


class PlatformMetricsView(generics.GenericAPIView):
    """
    Platform metrics endpoint for system monitoring
    Returns server health, performance, and usage metrics
    """

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        period = request.query_params.get("period", "30d")

        try:
            # Get system metrics
            memory = psutil.virtual_memory()
            cpu_percent = psutil.cpu_percent(interval=1)
            disk_usage = psutil.disk_usage("/")

            # Get database connection info
            with connection.cursor() as cursor:
                cursor.execute("SHOW STATUS LIKE 'Threads_connected'")
                db_connections = cursor.fetchone()[1] if cursor.rowcount > 0 else 0

            # Calculate uptime (simplified - would need proper tracking)
            import datetime

            uptime_seconds = psutil.boot_time()
            uptime_days = (datetime.datetime.now().timestamp() - uptime_seconds) / (
                24 * 3600
            )

            # Get active user sessions (simplified)
            from django.contrib.sessions.models import Session
            from django.utils import timezone

            active_sessions = Session.objects.filter(
                expire_date__gt=timezone.now()
            ).count()

            # Calculate error rate from logs (simplified)
            # In production, you'd parse actual error logs
            error_rate = 0.1

            # Get application metrics - FIXED: Use CustomUser instead of User
            total_users = (
                CustomUser.objects.count()
            )  # Changed from User.objects.count()
            total_properties = Property.objects.count()
            active_properties = Property.objects.filter(is_active=True).count()

            # Calculate response time (simplified - would need actual tracking)
            response_time = 250  # ms average

            metrics = {
                "system": {
                    "uptime_days": round(uptime_days, 2),
                    "uptime_percentage": 99.9,
                    "cpu_usage_percent": cpu_percent,
                    "memory_usage_percent": memory.percent,
                    "memory_used_mb": round(memory.used / (1024 * 1024), 2),
                    "memory_total_mb": round(memory.total / (1024 * 1024), 2),
                    "disk_usage_percent": disk_usage.percent,
                    "disk_used_gb": round(disk_usage.used / (1024 * 1024 * 1024), 2),
                    "disk_total_gb": round(disk_usage.total / (1024 * 1024 * 1024), 2),
                    "os": platform.system(),
                    "python_version": platform.python_version(),
                    "django_version": "4.2",  # Replace with actual version
                },
                "database": {
                    "connections": int(db_connections),
                    "name": connection.vendor,
                    "version": "Unknown",  # You can get actual version
                    "size_mb": self.get_database_size(),
                },
                "application": {
                    "active_sessions": active_sessions,
                    "concurrent_users": active_sessions,  # Simplified
                    "total_users": total_users,
                    "active_users_last_24h": CustomUser.objects.filter(  # Changed from User
                        last_login__gte=timezone.now() - timedelta(days=1)
                    ).count(),
                    "total_properties": total_properties,
                    "active_properties": active_properties,
                    "response_time_ms": response_time,
                    "error_rate_percent": error_rate,
                    "requests_per_minute": 0,  # Would need tracking
                },
                "performance": {
                    "average_response_time": response_time,
                    "p95_response_time": response_time * 1.5,
                    "p99_response_time": response_time * 2,
                    "requests_per_second": 0,
                    "throughput": 0,
                },
                "alerts": self.get_system_alerts(),
                "metadata": {
                    "timestamp": timezone.now().isoformat(),
                    "period": period,
                    "report_interval": "realtime",
                    "data_source": "System Monitoring",
                },
            }

            return Response(metrics)

        except Exception as e:
            # Fallback metrics if psutil or other imports fail
            return Response(
                {
                    "system": {
                        "uptime_days": 30,
                        "uptime_percentage": 99.9,
                        "cpu_usage_percent": 25,
                        "memory_usage_percent": 45,
                        "memory_used_mb": 512,
                        "memory_total_mb": 2048,
                        "os": "Linux",
                        "python_version": "3.11",
                        "django_version": "4.2",
                    },
                    "database": {
                        "connections": 5,
                        "name": "postgresql",
                    },
                    "application": {
                        "active_sessions": 10,
                        "total_users": CustomUser.objects.count(),  # Changed from User
                        "total_properties": Property.objects.count(),
                        "response_time_ms": 250,
                        "error_rate_percent": 0.1,
                    },
                    "metadata": {
                        "timestamp": timezone.now().isoformat(),
                        "note": "Fallback metrics - system monitoring not available",
                        "error": str(e),
                    },
                }
            )

    def get_database_size(self):
        """Get approximate database size"""
        try:
            if connection.vendor == "postgresql":
                with connection.cursor() as cursor:
                    cursor.execute("SELECT pg_database_size(current_database())")
                    size_bytes = cursor.fetchone()[0]
                    return round(size_bytes / (1024 * 1024), 2)  # MB
            elif connection.vendor == "sqlite":
                import os

                db_path = connection.settings_dict["NAME"]
                if os.path.exists(db_path):
                    size_bytes = os.path.getsize(db_path)
                    return round(size_bytes / (1024 * 1024), 2)  # MB
            return 0
        except:
            return 0

    def get_system_alerts(self):
        """Get system alerts based on thresholds"""
        alerts = []

        try:
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage("/")

            if memory.percent > 90:
                alerts.append(
                    {
                        "type": "warning",
                        "message": "High memory usage",
                        "metric": "memory",
                        "value": f"{memory.percent}%",
                    }
                )

            if disk.percent > 85:
                alerts.append(
                    {
                        "type": "warning",
                        "message": "High disk usage",
                        "metric": "disk",
                        "value": f"{disk.percent}%",
                    }
                )

            # Check for recent errors in logs (simplified)
            # In production, you'd parse actual error logs

        except:
            pass

        return alerts


class UserAnalyticsView(generics.GenericAPIView):
    """User-specific analytics - COMPLETE FIX"""

    permission_classes = [IsAuthenticated]

    def get(self, request, user_id=None):
        if user_id and request.user.is_admin_user:
            user = get_object_or_404(CustomUser, id=user_id)
        else:
            user = request.user

        # Get user's properties
        user_properties = user.owned_properties.all()

        # Calculate today's metrics
        from datetime import datetime, time

        today_start = timezone.make_aware(
            datetime.combine(timezone.now().date(), time.min)
        )
        today_end = timezone.make_aware(
            datetime.combine(timezone.now().date(), time.max)
        )

        print(f"DEBUG: User ID: {user.id}")
        print(f"DEBUG: User email: {user.email}")
        print(f"DEBUG: User properties count: {user_properties.count()}")

        # FIX: Try BOTH methods to find inquiries
        # Method 1: property__owner (direct relationship)
        total_inquiries_method1 = Inquiry.objects.filter(property__owner=user).count()

        # Method 2: property_id in user's properties
        user_property_ids = list(user_properties.values_list("id", flat=True))
        total_inquiries_method2 = 0
        if user_property_ids:
            total_inquiries_method2 = Inquiry.objects.filter(
                property_id__in=user_property_ids
            ).count()

        # Use whichever method gives us results
        total_inquiries = max(total_inquiries_method1, total_inquiries_method2)

        print(f"DEBUG: Method 1 (property__owner) inquiries: {total_inquiries_method1}")
        print(f"DEBUG: Method 2 (property_id__in) inquiries: {total_inquiries_method2}")
        print(f"DEBUG: Using total inquiries: {total_inquiries}")

        # Today's inquiries
        today_inquiries = Inquiry.objects.filter(
            property__owner=user, created_at__gte=today_start, created_at__lte=today_end
        ).count()

        # Total and today's views
        total_views = user_properties.aggregate(total=Sum("views_count"))["total"] or 0

        today_views = PropertyView.objects.filter(
            property__owner=user, viewed_at__gte=today_start, viewed_at__lte=today_end
        ).count()

        # Debug: List all properties with details
        print(f"DEBUG: Properties owned by user:")
        for prop in user_properties:
            prop_inquiry_count = prop.inquiries.count()
            print(
                f"  - Property {prop.id}: '{prop.title}', inquiries: {prop_inquiry_count}"
            )

        data = {
            "user_info": {
                "id": user.id,
                "email": user.email,
                "full_name": user.get_full_name(),
                "user_type": user.user_type,
                "joined_date": user.created_at,
                "last_activity": user.last_activity,
            },
            "property_stats": {
                "total_listed": user_properties.count(),
                "active": user_properties.filter(is_active=True).count(),
                "sold": user_properties.filter(property_status="sold").count(),
                "rented": user_properties.filter(property_status="rented").count(),
                "featured": user_properties.filter(is_featured=True).count(),
                "promoted": user_properties.filter(is_promoted=True).count(),
            },
            "engagement_stats": {
                "total_logins": user.total_logins,
                "properties_viewed": user.total_properties_viewed,
                "properties_saved": user.total_properties_saved,
                "inquiries_sent": user.total_inquiries_sent,
                "searches_performed": user.total_searches,
            },
            "performance_metrics": {
                "total_views": total_views,
                "today_views": today_views,
                "total_inquiries": total_inquiries,
                "today_inquiries": today_inquiries,
                "avg_response_time": self.calculate_avg_response_time(user),
                "conversion_rate": self.calculate_conversion_rate(
                    total_views, total_inquiries
                ),
            },
            "recent_activity": self.get_recent_activity(user),
            "recommendations": self.get_recommendations(user),
            "debug_info": {  # Added for debugging
                "property_ids": user_property_ids,
                "inquiries_method1": total_inquiries_method1,
                "inquiries_method2": total_inquiries_method2,
                "properties_with_inquiries": [
                    {
                        "id": prop.id,
                        "title": prop.title,
                        "inquiry_count": prop.inquiries.count(),
                    }
                    for prop in user_properties
                    if prop.inquiries.count() > 0
                ],
            },
        }

        return Response(data)

    def calculate_conversion_rate(self, total_views, total_inquiries):
        """Calculate view to inquiry conversion rate"""
        if total_views > 0 and total_inquiries > 0:
            return (total_inquiries / total_views) * 100
        return 0.0

    def calculate_avg_response_time(self, user):
        """Calculate average response time to inquiries"""
        user_inquiries = Inquiry.objects.filter(
            property__owner=user, responded_at__isnull=False
        )

        if not user_inquiries.exists():
            return 0

        total_seconds = 0
        count = 0

        for inquiry in user_inquiries:
            if inquiry.created_at and inquiry.responded_at:
                response_time = (
                    inquiry.responded_at - inquiry.created_at
                ).total_seconds()
                total_seconds += response_time
                count += 1

        if count == 0:
            return 0

        avg_seconds = total_seconds / count
        return round(avg_seconds * 1000, 2)  # Convert to milliseconds

    def get_recent_activity(self, user):
        """Get user's recent activity - ADDED MISSING METHOD"""
        try:
            # Check if user has activities relationship
            if hasattr(user, "activities"):
                recent_activity = user.activities.all().order_by("-created_at")[:10]

                return [
                    {
                        "type": activity.activity_type,
                        "description": self.get_activity_display(
                            activity.activity_type
                        ),
                        "timestamp": activity.created_at,
                        "metadata": activity.metadata,
                    }
                    for activity in recent_activity
                ]
            else:
                # Fallback if activities don't exist
                return []
        except Exception as e:
            print(f"DEBUG: Error getting recent activity: {e}")
            return []

    def get_activity_display(self, activity_type):
        """Convert activity_type to display text"""
        activity_map = {
            "login": "User Logged In",
            "logout": "User Logged Out",
            "profile_update": "Profile Updated",
            "property_view": "Property Viewed",
            "property_save": "Property Saved",
            "property_add": "Property Added",
            "property_edit": "Property Edited",
            "inquiry_created": "Inquiry Created",
            "inquiry_response": "Inquiry Response Sent",
            "password_change": "Password Changed",
            "search": "Property Search",
            "promotion_purchase": "Promotion Purchased",
        }
        return activity_map.get(activity_type, activity_type.replace("_", " ").title())

    def get_recommendations(self, user):
        """Get personalized recommendations - ADDED MISSING METHOD"""
        recommendations = []

        # Check profile completion
        if (
            hasattr(user, "profile_completion_percentage")
            and user.profile_completion_percentage < 80
        ):
            recommendations.append(
                {
                    "type": "profile_completion",
                    "message": "Complete your profile to increase credibility",
                    "priority": "high",
                    "action_url": "/profile/edit",
                }
            )

        # Check for properties without photos
        properties_without_photos = user.owned_properties.filter(images__isnull=True)
        if properties_without_photos.exists():
            recommendations.append(
                {
                    "type": "property_photos",
                    "message": f"Add photos to {properties_without_photos.count()} properties without images",
                    "priority": "medium",
                    "action_url": "/my-properties",
                }
            )

        # Check for properties that are not promoted
        non_promoted_properties = user.owned_properties.filter(
            is_promoted=False, is_active=True
        )
        if non_promoted_properties.exists():
            recommendations.append(
                {
                    "type": "promotion",
                    "message": f"Consider promoting {non_promoted_properties.count()} active properties",
                    "priority": "low",
                    "action_url": "/my-properties",
                }
            )

        return recommendations


class AdminUserAnalyticsView(generics.GenericAPIView):
    """Admin view for all users analytics"""

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Get all users with their analytics
        users = CustomUser.objects.all()

        # Get time range filter
        days = int(request.query_params.get("days", 30))
        date_from = timezone.now() - timedelta(days=days)

        user_analytics = []
        for user in users:
            # Get user's properties
            user_properties = user.owned_properties.all()

            # Calculate metrics
            total_inquiries = Inquiry.objects.filter(property__owner=user).count()

            total_views = (
                user_properties.aggregate(total=Sum("views_count"))["total"] or 0
            )

            # Recent inquiries (last 30 days)
            recent_inquiries = Inquiry.objects.filter(
                property__owner=user, created_at__gte=date_from
            ).count()

            user_analytics.append(
                {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.get_full_name(),
                    "user_type": user.user_type,
                    "joined_date": user.created_at,
                    "last_activity": user.last_activity,
                    "total_properties": user_properties.count(),
                    "active_properties": user_properties.filter(is_active=True).count(),
                    "total_views": total_views,
                    "total_inquiries": total_inquiries,
                    "recent_inquiries": recent_inquiries,
                    "conversion_rate": (
                        (total_inquiries / total_views * 100) if total_views > 0 else 0
                    ),
                    "is_active_today": (
                        user.last_activity.date() == timezone.now().date()
                        if user.last_activity
                        else False
                    ),
                }
            )

        # Sort by total inquiries (most active users first)
        user_analytics.sort(key=lambda x: x["total_inquiries"], reverse=True)

        # Calculate platform totals
        platform_totals = {
            "total_users": users.count(),
            "total_properties": Property.objects.count(),
            "total_views": Property.objects.aggregate(total=Sum("views_count"))["total"]
            or 0,
            "total_inquiries": Inquiry.objects.count(),
            "active_users_today": CustomUser.objects.filter(
                last_activity__date=timezone.now().date()
            ).count(),
            "new_users_today": CustomUser.objects.filter(
                created_at__date=timezone.now().date()
            ).count(),
        }

        return Response(
            {
                "users": user_analytics,
                "platform_totals": platform_totals,
                "time_period": {
                    "days": days,
                    "date_from": date_from.date().isoformat(),
                    "date_to": timezone.now().date().isoformat(),
                },
            }
        )


class UserGrowthView(APIView):
    """User growth analytics endpoint - TIMEZONE FIXED"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        date_from = timezone.now() - timedelta(days=days)

        user_growth_data = []

        # Get initial cumulative users (users created before the period)
        initial_cumulative = CustomUser.objects.filter(
            created_at__lt=date_from  # Use the datetime object directly, not .date()
        ).count()

        cumulative_users = initial_cumulative

        print(
            f"DEBUG: Initial cumulative users before {date_from.date()}: {initial_cumulative}"
        )

        # For each day in the range
        for i in range(days + 1):
            current_date = (date_from + timedelta(days=i)).date()

            # Create timezone-aware datetime for the start and end of the day
            day_start = timezone.make_aware(datetime.combine(current_date, time.min))
            day_end = timezone.make_aware(datetime.combine(current_date, time.max))

            print(f"DEBUG: Processing day {current_date} from {day_start} to {day_end}")

            # Count new users for this day - using timezone-aware range
            new_users = CustomUser.objects.filter(
                created_at__gte=day_start, created_at__lte=day_end
            ).count()

            print(f"DEBUG: New users on {current_date}: {new_users}")

            # Count active users - using timezone-aware range
            active_users = (
                CustomUser.objects.filter(
                    Q(last_login__gte=day_start, last_login__lte=day_end)
                    | Q(last_activity__gte=day_start, last_activity__lte=day_end)
                )
                .distinct()
                .count()
            )

            print(f"DEBUG: Active users on {current_date}: {active_users}")

            # Update cumulative total
            cumulative_users += new_users

            # Calculate daily growth rate
            previous_day_users = CustomUser.objects.filter(
                created_at__lt=day_start
            ).count()

            growth_rate = 0
            if previous_day_users > 0 and cumulative_users > previous_day_users:
                growth_rate = (
                    (cumulative_users - previous_day_users) / previous_day_users
                ) * 100

            user_growth_data.append(
                {
                    "date": current_date.isoformat(),
                    "new_users": new_users,
                    "active_users": active_users,
                    "cumulative_users": cumulative_users,
                    "growth_rate": round(growth_rate, 2),
                    "previous_day_users": previous_day_users,
                    "day_start": day_start.isoformat(),
                    "day_end": day_end.isoformat(),
                }
            )

        # Add summary
        summary = {
            "total_users": CustomUser.objects.count(),
            "period_start": date_from.date().isoformat(),
            "period_end": timezone.now().date().isoformat(),
            "days_analyzed": days + 1,
            "total_new_in_period": cumulative_users - initial_cumulative,
            "average_daily_growth": (
                sum(item["new_users"] for item in user_growth_data)
                / len(user_growth_data)
                if user_growth_data
                else 0
            ),
        }

        return Response({"data": user_growth_data, "summary": summary})


class DailyActivityView(APIView):
    """Daily user activity analytics - TIMEZONE FIXED"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from real_estate.models import PropertyView, Inquiry, Property
        from users.models import UserActivity
        from datetime import datetime, time

        days = int(request.query_params.get("days", 30))
        date_from = timezone.now() - timedelta(days=days)

        daily_activity_data = []

        # For each day in the range
        for i in range(days + 1):
            current_date = (date_from + timedelta(days=i)).date()

            # Create timezone-aware datetime for the start and end of the day
            day_start = timezone.make_aware(datetime.combine(current_date, time.min))
            day_end = timezone.make_aware(datetime.combine(current_date, time.max))

            print(f"DEBUG: Processing day {current_date} from {day_start} to {day_end}")

            # Count user activities for this day - using timezone-aware range
            activities = UserActivity.objects.filter(
                created_at__gte=day_start, created_at__lte=day_end
            )

            # Count different types of activities
            page_views = activities.filter(activity_type="property_view").count()
            searches = activities.filter(activity_type="search").count()
            inquiries = activities.filter(activity_type="inquiry_created").count()
            properties_listed = activities.filter(activity_type="property_add").count()

            print(f"DEBUG: Activities on {current_date}: {activities.count()}")

            # Count active users for this day - using timezone-aware range
            active_users = (
                CustomUser.objects.filter(
                    Q(last_login__gte=day_start, last_login__lte=day_end)
                    | Q(last_activity__gte=day_start, last_activity__lte=day_end)
                )
                .distinct()
                .count()
            )

            # Count new users for this day - using timezone-aware range
            new_users = CustomUser.objects.filter(
                created_at__gte=day_start, created_at__lte=day_end
            ).count()

            # Count property views for this day - using timezone-aware range
            property_views = PropertyView.objects.filter(
                viewed_at__gte=day_start, viewed_at__lte=day_end
            ).count()

            # Count inquiries for this day - using timezone-aware range
            daily_inquiries = Inquiry.objects.filter(
                created_at__gte=day_start, created_at__lte=day_end
            ).count()

            # Count properties listed today - using timezone-aware range
            properties_listed_direct = Property.objects.filter(
                created_at__gte=day_start, created_at__lte=day_end, is_active=True
            ).count()

            # Use direct count if activity count is 0
            if properties_listed == 0 and properties_listed_direct > 0:
                properties_listed = properties_listed_direct

            daily_activity_data.append(
                {
                    "date": current_date.isoformat(),
                    "active_users": active_users,
                    "new_users": new_users,
                    "page_views": page_views,
                    "searches": searches,
                    "inquiries": inquiries,
                    "properties_listed": properties_listed,
                    "property_views": property_views,
                    "daily_inquiries": daily_inquiries,
                    "debug_info": {
                        "day_start": day_start.isoformat(),
                        "day_end": day_end.isoformat(),
                        "total_activities": activities.count(),
                        "properties_listed_direct": properties_listed_direct,
                    },
                }
            )

        # Add summary
        summary = {
            "total_days": len(daily_activity_data),
            "period_start": date_from.date().isoformat(),
            "period_end": timezone.now().date().isoformat(),
            "total_new_users": sum(item["new_users"] for item in daily_activity_data),
            "total_active_users": sum(
                item["active_users"] for item in daily_activity_data
            ),
            "total_property_views": sum(
                item["property_views"] for item in daily_activity_data
            ),
            "total_daily_inquiries": sum(
                item["daily_inquiries"] for item in daily_activity_data
            ),
        }

        return Response({"data": daily_activity_data, "summary": summary})


class PlatformAnalyticsView(APIView):
    """Platform-wide analytics summary"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get("period", "30d")

        # Calculate days based on period
        if period == "7d":
            days = 7
        elif period == "90d":
            days = 90
        elif period == "365d":
            days = 365
        else:
            days = 30

        date_from = timezone.now() - timedelta(days=days)

        # Calculate user metrics
        total_users = CustomUser.objects.count()
        new_users = CustomUser.objects.filter(created_at__gte=date_from).count()

        # Active users (users with activity in the last 7 days)
        active_users = CustomUser.objects.filter(
            last_activity__gte=timezone.now() - timedelta(days=7)
        ).count()

        # User growth rate
        previous_period_start = date_from - timedelta(days=days)
        users_previous_period = CustomUser.objects.filter(
            created_at__gte=previous_period_start, created_at__lt=date_from
        ).count()

        user_growth_rate = 0
        if users_previous_period > 0:
            user_growth_rate = (
                (new_users - users_previous_period) / users_previous_period
            ) * 100

        # Property metrics
        total_properties = Property.objects.count()
        verified_properties = Property.objects.filter(is_verified=True).count()
        featured_properties = Property.objects.filter(is_featured=True).count()
        promoted_properties = Property.objects.filter(is_promoted=True).count()

        # Engagement metrics (simplified - you'd want to use actual analytics)
        total_page_views = (
            Property.objects.aggregate(total=Sum("views_count"))["total"] or 0
        )

        # Average session duration (placeholder - integrate with actual analytics)
        avg_session_duration = 185  # seconds

        # Bounce rate (placeholder)
        bounce_rate = 32.5

        # Transaction metrics
        total_inquiries = (
            Property.objects.aggregate(total=Sum("inquiry_count"))["total"] or 0
        )

        successful_contacts = int(
            total_inquiries * 0.6
        )  # 60% conversion rate (placeholder)

        # Revenue metrics
        total_promotions = promoted_properties
        total_revenue = (
            Payment.objects.filter(status="completed").aggregate(
                total=Sum("amount_etb")
            )["total"]
            or 0
        )

        # Performance metrics (placeholders)
        api_response_time = 245  # ms
        error_rate = 0.8  # percentage
        server_uptime = 99.7  # percentage

        data = {
            "date": timezone.now().date().isoformat(),
            "total_users": total_users,
            "new_users": new_users,
            "active_users": active_users,
            "user_growth_rate": user_growth_rate,
            "total_properties": total_properties,
            "verified_properties": verified_properties,
            "featured_properties": featured_properties,
            "promoted_properties": promoted_properties,
            "total_page_views": total_page_views,
            "avg_session_duration": avg_session_duration,
            "bounce_rate": bounce_rate,
            "total_inquiries": total_inquiries,
            "successful_contacts": successful_contacts,
            "total_promotions": total_promotions,
            "total_revenue": total_revenue,
            "api_response_time": api_response_time,
            "error_rate": error_rate,
            "server_uptime": server_uptime,
            "_source": "django-backend",
            "_timestamp": timezone.now().isoformat(),
        }

        return Response(data)
