from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

from ..models import Post, Community
from .user_serializers import UserBasicSerializer


class PostSerializer(serializers.ModelSerializer):
    """Serializer for community posts"""
    author = UserBasicSerializer(read_only=True)
    comment_count = serializers.SerializerMethodField()
    upvote_count = serializers.SerializerMethodField()
    has_upvoted = serializers.SerializerMethodField()
    community = serializers.PrimaryKeyRelatedField(queryset=Community.objects.all(), required=False)
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'community', 'author', 'post_type',
            'event_date', 'event_location', 'image', 'file', 'is_pinned',
            'upvote_count', 'has_upvoted', 'comment_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_comment_count(self, obj):
        return obj.comment_count
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_upvote_count(self, obj):
        return obj.upvote_count
    
    @extend_schema_field(OpenApiTypes.BOOL)
    def get_has_upvoted(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return obj.upvotes.filter(id=user.id).exists()
        return False


class PostDetailSerializer(PostSerializer):
    """Detailed serializer for a single post with comments"""
    comments = serializers.SerializerMethodField()
    
    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['comments']
    
    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_comments(self, obj):
        from .comment_serializers import CommentSerializer
        # Get top-level comments only
        comments = obj.comments.filter(parent=None)
        serializer = CommentSerializer(comments, many=True, context=self.context)
        return serializer.data 