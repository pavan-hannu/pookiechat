from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.models import User

@api_view(["GET"])  # whoami + profile
@permission_classes([IsAuthenticated])
def me(request):
    u: User = request.user
    p = u.profile
    return Response({
        "username": u.username,
        "is_staff": u.is_staff,
        "first_name": p.first_name,
        "last_name": p.last_name,
        "profile_visibility": p.profile_visibility,
        "settings": {"theme": p.theme, "avatarUrl": (request.build_absolute_uri(p.avatar.url) if p.avatar else "")},
    })

@api_view(["POST"])  # update settings (theme only)
@permission_classes([IsAuthenticated])
def update_settings(request):
    p = request.user.profile
    theme = request.data.get("theme")
    if theme in ("light", "dark"):
        p.theme = theme
    p.save()
    return Response({"ok": True})

@api_view(["POST"])  # update profile info
@permission_classes([IsAuthenticated])
def update_profile(request):
    p = request.user.profile
    first_name = request.data.get("first_name")
    last_name = request.data.get("last_name")
    profile_visibility = request.data.get("profile_visibility")

    if isinstance(first_name, str):
        p.first_name = first_name.strip()
    if isinstance(last_name, str):
        p.last_name = last_name.strip()
    if profile_visibility in ["public", "followers", "private"]:
        p.profile_visibility = profile_visibility

    p.save()
    return Response({"ok": True})

@api_view(["POST"])  # upload avatar
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_avatar(request):
    p = request.user.profile
    file = request.FILES.get("file")
    if not file:
        return Response({"error": "file required"}, status=400)
    p.avatar = file
    p.save()
    return Response({"ok": True, "avatarUrl": request.build_absolute_uri(p.avatar.url)})
