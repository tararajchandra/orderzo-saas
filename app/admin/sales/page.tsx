"use client";

import { useState, useEffect } from "react";
import { useFinancialYear } from "@/contexts/FinancialYearContext";
import { useRouter } from "next/navigation";
import { formatDate, formatDateTime, sortOrdersDesc } from "@/lib/utils";
import { getOfflineOrders } from "@/lib/offlineManager";

interface SaleEntry {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_phone: string;
  items: any[];
  payment_method: string;
  payment_status: string;
  order_type: string;
  subtotal: number;
  tax: number;
  discount: number;
  total_amount: number;
  order_status: string;
  created_at: string;
  user_id: number | null; // Added to track source
  table_number: string | null;
  split_cash?: number;
  split_upi?: number;
  split_card?: number;
  [key: string]: any;
}

interface Salesman {
  id: number;
  name: string;
}

export default function SaleBookPage() {
  const router = useRouter();
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedFY } = useFinancialYear();
  const [dateFilter, setDateFilter] = useState("today");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all"); // 'all', 'web', 'admin', or 'salesman_ID'
  const [searchQuery, setSearchQuery] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSettings(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin");
      return;
    }
    if (selectedFY) fetchData();
  }, [selectedFY]);

  const loadOfflineSalesData = async () => {
    setIsOfflineMode(true);
    try {
      const cachedSalesStr = localStorage.getItem("cached_sales_data");
      const cachedSalesmenStr = localStorage.getItem("cached_salesmen_data");
      let loadedSales: any[] = cachedSalesStr ? JSON.parse(cachedSalesStr) : [];
      let loadedSalesmen: any[] = cachedSalesmenStr ? JSON.parse(cachedSalesmenStr) : [];

      // Also get any pending offline orders
      const offlineOrders = await getOfflineOrders();
      const offlineSales = offlineOrders
        .filter((o: any) => o.method === "POST" && o.body && o.body.order_status !== "cancelled")
        .map((o: any) => {
          const b = o.body;
          return {
            id: b.id || b.order_number || o.id,
            invoice_number: b.invoice_number || b.order_number || `OFF-${o.id}`,
            customer_name: b.customer_name || "Walk-in Customer",
            customer_phone: b.customer_phone || "",
            items: b.items || [],
            payment_method: b.payment_method || "cash",
            payment_status: b.payment_status || "paid",
            order_type: b.order_type || "takeaway",
            subtotal: Number(b.subtotal || b.total_amount || 0),
            tax: Number(b.tax || 0),
            discount: Number(b.discount || 0),
            total_amount: Number(b.total_amount || 0),
            order_status: b.order_status || "completed",
            created_at: b.created_at || new Date(o.timestamp).toISOString(),
            user_id: b.user_id || null,
            table_number: b.table_number || null,
            is_offline: true,
          };
        });

      const existingIds = new Set(loadedSales.map((s: any) => s.id || s.invoice_number));
      for (const off of offlineSales) {
        if (!existingIds.has(off.id) && !existingIds.has(off.invoice_number)) {
          loadedSales.unshift(off);
        }
      }

      loadedSales.sort(sortOrdersDesc);
      setSales(loadedSales);
      setSalesmen(loadedSalesmen);
    } catch (e) {
      console.error("Error loading offline sales data:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await loadOfflineSalesData();
      return;
    }

    try {
      // Fetch Salesmen
      const salesmenRes = await fetch("/api/admin/salesmen");
      const salesmenData = await salesmenRes.json();
      let loadedSalesmen: Salesman[] = [];
      if (salesmenData.success) {
        loadedSalesmen = salesmenData.data;
        setSalesmen(loadedSalesmen);
        try {
          localStorage.setItem("cached_salesmen_data", JSON.stringify(loadedSalesmen));
        } catch (e) {}
      }

      // Fetch Orders
      const ordersResponse = await fetch(
        `/api/orders?fy_id=${selectedFY?.id || ""}`,
      );
      const ordersData = await ordersResponse.json();

      if (ordersData.success) {
        setIsOfflineMode(false);
        // Fetch invoices
        const invoicesResponse = await fetch(
          `/api/invoices?fy_id=${selectedFY?.id || ""}`,
        );
        const invoicesData = await invoicesResponse.json();

        if (invoicesData.success) {
          const salesData = ordersData.data.map((order: any) => {
            const invoice = invoicesData.data.find(
              (inv: any) => inv.order_id === order.id,
            );
            return {
              ...order,
              invoice_number: invoice?.invoice_number || `ORD-${order.id}`,
            };
          });
          setSales(salesData);
          try {
            localStorage.setItem("cached_sales_data", JSON.stringify(salesData));
          } catch (e) {}
        }
      }
    } catch (error) {
      console.warn("Error fetching sales data, falling back to cache:", error);
      await loadOfflineSalesData();
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    switch (dateFilter) {
      case "today":
        return { start: today, end: endOfDay };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart, end: endOfDay };
      case "month":
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        return { start: monthStart, end: endOfDay };
      case "custom":
        const customEnd = customEndDate ? new Date(customEndDate) : new Date();
        if (customEndDate) customEnd.setHours(23, 59, 59, 999);
        return {
          start: customStartDate ? new Date(customStartDate) : new Date(0),
          end: customEnd,
        };
      default:
        return { start: new Date(0), end: endOfDay }; // All time, end is effectively open but practically now/future
    }
  };

  const getOrderSource = (sale: SaleEntry) => {
    if (!sale.user_id) return "Walk-in / Guest";

    const salesman = salesmen.find((s) => s.id === sale.user_id);
    if (salesman) return `Salesman: ${salesman.name}`;

    return "Web Customer";
  };

  const filteredSales = sales.filter((sale) => {
    // Exclude cancelled orders
    if (sale.order_status === "cancelled") return false;

    const saleDate = new Date(sale.created_at);
    const { start, end } = getDateRange();

    const matchesDate = saleDate >= start && saleDate <= end;
    const matchesPayment =
      paymentFilter === "all" || sale.payment_method === paymentFilter || (sale.payment_method === "split" && Number(sale[`split_${paymentFilter}`] || 0) > 0);
    const matchesSearch =
      searchQuery === "" ||
      sale.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesSource = true;

    if (sourceFilter !== "all") {
      if (sourceFilter === "web") {
        matchesSource =
          !!sale.user_id && !salesmen.find((s) => s.id === sale.user_id);
      } else if (sourceFilter === "admin") {
        matchesSource = !sale.user_id;
      } else {
        matchesSource = sale.user_id === parseInt(sourceFilter);
      }
    }

    return matchesDate && matchesPayment && matchesSearch && matchesSource;
  });

  const calculateTotals = () => {
    const totals: any = {
      all: 0,
      cash: 0,
      card: 0,
      upi: 0,
      wallet: 0,
    };

    filteredSales.forEach((sale) => {
      const amount = parseFloat(sale.total_amount.toString());
      totals.all += amount;
      if (sale.payment_method === 'split') {
        totals['cash'] = (totals['cash'] || 0) + Number(sale.split_cash || 0);
        totals['upi'] = (totals['upi'] || 0) + Number(sale.split_upi || 0);
        totals['card'] = (totals['card'] || 0) + Number(sale.split_card || 0);
      } else {
        totals[sale.payment_method] = (totals[sale.payment_method] || 0) + amount;
      }
    });

    return totals;
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Invoice#",
      "Source",
      "Customer",
      "Phone",
      "Type",
      "Table",
      "Payment Method",
      "Amount",
      "Status",
    ];
    const rows = filteredSales.map((sale) => [
      formatDateTime(sale.created_at),
      sale.invoice_number,
      getOrderSource(sale),
      sale.customer_name,
      sale.customer_phone,
      sale.order_type,
      sale.table_number || "-",
      sale.payment_method,
      sale.total_amount,
      sale.payment_status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sale-book-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totals = calculateTotals();

  const handlePrint = () => {
    const isThermal = settings?.printerType !== "a4";
    const paperWidth = settings?.paperWidth === "58mm" ? "48mm" : "72mm";
    const fontSize = settings?.paperWidth === "58mm" ? "10px" : "11.5px";
    const printWindow = window.open("", "_blank", "width=400,height=600");

    const dateLabel =
      dateFilter === "today"
        ? `Today (${new Date().toLocaleDateString("en-IN")})`
        : dateFilter === "week"
        ? "Last 7 Days"
        : dateFilter === "month"
        ? "Last 30 Days"
        : dateFilter === "custom"
        ? `${customStartDate || "Start"} to ${customEndDate || "End"}`
        : "All Time";

    const rowsHtml = filteredSales
      .map(
        (sale) => `
        <div style="margin-bottom: 5px; padding-bottom: 4px; border-bottom: 1px dashed #777;">
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span>Inv: ${sale.invoice_number}</span>
            <span>${new Date(sale.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: ${fontSize}; color: #222;">
            <span style="max-width: 60%; word-break: break-word;">${sale.customer_name || "Customer"}</span>
            <span style="font-weight: 700;">${(sale.payment_method || "CASH").toUpperCase()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: ${fontSize};">
            <span style="text-transform: capitalize; color: #444;">${sale.order_type || "dine_in"}</span>
            <span style="font-weight: 800; font-size: 12px;">₹${parseFloat(sale.total_amount.toString()).toFixed(2)}</span>
          </div>
        </div>
      `,
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Sale Book Report</title>
        <style>
          @page { margin: 0; size: auto; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: ${fontSize};
            font-weight: 600;
            color: #000;
            background: #fff;
            margin: 0 auto;
            padding: 2mm 3.5mm;
            width: ${isThermal ? paperWidth : "100%"};
            max-width: ${isThermal ? paperWidth : "100%"};
            line-height: 1.3;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .text-center { text-align: center; }
          .bold { font-weight: 800; }
          .divider { border-top: 1.5px dashed #000; margin: 4px 0; }
          .item-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
        </style>
      </head>
      <body>
        <div class="text-center bold" style="font-size: 15px; margin-bottom: 2px;">
          ${settings?.restaurantName || "OrderZo"}
        </div>
        <div class="text-center bold" style="font-size: 13px; text-transform: uppercase;">
          Sale Book Report
        </div>
        <div class="text-center" style="font-size: 10px; margin-bottom: 3px;">
          Period: ${dateLabel}
        </div>
        <div class="divider"></div>

        <div class="item-row">
          <span>Total Transactions:</span>
          <span class="bold">${filteredSales.length}</span>
        </div>
        <div class="item-row">
          <span>Total Sales:</span>
          <span class="bold">₹${totals.all.toFixed(2)}</span>
        </div>
        <div class="divider"></div>

        ${rowsHtml}

        <div class="divider" style="margin-top: 6px;"></div>
        <div class="item-row bold" style="font-size: 13px; margin: 4px 0;">
          <span>GRAND TOTAL:</span>
          <span>₹${totals.all.toFixed(2)}</span>
        </div>
        <div class="divider"></div>
        <div class="text-center" style="font-size: 9.5px; margin-top: 4px;">
          Printed: ${new Date().toLocaleString("en-IN")}
        </div>
        <div class="text-center" style="font-size: 9.5px;">
          *** End of Report ***
        </div>
      </body>
      </html>
    `;

    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 300);
    } else {
      window.print();
    }
  };

  if (loading)
    return <div className="text-center p-5">Loading sales data...</div>;

  return (
    <main className="container" style={{ padding: "2rem 1.5rem" }}>
      <div className="fade-in">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h1>📊 Sale Book</h1>
          <div style={{ display: "flex", gap: "1rem" }} className="no-print">
            <button onClick={handlePrint} className="btn btn-primary">
              🖨️ Print
            </button>
            <button onClick={exportToCSV} className="btn btn-primary">
              📥 Export CSV
            </button>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="btn btn-ghost"
            >
              ← Back
            </button>
          </div>
        </div>

        {isOfflineMode && (
          <div
            style={{
              background: "#fff3cd",
              color: "#856404",
              padding: "10px 16px",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              border: "1px solid #ffeeba",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 500,
            }}
          >
            <span>📶</span>
            <span>
              <strong>অফলাইন মোড সক্রিয়:</strong> পূর্বে সংরক্ষিত সেলস রেকর্ড এবং অফলাইনে হওয়া নতুন সেলস প্রদর্শিত হচ্ছে।
            </span>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card no-print" style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Source / Salesman
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Sources</option>
                <option value="web">Web Customer</option>
                <option value="admin">Admin / Walk-in</option>
                <optgroup label="Salesmen">
                  {salesmen.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Payment Method
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="wallet">Wallet</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Invoice# or Customer..."
                className="input"
              />
            </div>
          </div>

          {dateFilter === "custom" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-4 screen-only" style={{ marginBottom: "2rem" }}>
          <div className="glass-card">
            <div
              className="text-muted"
              style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              Total Sales
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--primary)",
              }}
            >
              ₹{totals.all.toFixed(2)}
            </div>
            <div
              className="text-muted"
              style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}
            >
              {filteredSales.length} transactions
            </div>
          </div>
        </div>

        {/* Sales Table - Screen Only */}
        <div className="glass-card screen-only">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                  <th style={{ padding: "1rem", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "1rem", textAlign: "left" }}>
                    Invoice#
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left" }}>Source</th>
                  <th style={{ padding: "1rem", textAlign: "left" }}>
                    Customer
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left" }}>Type</th>
                  <th style={{ padding: "1rem", textAlign: "left" }}>
                    Payment
                  </th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>
                    Amount
                  </th>
                  <th style={{ padding: "1rem", textAlign: "center" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ padding: "2rem", textAlign: "center" }}
                      className="text-muted"
                    >
                      No sales found for the selected filters
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      style={{ borderBottom: "1px solid var(--border-color)" }}
                    >
                      <td style={{ padding: "1rem" }}>
                        {formatDate(sale.created_at)}
                        <br />
                        <span
                          className="text-muted"
                          style={{ fontSize: "0.875rem" }}
                        >
                          {new Date(sale.created_at).toLocaleTimeString(
                            "en-IN",
                          )}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", fontWeight: 500 }}>
                        {sale.invoice_number}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          className="badge"
                          style={{ background: "var(--surface-hover)" }}
                        >
                          {getOrderSource(sale)}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {sale.customer_name}
                        <br />
                        <span
                          className="text-muted"
                          style={{ fontSize: "0.875rem" }}
                        >
                          {sale.customer_phone}
                        </span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          className="badge"
                          style={{ textTransform: "capitalize" }}
                        >
                          {sale.order_type || "delivery"}
                        </span>
                        {sale.table_number && (
                          <div
                            style={{
                              fontSize: "0.8rem",
                              marginTop: "0.25rem",
                              color: "var(--primary)",
                            }}
                          >
                            Table: {sale.table_number}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          className="badge"
                          style={{
                            textTransform: "uppercase",
                            background:
                              (sale.payment_method === "cash" || sale.payment_method === "split")
                                ? "var(--success)"
                                : sale.payment_method === "upi"
                                  ? "var(--info)"
                                  : sale.payment_method === "card"
                                    ? "var(--warning)"
                                    : "var(--secondary)",
                            color: "white",
                          }}
                        >
                          {(sale.payment_method === "cash" || sale.payment_method === "split")
                            ? "💵 Cash"
                            : sale.payment_method === "upi"
                              ? "📱 UPI"
                              : sale.payment_method === "card"
                                ? "💳 Card"
                                : sale.payment_method === "online"
                                  ? "🌐 Online"
                                  : sale.payment_method === "split" ? "Split" : (sale.payment_method || "Cash")}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "right",
                          fontWeight: 600,
                        }}
                      >
                        ₹{parseFloat(sale.total_amount.toString()).toFixed(2)}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span
                          className={`badge ${sale.payment_status === "paid" ? "badge-success" : "badge-warning"}`}
                        >
                          {sale.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Print Only Format for Thermal Printer */}
        <div
          className="print-only thermal-report-print"
          data-paper={settings?.paperWidth || "80mm"}
        >
          <div className="text-center bold" style={{ fontSize: "15px", marginBottom: "2px" }}>
            {settings?.restaurantName || "OrderZo"}
          </div>
          <h2 style={{ fontSize: "13px", margin: "2px 0 4px 0", textAlign: "center", textTransform: "uppercase" }}>
            Sale Book Report
          </h2>
          <div style={{ fontSize: "10px", textAlign: "center", marginBottom: "4px" }}>
            Period: {dateFilter === "today"
              ? `Today (${new Date().toLocaleDateString("en-IN")})`
              : dateFilter === "week"
              ? "Last 7 Days"
              : dateFilter === "month"
              ? "Last 30 Days"
              : dateFilter === "custom"
              ? `${customStartDate || "Start"} to ${customEndDate || "End"}`
              : "All Time"}
          </div>
          <div className="divider"></div>

          <div className="item-row">
            <span>Total Transactions:</span>
            <span className="label">{filteredSales.length}</span>
          </div>
          <div className="item-row">
            <span>Total Sales:</span>
            <span className="label">₹{totals.all.toFixed(2)}</span>
          </div>
          <div className="divider"></div>
          
          {filteredSales.map((sale) => (
             <div key={sale.id} className="block-row">
                <div className="item-row" style={{ fontWeight: 700 }}>
                   <span className="label">Inv: {sale.invoice_number}</span>
                   <span className="val">{new Date(sale.created_at).toLocaleTimeString("en-IN", {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="item-row">
                   <span style={{ maxWidth: "60%", wordBreak: "break-word" }}>{sale.customer_name || "Customer"}</span>
                   <span style={{ fontWeight: 700 }}>{(sale.payment_method || "CASH").toUpperCase()}</span>
                </div>
                <div className="item-row">
                   <span style={{ textTransform: "capitalize", color: "#333" }}>{sale.order_type || "dine_in"}</span>
                   <span className="label" style={{ fontSize: "12px" }}>₹{parseFloat(sale.total_amount.toString()).toFixed(2)}</span>
                </div>
             </div>
          ))}
          <div className="divider" style={{ marginTop: "6px" }}></div>
          <div className="item-row bold" style={{ fontSize: "13px", margin: "4px 0" }}>
            <span>GRAND TOTAL:</span>
            <span className="label">₹{totals.all.toFixed(2)}</span>
          </div>
          <div className="divider"></div>
          <div className="text-center" style={{ fontSize: "9.5px", marginTop: "4px" }}>
            Printed: {new Date().toLocaleString("en-IN")}
          </div>
          <div className="text-center" style={{ fontSize: "9.5px" }}>
            *** End of Report ***
          </div>
        </div>
      </div>
    </main>
  );
}
