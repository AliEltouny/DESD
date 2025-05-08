from rest_framework import serializers
from ..models import Membership
from .user_serializers import UserBasicSerializer


class MembershipSerializer(serializers.ModelSerializer):
    """Serializer for community memberships"""
    user = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = Membership
        fields = ['id', 'user', 'community', 'role', 'status', 'joined_at']
        read_only_fields = ['joined_at'] 