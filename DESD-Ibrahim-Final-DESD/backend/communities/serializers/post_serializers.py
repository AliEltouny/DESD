from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from django.core.cache import cache

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
            'created_at', 'updated_at', 'tags', 'visibility'
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_comment_count(self, obj):
        """Get comment count efficiently using the cached value"""
        # Use the cached value if available
        if hasattr(obj, 'comment_count_cache') and obj.comment_count_cache > 0:
            return obj.comment_count_cache
        
        # Try to get from cache
        cache_key = f"post:comment_count:{obj.id}"
        cached_count = cache.get(cache_key)
        if cached_count is not None:
            return cached_count
        
        # Calculate and cache
        count = obj.comments.count()
        cache.set(cache_key, count, 300)  # Cache for 5 minutes
        
        # Update the model cache field for future use
        if count != obj.comment_count_cache:
            obj.comment_count_cache = count
            obj.save(update_fields=['comment_count_cache'])
            
        return count
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_upvote_count(self, obj):
        """Get upvote count efficiently using the cached value"""
        # Use the cached value if available
        if hasattr(obj, 'upvote_count_cache') and obj.upvote_count_cache > 0:
            return obj.upvote_count_cache
        
        # Try to get from cache
        cache_key = f"post:upvote_count:{obj.id}"
        cached_count = cache.get(cache_key)
        if cached_count is not None:
            return cached_count
        
        # Calculate and cache
        count = obj.upvotes.count()
        cache.set(cache_key, count, 300)  # Cache for 5 minutes
        
        # Update the model cache field for future use
        if count != obj.upvote_count_cache:
            obj.upvote_count_cache = count
            obj.save(update_fields=['upvote_count_cache'])
            
        return count
    
    @extend_schema_field(OpenApiTypes.BOOL)
    def get_has_upvoted(self, obj):
        """Check if current user has upvoted with caching"""
        user = self.context.get('request').user
        if not user.is_authenticated:
            return False
        
        # Try to get from cache
        cache_key = f"post:has_upvoted:{obj.id}:{user.id}"
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        # Check database and cache result
        result = obj.upvotes.filter(id=user.id).exists()
        cache.set(cache_key, result, 300)  # Cache for 5 minutes
        return result


class PostDetailSerializer(PostSerializer):
    """Detailed serializer for a single post with comments"""
    comments = serializers.SerializerMethodField()
    
    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['comments']
    
    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_comments(self, obj):
        from .comment_serializers import CommentSerializer
        # Use efficient comment fetching with caching
        cache_key = f"post:top_comments:{obj.id}"
        cached_comments = cache.get(cache_key)
        
        if cached_comments is not None:
            return cached_comments
        
        # Get top-level comments only with optimization
        comments = obj.comments.filter(parent=None).select_related('author')
        serializer = CommentSerializer(comments, many=True, context=self.context)
        serialized_data = serializer.data
        
        # Cache the serialized data for 2 minutes (shorter due to comment volatility)
        cache.set(cache_key, serialized_data, 120)
        
        return serialized_data 