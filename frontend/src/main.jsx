import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API = "https://newspaper-business-api.onrender.com/api";

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

  const load = async () => {
    try {
      const [
        dashboardRes,
        customersRes,
        newspapersRes,
        subscriptionsRes,
      ] = await Promise.all([
        fetch(API + "/dashboard/"),
        fetch(API + "/customers/"),
        fetch(API + "/newspapers/"),
        fetch(API + "/subscriptions/"),
      ]);

      setD(await dashboardRes.json());
      setC(await customersRes.json());
      setN(await newspapersRes.json());
      setS(await subscriptionsRes.json());
    } catch (error) {
      console.log("API Error:", error);
    }
  };

  const loadDeliveries = async () => {
    setLoadingDeliveries(true);

    try {
      const response = await fetch(
        API + "/deliveries/today/"
      );

      if (!response.ok) {
        throw new Error("Unable to load deliveries");
      }

      const data = await response.json();

      setDeliveries(data);
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
    }
  }, [page]);

  const changePage = (newPage) => {
    setPage(newPage);
    setMenuOpen(false);
  };

  const addCustomer = async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(
      new FormData(e.target)
    );

    data.active = true;

    if (!data.start_date) {
      data.start_date = new Date()
        .toISOString()
        .slice(0, 10);
    }

    try {
      const response = await fetch(
        API + "/customers/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        e.target.reset();
        await load();
        changePage("customers");
      } else {
        alert("Unable to add customer.");
      }
    } catch (error) {
      alert("Unable to connect to server.");
    }
  };

  const addSubscription = async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(
      new FormData(e.target)
    );

    data.customer = Number(data.customer);
    data.newspaper = Number(data.newspaper);
    data.price = Number(data.price);
    data.status = "active";

    if (!data.end_date) {
      data.end_date = null;
    }

    try {
      const response = await fetch(
        API + "/subscriptions/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        e.target.reset();
        await load();
        changePage("subscriptions");
      } else {
        const error = await response.json();
        console.log(error);
        alert("Unable to create subscription.");
      }
    } catch (error) {
      console.log(error);
      alert("Unable to connect to server.");
    }
  };

  const generateDeliveries = async () => {
    setGenerating(true);

    try {
      const response = await fetch(
        API + "/deliveries/generate-today/",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log(data);
        alert("Unable to generate deliveries.");
        return;
      }

      alert(
        `${data.created} delivery record(s) created.`
      );

      await loadDeliveries();
      await load();
    } catch (error) {
      console.log(error);
      alert("Unable to connect to server.");
    } finally {
      setGenerating(false);
    }
  };

  const updateDeliveryStatus = async (
    deliveryId,
    status
  ) => {
    try {
      const response = await fetch(
        API + `/deliveries/${deliveryId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: status,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.log(error);
        alert("Unable to update delivery.");
        return;
      }

      setDeliveries((current) =>
        current.map((delivery) =>
          delivery.id === deliveryId
            ? {
                ...delivery,
                status: status,
              }
            : delivery
        )
      );

      await load();
    } catch (error) {
      console.log(error);
      alert("Unable to connect to server.");
    }
  };

  const nav = [
    ["dashboard", "🏠", "Dashboard"],
    ["customers", "👥", "Customers"],
    ["newspapers", "📰", "Newspapers"],
    ["subscriptions", "📦", "Subscriptions"],
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
                  onClick={() =>
                    changePage("subscriptions")
                  }
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
                Add Subscription
              </h2>

              <p>
                Assign a newspaper to a customer.
              </p>

            </div>

            <form
              className="form"
              onSubmit={addSubscription}
            >

              <label>
                Customer *

                <select
                  name="customer"
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
                  placeholder="Enter daily price"
                  required
                />

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
                  Save Subscription
                </button>

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
                                  updateDeliveryStatus(
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
                                  updateDeliveryStatus(
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
                                  updateDeliveryStatus(
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
                                  updateDeliveryStatus(
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

        {[
          "billing",
          "payments",
          "reports",
        ].includes(page) && (

          <section className="empty">

            <div>🚧</div>

            <h2>
              {page.charAt(0).toUpperCase() +
                page.slice(1)}
            </h2>

            <p>
              This module is coming next.
            </p>

            <small>
              The backend foundation is ready.
            </small>

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