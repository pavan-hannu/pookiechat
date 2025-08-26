from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    VISIBILITY_CHOICES = [
        ("public", "Public"),
        ("followers", "Followers Only"),
        ("private", "Private"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    theme = models.CharField(max_length=10, choices=[("light", "light"), ("dark", "dark")], default="light")
    first_name = models.CharField(max_length=50, blank=True, default="")
    last_name = models.CharField(max_length=50, blank=True, default="")
    profile_visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default="public")
    is_blocked = models.BooleanField(default=False)
    block_reason = models.TextField(blank=True, default="")
    block_until = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Profile({self.user.username})"
