from rest_framework import serializers
from django.db import transaction
from django.utils.text import slugify
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from django.core.cache import cache

from ..models import Community, Membership, CommunityInvitation, Post
from .user_serializers import UserBasicSerializer
from .post_serializers import PostSerializer
from ..utils.cache import cached_method


class UserMembershipStatusSerializer(serializers.ModelSerializer):
    """Serializer specifically for returning the user's membership status."""
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Membership
        fields = ['is_member', 'status', 'role']
        read_only_fields = ['is_member', 'status', 'role']

    def get_is_member(self, obj):
        # If we are serializing a membership object, the user is a member.
        return True


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
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_member_count(self, obj):
        return obj.member_count
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_post_count(self, obj):
        # Use the cached count if available
        cache_key = f"community:post_count:{obj.id}"
        count = cache.get(cache_key)
        if count is None:
            count = obj.posts.count()
            # Cache for 5 minutes
            cache.set(cache_key, count, 300)
        return count
    
    @extend_schema_field(OpenApiTypes.BOOL)
    def get_is_member(self, obj):
        user = self.context.get('request').user
        if not user.is_authenticated:
            return False
            
        # Creator is always considered a member
        if obj.creator and obj.creator.id == user.id:
            return True
            
        # Use cache for membership check
        cache_key = f"community:is_member:{obj.id}:{user.id}"
        is_member = cache.get(cache_key)
        if is_member is None:
            is_member = obj.members.filter(id=user.id).exists()
            # Cache for 5 minutes
            cache.set(cache_key, is_member, 300)
        return is_member
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_membership_status(self, obj):
        user = self.context.get('request').user
        if not user.is_authenticated:
            return None
            
        # Creator is always considered approved
        if obj.creator and obj.creator.id == user.id:
            return 'approved'
            
        # Use cache for membership status
        cache_key = f"community:membership_status:{obj.id}:{user.id}"
        status = cache.get(cache_key)
        if status is None:
            try:
                membership = Membership.objects.get(user=user, community=obj)
                status = membership.status
            except Membership.DoesNotExist:
                status = None
            # Cache for 5 minutes
            cache.set(cache_key, status, 300)
        return status
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_membership_role(self, obj):
        user = self.context.get('request').user
        if not user.is_authenticated:
            return None
            
        # Creator is always considered admin
        if obj.creator and obj.creator.id == user.id:
            return 'admin'
            
        # Use cache for membership role
        cache_key = f"community:membership_role:{obj.id}:{user.id}"
        role = cache.get(cache_key)
        if role is None:
            try:
                membership = Membership.objects.get(user=user, community=obj)
                role = membership.role
            except Membership.DoesNotExist:
                role = None
            # Cache for 5 minutes
            cache.set(cache_key, role, 300)
        return role


class CommunityDetailSerializer(CommunitySerializer):
    """Detailed serializer for a single community"""
    recent_posts = serializers.SerializerMethodField()
    admins = serializers.SerializerMethodField()
    
    class Meta(CommunitySerializer.Meta):
        fields = CommunitySerializer.Meta.fields + ['recent_posts', 'admins']
    
    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_recent_posts(self, obj):
        cache_key = f"community:recent_posts:{obj.id}"
        data = cache.get(cache_key)
        if data is None:
            posts = obj.posts.order_by('-is_pinned', '-created_at')[:5]
            serializer = PostSerializer(posts, many=True, context=self.context)
            data = serializer.data
            # Cache for 3 minutes
            cache.set(cache_key, data, 180)
        return data
    
    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_admins(self, obj):
        cache_key = f"community:admins:{obj.id}"
        data = cache.get(cache_key)
        if data is None:
            admin_memberships = obj.membership_set.filter(role__in=['admin', 'moderator'])
            admins = [membership.user for membership in admin_memberships]
            serializer = UserBasicSerializer(admins, many=True)
            data = serializer.data
            # Cache for 5 minutes
            cache.set(cache_key, data, 300)
        return data


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
        
        # Use transaction to ensure atomicity
        with transaction.atomic():
            # Create the community
            community = Community.objects.create(creator=user, **validated_data)
            
            # Create admin membership for the creator if it doesn't exist
            Membership.objects.get_or_create(
                user=user,
                community=community,
                defaults={'role': 'admin', 'status': 'approved'}
            )
            
            return community 