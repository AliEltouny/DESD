from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

from ..models import Post, Community
from .user_serializers import UserBasicSerializer


class PostSerializer(serializers.ModelSerializer):
    """Serializer for community posts"""
    author = UserBasicSerializer(read_only=True)
    comment_count = serializers.SerializerMethodField(read_only=True, required=False)
    upvote_count = serializers.SerializerMethodField(read_only=True, required=False)
    has_upvoted = serializers.SerializerMethodField(read_only=True, required=False)
    community = serializers.PrimaryKeyRelatedField(queryset=Community.objects.all(), required=False)
    participant_count = serializers.SerializerMethodField(read_only=True, required=False)
    has_joined = serializers.SerializerMethodField(read_only=True, required=False)
    is_full = serializers.SerializerMethodField(read_only=True, required=False)
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'community', 'author', 'post_type',
            'event_date', 'event_location', 'image', 'file', 'is_pinned',
            'upvote_count', 'has_upvoted', 'comment_count',
            'event_participant_limit', 'participant_count', 'has_joined', 'is_full',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']
        extra_kwargs = {
            'event_participant_limit': {'required': False},
        }
    
    def __init__(self, *args, **kwargs):
        # Don't fail on missing context
        super().__init__(*args, **kwargs)
        
        # Make all fields not required for patching
        if self.context.get('request') and self.context['request'].method in ['PATCH', 'POST']:
            for field in self.fields:
                if field not in ['title', 'content', 'post_type'] and not self.fields[field].read_only:
                    self.fields[field].required = False
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_comment_count(self, obj):
        return getattr(obj, 'comment_count', 0)
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_upvote_count(self, obj):
        return getattr(obj, 'upvote_count', 0)
    
    @extend_schema_field(OpenApiTypes.BOOL)
    def get_has_upvoted(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.upvotes.filter(id=request.user.id).exists()
        return False
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_participant_count(self, obj):
        """Get number of participants for event posts"""
        if hasattr(obj, 'event_participants') and obj.post_type == 'event':
            return obj.event_participants.count()
        return 0
    
    @extend_schema_field(OpenApiTypes.BOOL)
    def get_has_joined(self, obj):
        """Check if the current user has joined this event"""
        request = self.context.get('request')
        if (request and hasattr(request, 'user') and 
            request.user.is_authenticated and 
            obj.post_type == 'event' and
            hasattr(obj, 'event_participants')):
            return obj.event_participants.filter(id=request.user.id).exists()
        return False
    
    @extend_schema_field(OpenApiTypes.BOOL)
    def get_is_full(self, obj):
        """Check if the event has reached its participant limit"""
        if (obj.post_type == 'event' and 
            hasattr(obj, 'event_participant_limit') and 
            hasattr(obj, 'event_participants') and
            obj.event_participant_limit is not None):
            return obj.event_participants.count() >= obj.event_participant_limit
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