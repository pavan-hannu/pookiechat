from django.db import models
from django.contrib.auth.models import User
from uuid import uuid4

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    participants = models.ManyToManyField(User, related_name="conversations")
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    ciphertext = models.TextField()  # store encrypted
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
