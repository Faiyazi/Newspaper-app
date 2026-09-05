from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CustomerViewSet,
    NewspaperViewSet,
    SubscriptionViewSet,
    DeliveryViewSet,
    PaymentViewSet,
    InvoiceViewSet,
    dashboard,
    todays_delivery,
    generate_todays_delivery,
)


router = DefaultRouter()

router.register("customers", CustomerViewSet)
router.register("newspapers", NewspaperViewSet)
router.register("subscriptions", SubscriptionViewSet)
router.register("deliveries", DeliveryViewSet)
router.register("payments", PaymentViewSet)
router.register("invoices", InvoiceViewSet)


urlpatterns = [
    # Custom routes MUST come before router URLs
    path(
        "deliveries/today/",
        todays_delivery,
    ),

    path(
        "deliveries/generate-today/",
        generate_todays_delivery,
    ),

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