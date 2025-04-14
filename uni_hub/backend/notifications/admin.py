from django.contrib import admin
from .models import Notification, NotificationPreference

class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'title', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('recipient__username', 'recipient__email', 'title', 'message')
    raw_id_fields = ('recipient', 'sender')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'

admin.site.register(Notification, NotificationAdmin)
admin.site.register(NotificationPreference)