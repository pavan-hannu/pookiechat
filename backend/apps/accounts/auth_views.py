from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login as dj_login, logout as dj_logout
from django.contrib.auth.models import User
from django.db.models import Q
import re

def validate_username(username):
    """Only allow letters, numbers, dots, and single underscores"""
    if not re.match(r'^[a-zA-Z0-9._]+$', username):
        return False
    if '__' in username:  # No double underscores
        return False
    if username.startswith('.') or username.endswith('.'):
        return False
    if username.startswith('_') or username.endswith('_'):
        return False
    return True

@api_view(["POST"])  # username/password login (session auth)
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")

    # Check if user is blocked
    try:
        user = User.objects.get(username=username)
        if hasattr(user, 'profile') and user.profile.is_blocked:
            from datetime import timezone
            from django.utils import timezone as tz
            if user.profile.block_until and user.profile.block_until > tz.now():
                return Response({"ok": False, "error": f"Account temporarily blocked until {user.profile.block_until.strftime('%Y-%m-%d %H:%M')}. Reason: {user.profile.block_reason}"}, status=403)
            elif not user.profile.block_until:
                return Response({"ok": False, "error": f"Account blocked. Reason: {user.profile.block_reason}"}, status=403)
    except User.DoesNotExist:
        pass

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({"ok": False, "error": "invalid credentials"}, status=401)
    dj_login(request, user)
    return Response({"ok": True})

@api_view(["POST"])  # logout
@permission_classes([IsAuthenticated])
def logout(request):
    dj_logout(request)
    return Response({"ok": True})

@api_view(["POST"])  # registration with validation
@permission_classes([AllowAny])
def register(request):
    username = request.data.get("username", "").strip().lower()
    password = request.data.get("password", "")
    first_name = request.data.get("first_name", "").strip()
    last_name = request.data.get("last_name", "").strip()
    profile_visibility = request.data.get("profile_visibility", "public")

    if not username or not password:
        return Response({"error": "username and password required"}, status=400)

    if not validate_username(username):
        return Response({"error": "username can only contain letters, numbers, dots, and single underscores"}, status=400)

    if len(username) < 3 or len(username) > 30:
        return Response({"error": "username must be 3-30 characters"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"error": "username taken"}, status=409)

    if profile_visibility not in ["public", "followers", "private"]:
        profile_visibility = "public"

    u = User.objects.create_user(username=username, password=password)
    p = u.profile
    p.first_name = first_name
    p.last_name = last_name
    p.profile_visibility = profile_visibility
    p.save()

    return Response({"ok": True})

@api_view(["GET"])  # search users (pookies)
@permission_classes([IsAuthenticated])
def search_users(request):
    q = request.query_params.get("q", "").strip()
    qs = User.objects.select_related('profile').filter(profile__is_blocked=False)
    if q:
        qs = qs.filter(Q(username__icontains=q) | Q(profile__first_name__icontains=q) | Q(profile__last_name__icontains=q))
    data = [
        {
            "username": u.username,
            "is_staff": u.is_staff,
            "first_name": u.profile.first_name,
            "last_name": u.profile.last_name,
            "profile_visibility": u.profile.profile_visibility
        }
        for u in qs[:50]
    ]
    return Response(data)
