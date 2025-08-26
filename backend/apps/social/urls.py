from django.urls import path
from . import views

urlpatterns = [
    path("follow/", views.follow),
    path("unfollow/", views.unfollow),
    path("friend-requests/", views.send_request),
    path("friend-requests/<int:request_id>/", views.decide_request),
]
