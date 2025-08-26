from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

@api_view(["POST"])  # create/get conversation between two usernames
@permission_classes([IsAuthenticated])
def get_or_create_conversation(request):
    usernames = request.data.get("usernames", [])
    if not isinstance(usernames, list) or len(usernames) != 2:
        return Response({"error": "provide two usernames"}, status=400)
    users = list(User.objects.filter(username__in=usernames))
    if len(users) != 2:
        return Response({"error": "users not found"}, status=404)
    # naive conversation fetch
    conv = Conversation.objects.filter(participants=users[0]).filter(participants=users[1]).first()
    if not conv:
        conv = Conversation.objects.create()
        conv.participants.add(*users)
    return Response(ConversationSerializer(conv).data)

@api_view(["GET"])  # list messages
@permission_classes([IsAuthenticated])
def list_messages(request, conversation_id):
    conv = get_object_or_404(Conversation, id=conversation_id)
    if not conv.participants.filter(id=request.user.id).exists():
        return Response({"error": "forbidden"}, status=403)
    data = MessageSerializer(conv.messages.all(), many=True).data
    return Response(data)

@api_view(["POST"])  # post encrypted message
@permission_classes([IsAuthenticated])
def post_message(request, conversation_id):
    conv = get_object_or_404(Conversation, id=conversation_id)
    if not conv.participants.filter(id=request.user.id).exists():
        return Response({"error": "forbidden"}, status=403)
    ciphertext = request.data.get("ciphertext")
    if not isinstance(ciphertext, str):
        return Response({"error": "ciphertext required"}, status=400)
    m = Message.objects.create(conversation=conv, sender=request.user, ciphertext=ciphertext)
    return Response(MessageSerializer(m).data)
