# This file is maintained for backward compatibility
# All serializers are now in the serializers directory

from communities.serializers.user_serializers import UserBasicSerializer
from communities.serializers.community_serializers import (
    CommunitySerializer, 
    CommunityDetailSerializer, 
    CommunityCreateSerializer
)
from communities.serializers.post_serializers import PostSerializer, PostDetailSerializer
from communities.serializers.comment_serializers import CommentSerializer
from communities.serializers.membership_serializers import MembershipSerializer
from communities.serializers.invitation_serializers import CommunityInvitationSerializer

# Export all serializers for backward compatibility
__all__ = [
    'UserBasicSerializer',
    'CommunitySerializer',
    'CommunityDetailSerializer',
    'CommunityCreateSerializer',
    'PostSerializer',
    'PostDetailSerializer',
    'CommentSerializer',
    'MembershipSerializer',
    'CommunityInvitationSerializer',
] 