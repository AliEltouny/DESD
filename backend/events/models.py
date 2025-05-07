from django.db import models
from django.conf import settings
from django.utils import timezone
from communities.models import Community


class Event(models.Model):
    """
    Model representing an event, optionally linked to a community.
    """
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(upload_to='event_images/', null=True, blank=True)
    date_time = models.DateTimeField(db_index=True)
    location = models.CharField(max_length=255)

    participant_limit = models.PositiveIntegerField(null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_events'
    )
    community = models.ForeignKey(
        Community,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='events'
    )

    is_private = models.BooleanField(default=False, help_text="Private = only community members can join/view", db_index=True)
    is_canceled = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_time']
        indexes = [
            models.Index(fields=['is_private', 'date_time']),
            models.Index(fields=['is_canceled']),
        ]

    def __str__(self):
        return f"{self.title} - {self.date_time.strftime('%Y-%m-%d %H:%M')}"

    def __repr__(self):
        return f"<Event {self.id}: {self.title}>"

    @property
    def participant_count(self):
        return self.participants.count()

    @property
    def is_full(self):
        return self.participant_limit is not None and self.participant_count >= self.participant_limit

    def get_status(self):
        if self.is_canceled:
            return "Canceled"
        if self.is_full:
            return "Full"
        return "Open"

    def clean(self):
        if self.date_time <= timezone.now():
            raise ValueError("Event date must be in the future.")


class EventParticipant(models.Model):
    """
    Model representing a user's participation in an event.
    """
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='joined_events'
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'user')
        verbose_name = 'Event Participant'
        verbose_name_plural = 'Event Participants'
        indexes = [
            models.Index(fields=['event', 'user']),
        ]

    def __str__(self):
        return f"{self.user.username} joined {self.event.title}"

    def __repr__(self):
        return f"<EventParticipant user={self.user_id}, event={self.event_id}>"
