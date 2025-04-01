from django.db import models
from django.conf import settings
from django.utils.text import slugify

class Community(models.Model):
    """Model for university communities/clubs/groups"""
    
    # Community Categories
    CATEGORY_CHOICES = [
        ('academic', 'Academic'),
        ('social', 'Social'),
        ('sports', 'Sports'),
        ('arts', 'Arts & Culture'),
        ('career', 'Career & Professional'),
        ('technology', 'Technology'),
        ('health', 'Health & Wellness'),
        ('service', 'Community Service'),
        ('other', 'Other'),
    ]
    
    # Basic Info
    name = models.CharField(max_length=100, unique=True, help_text="Name of the community")
    slug = models.SlugField(max_length=120, unique=True, help_text="URL-friendly name")
    description = models.TextField(help_text="Description of the community")
    short_description = models.CharField(max_length=255, help_text="Short description for preview cards", blank=True)
    
    # Categorization
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other', help_text="Category of the community")
    tags = models.CharField(max_length=255, blank=True, help_text="Comma-separated tags")
    
    # Media
    image = models.ImageField(upload_to='communities/images/', blank=True, null=True, help_text="Community profile image")
    banner = models.ImageField(upload_to='communities/banners/', blank=True, null=True, help_text="Community banner image")
    
    # Membership
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_communities')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, through='Membership', related_name='communities')
    
    # Rules and settings
    rules = models.TextField(blank=True, help_text="Community rules and guidelines")
    is_private = models.BooleanField(default=False, help_text="Whether the community is private (invite-only)")
    requires_approval = models.BooleanField(default=False, help_text="Whether joining requires admin approval")
    
    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Community"
        verbose_name_plural = "Communities"
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Auto-generate slug if not provided
        if not self.slug:
            self.slug = slugify(self.name)
        
        # Ensure short_description exists
        if not self.short_description and self.description:
            self.short_description = self.description[:252] + '...' if len(self.description) > 255 else self.description
            
        super().save(*args, **kwargs)
    
    @property
    def member_count(self):
        """Get the number of members in this community"""
        return self.members.count()


class Membership(models.Model):
    """Model representing a user's membership in a community"""
    
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('moderator', 'Moderator'),
        ('admin', 'Admin'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    community = models.ForeignKey(Community, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='approved')
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'community')
        verbose_name = "Membership"
        verbose_name_plural = "Memberships"
    
    def __str__(self):
        return f"{self.user.username} - {self.community.name} ({self.role})"


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
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='community_posts')
    post_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='discussion')
    
    # For event posts
    event_date = models.DateTimeField(null=True, blank=True, help_text="Date and time for events")
    event_location = models.CharField(max_length=255, blank=True, help_text="Location for events")
    
    # Media
    image = models.ImageField(upload_to='communities/posts/', blank=True, null=True)
    file = models.FileField(upload_to='communities/files/', blank=True, null=True, help_text="Attachments for posts")
    
    # Engagement metrics
    upvotes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='upvoted_posts', blank=True)
    is_pinned = models.BooleanField(default=False, help_text="Pin this post to the top of the community")
    
    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']
        verbose_name = "Post"
        verbose_name_plural = "Posts"
    
    def __str__(self):
        return self.title
    
    @property
    def upvote_count(self):
        return self.upvotes.count()
    
    @property
    def comment_count(self):
        return self.comments.count()


class Comment(models.Model):
    """Model for comments on posts"""
    
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='community_comments')
    content = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.CASCADE, related_name='replies', null=True, blank=True)
    
    # Engagement metrics
    upvotes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='upvoted_comments', blank=True)
    
    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name = "Comment"
        verbose_name_plural = "Comments"
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.title}"
    
    @property
    def upvote_count(self):
        return self.upvotes.count()
    
    @property
    def is_reply(self):
        return self.parent is not None


class CommunityInvitation(models.Model):
    """Model for invitations to join a community"""
    
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='invitations')
    inviter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_invitations')
    invitee_email = models.EmailField(help_text="Email of the person being invited")
    message = models.TextField(blank=True, help_text="Optional message to include with the invitation")
    
    # Email invitation status
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Invitation status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('community', 'invitee_email')
        verbose_name = "Community Invitation"
        verbose_name_plural = "Community Invitations"
    
    def __str__(self):
        return f"Invitation to {self.community.name} for {self.invitee_email}"
