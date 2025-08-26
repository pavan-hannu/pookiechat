from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User

@api_view(["GET"])  # whoami + profile
@permission_classes([IsAuthenticated])
def me(request):
    u: User = request.user
    p = u.profile
    return Response({
        "username": u.username,
        "is_staff": u.is_staff,
        "settings": {"theme": p.theme, "avatarUrl": p.avatar_url},
    })

@api_view(["POST"])  # update settings
@permission_classes([IsAuthenticated])
def update_settings(request):
    p = request.user.profile
    theme = request.data.get("theme")
    avatar = request.data.get("avatarUrl")
    if theme in ("light", "dark"):
        p.theme = theme
    if isinstance(avatar, str):
        p.avatar_url = avatar
    p.save()
    return Response({"ok": True})
