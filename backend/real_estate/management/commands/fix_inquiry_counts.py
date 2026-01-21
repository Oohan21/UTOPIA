# property/management/commands/fix_inquiry_counts.py
from django.core.management.base import BaseCommand
from real_estate.models import Property  # Change to your app name
from django.db.models import Count

class Command(BaseCommand):
    help = 'Fix inquiry counts for all properties'
    
    def handle(self, *args, **kwargs):
        # Get all properties with their actual inquiry counts
        properties = Property.objects.annotate(
            actual_count=Count('inquiries')
        )
        
        fixed_count = 0
        for prop in properties:
            if prop.inquiry_count != prop.actual_count:
                old_count = prop.inquiry_count
                prop.inquiry_count = prop.actual_count
                prop.save(update_fields=['inquiry_count'])
                
                self.stdout.write(
                    f"Fixed property {prop.id}: {old_count} → {prop.inquiry_count}"
                )
                fixed_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ Fixed {fixed_count} properties')
        )