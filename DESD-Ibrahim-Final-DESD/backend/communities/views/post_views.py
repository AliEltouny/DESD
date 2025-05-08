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
        """Create a new post in a community with optimized performance"""
        try:
            # Validate required fields quickly without excessive logging
            required_fields = ['title', 'content', 'post_type']
            missing_fields = [field for field in required_fields if not request.data.get(field)]
            
            if missing_fields:
                return Response(
                    {field: ["This field is required."] for field in missing_fields},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get community from URL
            community_slug = self.kwargs.get('community_slug')
            
            # Try to get community from cache first
            from django.core.cache import cache
            cache_key = f"community:slug:{community_slug}"
            community = cache.get(cache_key)
            
            if not community:
                # If not in cache, get from database with select_related
                try:
                    community = Community.objects.select_related('creator').get(slug=community_slug)
                    # Cache the community for 5 minutes
                    cache.set(cache_key, community, 300)
                except Community.DoesNotExist:
                    return Response(
                        {"detail": f"Community with slug '{community_slug}' not found."},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Create serializer with request data
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Try to use bulk create if appropriate, otherwise fallback to single create
            if 'bulk' in request.query_params and request.query_params.get('bulk') == 'true' and 'posts' in request.data:
                posts = PostService.bulk_create_posts(
                    community=community,
                    user=request.user,
                    post_data_list=request.data.get('posts', [])
                )
                return Response(
                    PostSerializer(posts, many=True, context=self.get_serializer_context()).data,
                    status=status.HTTP_201_CREATED
                )
            else:
                # Standard single post creation
                # Validate user can create a post
                PostService.validate_post_creation(user=request.user, community=community)
                
                # Save the post with preassigned values for better performance
                post = serializer.save(author=request.user, community=community)
            
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except PermissionDenied as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            return Response(
                {"detail": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer, community=None):
        """Override to handle community assignments"""
        # If no community was passed to this method, get it from the URL
        if not community:
            community_slug = self.kwargs.get('community_slug')
            
            # Try to get from cache first
            from django.core.cache import cache
            cache_key = f"community:slug:{community_slug}"
            community = cache.get(cache_key)
            
            if not community:
                # If not in cache, get from database
                community = get_object_or_404(Community, slug=community_slug)
                # Cache the community for 5 minutes
                cache.set(cache_key, community, 300)
        
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
    
    @action(detail=False, methods=['get'])
    def debug_visibility(self, request, community_slug=None):
        """Debug endpoint to check post visibility filtering"""
        # Only allow in development environment
        from django.conf import settings
        if not settings.DEBUG:
            return Response(
                {"detail": "Debug endpoints are only available in development."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Get the community
        try:
            community = Community.objects.get(slug=community_slug)
        except Community.DoesNotExist:
            return Response(
                {"detail": f"Community with slug '{community_slug}' not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get user's membership status
        is_member = False
        is_admin = False
        membership_status = None
        
        if request.user.is_authenticated:
            from ..models import Membership
            try:
                membership = Membership.objects.get(
                    user=request.user,
                    community=community,
                    status='approved'
                )
                is_member = True
                is_admin = membership.role == 'admin'
                membership_status = membership.status
            except Membership.DoesNotExist:
                pass
        
        # Get all posts in the community
        all_posts = Post.objects.filter(community=community)
        
        # Get filtered posts using our service
        filtered_posts = PostService.get_post_queryset(
            user=request.user,
            community_slug=community_slug
        )
        
        # Count by visibility
        visibility_counts = {
            'public': all_posts.filter(visibility='public').count(),
            'members': all_posts.filter(visibility='members').count(),
            'admin': all_posts.filter(visibility='admin').count(),
        }
        
        # Count visible by visibility
        visible_counts = {
            'public': filtered_posts.filter(visibility='public').count(),
            'members': filtered_posts.filter(visibility='members').count(),
            'admin': filtered_posts.filter(visibility='admin').count(),
        }
        
        return Response({
            'user_id': request.user.id if request.user.is_authenticated else None,
            'is_authenticated': request.user.is_authenticated,
            'is_member': is_member,
            'is_admin': is_admin,
            'membership_status': membership_status,
            'total_posts': all_posts.count(),
            'visible_posts': filtered_posts.count(),
            'visibility_counts': visibility_counts,
            'visible_counts': visible_counts,
        })
    
    def retrieve(self, request, *args, **kwargs):
        """
        Get a specific post with visibility access check
        """
        try:
            # Get the post
            post = self.get_object()
            
            # Check visibility access
            user = request.user
            community = post.community
            
            # For unauthenticated users, only allow access to public posts in public communities
            if not user.is_authenticated:
                if post.visibility != 'public' or community.is_private:
                    return Response(
                        {"detail": "You don't have permission to access this post."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            else:
                # Get membership status
                from ..models import Membership
                try:
                    membership = Membership.objects.get(
                        user=user,
                        community=community,
                        status='approved'
                    )
                    is_member = True
                    is_admin = membership.role == 'admin'
                except Membership.DoesNotExist:
                    is_member = False
                    is_admin = False
                
                # User is not a member, only allow access to public posts in public communities
                if not is_member:
                    if post.visibility != 'public' or community.is_private:
                        return Response(
                            {"detail": "You don't have permission to access this post."},
                            status=status.HTTP_403_FORBIDDEN
                        )
                # User is a member but not an admin, allow access to public and members-only posts
                elif not is_admin and post.visibility == 'admin':
                    return Response(
                        {"detail": "This post is only visible to community admins."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # If we get here, the user has permission to view the post
            serializer = self.get_serializer(post)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {"detail": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 