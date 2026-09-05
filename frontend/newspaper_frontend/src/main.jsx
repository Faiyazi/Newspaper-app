import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API = "https://newspaper-business-api.onrender.com/api";

function App() {
  const [page, setPage] = useState("dashboard");
  const [d, setD] = useState(null);
  const [customers, setC] = useState([]);
  const [newspapers, setN] = useState([]);

  const load = async () => {
    try {
      const [a, b, c] = await Promise.all([
        fetch(API + "/dashboard/").then((r) => r.json()),
        fetch(API + "/customers/").then((r) => r.json()),
        fetch(API + "/newspapers/").then((r) => r.json()),
      ]);

      setD(a);
      setC(b);
      setN(c);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();

    let x = Object.fromEntries(new FormData(e.target));

    x.active = true;
    x.start_date =
      x.start_date || new Date().toISOString().slice(0, 10);

    try {
      const r = await fetch(API + "/customers/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(x),
      });

      if (r.ok) {
        e.target.reset();
        await load();
        setPage("customers");
      } else {
        alert("Unable to add customer.");
      }
    } catch (error) {
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
      <aside>
        <div className="brand">📰 NewsPaper</div>

        {nav.map((n) => (
          <button
            key={n[0]}
            className={page === n[0] ? "active" : ""}
            onClick={() => setPage(n[0])}
          >
            {n[1]} <span>{n[2]}</span>
          </button>
        ))}
      </aside>

      <main>
        <header>
          <div>
            <h1>
              {page === "dashboard"
                ? "Good Evening 👋"
                : page.replace("-", " ")}
            </h1>

            <p>Manage your newspaper business easily.</p>
          </div>

          <button
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
                i="👥"
                t="Active Customers"
                v={d?.active_customers || 0}
              />

              <Card
                i="📰"
                t="Subscriptions"
                v={d?.active_subscriptions || 0}
              />

              <Card
                i="💰"
                t="Today's Collection"
                v={"₹" + (d?.today_collection || 0)}
              />

              <Card
                i="🔴"
                t="Pending Amount"
                v={"₹" + (d?.total_pending || 0)}
              />
            </div>

            <section>
              <h2>Quick Actions</h2>

              <div className="quick">
                <button onClick={() => setPage("add")}>
                  ➕ Add Customer
                </button>

                <button onClick={() => setPage("customers")}>
                  👥 Customers
                </button>

                <button onClick={() => setPage("delivery")}>
                  🚚 Delivery
                </button>

                <button onClick={() => setPage("payments")}>
                  💰 Payment
                </button>
              </div>
            </section>
          </>
        )}

        {page === "customers" && (
          <section>
            <div className="head">
              <h2>Customers</h2>

              <button
                className="primary"
                onClick={() => setPage("add")}
              >
                + Add Customer
              </button>
            </div>

            {customers.length ? (
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
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{c.mobile || "-"}</td>
                        <td>{c.area || "-"}</td>
                        <td>
                          {c.active ? "Active" : "Inactive"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No customers yet.</p>
            )}
          </section>
        )}

        {page === "add" && (
          <section className="form">
            <h2>Add Customer</h2>

            <form onSubmit={add}>
              {[
                "name",
                "mobile",
                "area",
                "address",
                "start_date",
                "notes",
              ].map((f) => (
                <label key={f}>
                  {f.replace("_", " ")}

                  {f === "address" || f === "notes" ? (
                    <textarea name={f} />
                  ) : (
                    <input
                      name={f}
                      type={
                        f === "start_date" ? "date" : "text"
                      }
                      required={f === "name"}
                    />
                  )}
                </label>
              ))}

              <button className="primary" type="submit">
                Save Customer
              </button>
            </form>
          </section>
        )}

        {page === "newspapers" && (
          <section>
            <h2>Newspapers</h2>

            {newspapers.length ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Language</th>
                    </tr>
                  </thead>

                  <tbody>
                    {newspapers.map((n) => (
                      <tr key={n.id}>
                        <td>{n.name}</td>
                        <td>₹{n.daily_price}</td>
                        <td>{n.language || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Add newspapers from Admin.</p>
            )}
          </section>
        )}

        {[
          "subscriptions",
          "delivery",
          "billing",
          "payments",
          "reports",
        ].includes(page) && (
          <section className="empty">
            <div>🚧</div>

            <h2>{page}</h2>

            <p>
              This module is next. The backend is ready.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function Card(p) {
  return (
    <div className="card">
      <b>{p.i}</b>

      <div>
        <small>{p.t}</small>
        <h2>{p.v}</h2>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);