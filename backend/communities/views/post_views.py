from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

import traceback

from ..models import Community, Post
from ..serializers import PostSerializer, PostDetailSerializer
from ..permissions import IsCommunityAdminOrReadOnly, IsPostAuthorOrCommunityAdminOrReadOnly
from ..services.post_service import PostService


@extend_schema_view(
    list=extend_schema(
        summary="List community posts",
        description="Retrieves all posts for a specific community with optional filtering.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community to get posts from",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(name="type", description="Filter by post type (announcement, event, question, discussion, resource)", type=OpenApiTypes.STR),
            OpenApiParameter(name="search", description="Search term to filter posts by title or content", type=OpenApiTypes.STR),
        ],
        responses={200: PostSerializer(many=True)}
    ),
    retrieve=extend_schema(
        summary="Get post details",
        description="Retrieves detailed information about a specific post.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id",
                description="The ID of the post to retrieve",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
        ],
        responses={200: PostDetailSerializer}
    ),
    create=extend_schema(
        summary="Create post",
        description="Creates a new post in the specified community.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community to create a post in",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
        ],
        request=PostSerializer,
        responses={201: PostSerializer}
    ),
    update=extend_schema(
        summary="Update post",
        description="Updates all fields of an existing post. Requires post author or admin privileges.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id",
                description="The ID of the post to update",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
        ],
        request=PostSerializer,
        responses={200: PostSerializer}
    ),
    partial_update=extend_schema(
        summary="Partial update post",
        description="Updates specific fields of an existing post. Requires post author or admin privileges.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id",
                description="The ID of the post to update",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
        ],
        request=PostSerializer,
        responses={200: PostSerializer}
    ),
    destroy=extend_schema(
        summary="Delete post",
        description="Deletes a post. Requires post author or admin privileges.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id",
                description="The ID of the post to delete",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
        ],
        responses={204: None}
    ),
)
class PostViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing community posts.
    
    Allows listing, creating, retrieving, updating, and deleting posts within a community.
    Includes special actions for upvoting and pinning posts.
    """
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsPostAuthorOrCommunityAdminOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PostDetailSerializer
        return PostSerializer
    
    def get_queryset(self):
        """Get filtered queryset using the service layer"""
        return PostService.get_post_queryset(
            user=self.request.user,
            community_slug=self.kwargs.get('community_slug'),
            post_type=self.request.query_params.get('type'),
            search=self.request.query_params.get('search')
        )
    
    def create(self, request, *args, **kwargs):
        """Override create to add detailed debugging and error handling"""
        try:
            # Log request details
            print(f"POST CREATE - REQUEST DATA: {request.data}")
            
            # Validate required fields
            required_fields = ['title', 'content', 'post_type']
            missing_fields = [field for field in required_fields if not request.data.get(field)]
            
            if missing_fields:
                return Response(
                    {field: ["This field is required."] for field in missing_fields},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get community from URL
            community_slug = self.kwargs.get('community_slug')
            print(f"Using community slug from URL: {community_slug}")
            
            # Get community from slug
            community = get_object_or_404(Community, slug=community_slug)
            print(f"Found community: {community.name} (ID: {community.id})")
            
            # Create serializer with request data
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print(f"POST CREATE - SERIALIZER ERRORS: {serializer.errors}")
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save the post directly without validation for non-event posts
            if request.data.get('post_type') != 'event':
                serializer.save(author=request.user, community=community)
                return Response(
                    serializer.data, 
                    status=status.HTTP_201_CREATED
                )
            else:
                # For event posts, use the perform_create method with permission checks
                self.perform_create(serializer, community)
                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED
                )
            
        except PermissionDenied as e:
            print(f"POST CREATE - PERMISSION ERROR: {str(e)}")
            return Response(
                {"detail": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            print(f"POST CREATE - UNEXPECTED ERROR: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"detail": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer, community=None):
        """Override to handle community assignments"""
        # If no community was passed to this method, get it from the URL
        if not community:
            community_slug = self.kwargs.get('community_slug')
            community = get_object_or_404(Community, slug=community_slug)
        
        # Validate user can create a post
        PostService.validate_post_creation(user=self.request.user, community=community)
        
        # Save the post
        serializer.save(author=self.request.user, community=community)
    
    @extend_schema(
        summary="Upvote post",
        description="Toggles an upvote on a post. If the user has already upvoted, the upvote is removed.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id",
                description="The ID of the post to upvote",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
        ],
        responses={
            200: OpenApiTypes.OBJECT,
            403: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                "Successful Upvote",
                value={"detail": "Post upvoted."},
                response_only=True,
                status_codes=["200"]
            ),
            OpenApiExample(
                "Upvote Removed",
                value={"detail": "Upvote removed."},
                response_only=True,
                status_codes=["200"]
            )
        ]
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def upvote(self, request, pk=None, community_slug=None):
        """Upvote a post"""
        post = self.get_object()
        user = request.user
        
        upvoted, message = PostService.toggle_post_upvote(post, user)
        
        return Response(
            {"detail": message},
            status=status.HTTP_200_OK if upvoted or not upvoted else status.HTTP_403_FORBIDDEN
        )
    
    @extend_schema(
        summary="Toggle pin status",
        description="Pins or unpins a post at the top of the community feed. Requires admin privileges.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id",
                description="The ID of the post to pin/unpin",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
        ],
        responses={
            200: OpenApiTypes.OBJECT
        },
        examples=[
            OpenApiExample(
                "Post Pinned",
                value={"detail": "Post pinned."},
                response_only=True,
                status_codes=["200"]
            ),
            OpenApiExample(
                "Post Unpinned",
                value={"detail": "Post unpinned."},
                response_only=True,
                status_codes=["200"]
            )
        ]
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsCommunityAdminOrReadOnly])
    def toggle_pin(self, request, pk=None, community_slug=None):
        """Pin or unpin a post"""
        post = self.get_object()
        
        pinned, message = PostService.toggle_post_pin(post)
        
        return Response(
            {"detail": message},
            status=status.HTTP_200_OK
        )
    
    @extend_schema(
        summary="Join event post",
        description="Join an event post as a participant",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id",
                description="The ID of the event post to join",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
        ],
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            403: OpenApiTypes.OBJECT
        }
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], url_path='join-event')
    def join_event(self, request, pk=None, community_slug=None):
        """Join an event post"""
        post = self.get_object()
        user = request.user
        
        # Validate this is an event post
        if post.post_type != 'event':
            return Response(
                {"detail": "This post is not an event."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is already a participant
        if post.event_participants.filter(id=user.id).exists():
            return Response(
                {"detail": "You are already a participant in this event."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if event is full
        if post.event_participant_limit and post.event_participants.count() >= post.event_participant_limit:
            return Response(
                {"detail": "This event is full."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add user to participants
        post.event_participants.add(user)
        
        return Response(
            {"detail": "You have successfully joined this event."},
            status=status.HTTP_200_OK
        )
    
    @extend_schema(
        summary="Leave event post",
        description="Leave an event post you previously joined",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id",
                description="The ID of the event post to leave",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
        ],
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            403: OpenApiTypes.OBJECT
        }
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], url_path='leave-event')
    def leave_event(self, request, pk=None, community_slug=None):
        """Leave an event post"""
        post = self.get_object()
        user = request.user
        
        # Validate this is an event post
        if post.post_type != 'event':
            return Response(
                {"detail": "This post is not an event."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is a participant
        if not post.event_participants.filter(id=user.id).exists():
            return Response(
                {"detail": "You are not a participant in this event."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove user from participants
        post.event_participants.remove(user)
        
        return Response(
            {"detail": "You have successfully left this event."},
            status=status.HTTP_200_OK
        )