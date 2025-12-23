from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Message, MessageThread, Inquiry
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Message)
def update_thread_on_message(sender, instance, created, **kwargs):
    """
    Update message thread when a new message is sent
    """
    if not created:
        return
    
    try:
        # Get or create thread for this message
        if not instance.thread_last_message:
            # Find existing thread with same participants and context
            thread_filters = Q(participants=instance.sender) & Q(participants=instance.receiver)
            
            if instance.property:
                thread_filters &= Q(property=instance.property)
            if instance.inquiry:
                thread_filters &= Q(inquiry=instance.inquiry)
            
            thread = MessageThread.objects.filter(thread_filters).first()
            
            if not thread:
                # Create new thread
                subject = instance.subject or f"Regarding {instance.property.title if instance.property else 'your inquiry'}"
                thread = MessageThread.objects.create(
                    subject=subject,
                    property=instance.property,
                    inquiry=instance.inquiry
                )
                thread.participants.add(instance.sender, instance.receiver)
            
            # Link message to thread
            instance.thread_last_message = thread
            instance.save(update_fields=['thread_last_message'])
        else:
            thread = instance.thread_last_message
        
        # Update thread with latest message
        if thread:
            thread.last_message = instance
            thread.updated_at = timezone.now()
            thread.save(update_fields=['last_message', 'updated_at'])
            
    except Exception as e:
        logger.error(f"Error updating thread for message {instance.id}: {str(e)}")

@receiver(post_save, sender=Inquiry)
def create_message_thread_for_inquiry(sender, instance, created, **kwargs):
    """
    Create a message thread for new inquiries.
    """
    if created:
        # Check if thread already exists
        existing_thread = MessageThread.objects.filter(
            inquiry=instance
        ).first()
        
        if not existing_thread:
            # Create new thread
            thread = MessageThread.objects.create(
                subject=f"Inquiry about {instance.property_rel.title}",
                inquiry=instance,
                property=instance.property_rel
            )
            
            # Add participants
            thread.participants.add(instance.user, instance.property_rel.owner)
            
            # Create initial message
            Message.objects.create(
                sender=instance.user,
                receiver=instance.property_rel.owner,
                inquiry=instance,
                property=instance.property_rel,
                message_type='inquiry',
                subject=thread.subject,
                content=instance.message,
                thread_last_message=thread
            )

@receiver(pre_save, sender=Message)
def validate_message_receiver(sender, instance, **kwargs):
    """
    Validate that user is not sending message to themselves.
    """
    if instance.sender == instance.receiver:
        raise ValueError("Cannot send message to yourself")