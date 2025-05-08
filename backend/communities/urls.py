from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter

# Import viewsets directly from views top-level package instead of from sub-modules
from .views import CommunityViewSet, PostViewSet, CommentViewSet, CommunityInvitationViewSet

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

# Print registered URLs for debugging
all_urls = router.urls + community_router.urls + post_router.urls
print(f"Community API URLs: {len(all_urls)} routes registered")
for url in all_urls:
    if 'member' in str(url.pattern) or 'membership' in str(url.pattern):
        print(f"✅ MEMBER URL: {url.pattern}")

# Define the most important url patterns explicitly to ensure they work correctly
urlpatterns = [
    # Router-based URLs (include these first)
    path('', include(router.urls)),
    path('', include(community_router.urls)),
    path('', include(post_router.urls)),
    
    # Add explicit custom actions to ensure they're available
    re_path(r'^communities/(?P<slug>[^/.]+)/members/$', 
            CommunityViewSet.as_view({'get': 'members'}),
            name='community-members'),
            
    re_path(r'^communities/(?P<slug>[^/.]+)/membership_status/$', 
            CommunityViewSet.as_view({'get': 'membership_status'}),
            name='community-membership-status'),
            
    re_path(r'^communities/(?P<slug>[^/.]+)/join/$', 
            CommunityViewSet.as_view({'post': 'join'}),
            name='community-join'),
            
    re_path(r'^communities/(?P<slug>[^/.]+)/leave/$', 
            CommunityViewSet.as_view({'post': 'leave'}),
            name='community-leave'),
]

# Debug output of final URL patterns
print(f"Registered {len(urlpatterns)} URL patterns")