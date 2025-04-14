from django.db import models
from django.conf import settings
from .post import Post


class Comment(models.Model):
    """Model for comments on posts"""
    
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments', db_index=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='community_comments', db_index=True)
    content = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.CASCADE, related_name='replies', null=True, blank=True, db_index=True)
    
    # Engagement metrics
    upvotes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='upvoted_comments', blank=True)
    
    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Performance cache fields
    upvote_count_cache = models.PositiveIntegerField(default=0, editable=False, help_text="Cached upvote count for performance")
    
    class Meta:
        ordering = ['created_at']
        verbose_name = "Comment"
        verbose_name_plural = "Comments"
        indexes = [
            models.Index(fields=['post', 'created_at']),
            models.Index(fields=['post', 'parent', 'created_at']),
            models.Index(fields=['author', '-created_at']),
        ]
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.title}"
    
    @property
    def upvote_count(self):
        return self.upvote_count_cache if self.upvote_count_cache > 0 else self.upvotes.count()
    
    @property
    def is_reply(self):
        return self.parent is not None 