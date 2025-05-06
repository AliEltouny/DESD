# events/apps.py

from django.apps import AppConfig

class EventsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'events'

    def ready(self):
        import events.signals  # ✅ Automatically connects signals when the app is ready
