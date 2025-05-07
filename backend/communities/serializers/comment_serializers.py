from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

from ..models import Comment, Post
from .user_serializers import UserBasicSerializer


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments on posts"""
    author = UserBasicSerializer(read_only=True)
    reply_count = serializers.SerializerMethodField()
    upvote_count = serializers.SerializerMethodField()
    has_upvoted = serializers.SerializerMethodField()
    post = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all(), required=False)
    
    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'content', 'parent', 
            'upvote_count', 'has_upvoted', 'reply_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_reply_count(self, obj):
        return obj.replies.count()
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_upvote_count(self, obj):
        return obj.upvote_count
    
    @extend_schema_field(OpenApiTypes.BOOL)
    def get_has_upvoted(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return obj.upvotes.filter(id=user.id).exists()
        return False 