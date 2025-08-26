from django.db import models
from django.contrib.auth.models import User

class Post(models.Model):
    VIS_CHOICES = (("public", "public"), ("followers", "followers"), ("private", "private"))
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField(blank=True, default="")
    image = models.ImageField(upload_to="posts/", blank=True, null=True)
    visibility = models.CharField(max_length=10, choices=VIS_CHOICES, default="public")
    reach_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
