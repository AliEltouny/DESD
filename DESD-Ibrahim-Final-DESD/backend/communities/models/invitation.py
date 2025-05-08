from django.db import models
from django.conf import settings
from .community import Community


class CommunityInvitation(models.Model):
    """Model for invitations to join a community"""
    
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='invitations', db_index=True)
    inviter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_invitations', db_index=True)
    invitee_email = models.EmailField(help_text="Email of the person being invited", db_index=True)
    message = models.TextField(blank=True, help_text="Optional message to include with the invitation")
    
    # Email invitation status
    is_sent = models.BooleanField(default=False, db_index=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Invitation status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    
    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('community', 'invitee_email')
        verbose_name = "Community Invitation"
        verbose_name_plural = "Community Invitations"
        indexes = [
            models.Index(fields=['status', 'is_sent']),
            models.Index(fields=['community', 'status']),
        ]
    
    def __str__(self):
        return f"Invitation to {self.community.name} for {self.invitee_email}" 