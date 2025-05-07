from django.urls import path
from .views import (
    EventListCreateView,
    EventDetailView,
    JoinEventView,
    LeaveEventView,
    MyEventsView,
)

app_name = "events"

urlpatterns = [
    # 🔹 List all visible events / Create new event
    path('', EventListCreateView.as_view(), name='list-create'),

    # 🔹 Retrieve, update, or delete a specific event
    path('<int:pk>/', EventDetailView.as_view(), name='detail'),

    # 🔹 Join a specific event
    path('<int:pk>/join/', JoinEventView.as_view(), name='join'),

    # 🔹 Leave a specific event
    path('<int:pk>/leave/', LeaveEventView.as_view(), name='leave'),

    # 🔹 List current user's joined events
    path('my/', MyEventsView.as_view(), name='my'),
]
