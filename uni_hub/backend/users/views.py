from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from .models import User
from .serializers import UserProfileSerializer


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # Added parsers to handle multipart/form-data

    def perform_update(self, serializer):
        # Ensure no null values by setting default values for empty fields
        instance = serializer.save()
        if not instance.bio:
            instance.bio = "Not added"
        if not instance.address:
            instance.address = "Not added"
        if not instance.phone:
            instance.phone = "Not added"

        # Handle profile photo upload
        request = self.request
        if 'profile_photo' in request.FILES:
            instance.profile_photo = request.FILES['profile_photo']
        instance.save()
