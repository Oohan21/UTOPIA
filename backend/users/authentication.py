"""
Custom authentication classes for the Utopia project.
"""
from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Session authentication that doesn't enforce CSRF validation.
    
    This is used to bypass CSRF checks for session-based authentication
    in development or when CSRF validation is handled differently.
    
    Note: In production, ensure proper CSRF protection is in place
    through other means if using this authentication class.
    """
    def enforce_csrf(self, request):
        """
        Override to skip CSRF validation.
        """
        return  # Do not perform CSRF validation
