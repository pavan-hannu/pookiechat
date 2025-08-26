from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = "Create initial admin user 'pookie' if not exists"

    def handle(self, *args, **options):
        if not User.objects.filter(username="pookie").exists():
            u = User.objects.create_superuser("pookie", "pookie@example.com", "pookie-admin-123")
            p = u.profile
            p.avatar_url = "https://api.dicebear.com/9.x/fun-emoji/svg?seed=pookie"
            p.theme = "light"
            p.save()
            self.stdout.write(self.style.SUCCESS("Created admin 'pookie' (password: pookie-admin-123)"))
        else:
            self.stdout.write("Admin 'pookie' already exists")
