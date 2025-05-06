# This file is maintained for backward compatibility
# All permission classes are now in the permissions directory

from communities.permissions.community_permissions import IsCommunityAdminOrReadOnly, IsCommunityMember
from communities.permissions.post_permissions import IsPostAuthorOrCommunityAdminOrReadOnly
from communities.permissions.comment_permissions import IsCommentAuthorOrCommunityAdminOrReadOnly

# Export all permission classes for backward compatibility
__all__ = [
    'IsCommunityAdminOrReadOnly',
    'IsCommunityMember',
    'IsPostAuthorOrCommunityAdminOrReadOnly',
    'IsCommentAuthorOrCommunityAdminOrReadOnly',
] 