from django.utils import timezone
from .models import Notification
from django.contrib.auth import get_user_model
from django.db import transaction
from django.contrib.contenttypes.models import ContentType

User = get_user_model()


class NotificationService:
    """Service for creating and managing notifications"""
    
    @staticmethod
    def create_notification(user, notification_type, title, message, data=None, content_type=None, object_id=None):
        """Create a notification for a user"""
        try:
            # Get content type for Property model if not provided
            if content_type is None and object_id is not None:
                try:
                    from real_estate.models import Property
                    if Property.objects.filter(id=object_id).exists():
                        content_type = ContentType.objects.get_for_model(Property)
                except Exception:
                    content_type = None
            
            notification = Notification.objects.create(
                user=user,
                notification_type=notification_type,
                title=title,
                message=message,
                data=data or {},
                content_type=content_type,  
                object_id=object_id,        
                created_at=timezone.now()
            )
            return notification
        except Exception as e:
            print(f"Error creating notification: {e}")
            return None
    
    @staticmethod
    def create_property_approval_notification(property_obj, action, notes="", admin_user=None):
        """Create notification for property approval actions"""
        
        # Map action to notification type
        action_map = {
            'approve': 'property_approved',
            'reject': 'property_rejected',
            'request_changes': 'property_changes_requested'
        }
        
        notification_type = action_map.get(action, 'system')
        
        # Create title and message based on action
        if action == 'approve':
            title = "Property Listing Approved"
            message = f"Your property '{property_obj.title}' has been approved and is now live on the platform."
        elif action == 'reject':
            title = "Property Listing Rejected"
            message = f"Your property '{property_obj.title}' has been rejected. Reason: {notes}"
        elif action == 'request_changes':
            title = "Property Changes Requested"
            message = f"Changes requested for your property '{property_obj.title}'. Please review: {notes}"
        else:
            title = "Property Update"
            message = f"Update on your property '{property_obj.title}'"
        
        # Add notes if provided
        if notes:
            message += f"\n\nNotes: {notes}"
        
        # Prepare data
        data = {
            'property_id': property_obj.id,
            'property_title': property_obj.title,
            'action': action,
            'admin_user_id': admin_user.id if admin_user else None,
            'admin_name': admin_user.get_full_name() if admin_user else 'System',
            'notes': notes,
            'timestamp': timezone.now().isoformat(),
            'property_url': f"/listings/{property_obj.id}",
            'edit_url': f"/listings/{property_obj.id}/edit",
        }
        
        # Create notification
        notification = NotificationService.create_notification(
            user=property_obj.owner,
            notification_type=notification_type,
            title=title,
            message=message,
            data=data,
            content_type='property',  # Changed
            object_id=property_obj.id  # Changed
        )
        
        return notification
    
    @staticmethod
    def create_admin_notification(admin_user, property_obj, action):
        """Create notification for admin about property approval actions"""
        title = f"Property {action.capitalize()}"
        message = f"You {action}d property '{property_obj.title}'"
        
        return NotificationService.create_notification(
            user=admin_user,
            notification_type='system',
            title=title,
            message=message,
            data={
                'property_id': property_obj.id,
                'property_title': property_obj.title,
                'action': action,
                'owner_id': property_obj.owner.id,
                'owner_email': property_obj.owner.email
            }
        )
    
    @staticmethod
    def mark_as_read(notification_id, user):
        """Mark a notification as read"""
        try:
            notification = Notification.objects.get(id=notification_id, user=user)
            if not notification.is_read:
                notification.is_read = True
                notification.read_at = timezone.now()
                notification.save()
            return True
        except Notification.DoesNotExist:
            return False
    
    @staticmethod
    def mark_all_as_read(user):
        """Mark all notifications as read for a user"""
        updated = Notification.objects.filter(
            user=user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )
        return updated
    
    @staticmethod
    def get_unread_count(user):
        """Get count of unread notifications for a user"""
        return Notification.objects.filter(user=user, is_read=False).count()
    
    @staticmethod
    def get_user_notifications(user, limit=50, unread_only=False):
        """Get notifications for a user"""
        queryset = Notification.objects.filter(user=user)
        
        if unread_only:
            queryset = queryset.filter(is_read=False)
        
        return queryset.order_by('-created_at')[:limit]


# Signal handlers for property approval
from django.db.models.signals import post_save
from django.dispatch import receiver
from real_estate.models import Property

# In api/notification.py, update the signal handler:

@receiver(post_save, sender=Property)
def handle_property_approval(sender, instance, created, **kwargs):
    """Handle property approval status changes"""
    if not created and instance.pk:
        try:
            # Get original property from database
            original = Property.objects.get(pk=instance.pk)
            old_status = original.approval_status
            new_status = instance.approval_status
            
            # Only proceed if status actually changed
            if old_status != new_status:
                # Determine action based on new status
                action = None
                if new_status == 'approved':
                    action = 'approve'
                elif new_status == 'rejected':
                    action = 'reject'
                elif new_status == 'changes_requested':
                    action = 'request_changes'
                
                if action:
                    # Create notification
                    NotificationService.create_property_approval_notification(
                        property_obj=instance,
                        action=action,
                        notes=instance.approval_notes or '',
                        admin_user=instance.approved_by
                    )
        except Property.DoesNotExist:
            # Property doesn't exist in DB yet (shouldn't happen)
            pass
        except Exception as e:
            # Log error but don't crash
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in property approval signal: {e}")