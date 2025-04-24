from rest_framework import serializers
from .models import Testimonial, Message, MessageGroup
from users.models import User
from django.conf import settings
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

class TestimonialSerializer(serializers.ModelSerializer):
    """Serializer for the Testimonial model"""
    
    # Add a SerializerMethodField for the absolute image URL
    image_url = serializers.SerializerMethodField()
    
    @extend_schema_field(OpenApiTypes.URI)
    def get_image_url(self, obj):
        """Get the absolute URL for the image"""
        if not obj.image:
            return None
            
        # Make sure the URL works both from browser and within containers
        # The frontend will handle URL conversion if needed
        return f"http://localhost:8000{obj.image.url}"
    
    class Meta:
        model = Testimonial
        fields = ['id', 'name', 'role', 'university', 'content', 'image', 'image_url', 'created_at']
        read_only_fields = ['id', 'created_at'] 

class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]

class MessageGroupSerializer(serializers.ModelSerializer):
    members = UserShortSerializer(many=True, read_only=True)
    class Meta:
        model = MessageGroup
        fields = ["id", "name", "members", "created_at", "updated_at"]

class MessageSerializer(serializers.ModelSerializer):
    sender = UserShortSerializer(read_only=True)
    recipient = UserShortSerializer(read_only=True)
    group_id = serializers.PrimaryKeyRelatedField(queryset=MessageGroup.objects.all(), write_only=True, source="group")
    group = MessageGroupSerializer(read_only=True)
    class Meta:
        model = Message
        fields = ["id", "sender", "recipient", "group_id", "group", "content", "created_at", "read"]