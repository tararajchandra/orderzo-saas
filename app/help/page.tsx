"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HelpPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    { id: "getting-started", title: "🚀 Getting Started", icon: "🚀" },
    { id: "customer", title: "🍽️ Customer Portal", icon: "🍽️" },
    { id: "admin", title: "👨‍💼 Admin Panel", icon: "👨‍💼" },
    { id: "delivery", title: "🚚 Delivery Dashboard", icon: "🚚" },
    { id: "salesman", title: "💼 Salesman Dashboard", icon: "💼" },
    { id: "reports", title: "📊 Reports & Analytics", icon: "📊" },
    { id: "troubleshooting", title: "🔧 Troubleshooting", icon: "🔧" },
    { id: "faqs", title: "❓ FAQs", icon: "❓" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* Header */}
      <div
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
          padding: "1.5rem 1rem",
          color: "white",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>
            📚 Help & Documentation
          </h1>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              opacity: 0.9,
              fontSize: "0.95rem",
            }}
          >
            Complete guide to using OrderZo Management System
          </p>
        </div>
      </div>

      {/* Navigation Pills */}
      <div
        style={{
          background: "var(--surface)",
          padding: "1rem",
          overflowX: "auto",
          borderBottom: "1px solid var(--border-color)",
          position: "sticky",
          top: "120px",
          zIndex: 99,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            maxWidth: "1200px",
            margin: "0 auto",
            minWidth: "max-content",
          }}
        >
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                padding: "0.75rem 1.25rem",
                borderRadius: "12px",
                border: "none",
                background:
                  activeSection === section.id
                    ? "var(--primary)"
                    : "rgba(255,255,255,0.05)",
                color: activeSection === section.id ? "white" : "var(--text)",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: activeSection === section.id ? 600 : 400,
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {section.icon}{" "}
              {section.title.replace(/^[🚀🍽️👨‍💼🚚💼📊🔧❓]\s/, "")}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}
      >
        {/* Getting Started */}
        {activeSection === "getting-started" && (
          <div className="fade-in">
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              🚀 Getting Started
            </h2>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                System Requirements
              </h3>
              <ul style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>✅ Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>✅ Stable internet connection</li>
                <li>✅ Screen resolution: 1280x720 or higher (recommended)</li>
              </ul>
            </div>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                First Time Setup
              </h3>
              <ol style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>
                  <strong>Access the Application:</strong> Open your browser and
                  navigate to your OrderZo application URL
                </li>
                <li>
                  <strong>Admin Login:</strong> Visit <code>/admin</code> to
                  access the admin panel
                </li>
                <li>
                  <strong>Default Credentials</strong> (change immediately after
                  first login):
                  <ul style={{ marginTop: "0.5rem" }}>
                    <li>
                      Email: <code>admin@restaurant.com</code>
                    </li>
                    <li>
                      Password: <code>admin123</code>
                    </li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                User Roles
              </h3>
              <div style={{ display: "grid", gap: "1rem" }}>
                <div
                  style={{
                    padding: "1rem",
                    background: "rgba(59, 130, 246, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  <strong>👨‍💼 Admin:</strong> Full access to all features
                </div>
                <div
                  style={{
                    padding: "1rem",
                    background: "rgba(34, 197, 94, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  <strong>👤 Customer:</strong> Browse menu, place orders, track
                  deliveries
                </div>
                <div
                  style={{
                    padding: "1rem",
                    background: "rgba(234, 179, 8, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  <strong>🚚 Delivery Boy:</strong> View assigned deliveries,
                  update delivery status
                </div>
                <div
                  style={{
                    padding: "1rem",
                    background: "rgba(168, 85, 247, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  <strong>💼 Salesman:</strong> Create orders, manage customer
                  interactions
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Portal */}
        {activeSection === "customer" && (
          <div className="fade-in">
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              🍽️ Customer Portal
            </h2>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                Browsing the Menu
              </h3>
              <p style={{ marginBottom: "1rem" }}>
                Access the menu by clicking <strong>"Browse Menu"</strong> from
                the homepage or navigate to <code>/menu</code> directly.
              </p>

              <h4
                style={{
                  fontSize: "1.1rem",
                  marginTop: "1.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                Features:
              </h4>
              <ul style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>
                  🔍 <strong>Search Bar:</strong> Type item names to find
                  specific dishes
                </li>
                <li>
                  📂 <strong>Categories:</strong> Click category buttons to
                  filter items
                </li>
                <li>
                  💚 <strong>Availability:</strong> Only available items are
                  shown by default
                </li>
              </ul>
            </div>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                Shopping Cart
              </h3>
              <ol style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>
                  Click <strong>"Add to Cart"</strong> on any menu item
                </li>
                <li>
                  Adjust quantity using <strong>+</strong> and{" "}
                  <strong>-</strong> buttons
                </li>
                <li>View cart total in real-time</li>
                <li>Click cart icon in navbar to review items</li>
              </ol>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                Placing an Order
              </h3>
              <ol style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>
                  Review cart and click <strong>"Proceed to Checkout"</strong>
                </li>
                <li>Enter customer details (name, phone, address)</li>
                <li>Select delivery location (if applicable)</li>
                <li>Choose payment method (Cash, Card, UPI, Net Banking)</li>
                <li>
                  Click <strong>"Place Order"</strong>
                </li>
                <li>Receive order confirmation with Order ID</li>
              </ol>
            </div>
          </div>
        )}

        {/* Admin Panel */}
        {activeSection === "admin" && (
          <div className="fade-in">
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              👨‍💼 Admin Panel
            </h2>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                Menu Management
              </h3>

              <h4
                style={{
                  fontSize: "1.1rem",
                  marginTop: "1rem",
                  marginBottom: "0.75rem",
                }}
              >
                🔍 Searching Menu Items (NEW)
              </h4>
              <ul
                style={{
                  lineHeight: 1.8,
                  paddingLeft: "1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <li>Use the search bar at the top of the menu page</li>
                <li>Search by item name, description, or category</li>
                <li>Results update in real-time as you type</li>
                <li>View count of matching items below search bar</li>
              </ul>

              <h4
                style={{
                  fontSize: "1.1rem",
                  marginTop: "1rem",
                  marginBottom: "0.75rem",
                }}
              >
                Adding New Menu Item
              </h4>
              <ol style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>
                  Click <strong>"+ Add Item"</strong> button
                </li>
                <li>
                  Fill in required fields:
                  <ul style={{ marginTop: "0.5rem" }}>
                    <li>Name (required)</li>
                    <li>Price in ₹ (required)</li>
                    <li>Category (required)</li>
                    <li>Description (optional)</li>
                    <li>GST Rate (default: 5%)</li>
                  </ul>
                </li>
                <li>
                  <strong>Upload Image:</strong>
                  <ul style={{ marginTop: "0.5rem" }}>
                    <li>Click "Choose File"</li>
                    <li>Supported: JPG, PNG, GIF, WebP</li>
                    <li>Recommended: 800x800 pixels</li>
                    <li>Max size: 5MB</li>
                    <li>Preview appears below</li>
                  </ul>
                </li>
                <li>Check "Available for ordering" if item is in stock</li>
                <li>
                  Click <strong>"Add Item"</strong> to save
                </li>
              </ol>
            </div>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                Order Management
              </h3>
              <p style={{ marginBottom: "1rem" }}>
                Navigate to <strong>Admin → Orders</strong> to view and manage
                all orders.
              </p>

              <h4
                style={{
                  fontSize: "1.1rem",
                  marginTop: "1rem",
                  marginBottom: "0.75rem",
                }}
              >
                Order Status Types:
              </h4>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                <div
                  style={{
                    padding: "0.75rem",
                    background: "rgba(234, 179, 8, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  🟡 <strong>Pending:</strong> Order received, awaiting
                  confirmation
                </div>
                <div
                  style={{
                    padding: "0.75rem",
                    background: "rgba(59, 130, 246, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  🔵 <strong>Confirmed:</strong> Order confirmed by restaurant
                </div>
                <div
                  style={{
                    padding: "0.75rem",
                    background: "rgba(168, 85, 247, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  👨‍🍳 <strong>Preparing:</strong> Food is being prepared
                </div>
                <div
                  style={{
                    padding: "0.75rem",
                    background: "rgba(34, 197, 94, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  🚚 <strong>Out for Delivery:</strong> Delivery boy assigned
                </div>
                <div
                  style={{
                    padding: "0.75rem",
                    background: "rgba(34, 197, 94, 0.2)",
                    borderRadius: "8px",
                  }}
                >
                  ✅ <strong>Delivered:</strong> Order completed
                </div>
                <div
                  style={{
                    padding: "0.75rem",
                    background: "rgba(239, 68, 68, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  ❌ <strong>Cancelled:</strong> Order cancelled
                </div>
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                Daily Order Numbering (NEW)
              </h3>
              <p style={{ marginBottom: "1rem" }}>
                Order numbers now reset daily with format{" "}
                <code>YYYYMMDD-XXX</code>
              </p>

              <h4
                style={{
                  fontSize: "1.1rem",
                  marginTop: "1rem",
                  marginBottom: "0.75rem",
                }}
              >
                Examples:
              </h4>
              <ul style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>
                  First order of Dec 16, 2025: <code>20251216-001</code>
                </li>
                <li>
                  Second order of Dec 16, 2025: <code>20251216-002</code>
                </li>
                <li>
                  First order of Dec 17, 2025: <code>20251217-001</code> ←
                  Resets!
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Delivery Dashboard */}
        {activeSection === "delivery" && (
          <div className="fade-in">
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              🚚 Delivery Dashboard
            </h2>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                Accessing Dashboard
              </h3>
              <ol style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>
                  Login at <code>/delivery</code>
                </li>
                <li>Enter credentials provided by admin</li>
                <li>View assigned deliveries and earnings</li>
              </ol>
            </div>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                Updating Delivery Status
              </h3>
              <ol style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>Click on assigned order</li>
                <li>
                  Click <strong>"Mark as Picked Up"</strong> when leaving
                  restaurant
                </li>
                <li>Status updates to "Out for Delivery"</li>
                <li>
                  Click <strong>"Mark as Delivered"</strong> upon arrival
                </li>
                <li>Confirm delivery</li>
                <li>Commission automatically calculated</li>
              </ol>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                Earnings & Payouts
              </h3>
              <ul style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>View daily earnings summary</li>
                <li>Commission breakdown per order</li>
                <li>Total pending payout</li>
                <li>
                  Navigate to <strong>Payouts</strong> for history
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Salesman Dashboard */}
        {activeSection === "salesman" && (
          <div className="fade-in">
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              💼 Salesman Dashboard
            </h2>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                Creating Orders
              </h3>
              <ol style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>
                  Login at <code>/salesman</code>
                </li>
                <li>
                  Click <strong>"New Order"</strong>
                </li>
                <li>Browse menu and add items</li>
                <li>Enter customer details (name, phone, address)</li>
                <li>Select delivery location</li>
                <li>Choose payment method</li>
                <li>Submit order - sent to kitchen</li>
              </ol>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                Performance Tracking
              </h3>
              <p style={{ marginBottom: "1rem" }}>Your dashboard shows:</p>
              <ul style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>💰 Total sales amount</li>
                <li>📦 Number of orders created</li>
                <li>💵 Commission earned</li>
                <li>📈 Performance trends</li>
              </ul>
            </div>
          </div>
        )}

        {/* Reports & Analytics */}
        {activeSection === "reports" && (
          <div className="fade-in">
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              📊 Reports & Analytics
            </h2>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                Available Reports
              </h3>

              <div style={{ display: "grid", gap: "1rem" }}>
                <div
                  style={{
                    padding: "1rem",
                    background: "rgba(59, 130, 246, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  <strong>📈 Sales Report</strong>
                  <p
                    style={{
                      margin: "0.5rem 0 0 0",
                      fontSize: "0.9rem",
                      opacity: 0.8,
                    }}
                  >
                    Daily/Weekly/Monthly sales, category breakdown, payment
                    analysis
                  </p>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    background: "rgba(34, 197, 94, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  <strong>🧾 GST Report</strong>
                  <p
                    style={{
                      margin: "0.5rem 0 0 0",
                      fontSize: "0.9rem",
                      opacity: 0.8,
                    }}
                  >
                    Tax collected, CGST/SGST/IGST breakdown, GSTR-1 format
                  </p>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    background: "rgba(234, 179, 8, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  <strong>💳 Outstanding Report</strong>
                  <p
                    style={{
                      margin: "0.5rem 0 0 0",
                      fontSize: "0.9rem",
                      opacity: 0.8,
                    }}
                  >
                    Pending payments, customer-wise outstanding, aging analysis
                  </p>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    background: "rgba(168, 85, 247, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  <strong>🚚 Delivery Report</strong>
                  <p
                    style={{
                      margin: "0.5rem 0 0 0",
                      fontSize: "0.9rem",
                      opacity: 0.8,
                    }}
                  >
                    Delivery boy performance, average time, commission summary
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
                Generating Reports
              </h3>
              <ol style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>Navigate to desired report section</li>
                <li>Select date range</li>
                <li>Apply filters (if any)</li>
                <li>
                  Click <strong>"Generate Report"</strong>
                </li>
                <li>View on screen or download (Excel/PDF)</li>
              </ol>
            </div>
          </div>
        )}

        {/* Troubleshooting */}
        {activeSection === "troubleshooting" && (
          <div className="fade-in">
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              🔧 Troubleshooting
            </h2>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "1rem",
                  color: "var(--error)",
                }}
              >
                🔴 Cannot Login
              </h3>
              <p style={{ marginBottom: "0.75rem" }}>
                <strong>Problem:</strong> Login fails with incorrect credentials
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Solution:</strong>
              </p>
              <ul style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>Verify email and password</li>
                <li>Check caps lock</li>
                <li>Contact admin for password reset</li>
                <li>Clear browser cache and cookies</li>
              </ul>
            </div>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "1rem",
                  color: "var(--error)",
                }}
              >
                🔴 Menu Items Not Showing
              </h3>
              <p style={{ marginBottom: "0.75rem" }}>
                <strong>Problem:</strong> Menu appears empty
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Solution:</strong>
              </p>
              <ul style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>Check if items are marked as "Available"</li>
                <li>Verify category filters</li>
                <li>Clear search bar</li>
                <li>Refresh the page (F5)</li>
              </ul>
            </div>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "1rem",
                  color: "var(--error)",
                }}
              >
                🔴 Image Not Uploading
              </h3>
              <p style={{ marginBottom: "0.75rem" }}>
                <strong>Problem:</strong> Cannot upload menu item images
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Solution:</strong>
              </p>
              <ul style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>Check file size (max 5MB)</li>
                <li>Verify file format (JPG, PNG, GIF, WebP)</li>
                <li>Clear browser cache</li>
                <li>Try different browser</li>
              </ul>
            </div>

            <div className="glass-card">
              <h3
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "1rem",
                  color: "var(--error)",
                }}
              >
                🔴 Order Not Placing
              </h3>
              <p style={{ marginBottom: "0.75rem" }}>
                <strong>Problem:</strong> Checkout fails
              </p>
              <p style={{ marginBottom: "0.5rem" }}>
                <strong>Solution:</strong>
              </p>
              <ul style={{ lineHeight: 1.8, paddingLeft: "1.5rem" }}>
                <li>Verify all required fields filled</li>
                <li>Check internet connection</li>
                <li>Ensure items are still available</li>
                <li>Try different payment method</li>
              </ul>
            </div>
          </div>
        )}

        {/* FAQs */}
        {activeSection === "faqs" && (
          <div className="fade-in">
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              ❓ Frequently Asked Questions
            </h2>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
                For Customers
              </h3>

              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Q: How do I track my order?
                </p>
                <p style={{ paddingLeft: "1rem", opacity: 0.9 }}>
                  A: Go to the Orders page and enter your phone number or email
                  to view all your orders and their current status.
                </p>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Q: Can I cancel my order?
                </p>
                <p style={{ paddingLeft: "1rem", opacity: 0.9 }}>
                  A: Yes, contact the restaurant immediately. Orders can be
                  cancelled before they enter "Preparing" status.
                </p>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Q: What payment methods are accepted?
                </p>
                <p style={{ paddingLeft: "1rem", opacity: 0.9 }}>
                  A: Cash on Delivery, Card Payment, UPI, and Net Banking
                  (availability may vary).
                </p>
              </div>
            </div>

            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
                For Admins
              </h3>

              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Q: How do I add a new menu item?
                </p>
                <p style={{ paddingLeft: "1rem", opacity: 0.9 }}>
                  A: Go to Admin → Menu → Add New Item, fill in the details,
                  upload an image, and save.
                </p>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Q: How do I search for menu items?
                </p>
                <p style={{ paddingLeft: "1rem", opacity: 0.9 }}>
                  A: Use the search bar at the top of the Admin → Menu page.
                  Type item name, description, or category.
                </p>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Q: How do order numbers work?
                </p>
                <p style={{ paddingLeft: "1rem", opacity: 0.9 }}>
                  A: Order numbers reset daily with format YYYYMMDD-XXX (e.g.,
                  20251216-001). They start from 001 each day.
                </p>
              </div>

              <div>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Q: How do I backup my data?
                </p>
                <p style={{ paddingLeft: "1rem", opacity: 0.9 }}>
                  A: Use the Data Management section to export all data as JSON.
                  Store this file safely.
                </p>
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
                For Delivery Boys
              </h3>

              <div style={{ marginBottom: "1.5rem" }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Q: How is my commission calculated?
                </p>
                <p style={{ paddingLeft: "1rem", opacity: 0.9 }}>
                  A: Commission is set by the admin and can be either a fixed
                  amount per delivery or a percentage of the order value.
                </p>
              </div>

              <div>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Q: When do I receive my payout?
                </p>
                <p style={{ paddingLeft: "1rem", opacity: 0.9 }}>
                  A: Payout schedules are set by the admin (typically weekly or
                  monthly).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          background: "var(--surface)",
          padding: "2rem 1rem",
          marginTop: "3rem",
          borderTop: "1px solid var(--border-color)",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
            📞 Need More Help?
          </h3>
          <p style={{ marginBottom: "1rem", opacity: 0.8 }}>
            Contact support for assistance
          </p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="mailto:support@OrderZorestaurant.com"
              style={{ color: "var(--primary)", textDecoration: "none" }}
            >
              📧 support@OrderZorestaurant.com
            </a>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>🕐 9 AM - 9 PM (Mon-Sat)</span>
          </div>
          <p style={{ marginTop: "2rem", fontSize: "0.875rem", opacity: 0.6 }}>
            Last Updated: December 16, 2025 • Version 2.1
          </p>
        </div>
      </div>
    </div>
  );
}
