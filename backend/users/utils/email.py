# users/utils/email.py
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_password_reset_email(user_email, user_name, reset_token):
    """
    Send password reset email to user
    """
    try:
        # Build reset link
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_link = f"{frontend_url}/auth/reset-password?token={reset_token}"
        
        # Prepare context for email template
        context = {
            'user_email': user_email,
            'user_name': user_name or user_email.split('@')[0],
            'reset_link': reset_link,
            'site_url': frontend_url,
        }
        
        # Render HTML email template
        html_content = render_to_string('emails/password_reset.html', context)
        
        # Render plain text email template
        text_content = render_to_string('emails/password_reset.txt', context)
        
        # Create email
        subject = 'Reset Your Password - Utopia Real Estate'
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user_email]
        
        # Create email message with both HTML and plain text
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,  # Plain text version
            from_email=from_email,
            to=recipient_list,
        )
        email.attach_alternative(html_content, "text/html")  # HTML version
        
        # Send email
        email.send(fail_silently=False)
        
        logger.info(f"Password reset email sent to {user_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user_email}: {str(e)}", exc_info=True)
        return False


def send_welcome_email(user_email, user_name):
    """
    Send welcome email to new user
    """
    try:
        subject = 'Welcome to Utopia Real Estate!'
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user_email]
        
        context = {
            'user_name': user_name or user_email.split('@')[0],
            'site_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
        }
        
        html_content = render_to_string('emails/welcome.html', context)
        text_content = render_to_string('emails/welcome.txt', context)
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=recipient_list,
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
        
        logger.info(f"Welcome email sent to {user_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user_email}: {str(e)}")
        return False