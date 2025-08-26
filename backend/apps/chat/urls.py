from django.urls import path
from . import views

urlpatterns = [
    path("conversations/", views.get_or_create_conversation),
    path("conversations/<uuid:conversation_id>/messages/", views.list_messages),
    path("conversations/<uuid:conversation_id>/messages/post/", views.post_message),
]
