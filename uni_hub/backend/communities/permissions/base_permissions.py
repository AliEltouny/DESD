from rest_framework import permissions
from ..models import Membership


class BaseCommunityPermission(permissions.BasePermission):
    """
    Base permission class for community-related permissions with common functionality.
    """
    
    def is_community_admin(self, user, community):
        """Check if the user is an admin or moderator of the community."""
        if not user.is_authenticated:
            return False
            
        # Check if user is the creator of the community
        if hasattr(community, 'creator') and community.creator == user:
            return True
            
        # Check if user is an admin or moderator
        return Membership.objects.filter(
            user=user,
            community=community,
            role__in=['admin', 'moderator'],
            status='approved'
        ).exists()
    
    def is_community_member(self, user, community):
        """Check if the user is a member of the community."""
        if not user.is_authenticated:
            return False
            
        # Creator is always considered a member
        if hasattr(community, 'creator') and community.creator == user:
            return True
            
        # Check if user is an approved member
        return Membership.objects.filter(
            user=user,
            community=community,
            status='approved'
        ).exists()
        
    def get_community_from_object(self, obj):
        """Extract the community object from various object types."""
        if hasattr(obj, 'community'):
            return obj.community
        elif hasattr(obj, 'post') and hasattr(obj.post, 'community'):
            return obj.post.community
        else:
            return obj  # Assuming the object itself is a community 