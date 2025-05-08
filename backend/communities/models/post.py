from django.db import models
from django.conf import settings
from .community import Community


class Post(models.Model):
    """Model for posts within a community"""
    
    TYPE_CHOICES = [
        ('discussion', 'Discussion'),
        ('question', 'Question'),
        ('event', 'Event'),
        ('announcement', 'Announcement'),
        ('resource', 'Resource'),
        ('other', 'Other'),
    ]
    
    title = models.CharField(max_length=255)
    content = models.TextField()
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='posts', db_index=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='community_posts', db_index=True)
    post_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='discussion', db_index=True)
    
    # For event posts
    event_date = models.DateTimeField(null=True, blank=True, help_text="Date and time for events", db_index=True)
    event_location = models.CharField(max_length=255, blank=True, help_text="Location for events")
    event_participant_limit = models.PositiveIntegerField(null=True, blank=True, help_text="Maximum number of participants for this event")
    event_participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='participated_events', blank=True)
    
    # Media
    image = models.ImageField(upload_to='communities/posts/', blank=True, null=True)
    file = models.FileField(upload_to='communities/files/', blank=True, null=True, help_text="Attachments for posts")
    
    # Engagement metrics
    upvotes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='upvoted_posts', blank=True)
    is_pinned = models.BooleanField(default=False, help_text="Pin this post to the top of the community", db_index=True)
    
    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Performance cache fields
    upvote_count_cache = models.PositiveIntegerField(default=0, editable=False, help_text="Cached upvote count for performance")
    comment_count_cache = models.PositiveIntegerField(default=0, editable=False, help_text="Cached comment count for performance")
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']
        verbose_name = "Post"
        verbose_name_plural = "Posts"
        indexes = [
            models.Index(fields=['community', '-created_at']),
            models.Index(fields=['community', 'post_type']),
            models.Index(fields=['community', '-is_pinned', '-created_at']),
            models.Index(fields=['author', '-created_at']),
        ]
    
    def __str__(self):
        return self.title
    
    @property
    def upvote_count(self):
        return self.upvote_count_cache if self.upvote_count_cache > 0 else self.upvotes.count()
    
    @property
    def comment_count(self):
        return self.comment_count_cache if self.comment_count_cache > 0 else self.comments.count()