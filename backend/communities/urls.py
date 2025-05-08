from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter

# Import viewsets directly from views top-level package instead of from sub-modules
from .views import CommunityViewSet, PostViewSet, CommentViewSet, CommunityInvitationViewSet
from .views.event_post_views import join_event_post, leave_event_post

# Create a router with trailing slashes matching Django's preference
router = DefaultRouter(trailing_slash=True)
router.register(r'communities', CommunityViewSet, basename='community')
router.register(r'community-invitations', CommunityInvitationViewSet, basename='community-invitations')

# Create a nested router for posts within a community
community_router = NestedDefaultRouter(router, r'communities', lookup='community')
community_router.register(r'posts', PostViewSet, basename='community-posts')

# Create a nested router for comments within a post
post_router = NestedDefaultRouter(community_router, r'posts', lookup='post')
post_router.register(r'comments', CommentViewSet, basename='post-comments')

# Explicit paths for custom actions on CommunityViewSet
community_actions = [
    path('communities/<slug:slug>/join/', CommunityViewSet.as_view({'post': 'join'}), name='community-join'),
    path('communities/<slug:slug>/leave/', CommunityViewSet.as_view({'post': 'leave'}), name='community-leave'),
    path('communities/<slug:slug>/members/', CommunityViewSet.as_view({'get': 'members'}), name='community-members'),
    path('communities/<slug:slug>/membership_status/', CommunityViewSet.as_view({'get': 'membership_status'}), name='community-membership-status'),
    path('communities/<slug:slug>/invite/', CommunityViewSet.as_view({'post': 'invite'}), name='community-invite'),
    path('communities/<slug:slug>/analytics/', CommunityViewSet.as_view({'get': 'analytics'}), name='community-analytics'),
    path('communities/<slug:slug>/debug/', CommunityViewSet.as_view({'get': 'debug'}), name='community-debug'),
]

# Event post actions
event_post_actions = [
    path('communities/<slug:community_slug>/posts/<int:post_id>/join-event/', join_event_post, name='post-join-event'),
    path('communities/<slug:community_slug>/posts/<int:post_id>/leave-event/', leave_event_post, name='post-leave-event'),
]

urlpatterns = [
    # Community endpoints
    path('', include(router.urls)),
    path('', include(community_router.urls)),
    path('', include(post_router.urls)),
    # Add the explicit action paths
    path('', include(community_actions)),
    # Add event post actions
    path('', include(event_post_actions)),
]