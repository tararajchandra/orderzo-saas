"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { useFinancialYear } from "@/contexts/FinancialYearContext";
import { useAuth } from "@/contexts/AuthContext";
import { isRouteSupportedOffline, showOfflineRouteWarning } from "@/lib/offlineRoutes";
import { getOfflineOrders } from "@/lib/offlineManager";

function DashboardCard({
  href,
  icon,
  title,
  subtitle,
  isOnline,
  titleColor,
  borderColor,
}: {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
  isOnline: boolean;
  titleColor?: string;
  borderColor?: string;
}) {
  const supported = isRouteSupportedOffline(href);
  return (
    <Link
      href={href}
      className="glass-card text-center"
      onClick={(e) => {
        if (!isOnline && !supported) {
          e.preventDefault();
          showOfflineRouteWarning(title);
        }
      }}
      style={{
        textDecoration: "none",
        cursor: "pointer",
        position: "relative",
        zIndex: 1,
        borderColor: borderColor || undefined,
        borderWidth: borderColor ? "2px" : undefined,
        opacity: !isOnline && !supported ? 0.75 : 1,
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{icon}</div>
      <h3 style={{ color: titleColor }}>{title}</h3>
      <p className="text-muted">{subtitle}</p>
      {!isOnline && (
        <span
          style={{
            fontSize: "0.72rem",
            background: supported ? "#d4edda" : "#f8d7da",
            color: supported ? "#155724" : "#721c24",
            padding: "2px 8px",
            borderRadius: "12px",
            display: "inline-block",
            marginTop: "6px",
            fontWeight: 600,
          }}
        >
          {supported ? "⚡ অফলাইনে সচল" : "🌐 অনলাইন প্রয়োজন"}
        </span>
      )}
    </Link>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const { selectedFY } = useFinancialYear();
  const { isCashier } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      fetchDashboardData();
    };
    const handleOffline = () => {
      setIsOnline(false);
      loadOfflineStats();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (selectedFY) fetchDashboardData();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [selectedFY]);

  const loadOfflineStats = async () => {
    try {
      const cached = localStorage.getItem("cached_admin_orders");
      let orders: any[] = cached ? JSON.parse(cached) : [];
      const offlineOrders = await getOfflineOrders();
      const offlineMapped = offlineOrders
        .filter((o) => o.body && o.body.order_status !== "cancelled")
        .map((o) => ({
          ...o.body,
          id: o.body.id || o.body.order_number || o.id,
          order_number: o.body.order_number || o.body.id || `OFF-${o.id}`,
          total_amount: o.body.total_amount || 0,
          created_at: o.body.created_at || new Date(o.timestamp).toISOString(),
          is_offline: true,
        }));

      // Combine with deduplication
      const map = new Map<string, any>();
      offlineMapped.forEach((item: any) =>
        map.set(String(item.order_number || item.id), item)
      );
      orders.forEach((item: any) => {
        const key = String(item.order_number || item.id);
        if (!map.has(key)) map.set(key, item);
      });

      const combined = Array.from(map.values()).sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
      const today = new Date().toDateString();

      setStats({
        totalOrders: combined.length,
        pendingOrders: combined.filter((o: any) => o.order_status === "pending")
          .length,
        totalRevenue: combined.reduce(
          (sum: number, o: any) => sum + parseFloat(o.total_amount || 0),
          0
        ),
        todayRevenue: combined
          .filter(
            (o: any) => new Date(o.created_at).toDateString() === today
          )
          .reduce(
            (sum: number, o: any) => sum + parseFloat(o.total_amount || 0),
            0
          ),
      });

      setRecentOrders(combined.slice(0, 10));
    } catch (e) {
      console.error("Error loading offline dashboard stats:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await loadOfflineStats();
      return;
    }

    try {
      const url = selectedFY
        ? `/api/orders?fy_id=${selectedFY.id}`
        : "/api/orders";
      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json();

      if (data.success) {
        const serverOrders: any[] = data.data;

        // Also merge pending offline orders so cashier/admin dashboard sees them immediately!
        const offlineOrders = await getOfflineOrders();
        const serverOrderNumbers = new Set(
          serverOrders.map((o: any) => String(o.order_number || o.id))
        );
        const offlineMapped = offlineOrders
          .filter(
            (o) =>
              o.body &&
              !serverOrderNumbers.has(
                String(o.body.order_number || o.body.id || o.id)
              )
          )
          .map((o) => ({
            ...o.body,
            id: o.body.id || o.body.order_number || o.id,
            order_number: o.body.order_number || o.body.id || `OFF-${o.id}`,
            total_amount: o.body.total_amount || 0,
            created_at: o.body.created_at || new Date(o.timestamp).toISOString(),
            is_offline: true,
          }));

        const combined = [...offlineMapped, ...serverOrders].sort(
          (a: any, b: any) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );

        try {
          localStorage.setItem(
            "cached_admin_orders",
            JSON.stringify(combined.slice(0, 100))
          );
        } catch (e) {}

        const today = new Date().toDateString();

        setStats({
          totalOrders: combined.length,
          pendingOrders: combined.filter(
            (o: any) => o.order_status === "pending"
          ).length,
          totalRevenue: combined.reduce(
            (sum: number, o: any) => sum + parseFloat(o.total_amount || 0),
            0
          ),
          todayRevenue: combined
            .filter(
              (o: any) => new Date(o.created_at).toDateString() === today
            )
            .reduce(
              (sum: number, o: any) => sum + parseFloat(o.total_amount || 0),
              0
            ),
        });

        setRecentOrders(combined.slice(0, 10));
      }
    } catch (error) {
      console.warn("Error fetching dashboard data, reading offline stats:", error);
      await loadOfflineStats();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.push("/admin");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <main className="container" style={{ padding: "2rem 1.5rem" }}>
      {/* Removed fade-in class to prevent potential pointer-event issues */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h1>Admin Dashboard</h1>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={handleLogout}
              className="btn btn-ghost"
              style={{ cursor: "pointer", position: "relative", zIndex: 20 }}
            >
              Logout
            </button>
          </div>
        </div>

        {!isOnline && (
          <div
            style={{
              background: "#fff3cd",
              color: "#856404",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "2rem",
              border: "1px solid #ffeeba",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>📶</span>
            <span>
              <strong>অফলাইন মোড সক্রিয়:</strong> ইন্টারনেট সংযোগ বিচ্ছিন্ন। অফলাইনে <strong>Quick Bill</strong>, <strong>Active Tables</strong>, <strong>Orders</strong>, <strong>Cash Book</strong> এবং <strong>Sale Book</strong> সচল রয়েছে। ইন্টারনেট প্রয়োজন এমন মেনুতে ক্লিক করলে সতর্কবার্তা দেখানো হবে।
            </span>
          </div>
        )}

        {/* Quick Links */}
        <div
          className="grid grid-4"
          style={{ marginBottom: "3rem", position: "relative", zIndex: 10 }}
        >
          <DashboardCard
            href="/admin/menu"
            icon="🍽️"
            title="Menu Management"
            subtitle="Add, edit, delete items"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/categories"
            icon="🏷️"
            title="Categories"
            subtitle="Manage menu categories"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/orders"
            icon="📦"
            title="Orders"
            subtitle="Manage all orders"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/tables"
            icon="🍽️"
            title="Active Tables"
            subtitle="Manage Dine-in Tabs"
            titleColor="var(--warning)"
            borderColor="var(--warning)"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/analytics"
            icon="📊"
            title="Analytics"
            subtitle="Charts & insights"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/billing"
            icon="💰"
            title="Billing"
            subtitle="Invoices & reports"
            isOnline={isOnline}
          />
          {!isCashier && (
            <DashboardCard
              href="/admin/settings"
              icon="⚙️"
              title="Settings"
              subtitle="Printer & restaurant info"
              isOnline={isOnline}
            />
          )}
          {!isCashier && (
            <DashboardCard
              href="/admin/settings/financial-years"
              icon="📅"
              title="Financial Years"
              subtitle="Manage FYs"
              isOnline={isOnline}
            />
          )}
          <DashboardCard
            href="/admin/attendance"
            icon="⏱️"
            title="Staff Attendance"
            subtitle="View Reports"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/audit-logs"
            icon="📋"
            title="Audit Trail"
            subtitle="Activity Logs"
            isOnline={isOnline}
          />
          {!isCashier && (
            <DashboardCard
              href="/admin/salesmen"
              icon="👨‍💼"
              title="Salesmen"
              subtitle="Manage sales staff"
              isOnline={isOnline}
            />
          )}
          {!isCashier && (
            <DashboardCard
              href="/admin/kitchen-staff"
              icon="👨‍🍳"
              title="Kitchen Staff"
              subtitle="Manage chefs"
              isOnline={isOnline}
            />
          )}
          <DashboardCard
            href="/admin/delivery-boys"
            icon="🛵"
            title="Delivery Boys"
            subtitle="Manage delivery staff"
            isOnline={isOnline}
          />
          {!isCashier && (
            <DashboardCard
              href="/admin/delivery-locations"
              icon="📍"
              title="Delivery Locations"
              subtitle="Manage delivery zones"
              isOnline={isOnline}
            />
          )}
          <DashboardCard
            href="/admin/payouts"
            icon="💸"
            title="Commissions"
            subtitle="Payouts & Reports"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/quick-bill"
            icon="🧾"
            title="Quick Bill"
            subtitle="Create Invoice & Print"
            titleColor="var(--primary)"
            borderColor="var(--primary)"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/qr-codes"
            icon="📱"
            title="Table QR Codes"
            subtitle="Print QR for tables"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/data-management"
            icon="📊"
            title="Data Import/Export"
            subtitle="Backup & restore data"
            isOnline={isOnline}
          />
        </div>

        {/* Accounting Links */}
        <h2 style={{ marginBottom: "1.5rem" }}>Accounting</h2>
        <div className="grid grid-4" style={{ marginBottom: "3rem" }}>
          <DashboardCard
            href="/admin/sales"
            icon="📊"
            title="Sale Book"
            subtitle="View all sales transactions"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/product-sales"
            icon="📦"
            title="Product Sales"
            subtitle="Product-wise sales report"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/cashbook"
            icon="💵"
            title="Cash Book"
            subtitle="Track cash flow"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/gst-report"
            icon="📈"
            title="GST Report"
            subtitle="Tax breakdown & compliance"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/salesman-report"
            icon="👨‍💼"
            title="Salesman Report"
            subtitle="Salesman-wise sales data"
            isOnline={isOnline}
          />
          <DashboardCard
            href="/admin/table-report"
            icon="🍽️"
            title="Table Report"
            subtitle="Table-wise sales data"
            isOnline={isOnline}
          />
        </div>

        {/* Stats */}
        <h2 style={{ marginBottom: "1.5rem" }}>Statistics</h2>
        <div className="grid grid-4" style={{ marginBottom: "3rem" }}>
          <div className="glass-card">
            <div
              className="text-muted"
              style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              Total Orders
            </div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                color: "var(--primary)",
              }}
            >
              {stats.totalOrders}
            </div>
          </div>
          <div className="glass-card">
            <div
              className="text-muted"
              style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              Pending Orders
            </div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                color: "var(--warning)",
              }}
            >
              {stats.pendingOrders}
            </div>
          </div>
          <div className="glass-card">
            <div
              className="text-muted"
              style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              Total Revenue
            </div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                color: "var(--success)",
              }}
            >
              ₹{stats.totalRevenue.toFixed(0)}
            </div>
          </div>
          <div className="glass-card">
            <div
              className="text-muted"
              style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              Today's Revenue
            </div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                color: "var(--secondary)",
              }}
            >
              ₹{stats.todayRevenue.toFixed(0)}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <h2 style={{ marginBottom: "1.5rem" }}>Recent Orders</h2>
        <div className="glass-card">
          {recentOrders.length === 0 ? (
            <p className="text-muted text-center">No orders yet</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <th style={{ padding: "1rem", textAlign: "left" }}>
                      Order ID
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>
                      Customer
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>
                      Amount
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>
                      Status
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      style={{ borderBottom: "1px solid var(--border-color)" }}
                    >
                      <td style={{ padding: "1rem" }}>
                        #{order.order_number || order.id}
                        {order.is_offline && (
                          <span
                            className="badge"
                            style={{
                              background: "#eab308",
                              color: "#000",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              marginLeft: "6px",
                            }}
                          >
                            ⚡ অফলাইন
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>{order.customer_name}</td>
                      <td style={{ padding: "1rem" }}>
                        ₹{parseFloat(order.total_amount).toFixed(2)}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          className={`badge badge-${order.order_status === "delivered" ? "success" : "warning"}`}
                        >
                          {order.order_status}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
