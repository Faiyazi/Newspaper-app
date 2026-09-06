from rest_framework import serializers
from .models import (
    Customer,
    Employee,
    Newspaper,
    Subscription,
    Delivery,
    Payment,
    Invoice,
)


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = "__all__"


class NewspaperSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newspaper
        fields = "__all__"


class SubscriptionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True
    )
    newspaper_name = serializers.CharField(
        source="newspaper.name",
        read_only=True
    )

    class Meta:
        model = Subscription
        fields = "__all__"


class DeliverySerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True
    )
    newspaper_name = serializers.CharField(
        source="subscription.newspaper.name",
        read_only=True
    )
    employee_name = serializers.CharField(
        source="employee.name",
        read_only=True
    )

    class Meta:
        model = Delivery
        fields = "__all__"


class PaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True
    )

    class Meta:
        model = Payment
        fields = "__all__"


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(
        source="customer.name",
        read_only=True
    )

    class Meta:
        model = Invoice
        fields = "__all__"