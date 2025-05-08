"""
Test script to verify email sending functionality
"""
import os
import django

# Set up Django configuration
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Now we can import Django components
from django.core.mail import send_mail
from django.conf import settings

def test_email_sending():
    """Send a test email to verify email functionality"""
    subject = "Test Email from Django"
    message = "This is a test email to verify that Django can send emails."
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = ["cloutroza@gmail.com"]  # Update with your email
    
    print(f"Attempting to send test email from {from_email} to {recipient_list[0]}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    
    try:
        result = send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        if result:
            print(f"✅ Test email sent successfully! Result: {result}")
        else:
            print("❌ Failed to send email")
    except Exception as e:
        print(f"❌ Error sending email: {str(e)}")
        
if __name__ == "__main__":
    test_email_sending()