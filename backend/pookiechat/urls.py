from django.contrib import admin
from django.urls import path, include
from django.conf import settings

base_patterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.chat.urls")),
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.social.urls")),
]

if settings.DEBUG:
    from .dev_urls import urlpatterns as dev_patterns
    urlpatterns = dev_patterns
else:
    urlpatterns = base_patterns
