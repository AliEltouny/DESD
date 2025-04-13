# admin.py
from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'message', 'is_read', 'created_at')  # Changed from 'user' to 'user_email'
    list_filter = ('is_read',)
    search_fields = ('message', 'user_email')  # Changed from 'user__username' to 'user_email'