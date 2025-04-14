from rest_framework import serializers
from .models import Testimonial
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
            
        # Always use localhost:8000 regardless of the request host
        return f"http://localhost:8000{obj.image.url}"
    
    class Meta:
        model = Testimonial
        fields = ['id', 'name', 'role', 'university', 'content', 'image', 'image_url', 'created_at']
        read_only_fields = ['id', 'created_at'] 