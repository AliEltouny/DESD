from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.views import APIView
from .utils.email import send_event_join_confirmation
from django.core.mail import send_mail
from django.conf import settings

from .models import Event, EventParticipant
from .serializers import (
    EventSerializer,
    JoinEventSerializer,
    MyEventSerializer,
)
from .permissions import IsEventCreator, IsCommunityMember
from communities.models import Membership


class EventListCreateView(generics.ListCreateAPIView):
    """
    GET: List all public events and private events user has access to.
    POST: Create a new event (public or private).
    """
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            Event.objects.select_related('community', 'created_by').filter(
                is_private=False
            ) |
            Event.objects.select_related('community', 'created_by').filter(
                is_private=True,
                community__members=user
            ) |
            Event.objects.select_related('community', 'created_by').filter(
                is_private=True,
                community__creator=user
            )
        ).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        community = serializer.validated_data.get("community")

        # If the event is linked to a community, verify user is the creator (or admin/mod)
        if community:
            if community.creator != user:
                raise PermissionDenied("Only the community creator can create events for this community.")

        serializer.save(created_by=user)


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET: Any authenticated user can view public events.
    PUT/PATCH/DELETE: Only the creator can modify/delete.
    """
    queryset = Event.objects.select_related('community', 'created_by')
    serializer_class = EventSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]  # Allow all authenticated users to view
        return [permissions.IsAuthenticated(), IsEventCreator()]  # Only creator can edit/delete

    def perform_destroy(self, instance):
        # Fetch participants before deletion
        participants = EventParticipant.objects.filter(event=instance).select_related("user")
        subject = f"❌ Event Cancelled: {instance.title}"

        for participant in participants:
            user = participant.user
            if not user.email:
                continue

            message = (
                f"Hi {user.first_name or user.username},\n\n"
                f"We regret to inform you that the event you joined has been cancelled:\n\n"
                f"🗓 Title: {instance.title}\n"
                f"📅 Date & Time: {instance.date_time.strftime('%Y-%m-%d %H:%M')}\n"
                f"📍 Location: {instance.location}\n\n"
                f"We apologize for any inconvenience caused.\n\n"
                f"Best regards,\nUniHub Team"
            )

            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )

        # Now delete the event
        super().perform_destroy(instance)


class JoinEventView(APIView):
    """
    POST: Join an event if permitted.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            raise NotFound("Event not found.")

        serializer = JoinEventSerializer(
            data={'event': event.id},
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # ✅ Send confirmation email
        send_event_join_confirmation(request.user, event)

        return Response({"detail": "Successfully joined the event."}, status=status.HTTP_201_CREATED)


class LeaveEventView(APIView):
    """
    POST: Leave an event you have previously joined.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            raise NotFound("Event not found.")

        participation = EventParticipant.objects.filter(
            event=event,
            user=request.user
        ).first()

        if not participation:
            return Response(
                {"detail": "You are not a participant of this event."},
                status=status.HTTP_400_BAD_REQUEST
            )

        participation.delete()
        return Response({"detail": "You have left the event."}, status=status.HTTP_200_OK)


class MyEventsView(generics.ListAPIView):
    """
    GET: List all events the current user has joined.
    """
    serializer_class = MyEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EventParticipant.objects.filter(
            user=self.request.user
        ).select_related('event', 'event__community', 'event__created_by')
