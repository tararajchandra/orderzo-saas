"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime, getTableList } from "@/lib/utils";
import { ReceiptPrinter } from "@/lib/receipt-printer";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  category_name: string;
  price: number;
  gst_rate?: number;
  image_type: string;
  available: boolean;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function SalesmanDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [activeTables, setActiveTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [settlingTable, setSettlingTable] = useState<string | null>(null);

  // UI State
  const [viewMode, setViewMode] = useState<"create" | "list" | "tables">(
    "create",
  );
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [printingOrderId, setPrintingOrderId] = useState<number | null>(null);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Order Details
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">("dine_in");
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  useEffect(() => {
    if (user && user.role !== "salesman" && user.role !== "admin") {
      router.push("/");
      return;
    }
    fetchMenuItems();
    if (user) {
      fetchPendingOrders();
      fetchActiveTables();
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await fetch("/api/menu?available=true");
      const data = await res.json();
      if (data.success) {
        setMenuItems(data.data);
        const cats = Array.from(
          new Set(
            data.data.map((i: MenuItem) => i.category_name).filter(Boolean),
          ),
        ) as string[];
        setCategories(["all", ...cats]);
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/orders?userId=${user.id}&status=pending`);
      const data = await res.json();
      if (data.success) {
        setPendingOrders(data.data);
      }
    } catch (error) {
      console.error("Error fetching pending orders:", error);
    }
  };

  const fetchActiveTables = async () => {
    if (!user) return;
    try {
      // Fetch all dine-in orders that are pending payment
      const res = await fetch(
        `/api/orders?type=dine_in&payment_status=pending&limit=200&include_items=true`,
      );
      const data = await res.json();
      if (data.success) {
        // Filter out cancelled just in case
        const dineInOrders = data.data.filter(
          (o: any) => o.table_number && o.order_status !== "cancelled",
        );
        setActiveTables(dineInOrders);
      }
    } catch (error) {
      console.error("Error fetching active tables:", error);
    }
  };

  const handleEditOrder = (order: any) => {
    setEditingOrderId(order.id);
    setCustomerName(order.customer_name || "");
    setCustomerPhone(order.customer_phone || "");
    setOrderType(order.order_type || "dine_in");
    setTableNumber(order.table_number || "");
    setPaymentMethod(order.payment_method || "cash");

    // Parse items if they are stored as JSON string or object
    let parsedItems: CartItem[] = [];
    if (typeof order.items === "string") {
      try {
        parsedItems = JSON.parse(order.items);
      } catch (e) {
        console.error("Error parsing items", e);
      }
    } else if (Array.isArray(order.items)) {
      parsedItems = order.items;
    }
    setCart(parsedItems);

    setViewMode("create"); // Switch to editor view
  };

  const resetForm = () => {
    setEditingOrderId(null);
    setCart([]);
    setTableNumber("");
    setCustomerName("");
    setCustomerPhone("");
    setOrderType("dine_in");
    setShowCartMobile(false);
  };

  const handlePrintBill = (tableNo: string) => {
    if (!settings) {
      alert("Settings not loaded yet.");
      return;
    }

    const group = tableGroups[tableNo];
    if (!group) return;

    const isThermal = settings.printerType === "thermal";
    const paperWidth = settings.paperWidth === "58mm" ? "58mm" : "80mm";
    const fontSize = settings.paperWidth === "58mm" ? "12px" : "14px";

    // Combine items from all orders
    let combinedItems: any[] = [];
    let totalSubtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let grandTotal = group.total;

    group.orders.forEach((o: any) => {
      let parsedItems = [];
      try {
        parsedItems =
          typeof o.items === "string" ? JSON.parse(o.items) : o.items || [];
      } catch (e) {}

      combinedItems = [...combinedItems, ...parsedItems];
      totalSubtotal += parseFloat(o.subtotal || 0);
      totalTax += parseFloat(o.tax || 0);
      totalDiscount += parseFloat(o.discount || 0);
    });

    // Combine same items if they appear across multiple orders
    const mergedItemsMap = new Map();
    combinedItems.forEach((item) => {
      const key = item.menuItem.id;
      if (mergedItemsMap.has(key)) {
        const existing = mergedItemsMap.get(key);
        mergedItemsMap.set(key, {
          ...existing,
          quantity: existing.quantity + item.quantity,
        });
      } else {
        mergedItemsMap.set(key, item);
      }
    });
    const finalItems = Array.from(mergedItemsMap.values());

    const orderDate = formatDateTime(new Date().toISOString());

    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Master Bill - Table ${tableNo}</title>
                <style>
                    body {
                        font-family: ${isThermal ? "monospace" : "Arial, sans-serif"};
                        font-size: ${isThermal ? fontSize : "14px"};
                        margin: 0;
                        padding: ${isThermal ? "0" : "20px"};
                        width: ${isThermal ? paperWidth : "100%"};
                        color: #000;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .bold { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { padding: 4px 2px; text-align: left; }
                    th { border-bottom: 1px dashed #000; border-top: 1px dashed #000; }
                    .border-top { border-top: 1px dashed #000; }
                    .border-bottom { border-bottom: 1px dashed #000; }
                    @media print {
                        body { width: ${isThermal ? paperWidth : "100%"}; }
                        @page { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="text-center">
                    <h2 style="margin:0;font-size:${isThermal ? "18px" : "24px"}">${settings.restaurantName}</h2>
                    <p style="margin:2px 0;">${settings.restaurantAddress}</p>
                    <p style="margin:2px 0;">Phone: ${settings.restaurantPhone}</p>
                    ${settings.gstNumber ? `<p style="margin:2px 0;">GSTIN: ${settings.gstNumber}</p>` : ""}
                    <div style="margin:10px 0; border-top:1px dashed #000; border-bottom:1px dashed #000; padding:5px 0;">
                        <span class="bold">MASTER BILL (Dine-in)</span>
                    </div>
                </div>
                
                <div>
                    <div class="bold" style="font-size: 18px; margin-bottom: 5px;">Table No: ${tableNo}</div>
                    <div>Date: ${orderDate}</div>
                    <div>Orders: ${group.orders.map((o: any) => "#" + (o.order_number || o.id)).join(", ")}</div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 50%">Item</th>
                            <th class="text-center">Qty</th>
                            <th class="text-right">Price</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${finalItems
                          .map(
                            (item: any) => `
                        <tr>
                            <td>${item.menuItem.name}</td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-right">${Number(item.menuItem.price).toFixed(2)}</td>
                            <td class="text-right">${(Number(item.menuItem.price) * item.quantity).toFixed(2)}</td>
                        </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>

                <div style="margin-top: 10px; padding-top: 5px;" class="border-top">
                    <table style="margin-top: 0;">
                        <tr>
                            <td>Subtotal</td>
                            <td class="text-right">${totalSubtotal.toFixed(2)}</td>
                        </tr>
                        ${
                          totalTax > 0
                            ? `
                        <tr>
                            <td>Taxes</td>
                            <td class="text-right">${totalTax.toFixed(2)}</td>
                        </tr>`
                            : ""
                        }
                    </table>
                </div>

                <div style="margin-top: 10px; padding: 10px 0;" class="border-top border-bottom bold">
                    <table style="margin-top: 0;">
                        <tr>
                            <td style="font-size: ${isThermal ? "16px" : "18px"}">GRAND TOTAL</td>
                            <td class="text-right" style="font-size: ${isThermal ? "16px" : "18px"}">Rs. ${grandTotal.toFixed(2)}</td>
                        </tr>
                    </table>
                </div>

                <div class="text-center" style="margin-top: 20px;">
                    <p style="margin: 2px 0;">${settings.footerText}</p>
                </div>
                
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  const handleSettleTable = async (
    tableNo: string,
    paymentMethod: string,
    groupOrders: any[],
  ) => {
    const confirmSettle = confirm(
      `Settle all pending orders for Table ${tableNo}?`,
    );
    if (!confirmSettle) return;

    setSettlingTable(tableNo);
    try {
      // Sort by oldest first so we keep the first order id as the master
      const sortedOrders = [...groupOrders].sort(
        (a: any, b: any) => a.id - b.id,
      );
      const masterOrder = sortedOrders[0];
      const otherOrders = sortedOrders.slice(1);

      let combinedItems: any[] = [];
      let totalSubtotal = 0;
      let totalTax = 0;
      let totalDiscount = 0;

      sortedOrders.forEach((o: any) => {
        let parsedItems = [];
        try {
          parsedItems =
            typeof o.items === "string" ? JSON.parse(o.items) : o.items || [];
        } catch (e) {}
        combinedItems = [...combinedItems, ...parsedItems];
        totalSubtotal += parseFloat(o.subtotal || 0);
        totalTax += parseFloat(o.tax || 0);
        totalDiscount += parseFloat(o.discount || 0);
      });

      const mergedItemsMap = new Map();
      combinedItems.forEach((item) => {
        const key = item.menuItem.id;
        if (mergedItemsMap.has(key)) {
          const existing = mergedItemsMap.get(key);
          mergedItemsMap.set(key, {
            ...existing,
            quantity: existing.quantity + item.quantity,
          });
        } else {
          mergedItemsMap.set(key, item);
        }
      });
      const finalItems = Array.from(mergedItemsMap.values());
      const finalTotal = totalSubtotal + totalTax - totalDiscount;

      // Update Master Order with merged items and totals
      await fetch(`/api/orders/${masterOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_status: "paid",
          payment_method: paymentMethod,
          order_status: "delivered",
          items: finalItems,
          subtotal: totalSubtotal,
          tax: totalTax,
          discount: totalDiscount,
          total_amount: finalTotal,
        }),
      });

      // Delete the duplicate separated orders since they are now merged
      if (otherOrders.length > 0) {
        const deletePromises = otherOrders.map((o: any) =>
          fetch(`/api/orders/${o.id}`, { method: "DELETE" }),
        );
        await Promise.all(deletePromises);
      }

      alert(`Table ${tableNo} settled successfully!`);
      fetchActiveTables();
      fetchPendingOrders();
    } catch (error) {
      console.error("Error settling table:", error);
      alert("Failed to settle table.");
    } finally {
      setSettlingTable(null);
    }
  };

  // Filter Logic
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart Logic
  const addToCart = (item: MenuItem) => {
    const existing = cart.find((ci) => ci.menuItem.id === item.id);
    if (existing) {
      setCart(
        cart.map((ci) =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci,
        ),
      );
    } else {
      setCart([...cart, { menuItem: item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId: number, delta: number) => {
    const existing = cart.find((ci) => ci.menuItem.id === itemId);
    if (!existing) return;

    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((ci) => ci.menuItem.id !== itemId));
    } else {
      setCart(
        cart.map((ci) =>
          ci.menuItem.id === itemId ? { ...ci, quantity: newQty } : ci,
        ),
      );
    }
  };

  // Calculations
  const calculateTotal = () => {
    return cart.reduce(
      (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
      0,
    );
  };

  const calculateTax = () => {
    if (
      settings &&
      (settings.gstType === "unregistered" || settings.gstType === "composite")
    ) {
      return 0;
    }
    return cart.reduce((sum, item) => {
      const taxRate = (item.menuItem.gst_rate || 5) / 100;
      return sum + Number(item.menuItem.price) * item.quantity * taxRate;
    }, 0);
  };

  const grandTotal = calculateTotal() + calculateTax();
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSubmitOrder = async (status: string = "pending") => {
    if (orderType === "dine_in" && !tableNumber) {
      alert("Please provide Table Number for Dine-in");
      return;
    }
    if (cart.length === 0) {
      alert("Please add items to the order");
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        user_id: user?.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        order_type: orderType,
        items: cart,
        subtotal: calculateTotal(),
        tax: calculateTax(),
        total_amount: grandTotal,
        payment_method: paymentMethod,
        discount: 0,
        table_number: tableNumber || null,
        order_status: status,
      };

      let res;
      if (editingOrderId) {
        // Update existing order
        res = await fetch(`/api/orders/${editingOrderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });
      } else {
        // Create new order
        res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });
      }

      const data = await res.json();

      if (data.success) {
        alert(
          editingOrderId
            ? "Order Updated Successfully!"
            : `Order Placed Successfully! \nInvoice: ${data.data.invoice_number}`,
        );
        resetForm();
        fetchPendingOrders(); // Refresh list
        fetchActiveTables();
      } else {
        alert(`Failed to save order: ${data.error}`);
      }
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Order operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const printKOTFallback = (order: any, settings: any) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      alert("Please allow popups to print the KOT.");
      return;
    }

    const itemsHtml = (
      Array.isArray(order.items)
        ? order.items
        : typeof order.items === "string"
          ? JSON.parse(order.items)
          : []
    )
      .map((item: any) => {
        return (
          '<tr><td style="padding: 4px 0;">' +
          item.menuItem.name +
          '</td><td style="text-align: center; padding: 4px 0;">' +
          item.quantity +
          "</td></tr>"
        );
      })
      .join("");

    const htmlContent =
      "<!DOCTYPE html><html><head><title>KOT - #" +
      (order.id || "") +
      '</title><style>@page { margin: 0; size: 80mm auto; } body { font-family: \'Courier New\', Courier, monospace; width: 72mm; margin: 0 auto; padding: 10px; font-size: 16px; font-weight: bold; color: black; background: #fff; } .center { text-align: center; } .bold { font-weight: bold; } table { width: 100%; border-collapse: collapse; margin-top: 10px; } th { border-bottom: 1px dashed #000; padding-bottom: 5px; text-align: left; } .divider { border-top: 1px dashed #000; margin: 10px 0; }</style></head><body><div class="center bold" style="font-size: 24px;">K.O.T</div><div class="center divider"></div><div>Order No: ' +
      (order.order_number || order.id || "N/A") +
      "</div><div>Type: " +
      (order.order_type || "").toUpperCase() +
      "</div>" +
      (order.table_number
        ? "<div>Table: " + order.table_number + "</div>"
        : "") +
      "<div>Date: " +
      new Date().toLocaleString() +
      '</div><table><thead><tr><th>Item</th><th style="text-align: center;">Qty</th></tr></thead><tbody>' +
      itemsHtml +
      '</tbody></table><div class="divider"></div>' +
      (order.notes
        ? "<div><strong>Notes:</strong> " + order.notes + "</div>"
        : "") +
      '<div style="height: 10px;"></div></body></html>';

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    }, 500);
  };

  const handlePrintKOT = async (order: any) => {
    setPrintingOrderId(order.id);
    try {
      // @ts-ignore
      if (!navigator.usb) {
        printKOTFallback(order, settings);
        return;
      }

      // @ts-ignore
      const device = await navigator.usb.requestDevice({ filters: [] });
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      const printer = new ReceiptPrinter();

      printer.alignCenter();
      printer.setSize(2, 2);
      printer.bold(true).textLine("K.O.T").bold(false);
      printer.setSize(1, 1);
      printer.feed(1);

      printer.alignLeft();
      printer.textLine(
        "Order No: " + (order.order_number || order.id || "N/A"),
      );
      printer.textLine("Type: " + (order.order_type || "").toUpperCase());
      if (order.table_number) printer.textLine("Table: " + order.table_number);
      printer.textLine("Date: " + new Date().toLocaleString());
      printer.line("-");

      printer.textLine("ITEM                       QTY");
      printer.line("-");

      const items = Array.isArray(order.items)
        ? order.items
        : typeof order.items === "string"
          ? JSON.parse(order.items)
          : [];
      items.forEach((item: any) => {
        const name = item.menuItem.name.substring(0, 24).padEnd(24, " ");
        const qty = String(item.quantity).padStart(5, " ");
        printer.setSize(1, 2);
        printer.bold(true);
        printer.textLine(name + " " + qty);
        printer.bold(false);
      });

      printer.setSize(1, 1);
      printer.line("-");

      if (order.notes) {
        printer.feed(1);
        printer.textLine("Notes: " + order.notes);
      }

      printer.feed(3);
      printer.cut();

      const data = printer.getData();
      // @ts-ignore
      await device.transferOut(1, data);
      // @ts-ignore
      await device.close();
    } catch (error: any) {
      console.warn("USB KOT Print failed, falling back:", error);
      printKOTFallback(order, settings);
    } finally {
      setPrintingOrderId(null);
    }
  };

  // Group active tables
  const tableGroups = activeTables.reduce((acc: any, order: any) => {
    const table = order.table_number;
    if (!acc[table]) acc[table] = { orders: [], total: 0 };
    acc[table].orders.push(order);
    acc[table].total += parseFloat(order.total_amount || 0);
    return acc;
  }, {});

  return (
    <main
      className="container"
      style={{
        padding: "2rem 1.5rem",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "90px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1>Salesman Dashboard</h1>
          <p className="text-muted">Welcome, {user?.name}</p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              background: "#1e1e1e",
              borderRadius: "8px",
              padding: "4px",
            }}
          >
            <button
              className={`btn ${viewMode === "create" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => {
                setViewMode("create");
                resetForm();
              }}
            >
              Create Order
            </button>
            <button
              className={`btn ${viewMode === "list" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => {
                setViewMode("list");
                fetchPendingOrders();
              }}
            >
              My Orders ({pendingOrders.length})
            </button>
            <button
              className={`btn ${viewMode === "tables" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => {
                setViewMode("tables");
                fetchActiveTables();
              }}
            >
              Active Tables ({Object.keys(tableGroups).length})
            </button>
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost"
            style={{ color: "var(--error)" }}
          >
            Logout
          </button>
        </div>
      </div>

      {viewMode === "tables" ? (
        // ACTIVE TABLES VIEW
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            {getTableList(settings).map((tableNo) => {
              const isOccupied = !!tableGroups[tableNo];

              return (
                <button
                  key={tableNo}
                  onClick={() => {
                    if (isOccupied) {
                      setSelectedTable(tableNo);
                      setShowModal(true);
                    } else {
                      alert(`Table ${tableNo} is currently empty.`);
                    }
                  }}
                  style={{
                    height: "100px",
                    borderRadius: "12px",
                    border: "none",
                    background: isOccupied ? "var(--error)" : "var(--success)",
                    color: "white",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    transition: "transform 0.2s",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {tableNo.replace("Table ", "")}
                  </span>
                  {isOccupied && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        marginTop: "0.5rem",
                        background: "rgba(255,255,255,0.2)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      ₹{tableGroups[tableNo].total.toFixed(0)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : viewMode === "list" ? (
        // PENDING ORDERS LIST VIEW
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {pendingOrders.length === 0 ? (
            <div
              className="glass-card"
              style={{
                padding: "2rem",
                gridColumn: "1/-1",
                textAlign: "center",
              }}
            >
              <p className="text-muted">No saved orders found.</p>
              <button
                className="btn btn-primary"
                onClick={() => setViewMode("create")}
                style={{ marginTop: "1rem" }}
              >
                Create New Order
              </button>
            </div>
          ) : (
            pendingOrders.map((order) => (
              <div
                key={order.id}
                className="glass-card"
                style={{
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>
                      Order #{order.order_number || order.id}
                    </h3>
                    <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  <span
                    className="badge"
                    style={{ background: "var(--info)", color: "white" }}
                  >
                    Pending
                  </span>
                </div>

                <div>
                  <p style={{ margin: "0 0 0.5rem 0" }}>
                    <strong>{order.customer_name || "Walk-in"}</strong>
                  </p>
                  <p style={{ margin: 0 }} className="text-muted">
                    {order.order_type} •{" "}
                    {order.table_number
                      ? `Table ${order.table_number}`
                      : "No Table"}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "auto",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--border-color)",
                  }}
                >
                  <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                    ₹{Number(order.total_amount).toFixed(2)}
                  </span>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEditOrder(order)}
                  >
                    Edit / Place
                  </button>
                  <button
                    className="btn btn-warning"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintKOT(order);
                    }}
                    style={{ marginLeft: "0.5rem" }}
                  >
                    🖨️ Print KOT
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // CREATE / EDIT ORDER VIEW
        <>
          {/* Mobile "View Bill" Sticky Button */}
          {!showCartMobile && (
            <div
              className="mobile-only"
              style={{
                position: "fixed",
                bottom: "1rem",
                left: "1rem",
                right: "1rem",
                zIndex: 100,
                display: "none", // Hidden by default, shown via CSS
              }}
            >
              <button
                onClick={() => setShowCartMobile(true)}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                  borderRadius: "12px",
                  fontSize: "1.1rem",
                }}
              >
                <span>{totalItems} Items</span>
                <span style={{ fontWeight: "bold" }}>
                  View Bill ₹{grandTotal.toFixed(0)}
                </span>
              </button>
            </div>
          )}

          {/* Styles for Mobile Responsive Layering */}
          <style jsx global>{`
            @media (max-width: 768px) {
              .desktop-bill-panel {
                display: none !important;
              }
              .mobile-only {
                display: block !important;
              }

              /* Fix Main Grid to be single column on mobile */
              .responsive-grid {
                display: block !important;
              }

              /* Menu Grid Adjustments for Mobile */
              .menu-grid {
                grid-template-columns: 1fr !important; /* Single column */
                gap: 0.75rem !important;
              }

              /* The Overlay */
              .mobile-bill-overlay {
                position: fixed !important;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: var(--bg-primary); /* solid background */
                z-index: 200;
                overflow-y: auto;
                padding: 1rem;
                animation: slideUp 0.25s ease-out;
                display: flex;
                flex-direction: column;
              }

              @keyframes slideUp {
                from {
                  transform: translateY(100%);
                }
                to {
                  transform: translateY(0);
                }
              }
            }
          `}</style>

          {editingOrderId && (
            <div
              style={{
                background: "var(--info-light)",
                color: "var(--info)",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                Editing Order #
                {pendingOrders.find((o) => o.id === editingOrderId)
                  ?.order_number || editingOrderId}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={resetForm}>
                Cancel Edit
              </button>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 400px",
              gap: "2rem",
            }}
            className="responsive-grid"
          >
            {/* LEFT: MENU SECTION */}
            <div style={{ paddingBottom: "2rem" }}>
              {/* Search & Categories */}
              <div
                className="glass-card"
                style={{ marginBottom: "1.5rem", padding: "1rem" }}
              >
                <input
                  className="input"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ marginBottom: "1rem", width: "100%" }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    overflowX: "auto",
                    paddingBottom: "0.5rem",
                  }}
                >
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`btn ${selectedCategory === cat ? "btn-primary" : "btn-ghost"}`}
                      style={{
                        padding: "0.5rem 1rem",
                        fontSize: "0.9rem",
                        textTransform: "capitalize",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Grid */}
              <div
                className="menu-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "1rem",
                }}
              >
                {loading ? (
                  <p>Loading menu...</p>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="glass-card"
                      style={{
                        padding: "1rem",
                        cursor: "pointer",
                        transition: "0.2s",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                      onClick={() => addToCart(item)}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "1rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name}
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--primary)",
                            fontWeight: "bold",
                          }}
                        >
                          ₹{Number(item.price).toFixed(0)}
                        </span>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            background: "var(--primary)",
                            borderRadius: "50%",
                            color: "white",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: "1.2rem",
                          }}
                        >
                          +
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT: BILLING SECTION (Responsive Wrapper) */}
            <div
              className={`${showCartMobile ? "mobile-bill-overlay" : "desktop-bill-panel"}`}
              style={{
                position: showCartMobile ? "fixed" : "sticky",
                top: "1rem",
              }}
            >
              {/* Mobile Close Header */}
              {showCartMobile && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                    paddingBottom: "0.5rem",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <h2 style={{ margin: 0 }}>Your Order</h2>
                  <button
                    onClick={() => setShowCartMobile(false)}
                    className="btn btn-ghost"
                    style={{
                      fontSize: "2rem",
                      lineHeight: "1rem",
                      height: "auto",
                      padding: "0.5rem",
                    }}
                  >
                    &times;
                  </button>
                </div>
              )}

              <div
                className={showCartMobile ? "" : "glass-card"}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: showCartMobile ? "auto" : "calc(100vh - 8rem)",
                  flex: 1,
                }}
              >
                {!showCartMobile && (
                  <h2
                    style={{
                      marginBottom: "1rem",
                      textAlign: "center",
                      fontFamily: "serif",
                    }}
                  >
                    Current Bill
                  </h2>
                )}

                {/* Order Controls */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  <select
                    value={orderType}
                    onChange={(e: any) => setOrderType(e.target.value)}
                    className="input"
                    style={{ padding: "0.8rem" }}
                  >
                    <option value="dine_in">Dine-in</option>
                    <option value="takeaway">Takeaway</option>
                  </select>
                  {orderType === "dine_in" && (
                    <select
                      className="input"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      style={{ padding: "0.8rem" }}
                    >
                      <option value="" disabled>
                        Select Table
                      </option>
                      {getTableList(settings).map((num) => (
                        <option key={num} value={num}>
                          {num.includes(" ") ? num : `Table ${num}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Cart List */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    marginBottom: "1rem",
                    minHeight: "200px",
                  }}
                >
                  {cart.length === 0 ? (
                    <p
                      className="text-muted text-center"
                      style={{ marginTop: "2rem" }}
                    >
                      No items added to cart
                    </p>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.menuItem.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.8rem",
                          paddingBottom: "0.5rem",
                          borderBottom: "1px solid var(--border-color)",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>
                            {item.menuItem.name}
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "0.85rem" }}
                          >
                            ₹{Number(item.menuItem.price).toFixed(0)} x{" "}
                            {item.quantity}
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <button
                            className="btn btn-ghost"
                            style={{
                              padding: "4px 10px",
                              background: "var(--glass-border)",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.menuItem.id, -1);
                            }}
                          >
                            -
                          </button>
                          <b style={{ fontSize: "1.1rem" }}>{item.quantity}</b>
                          <button
                            className="btn btn-ghost"
                            style={{
                              padding: "4px 10px",
                              background: "var(--glass-border)",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item.menuItem);
                            }}
                          >
                            +
                          </button>
                        </div>
                        <div
                          style={{
                            fontWeight: "bold",
                            minWidth: "60px",
                            textAlign: "right",
                          }}
                        >
                          ₹
                          {(
                            Number(item.menuItem.price) * item.quantity
                          ).toFixed(0)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Section */}
                <div
                  style={{
                    borderTop: "2px solid var(--border-color)",
                    paddingTop: "1rem",
                    paddingBottom: showCartMobile ? "2rem" : 0,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <input
                      className="input"
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{ fontSize: "0.9rem", padding: "0.8rem" }}
                    />
                    <input
                      className="input"
                      placeholder="Phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      style={{ fontSize: "0.9rem", padding: "0.8rem" }}
                      type="tel"
                    />
                  </div>

                  <select
                    className="input"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ marginBottom: "1rem", padding: "0.8rem" }}
                  >
                    <option value="cash">Cash Payment</option>
                    <option value="card">Card Payment</option>
                    <option value="upi">UPI / Scan</option>
                  </select>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      marginBottom: "1rem",
                    }}
                  >
                    <span>Total Pay:</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <button
                      onClick={() => handleSubmitOrder("pending")}
                      className="btn btn-ghost"
                      style={{
                        width: "100%",
                        fontSize: "1.1rem",
                        padding: "1rem",
                        fontWeight: "bold",
                        border: "1px solid var(--border-color)",
                        background: "transparent",
                      }}
                      disabled={submitting}
                    >
                      {submitting ? "Saving..." : "Save Order"}
                    </button>
                    <button
                      onClick={() => handleSubmitOrder("confirmed")}
                      className="btn btn-primary"
                      style={{
                        width: "100%",
                        fontSize: "1.2rem",
                        padding: "1rem",
                        fontWeight: "bold",
                      }}
                      disabled={submitting}
                    >
                      {submitting ? "Placing..." : "Place Order"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showModal && selectedTable && tableGroups[selectedTable] && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
          }}
        >
          <div
            className="fade-in"
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "#121212",
              border: "1px solid #333",
              borderRadius: "12px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: "1rem",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "var(--primary)",
                  fontSize: "1.25rem",
                }}
              >
                Table {selectedTable}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-ghost"
                style={{ padding: "0.5rem" }}
              >
                ❌
              </button>
            </div>

            <div
              style={{
                overflowY: "auto",
                flex: 1,
                paddingRight: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              {tableGroups[selectedTable].orders.map((o: any, idx: number) => (
                <div
                  key={o.id}
                  style={{
                    marginBottom: "1rem",
                    padding: "0.75rem",
                    background: "#1e1e1e",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <strong style={{ fontSize: "0.85rem" }}>
                      Order #{o.order_number || o.id}
                    </strong>
                    <span className="badge badge-info">{o.order_status}</span>
                  </div>
                  <div
                    className="text-muted"
                    style={{ fontSize: "0.65rem", marginBottom: "0.25rem" }}
                  >
                    {formatDateTime(o.created_at)}
                  </div>
                  {(() => {
                    let items = [];
                    try {
                      items =
                        typeof o.items === "string"
                          ? JSON.parse(o.items)
                          : o.items || [];
                    } catch (e) {}
                    return items.length > 0 ? (
                      <div
                        style={{
                          margin: "0.5rem 0",
                          padding: "0.5rem 0",
                          borderTop: "1px solid rgba(255,255,255,0.1)",
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {items.map((item: any, i: number) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "0.25rem",
                            }}
                          >
                            <span style={{ color: "var(--text-secondary)" }}>
                              {item.quantity}x {item.menuItem?.name || "Item"}
                            </span>
                            <span style={{ color: "var(--text-secondary)" }}>
                              ₹
                              {(
                                item.quantity *
                                parseFloat(item.menuItem?.price || 0)
                              ).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    <span>Amount:</span>
                    <span>₹{parseFloat(o.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border-color)",
                paddingTop: "1rem",
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <span style={{ fontSize: "1rem", fontWeight: 600 }}>
                  Master Bill
                </span>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                  }}
                >
                  ₹{tableGroups[selectedTable].total.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => handlePrintBill(selectedTable)}
                className="btn btn-ghost"
                style={{
                  width: "100%",
                  marginBottom: "1rem",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                🖨️ Print Master Bill
              </button>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <button
                  onClick={() => {
                    handleSettleTable(
                      selectedTable,
                      "cash",
                      tableGroups[selectedTable].orders,
                    );
                    setShowModal(false);
                  }}
                  disabled={settlingTable === selectedTable}
                  className="btn btn-primary"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                >
                  {settlingTable === selectedTable ? "..." : "💵 Settle Cash"}
                </button>
                <button
                  onClick={() => {
                    handleSettleTable(
                      selectedTable,
                      "upi",
                      tableGroups[selectedTable].orders,
                    );
                    setShowModal(false);
                  }}
                  disabled={settlingTable === selectedTable}
                  className="btn btn-secondary"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "0.5rem",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                  }}
                >
                  {settlingTable === selectedTable ? "..." : "📱 Settle UPI"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
