# management/commands/cleanup_messages.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from real_estate.models import Message, MessageThread

class Command(BaseCommand):
    help = 'Clean up old messages and threads'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=365,
            help='Delete messages older than this many days (default: 365)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )
    
    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Find old messages
        old_messages = Message.objects.filter(created_at__lt=cutoff_date)
        old_threads = MessageThread.objects.filter(
            updated_at__lt=cutoff_date,
            last_message__isnull=True
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would delete {old_messages.count()} messages '
                    f'and {old_threads.count()} threads older than {days} days'
                )
            )
        else:
            # Delete old messages
            messages_deleted, _ = old_messages.delete()
            
            # Delete empty old threads
            threads_deleted, _ = old_threads.delete()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully deleted {messages_deleted} messages '
                    f'and {threads_deleted} threads older than {days} days'
                )
            )