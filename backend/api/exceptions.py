from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler for the API.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Customize the response data
        response.data = {
            'error': True,
            'message': response.data.get('detail', 'An error occurred'),
            'code': response.status_code,
            'details': response.data
        }
    else:
        # Handle uncaught exceptions
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        
        response = Response({
            'error': True,
            'message': 'An internal server error occurred',
            'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
            'details': str(exc) if settings.DEBUG else 'Please contact support'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return response