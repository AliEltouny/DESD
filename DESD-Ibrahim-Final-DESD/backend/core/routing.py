from channels.auth import AuthMiddlewareStack
from channels.routing import URLRouter
from django.urls import path
from api.consumers import ChatConsumer

websocket_urlpatterns = [
    path('ws/chat/<str:room_name>/', ChatConsumer.as_asgi()),
    path('ws/messages/<int:group_id>/', ChatConsumer.as_asgi()),
]
