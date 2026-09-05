from django.db.models import Sum
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    Customer,
    Newspaper,
    Subscription,
    Delivery,
    Payment,
    Invoice,
)

from .serializers import (
    CustomerSerializer,
    NewspaperSerializer,
    SubscriptionSerializer,
    DeliverySerializer,
    PaymentSerializer,
    InvoiceSerializer,
)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("name")
    serializer_class = CustomerSerializer


class NewspaperViewSet(viewsets.ModelViewSet):
    queryset = Newspaper.objects.select_related().all().order_by("name")
    serializer_class = NewspaperSerializer


class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.select_related(
        "customer",
        "newspaper",
    ).all()

    serializer_class = SubscriptionSerializer


class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.select_related(
        "customer",
        "subscription__newspaper",
    ).all().order_by(
        "-date",
        "customer__name",
    )

    serializer_class = DeliverySerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related(
        "customer"
    ).all().order_by(
        "-payment_date",
        "-id",
    )

    serializer_class = PaymentSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related(
        "customer"
    ).all().order_by(
        "-month",
    )

    serializer_class = InvoiceSerializer


@api_view(["GET"])
def dashboard(request):
    today = timezone.localdate()

    customers = Customer.objects.filter(
        active=True
    ).count()

    subscriptions = Subscription.objects.filter(
        status="active"
    ).count()

    today_deliveries = Delivery.objects.filter(
        date=today
    ).count()

    delivered = Delivery.objects.filter(
        date=today,
        status="delivered",
    ).count()

    not_delivered = Delivery.objects.filter(
        date=today,
        status="not_delivered",
    ).count()

    today_collected = Payment.objects.filter(
        payment_date=today
    ).aggregate(
        total=Sum("amount")
    )["total"] or 0

    pending = Invoice.objects.filter(
        pending_amount__gt=0
    ).aggregate(
        total=Sum("pending_amount")
    )["total"] or 0

    return Response({
        "date": today,
        "active_customers": customers,
        "active_subscriptions": subscriptions,
        "today_deliveries": today_deliveries,
        "today_delivered": delivered,
        "today_not_delivered": not_delivered,
        "today_collection": today_collected,
        "total_pending": pending,
    })


@api_view(["GET"])
def todays_delivery(request):
    today = timezone.localdate()

    deliveries = Delivery.objects.filter(
        date=today
    ).select_related(
        "customer",
        "subscription__newspaper",
    ).order_by(
        "customer__name",
    )

    serializer = DeliverySerializer(
        deliveries,
        many=True,
    )

    return Response(serializer.data)


@api_view(["POST"])
def generate_todays_delivery(request):
    """
    Create today's delivery records from active subscriptions.

    Existing deliveries for today are not duplicated.
    """

    today = timezone.localdate()

    active_subscriptions = Subscription.objects.filter(
        status="active"
    ).select_related(
        "customer",
        "newspaper",
    )

    created_count = 0
    skipped_count = 0

    for subscription in active_subscriptions:

        # Do not create delivery before subscription starts
        if subscription.start_date and today < subscription.start_date:
            skipped_count += 1
            continue

        # Do not create delivery after subscription ends
        if subscription.end_date and today > subscription.end_date:
            skipped_count += 1
            continue

        # Do not create delivery for inactive customers
        if not subscription.customer.active:
            skipped_count += 1
            continue

        # Prevent duplicate delivery
        existing = Delivery.objects.filter(
            subscription=subscription,
            date=today,
        ).exists()

        if existing:
            skipped_count += 1
            continue

        Delivery.objects.create(
            customer=subscription.customer,
            subscription=subscription,
            date=today,
            quantity=1,
            status="not_delivered",
        )

        created_count += 1

    return Response({
        "date": today,
        "created": created_count,
        "skipped": skipped_count,
        "message": f"{created_count} delivery record(s) created.",
    })