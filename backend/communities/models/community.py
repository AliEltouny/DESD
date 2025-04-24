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
    slug = models.SlugField(max_length=120, unique=True, help_text="URL-friendly name", db_index=True)
    description = models.TextField(help_text="Description of the community")
    short_description = models.CharField(max_length=255, help_text="Short description for preview cards", blank=True)
    
    # Categorization
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other', help_text="Category of the community", db_index=True)
    tags = models.CharField(max_length=255, blank=True, help_text="Comma-separated tags")
    
    # Media
    image = models.ImageField(upload_to='communities/images/', blank=True, null=True, help_text="Community profile image")
    banner = models.ImageField(upload_to='communities/banners/', blank=True, null=True, help_text="Community banner image")
    
    # Membership
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_communities', db_index=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, through='Membership', related_name='communities')
    
    # Rules and settings
    rules = models.TextField(blank=True, help_text="Community rules and guidelines")
    is_private = models.BooleanField(default=False, help_text="Whether the community is private (invite-only)", db_index=True)
    requires_approval = models.BooleanField(default=False, help_text="Whether joining requires admin approval")
    
    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Performance cache fields
    member_count_cache = models.PositiveIntegerField(default=0, editable=False, help_text="Cached member count for performance")
    
    class Meta:
        verbose_name = "Community"
        verbose_name_plural = "Communities"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'is_private']),
            models.Index(fields=['-created_at']),
        ]
    
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
        return self.member_count_cache if self.member_count_cache > 0 else self.members.count()


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
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, db_index=True)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, db_index=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member', db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='approved', db_index=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'community')
        verbose_name = "Membership"
        verbose_name_plural = "Memberships"
        indexes = [
            models.Index(fields=['role', 'status']),
            models.Index(fields=['community', 'role']),
            models.Index(fields=['user', 'status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.community.name} ({self.role})" 