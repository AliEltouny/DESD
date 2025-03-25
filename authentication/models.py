<<<<<<< HEAD
=======
# backend/authentication/models.py
>>>>>>> master
from django.conf import settings
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.utils.timezone import now
<<<<<<< HEAD
from django.db import models

class OTPVerification(models.Model):
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.email} - {self.otp}'

=======
>>>>>>> master

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        expiration_time = timezone.now() - timedelta(minutes=5)
        return self.created_at > expiration_time
<<<<<<< HEAD
    
=======

>>>>>>> master
class OTPVerification(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(default=now)

    def is_valid(self):
<<<<<<< HEAD
        from django.utils.timezone import timedelta
        return self.created_at + timedelta(minutes=10) > now()

    def __str__(self):
        return f"{self.email} - {self.otp}"
=======
        from datetime import timedelta
        return self.created_at + timedelta(minutes=10) > now()

    def __str__(self):
        return f"{self.email} - {self.otp}"
>>>>>>> master
