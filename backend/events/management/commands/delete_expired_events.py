from django.core.management.base import BaseCommand
from django.utils import timezone
from events.models import Event

class Command(BaseCommand):
    help = "Delete events whose date_time has passed"

    def handle(self, *args, **options):
        now = timezone.now()
        expired_events = Event.objects.filter(date_time__lt=now)

        count = expired_events.count()
        expired_events.delete()

        self.stdout.write(self.style.SUCCESS(f"✅ Deleted {count} expired event(s)."))
