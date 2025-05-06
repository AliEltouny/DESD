from rest_framework import permissions
from .base_permissions import BaseCommunityPermission


class IsCommunityAdminOrReadOnly(BaseCommunityPermission):
    """
    Allow full access to community admins/moderators, read-only for others.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Get the community from the object
        community = self.get_community_from_object(obj)
        
        # Check if user is admin/moderator
        return self.is_community_admin(request.user, community)


class IsCommunityMember(BaseCommunityPermission):
    """
    Allow access only to members of the community.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Get the community from the object
        community = self.get_community_from_object(obj)
        
        # Check if user is a member
        return self.is_community_member(request.user, community) 