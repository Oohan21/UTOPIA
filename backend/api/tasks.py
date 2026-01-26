from django.conf import settings

def _sync_send_email(subject, message, from_email, recipient_list, fail_silently=True):
    from django.core.mail import send_mail
    return send_mail(subject, message, from_email, recipient_list, fail_silently=fail_silently)

try:
    # Prefer Celery task if celery app exists
    from utopia_backend.celery_app import app

    @app.task(ignore_result=True)
    def send_email_task(subject, message, from_email, recipient_list, fail_silently=True):
        from django.core.mail import send_mail
        return send_mail(subject, message, from_email, recipient_list, fail_silently=fail_silently)
except Exception:
    def send_email_task(subject, message, from_email, recipient_list, fail_silently=True):
        return _sync_send_email(subject, message, from_email, recipient_list, fail_silently)

