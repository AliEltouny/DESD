from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Community, Membership, Post, Comment, CommunityInvitation
from django.utils.text import slugify

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Simple user serializer for nested representations"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class MembershipSerializer(serializers.ModelSerializer):
    """Serializer for community memberships"""
    user = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = Membership
        fields = ['id', 'user', 'community', 'role', 'status', 'joined_at']
        read_only_fields = ['joined_at']


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments on posts"""
    author = UserBasicSerializer(read_only=True)
    reply_count = serializers.SerializerMethodField()
    upvote_count = serializers.SerializerMethodField()
    has_upvoted = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'content', 'parent', 
            'upvote_count', 'has_upvoted', 'reply_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_reply_count(self, obj):
        return obj.replies.count()
    
    def get_upvote_count(self, obj):
        return obj.upvotes.count()
    
    def get_has_upvoted(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return obj.upvotes.filter(id=user.id).exists()
        return False


class PostSerializer(serializers.ModelSerializer):
    """Serializer for community posts"""
    author = UserBasicSerializer(read_only=True)
    comment_count = serializers.SerializerMethodField()
    upvote_count = serializers.SerializerMethodField()
    has_upvoted = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'community', 'author', 'post_type',
            'event_date', 'event_location', 'image', 'file', 'is_pinned',
            'upvote_count', 'has_upvoted', 'comment_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']
    
    def get_comment_count(self, obj):
        return obj.comments.count()
    
    def get_upvote_count(self, obj):
        return obj.upvotes.count()
    
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
    
    def get_comments(self, obj):
        # Get top-level comments only
        comments = obj.comments.filter(parent=None)
        serializer = CommentSerializer(comments, many=True, context=self.context)
        return serializer.data


class CommunitySerializer(serializers.ModelSerializer):
    """Serializer for communities"""
    creator = UserBasicSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    post_count = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    membership_status = serializers.SerializerMethodField()
    membership_role = serializers.SerializerMethodField()
    
    class Meta:
        model = Community
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'category', 'tags', 'image', 'banner', 'creator',
            'rules', 'is_private', 'requires_approval',
            'member_count', 'post_count', 'is_member', 'membership_status', 'membership_role', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['slug', 'creator', 'created_at', 'updated_at']
    
    def get_member_count(self, obj):
        return obj.members.count()
    
    def get_post_count(self, obj):
        return obj.posts.count()
    
    def get_is_member(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return obj.members.filter(id=user.id).exists()
        return False
    
    def get_membership_status(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            try:
                membership = Membership.objects.get(user=user, community=obj)
                return membership.status
            except Membership.DoesNotExist:
                pass
        return None
    
    def get_membership_role(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            try:
                membership = Membership.objects.get(user=user, community=obj)
                return membership.role
            except Membership.DoesNotExist:
                pass
        return None


class CommunityDetailSerializer(CommunitySerializer):
    """Detailed serializer for a single community"""
    recent_posts = serializers.SerializerMethodField()
    admins = serializers.SerializerMethodField()
    
    class Meta(CommunitySerializer.Meta):
        fields = CommunitySerializer.Meta.fields + ['recent_posts', 'admins']
    
    def get_recent_posts(self, obj):
        posts = obj.posts.order_by('-is_pinned', '-created_at')[:5]
        serializer = PostSerializer(posts, many=True, context=self.context)
        return serializer.data
    
    def get_admins(self, obj):
        admin_memberships = obj.membership_set.filter(role__in=['admin', 'moderator'])
        admins = [membership.user for membership in admin_memberships]
        serializer = UserBasicSerializer(admins, many=True)
        return serializer.data


class CommunityCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new community"""
    
    class Meta:
        model = Community
        fields = [
            'name', 'description', 'short_description',
            'category', 'tags', 'image', 'banner',
            'rules', 'is_private', 'requires_approval'
        ]
    
    def validate_name(self, value):
        """
        Check that the community name doesn't already exist.
        This validation occurs before the slug is created, 
        so we need to validate against potential slug conflicts.
        """
        # Generate the slug that would be created
        slug = slugify(value)
        
        # Check if a community with this slug already exists
        if Community.objects.filter(slug=slug).exists():
            raise serializers.ValidationError(
                "A community with this or a similar name already exists. Please choose a different name."
            )
        return value
    
    def create(self, validated_data):
        user = self.context['request'].user
        
        # Convert string boolean values to actual booleans if needed
        if 'is_private' in validated_data and isinstance(validated_data['is_private'], str):
            validated_data['is_private'] = validated_data['is_private'].lower() == 'true'
            
        if 'requires_approval' in validated_data and isinstance(validated_data['requires_approval'], str):
            validated_data['requires_approval'] = validated_data['requires_approval'].lower() == 'true'
        
        # Create the community
        community = Community.objects.create(creator=user, **validated_data)
        
        return community


class CommunityInvitationSerializer(serializers.ModelSerializer):
    """Serializer for community invitations"""
    inviter = UserBasicSerializer(read_only=True)
    community_name = serializers.CharField(source='community.name', read_only=True)
    
    class Meta:
        model = CommunityInvitation
        fields = [
            'id', 'community', 'community_name', 'inviter', 
            'invitee_email', 'message', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['inviter', 'community_name', 'status', 'created_at', 'updated_at'] 