import random
import string
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings


def generate_otp(length=6):
    """Generate a random OTP of specified length"""
    return ''.join(random.choices(string.digits, k=length))


def save_otp(email, otp, timeout=300):
    """Save OTP in cache with 5 minutes (300 seconds) expiration"""
    cache_key = f'otp_{email}'
    cache.set(cache_key, otp, timeout)
    return True


def verify_otp(email, otp):
    """Verify OTP for the given email"""
    cache_key = f'otp_{email}'
    stored_otp = cache.get(cache_key)
    
    if stored_otp and stored_otp == otp:
        # Clear the OTP from cache after successful verification
        cache.delete(cache_key)
        return True
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