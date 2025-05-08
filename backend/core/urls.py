from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
import os
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from django.http import HttpResponse, JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework import status

# Import the community debug view and viewset
from communities.debug_views import debug_join_community, debug_urls, debug_community_members, debug_membership_status, route_debug
from communities.views import CommunityViewSet
from communities.models import Community
from communities.services.community_service import CommunityService

# Special view to debug API requests
@api_view(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
@csrf_exempt
def debug_api(request, path):
    print(f"DEBUG API: {request.method} request to {path}")
    print(f"DEBUG API: Content type: {request.content_type}")
    print(f"DEBUG API: Auth: {request.META.get('HTTP_AUTHORIZATION', 'No Auth')}")
    print(f"DEBUG API: Body: {request.body[:1000] if request.body else 'No body'}")
    print(f"DEBUG API: Data: {request.data}")
    
    return HttpResponse(
        f"Debug API ({request.method}): Path={path}, Auth Present={bool(request.META.get('HTTP_AUTHORIZATION'))}, Content-Type={request.content_type}",
        content_type="text/plain"
    )

# Direct implementation of the join community endpoint
@api_view(['POST'])
@csrf_exempt
def direct_join_community(request, slug):
    """Direct implementation of the join community endpoint"""
    print(f"DIRECT JOIN: Request to join community with slug: {slug}")
    
    if not request.user.is_authenticated:
        return JsonResponse({
            'detail': 'Authentication required'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        # Get the community directly
        community = Community.objects.get(slug=slug)
        print(f"DIRECT JOIN: Found community {community.name}")
        
        # Use the service layer to join the community
        membership, message = CommunityService.join_community(request.user, community)
        
        if membership:
            return JsonResponse({"detail": message}, status=status.HTTP_201_CREATED)
        else:
            return JsonResponse({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
    
    except Community.DoesNotExist:
        print(f"DIRECT JOIN: Community with slug '{slug}' not found")
        return JsonResponse({
            "detail": f"Community with slug '{slug}' not found"
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        print(f"DIRECT JOIN: Error joining community: {str(e)}")
        return JsonResponse({
            "detail": f"Error joining community: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Debug URL view to see all registered URLs
    path('api/debug/urls/', debug_urls, name='debug-urls'),
    
    # Debug endpoints for community operations
    path('api/debug/community/<slug:slug>/members/', debug_community_members, name='debug-community-members'),
    path('api/debug/community/<slug:slug>/membership_status/', debug_membership_status, name='debug-membership-status'),
    path('api/debug/community/<slug:slug>/join-debug/', debug_join_community, name='community-join-debug'),
    path('api/debug/community/<slug:slug>/join-direct/', direct_join_community, name='community-join-direct'),
    
    # New route debugging view
    path('api/debug/route/<path:path>', route_debug, name='route-debug'),
    
    # API routes
    path('api/', include('api.urls')),
    path('api/events/', include('events.urls')),
    path('api/users/', include('users.urls')),
    
    # Communities URLs included at the API root
    path('api/', include('communities.urls')),
    
    # Debug catch-all - must be after all other API routes
    path('api/debug/<path:path>', debug_api),
    
    # OpenAPI / Swagger docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Serve media files in dev
    path('media/<path:path>', serve, {
        'document_root': os.path.join(settings.BASE_DIR, 'media'),
    }),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
