from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from .models import Community
from .services.community_service import CommunityService

@api_view(['POST'])
@csrf_exempt
def debug_join_community(request, slug):
    print(f'DEBUG JOIN: Received request to join {slug}')
    try:
        community = Community.objects.get(slug=slug)
        print(f'DEBUG JOIN: Found community {community.name}')
        if request.user.is_authenticated:
            print(f'DEBUG JOIN: User authenticated as {request.user.username}')
            membership, message = CommunityService.join_community(request.user, community)
            if membership:
                return JsonResponse({'detail': message}, status=201)
            else:
                return JsonResponse({'detail': message}, status=400)
        else:
            print('DEBUG JOIN: User not authenticated')
            return JsonResponse({'detail': 'Authentication required'}, status=401)
    except Community.DoesNotExist:
        print(f'DEBUG JOIN: Community with slug {slug} not found')
        return JsonResponse({'detail': f'Community with slug {slug} not found'}, status=404)
    except Exception as e:
        print(f'DEBUG JOIN: Error - {str(e)}')
        return JsonResponse({'detail': str(e)}, status=500)
