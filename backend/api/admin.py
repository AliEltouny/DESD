from django.contrib import admin
from .models import Testimonial

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
