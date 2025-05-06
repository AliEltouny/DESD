from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import connection
# Create your models here.

class Testimonial(models.Model):
    """Model for storing user testimonials displayed on the landing page"""
    name = models.CharField(max_length=100, help_text="Student's full name")
    role = models.CharField(max_length=100, help_text="Student's role or position (e.g. 'Computer Science Student')")
    university = models.CharField(max_length=100, help_text="University name")
    content = models.TextField(help_text="Testimonial content text")
    image = models.ImageField(upload_to='testimonials/', help_text="Student's photo")
    active = models.BooleanField(default=True, help_text="Whether this testimonial is active and should be displayed")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.university}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Testimonial"
        verbose_name_plural = "Testimonials"

class MessageGroup(models.Model):
    """A group chat for multiple users"""
    name = models.CharField(max_length=100, blank=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="message_groups")
    is_direct = models.BooleanField(default=False)
    direct_users = models.ManyToManyField('users.User', related_name='direct_message_groups', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Message(models.Model):
    """A message sent between users or in a group"""
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="received_messages")
    group = models.ForeignKey(MessageGroup, null=True, blank=True, on_delete=models.CASCADE, related_name="messages")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

    def __str__(self):
        if self.group:
            return f"Group({self.group.name}): {self.sender} - {self.content[:20]}"
        return f"{self.sender} -> {self.recipient}: {self.content[:20]}"

    class Meta:
        ordering = ['-created_at']

class Notification(models.Model):
    id = models.BigAutoField(primary_key=True)
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.pk:  # Only for new objects
            min_id = Notification.objects.aggregate(models.Min('id'))['id__min']
            if min_id is None or min_id > 1:
                self.id = 1
            else:
                # Find the smallest missing ID
                existing_ids = Notification.objects.values_list('id', flat=True).order_by('id')
                for i, existing_id in enumerate(existing_ids, start=1):
                    if i != existing_id:
                        self.id = i
                        break
                else:
                    self.id = existing_ids.last() + 1
        super().save(*args, **kwargs)

@receiver(post_save, sender=Message)
def create_notification_on_message_save(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            text="You have a new message!",
            is_read=False
        )