from rest_framework import permissions
from .models import Membership


class IsCommunityAdminOrReadOnly(permissions.BasePermission):
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
        
        # Allow if user is admin or moderator
        if request.user.is_authenticated:
            return Membership.objects.filter(
                user=request.user,
                community=obj,
                role__in=['admin', 'moderator'],
                status='approved'
            ).exists()
        
        return False


class IsCommunityMember(permissions.BasePermission):
    """
    Allow access only to members of the community.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Get the community from either the object or from a community attribute
        if hasattr(obj, 'community'):
            community = obj.community
        else:
            community = obj
            
        # Check if user is the creator of the community
        if hasattr(community, 'creator') and community.creator == request.user:
            return True
            
        # Check if user is an approved member
        return Membership.objects.filter(
            user=request.user,
            community=community,
            status='approved'
        ).exists()


class IsPostAuthorOrCommunityAdminOrReadOnly(permissions.BasePermission):
    """
    Allow edit/delete for post author or community admins, read-only for others.
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
        
        # Post author can edit
        if obj.author == request.user:
            return True
        
        # Community admins/moderators can edit
        return Membership.objects.filter(
            user=request.user,
            community=obj.community,
            role__in=['admin', 'moderator'],
            status='approved'
        ).exists()


class IsCommentAuthorOrCommunityAdminOrReadOnly(permissions.BasePermission):
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
        
        # Community admins/moderators can edit
        return Membership.objects.filter(
            user=request.user,
            community=obj.post.community,
            role__in=['admin', 'moderator'],
            status='approved'
        ).exists() 