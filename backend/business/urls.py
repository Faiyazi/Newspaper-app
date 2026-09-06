from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CustomerViewSet,
    EmployeeViewSet,
    NewspaperViewSet,
    SubscriptionViewSet,
    DeliveryViewSet,
    PaymentViewSet,
    InvoiceViewSet,
    dashboard,
    todays_delivery,
    generate_todays_delivery,
    generate_monthly_billing,
)


router = DefaultRouter()

router.register(
    "customers",
    CustomerViewSet,
)

router.register(
    "employees",
    EmployeeViewSet,
)

router.register(
    "newspapers",
    NewspaperViewSet,
)

router.register(
    "subscriptions",
    SubscriptionViewSet,
)

router.register(
    "deliveries",
    DeliveryViewSet,
)

router.register(
    "payments",
    PaymentViewSet,
)

router.register(
    "invoices",
    InvoiceViewSet,
)


urlpatterns = [

    # Today's delivery
    path(
        "deliveries/today/",
        todays_delivery,
    ),

    # Generate today's deliveries
    path(
        "deliveries/generate-today/",
        generate_todays_delivery,
    ),

    # Generate monthly billing
    path(
        "billing/generate/",
        generate_monthly_billing,
    ),

    # Dashboard
    path(
        "dashboard/",
        dashboard,
    ),

    # DRF router
    path(
        "",
        include(router.urls),
    ),
]