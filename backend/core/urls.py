from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
import os
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse, JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework import status

# Import the community debug view and viewset
from communities.debug_views import debug_join_community
from communities.views import CommunityViewSet
from communities.models import Community, Membership
from communities.services.community_service import CommunityService

# Super simple test view with no dependencies
@api_view(['GET'])
def test_endpoint(request):
    """Simple test endpoint to check if API is working"""
    return JsonResponse({
        "status": "success",
        "message": "Test endpoint is working"
    })

# Super simple membership status check
@api_view(['GET'])
def test_membership_ftlofg(request):
    """Hardcoded test for ftlofg community membership"""
    try:
        # Get specific community directly
        community = Community.objects.get(slug='ftlofg')
        
        # If not authenticated, return default response
        if not request.user.is_authenticated:
            return JsonResponse({
                'status': 'error',
                'code': 401,
                'message': 'Authentication required'
            }, status=401)
        
        # Try to get membership
        try:
            membership = Membership.objects.get(community=community, user=request.user)
            return JsonResponse({
                'status': 'success',
                'is_member': True,
                'membership_status': membership.status,
                'membership_role': membership.role
            })
        except Membership.DoesNotExist:
            return JsonResponse({
                'status': 'success',
                'is_member': False,
                'membership_status': None,
                'membership_role': None
            })
    except Community.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'code': 404,
            'message': 'Community not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'code': 500,
            'message': f'Server error: {str(e)}'
        }, status=500)

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

# Direct test endpoint for membership status
@api_view(['GET'])
@permission_classes([IsAuthenticated])
@csrf_exempt
def direct_membership_status(request, slug):
    """Direct implementation of the membership status endpoint"""
    print(f"DIRECT MEMBERSHIP STATUS: Request for community with slug: {slug}")
    print(f"DIRECT MEMBERSHIP STATUS: User: {request.user.username} (ID: {request.user.id})")
    
    try:
        # Get the community directly
        community = Community.objects.get(slug=slug)
        print(f"DIRECT MEMBERSHIP STATUS: Found community {community.name} (ID: {community.id})")
        
        # Check if the user is a member
        try:
            membership = Membership.objects.get(community=community, user=request.user)
            print(f"DIRECT MEMBERSHIP STATUS: Found membership with status: {membership.status}, role: {membership.role}")
            return JsonResponse({
                'is_member': True,
                'status': membership.status,
                'role': membership.role
            })
        except Membership.DoesNotExist:
            print(f"DIRECT MEMBERSHIP STATUS: No membership found for user")
            return JsonResponse({
                'is_member': False,
                'status': None,
                'role': None
            })
        
    except Community.DoesNotExist:
        print(f"DIRECT MEMBERSHIP STATUS: Community with slug '{slug}' not found")
        return JsonResponse({
            "detail": f"Community with slug '{slug}' not found"
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        print(f"DIRECT MEMBERSHIP STATUS: Error checking membership: {str(e)}")
        return JsonResponse({
            "detail": f"Error checking membership: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Basic test endpoints
    path('api/test/', test_endpoint, name='test-endpoint'),
    path('api/test_ftlofg/', test_membership_ftlofg, name='test-ftlofg'),
    
    # Special direct debug endpoint for community join
    path('api/communities/<slug:slug>/join_debug/', debug_join_community, name='community-join-debug'),
    
    # Use our direct implementation instead of CommunityViewSet
    path('api/communities/<slug:slug>/join/', direct_join_community, name='community-join-direct'),
    
    # Direct community debug
    path('api/communities/<slug:slug>/direct_debug/', lambda request, slug: 
         JsonResponse({
             "debug_info": "Direct debug endpoint",
             "slug": slug,
             "found": Community.objects.filter(slug=slug).exists(),
             "community_data": {
                 "name": Community.objects.get(slug=slug).name if Community.objects.filter(slug=slug).exists() else None,
                 "id": Community.objects.get(slug=slug).id if Community.objects.filter(slug=slug).exists() else None
             } if Community.objects.filter(slug=slug).exists() else {}
         }),
         name='community-direct-debug'),
         
    # Direct membership status endpoint
    path('api/communities/<slug:slug>/direct_membership_status/', direct_membership_status, name='community-direct-membership-status'),
    
    # API routes
    path('api/', include('api.urls')),
    path('api/events/', include('events.urls')),
    path('api/users/', include('users.urls')),
    
    # Communities URLs included at the API root with explicit namespace
    path('api/', include(('communities.urls', 'communities'))),
    
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
