# notifications/management/commands/create_demo_notifications.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from notifications.models import Notification
import random
import time

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates demo notifications periodically for all users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=10,
            help='Interval between notifications in seconds (default: 10)'
        )
        
        parser.add_argument(
            '--count',
            type=int,
            default=100,
            help='Number of notifications to create before stopping (default: 100)'
        )

    def handle(self, *args, **options):
        interval = options['interval']
        count = options['count']
        
        messages = [
            'You joined "Tech Enthusiasts" community',
            'You have a new text message',
            'Your profile has been updated',
            'A new event is happening in "Tech Enthusiasts" community',
            'Your friend just updated their profile',
            'You received a new friend request',
            'New member joined the "Cooking Masters" community',
            'Event "AI and Robotics" just got updated',
            'Someone liked your profile',
            'You\'ve been mentioned in a community post',
        ]
        
        self.stdout.write(self.style.SUCCESS(f'Starting notification generator with {interval}s interval'))
        
        for i in range(count):
            users = User.objects.all()
            if not users.exists():
                self.stdout.write(self.style.WARNING('No users found. Exiting.'))
                break
                
            for user in users:
                message = random.choice(messages)
                notification = Notification.objects.create(
                    user=user,
                    message=message,
                    is_read=False
                    # user_email will be automatically set by the save() method
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Created notification {i+1}/{count} for {user.username}: {message}')
                )
            
            # Sleep for the specified interval
            if i < count - 1:  # Don't sleep after the last notification
                time.sleep(interval)
                
        self.stdout.write(self.style.SUCCESS('Finished creating demo notifications'))