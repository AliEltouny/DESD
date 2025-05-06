from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from api.models import Notification

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_notification_on_profile_update(sender, instance, created, **kwargs):
    if not created and instance._state.adding is False:  # Ensure it's an update, not creation
        # Check if the update is already processed
        if not hasattr(instance, '_profile_update_notified') or not instance._profile_update_notified:
            Notification.objects.create(
                text=f"Your profile has been updated!",
                is_read=False
            )
            # Mark the instance as notified to prevent duplicate notifications
            instance._profile_update_notified = True