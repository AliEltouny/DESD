from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from ..models import Post, Comment
from ..serializers import CommentSerializer
from ..permissions import IsCommentAuthorOrCommunityAdminOrReadOnly
from ..services.comment_service import CommentService


@extend_schema_view(
    list=extend_schema(
        summary="List post comments",
        description="Retrieves all comments for a specific post with optional filtering for parent/reply comments.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="post_pk",
                description="The ID of the post to get comments from",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="parent", 
                description="Filter for replies to a specific comment. If not provided, returns only top-level comments.", 
                type=OpenApiTypes.INT
            ),
        ],
        responses={200: CommentSerializer(many=True)}
    ),
    retrieve=extend_schema(
        summary="Get comment details",
        description="Retrieves detailed information about a specific comment.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="post_pk",
                description="The ID of the post the comment belongs to",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id",
                description="The ID of the comment to retrieve",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
        ],
        responses={200: CommentSerializer}
    ),
    create=extend_schema(
        summary="Create comment",
        description="Creates a new comment on the specified post. Can be a top-level comment or a reply to another comment.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="post_pk",
                description="The ID of the post to comment on",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
        ],
        request=CommentSerializer,
        responses={201: CommentSerializer}
    ),
    update=extend_schema(
        summary="Update comment",
        description="Updates all fields of an existing comment. Requires comment author or admin privileges.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="post_pk",
                description="The ID of the post the comment belongs to",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id",
                description="The ID of the comment to update",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
        ],
        request=CommentSerializer,
        responses={200: CommentSerializer}
    ),
    partial_update=extend_schema(
        summary="Partial update comment",
        description="Updates specific fields of an existing comment. Requires comment author or admin privileges.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="post_pk",
                description="The ID of the post the comment belongs to",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id",
                description="The ID of the comment to update",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
        ],
        request=CommentSerializer,
        responses={200: CommentSerializer}
    ),
    destroy=extend_schema(
        summary="Delete comment",
        description="Deletes a comment. Requires comment author or admin privileges.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="post_pk",
                description="The ID of the post the comment belongs to",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id",
                description="The ID of the comment to delete",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
        ],
        responses={204: None}
    ),
)
class CommentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing comments on posts.
    
    Allows listing, creating, retrieving, updating, and deleting comments on posts.
    Supports nested comments (replies) and upvoting functionality.
    Filter top-level comments with no 'parent' parameter, or view replies by setting the 'parent' parameter.
    """
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsCommentAuthorOrCommunityAdminOrReadOnly]
    
    def get_queryset(self):
        """Get filtered queryset using the service layer"""
        return CommentService.get_comment_queryset(
            user=self.request.user,
            post_id=self.kwargs.get('post_pk'),
            parent_id=self.request.query_params.get('parent')
        )
    
    def perform_create(self, serializer):
        """Use service layer to validate and create a comment"""
        post_id = self.kwargs.get('post_pk')
        post = get_object_or_404(Post, id=post_id)
        
        # Get parent comment if one is specified
        parent_id = self.request.data.get('parent')
        parent = CommentService.validate_comment_creation(
            user=self.request.user,
            post=post,
            parent_id=parent_id
        )
        
        serializer.save(author=self.request.user, post=post, parent=parent)
    
    @extend_schema(
        summary="Upvote comment",
        description="Toggles an upvote on a comment. If the user has already upvoted, the upvote is removed.",
        parameters=[
            OpenApiParameter(
                name="community_slug",
                description="The unique slug of the community the post belongs to",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="post_pk",
                description="The ID of the post the comment belongs to",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH
            ),
            OpenApiParameter(
                name="id",
                description="The ID of the comment to upvote",
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
                value={"detail": "Comment upvoted."},
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
    def upvote(self, request, pk=None, post_pk=None, community_slug=None):
        """Upvote a comment"""
        comment = self.get_object()
        user = request.user
        
        upvoted, message = CommentService.toggle_comment_upvote(comment, user)
        
        return Response(
            {"detail": message},
            status=status.HTTP_200_OK if upvoted or not upvoted else status.HTTP_403_FORBIDDEN
        ) 