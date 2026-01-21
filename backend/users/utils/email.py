# users/utils/email.py
import logging
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.core.mail import send_mail as django_send_mail
import ssl

logger = logging.getLogger(__name__)

def send_email(to_email, subject, template_name, context):
    """Base function to send email via SMTP"""
    try:
        # Render HTML and plain text content
        html_content = render_to_string(f'emails/{template_name}', context)
        text_content = strip_tags(html_content)
        
        # Use YOUR email, not generic
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'nahomkassa19@gmail.com')
        site_name = getattr(settings, 'SITE_NAME', 'Utopia Real Estate Platform')
        
        # Debug print
        print(f"\n📧 Preparing to send email via SMTP:")
        print(f"   From: {from_email}")
        print(f"   To: {to_email}")
        print(f"   Subject: {subject}")
        
        # Send email
        try:
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=[to_email],
                reply_to=[getattr(settings, 'DEFAULT_SUPPORT_EMAIL', 'support@utopia-realestate.com')]
            )
            email.attach_alternative(html_content, "text/html")
            
            # Send it
            result = email.send()
            
            if result:
                print(f"✅ Email sent successfully via SMTP!")
                return True
            else:
                print(f"❌ Failed to send email via SMTP")
                return False
                
        except Exception as e:
            print(f"❌ SMTP Error: {str(e)}")
            # Fallback to console for debugging
            if settings.DEBUG:
                print(f"\n📧 [FALLBACK] Console Email Preview:")
                print(f"From: {from_email}")
                print(f"To: {to_email}")
                print(f"Subject: {subject}")
                print(f"Content preview...")
                return True
            return False

    except Exception as e:
        print(f"❌ Email preparation error: {str(e)}")
        return False

def send_verification_email(user, request=None):
    """Verification specific logic"""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    verification_link = f"{frontend_url}/auth/verify-email?token={user.verification_token}"
    
    context = {
        'user': user,
        'user_name': user.get_full_name() or user.email.split('@')[0],
        'verification_link': verification_link,
        'site_name': getattr(settings, 'SITE_NAME', 'UTOPIA Real Estate'),
        'support_email': getattr(settings, 'DEFAULT_SUPPORT_EMAIL', 'support@utopia-realestate.com'),
        'current_year': timezone.now().year,
    }
    
    subject = f"Verify Your Email - {context['site_name']}"
    
    success = send_email(
        to_email=user.email,
        subject=subject,
        template_name='email_verification.html',
        context=context
    )
    
    # Debug output in development
    if settings.DEBUG:
        print(f"\n{'='*60}")
        print(f"DEBUG: Verification email for {user.email}")
        print(f"Subject: {subject}")
        print(f"Verification Link: {verification_link}")
        print(f"Template: email_verification.html")
        print(f"Success: {success}")
        print(f"{'='*60}\n")
    
    return success


def send_password_reset_email(user_email, user_name, reset_token):
    """
    Send password reset email using SMTP
    """
    try:
        # Get frontend URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        # Create reset link
        reset_link = f"{frontend_url}/auth/reset-password?token={reset_token}"
        
        context = {
            'user_name': user_name,
            'reset_link': reset_link,
            'user_email': user_email,
            'support_email': getattr(settings, 'DEFAULT_SUPPORT_EMAIL', 'support@utopia-realestate.com'),
            'site_name': getattr(settings, 'SITE_NAME', 'UTOPIA Real Estate'),
            'site_url': frontend_url,
            'current_year': timezone.now().year,
            'expiry_hours': 24,
        }
        
        subject = f"Password Reset Request - {context['site_name']}"
        
        success = send_email(
            to_email=user_email,
            subject=subject,
            template_name='password_reset.html',
            context=context
        )
        
        # Debug output in development
        if settings.DEBUG:
            print(f"\n{'='*60}")
            print(f"DEBUG: Password reset email for {user_email}")
            print(f"Subject: {subject}")
            print(f"Reset Link: {reset_link}")
            print(f"Token: {reset_token}")
            print(f"Success: {success}")
            print(f"{'='*60}\n")
        
        return success
        
    except Exception as e:
        logger.error(f"Error sending password reset email: {str(e)}", exc_info=True)
        return False

def send_welcome_email(user_email, user_name):
    """
    Send welcome email
    """
    try:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        context = {
            'user_name': user_name,
            'site_name': getattr(settings, 'SITE_NAME', 'UTOPIA Real Estate'),
            'login_url': f"{frontend_url}/auth/login",
            'dashboard_url': f"{frontend_url}/dashboard",
            'support_email': getattr(settings, 'DEFAULT_SUPPORT_EMAIL', 'support@utopia-realestate.com'),
            'current_year': timezone.now().year,
        }
        
        subject = f"Welcome to {context['site_name']}!"
        
        return send_email(
            to_email=user_email,
            subject=subject,
            template_name='welcome.html',
            context=context
        )
        
    except Exception as e:
        logger.error(f"Error sending welcome email: {str(e)}", exc_info=True)
        return False

def send_notification_email(user_email, subject, message, template_name='notification.html'):
    """
    Generic notification email function
    """
    try:
        context = {
            'user_email': user_email,
            'subject': subject,
            'message': message,
            'site_name': getattr(settings, 'SITE_NAME', 'UTOPIA Real Estate'),
            'support_email': getattr(settings, 'DEFAULT_SUPPORT_EMAIL', 'support@utopia-realestate.com'),
            'current_year': timezone.now().year,
        }
        
        return send_email(
            to_email=user_email,
            subject=subject,
            template_name=template_name,
            context=context
        )
        
    except Exception as e:
        logger.error(f"Error sending notification email: {str(e)}", exc_info=True)
        return False