from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter

# Import viewsets directly from views top-level package instead of from sub-modules
from .views import CommunityViewSet, PostViewSet, CommentViewSet

# Create a router for the community endpoints with trailing slashes turned off
router = DefaultRouter(trailing_slash=False)
router.register(r'communities', CommunityViewSet)

# Create a nested router for posts within a community
community_router = NestedDefaultRouter(router, r'communities', lookup='community')
community_router.register(r'posts', PostViewSet, basename='community-posts')

# Create a nested router for comments within a post
post_router = NestedDefaultRouter(community_router, r'posts', lookup='post')
post_router.register(r'comments', CommentViewSet, basename='post-comments')

urlpatterns = [
    # Community endpoints
    path('', include(router.urls)),
    path('', include(community_router.urls)),
    path('', include(post_router.urls)),
] 