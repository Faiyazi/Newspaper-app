from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Customer, Newspaper, Subscription, Delivery, Payment, Invoice
from .serializers import (
    CustomerSerializer, NewspaperSerializer, SubscriptionSerializer,
    DeliverySerializer, PaymentSerializer, InvoiceSerializer
)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("name")
    serializer_class = CustomerSerializer

class NewspaperViewSet(viewsets.ModelViewSet):
    queryset = Newspaper.objects.all().order_by("name")
    serializer_class = NewspaperSerializer

class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.select_related("customer", "newspaper").all()
    serializer_class = SubscriptionSerializer

class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.select_related("customer", "subscription__newspaper").all()
    serializer_class = DeliverySerializer

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("customer").all().order_by("-payment_date", "-id")
    serializer_class = PaymentSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("customer").all().order_by("-month")
    serializer_class = InvoiceSerializer

@api_view(["GET"])
def dashboard(request):
    today = timezone.localdate()
    month_start = today.replace(day=1)

    customers = Customer.objects.filter(active=True).count()
    subscriptions = Subscription.objects.filter(status="active").count()
    today_deliveries = Delivery.objects.filter(date=today).count()
    today_collected = Payment.objects.filter(payment_date=today).aggregate(
        total=Sum("amount")
    )["total"] or 0
    pending = Invoice.objects.filter(pending_amount__gt=0).aggregate(
        total=Sum("pending_amount")
    )["total"] or 0

    return Response({
        "date": today,
        "active_customers": customers,
        "active_subscriptions": subscriptions,
        "today_deliveries": today_deliveries,
        "today_collection": today_collected,
        "total_pending": pending,
    })
