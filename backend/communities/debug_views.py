from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework import status
from rest_framework.response import Response

from .models import Community, Membership
from .serializers import MembershipSerializer
from .services.community_service import CommunityService

@api_view(['GET'])
@csrf_exempt
def debug_join_community(request, slug):
    """Debug view for joining a community"""
    if not request.user.is_authenticated:
        return JsonResponse({
            'detail': 'Authentication required'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        community = Community.objects.get(slug=slug)
        membership, message = CommunityService.join_community(request.user, community)
        
        return JsonResponse({
            'success': bool(membership),
            'message': message,
            'user_id': request.user.id,
            'community_id': community.id,
            'membership_id': membership.id if membership else None
        })
    except Community.DoesNotExist:
        return JsonResponse({
            'error': f'Community with slug "{slug}" not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@csrf_exempt
def debug_urls(request):
    """Debug view to list all registered URLs"""
    from django.urls import get_resolver, get_urlconf, URLPattern, URLResolver
    import re
    
    def collect_urls(resolver, parent_pattern=''):
        urls = []
        
        for pattern in resolver.url_patterns:
            if isinstance(pattern, URLResolver):
                # This is a URL resolver (includes other URL patterns)
                new_parent = parent_pattern + str(pattern.pattern)
                urls.extend(collect_urls(pattern, new_parent))
            else:
                # This is a URL pattern
                full_pattern = parent_pattern + str(pattern.pattern)
                name = getattr(pattern, 'name', None)
                view_name = pattern.callback.__name__ if hasattr(pattern.callback, '__name__') else str(pattern.callback)
                urls.append({
                    'pattern': full_pattern,
                    'name': name,
                    'view': view_name
                })
        return urls
    
    resolver = get_resolver(get_urlconf())
    
    # Collect all URLs and filter those related to members
    all_urls = collect_urls(resolver)
    member_related_urls = [u for u in all_urls if 'member' in u['pattern']]
    
    # Get communities from DB for debugging
    from .models import Community
    communities_in_db = list(Community.objects.values('id', 'name', 'slug'))
    
    return JsonResponse({
        'member_related_urls': member_related_urls,
        'communities_in_db': communities_in_db,
        'url_count': len(all_urls)
    })

@api_view(['GET'])
@csrf_exempt
def debug_community_members(request, slug):
    """Debug view to directly get community members without using viewset routing"""
    try:
        # Get the community
        try:
            community = Community.objects.get(slug=slug)
            print(f"DEBUG MEMBERS: Found community {community.name} (ID: {community.id})")
        except Community.DoesNotExist:
            return JsonResponse({
                'error': f'Community with slug "{slug}" not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get members with optional role filtering
        role = request.query_params.get('role')
        limit = request.query_params.get('limit')
        offset = request.query_params.get('offset')
        
        # Get memberships from service
        memberships = CommunityService.get_community_members(community, role)
        
        # Log what we found
        print(f"DEBUG MEMBERS: Found {memberships.count()} members for community {community.name}")
        
        # Get total count before pagination
        total_count = memberships.count()
        
        # Apply pagination if parameters provided
        if limit and offset:
            try:
                limit = int(limit)
                offset = int(offset)
                paginated_memberships = memberships[offset:offset + limit]
            except (ValueError, TypeError):
                return JsonResponse({
                    'error': 'Invalid pagination parameters'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            paginated_memberships = memberships
        
        # Serialize the memberships
        serializer = MembershipSerializer(paginated_memberships, many=True, context={'request': request})
        
        # Build response with pagination info
        response_data = {
            'count': total_count,
            'next': None,
            'previous': None,
            'results': serializer.data
        }
        
        # Add next/previous pagination URLs if appropriate
        if limit and offset:
            base_url = request.build_absolute_uri().split('?')[0]
            query_params = request.query_params.copy()
            
            # Next page link
            if offset + limit < total_count:
                query_params['offset'] = offset + limit
                query_params['limit'] = limit
                next_query = '&'.join([f"{k}={v}" for k, v in query_params.items()])
                response_data['next'] = f"{base_url}?{next_query}"
            
            # Previous page link
            if offset - limit >= 0:
                query_params['offset'] = max(0, offset - limit)
                query_params['limit'] = limit
                prev_query = '&'.join([f"{k}={v}" for k, v in query_params.items()])
                response_data['previous'] = f"{base_url}?{prev_query}"
        
        return JsonResponse(response_data)
    except Exception as e:
        import traceback
        print(f"DEBUG MEMBERS ERROR: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'error': f'An unexpected error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@csrf_exempt
def debug_membership_status(request, slug):
    """Debug view to get a user's membership status"""
    try:
        # Get the community
        try:
            community = Community.objects.get(slug=slug)
            print(f"DEBUG MEMBERSHIP STATUS: Found community {community.name} (ID: {community.id})")
        except Community.DoesNotExist:
            return JsonResponse({
                'error': f'Community with slug "{slug}" not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return JsonResponse({
                'is_member': False,
                'status': None,
                'role': None
            })
        
        # Try to get membership
        try:
            membership = Membership.objects.get(community=community, user=request.user)
            print(f"DEBUG MEMBERSHIP STATUS: Found membership for user {request.user.username}, role: {membership.role}, status: {membership.status}")
            return JsonResponse({
                'is_member': True,
                'status': membership.status,
                'role': membership.role
            })
        except Membership.DoesNotExist:
            print(f"DEBUG MEMBERSHIP STATUS: No membership found for user {request.user.username}")
            return JsonResponse({
                'is_member': False,
                'status': None,
                'role': None
            })
    except Exception as e:
        import traceback
        print(f"DEBUG MEMBERSHIP STATUS ERROR: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({
            'error': f'An unexpected error occurred: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@csrf_exempt
def route_debug(request, path):
    """Debug view to analyze how a request is routed"""
    from django.urls import resolve, Resolver404
    from django.urls.resolvers import get_resolver
    
    # Try to resolve the path
    full_path = f"/api/{path}"
    result = {
        'requested_path': full_path,
        'resolver_match': None,
        'view_function': None,
        'args': None,
        'kwargs': None,
        'url_name': None,
        'community_exists': False,
        'matching_patterns': []
    }
    
    # Try to get the resolver match
    try:
        match = resolve(full_path)
        result['resolver_match'] = str(match)
        result['view_function'] = match.func.__name__ if hasattr(match.func, '__name__') else str(match.func)
        result['args'] = match.args
        result['kwargs'] = match.kwargs
        result['url_name'] = match.url_name
    except Resolver404:
        result['resolver_match'] = "No match found"
    
    # Check if the community exists
    if 'communities/' in path and '/' in path:
        parts = path.split('/')
        for i, part in enumerate(parts):
            if parts[i-1] == 'communities' and i > 0:
                slug = part
                from .models import Community
                result['community_exists'] = Community.objects.filter(slug=slug).exists()
                if result['community_exists']:
                    community = Community.objects.get(slug=slug)
                    result['community_id'] = community.id
                    result['community_name'] = community.name
                break
    
    # Print all patterns that could match this path
    resolver = get_resolver()
    for pattern in resolver.url_patterns:
        pattern_str = str(pattern.pattern)
        if 'communities' in pattern_str:
            result['matching_patterns'].append({
                'pattern': pattern_str,
                'name': getattr(pattern, 'name', None),
                'lookup_str': getattr(pattern, 'lookup_str', None)
            })
    
    return JsonResponse(result)
