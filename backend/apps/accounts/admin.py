from django.contrib import admin
from django.contrib.auth.models import User
from .models import Profile
from django.utils import timezone

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "first_name", "last_name", "profile_visibility", "is_blocked", "block_until", "theme")
    list_filter = ("is_blocked", "profile_visibility", "theme")
    search_fields = ("user__username", "first_name", "last_name")
    readonly_fields = ("user",)

    fieldsets = (
        ("User Info", {
            "fields": ("user", "first_name", "last_name", "profile_visibility")
        }),
        ("Settings", {
            "fields": ("theme", "avatar")
        }),
        ("Moderation", {
            "fields": ("is_blocked", "block_reason", "block_until"),
            "classes": ("collapse",)
        })
    )

    actions = ["block_users", "unblock_users", "temp_block_1_day", "temp_block_7_days"]

    def block_users(self, request, queryset):
        queryset.update(is_blocked=True, block_reason="Blocked by admin", block_until=None)
        self.message_user(request, f"{queryset.count()} users permanently blocked.")
    block_users.short_description = "Block selected users permanently"

    def unblock_users(self, request, queryset):
        queryset.update(is_blocked=False, block_reason="", block_until=None)
        self.message_user(request, f"{queryset.count()} users unblocked.")
    unblock_users.short_description = "Unblock selected users"

    def temp_block_1_day(self, request, queryset):
        block_until = timezone.now() + timezone.timedelta(days=1)
        queryset.update(is_blocked=True, block_reason="Temporary block (1 day)", block_until=block_until)
        self.message_user(request, f"{queryset.count()} users blocked for 1 day.")
    temp_block_1_day.short_description = "Block selected users for 1 day"

    def temp_block_7_days(self, request, queryset):
        block_until = timezone.now() + timezone.timedelta(days=7)
        queryset.update(is_blocked=True, block_reason="Temporary block (7 days)", block_until=block_until)
        self.message_user(request, f"{queryset.count()} users blocked for 7 days.")
    temp_block_7_days.short_description = "Block selected users for 7 days"
