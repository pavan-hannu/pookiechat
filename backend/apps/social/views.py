from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Follow, FriendRequest
from .posts import Post

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

@api_view(["POST"])  # create post (text or image)
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_post(request):
    text = request.data.get("text", "")
    visibility = request.data.get("visibility", "public")
    image = request.FILES.get("image")
    p = Post(author=request.user, text=text, visibility=visibility)
    if image:
        p.image = image
    p.save()
    return Response({"id": p.id})

@api_view(["GET"])  # list posts honoring visibility
@permission_classes([IsAuthenticated])
def list_posts(request):
    user = request.user
    target = request.query_params.get("username")
    try:
        author = User.objects.get(username=target) if target else user
    except User.DoesNotExist:
        return Response({"error": "not found"}, status=404)

    qs = Post.objects.filter(author=author).order_by("-created_at")
    if author != user:
        is_follower = Follow.objects.filter(follower=user, following=author).exists()
        qs = qs.filter(Q(visibility="public") | (Q(visibility="followers") & Q(visibility__isnull=False) if is_follower else Q(pk__isnull=True)))
    data = [
        {
            "id": p.id,
            "author": p.author.username,
            "text": p.text,
            "imageUrl": (request.build_absolute_uri(p.image.url) if p.image else ""),
            "visibility": p.visibility,
            "reach_count": p.reach_count,
            "created_at": p.created_at.isoformat(),
        }
        for p in qs
    ]
    if author != user:
        for p in qs:
            p.reach_count = (p.reach_count or 0) + 1
            p.save(update_fields=["reach_count"])
    return Response(data)
