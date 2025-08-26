from django.urls import path
from . import views
from . import auth_views

urlpatterns = [
    path("me/", views.me),
    path("settings/", views.update_settings),
    path("accounts/avatar/", views.update_avatar),
    path("auth/login/", auth_views.login),
    path("auth/logout/", auth_views.logout),
    path("auth/register/", auth_views.register),
    path("users/search/", auth_views.search_users),
]
