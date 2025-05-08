from django.db import models, transaction
from django.conf import settings
from django.core.cache import cache
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
    
    VISIBILITY_CHOICES = [
        ('public', 'Public - Visible to everyone'),
        ('members', 'Members Only - Visible only to community members'),
        ('admin', 'Admin Only - Visible only to community admins')
    ]
    
    title = models.CharField(max_length=255)
    content = models.TextField()
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='posts', db_index=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='community_posts', db_index=True)
    post_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='discussion', db_index=True)
    
    # Tags for categorizing posts
    tags = models.CharField(max_length=255, blank=True, default="", help_text="Comma-separated tags for this post")
    
    # Visibility settings
    visibility = models.CharField(
        max_length=20, 
        choices=VISIBILITY_CHOICES, 
        default='public',
        help_text="Who can see this post",
        db_index=True
    )
    
    # For event posts
    event_date = models.DateTimeField(null=True, blank=True, help_text="Date and time for events", db_index=True)
    event_location = models.CharField(max_length=255, blank=True, help_text="Location for events")
    
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
            # Add composite index for community and author for faster validation
            models.Index(fields=['community', 'author']),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        """Optimized save method with cache invalidation"""
        is_new = self._state.adding
        
        # Use transaction to ensure atomicity
        with transaction.atomic():
            # Call the original save method
            super().save(*args, **kwargs)
            
            # Invalidate relevant caches
            cache_keys = [
                f"post:comment_count:{self.id}",
                f"post:upvote_count:{self.id}",
                f"post:top_comments:{self.id}",
            ]
            cache.delete_many(cache_keys)
            
            # If this is a new post, invalidate community post listings
            if is_new:
                cache.delete(f"community:post_count:{self.community_id}")
                cache.delete(f"community:recent_posts:{self.community_id}")
    
    @property
    def upvote_count(self):
        """Get upvote count efficiently from cache or model"""
        # First try the cache field for best performance
        if self.upvote_count_cache > 0:
            return self.upvote_count_cache
        
        # Try to get from cache
        cache_key = f"post:upvote_count:{self.id}"
        cached_count = cache.get(cache_key)
        if cached_count is not None:
            return cached_count
        
        # Calculate and cache the count
        count = self.upvotes.count()
        cache.set(cache_key, count, 300)  # Cache for 5 minutes
        
        # Update the model cache field if different
        if count != self.upvote_count_cache:
            self.__class__.objects.filter(id=self.id).update(upvote_count_cache=count)
            self.upvote_count_cache = count
            
        return count
    
    @property
    def comment_count(self):
        """Get comment count efficiently from cache or model"""
        # First try the cache field for best performance
        if self.comment_count_cache > 0:
            return self.comment_count_cache
        
        # Try to get from cache
        cache_key = f"post:comment_count:{self.id}"
        cached_count = cache.get(cache_key)
        if cached_count is not None:
            return cached_count
        
        # Calculate and cache the count
        count = self.comments.count()
        cache.set(cache_key, count, 300)  # Cache for 5 minutes
        
        # Update the model cache field if different
        if count != self.comment_count_cache:
            self.__class__.objects.filter(id=self.id).update(comment_count_cache=count)
            self.comment_count_cache = count
            
        return count 