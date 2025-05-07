from rest_framework import permissions
from communities.models import Membership, Community
from .models import Event


class IsEventCreator(permissions.BasePermission):
    """
    Custom permission to only allow the creator of an event to edit or delete it.
    """
    def has_object_permission(self, request, view, obj: Event):
        return obj.created_by == request.user


class IsCommunityAdmin(permissions.BasePermission):
    """
    Allows access only to users who are creators, admins, or moderators of a community.
    Assumes a 'community' field is present in request.data or view.kwargs.
    """
    def has_permission(self, request, view):
        user = request.user
        community_id = request.data.get("community") or view.kwargs.get("community_id")

        if not user.is_authenticated or not community_id:
            return False

        try:
            community = Community.objects.get(pk=community_id)
        except Community.DoesNotExist:
            return False

        return (
            community.creator == user or
            Membership.objects.filter(
                user=user,
                community=community,
                role__in=['admin', 'moderator'],
                status='approved'
            ).exists()
        )


class IsCommunityMember(permissions.BasePermission):
    """
    Allows access only to approved members of a community for private events.
    Public events are accessible to all authenticated users.
    """
    def has_object_permission(self, request, view, obj: Event):
        user = request.user

        if not obj.is_private:
            return True  # Public event: allow all

        return (
            obj.community.creator == user or
            Membership.objects.filter(
                user=user,
                community=obj.community,
                status='approved'
            ).exists()
        )
