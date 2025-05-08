# Permissions package for communities app

# Import all permission classes
from .community_permissions import IsCommunityAdminOrReadOnly, IsCommunityMember
from .post_permissions import IsPostAuthorOrCommunityAdminOrReadOnly
from .comment_permissions import IsCommentAuthorOrCommunityAdminOrReadOnly

# Export all permission classes
__all__ = [
    'IsCommunityAdminOrReadOnly',
    'IsCommunityMember',
    'IsPostAuthorOrCommunityAdminOrReadOnly',
    'IsCommentAuthorOrCommunityAdminOrReadOnly',
] 