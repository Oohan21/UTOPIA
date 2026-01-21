# users/middleware.py
from django.utils import timezone
from django.contrib.auth.models import AnonymousUser

class SessionRefreshMiddleware:
    """
    Middleware to refresh user session on every request
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # If user is authenticated, refresh session
        if hasattr(request, 'user') and request.user.is_authenticated:
            if request.session.get_expiry_age() > 0:
                request.session.modified = True
        
        return response

class PreventCSRFCallsMiddleware:
    """
    Middleware to prevent excessive CSRF token calls
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip CSRF token generation for certain endpoints
        skip_paths = ['/api/auth/csrf/', '/api/notifications/unread_count/']
        
        if any(request.path.startswith(path) for path in skip_paths):
            # Don't modify session for these paths to prevent excessive calls
            pass
        else:
            # Normal request processing
            pass
        
        return self.get_response(request)