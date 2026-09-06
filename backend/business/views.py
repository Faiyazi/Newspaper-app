from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    Customer,
    Employee,
    Newspaper,
    Subscription,
    Delivery,
    Payment,
    Invoice,
)

from .serializers import (
    CustomerSerializer,
    EmployeeSerializer,
    NewspaperSerializer,
    SubscriptionSerializer,
    DeliverySerializer,
    PaymentSerializer,
    InvoiceSerializer,
)


# =========================================================
# CUSTOMER
# =========================================================

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("name")
    serializer_class = CustomerSerializer


# =========================================================
# Employee
# =========================================================

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by("name")
    serializer_class = EmployeeSerializer

# =========================================================
# NEWSPAPER
# =========================================================

class NewspaperViewSet(viewsets.ModelViewSet):
    queryset = Newspaper.objects.all().order_by("name")
    serializer_class = NewspaperSerializer


# =========================================================
# SUBSCRIPTION
# =========================================================

class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.select_related(
        "customer",
        "newspaper",
    ).all()

    serializer_class = SubscriptionSerializer


# =========================================================
# DELIVERY
# =========================================================

class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = (
        Delivery.objects
        .select_related(
            "customer",
            "subscription__newspaper",
            "employee",
        )
        .all()
        .order_by("-date", "customer__name")
    )
    serializer_class = DeliverySerializer

