import django.db.models.signals as signals
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

# This file will be split into separate files in a views directory
# This acts as a shim to maintain backward compatibility
# Import all viewsets from their new locations
from .views.community_views import CommunityViewSet
from .views.post_views import PostViewSet
from .views.comment_views import CommentViewSet
from .views.invitation_views import CommunityInvitationViewSet

# Export the viewsets to maintain the same API
__all__ = [
    'CommunityViewSet',
    'PostViewSet',
    'CommentViewSet',
    'CommunityInvitationViewSet',
]

# The rest of this file is removed to avoid duplication
# All viewset implementations are now in their respective files in the views directory
