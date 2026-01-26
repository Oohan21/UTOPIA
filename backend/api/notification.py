from django.utils import timezone
from .models import Notification
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.conf import settings

try:
    # Prefer Celery if available and configured
    from .tasks import send_email_task
except Exception:
    def send_email_task(subject, message, from_email, recipient_list, fail_silently=True):
        from django.core.mail import send_mail
        return send_mail(subject, message, from_email, recipient_list, fail_silently=fail_silently)

User = get_user_model()


class NotificationService:
    """Service for creating and managing notifications"""
    
    @staticmethod
    def create_notification(user, notification_type, title, message, data=None, content_type=None, object_id=None):
        """Create a notification for a user"""
        try:
            # Resolve content_type to a ContentType instance if needed
            ct_instance = None
            try:
                from django.contrib.contenttypes.models import ContentType as CTModel
                if isinstance(content_type, CTModel):
                    ct_instance = content_type
                elif isinstance(content_type, str) and content_type:
                    # map common model names to real_estate app
                    mapping = {
                        'property': ('real_estate', 'property'),
                        'inquiry': ('real_estate', 'inquiry'),
                        'message': ('real_estate', 'message'),
                    }
                    if content_type in mapping:
                        app_label, model = mapping[content_type]
                        ct_instance = CTModel.objects.filter(app_label=app_label, model=model).first()

                # Get content type for Property model if not provided
                if ct_instance is None and content_type is None and object_id is not None:
                    try:
                        from real_estate.models import Property
                        if Property.objects.filter(id=object_id).exists():
                            ct_instance = CTModel.objects.get_for_model(Property)
                    except Exception:
                        ct_instance = None
            except Exception:
                ct_instance = None
            
            notification = Notification.objects.create(
                user=user,
                notification_type=notification_type,
                title=title,
                message=message,
                data=data or {},
                content_type=ct_instance,
                object_id=object_id,
                created_at=timezone.now()
            )
            # Mark as sent (in-app) and log audit
            try:
                notification.is_sent = True
                notification.sent_via = 'in_app'
                notification.sent_at = timezone.now()
                notification.save(update_fields=['is_sent', 'sent_via', 'sent_at'])
                from .models import AuditLog
                AuditLog.log_action(
                    user=user,
                    action_type='notification_send',
                    model_name='Notification',
                    object_id=str(notification.id),
                    object_repr=notification.title,
                    changes={'notification_type': notification.notification_type, 'object_id': object_id},
                )
            except Exception:
                pass
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

    @staticmethod
    def send_inquiry_notification(inquiry):
        """Send notification to property owner about new inquiry"""
        owner = inquiry.property.owner
        inquirer = inquiry.user
        
        # Avoid self-notification
        if owner == inquirer:
            return

        # 1. In-App Notification (use explicit 'new_inquiry' type)
        NotificationService.create_notification(
            user=owner,
            notification_type='new_inquiry',
            title='New Inquiry Received',
            message=f'You have a new inquiry about your property: {inquiry.property.title}',
            data={
                'inquiry_id': str(inquiry.id),
                'property_id': inquiry.property.id,
                'property_title': inquiry.property.title,
                'inquiry_type': inquiry.inquiry_type,
                'inquirer_name': inquiry.full_name or (inquirer.get_full_name() if inquirer else 'Anonymous'),
                'view_url': f"/owner/inquiries/{inquiry.id}",
                'respond_url': f"/owner/inquiries/{inquiry.id}?action=respond"
            },
            content_type='inquiry',
            object_id=str(inquiry.id)
        )

        # 2. Email Notification
        try:
            from .models import NotificationPreference
            prefs, _ = NotificationPreference.objects.get_or_create(user=owner)
            
            # Respect notification frequency and quiet hours
            prefs, _ = NotificationPreference.objects.get_or_create(user=owner)
            now = timezone.now().time()
            send_email_now = prefs.email_enabled and prefs.notification_frequency == 'immediate'
            # quiet hours enforcement
            try:
                if prefs.quiet_hours_start and prefs.quiet_hours_end:
                    start = prefs.quiet_hours_start
                    end = prefs.quiet_hours_end
                    if start < end:
                        in_quiet = start <= now <= end
                    else:
                        # overnight window (e.g., 22:00 - 06:00)
                        in_quiet = now >= start or now <= end
                    if in_quiet:
                        send_email_now = False
            except Exception:
                pass

            if send_email_now:
                try:
                    subject = f"New Inquiry: {inquiry.property.title}"
                    message = f"""
You have received a new inquiry for your property "{inquiry.property.title}".

From: {inquiry.full_name or (inquirer.get_full_name() if inquirer else 'Anonymous')}
Type: {inquiry.get_inquiry_type_display()}
Message: {inquiry.message}

Login to your dashboard to respond.
"""
                    # dispatch via task runner (Celery if configured)
                    send_email_task(subject, message, settings.DEFAULT_FROM_EMAIL, [owner.email], fail_silently=True)
                except Exception as e:
                    print(f"Failed to send inquiry email: {e}")
            else:
                # Record that email was deferred (for digest)
                try:
                    # Create a deferred Notification row so digest can pick it up
                    from .models import Notification, AuditLog
                    Notification.objects.create(
                        user=owner,
                        notification_type='new_inquiry',
                        title=f'New Inquiry: {inquiry.property.title}',
                        message=f'A new inquiry was received for {inquiry.property.title}',
                        data={
                            'inquiry_id': str(inquiry.id),
                            'property_id': inquiry.property.id,
                            'view_url': f"/owner/inquiries/{inquiry.id}"
                        },
                        content_type=None,
                        object_id=str(inquiry.id),
                        is_sent=False,
                        sent_via='email',
                        created_at=timezone.now()
                    )
                    AuditLog.log_action(
                        user=owner,
                        action_type='notification_send',
                        model_name='Notification',
                        object_id=str(inquiry.id),
                        object_repr='Inquiry email deferred for digest',
                        changes={'deferred_for_frequency': prefs.notification_frequency}
                    )
                except Exception:
                    pass
        except Exception as e:
            print(f"Failed to send inquiry email: {e}")

        # 3. Audit Log
        try:
            from .models import AuditLog
            AuditLog.log_action(
                user=inquirer,
                action_type='inquiry_create',
                model_name='Inquiry',
                object_id=str(inquiry.id),
                object_repr=f"Inquiry for {inquiry.property.title}",
                changes={'owner_notified': True}
            )
        except Exception as e:
            print(f"Failed to log audit: {e}")

    @staticmethod
    def send_inquiry_response_notification(inquiry, response_message):
        """Send notification to inquirer about owner response"""
        inquirer = inquiry.user
        owner = inquiry.property.owner
        
        # Handle anonymous user email notification
        if not inquirer:
            if inquiry.email:
                try:
                    from django.core.mail import send_mail

                    subject = f"Response to your inquiry: {inquiry.property.title}"
                    message = f"""
The property owner has responded to your inquiry about "{inquiry.property.title}".

Response:
{response_message}

Best regards,
Utopia Real Estate
"""
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [inquiry.email],
                        fail_silently=True
                    )
                except Exception as e:
                    print(f"Failed to send anonymous response email: {e}")
            return

        # 1. In-App Notification
        NotificationService.create_notification(
            user=inquirer,
            notification_type='inquiry_response',
            title='Response to your inquiry',
            message=f'{owner.first_name} responded to your inquiry about {inquiry.property.title}',
            data={
                'inquiry_id': str(inquiry.id),
                'property_title': inquiry.property.title,
                'response_preview': response_message[:100]
            },
            content_type='inquiry',
            object_id=str(inquiry.id)
        )

        # 2. Email Notification
        try:
            from .models import NotificationPreference
            prefs, _ = NotificationPreference.objects.get_or_create(user=inquirer)
            send_email_now = prefs.email_enabled and prefs.email_inquiry_response and prefs.notification_frequency == 'immediate'
            # quiet hours enforcement
            now = timezone.now().time()
            try:
                if prefs.quiet_hours_start and prefs.quiet_hours_end:
                    start = prefs.quiet_hours_start
                    end = prefs.quiet_hours_end
                    if start < end:
                        in_quiet = start <= now <= end
                    else:
                        in_quiet = now >= start or now <= end
                    if in_quiet:
                        send_email_now = False
            except Exception:
                pass

            if send_email_now:
                try:
                    subject = f"Response: {inquiry.property.title}"
                    message = f"""
You have a new response regarding your inquiry for "{inquiry.property.title}".

Message:
{response_message}

Login to view the full conversation.
"""
                    send_email_task(subject, message, settings.DEFAULT_FROM_EMAIL, [inquirer.email], fail_silently=True)
                except Exception as e:
                    print(f"Failed to send response email: {e}")
            else:
                try:
                    from .models import Notification, AuditLog
                    Notification.objects.create(
                        user=inquirer,
                        notification_type='inquiry_response',
                        title=f'Response: {inquiry.property.title}',
                        message=f'A response to your inquiry is available',
                        data={'inquiry_id': str(inquiry.id), 'property_id': inquiry.property.id},
                        content_type=None,
                        object_id=str(inquiry.id),
                        is_sent=False,
                        sent_via='email',
                        created_at=timezone.now()
                    )
                    AuditLog.log_action(
                        user=inquirer,
                        action_type='notification_send',
                        model_name='Notification',
                        object_id=str(inquiry.id),
                        object_repr='Response email deferred for digest',
                        changes={'deferred_for_frequency': prefs.notification_frequency}
                    )
                except Exception:
                    pass
        except Exception as e:
            print(f"Failed to send response email: {e}")
            
        # 3. Audit Log
        try:
            from .models import AuditLog
            AuditLog.log_action(
                user=owner,
                action_type='message_send',
                model_name='Inquiry',
                object_id=str(inquiry.id),
                object_repr=f"Response to inquiry for {inquiry.property.title}",
                changes={'inquirer_notified': True}
            )
        except Exception as e:
            print(f"Failed to log audit: {e}")

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