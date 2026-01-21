# users/utils/email_resend.py
import logging
import os
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
import resend

logger = logging.getLogger(__name__)

def send_resend_email(to_email, subject, template_name, context):
    """
    Send email using Resend
    """
    try:
        # Configure Resend
        resend_api_key = os.getenv('RESEND_API_KEY')
        if not resend_api_key:
            if settings.DEBUG:
                print(f"[DEV] Resend API key not set. Would send to: {to_email}")
                return True
            logger.error("Resend API key not configured")
            return False
        
        resend.api_key = resend_api_key
        
        # Render email
        html_content = render_to_string(f'emails/{template_name}', context)
        text_content = strip_tags(html_content)
        
        # Send email
        response = resend.Emails.send({
            "from": getattr(settings, 'DEFAULT_FROM_EMAIL', 'Acme <onboarding@resend.dev>'),
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "text": text_content,
        })
        
        logger.info(f"Email sent via Resend to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Resend email error: {str(e)}")
        
        # Fallback to console in development
        if settings.DEBUG:
            print(f"\n📧 [DEV EMAIL via Resend failed] To: {to_email}")
            print(f"   Subject: {subject}")
            if 'reset_link' in context:
                print(f"   Reset Link: {context['reset_link']}")
            print()
            return True
        
        return False