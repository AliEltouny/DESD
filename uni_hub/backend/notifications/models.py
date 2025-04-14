from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from .enums import NotificationType

class Notification(models.Model):
    """Model for user notifications"""
    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_notifications',
        null=True,
        blank=True
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Generic foreign key to link to any object
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
    
    def __str__(self):
        return f"{self.notification_type} notification for {self.recipient.username}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        self.save()
    
    @property
    def related_object(self):
        """Get the related object if it exists"""
        if self.content_type and self.object_id:
            try:
                return self.content_type.get_object_for_this_type(pk=self.object_id)
            except:
                return None
        return None


class NotificationPreference(models.Model):
    """Model for user notification preferences"""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # Community-related notifications
    community_invites = models.BooleanField(default=True)
    community_join_requests = models.BooleanField(default=True)
    community_updates = models.BooleanField(default=True)
    community_new_posts = models.BooleanField(default=True)
    community_post_updates = models.BooleanField(default=True)
    
    # Engagement notifications
    post_upvotes = models.BooleanField(default=True)
    comment_upvotes = models.BooleanField(default=True)
    comment_replies = models.BooleanField(default=True)
    mention_notifications = models.BooleanField(default=True)
    
    # Email notification settings
    email_community_invites = models.BooleanField(default=True)
    email_community_updates = models.BooleanField(default=False)
    email_engagement = models.BooleanField(default=False)
    
    # Push notification settings
    push_notifications = models.BooleanField(default=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Notification Preference"
        verbose_name_plural = "Notification Preferences"
    
    def __str__(self):
        return f"Notification preferences for {self.user.username}"