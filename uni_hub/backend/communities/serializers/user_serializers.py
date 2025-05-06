from rest_framework import serializers
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Simple user serializer for nested representations"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name']
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}" 