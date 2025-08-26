from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Follow, FriendRequest

@api_view(["POST"])  # follow
@permission_classes([IsAuthenticated])
def follow(request):
    target = request.data.get("username")
    try:
        u = User.objects.get(username=target)
        if u == request.user:
            return Response({"error": "cannot follow self"}, status=400)
        Follow.objects.get_or_create(follower=request.user, following=u)
        return Response({"ok": True})
    except User.DoesNotExist:
        return Response({"error": "not found"}, status=404)

@api_view(["POST"])  # unfollow
@permission_classes([IsAuthenticated])
def unfollow(request):
    target = request.data.get("username")
    try:
        u = User.objects.get(username=target)
        Follow.objects.filter(follower=request.user, following=u).delete()
        return Response({"ok": True})
    except User.DoesNotExist:
        return Response({"error": "not found"}, status=404)

@api_view(["POST"])  # send friend request
@permission_classes([IsAuthenticated])
def send_request(request):
    target = request.data.get("username")
    try:
        u = User.objects.get(username=target)
        if u == request.user:
            return Response({"error": "cannot request self"}, status=400)
        r, _ = FriendRequest.objects.get_or_create(sender=request.user, recipient=u, status="pending")
        return Response({"id": r.id, "ok": True})
    except User.DoesNotExist:
        return Response({"error": "not found"}, status=404)

@api_view(["POST"])  # accept/reject
@permission_classes([IsAuthenticated])
def decide_request(request, request_id):
    try:
        r = FriendRequest.objects.get(id=request_id, recipient=request.user)
        action = request.data.get("action")
        if action == "accept":
            r.status = "accepted"
            r.save()
            Follow.objects.get_or_create(follower=r.sender, following=r.recipient)
            Follow.objects.get_or_create(follower=r.recipient, following=r.sender)
        elif action == "reject":
            r.status = "rejected"
            r.save()
        else:
            return Response({"error": "invalid action"}, status=400)
        return Response({"ok": True})
    except FriendRequest.DoesNotExist:
        return Response({"error": "not found"}, status=404)
