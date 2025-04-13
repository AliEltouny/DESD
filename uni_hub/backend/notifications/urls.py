from django.urls import path
from .views import (
    NotificationListView,
    CreateNotificationView,
    MarkNotificationsAsReadView,
    MarkSingleNotificationAsRead
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),  # GET /api/notifications/
    path('create/', CreateNotificationView.as_view(), name='create-notification'),  # POST /api/notifications/create/
    path('mark-read/', MarkNotificationsAsReadView.as_view(), name='mark-notifications-read'),  # PATCH /api/notifications/mark-read/
    path('<int:pk>/read/', MarkSingleNotificationAsRead.as_view(), name='mark-single-read'),  # PATCH /api/notifications/<id>/read/
]