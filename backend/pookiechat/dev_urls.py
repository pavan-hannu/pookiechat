from django.conf import settings
from django.conf.urls.static import static
from .urls import urlpatterns as base

urlpatterns = base + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
