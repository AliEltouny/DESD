from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import traceback
from django.db.utils import IntegrityError

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
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CommunityCreateSerializer
        if self.action == 'retrieve':
            return CommunityDetailSerializer
        return CommunitySerializer
    
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
        # For retrieve actions or any detail action (getting a single community by slug), 
        # don't filter based on additional criteria to avoid 404s
        if self.action == 'retrieve' or self.action == 'debug' or \
           self.action == 'membership_status' or self.action == 'join' or \
           self.action == 'leave' or self.action == 'members' or \
           self.action == 'invite' or self.action == 'analytics':
            print(f"DETAIL ACTION ({self.action}) - Getting community with slug: {self.kwargs.get('slug')}")
            return Community.objects.all()
        
        # For list and other actions, use the service layer with filters
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
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly])
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

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def join(self, request, slug=None):
        """Join a community"""
        community = self.get_object() # Get community instance based on slug
        user = request.user
        
        membership, message = CommunityService.join_community(user, community)
        
        if membership:
            return Response({"detail": message}, status=status.HTTP_201_CREATED)
        else:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated]) # Using POST for leave as before
    def leave(self, request, slug=None):
        """Leave a community"""
        community = self.get_object()
        user = request.user
        
        success, message = CommunityService.leave_community(user, community)
        
        if success:
            return Response({"detail": message}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated]) # Simplified permission for now
    def members(self, request, slug=None):
        """Get community members"""
        community = self.get_object()
        role = request.query_params.get('role')
        
        memberships = CommunityService.get_community_members(community, role)
        
        serializer = MembershipSerializer(memberships, many=True, context=self.get_serializer_context())
        return Response(serializer.data)

    # --- End Explicit Membership Actions ---
        
    # --- Membership Status Action --- 
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def membership_status(self, request, slug=None):
        """Get the current user's membership status for this community."""
        community = self.get_object()
        user = request.user
        
        try:
            membership = Membership.objects.get(community=community, user=user)
            serializer = UserMembershipStatusSerializer(membership) # Use a dedicated serializer
            return Response(serializer.data)
        except Membership.DoesNotExist:
            # If no membership exists, return a specific status
            return Response({
                'is_member': False,
                'status': None, 
                'role': None 
            }, status=status.HTTP_200_OK) # Return 200 OK even if not a member
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # --- End Membership Status Action ---

    # --- Debug Action ---
    @action(detail=True, methods=['get'], permission_classes=[])
    def debug(self, request, slug=None):
        """Debug endpoint to help troubleshoot community retrieval issues."""
        try:
            print(f"DEBUG: Attempting to retrieve community with slug='{slug}'")
            
            # Check if the community exists directly in the database
            try:
                # Direct database query
                community_db = Community.objects.get(slug=slug)
                print(f"DEBUG: Community found directly in database: {community_db.name} (ID: {community_db.id})")
            except Community.DoesNotExist:
                print(f"DEBUG: Community with slug='{slug}' NOT FOUND in database")
                return Response({"detail": f"Community not found with slug='{slug}' (direct db query)"}, 
                                status=status.HTTP_404_NOT_FOUND)
            
            # Get using ViewSet's get_object method (which may apply filters)
            try:
                community = self.get_object()
                print(f"DEBUG: Community found via get_object(): {community.name} (ID: {community.id})")
            except Exception as e:
                print(f"DEBUG: Error in get_object(): {str(e)}")
                return Response({"detail": f"Error in get_object: {str(e)}"}, 
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Return successful debug info
            return Response({
                "message": "Debug info",
                "slug_received": slug,
                "community_name": community.name,
                "community_id": community.id,
                "community_data": CommunitySerializer(community, context=self.get_serializer_context()).data
            })
        except Exception as e:
            print(f"DEBUG: Unexpected exception: {str(e)}")
            print(traceback.format_exc())
            return Response({"detail": f"Unexpected error: {str(e)}"}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # --- End Debug Action ---