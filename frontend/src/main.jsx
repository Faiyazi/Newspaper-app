import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API = "http://127.0.0.1:8000/api";

function App() {
  const [page, setPage] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [newspapers, setNewspapers] = useState([]);
  const [editingNewspaper, setEditingNewspaper] = useState(null);

  const loadData = async () => {
    try {
      const [dashboardRes, customersRes, newspapersRes] =
        await Promise.all([
          fetch(`${API}/dashboard/`),
          fetch(`${API}/customers/`),
          fetch(`${API}/newspapers/`),
        ]);

      setDashboard(await dashboardRes.json());
      setCustomers(await customersRes.json());
      setNewspapers(await newspapersRes.json());
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveNewspaper = async (e) => {
    e.preventDefault();

    const form = new FormData(e.target);

    const data = {
      name: form.get("name"),
      language: form.get("language"),
      edition: form.get("edition"),
      daily_price: form.get("daily_price"),
      active: form.get("active") === "on",
    };

    const url = editingNewspaper
      ? `${API}/newspapers/${editingNewspaper.id}/`
      : `${API}/newspapers/`;

    const method = editingNewspaper ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      await loadData();
      setEditingNewspaper(null);
      setPage("newspapers");
    } else {
      alert("Could not save newspaper.");
    }
  };

  const editNewspaper = (newspaper) => {
    setEditingNewspaper(newspaper);
    setPage("add-newspaper");
  };

  const toggleNewspaper = async (newspaper) => {
    await fetch(`${API}/newspapers/${newspaper.id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        active: !newspaper.active,
      }),
    });

    loadData();
  };

  const NavItem = ({ id, icon, label }) => (
    <button
      className={`nav-item ${page === id ? "active" : ""}`}
      onClick={() => setPage(id)}
    >
      <span>{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          📰 <span>NewsPaper</span>
        </div>

        <NavItem id="dashboard" icon="🏠" label="Dashboard" />
        <NavItem id="customers" icon="👥" label="Customers" />
        <NavItem id="newspapers" icon="📰" label="Newspapers" />
        <NavItem id="subscriptions" icon="📦" label="Subscriptions" />
        <NavItem id="delivery" icon="🚚" label="Today's Delivery" />
        <NavItem id="billing" icon="🧾" label="Billing" />
        <NavItem id="payments" icon="💰" label="Payments" />
        <NavItem id="reports" icon="📊" label="Reports" />

      </aside>

      {/* MAIN */}
      <main className="main">

        <header className="topbar">

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
            className="admin-btn"
            onClick={() =>
              window.open(
                "http://127.0.0.1:8000/admin/",
                "_blank"
              )
            }
          >
            ⚙ Admin
          </button>

        </header>


        {/* DASHBOARD */}

        {page === "dashboard" && (
          <>
            <section className="cards">

              <Card
                icon="👥"
                title="Active Customers"
                value={dashboard?.active_customers || 0}
              />

              <Card
                icon="📰"
                title="Subscriptions"
                value={dashboard?.active_subscriptions || 0}
              />

              <Card
                icon="💰"
                title="Today's Collection"
                value={`₹${dashboard?.today_collection || 0}`}
              />

              <Card
                icon="🔴"
                title="Pending Amount"
                value={`₹${dashboard?.total_pending || 0}`}
              />

            </section>

            <section className="quick">

              <h2>Quick Actions</h2>

              <div className="quick-grid">

                <button onClick={() => setPage("add-customer")}>
                  ➕ Add Customer
                </button>

                <button onClick={() => setPage("customers")}>
                  👥 Customers
                </button>

                <button onClick={() => setPage("newspapers")}>
                  📰 Newspapers
                </button>

                <button onClick={() => setPage("payments")}>
                  💰 Payment
                </button>

              </div>

            </section>
          </>
        )}


        {/* CUSTOMERS */}

        {page === "customers" && (
          <section className="panel">

            <div className="panel-head">

              <div>
                <h2>👥 Customers</h2>
                <p>Manage your newspaper customers.</p>
              </div>

              <button
                className="primary"
                onClick={() => setPage("add-customer")}
              >
                + Add Customer
              </button>

            </div>

            {customers.length === 0 ? (
              <p>No customers yet.</p>
            ) : (

              <div className="table-wrap">

                <table>

                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Area</th>
                      <th>Start Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>

                    {customers.map((customer) => (

                      <tr key={customer.id}>

                        <td>
                          <strong>{customer.name}</strong>
                        </td>

                        <td>
                          {customer.mobile || "-"}
                        </td>

                        <td>
                          {customer.area || "-"}
                        </td>

                        <td>
                          {customer.start_date}
                        </td>

                        <td>
                          {customer.active
                            ? "Active"
                            : "Inactive"}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </section>
        )}


        {/* NEWSPAPERS */}

        {page === "newspapers" && (

          <section className="panel">

            <div className="panel-head">

              <div>
                <h2>📰 Newspapers</h2>

                <p>
                  Manage newspapers, editions and prices.
                </p>
              </div>

              <button
                className="primary"
                onClick={() => {
                  setEditingNewspaper(null);
                  setPage("add-newspaper");
                }}
              >
                + Add Newspaper
              </button>

            </div>


            {newspapers.length === 0 ? (

              <div className="empty">
                <div>📰</div>

                <h3>No newspapers yet</h3>

                <p>
                  Add your first newspaper to get started.
                </p>

                <button
                  className="primary"
                  onClick={() => setPage("add-newspaper")}
                >
                  + Add Newspaper
                </button>

              </div>

            ) : (

              <div className="table-wrap">

                <table>

                  <thead>

                    <tr>
                      <th>Name</th>
                      <th>Language</th>
                      <th>Edition</th>
                      <th>Daily Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>

                  </thead>


                  <tbody>

                    {newspapers.map((newspaper) => (

                      <tr key={newspaper.id}>

                        <td>
                          <strong>
                            {newspaper.name}
                          </strong>
                        </td>

                        <td>
                          {newspaper.language || "-"}
                        </td>

                        <td>
                          {newspaper.edition || "-"}
                        </td>

                        <td>
                          ₹{newspaper.daily_price}
                        </td>

                        <td>

                          <span
                            className={
                              newspaper.active
                                ? "badge green"
                                : "badge red"
                            }
                          >
                            {newspaper.active
                              ? "Active"
                              : "Inactive"}
                          </span>

                        </td>

                        <td>

                          <button
                            className="action-btn"
                            onClick={() =>
                              editNewspaper(newspaper)
                            }
                          >
                            ✏️ Edit
                          </button>

                          <button
                            className="action-btn"
                            onClick={() =>
                              toggleNewspaper(newspaper)
                            }
                          >
                            {newspaper.active
                              ? "🔴 Disable"
                              : "🟢 Enable"}
                          </button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        )}


        {/* ADD / EDIT NEWSPAPER */}

        {page === "add-newspaper" && (

          <section className="panel form-panel">

            <div className="panel-head">

              <div>

                <h2>
                  {editingNewspaper
                    ? "✏️ Edit Newspaper"
                    : "📰 Add Newspaper"}
                </h2>

                <p>
                  Enter newspaper details below.
                </p>

              </div>

            </div>


            <form onSubmit={saveNewspaper}>

              <label>
                Newspaper Name

                <input
                  name="name"
                  required
                  defaultValue={
                    editingNewspaper?.name || ""
                  }
                  placeholder="Gujarat Samachar"
                />

              </label>


              <label>
                Language

                <input
                  name="language"
                  defaultValue={
                    editingNewspaper?.language || ""
                  }
                  placeholder="Gujarati"
                />

              </label>


              <label>
                Edition

                <input
                  name="edition"
                  defaultValue={
                    editingNewspaper?.edition || ""
                  }
                  placeholder="Ahmedabad"
                />

              </label>


              <label>
                Daily Price

                <input
                  name="daily_price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={
                    editingNewspaper?.daily_price || ""
                  }
                  placeholder="5"
                />

              </label>


              <label className="checkbox-label">

                <input
                  name="active"
                  type="checkbox"
                  defaultChecked={
                    editingNewspaper
                      ? editingNewspaper.active
                      : true
                  }
                />

                Active Newspaper

              </label>


              <div className="form-actions">

                <button
                  type="button"
                  onClick={() => {
                    setEditingNewspaper(null);
                    setPage("newspapers");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary"
                >
                  {editingNewspaper
                    ? "Update Newspaper"
                    : "Save Newspaper"}
                </button>

              </div>

            </form>

          </section>

        )}


        {/* OTHER MODULES */}

        {[
          "subscriptions",
          "delivery",
          "billing",
          "payments",
          "reports",
        ].includes(page) && (

          <section className="panel coming">

            <div className="big-icon">
              🚧
            </div>

            <h2>
              {page.replace("-", " ")}
            </h2>

            <p>
              This module is coming next.
            </p>

          </section>

        )}

      </main>

    </div>
  );
}


function Card({ icon, title, value }) {

  return (

    <div className="card">

      <div className="card-icon">
        {icon}
      </div>

      <div>

        <p>{title}</p>

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