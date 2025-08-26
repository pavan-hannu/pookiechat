from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login as dj_login, logout as dj_logout
from django.contrib.auth.models import User
from django.db.models import Q

@api_view(["POST"])  # username/password login (session auth)
@permission_classes([AllowAny])
def login(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")
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

@api_view(["POST"])  # simple registration (non-admin)
@permission_classes([AllowAny])
def register(request):
    username = request.data.get("username", "").strip().lower()
    password = request.data.get("password", "")
    if not username or not password:
        return Response({"error": "username and password required"}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({"error": "username taken"}, status=409)
    u = User.objects.create_user(username=username, password=password)
    return Response({"ok": True})

@api_view(["GET"])  # search users (pookies)
@permission_classes([IsAuthenticated])
def search_users(request):
    q = request.query_params.get("q", "").strip()
    qs = User.objects.all()
    if q:
        qs = qs.filter(Q(username__icontains=q))
    data = [{"username": u.username, "is_staff": u.is_staff} for u in qs[:50]]
    return Response(data)
