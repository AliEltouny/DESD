from django.contrib import admin
from django.utils.html import format_html
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'date_of_birth', 'academic_year', 'bio', 'address', 'phone', 'is_active', 'is_superuser', 'profile_photo_display', 'interests', 'postal_code')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'interests', 'postal_code')
    list_filter = ('academic_year', 'is_active', 'is_superuser')
    ordering = ('username',)

    def profile_photo_display(self, obj):
        if obj.profile_photo:
            return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 50%;" />', obj.profile_photo.url)
        return "No Image"
    profile_photo_display.short_description = 'Profile Photo'
