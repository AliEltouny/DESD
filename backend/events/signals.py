from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import EventParticipant, Event
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=EventParticipant)
def log_event_join(sender, instance, created, **kwargs):
    """
    Logs when a user joins an event.
    """
    if created:
        print(f"✅ SIGNAL: {instance.user.email} joined '{instance.event.title}'")
        logger.info(f"User {instance.user.email} joined event '{instance.event.title}' at {instance.joined_at}")
        # Optional: Add notification or webhook trigger here


@receiver(post_delete, sender=EventParticipant)
def log_event_leave(sender, instance, **kwargs):
    """
    Logs when a user leaves an event.
    """
    logger.info(f"User {instance.user.email} left event '{instance.event.title}'")
    # Optional: Add notification or webhook trigger here


@receiver(post_save, sender=Event)
def log_event_created(sender, instance, created, **kwargs):
    """
    Logs when a new event is created.
    """
    if created:
        logger.info(f"Event '{instance.title}' was created by {instance.created_by.email}")
