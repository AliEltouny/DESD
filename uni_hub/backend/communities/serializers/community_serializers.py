from rest_framework import serializers
from django.db import transaction
from django.utils.text import slugify
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

from ..models import Community, Membership, CommunityInvitation, Post
from .user_serializers import UserBasicSerializer
from .post_serializers import PostSerializer


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
        return obj.posts.count()
    
    @extend_schema_field(OpenApiTypes.BOOL)
    def get_is_member(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            # Creator is always considered a member
            if obj.creator and obj.creator.id == user.id:
                return True
            return obj.members.filter(id=user.id).exists()
        return False
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_membership_status(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            # Creator is always considered approved
            if obj.creator and obj.creator.id == user.id:
                return 'approved'
            try:
                membership = Membership.objects.get(user=user, community=obj)
                return membership.status
            except Membership.DoesNotExist:
                pass
        return None
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_membership_role(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            # Creator is always considered admin
            if obj.creator and obj.creator.id == user.id:
                return 'admin'
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
    
    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_recent_posts(self, obj):
        posts = obj.posts.order_by('-is_pinned', '-created_at')[:5]
        serializer = PostSerializer(posts, many=True, context=self.context)
        return serializer.data
    
    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
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