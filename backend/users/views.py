from django.shortcuts import render, get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import User
from .serializers import UserProfileSerializer

# Create your views here.

@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_by_id(request, user_id):
    """
    Retrieve a user's profile by their ID.
    """
    user = get_object_or_404(User, id=user_id)
    serializer = UserProfileSerializer(user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_user_by_username(request, username):
    """
    Retrieve a user's profile by their username.
    """
    user = get_object_or_404(User, username=username)
    serializer = UserProfileSerializer(user)
    return Response(serializer.data)
