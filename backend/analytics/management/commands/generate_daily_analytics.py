from django.core.management.base import BaseCommand
from django.utils import timezone
from analytics.models import MarketTrend, PlatformAnalytics
from real_estate.models import Property
from users.models import CustomUser
from subscriptions.models import Payment
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Generate daily analytics reports'
    
    def handle(self, *args, **options):
        self.stdout.write('Generating daily analytics...')
        
        try:
            # Generate market trend
            market_trend = MarketTrend.generate_daily_trend()
            self.stdout.write(f'✓ Market trend generated for {market_trend.date}')
            
            # Generate platform analytics
            platform_analytics = self.generate_platform_analytics()
            self.stdout.write(f'✓ Platform analytics generated for {platform_analytics.date}')
            
            self.stdout.write(self.style.SUCCESS('Daily analytics generation completed successfully!'))
            
        except Exception as e:
            logger.error(f"Error generating daily analytics: {e}")
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
    
    def generate_platform_analytics(self):
        """Generate platform analytics for today"""
        today = timezone.now().date()
        
        # Check if already exists
        if PlatformAnalytics.objects.filter(date=today).exists():
            return PlatformAnalytics.objects.get(date=today)
        
        # Calculate metrics
        total_users = CustomUser.objects.count()
        new_users = CustomUser.objects.filter(created_at__date=today).count()
        
        active_users = CustomUser.objects.filter(
            last_activity__date=today
        ).count()
        
        total_properties = Property.objects.count()
        verified_properties = Property.objects.filter(is_verified=True).count()
        featured_properties = Property.objects.filter(is_featured=True).count()
        promoted_properties = Property.objects.filter(is_promoted=True).count()
        
        total_revenue = Payment.objects.filter(
            status='completed',
            paid_at__date=today
        ).aggregate(total=Sum('amount_etb'))['total'] or 0
        
        total_inquiries = Property.objects.filter(
            inquiries__created_at__date=today
        ).count()
        
        # Create platform analytics record
        analytics = PlatformAnalytics.objects.create(
            date=today,
            total_users=total_users,
            new_users=new_users,
            active_users=active_users,
            user_growth_rate=self.calculate_growth_rate('users'),
            total_properties=total_properties,
            verified_properties=verified_properties,
            featured_properties=featured_properties,
            promoted_properties=promoted_properties,
            total_inquiries=total_inquiries,
            total_revenue=total_revenue,
        )
        
        return analytics
    
    def calculate_growth_rate(self, metric_type):
        """Calculate growth rate for specific metric"""
        today = timezone.now().date()
        month_ago = today - timezone.timedelta(days=30)
        
        if metric_type == 'users':
            current = CustomUser.objects.filter(created_at__date__lte=today).count()
            previous = CustomUser.objects.filter(created_at__date__lte=month_ago).count()
        elif metric_type == 'properties':
            current = Property.objects.filter(created_at__date__lte=today).count()
            previous = Property.objects.filter(created_at__date__lte=month_ago).count()
        else:
            return 0
        
        if previous > 0:
            return ((current - previous) / previous) * 100
        return 0