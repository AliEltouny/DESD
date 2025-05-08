# This file is maintained for backward compatibility
# All models are now in the models directory
from communities.models.community import Community, Membership
from communities.models.post import Post
from communities.models.comment import Comment
from communities.models.invitation import CommunityInvitation

# Export all models so they can be imported directly from communities.models
__all__ = [
    'Community',
    'Membership',
    'Post',
    'Comment',
    'CommunityInvitation',
]