from django_cron import CronJobBase, Schedule
from django.utils import timezone
from .models import Event

class DeleteExpiredEventsCronJob(CronJobBase):
    RUN_EVERY_MINS = 60  # every hour

    schedule = Schedule(run_every_mins=RUN_EVERY_MINS)
    code = 'events.delete_expired_events'

    def do(self):
        now = timezone.now()
        expired = Event.objects.filter(date_time__lt=now)
        count = expired.count()
        expired.delete()
        print(f"Deleted {count} expired events.")
