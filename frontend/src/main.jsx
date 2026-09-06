import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { getDashboard, getCustomers, getNewspapers, getSubscriptions } from "./services/coreService";
import { createCustomer } from "./services/customerService";
import { getEmployees, createEmployee } from "./services/employeeService";
import {
  getTodayDeliveries,
  generateTodayDeliveries,
  updateDeliveryEmployee,
  updateDeliveryStatus,
} from "./services/deliveryService";
import {
  getInvoices,
  generateInvoices,
} from "./services/billingService";
import {
  getPayments,
  createPayment,
} from "./services/paymentService";
import {
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "./services/subscriptionService";

function App() {
  const [page, setPage] = useState("dashboard");
  const [d, setD] = useState(null);
  const [customers, setC] = useState([]);
  const [newspapers, setN] = useState([]);
  const [subscriptions, setS] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [billingMonth, setBillingMonth] = useState(
    new Date().toISOString().slice(0, 7) + "-01"
  );
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [generatingBilling, setGeneratingBilling] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);

  const load = async () => {
    try {
      const [dashboard, customerData, newspaperData, subscriptionData] =
        await Promise.all([
          getDashboard(),
          getCustomers(),
          getNewspapers(),
          getSubscriptions(),
        ]);

      setD(dashboard);
      setC(customerData);
      setN(newspaperData);
      setS(subscriptionData);
    } catch (error) {
      console.log("API Error:", error);
    }
  };

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      setEmployees(await getEmployees());
    } catch (error) {
      console.log("Employee API Error:", error);
      alert("Unable to load employees.");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadDeliveries = async () => {
    setLoadingDeliveries(true);
    try {
      setDeliveries(await getTodayDeliveries());
    } catch (error) {
      console.log("Delivery API Error:", error);
      alert("Unable to load today's deliveries.");
    } finally {
      setLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (page === "delivery") {
      loadDeliveries();
      if (employees.length === 0) {
        loadEmployees();
      }
    }

    if (page === "billing") {
      loadBilling();
    }

    if (page === "payments") {
      loadPayments();
    }

    if (page === "employees") {
      loadEmployees();
    }
  }, [page]);

  const changePage = (newPage) => {
    setPage(newPage);
    setMenuOpen(false);
  };

  const addEmployee = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.active = true;
    if (!data.joining_date) {
      data.joining_date = new Date().toISOString().slice(0, 10);
    }

    try {
      await createEmployee(data);
      e.target.reset();
      await loadEmployees();
      changePage("employees");
    } catch (error) {
      console.log(error);
      alert(error.message || "Unable to add employee.");
    }
  };

  const addCustomer = async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.target));
    data.active = true;

    if (!data.start_date) {
      data.start_date = new Date().toISOString().slice(0, 10);
    }

    try {
      await createCustomer(data);
      e.target.reset();
      await load();
      changePage("customers");
    } catch (error) {
      console.log(error);
      alert(error.message || "Unable to add customer.");
    }
  };

  const saveSubscription = async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.target));
    data.customer = Number(data.customer);
    data.newspaper = Number(data.newspaper);
    data.price = Number(data.price);
    data.quantity = Math.max(1, Number(data.quantity || 1));
    data.status = "active";

    if (!data.end_date) {
      data.end_date = null;
    }

    const duplicate = subscriptions.find((subscription) => {
      const sameCustomer =
        Number(subscription.customer) === Number(data.customer);
      const sameNewspaper =
        Number(subscription.newspaper) === Number(data.newspaper);
      const active = subscription.status === "active";
      const differentRecord =
        !editingSubscription ||
        Number(subscription.id) !== Number(editingSubscription.id);

      return sameCustomer && sameNewspaper && active && differentRecord;
    });

    if (duplicate) {
      alert(
        "This customer already has an active subscription for this newspaper. Edit the existing subscription and increase the quantity instead."
      );
      return;
    }

    try {
      if (editingSubscription) {
        await updateSubscription(editingSubscription.id, data);
        alert("Subscription updated successfully.");
      } else {
        await createSubscription(data);
        alert("Subscription created successfully.");
      }

      e.target.reset();
      setEditingSubscription(null);
      await load();
      changePage("subscriptions");
    } catch (error) {
      console.log(error);
      alert(error.message || "Unable to save subscription.");
    }
  };

  const startEditSubscription = (subscription) => {
    setEditingSubscription(subscription);
    changePage("add-subscription");
  };

  const removeSubscription = async (subscription) => {
    const customerName =
      subscription.customer_name || `Customer #${subscription.customer}`;
    const newspaperName =
      subscription.newspaper_name || `Newspaper #${subscription.newspaper}`;

    if (
      !window.confirm(
        `Delete ${newspaperName} subscription for ${customerName}?`
      )
    ) {
      return;
    }

    try {
      await deleteSubscription(subscription.id);
      alert("Subscription deleted successfully.");
      await load();
    } catch (error) {
      console.log(error);
      alert(error.message || "Unable to delete subscription.");
    }
  };

  const generateDeliveries = async () => {
    setGenerating(true);
    try {
      const data = await generateTodayDeliveries();
      alert(`${data.created} delivery record(s) created.`);
      await loadDeliveries();
      await load();
    } catch (error) {
      console.log(error);
      alert(error.message || "Unable to generate deliveries.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeliveryEmployeeUpdate = async (deliveryId, employeeId) => {
    try {
      await updateDeliveryEmployee(deliveryId, employeeId);

      setDeliveries((current) =>
        current.map((delivery) =>
          delivery.id === deliveryId
            ? {
                ...delivery,
                employee: employeeId ? Number(employeeId) : null,
                employee_name:
                  employees.find(
                    (employee) =>
                      Number(employee.id) === Number(employeeId)
                  )?.name || "-",
              }
            : delivery
        )
      );
    } catch (error) {
      console.log(error);
      alert(error.message || "Unable to assign employee.");
    }
  };

  const handleDeliveryStatusUpdate = async (deliveryId, status) => {
    try {
      await updateDeliveryStatus(deliveryId, status);

      setDeliveries((current) =>
        current.map((delivery) =>
          delivery.id === deliveryId
            ? { ...delivery, status }
            : delivery
        )
      );

      await load();
    } catch (error) {
      console.log(error);
      alert(error.message || "Unable to update delivery.");
    }
  };

  const loadBilling = async () => {
    setLoadingBilling(true);
    try {
      setInvoices(await getInvoices());
    } catch (error) {
      console.log("Billing API Error:", error);
      alert("Unable to load billing.");
    } finally {
      setLoadingBilling(false);
    }
  };

  const loadPayments = async () => {
    setLoadingPayments(true);

    try {
      const [paymentData, invoiceData] = await Promise.all([
        getPayments(),
        getInvoices(),
      ]);

      setPayments(paymentData);
      setInvoices(invoiceData);
    } catch (error) {
      console.log("Payments API Error:", error);
      alert("Unable to load payments.");
    } finally {
      setLoadingPayments(false);
    }
  };

  const getCustomerPending = (customerId) => {
    if (!customerId) return 0;

    return invoices
      .filter(
        (invoice) => Number(invoice.customer) === Number(customerId)
      )
      .reduce(
        (total, invoice) => total + Number(invoice.pending_amount || 0),
        0
      );
  };

  const recordPayment = async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.target));
    data.customer = Number(data.customer);
    data.amount = Number(data.amount);

    if (!data.customer) {
      alert("Please select a customer.");
      return;
    }

    if (!data.amount || data.amount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    const pending = getCustomerPending(data.customer);

    if (pending <= 0) {
      alert("This customer has no pending balance.");
      return;
    }

    if (data.amount > pending) {
      alert(
        `Payment cannot be more than the pending balance of ${formatCurrency(
          pending
        )}.`
      );
      return;
    }

    setSavingPayment(true);

    try {
      await createPayment(data);

      alert("Payment recorded successfully.");

      e.target.reset();
      setPaymentCustomer("");

      await loadPayments();
      await loadBilling();
      await load();
    } catch (error) {
      console.log(error);
      alert("Unable to connect to server.");
    } finally {
      setSavingPayment(false);
    }
  };

  const generateBilling = async () => {
    setGeneratingBilling(true);

    try {
      const data = await generateInvoices(billingMonth);

      alert(`${data.created} invoice(s) created.`);

      await loadBilling();
      await load();
    } catch (error) {
      console.log(error);
      alert("Unable to connect to server.");
    } finally {
      setGeneratingBilling(false);
    }
  };

  const formatCurrency = (value) => {
    const number = Number(value || 0);

    return `₹${number.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatBillingMonth = (value) => {
    if (!value) return "-";

    const date = new Date(`${value}T00:00:00`);

    return date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  const getInvoiceStatusLabel = (status) => {
    const labels = {
      paid: "Paid",
      partial: "Partially Paid",
      unpaid: "Unpaid",
    };

    return labels[status] || status || "-";
  };

  const nav = [
    ["dashboard", "🏠", "Dashboard"],
    ["customers", "👥", "Customers"],
    ["newspapers", "📰", "Newspapers"],
    ["subscriptions", "📦", "Subscriptions"],
    ["employees", "👨‍💼", "Employees"],
    ["delivery", "🚚", "Today's Delivery"],
    ["billing", "🧾", "Billing"],
    ["payments", "💰", "Payments"],
    ["reports", "📊", "Reports"],
  ];

  const getStatusLabel = (status) => {
    const labels = {
      delivered: "Delivered",
      not_delivered: "Not Delivered",
      paused: "Paused",
      holiday: "Holiday",
    };

    return labels[status] || status;
  };

  return (
    <div className="app">

      <div className="mobile-header">

        <button
          className="menu-button"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <strong>📰 NewsPaper</strong>

        <div className="mobile-spacer"></div>

      </div>

      {menuOpen && (
        <div
          className="mobile-overlay"
          onClick={() =>
            setMenuOpen(false)
          }
        ></div>
      )}

      <aside
        className={
          menuOpen ? "mobile-open" : ""
        }
      >

        <div className="brand">
          📰 NewsPaper
        </div>

        <div className="mobile-close-area">

          <button
            className="mobile-close"
            onClick={() =>
              setMenuOpen(false)
            }
          >
            ✕
          </button>

        </div>

        {nav.map((item) => (
          <button
            key={item[0]}
            className={
              page === item[0]
                ? "active"
                : ""
            }
            onClick={() =>
              changePage(item[0])
            }
          >
            <span className="nav-icon">
              {item[1]}
            </span>

            <span className="nav-text">
              {item[2]}
            </span>
          </button>
        ))}

      </aside>

      <main>

        <header>

          <div>

            <h1>
              {page === "dashboard"
                ? "Good Evening 👋"
                : page === "delivery"
                ? "Today's Delivery"
                : page === "add"
                ? "Add Customer"
                : page === "add-subscription"
                ? "Add Subscription"
                : page.replace("-", " ")}
            </h1>

            <p>
              Manage your newspaper business easily.
            </p>

          </div>

          <button
            className="admin-button"
            onClick={() =>
              window.open(
                "https://newspaper-business-api.onrender.com/admin/",
                "_blank"
              )
            }
          >
            ⚙ Admin
          </button>

        </header>

        {page === "dashboard" && (
          <>
            <div className="cards">

              <Card
                icon="👥"
                title="Active Customers"
                value={
                  d?.active_customers || 0
                }
              />

              <Card
                icon="📰"
                title="Subscriptions"
                value={
                  d?.active_subscriptions || 0
                }
              />

              <Card
                icon="💰"
                title="Today's Collection"
                value={
                  "₹" +
                  (d?.today_collection || 0)
                }
              />

              <Card
                icon="🔴"
                title="Pending Amount"
                value={
                  "₹" +
                  (d?.total_pending || 0)
                }
              />

            </div>

            <section>

              <h2>Quick Actions</h2>

              <div className="quick">

                <button
                  onClick={() =>
                    changePage("add")
                  }
                >
                  ➕ Add Customer
                </button>

                <button
                  onClick={() =>
                    changePage("customers")
                  }
                >
                  👥 Customers
                </button>

                <button
                  onClick={() => {
                    setEditingSubscription(null);
                    changePage("subscriptions");
                  }}
                >
                  📦 Subscription
                </button>

                <button
                  onClick={() =>
                    changePage("delivery")
                  }
                >
                  🚚 Today's Delivery
                </button>

              </div>

            </section>
          </>
        )}

        {page === "customers" && (
          <section>

            <div className="head">

              <div>

                <h2>Customers</h2>

                <p className="section-description">
                  Manage your newspaper customers.
                </p>

              </div>

              <button
                className="primary"
                onClick={() =>
                  changePage("add")
                }
              >
                + Add Customer
              </button>

            </div>

            {customers.length > 0 ? (

              <div className="table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Area</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {customers.map(
                      (customer) => (

                        <tr
                          key={customer.id}
                        >

                          <td>
                            {customer.name}
                          </td>

                          <td>
                            {customer.mobile || "-"}
                          </td>

                          <td>
                            {customer.area || "-"}
                          </td>

                          <td>

                            <span
                              className={
                                customer.active
                                  ? "status-active"
                                  : "status-inactive"
                              }
                            >
                              {customer.active
                                ? "Active"
                                : "Inactive"}
                            </span>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            ) : (

              <div className="no-data">

                <div>👥</div>

                <h3>
                  No customers yet
                </h3>

                <p>
                  Add your first customer.
                </p>

                <button
                  className="primary"
                  onClick={() =>
                    changePage("add")
                  }
                >
                  + Add Customer
                </button>

              </div>

            )}

          </section>
        )}

        {page === "add" && (
          <section className="form-section">

            <div className="form-title">

              <h2>Add Customer</h2>

              <p>
                Enter customer information below.
              </p>

            </div>

            <form
              className="form"
              onSubmit={addCustomer}
            >

              <label>
                Name *

                <input
                  name="name"
                  type="text"
                  placeholder="Customer name"
                  required
                />

              </label>

              <label>
                Mobile

                <input
                  name="mobile"
                  type="tel"
                  placeholder="Mobile number"
                />

              </label>

              <label>
                Area

                <input
                  name="area"
                  type="text"
                  placeholder="Area / locality"
                />

              </label>

              <label>
                Address

                <textarea
                  name="address"
                  placeholder="Complete address"
                />

              </label>

              <label>
                Start Date

                <input
                  name="start_date"
                  type="date"
                  defaultValue={editingSubscription?.start_date || ""}
                />

              </label>

              <label>
                Notes

                <textarea
                  name="notes"
                  placeholder="Additional notes"
                />

              </label>

              <div className="form-buttons">

                <button
                  type="button"
                  onClick={() =>
                    changePage("customers")
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary"
                >
                  Save Customer
                </button>

              </div>

            </form>

          </section>
        )}

        {page === "newspapers" && (
          <section>

            <div className="head">

              <div>

                <h2>
                  📰 Newspapers
                </h2>

                <p className="section-description">
                  Manage newspapers available for delivery.
                </p>

              </div>

              <button
                className="primary"
                onClick={() =>
                  window.open(
                    "https://newspaper-business-api.onrender.com/admin/",
                    "_blank"
                  )
                }
              >
                + Manage
              </button>

            </div>

            {newspapers.length > 0 ? (

              <div className="table-wrapper">

                <table>

                  <thead>

                    <tr>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Language</th>
                      <th>Edition</th>
                    </tr>

                  </thead>

                  <tbody>

                    {newspapers.map(
                      (newspaper) => (

                        <tr
                          key={newspaper.id}
                        >

                          <td>
                            {newspaper.name}
                          </td>

                          <td>
                            ₹{newspaper.daily_price}
                          </td>

                          <td>
                            {newspaper.language || "-"}
                          </td>

                          <td>
                            {newspaper.edition || "-"}
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            ) : (

              <div className="no-data">

                <div>📰</div>

                <h3>
                  No newspapers yet
                </h3>

                <p>
                  Add newspapers from Admin.
                </p>

                <button
                  className="primary"
                  onClick={() =>
                    window.open(
                      "https://newspaper-business-api.onrender.com/admin/",
                      "_blank"
                    )
                  }
                >
                  Open Admin
                </button>

              </div>

            )}

          </section>
        )}

        {page === "subscriptions" && (
          <section>

            <div className="head">

              <div>

                <h2>
                  📦 Subscriptions
                </h2>

                <p className="section-description">
                  Manage customer newspaper subscriptions.
                </p>

              </div>

              <button
                className="primary"
                onClick={() =>
                  changePage(
                    "add-subscription"
                  )
                }
              >
                + Add Subscription
              </button>

            </div>

            {subscriptions.length > 0 ? (

              <div className="table-wrapper">

                <table>

                  <thead>

                    <tr>
                      <th>Customer</th>
                      <th>Newspaper</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                    </tr>

                  </thead>

                  <tbody>

                    {subscriptions.map(
                      (subscription) => (

                        <tr
                          key={subscription.id}
                        >

                          <td>
                            {subscription.customer_name ||
                              subscription.customer}
                          </td>

                          <td>
                            {subscription.newspaper_name ||
                              subscription.newspaper}
                          </td>

                          <td>
                            ₹{subscription.price}
                          </td>

                          <td>
                            {subscription.quantity || 1}
                          </td>

                          <td>
                            {subscription.start_date}
                          </td>

                          <td>
                            {subscription.end_date ||
                              "-"}
                          </td>

                          <td>
                            <span
                              className={
                                subscription.status ===
                                "active"
                                  ? "status-active"
                                  : "status-inactive"
                              }
                            >
                              {subscription.status}
                            </span>
                          </td>

                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                type="button"
                                onClick={() =>
                                  startEditSubscription(subscription)
                                }
                                style={{
                                  padding: "7px 10px",
                                  borderRadius: "8px",
                                  border: "1px solid #d1d5db",
                                  background: "#fff",
                                  cursor: "pointer",
                                }}
                              >
                                ✏️ Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  removeSubscription(subscription)
                                }
                                style={{
                                  padding: "7px 10px",
                                  borderRadius: "8px",
                                  border: "1px solid #fecaca",
                                  background: "#fff",
                                  color: "#dc2626",
                                  cursor: "pointer",
                                }}
                              >
                                🗑 Delete
                              </button>
                            </div>
                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            ) : (

              <div className="no-data">

                <div>📦</div>

                <h3>
                  No subscriptions yet
                </h3>

                <p>
                  Create your first customer subscription.
                </p>

                <button
                  className="primary"
                  onClick={() =>
                    changePage(
                      "add-subscription"
                    )
                  }
                >
                  + Add Subscription
                </button>

              </div>

            )}

          </section>
        )}

        {page === "add-subscription" && (
          <section className="form-section">

            <div className="form-title">

              <h2>
                {editingSubscription ? "Edit Subscription" : "Add Subscription"}
              </h2>

              <p>
                {editingSubscription
                  ? "Update the customer's newspaper subscription."
                  : "Assign a newspaper to a customer."}
              </p>

            </div>

            <form
              className="form"
              onSubmit={saveSubscription}
            >

              <label>
                Customer *

                <select
                  name="customer"
                  defaultValue={editingSubscription?.customer || ""}
                  required
                >

                  <option value="">
                    Select customer
                  </option>

                  {customers.map(
                    (customer) => (

                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name}
                        {customer.mobile
                          ? ` - ${customer.mobile}`
                          : ""}
                      </option>

                    )
                  )}

                </select>

              </label>

              <label>
                Newspaper *

                <select
                  name="newspaper"
                  defaultValue={editingSubscription?.newspaper || ""}
                  required
                >

                  <option value="">
                    Select newspaper
                  </option>

                  {newspapers.map(
                    (newspaper) => (

                      <option
                        key={newspaper.id}
                        value={newspaper.id}
                      >
                        {newspaper.name}
                        {" - ₹"}
                        {newspaper.daily_price}
                      </option>

                    )
                  )}

                </select>

              </label>

              <label>
                Price per Day *

                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editingSubscription?.price || ""}
                  placeholder="Enter daily price"
                  required
                />

              </label>

              <label>
                Quantity *

                <input
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={editingSubscription?.quantity || 1}
                  placeholder="Number of copies"
                  required
                />

                <small style={{ color: "#6b7280" }}>
                  Number of copies of this newspaper
                </small>

              </label>

              <label>
                Start Date *

                <input
                  name="start_date"
                  type="date"
                  defaultValue={
                    new Date()
                      .toISOString()
                      .slice(0, 10)
                  }
                  required
                />

              </label>

              <label>
                End Date

                <input
                  name="end_date"
                  type="date"
                  defaultValue={editingSubscription?.end_date || ""}
                />

              </label>

              <div className="form-buttons">

                <button
                  type="button"
                  onClick={() =>
                    changePage(
                      "subscriptions"
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary"
                >
                  {editingSubscription
                    ? "Update Subscription"
                    : "Save Subscription"}
                </button>

              </div>

            </form>

          </section>
        )}

        {page === "employees" && (
          <section>
            <div className="head">
              <div>
                <h2>👨‍💼 Employees</h2>
                <p className="section-description">Manage employees who deliver newspapers.</p>
              </div>
              <div className="delivery-actions">
                <button onClick={loadEmployees} disabled={loadingEmployees}>🔄 Refresh</button>
                <button className="primary" onClick={() => changePage("add-employee")}>+ Add Employee</button>
              </div>
            </div>

            {loadingEmployees ? (
              <div className="no-data"><div>⏳</div><h3>Loading employees...</h3></div>
            ) : employees.length > 0 ? (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Name</th><th>Mobile</th><th>Area / Route</th><th>Joining Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td><strong>{employee.name}</strong></td>
                        <td>{employee.mobile || "-"}</td>
                        <td>{employee.area || "-"}</td>
                        <td>{employee.joining_date || "-"}</td>
                        <td><span className={employee.active ? "status-active" : "status-inactive"}>{employee.active ? "Active" : "Inactive"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">
                <div>👨‍💼</div><h3>No employees yet</h3>
                <p>Add employees who handle newspaper delivery.</p>
                <button className="primary" onClick={() => changePage("add-employee")}>+ Add Employee</button>
              </div>
            )}
          </section>
        )}

        {page === "add-employee" && (
          <section className="form-section">
            <div className="form-title">
              <h2>Add Employee</h2>
              <p>Enter the delivery employee's information.</p>
            </div>
            <form className="form" onSubmit={addEmployee}>
              <label>Name *<input name="name" type="text" placeholder="Employee name" required /></label>
              <label>Mobile<input name="mobile" type="tel" placeholder="Mobile number" /></label>
              <label>Area / Route<input name="area" type="text" placeholder="Delivery area or route" /></label>
              <label>Address<textarea name="address" placeholder="Employee address" /></label>
              <label>Joining Date *<input name="joining_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
              <label>Notes<textarea name="notes" placeholder="Additional notes" /></label>
              <div className="form-buttons">
                <button type="button" onClick={() => changePage("employees")}>Cancel</button>
                <button type="submit" className="primary">Save Employee</button>
              </div>
            </form>
          </section>
        )}

        {page === "delivery" && (
          <section>

            <div className="head">

              <div>

                <h2>
                  🚚 Today's Delivery
                </h2>

                <p className="section-description">
                  {d?.date
                    ? `Delivery for ${d.date}`
                    : "Today's newspaper delivery"}
                </p>

              </div>

              <div className="delivery-actions">

                <button
                  onClick={loadDeliveries}
                  disabled={loadingDeliveries}
                >
                  🔄 Refresh
                </button>

                <button
                  className="primary"
                  onClick={generateDeliveries}
                  disabled={generating}
                >
                  {generating
                    ? "Generating..."
                    : "⚡ Generate Today"}
                </button>

              </div>

            </div>

            <div className="delivery-summary">

              <div className="delivery-summary-card">
                <span>📦 Total</span>
                <strong>
                  {deliveries.length}
                </strong>
              </div>

              <div className="delivery-summary-card">
                <span>✅ Delivered</span>
                <strong>
                  {
                    deliveries.filter(
                      (item) =>
                        item.status ===
                        "delivered"
                    ).length
                  }
                </strong>
              </div>

              <div className="delivery-summary-card">
                <span>❌ Not Delivered</span>
                <strong>
                  {
                    deliveries.filter(
                      (item) =>
                        item.status ===
                        "not_delivered"
                    ).length
                  }
                </strong>
              </div>

              <div className="delivery-summary-card">
                <span>⏸️ Paused</span>
                <strong>
                  {
                    deliveries.filter(
                      (item) =>
                        item.status ===
                        "paused"
                    ).length
                  }
                </strong>
              </div>

            </div>

            {loadingDeliveries ? (

              <div className="no-data">
                <div>⏳</div>
                <h3>Loading deliveries...</h3>
              </div>

            ) : deliveries.length > 0 ? (

              <div className="table-wrapper">

                <table className="delivery-table">

                  <thead>

                    <tr>
                      <th>Customer</th>
                      <th>Newspaper</th>
                      <th>Qty</th>
                      <th>Employee</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>

                  </thead>

                  <tbody>

                    {deliveries.map(
                      (delivery) => (

                        <tr
                          key={delivery.id}
                        >

                          <td>
                            <strong>
                              {delivery.customer_name}
                            </strong>
                          </td>

                          <td>
                            {delivery.newspaper_name}
                          </td>

                          <td>
                            {delivery.quantity}
                          </td>

                          <td>
                            <select
                              value={delivery.employee || ""}
                              onChange={(e) =>
                                handleDeliveryEmployeeUpdate(
                                  delivery.id,
                                  e.target.value
                                )
                              }
                              style={{
                                minWidth: "150px",
                                padding: "8px 10px",
                                borderRadius: "8px",
                                border: "1px solid #d1d5db",
                              }}
                            >
                              <option value="">Unassigned</option>
                              {employees
                                .filter((employee) => employee.active)
                                .map((employee) => (
                                  <option
                                    key={employee.id}
                                    value={employee.id}
                                  >
                                    {employee.name}
                                  </option>
                                ))}
                            </select>
                          </td>

                          <td>

                            <span
                              className={`delivery-status ${delivery.status}`}
                            >
                              {getStatusLabel(
                                delivery.status
                              )}
                            </span>

                          </td>

                          <td>

                            <div className="delivery-buttons">

                              <button
                                className="delivery-btn delivered"
                                onClick={() =>
                                  handleDeliveryStatusUpdate(
                                    delivery.id,
                                    "delivered"
                                  )
                                }
                              >
                                ✅ Delivered
                              </button>

                              <button
                                className="delivery-btn not-delivered"
                                onClick={() =>
                                  handleDeliveryStatusUpdate(
                                    delivery.id,
                                    "not_delivered"
                                  )
                                }
                              >
                                ❌ Not Delivered
                              </button>

                              <button
                                className="delivery-btn paused"
                                onClick={() =>
                                  handleDeliveryStatusUpdate(
                                    delivery.id,
                                    "paused"
                                  )
                                }
                              >
                                ⏸️ Paused
                              </button>

                              <button
                                className="delivery-btn holiday"
                                onClick={() =>
                                  handleDeliveryStatusUpdate(
                                    delivery.id,
                                    "holiday"
                                  )
                                }
                              >
                                🏖️ Holiday
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            ) : (

              <div className="no-data">

                <div>🚚</div>

                <h3>
                  No deliveries for today
                </h3>

                <p>
                  Generate today's deliveries from active subscriptions.
                </p>

                <button
                  className="primary"
                  onClick={generateDeliveries}
                  disabled={generating}
                >
                  {generating
                    ? "Generating..."
                    : "⚡ Generate Today's Deliveries"}
                </button>

              </div>

            )}

          </section>
        )}

        {page === "billing" && (
          <section>
            <div className="head">
              <div>
                <h2>🧾 Billing</h2>

                <p className="section-description">
                  Generate and manage monthly customer invoices.
                </p>
              </div>

              <div className="delivery-actions">
                <button
                  onClick={loadBilling}
                  disabled={loadingBilling}
                >
                  🔄 Refresh
                </button>

                <button
                  className="primary"
                  onClick={generateBilling}
                  disabled={generatingBilling}
                >
                  {generatingBilling
                    ? "Generating..."
                    : "⚡ Generate Billing"}
                </button>
              </div>
            </div>

            <div className="form-section" style={{ marginBottom: "24px" }}>
              <div className="form-title">
                <h2>Billing Month</h2>

                <p>
                  Select the first day of the month you want to bill.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "end",
                  flexWrap: "wrap",
                }}
              >
                <label style={{ minWidth: "220px" }}>
                  Month
                  <input
                    type="date"
                    value={billingMonth}
                    onChange={(e) =>
                      setBillingMonth(e.target.value)
                    }
                  />
                </label>

                <div
                  style={{
                    paddingBottom: "10px",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  {formatBillingMonth(billingMonth)}
                </div>
              </div>
            </div>

            {loadingBilling ? (
              <div className="no-data">
                <div>⏳</div>
                <h3>Loading invoices...</h3>
              </div>
            ) : invoices.length > 0 ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Month</th>
                      <th>Subtotal</th>
                      <th>Previous Balance</th>
                      <th>Paid</th>
                      <th>Pending</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>
                          <strong>
                            {invoice.customer_name ||
                              invoice.customer ||
                              "-"}
                          </strong>
                        </td>

                        <td>
                          {formatBillingMonth(invoice.month)}
                        </td>

                        <td>
                          {formatCurrency(invoice.subtotal)}
                        </td>

                        <td>
                          {formatCurrency(
                            invoice.previous_balance
                          )}
                        </td>

                        <td>
                          {formatCurrency(invoice.paid_amount)}
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              invoice.pending_amount
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={
                              invoice.status === "paid"
                                ? "status-active"
                                : "status-inactive"
                            }
                          >
                            {getInvoiceStatusLabel(
                              invoice.status
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">
                <div>🧾</div>

                <h3>No invoices yet</h3>

                <p>
                  Select a billing month and generate invoices
                  from active subscriptions and delivered newspapers.
                </p>

                <button
                  className="primary"
                  onClick={generateBilling}
                  disabled={generatingBilling}
                >
                  {generatingBilling
                    ? "Generating..."
                    : "⚡ Generate Billing"}
                </button>
              </div>
            )}
          </section>
        )}

        {page === "payments" && (
          <section>
            <div className="head">
              <div>
                <h2>💰 Payments</h2>
                <p className="section-description">
                  Record customer payments and manage outstanding balances.
                </p>
              </div>

              <button
                onClick={loadPayments}
                disabled={loadingPayments}
              >
                🔄 Refresh
              </button>
            </div>

            <section className="form-section" style={{ marginBottom: "24px" }}>
              <div className="form-title">
                <h2>Record Payment</h2>
                <p>Enter the payment received from a customer.</p>
              </div>

              <form className="form" onSubmit={recordPayment}>
                <label>
                  Customer *
                  <select
                    name="customer"
                    value={paymentCustomer}
                    onChange={(e) => setPaymentCustomer(e.target.value)}
                    required
                  >
                    <option value="">Select customer</option>
                    {customers
                      .filter((customer) => customer.active)
                      .map((customer) => (
                        <option
                          key={customer.id}
                          value={customer.id}
                        >
                          {customer.name}
                          {customer.mobile
                            ? ` - ${customer.mobile}`
                            : ""}
                        </option>
                      ))}
                  </select>
                </label>

                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <small style={{ color: "#6b7280" }}>
                    Current Pending Balance
                  </small>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      marginTop: "4px",
                    }}
                  >
                    {formatCurrency(getCustomerPending(paymentCustomer))}
                  </div>
                </div>

                <label>
                  Amount *
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={
                      paymentCustomer
                        ? getCustomerPending(paymentCustomer)
                        : undefined
                    }
                    placeholder="Enter payment amount"
                    required
                  />
                </label>

                <label>
                  Payment Method *
                  <select name="payment_method" defaultValue="cash" required>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank</option>
                  </select>
                </label>

                <label>
                  Payment Date *
                  <input
                    name="payment_date"
                    type="date"
                    defaultValue={new Date()
                      .toISOString()
                      .slice(0, 10)}
                    required
                  />
                </label>

                <label>
                  Reference
                  <input
                    name="reference"
                    type="text"
                    placeholder="UPI reference / transaction ID"
                  />
                </label>

                <label>
                  Notes
                  <textarea
                    name="notes"
                    placeholder="Payment notes"
                  />
                </label>

                <div className="form-buttons">
                  <button
                    type="button"
                    onClick={(event) => {
                      const form = event.currentTarget.closest("form");
                      if (form) form.reset();
                      setPaymentCustomer("");
                    }}
                  >
                    Clear
                  </button>

                  <button
                    type="submit"
                    className="primary"
                    disabled={savingPayment}
                  >
                    {savingPayment
                      ? "Recording..."
                      : "💰 Record Payment"}
                  </button>
                </div>
              </form>
            </section>

            {loadingPayments ? (
              <div className="no-data">
                <div>⏳</div>
                <h3>Loading payments...</h3>
              </div>
            ) : payments.length > 0 ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Notes</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.payment_date}</td>
                        <td>
                          <strong>
                            {payment.customer_name ||
                              payment.customer ||
                              "-"}
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {formatCurrency(payment.amount)}
                          </strong>
                        </td>
                        <td>
                          {(payment.payment_method || "-")
                            .toString()
                            .toUpperCase()}
                        </td>
                        <td>{payment.reference || "-"}</td>
                        <td>{payment.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">
                <div>💰</div>
                <h3>No payments yet</h3>
                <p>Record the first customer payment above.</p>
              </div>
            )}
          </section>
        )}

        {page === "reports" && (
          <section className="empty">
            <div>🚧</div>
            <h2>Reports</h2>
            <p>This module is coming next.</p>
            <small>The backend foundation is ready.</small>
          </section>
        )}

      </main>

    </div>
  );
}


function Card({
  icon,
  title,
  value,
}) {
  return (
    <div className="card">

      <div className="card-icon">
        {icon}
      </div>

      <div className="card-content">

        <small>
          {title}
        </small>

        <h2>
          {value}
        </h2>

      </div>

    </div>
  );
}


createRoot(
  document.getElementById("root")
).render(
  <App />
);