from django.contrib import admin
from django.utils.html import format_html
from .models import PropertyPromotionTier, PropertyPromotion, Payment, PromoCode


@admin.register(PropertyPromotionTier)
class PropertyPromotionTierAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "tier_type",
        "price_7",
        "price_30",
        "price_60",
        "price_90",
        "search_position",
        "is_active",
        "display_order",
    )
    list_filter = ("tier_type", "is_active")
    search_fields = ("name", "description")
    list_editable = (
        "is_active",
        "display_order",
        "price_7",
        "price_30",
        "price_60",
        "price_90",
    )

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "name",
                    "tier_type",
                    "description",
                    "is_active",
                    "display_order",
                )
            },
        ),
        (
            "Pricing (Fixed Durations)",
            {
                "fields": ("price_7", "price_30", "price_60", "price_90"),
                "description": "Set prices for specific durations (7, 30, 60, 90 days)",
            },
        ),
        (
            "Features & Display",
            {"fields": ("features", "search_position", "badge_color")},
        ),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id_short",
        "user",
        "promotion",
        "amount_etb",
        "status_display",
        "payment_method",
        "paid_at",
        "created_at",
    )
    list_filter = ("status", "payment_method", "created_at")
    search_fields = (
        "user__email",
        "transaction_id",
        "chapa_reference",
        "promotion__property__title",
    )
    readonly_fields = ("id", "created_at", "updated_at")

    fieldsets = (
        (
            "Payment Details",
            {"fields": ("user", "promotion", "amount_etb", "payment_method")},
        ),
        ("Transaction Information", {"fields": ("transaction_id", "chapa_reference")}),
        ("Status", {"fields": ("status", "paid_at")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def id_short(self, obj):
        return str(obj.id)[:8]

    id_short.short_description = "ID"

    def status_display(self, obj):
        status_colors = {
            "pending": "orange",
            "completed": "green",
            "failed": "red",
            "refunded": "blue",
        }
        color = status_colors.get(obj.status, "black")
        return format_html(
            f'<span style="color: {color}; font-weight: bold;">{obj.get_status_display()}</span>'
        )

    status_display.short_description = "Status"


@admin.register(PropertyPromotion)
class PropertyPromotionAdmin(admin.ModelAdmin):
    list_display = (
        "listed_property",
        "user",
        "tier",
        "duration_days",
        "status_display",
        "is_active_display",
        "days_remaining",
        "created_at",
    )
    list_filter = ("status", "tier", "duration_days")
    search_fields = ("property__title", "user__email")
    readonly_fields = ("id", "created_at", "updated_at", "payment_info")

    fieldsets = (
        (
            "Promotion Details",
            {"fields": ("listed_property", "user", "tier", "duration_days")},
        ),
        ("Payment Link", {"fields": ("payment_info",)}),
        ("Dates", {"fields": ("start_date", "end_date")}),
        ("Status", {"fields": ("status",)}),
        ("Timestamps", {"fields": ("id", "created_at", "updated_at")}),
    )

    def payment_info(self, obj):
        # Access payment through reverse relation
        if hasattr(obj, "payment") and obj.payment:
            return f"Payment ID: {obj.payment.id}, Amount: {obj.payment.amount_etb} ETB, Status: {obj.payment.status}"
        return "No payment linked"

    payment_info.short_description = "Payment Information"

    def status_display(self, obj):
        status_colors = {
            "pending": "orange",
            "active": "green",
            "expired": "gray",
            "failed": "red",
        }
        color = status_colors.get(obj.status, "black")
        return format_html(
            f'<span style="color: {color}; font-weight: bold;">{obj.get_status_display()}</span>'
        )

    status_display.short_description = "Status"

    def is_active_display(self, obj):
        if obj.is_active():
            return format_html('<span style="color: green;">● Active</span>')
        return format_html('<span style="color: red;">● Inactive</span>')

    is_active_display.short_description = "Active Now"

    def days_remaining(self, obj):
        return obj.days_remaining()

    days_remaining.short_description = "Days Left"


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "discount_percent",
        "times_used",
        "max_uses",
        "valid_until",
        "is_active",
    )
    list_filter = ("is_active", "valid_until")
    search_fields = ("code",)
    list_editable = ("is_active", "max_uses", "discount_percent")

    fieldsets = (
        ("Code Details", {"fields": ("code", "discount_percent", "is_active")}),
        ("Usage Limits", {"fields": ("max_uses", "times_used", "valid_until")}),
    )