# =========================================================
# PAYMENT
# =========================================================

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related(
        "customer",
    ).all().order_by(
        "-payment_date",
        "-id",
    )

    serializer_class = PaymentSerializer

    def create(self, request, *args, **kwargs):
        """
        Record a customer payment and automatically apply it
        to the customer's oldest pending invoices.
        """

        customer_id = request.data.get("customer")
        amount_value = request.data.get("amount")
        payment_date = request.data.get("payment_date")
        payment_method = request.data.get(
            "payment_method",
            "cash",
        )
        reference = request.data.get(
            "reference",
            "",
        )
        notes = request.data.get(
            "notes",
            "",
        )

        # -----------------------------------------------------
        # Validate customer
        # -----------------------------------------------------

        if not customer_id:
            return Response(
                {
                    "error": "customer is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            customer = Customer.objects.get(
                id=customer_id
            )
        except Customer.DoesNotExist:
            return Response(
                {
                    "error": "Customer not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # -----------------------------------------------------
        # Validate amount
        # -----------------------------------------------------

        if amount_value in [None, ""]:
            return Response(
                {
                    "error": "amount is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = Decimal(str(amount_value))
        except Exception:
            return Response(
                {
                    "error": "Invalid payment amount."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount <= 0:
            return Response(
                {
                    "error": "Payment amount must be greater than 0."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -----------------------------------------------------
        # Payment date
        # -----------------------------------------------------

        if not payment_date:
            payment_date = timezone.localdate()

        # -----------------------------------------------------
        # Get total outstanding amount
        # -----------------------------------------------------

        total_pending = (
            Invoice.objects.filter(
                customer=customer,
                pending_amount__gt=0,
            )
            .aggregate(
                total=Sum("pending_amount")
            )["total"]
            or Decimal("0.00")
        )

        if total_pending <= 0:
            return Response(
                {
                    "error": (
                        "This customer has no pending balance."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -----------------------------------------------------
        # Prevent overpayment
        # -----------------------------------------------------

        if amount > total_pending:
            return Response(
                {
                    "error": (
                        f"Payment amount cannot exceed "
                        f"pending balance of ₹{total_pending}."
                    ),
                    "pending_balance": str(
                        total_pending
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # -----------------------------------------------------
        # Create payment + update invoices atomically
        # -----------------------------------------------------

        with transaction.atomic():

            payment = Payment.objects.create(
                customer=customer,
                amount=amount,
                payment_date=payment_date,
                payment_method=payment_method,
                reference=reference,
                notes=notes,
            )

            remaining_payment = amount
            applied_to = []

            # Oldest invoice first
            invoices = Invoice.objects.filter(
                customer=customer,
                pending_amount__gt=0,
            ).order_by(
                "month",
                "id",
            )

            for invoice in invoices:

                if remaining_payment <= 0:
                    break

                invoice_pending = (
                    invoice.pending_amount
                    or Decimal("0.00")
                )

                if invoice_pending <= 0:
                    continue

                if remaining_payment >= invoice_pending:
                    applied_amount = invoice_pending
                    invoice.pending_amount = Decimal(
                        "0.00"
                    )
                    invoice.paid_amount = (
                        invoice.paid_amount
                        or Decimal("0.00")
                    ) + applied_amount
                    invoice.status = "paid"

                    remaining_payment -= applied_amount

                else:
                    applied_amount = remaining_payment

                    invoice.pending_amount = (
                        invoice_pending
                        - applied_amount
                    )

                    invoice.paid_amount = (
                        invoice.paid_amount
                        or Decimal("0.00")
                    ) + applied_amount

                    invoice.status = "partial"

                    remaining_payment = Decimal(
                        "0.00"
                    )

                invoice.save(
                    update_fields=[
                        "paid_amount",
                        "pending_amount",
                        "status",
                    ]
                )

                applied_to.append({
                    "invoice_id": invoice.id,
                    "month": str(invoice.month),
                    "amount": str(
                        applied_amount
                    ),
                    "remaining": str(
                        invoice.pending_amount
                    ),
                    "status": invoice.status,
                })

        # -----------------------------------------------------
        # Response
        # -----------------------------------------------------

        return Response(
            {
                "message": "Payment recorded successfully.",
                "payment": {
                    "id": payment.id,
                    "customer": customer.name,
                    "amount": str(payment.amount),
                    "payment_date": str(
                        payment.payment_date
                    ),
                    "payment_method": payment.payment_method,
                    "reference": payment.reference,
                    "notes": payment.notes,
                },
                "applied_to": applied_to,
            },
            status=status.HTTP_201_CREATED,
        )


# =========================================================
# INVOICE
# =========================================================

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related(
        "customer",
    ).all().order_by(
        "-month",
        "-id",
    )

    serializer_class = InvoiceSerializer


# =========================================================
# DASHBOARD
# =========================================================

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


# =========================================================
# TODAY'S DELIVERY
# =========================================================

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


# =========================================================
# GENERATE TODAY'S DELIVERY
# =========================================================

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
        if (
            subscription.start_date
            and today < subscription.start_date
        ):
            skipped_count += 1
            continue

        # Do not create delivery after subscription ends
        if (
            subscription.end_date
            and today > subscription.end_date
        ):
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
            quantity=subscription.quantity,
            status="not_delivered",
        )

        created_count += 1

    return Response({
        "date": today,
        "created": created_count,
        "skipped": skipped_count,
        "message": (
            f"{created_count} delivery record(s) created."
        ),
    })


# =========================================================
# GENERATE MONTHLY BILLING
# =========================================================

@api_view(["POST"])
def generate_monthly_billing(request):
    """
    Generate invoices for a billing month.

    Request:
    {
        "month": "2026-09-01"
    }

    The month must be the first day of the month.
    """

    month_value = request.data.get("month")

    # -----------------------------------------------------
    # Validate month
    # -----------------------------------------------------

    if not month_value:
        return Response(
            {
                "error": (
                    "month is required. "
                    "Use YYYY-MM-01."
                )
            },
            status=400,
        )

    try:
        billing_month = timezone.datetime.strptime(
            month_value,
            "%Y-%m-%d",
        ).date()

    except ValueError:
        return Response(
            {
                "error": (
                    "Invalid month. "
                    "Use YYYY-MM-01."
                )
            },
            status=400,
        )

    # -----------------------------------------------------
    # Month must start on day 1
    # -----------------------------------------------------

    if billing_month.day != 1:
        return Response(
            {
                "error": (
                    "month must be the first day "
                    "of the month."
                )
            },
            status=400,
        )

    # -----------------------------------------------------
    # Calculate next month
    # -----------------------------------------------------

    if billing_month.month == 12:
        next_month = billing_month.replace(
            year=billing_month.year + 1,
            month=1,
        )
    else:
        next_month = billing_month.replace(
            month=billing_month.month + 1,
        )

    # -----------------------------------------------------
    # Get active customers with active subscriptions
    # -----------------------------------------------------

    customers = Customer.objects.filter(
        active=True,
        subscriptions__status="active",
    ).distinct()

    created_count = 0
    existing_count = 0

    invoices = []

    # -----------------------------------------------------
    # Generate invoice for each customer
    # -----------------------------------------------------

    for customer in customers:

        # -------------------------------------------------
        # Check if invoice already exists
        # -------------------------------------------------

        existing_invoice = Invoice.objects.filter(
            customer=customer,
            month=billing_month,
        ).first()

        if existing_invoice:
            existing_count += 1
            continue

        # -------------------------------------------------
        # Get delivered newspapers for the month
        # -------------------------------------------------

        deliveries = Delivery.objects.filter(
            customer=customer,
            date__gte=billing_month,
            date__lt=next_month,
            status="delivered",
        ).select_related(
            "subscription",
            "subscription__newspaper",
        )

        # -------------------------------------------------
        # Calculate subtotal
        # -------------------------------------------------

        subtotal = Decimal("0.00")

        for delivery in deliveries:

            price = (
                delivery.subscription.price
                or Decimal("0.00")
            )

            quantity = Decimal(
                str(delivery.quantity or 0)
            )

            subtotal += price * quantity

        # -------------------------------------------------
        # Calculate previous pending balance
        # -------------------------------------------------

        previous_balance = (
            Invoice.objects.filter(
                customer=customer,
                month__lt=billing_month,
                pending_amount__gt=0,
            )
            .aggregate(
                total=Sum("pending_amount")
            )["total"]
            or Decimal("0.00")
        )

        # -------------------------------------------------
        # Initial payment
        # -------------------------------------------------

        paid_amount = Decimal("0.00")

        # -------------------------------------------------
        # Calculate pending amount
        # -------------------------------------------------

        total_due = (
            subtotal
            + previous_balance
        )

        pending_amount = (
            total_due
            - paid_amount
        )

        # -------------------------------------------------
        # Determine invoice status
        # -------------------------------------------------

        if pending_amount <= 0:
            status_value = "paid"

        elif paid_amount > 0:
            status_value = "partial"

        else:
            status_value = "unpaid"

        # -------------------------------------------------
        # Create invoice
        # -------------------------------------------------

        invoice = Invoice.objects.create(
            customer=customer,
            month=billing_month,
            subtotal=subtotal,
            previous_balance=previous_balance,
            paid_amount=paid_amount,
            pending_amount=pending_amount,
            status=status_value,
        )

        # -------------------------------------------------
        # Add response data
        # -------------------------------------------------

        invoices.append({
            "id": invoice.id,
            "customer": customer.name,
            "month": str(billing_month),
            "subtotal": str(subtotal),
            "previous_balance": str(previous_balance),
            "paid_amount": str(paid_amount),
            "pending_amount": str(pending_amount),
            "status": status_value,
        })

        created_count += 1

    # -----------------------------------------------------
    # Return response
    # -----------------------------------------------------

    return Response({
        "month": str(billing_month),
        "created": created_count,
        "already_exists": existing_count,
        "invoices": invoices,
    })