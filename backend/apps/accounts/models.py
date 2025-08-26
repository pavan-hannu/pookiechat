from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    theme = models.CharField(max_length=10, choices=[("light", "light"), ("dark", "dark")], default="light")

    def __str__(self):
        return f"Profile({self.user.username})"
