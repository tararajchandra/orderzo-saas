"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SalesmanReport {
  salesman_id: number;
  salesman_name: string;
  total_orders: number;
  total_revenue: number;
}

export default function SalesmanReportPage() {
  const router = useRouter();
  const [reportData, setReportData] = useState<SalesmanReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7days");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin");
      return;
    }
    fetchReport();
  }, [dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/salesman-report?range=${dateRange}`);
      const data = await res.json();

      if (data.success) {
        setReportData(data.data);
      } else {
        console.error("Failed to fetch report");
      }
    } catch (error) {
      console.error("Error fetching salesman report:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalOrders = reportData.reduce(
    (sum, item) => sum + item.total_orders,
    0,
  );
  const totalRevenue = reportData.reduce(
    (sum, item) => sum + item.total_revenue,
    0,
  );

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
          <h1>Salesman Wise Sales Report</h1>
          <select
            className="input"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: "auto" }}
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">Last 1 Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-2" style={{ marginBottom: "2rem" }}>
          <div className="glass-card">
            <p
              className="text-muted"
              style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              Total Salesman Revenue
            </p>
            <h2 style={{ color: "var(--success)", margin: 0 }}>
              ₹{totalRevenue.toFixed(2)}
            </h2>
          </div>
          <div className="glass-card">
            <p
              className="text-muted"
              style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              Total Salesman Orders
            </p>
            <h2 style={{ color: "var(--primary)", margin: 0 }}>
              {totalOrders}
            </h2>
          </div>
        </div>

        <div className="glass-card" style={{ overflowX: "auto" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "3rem",
              }}
            >
              <div className="spinner"></div>
            </div>
          ) : reportData.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Salesman Name</th>
                  <th>Total Orders</th>
                  <th>Total Revenue</th>
                  <th>Average Order Value</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item) => (
                  <tr key={item.salesman_id}>
                    <td>
                      <strong>{item.salesman_name}</strong>
                    </td>
                    <td>{item.total_orders}</td>
                    <td style={{ color: "var(--success)", fontWeight: "bold" }}>
                      ₹{item.total_revenue.toFixed(2)}
                    </td>
                    <td>
                      ₹
                      {item.total_orders > 0
                        ? (item.total_revenue / item.total_orders).toFixed(2)
                        : "0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "2rem",
                color: "var(--text-muted)",
              }}
            >
              No salesman data available for this time period.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
