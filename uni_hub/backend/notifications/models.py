# models.py
from django.db import models
from django.conf import settings

class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='notifications', on_delete=models.CASCADE)
    user_email = models.EmailField()
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username} - {self.message}"

    def save(self, *args, **kwargs):
        # Automatically set the user_email from the user's email
        if self.user and not self.user_email:
            self.user_email = self.user.email
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']