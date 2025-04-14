from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType

from .models import Notification, NotificationPreference
from .serializers import (
    NotificationSerializer,
    NotificationPreferenceSerializer,
    MarkAsReadSerializer
)

class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet
):
    """ViewSet for handling user notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only the current user's notifications"""
        return self.request.user.notifications.all().order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread notifications"""
        unread_notifications = self.get_queryset().filter(is_read=False)
        page = self.paginate_queryset(unread_notifications)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(unread_notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        """Mark notifications as read"""
        serializer = MarkAsReadSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # Update notifications
        updated = request.user.notifications.filter(
            id__in=serializer.validated_data['ids']
        ).update(is_read=True)
        
        return Response(
            {"detail": f"{updated} notifications marked as read."},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read"""
        updated = request.user.notifications.filter(is_read=False).update(is_read=True)
        return Response(
            {"detail": f"{updated} notifications marked as read."},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def mark_single_as_read(self, request, pk=None):
        """Mark a single notification as read"""
        notification = get_object_or_404(Notification, id=pk, recipient=request.user)
        notification.mark_as_read()
        return Response(
            {"detail": "Notification marked as read."},
            status=status.HTTP_200_OK
        )


class NotificationPreferenceViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """ViewSet for handling user notification preferences"""
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        """Get or create notification preferences for the current user"""
        obj, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return obj