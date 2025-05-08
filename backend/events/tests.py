from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from datetime import timedelta
from django.contrib.auth import get_user_model

from communities.models import Community, Membership
from events.models import Event, EventParticipant

User = get_user_model()

class EventTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_user(
            email='admin@example.com', username='admin',
            first_name='Admin', last_name='One', password='adminpass'
        )
        self.member = User.objects.create_user(
            email='member@example.com', username='member',
            first_name='Member', last_name='Two', password='memberpass'
        )
        self.stranger = User.objects.create_user(
            email='stranger@example.com', username='stranger',
            first_name='Stranger', last_name='Three', password='strangerpass'
        )

        # Community
        self.community = Community.objects.create(name="Test Club", description="A club for testing", creator=self.admin)
        Membership.objects.create(user=self.member, community=self.community, role='member', status='approved')

        self.authenticate(self.admin.email, 'adminpass')

    def authenticate(self, email, password):
        """Authenticate user and set JWT token for APIClient"""
        response = self.client.post('/api/login/', {'email': email, 'password': password})
        self.assertEqual(response.status_code, 200)
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_create_public_event(self):
        """Admin can create a public event"""
        response = self.client.post(reverse('events:list-create'), {
            "title": "Public Event",
            "description": "For all",
            "date_time": (timezone.now() + timedelta(days=1)).isoformat(),
            "location": "Auditorium",
            "is_private": False
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Event.objects.count(), 1)

    def test_create_private_event_as_admin(self):
        """Admin can create a private event linked to their community"""
        response = self.client.post(reverse('events:list-create'), {
            "title": "Private Event",
            "description": "For members only",
            "date_time": (timezone.now() + timedelta(days=1)).isoformat(),
            "location": "Club Room",
            "is_private": True,
            "community": self.community.id
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_private_event_as_stranger_fails(self):
        """Stranger cannot create private event in a community they don't manage"""
        self.authenticate(self.stranger.email, 'strangerpass')
        response = self.client.post(reverse('events:list-create'), {
            "title": "Hacked Event",
            "description": "Unauthorized",
            "date_time": (timezone.now() + timedelta(days=1)).isoformat(),
            "location": "Hidden",
            "is_private": True,
            "community": self.community.id
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_event_with_past_date_fails(self):
        """Creating event in the past should fail"""
        response = self.client.post(reverse('events:list-create'), {
            "title": "Time Travel",
            "description": "Oops",
            "date_time": (timezone.now() - timedelta(days=1)).isoformat(),
            "location": "Yesterday",
            "is_private": False
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_join_public_event(self):
        """Anyone can join public events"""
        event = Event.objects.create(
            title="Public Access",
            description="Free for all",
            date_time=timezone.now() + timedelta(days=1),
            location="Main Hall",
            is_private=False,
            created_by=self.admin
        )
        self.authenticate(self.stranger.email, 'strangerpass')
        response = self.client.post(reverse('events:join', args=[event.id]))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(EventParticipant.objects.filter(user=self.stranger, event=event).exists())

    def test_join_private_event_as_member(self):
        """Approved community members can join private events"""
        event = Event.objects.create(
            title="Club Meeting",
            description="For members",
            date_time=timezone.now() + timedelta(days=1),
            location="Room 202",
            is_private=True,
            community=self.community,
            created_by=self.admin
        )
        self.authenticate(self.member.email, 'memberpass')
        response = self.client.post(reverse('events:join', args=[event.id]))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_join_private_event_as_stranger_fails(self):
        """Non-members cannot join private events"""
        event = Event.objects.create(
            title="Secret Meet",
            description="Restricted",
            date_time=timezone.now() + timedelta(days=1),
            location="Vault",
            is_private=True,
            community=self.community,
            created_by=self.admin
        )
        self.authenticate(self.stranger.email, 'strangerpass')
        response = self.client.post(reverse('events:join', args=[event.id]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_join_twice(self):
        """User cannot join the same event more than once"""
        event = Event.objects.create(
            title="Join Once",
            description="Single entry",
            date_time=timezone.now() + timedelta(days=1),
            location="Room A",
            is_private=False,
            created_by=self.admin
        )
        EventParticipant.objects.create(user=self.member, event=event)
        self.authenticate(self.member.email, 'memberpass')
        response = self.client.post(reverse('events:join', args=[event.id]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_leave_event(self):
        """Joined users can leave events"""
        event = Event.objects.create(
            title="Leave Me",
            description="Temporary",
            date_time=timezone.now() + timedelta(days=1),
            location="Garden",
            is_private=False,
            created_by=self.admin
        )
        EventParticipant.objects.create(user=self.member, event=event)
        self.authenticate(self.member.email, 'memberpass')
        response = self.client.post(reverse('events:leave', args=[event.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(EventParticipant.objects.filter(user=self.member, event=event).exists())

    def test_cannot_leave_event_not_joined(self):
        """Should fail if user tries to leave an event they never joined"""
        event = Event.objects.create(
            title="Ghost Leave",
            description="No entry",
            date_time=timezone.now() + timedelta(days=1),
            location="Space",
            is_private=False,
            created_by=self.admin
        )
        self.authenticate(self.member.email, 'memberpass')
        response = self.client.post(reverse('events:leave', args=[event.id]))
        self.assertEqual(response.status_code, 400)
