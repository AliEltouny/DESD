from django.contrib import admin
from .models import Testimonial, Notification
import logging

logger = logging.getLogger(__name__)

# Register your models here.

@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('name', 'university', 'role', 'active', 'created_at')
    list_filter = ('active', 'university')
    search_fields = ('name', 'university', 'role', 'content')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'role', 'university', 'content')
        }),
        ('Image', {
            'fields': ('image',)
        }),
        ('Status', {
            'fields': ('active',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'text', 'is_read', 'created_at')  # Include 'id' in the list display
    list_filter = ('is_read', 'created_at')
    search_fields = ('text',)
