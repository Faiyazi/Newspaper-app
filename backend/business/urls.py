from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet, NewspaperViewSet, SubscriptionViewSet,
    DeliveryViewSet, PaymentViewSet, InvoiceViewSet, dashboard
)

router = DefaultRouter()
router.register("customers", CustomerViewSet)
router.register("newspapers", NewspaperViewSet)
router.register("subscriptions", SubscriptionViewSet)
router.register("deliveries", DeliveryViewSet)
router.register("payments", PaymentViewSet)
router.register("invoices", InvoiceViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("dashboard/", dashboard),
]
