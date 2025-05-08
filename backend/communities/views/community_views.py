from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import traceback
from django.db.utils import IntegrityError
from django.http import Http404

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample

from ..models import Community, Membership, CommunityInvitation, Post
from ..serializers import (
    CommunitySerializer, CommunityDetailSerializer, CommunityCreateSerializer,
    MembershipSerializer, CommunityInvitationSerializer, UserMembershipStatusSerializer
)
from ..permissions import IsCommunityAdminOrReadOnly, IsCommunityMember
from ..services.community_service import CommunityService

# Import views from separate modules
from .membership_views import MembershipViews # Keep for reference if needed, but remove inheritance
from .analytics_views import AnalyticsViews
from .invitation_views import InvitationViews


@extend_schema_view(
    list=extend_schema(
        summary="List Communities",
        description="Retrieves a list of available communities.",
        parameters=[
            OpenApiParameter(name="category", description="Filter by category", required=False, type=str),
            OpenApiParameter(name="search", description="Search term in name, description, and tags", required=False, type=str),
            OpenApiParameter(name="tag", description="Filter by specific tag", required=False, type=str),
            OpenApiParameter(name="member_of", description="If true, shows communities user is a member of", required=False, type=bool),
            OpenApiParameter(name="order_by", description="Order results by field", required=False, type=str, enum=["created_at", "name", "member_count"]),
        ],
    ),
    retrieve=extend_schema(
        summary="Get Community Details",
        description="Retrieves detailed information about a specific community.",
    ),
    create=extend_schema(
        summary="Create Community",
        description="Creates a new community.",
    ),
    update=extend_schema(
        summary="Update Community",
        description="Updates an existing community. Only community admins can perform this action.",
    ),
    partial_update=extend_schema(
        summary="Partially Update Community",
        description="Partially updates a community. Only community admins can perform this action.",
    ),
    destroy=extend_schema(
        summary="Delete Community",
        description="Deletes a community. Only community admins can perform this action.",
    ),
    join=extend_schema(
        summary="Join Community",
        description="Join a community. If the community requires approval, the membership will be pending.",
        responses={201: None, 400: None},
    ),
    leave=extend_schema(
        summary="Leave Community",
        description="Leave a community. If you are the only admin, you cannot leave.",
        responses={200: None, 400: None},
    ),
    members=extend_schema(
        summary="List Community Members",
        description="Get a list of members in a community.",
        parameters=[
            OpenApiParameter(name="role", description="Filter by role", required=False, type=str, enum=["admin", "moderator", "member"]),
            OpenApiParameter(name="limit", description="Number of results per page", required=False, type=int),
            OpenApiParameter(name="offset", description="Number of results to skip", required=False, type=int),
        ],
        responses={200: MembershipSerializer(many=True)}
    ),
    membership_status=extend_schema(
        summary="Get Membership Status",
        description="Retrieves the current user's membership status for this community.",
        responses={200: UserMembershipStatusSerializer}
    ),
)
@method_decorator(csrf_exempt, name='dispatch')
class CommunityViewSet(
    viewsets.ModelViewSet,
    # MembershipViews, # Remove inheritance
    AnalyticsViews,
    InvitationViews
):
    """ViewSet for handling community operations"""
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsCommunityAdminOrReadOnly]
    lookup_field = 'slug'  # Use slug in URL instead of primary key
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    # Define class-level actions dictionary to ensure actions are registered
    # DRF uses this to set up URL patterns 
    _actions = {
        'join': {'detail': True, 'methods': ['post']},
        'leave': {'detail': True, 'methods': ['post']},
        'members': {'detail': True, 'methods': ['get']},
        'membership_status': {'detail': True, 'methods': ['get']},
        'analytics': {'detail': True, 'methods': ['get']},
        'invite': {'detail': True, 'methods': ['post']},
    }
    
    @classmethod
    def register_custom_actions(cls):
        """Register custom actions for the router to use.
        This is called from urls.py after the router is created.
        """
        # This method is no longer needed with proper action decorators
        print("DRF automatically registers custom actions when proper decorators are used")
        
        # Get actions from class (should now be populated correctly)
        actions = getattr(cls, '_actions', {})
        print(f"Currently registered actions: {list(actions.keys())}")
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CommunityCreateSerializer
        if self.action == 'retrieve':
            return CommunityDetailSerializer
        return CommunitySerializer
    
    def get_object(self):
        """Override get_object to simplify community retrieval by slug"""
        # Get the slug from URL kwargs
        slug = self.kwargs.get('slug')
        if not slug:
            return None
        
        # Try to get from cache first
        from django.core.cache import cache
        import time
        
        start_time = time.time()
        cache_key = f"community:slug:{slug}"
        cached_obj = cache.get(cache_key)
        
        if cached_obj:
            print(f"CACHE HIT: Retrieved community {slug} from cache in {time.time() - start_time:.5f} seconds")
            # Skip permission checks for leave and join actions which have their own permission handling
            if self.action not in ['leave', 'join']:
                # Check object permissions
                self.check_object_permissions(self.request, cached_obj)
            return cached_obj
        
        print(f"CACHE MISS: Community {slug} not found in cache")
        db_lookup_start = time.time()
        
        # Directly lookup the community by slug
        try:
            # Use a direct lookup with select_related to prefetch related data
            obj = Community.objects.select_related('creator').get(slug=slug)
            db_lookup_time = time.time() - db_lookup_start
            print(f"DB LOOKUP: Retrieved community {slug} from database in {db_lookup_time:.5f} seconds")
            
            # Store in cache for future requests - 5 minutes
            cache.set(cache_key, obj, 300)
            
            # Skip permission checks for leave and join actions which have their own permission handling
            if self.action not in ['leave', 'join']:
                # Check object permissions
                self.check_object_permissions(self.request, obj)
            
            total_time = time.time() - start_time
            print(f"TOTAL LOOKUP: Community {slug} retrieved in {total_time:.5f} seconds")
            return obj
        except Community.DoesNotExist:
            raise Http404(f"No Community found with slug '{slug}'")
        except Exception as e:
            print(f"ERROR: Failed to retrieve community {slug}: {str(e)}")
            raise
    
    def create(self, request, *args, **kwargs):
        """Override create to add detailed debugging and error handling"""
        try:
            # Log request details
            print(f"REQUEST METHOD: {request.method}")
            print(f"REQUEST USER: {request.user.username if request.user.is_authenticated else 'Anonymous'}")
            print(f"REQUEST DATA: {request.data}")
            
            # Create serializer with request data
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print(f"SERIALIZER ERRORS: {serializer.errors}")
                # Return validation errors in a consistent format
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save the community - the serializer will handle setting the creator and creating membership
            try:
                community = serializer.save()
            except IntegrityError as ie:
                # Check if this is a duplicate membership error
                if 'communities_membership_user_id_community_id' in str(ie):
                    # The serializer already created the community but there was an issue with the membership
                    # Try to get the created community by name
                    community_name = request.data.get('name')
                    try:
                        community = Community.objects.get(name=community_name)
                        return Response(
                            CommunitySerializer(community, context=self.get_serializer_context()).data,
                            status=status.HTTP_201_CREATED
                        )
                    except Community.DoesNotExist:
                        # If we can't find the community, re-raise the original error
                        raise ie
                else:
                    # Other integrity error - re-raise
                    raise ie
            
            # Return the created community data
            return Response(
                CommunitySerializer(community, context=self.get_serializer_context()).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            print(f"ERROR IN CREATE: {str(e)}")
            print(traceback.format_exc())
            
            # Check if it's a duplicate key error
            if 'duplicate key' in str(e).lower() and 'communities_community_slug_key' in str(e).lower():
                return Response(
                    {"name": ["A community with this name already exists. Please choose a different name."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Return a generic error for other cases
            return Response(
                {"detail": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def get_queryset(self):
        """Get filtered queryset using the service layer"""
        return CommunityService.get_community_queryset(
            user=self.request.user,
            category=self.request.query_params.get('category'),
            search=self.request.query_params.get('search'),
            tag=self.request.query_params.get('tag'),
            member_of=self.request.query_params.get('member_of'),
            order_by=self.request.query_params.get('order_by', 'created_at')
        )
        
    @extend_schema(
        summary="Invite User",
        description="Invite a user to join the community via email.",
        request=CommunityInvitationSerializer,
        responses={201: None, 207: None},
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly], url_path='invite', url_name='invite')
    def invite(self, request, slug=None):
        """Invite a user to join the community"""
        community = self.get_object()
        
        serializer = CommunityInvitationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            success, message = CommunityService.invite_to_community(
                inviter=request.user,
                community=community,
                invitee_email=serializer.validated_data['invitee_email'],
                message=serializer.validated_data.get('message', ''),
                request=request
            )
            
            if success:
                return Response(
                    {"detail": message},
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {"detail": message},
                    status=status.HTTP_207_MULTI_STATUS
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # --- Explicit Membership Actions --- 

    @action(detail=True, methods=['post'], url_path='join', url_name='join', permission_classes=[IsAuthenticated])
    def join(self, request, slug=None):
        """Join a community"""
        community = self.get_object() # Get community instance based on slug
        
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        user = request.user
        membership, message = CommunityService.join_community(user, community)
        
        if membership:
            return Response({"detail": message}, status=status.HTTP_201_CREATED)
        else:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='leave', url_name='leave', permission_classes=[IsAuthenticated])
    def leave(self, request, slug=None):
        """Leave a community"""
        community = self.get_object()
        
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        user = request.user
        success, message = CommunityService.leave_community(user, community)
        
        if success:
            return Response({"detail": message}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], url_path='members', url_name='members')
    def members(self, request, slug=None):
        """Get community members"""
        try:
            # Get the community object
            community = self.get_object()
            
            # Get request parameters
            role = request.query_params.get('role')
            
            # Get pagination parameters
            limit = request.query_params.get('limit', None)
            offset = request.query_params.get('offset', None)
            
            # Use cached community members service
            memberships = CommunityService.get_community_members(community, role)
            
            # Get total count before pagination
            total_count = memberships.count()
            
            # Apply pagination if parameters provided
            if limit and offset:
                try:
                    limit = int(limit)
                    offset = int(offset)
                    paginated_memberships = memberships[offset:offset + limit]
                except (ValueError, TypeError):
                    return Response(
                        {"detail": "Invalid pagination parameters"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                paginated_memberships = memberships
            
            # Serialize the memberships
            serializer = MembershipSerializer(paginated_memberships, many=True, context=self.get_serializer_context())
            
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
            
            return Response(response_data)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # --- End Explicit Membership Actions ---
        
    # --- Membership Status Action --- 
    @action(detail=True, methods=['get'], url_path='membership_status', url_name='membership_status')
    def membership_status(self, request, slug=None):
        """Get the current user's membership status for this community."""
        try:
            # Get the community
            community = self.get_object()
            
            # If user is not authenticated, return a default response
            if not request.user.is_authenticated:
                return Response({
                    'is_member': False,
                    'status': None,
                    'role': None
                }, status=status.HTTP_200_OK)
            
            user = request.user
            
            # Cache key for membership status
            from django.core.cache import cache
            cache_key = f"membership_status:{community.id}:{user.id}"
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return Response(cached_data)
            
            # Creator is always considered admin member with approved status 
            if community.creator and community.creator.id == user.id:
                data = {
                    'is_member': True,
                    'status': 'approved',
                    'role': 'admin'
                }
                # Cache for 5 minutes
                cache.set(cache_key, data, 300)
                return Response(data)
            
            try:
                # Use select_related to reduce query count
                membership = Membership.objects.select_related('user', 'community').get(
                    community=community, 
                    user=user
                )
                data = {
                    'is_member': True,
                    'status': membership.status,
                    'role': membership.role
                }
                # Cache for 5 minutes
                cache.set(cache_key, data, 300)
                return Response(data)
            except Membership.DoesNotExist:
                # If no membership exists, return a specific status
                data = {
                    'is_member': False,
                    'status': None, 
                    'role': None 
                }
                # Cache for 5 minutes
                cache.set(cache_key, data, 300)
                return Response(data, status=status.HTTP_200_OK)
                
        except Exception as e:
            # Catch-all for any other errors
            return Response({
                'is_member': False,
                'status': None,
                'role': None,
                'error': str(e)
            }, status=status.HTTP_200_OK)
    
    # --- End Membership Status Action ---

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly], url_path='bulk-invite', url_name='bulk_invite')
    def bulk_invite(self, request, slug=None):
        """Bulk invite users to join the community"""
        community = self.get_object()
        
        # Get email list from request data
        invitee_emails = request.data.get('invitee_emails', [])
        message = request.data.get('message', '')
        
        if not invitee_emails or not isinstance(invitee_emails, list):
            return Response(
                {"detail": "A list of email addresses is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use bulk operation
        success_count, failed_emails = CommunityService.bulk_invite_to_community(
            inviter=request.user,
            community=community,
            invitee_emails=invitee_emails,
            message=message,
            request=request
        )
        
        # Return comprehensive response
        return Response({
            "detail": f"Processed {len(invitee_emails)} invitations. {success_count} sent successfully.",
            "success_count": success_count,
            "failed_emails": failed_emails
        }, status=status.HTTP_207_MULTI_STATUS)
        
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly], url_path='bulk-approve', url_name='bulk_approve')
    def bulk_approve(self, request, slug=None):
        """Bulk approve membership requests"""
        community = self.get_object()
        
        # Get user IDs from request data
        user_ids = request.data.get('user_ids', [])
        
        if not user_ids or not isinstance(user_ids, list):
            return Response(
                {"detail": "A list of user IDs is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use bulk operation
        success_count, error_count = CommunityService.bulk_handle_membership_requests(
            community=community,
            user_ids=user_ids,
            approve=True
        )
        
        # Return comprehensive response
        return Response({
            "detail": f"Processed {len(user_ids)} requests. {success_count} approved.",
            "success_count": success_count,
            "error_count": error_count
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly], url_path='safe-update', url_name='safe_update')
    def safe_update(self, request, slug=None):
        """Update a community with optimistic locking to prevent race conditions"""
        community = self.get_object()
        
        # Get update data from request
        update_data = request.data
        
        # Use optimistic locking service
        updated_community, error = CommunityService.update_community_with_lock(
            community_id=community.id,
            update_data=update_data,
            user=request.user
        )
        
        if error:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)
            
        # Return the updated community
        serializer = CommunitySerializer(updated_community, context=self.get_serializer_context())
        return Response(serializer.data)

    # ... existing invite action ... 