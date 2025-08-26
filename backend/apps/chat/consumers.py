from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Conversation, Message

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
      self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
      self.group_name = f"conv_{self.conversation_id}"
      await self.channel_layer.group_add(self.group_name, self.channel_name)
      await self.accept()

    async def disconnect(self, close_code):
      await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
      action = content.get("action")
      if action == "send":
        ciphertext = content.get("ciphertext")
        username = content.get("username")
        if not isinstance(ciphertext, str) or not isinstance(username, str):
          return
        message = await self._save_message(username, str(self.conversation_id), ciphertext)
        await self.channel_layer.group_send(self.group_name, {"type": "chat.message", "message": {
          "id": str(message.id),
          "ciphertext": message.ciphertext,
          "sender": message.sender.username,
          "created_at": message.created_at.isoformat(),
        }})

    async def chat_message(self, event):
      await self.send_json(event["message"])  # fan out

    @database_sync_to_async
    def _save_message(self, username, conversation_id, ciphertext):
      conv = Conversation.objects.get(id=conversation_id)
      user = User.objects.get(username=username)
      return Message.objects.create(conversation=conv, sender=user, ciphertext=ciphertext)
