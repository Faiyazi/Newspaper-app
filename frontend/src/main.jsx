import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API = "https://newspaper-business-api.onrender.com/api";

function App() {
  const [page, setPage] = useState("dashboard");
  const [d, setD] = useState(null);
  const [customers, setC] = useState([]);
  const [newspapers, setN] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = async () => {
    try {
      const [dashboardRes, customersRes, newspapersRes] =
        await Promise.all([
          fetch(API + "/dashboard/"),
          fetch(API + "/customers/"),
          fetch(API + "/newspapers/"),
        ]);

      const dashboard = await dashboardRes.json();
      const customerData = await customersRes.json();
      const newspaperData = await newspapersRes.json();

      setD(dashboard);
      setC(customerData);
      setN(newspaperData);
    } catch (error) {
      console.log("API Error:", error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changePage = (newPage) => {
    setPage(newPage);
    setMenuOpen(false);
  };

  const addCustomer = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    data.active = true;

    if (!data.start_date) {
      data.start_date = new Date()
        .toISOString()
        .slice(0, 10);
    }

    try {
      const response = await fetch(API + "/customers/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        e.target.reset();
        await load();
        setPage("customers");
        setMenuOpen(false);
      } else {
        const errorData = await response.json();
        console.log(errorData);
        alert("Unable to add customer.");
      }
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

  return (
    <div className="app">

      {/* MOBILE TOP BAR */}
      <div className="mobile-header">
        <button
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <strong>📰 NewsPaper</strong>

        <div className="mobile-spacer"></div>
      </div>

      {/* MOBILE OVERLAY */}
      {menuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <aside className={menuOpen ? "mobile-open" : ""}>

        <div className="brand">
          📰 NewsPaper
        </div>

        <div className="mobile-close-area">
          <button
            className="mobile-close"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
        </div>

        {nav.map((item) => (
          <button
            key={item[0]}
            className={
              page === item[0] ? "active" : ""
            }
            onClick={() => changePage(item[0])}
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

      {/* MAIN CONTENT */}
      <main>

        {/* PAGE HEADER */}
        <header>
          <div>
            <h1>
              {page === "dashboard"
                ? "Good Evening 👋"
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

        {/* =========================
            DASHBOARD
        ========================= */}

        {page === "dashboard" && (
          <>
            <div className="cards">

              <Card
                icon="👥"
                title="Active Customers"
                value={d?.active_customers || 0}
              />

              <Card
                icon="📰"
                title="Subscriptions"
                value={d?.active_subscriptions || 0}
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
                  onClick={() => changePage("add")}
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
                    changePage("delivery")
                  }
                >
                  🚚 Delivery
                </button>

                <button
                  onClick={() =>
                    changePage("payments")
                  }
                >
                  💰 Payment
                </button>

              </div>
            </section>
          </>
        )}

        {/* =========================
            CUSTOMERS
        ========================= */}

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

                    {customers.map((customer) => (
                      <tr key={customer.id}>

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
                    ))}

                  </tbody>

                </table>

              </div>
            ) : (
              <div className="no-data">
                <div>👥</div>
                <h3>No customers yet</h3>
                <p>
                  Add your first customer to get started.
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

        {/* =========================
            ADD CUSTOMER
        ========================= */}

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

        {/* =========================
            NEWSPAPERS
        ========================= */}

        {page === "newspapers" && (
          <section>

            <div className="head">

              <div>
                <h2>📰 Newspapers</h2>

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

                    {newspapers.map((newspaper) => (
                      <tr key={newspaper.id}>

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
                    ))}

                  </tbody>

                </table>

              </div>
            ) : (
              <div className="no-data">

                <div>📰</div>

                <h3>No newspapers yet</h3>

                <p>
                  Add newspapers from the Admin panel.
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

        {/* =========================
            FUTURE MODULES
        ========================= */}

        {[
          "subscriptions",
          "delivery",
          "billing",
          "payments",
          "reports",
        ].includes(page) && (
          <section className="empty">

            <div>🚧</div>

            <h2>
              {page === "delivery"
                ? "Today's Delivery"
                : page.charAt(0).toUpperCase() +
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

/* =========================
   CARD COMPONENT
========================= */

function Card({ icon, title, value }) {
  return (
    <div className="card">

      <div className="card-icon">
        {icon}
      </div>

      <div className="card-content">

        <small>{title}</small>

        <h2>{value}</h2>

      </div>

    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <App />
);