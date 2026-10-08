"use client";

import { useState, useEffect } from "react";
import { useFinancialYear } from "@/contexts/FinancialYearContext";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface ProductSale {
  productId: number;
  productName: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  avgPrice: number;
}

interface OrderItem {
  menuItem: {
    id: number;
    name: string;
    category: string;
    price: number;
  };
  quantity: number;
}

export default function ProductSalesReportPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedFY } = useFinancialYear();
  const [dateFilter, setDateFilter] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"quantity" | "revenue" | "name">(
    "revenue",
  );
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin");
      return;
    }
    fetchProductSales();

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSettings(data.data);
      })
      .catch((err) => console.error("Error fetching settings:", err));
  }, []);

  // Reprocess data when date filter changes
  useEffect(() => {
    if (orders.length > 0) {
      processProductSales(orders);
    }
  }, [dateFilter, customStartDate, customEndDate]);

  const fetchProductSales = async () => {
    try {
      const response = await fetch(
        `/api/orders?include_items=true&limit=2000&fy_id=${selectedFY?.id || ""}`,
      );
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
        processProductSales(data.data);
      }
    } catch (error) {
      console.error("Error fetching product sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const processProductSales = (orders: any[]) => {
    const { start, end } = getDateRange();
    const productMap = new Map<number, ProductSale>();

    // Filter orders by date range and status
    const filteredOrders = orders.filter((order) => {
      if (order.order_status === "cancelled") return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= start && orderDate <= end;
    });

    filteredOrders.forEach((order: any) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item: OrderItem) => {
          const productId = item.menuItem.id;
          const price = parseFloat(item.menuItem.price.toString());
          const quantity = parseInt(item.quantity.toString());
          const itemRevenue = price * quantity;

          const existing = productMap.get(productId);

          if (existing) {
            existing.totalQuantity += quantity;
            existing.totalRevenue += itemRevenue;
            existing.orderCount += 1;
            // Recalculate average price
            existing.avgPrice = existing.totalRevenue / existing.totalQuantity;
          } else {
            productMap.set(productId, {
              productId,
              productName: item.menuItem.name,
              category:
                (item.menuItem as any).category_name ||
                item.menuItem.category ||
                "Uncategorized",
              totalQuantity: quantity,
              totalRevenue: itemRevenue,
              orderCount: 1,
              avgPrice: price,
            });
          }
        });
      }
    });

    setProductSales(Array.from(productMap.values()));
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
        return { start: new Date(0), end: endOfDay };
    }
  };

  const filteredProducts = productSales
    .filter((product) => {
      const matchesSearch =
        searchQuery === "" ||
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "quantity":
          return b.totalQuantity - a.totalQuantity;
        case "revenue":
          return b.totalRevenue - a.totalRevenue;
        case "name":
          return a.productName.localeCompare(b.productName);
        default:
          return 0;
      }
    });

  const calculateTotals = () => {
    return filteredProducts.reduce(
      (acc, product) => ({
        totalQuantity: acc.totalQuantity + product.totalQuantity,
        totalRevenue: acc.totalRevenue + product.totalRevenue,
        totalProducts: filteredProducts.length,
      }),
      { totalQuantity: 0, totalRevenue: 0, totalProducts: 0 },
    );
  };

  const exportToCSV = () => {
    const headers = [
      "Product Name",
      "Category",
      "Quantity Sold",
      "Total Revenue",
      "Avg Price",
      "Orders",
    ];
    const rows = filteredProducts.map((product) => [
      product.productName,
      product.category,
      product.totalQuantity,
      parseFloat(product.totalRevenue.toString()).toFixed(2),
      parseFloat(product.avgPrice.toString()).toFixed(2),
      product.orderCount,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-sales-report-${new Date().toISOString().split("T")[0]}.csv`;
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

    const rowsHtml = filteredProducts
      .map(
        (p) => `
        <tr style="border-bottom: 1px dashed #777;">
          <td style="padding: 3px 1px; font-weight: 700; word-break: break-word; line-height: 1.2;">${p.productName}</td>
          <td style="padding: 3px 1px; font-weight: 700; text-align: center; white-space: nowrap;">${p.totalQuantity} × ${parseFloat(p.avgPrice.toString()).toFixed(0)}</td>
          <td style="padding: 3px 1px; font-weight: 800; text-align: right; white-space: nowrap;">₹${parseFloat(p.totalRevenue.toString()).toFixed(2)}</td>
        </tr>
      `,
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Product Sales Report</title>
        <style>
          @page {
            margin: 0;
            size: auto;
          }
          * {
            box-sizing: border-box;
          }
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
          .text-right { text-align: right; }
          .bold { font-weight: 800; }
          .divider { border-top: 1.5px dashed #000; margin: 4px 0; }
          .item-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 4px 0; }
          th {
            font-size: ${fontSize};
            font-weight: 800;
            padding: 3px 1px;
            border-top: 1.5px dashed #000;
            border-bottom: 1.5px dashed #000;
          }
          td {
            font-size: ${fontSize};
            vertical-align: top;
          }
        </style>
      </head>
      <body>
        <div class="text-center bold" style="font-size: 15px; margin-bottom: 2px;">
          ${settings?.restaurantName || "OrderZo"}
        </div>
        <div class="text-center bold" style="font-size: 13px; text-transform: uppercase;">
          Product Sales Report
        </div>
        <div class="text-center" style="font-size: 10px; margin-bottom: 3px;">
          Period: ${dateLabel}
        </div>
        <div class="divider"></div>

        <div class="item-row">
          <span>Total Qty Sold:</span>
          <span class="bold">${totals.totalQuantity} items</span>
        </div>
        <div class="item-row">
          <span>Total Revenue:</span>
          <span class="bold">₹${totals.totalRevenue.toFixed(2)}</span>
        </div>
        <div class="item-row">
          <span>Total Products:</span>
          <span class="bold">${totals.totalProducts}</span>
        </div>
        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="width: 44%; text-align: left;">ITEM</th>
              <th style="width: 29%; text-align: center;">QTY × PRICE</th>
              <th style="width: 27%; text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="divider" style="margin-top: 6px;"></div>
        <div class="item-row bold" style="font-size: 13px; margin: 4px 0;">
          <span>GRAND TOTAL:</span>
          <span>₹${totals.totalRevenue.toFixed(2)}</span>
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
      <div className="fade-in">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h1>📊 Product Sales Report</h1>
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

        {/* Filters */}
        <div className="glass-card no-print" style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input"
              >
                <option value="revenue">Revenue (High to Low)</option>
                <option value="quantity">Quantity (High to Low)</option>
                <option value="name">Product Name (A-Z)</option>
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
                placeholder="Product name or category..."
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

        {/* Summary Cards */}
        <div
          className="screen-only"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div className="glass-card">
            <div
              className="text-muted"
              style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              Total Products
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--primary)",
              }}
            >
              {totals.totalProducts}
            </div>
          </div>

          <div className="glass-card">
            <div
              className="text-muted"
              style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}
            >
              Total Quantity Sold
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--success)",
              }}
            >
              {totals.totalQuantity}
            </div>
            <div
              className="text-muted"
              style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}
            >
              items
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
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--warning)",
              }}
            >
              ₹{totals.totalRevenue.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Product Sales Table - Screen Only */}
        <div className="glass-card screen-only">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                  <th style={{ padding: "1rem", textAlign: "left" }}>
                    Product Name
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left" }}>
                    Category
                  </th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>
                    Qty Sold
                  </th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>
                    Avg Price
                  </th>
                  <th style={{ padding: "1rem", textAlign: "right" }}>
                    Total Revenue
                  </th>
                  <th style={{ padding: "1rem", textAlign: "center" }}>
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: "2rem", textAlign: "center" }}
                      className="text-muted"
                    >
                      No product sales found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.productId}
                      style={{ borderBottom: "1px solid var(--border-color)" }}
                    >
                      <td style={{ padding: "1rem", fontWeight: 500 }}>
                        {product.productName}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          className="badge"
                          style={{
                            background: "var(--surface-hover)",
                            textTransform: "capitalize",
                          }}
                        >
                          {product.category}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "var(--success)",
                        }}
                      >
                        {product.totalQuantity}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        ₹{parseFloat(product.avgPrice.toString()).toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "var(--primary)",
                        }}
                      >
                        ₹
                        {parseFloat(product.totalRevenue.toString()).toFixed(2)}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span className="badge badge-info">
                          {product.orderCount}
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
            Product Sales Report
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
            <span>Total Qty Sold:</span>
            <span className="label">{totals.totalQuantity} items</span>
          </div>
          <div className="item-row">
            <span>Total Revenue:</span>
            <span className="label">₹{totals.totalRevenue.toFixed(2)}</span>
          </div>
          <div className="item-row">
            <span>Total Products:</span>
            <span className="label">{totals.totalProducts}</span>
          </div>
          <div className="divider"></div>

          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ width: "44%", textAlign: "left" }}>ITEM</th>
                <th style={{ width: "29%", textAlign: "center" }}>QTY × PRICE</th>
                <th style={{ width: "27%", textAlign: "right" }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.productId}
                  style={{ borderBottom: "1px dashed #777" }}
                >
                  <td
                    style={{
                      padding: "3px 1px",
                      fontWeight: 700,
                      wordBreak: "break-word",
                      lineHeight: "1.2",
                    }}
                  >
                    {product.productName}
                  </td>
                  <td
                    style={{
                      padding: "3px 1px",
                      fontWeight: 700,
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {product.totalQuantity} × {parseFloat(product.avgPrice.toString()).toFixed(0)}
                  </td>
                  <td
                    style={{
                      padding: "3px 1px",
                      fontWeight: 800,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ₹{parseFloat(product.totalRevenue.toString()).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divider" style={{ marginTop: "6px" }}></div>
          <div className="item-row bold" style={{ fontSize: "13px", margin: "4px 0" }}>
            <span>GRAND TOTAL:</span>
            <span className="label">₹{totals.totalRevenue.toFixed(2)}</span>
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
