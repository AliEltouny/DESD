import random
import string
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes


def generate_otp(length=6):
    """Generate a random OTP of specified length"""
    return ''.join(random.choices(string.digits, k=length))


def save_otp(email, otp, timeout=3600):  # Extended to 60 minutes (3600 seconds) for development
    """Save OTP in cache with extended expiration time for easier testing"""
    cache_key = f'otp_{email}'
    cache.set(cache_key, otp, timeout)
    return True


def verify_otp(email, otp):
    """Verify OTP for the given email"""
    cache_key = f'otp_{email}'
    stored_otp = cache.get(cache_key)
    
    print(f"OTP Verification Debug - Email: {email}, Submitted OTP: {otp}, Stored OTP: {stored_otp}")
    
    if stored_otp and stored_otp == otp:
        # Clear the OTP from cache after successful verification
        cache.delete(cache_key)
        print(f"OTP Verification Success - Email: {email}")
        return True
    
    print(f"OTP Verification Failed - Email: {email}, Reason: {'No stored OTP' if not stored_otp else 'OTP mismatch'}")
    return False


def send_otp_email(email, otp):
    """Send OTP to user's email"""
    subject = 'Uni Hub - Email Verification OTP'
    message = f'Your OTP for email verification is: {otp}\nThis OTP is valid for 5 minutes.'
    
    return send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


def generate_password_reset_token(user):
    """Generate password reset token for a user"""
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return {'uid': uid, 'token': token}


def send_password_reset_email(user, reset_url):
    """Send password reset link to user's email"""
    subject = 'Uni Hub - Reset Your Password'
    message = f'Click the link below to reset your password:\n\n{reset_url}\n\nThis link is valid for 24 hours.'
    
    return send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )