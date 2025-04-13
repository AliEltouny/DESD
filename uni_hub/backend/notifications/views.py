from rest_framework import generics
from rest_framework.permissions import IsAuthenticated  # Add this import
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

# List all notifications for the logged-in user
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]  # Now properly defined

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

# Mark notifications as read
class MarkNotificationsAsReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]  # Now properly defined

    def update(self, request, *args, **kwargs):
        notifications = Notification.objects.filter(user=request.user, is_read=False)
        updated_count = notifications.update(is_read=True)
        return Response({
            "status": "success",
            "message": f"Marked {updated_count} notifications as read"
        })

# Create notification view
class CreateNotificationView(generics.CreateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]  # Now properly defined

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# Add this view if you're using single notification marking
class MarkSingleNotificationAsRead(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]  # Now properly defined

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "Notification marked as read"})