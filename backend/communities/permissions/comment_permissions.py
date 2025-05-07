from rest_framework import permissions
from .base_permissions import BaseCommunityPermission


class IsCommentAuthorOrCommunityAdminOrReadOnly(BaseCommunityPermission):
    """
    Allow edit/delete for comment author or community admins, read-only for others.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if not request.user.is_authenticated:
            return False
        
        # Comment author can edit
        if obj.author == request.user:
            return True
        
        # Get the community from the comment's post
        community = self.get_community_from_object(obj)
        
        # Community admins/moderators can edit
        return self.is_community_admin(request.user, community) 