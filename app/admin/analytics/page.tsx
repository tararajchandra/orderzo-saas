"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const AnalyticsCharts = dynamic(() => import("./AnalyticsCharts"), {
  ssr: false,
  loading: () => (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      Loading charts...
    </div>
  ),
});

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: { name: string; quantity: number; revenue: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number }[];
  paymentMethods: { method: string; count: number; amount: number }[];
  categoryRevenue: { category: string; revenue: number }[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingItems: [],
    revenueByDay: [],
    ordersByStatus: [],
    paymentMethods: [],
    categoryRevenue: [],
  });
  const [dateRange, setDateRange] = useState("7days");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin");
      return;
    }
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics?range=${dateRange}`);
      const data = await res.json();

      if (!data.success) {
        console.error("Failed to fetch analytics");
        return;
      }

      setAnalytics(data.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
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
    <main className="container" style={{ padding: "2rem 1rem" }}>
      <div className="fade-in">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h1>Analytics Dashboard</h1>
          <select
            className="input"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: "auto" }}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">Last 1 Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-3" style={{ marginBottom: "2rem" }}>
          <div className="glass-card">
            <p
              className="text-muted"
              style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              Total Revenue
            </p>
            <h2 style={{ color: "var(--success)", margin: 0 }}>
              ₹{analytics.totalRevenue.toFixed(2)}
            </h2>
          </div>
          <div className="glass-card">
            <p
              className="text-muted"
              style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              Total Orders
            </p>
            <h2 style={{ color: "var(--primary)", margin: 0 }}>
              {analytics.totalOrders}
            </h2>
          </div>
          <div className="glass-card">
            <p
              className="text-muted"
              style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              Avg Order Value
            </p>
            <h2 style={{ color: "var(--secondary)", margin: 0 }}>
              ₹{analytics.averageOrderValue.toFixed(2)}
            </h2>
          </div>
        </div>

        <AnalyticsCharts analytics={analytics} />
      </div>
    </main>
  );
}
