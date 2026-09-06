from django.db import models
from decimal import Decimal

class Customer(models.Model):
    name = models.CharField(max_length=150)
    mobile = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    area = models.CharField(max_length=100, blank=True)
    start_date = models.DateField()
    active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.name
    
class Employee(models.Model):
    name = models.CharField(max_length=150)
    mobile = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    area = models.CharField(max_length=100, blank=True)
    joining_date = models.DateField()
    active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.name
    
class Newspaper(models.Model):
    name = models.CharField(max_length=150)
    language = models.CharField(max_length=50, blank=True)
    edition = models.CharField(max_length=100, blank=True)
    daily_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Subscription(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("paused", "Paused"),
        ("stopped", "Stopped"),
    ]
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="subscriptions")
    newspaper = models.ForeignKey(Newspaper, on_delete=models.PROTECT, related_name="subscriptions")
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    def __str__(self):
        return f"{self.customer} - {self.newspaper}"

class Delivery(models.Model):
    STATUS_CHOICES = [
        ("delivered", "Delivered"),
        ("not_delivered", "Not Delivered"),
        ("paused", "Paused"),
        ("holiday", "Holiday"),
    ]
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="deliveries")
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name="deliveries")
    date = models.DateField()
    quantity = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="delivered")
    employee = models.ForeignKey(Employee,on_delete=models.SET_NULL,null=True, blank=True,
    related_name="deliveries",)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["subscription", "date"],
                name="unique_subscription_delivery_date"
            )
        ]

class Payment(models.Model):
    METHOD_CHOICES = [
        ("cash", "Cash"),
        ("upi", "UPI"),
        ("bank", "Bank Transfer"),
        ("other", "Other"),
    ]
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default="cash")
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.customer} - ₹{self.amount}"

class Invoice(models.Model):
    STATUS_CHOICES = [
        ("unpaid", "Unpaid"),
        ("partial", "Partially Paid"),
        ("paid", "Paid"),
    ]
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="invoices")
    month = models.DateField(help_text="Use the first day of the billing month")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    previous_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pending_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="unpaid")

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["customer", "month"],
                name="unique_customer_invoice_month"
            )
        ]

    def calculate(self):
        total = Decimal(self.subtotal) + Decimal(self.previous_balance)
        self.pending_amount = max(total - Decimal(self.paid_amount), Decimal("0"))
        if self.pending_amount == 0:
            self.status = "paid"
        elif self.paid_amount > 0:
            self.status = "partial"
        else:
            self.status = "unpaid"
        return self
