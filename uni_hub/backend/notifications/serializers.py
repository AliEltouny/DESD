from rest_framework import serializers
from .models import Notification, NotificationPreference
from django.contrib.contenttypes.models import ContentType
from communities.models import Community, Post, Comment, CommunityInvitation
from communities.serializers import (
    CommunitySerializer,
    PostSerializer,
    CommentSerializer,
    CommunityInvitationSerializer
)

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    sender = serializers.SerializerMethodField()
    related_object = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'is_read', 'created_at', 'sender', 'related_object'
        ]
        read_only_fields = ['created_at']
    
    def get_sender(self, obj):
        if obj.sender:
            from communities.serializers import UserBasicSerializer
            return UserBasicSerializer(obj.sender).data
        return None
    
    def get_related_object(self, obj):
        if obj.content_object:
            if isinstance(obj.content_object, Community):
                return CommunitySerializer(obj.content_object).data
            elif isinstance(obj.content_object, Post):
                return PostSerializer(obj.content_object).data
            elif isinstance(obj.content_object, Comment):
                return CommentSerializer(obj.content_object).data
            elif isinstance(obj.content_object, CommunityInvitation):
                return CommunityInvitationSerializer(obj.content_object).data
        return None


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences"""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'community_invites', 'community_join_requests', 'community_updates',
            'community_new_posts', 'community_post_updates', 'post_upvotes',
            'comment_upvotes', 'comment_replies', 'mention_notifications',
            'email_community_invites', 'email_community_updates', 'email_engagement',
            'push_notifications'
        ]


class MarkAsReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read"""
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True
    )
    
    def validate_ids(self, value):
        """Validate that the notification IDs belong to the requesting user"""
        user = self.context['request'].user
        if not user.notifications.filter(id__in=value).exists():
            raise serializers.ValidationError(
                "Some notifications do not exist or don't belong to you."
            )
        return value