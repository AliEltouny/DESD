import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from .models import Message, MessageGroup
from .serializers import MessageSerializer

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        url_kwargs = self.scope['url_route']['kwargs']
        self.room_name = url_kwargs.get('room_name')
        self.group_id = url_kwargs.get('group_id')
        if self.room_name:
            self.room_group_name = f'chat_{self.room_name}'
        elif self.group_id:
            self.room_group_name = f'messages_{self.group_id}'
        else:
            await self.close()
            return
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            # Handle typing indicator messages
            if data.get('type') == 'typing':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': {
                            'type': 'typing',
                            'typing': data.get('typing', False),
                            'user_id': self.scope["user"].id
                        }
                    }
                )
                return

            # Get message content from different possible keys
            message_content = data.get('content')
            
            # Validate content is not empty
            if not message_content or not isinstance(message_content, str) or message_content.strip() == '':
                print(f"Invalid message content: {data}")
                return
                
            group_id = data.get('group_id')
            recipient_id = data.get('recipient_id')  # Optional, for DMs

            # Save message to DB using authenticated user as sender
            msg_obj = await self.save_message(recipient_id, group_id, message_content)
            serialized = await sync_to_async(lambda obj: MessageSerializer(obj).data)(msg_obj)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': serialized
                }
            )
        except Exception as e:
            print(f"Error processing message: {str(e)}")
            print(f"Message data: {text_data}")
            # Don't propagate the exception to prevent connection drops

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def save_message(self, recipient_id, group_id, content):
        if not content:
            raise ValueError("Message content cannot be empty")
            
        user_obj = self.scope["user"]
        sender = User.objects.get(pk=user_obj.pk)
        recipient = User.objects.get(id=recipient_id) if recipient_id else None
        group = MessageGroup.objects.get(id=group_id) if group_id else None
        
        return Message.objects.create(
            sender=sender, 
            recipient=recipient, 
            group=group, 
            content=content.strip()  # Ensure no leading/trailing whitespace
        )
