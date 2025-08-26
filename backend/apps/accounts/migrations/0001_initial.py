# Generated manually for new Profile fields

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('avatar', models.ImageField(blank=True, null=True, upload_to='avatars/')),
                ('theme', models.CharField(choices=[('light', 'light'), ('dark', 'dark')], default='light', max_length=10)),
                ('first_name', models.CharField(blank=True, default='', max_length=50)),
                ('last_name', models.CharField(blank=True, default='', max_length=50)),
                ('profile_visibility', models.CharField(choices=[('public', 'Public'), ('followers', 'Followers Only'), ('private', 'Private')], default='public', max_length=10)),
                ('is_blocked', models.BooleanField(default=False)),
                ('block_reason', models.TextField(blank=True, default='')),
                ('block_until', models.DateTimeField(blank=True, null=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
