import time
from django.utils.deprecation import MiddlewareMixin
from analytics.models import PlatformAnalytics
from users.models import CustomUser
from real_estate.models import Message

class MessageReadMiddleware(MiddlewareMixin):
    """
    Middleware to automatically mark messages as read when viewed.
    """
    def process_request(self, request):
        if request.user.is_authenticated:
            # Mark messages as read when viewing message thread
            if '/api/messaging/message-threads/' in request.path and request.method == 'GET':
                # Extract thread ID from URL
                try:
                    # This is a simplified example - you'd need to parse the URL properly
                    thread_id = self._extract_thread_id(request.path)
                    if thread_id:
                        self._mark_thread_messages_read(request.user, thread_id)
                except (ValueError, IndexError):
                    pass
    
    def _extract_thread_id(self, path):
        """Extract thread ID from URL path"""
        parts = path.strip('/').split('/')
        try:
            # Look for pattern: .../message-threads/<id>/...
            thread_index = parts.index('message-threads')
            if thread_index + 1 < len(parts):
                return int(parts[thread_index + 1])
        except (ValueError, IndexError):
            pass
        return None
    
    def _mark_thread_messages_read(self, user, thread_id):
        """Mark all unread messages in thread as read for the user"""
        unread_messages = Message.objects.filter(
            thread_last_message_id=thread_id,
            receiver=user,
            is_read=False
        )
        
        if unread_messages.exists():
            unread_messages.update(
                is_read=True,
                read_at=timezone.now()
            )
            
class AnalyticsMiddleware(MiddlewareMixin):
    """
    Middleware to track API usage and user activity
    """
    
    def process_request(self, request):
        request.start_time = time.time()
        
        # Update user last activity if authenticated
        if request.user.is_authenticated:
            request.user.update_activity()
        
        return None
    
    def process_response(self, request, response):
        # Calculate response time
        if hasattr(request, 'start_time'):
            response_time = time.time() - request.start_time
            
            # Log slow responses
            if response_time > 1.0:  # More than 1 second
                logger.warning(f"Slow response: {request.path} took {response_time:.2f}s")
        
        return response
    
    def process_exception(self, request, exception):
        # Log exceptions for analytics
        logger.error(f"Exception in {request.path}: {exception}")
        return None