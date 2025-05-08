from rest_framework import serializers
from django.utils import timezone
from users.models import User
from communities.models import Community, Membership
from .models import Event, EventParticipant
from users.serializers import UserSerializer 
from django.core.mail import send_mail
from django.conf import settings


class EventSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and listing events.
    """
    created_by = UserSerializer(read_only=True)
    participant_count = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    community = serializers.PrimaryKeyRelatedField(
        queryset=Community.objects.all(),
        required=False
    )
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'image', 'date_time', 'location',
            'participant_limit', 'participant_count', 'is_full',
            'is_private', 'is_canceled', 'created_by', 'community',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'created_by', 'participant_count', 'is_full',
            'created_at', 'updated_at'
        ]

    def get_participant_count(self, obj):
        return obj.participant_count

    def get_is_full(self, obj):
        return obj.is_full

    def validate_date_time(self, value):
        """
        Ensure the event is scheduled in the future.
        """
        if value <= timezone.now():
            raise serializers.ValidationError("Event date must be in the future.")
        return value

    def validate(self, data):
        """
        Validate community admin status for private events.
        """
        user = self.context.get('request').user

        if data.get('is_private'):
            community = data.get('community')
            if not community:
                raise serializers.ValidationError("Private events must be linked to a community.")

            is_admin = (
                community.creator == user or
                Membership.objects.filter(
                    user=user,
                    community=community,
                    role__in=['admin', 'moderator'],
                    status='approved'
                ).exists()
            )
            if not is_admin:
                raise serializers.ValidationError("Only community admins can create private events.")

        return data

    def create(self, validated_data):
        validated_data['created_by'] = self.context.get('request').user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Save original values before update
        original = {
            "title": instance.title,
            "description": instance.description,
            "date_time": instance.date_time,
            "location": instance.location,
        }

        # Handle image deletion if null
        if 'image' in validated_data and validated_data['image'] is None:
            instance.image.delete(save=False)

        updated_instance = super().update(instance, validated_data)

        # Check if important fields changed
        has_changed = any(
            original[field] != getattr(updated_instance, field)
            for field in original
        )

        if has_changed:
            self.send_update_emails(updated_instance)

        return updated_instance

    def send_update_emails(self, event):
        participants = EventParticipant.objects.filter(event=event).select_related("user")
        subject = f"📢 Event Updated: {event.title}"

        for participant in participants:
            user = participant.user
            if not user.email:
                continue

            message = (
                f"Hi {user.first_name or user.username},\n\n"
                f"The event you joined has been updated. Here are the new details:\n\n"
                f"🗓 Title: {event.title}\n"
                f"📅 Date & Time: {event.date_time.strftime('%Y-%m-%d %H:%M')}\n"
                f"📍 Location: {event.location}\n\n"
                f"📖 Description:\n{event.description}\n\n"
                f"You can view this event at: {settings.FRONTEND_URL}/events/{event.id}\n\n"
                f"Thank you,\nUniHub Team"
            )

            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )


class JoinEventSerializer(serializers.ModelSerializer):
    """
    Serializer for joining an event.
    """

    class Meta:
        model = EventParticipant
        fields = ['event']

    def validate(self, attrs):
        user = self.context.get('request').user
        event = attrs['event']

        if event.is_canceled:
            raise serializers.ValidationError("This event has been canceled.")
        if event.is_full:
            raise serializers.ValidationError("This event has reached its participant limit.")

        if event.is_private:
            if not event.community:
                raise serializers.ValidationError("Private event is missing a community.")

            is_member = Membership.objects.filter(
                user=user,
                community=event.community,
                status='approved'
            ).exists()

            if not is_member and event.community.creator != user:
                raise serializers.ValidationError("You must be a member of this community to join.")

        if EventParticipant.objects.filter(event=event, user=user).exists():
            raise serializers.ValidationError("You have already joined this event.")

        return attrs

    def create(self, validated_data):
        return EventParticipant.objects.create(
            user=self.context.get('request').user,
            **validated_data
        )


class MyEventSerializer(serializers.ModelSerializer):
    """
    Serializer for listing a user's joined events.
    """
    event = EventSerializer(read_only=True)

    class Meta:
        model = EventParticipant
        fields = ['id', 'event', 'joined_at']
