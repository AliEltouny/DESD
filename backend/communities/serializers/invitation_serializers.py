from rest_framework import serializers
from ..models import CommunityInvitation
from .user_serializers import UserBasicSerializer


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