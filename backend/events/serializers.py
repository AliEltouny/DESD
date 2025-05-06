from rest_framework import serializers
from django.utils import timezone
from users.models import User
from communities.models import Community, Membership
from .models import Event, EventParticipant


class EventSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and listing events.
    """
    created_by = serializers.StringRelatedField(read_only=True)
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
        # Handle image deletion if null is passed
        if 'image' in validated_data and validated_data['image'] is None:
            instance.image.delete(save=False)
        return super().update(instance, validated_data)


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
