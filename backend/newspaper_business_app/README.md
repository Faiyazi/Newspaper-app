# Newspaper Business App

MVP starter for a newspaper distribution and billing business.

## Stack
- Django
- Django REST Framework
- SQLite for quick local development (change to PostgreSQL later)

## Features
- Customers
- Newspapers
- Subscriptions
- Daily deliveries
- Payments
- Basic dashboard API
- Django admin

## Run

```bash
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Admin: http://127.0.0.1:8000/admin/

API:
- /api/customers/
- /api/newspapers/
- /api/subscriptions/
- /api/deliveries/
- /api/payments/
- /api/dashboard/
