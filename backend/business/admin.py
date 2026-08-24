from django.contrib import admin
from .models import Customer, Newspaper, Subscription, Delivery, Payment, Invoice

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "mobile", "area", "active", "start_date")
    search_fields = ("name", "mobile", "area")
    list_filter = ("active", "area")

@admin.register(Newspaper)
class NewspaperAdmin(admin.ModelAdmin):
    list_display = ("name", "language", "edition", "daily_price", "active")
    search_fields = ("name", "edition")
    list_filter = ("active", "language")

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("customer", "newspaper", "price", "start_date", "status")
    list_filter = ("status", "newspaper")

@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ("date", "customer", "subscription", "quantity", "status")
    list_filter = ("date", "status")

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("payment_date", "customer", "amount", "payment_method")
    list_filter = ("payment_method", "payment_date")

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("month", "customer", "subtotal", "previous_balance", "paid_amount", "pending_amount", "status")
    list_filter = ("status", "month")
