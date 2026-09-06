# Newspaper Business App – Refactored Frontend

The frontend is split into small service files so API functions are easier to maintain.

## Structure

- `main.jsx` – UI, page state, and event handling
- `services/api.js` – shared API request helper
- `services/coreService.js` – dashboard, customers, newspapers, subscriptions loading
- `services/subscriptionService.js` – create/update/delete subscriptions
- `services/employeeService.js` – employee API functions
- `services/deliveryService.js` – today's deliveries, generation, employee/status updates
- `services/billingService.js` – invoice loading and billing generation
- `services/paymentService.js` – payment loading and recording

## Subscription behavior

- Edit an existing subscription to increase quantity.
- Delete an unwanted subscription.
- The frontend blocks an active duplicate for the same customer + newspaper.
- Example: Gujarat Today × 2 and Sandesh × 1 should be two subscription records, not three.
