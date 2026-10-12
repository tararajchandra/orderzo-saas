"use client";

import React, { useState, useEffect } from "react";
import { useFinancialYear } from "@/contexts/FinancialYearContext";
import { useRouter } from "next/navigation";
import { formatDateTime, getTableList, getGroupedTableList } from "@/lib/utils";
import Link from "next/link";
import {
  getOfflineOrders,
  saveOfflineOrder,
  syncOfflineOrders,
} from "@/lib/offlineManager";
import { printHtmlSafely } from "@/lib/printFallback";
import PrinterConfigModal from "@/components/PrinterConfigModal";
import { useAuth } from "@/contexts/AuthContext";
import { isTauri, printOrderBill, printOrderKOT } from "@/lib/tauriBridge";

// Zone Color Palette
const ZONE_COLORS = [
  {
    empty: "var(--glass-bg)",
    occupied: "#3b82f6",
    border: "rgba(59, 130, 246, 0.5)",
  }, // Blue
  {
    empty: "var(--glass-bg)",
    occupied: "#a855f7",
    border: "rgba(168, 85, 247, 0.5)",
  }, // Purple
  {
    empty: "var(--glass-bg)",
    occupied: "#f97316",
    border: "rgba(249, 115, 22, 0.5)",
  }, // Orange
  {
    empty: "var(--glass-bg)",
    occupied: "#14b8a6",
    border: "rgba(20, 184, 166, 0.5)",
  }, // Teal
  {
    empty: "var(--glass-bg)",
    occupied: "#ec4899",
    border: "rgba(236, 72, 153, 0.5)",
  }, // Pink
  {
    empty: "var(--glass-bg)",
    occupied: "#eab308",
    border: "rgba(234, 179, 8, 0.5)",
  }, // Yellow
];

export default function AdminTablesPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_active_table_orders");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined" && !navigator.onLine) {
      return false;
    }
    return true;
  });
  const { selectedFY } = useFinancialYear();
  const [settlingTable, setSettlingTable] = useState<string | null>(null);
  const [tableDiscount, setTableDiscount] = useState<number>(0);
  const [settleModal, setSettleModal] = useState<{
    tableNo: string;
    total: number;
    discount: number;
  } | null>(null);
  const [settleMethod, setSettleMethod] = useState<"cash" | "upi" | "split">("cash");
  const [settleCashAmount, setSettleCashAmount] = useState<string>("");
  const [settleUpiAmount, setSettleUpiAmount] = useState<string>("");
  const [totalTables, setTotalTables] = useState(16);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [editingTableItems, setEditingTableItems] = useState<{tableNo: string, masterOrderId: number, otherOrderIds: number[], items: any[]} | null>(null);

  // Modal state for showing table details
  const [showModal, setShowModal] = useState(false);

  const { isCashier } = useAuth();
  const [isDesktop, setIsDesktop] = useState(false);
  // For printing
  const [settings, setSettings] = useState<any>(null);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tableNo: string;
    isOccupied: boolean;
  } | null>(null);
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  // Note Modal State
  const [noteModal, setNoteModal] = useState<{ tableNo: string } | null>(null);
  const [noteText, setNoteText] = useState("");

  // Close context menu on any click
  const handleClick = () => setContextMenu(null);
  React.useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    setIsDesktop(isTauri());
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin");
      return;
    }
    fetchSettings();
    fetchActiveTableOrders();

    // Poll every 15s to keep it fresh
    const interval = setInterval(() => {
      fetchActiveTableOrders(true);
    }, 15000);

    const handleOnline = async () => {
      try {
        await syncOfflineOrders();
        fetchActiveTableOrders();
      } catch (e) {}
    };
    window.addEventListener("online", handleOnline);
    if (typeof navigator !== "undefined" && navigator.onLine) {
      handleOnline();
    }

    const handleSyncEvent = () => {
      fetchActiveTableOrders(true);
    };
    window.addEventListener("offline-orders-synced", handleSyncEvent);
    window.addEventListener("offline-orders-updated", handleSyncEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline-orders-synced", handleSyncEvent);
      window.removeEventListener("offline-orders-updated", handleSyncEvent);
    };
  }, []);

  const fetchSettings = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      try {
        const cached = localStorage.getItem("cached_settings");
        if (cached) {
          const parsed = JSON.parse(cached);
          setSettings(parsed);
          if (parsed.totalTables) setTotalTables(parseInt(parsed.totalTables, 10));
        }
      } catch (e) {}
      return;
    }
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        try { localStorage.setItem("cached_settings", JSON.stringify(data.data)); } catch (e) {}
        if (data.data.totalTables) {
          setTotalTables(parseInt(data.data.totalTables, 10));
        }
      }
    } catch (error) {
      console.warn("Error fetching settings, checking cache:", error);
      try {
        const cached = localStorage.getItem("cached_settings");
        if (cached) {
          const parsed = JSON.parse(cached);
          setSettings(parsed);
          if (parsed.totalTables) setTotalTables(parseInt(parsed.totalTables, 10));
        }
      } catch (e) {}
    }
  };

  const fetchActiveTableOrders = async (isPolling = false) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      try {
        const cached = localStorage.getItem("cached_active_table_orders");
        let localList: any[] = cached ? JSON.parse(cached) : [];
        const offlineList = await getOfflineOrders();
        const offlineDineIn = offlineList
          .filter(
            (o) =>
              o.method === "POST" &&
              o.body &&
              (o.body.order_type === "dine_in" || o.body.order_type === "dine-in") &&
              o.body.table_number &&
              o.body.payment_status !== "paid" &&
              o.body.order_status !== "cancelled",
          )
          .map((o) => ({
            ...o.body,
            id: o.body.order_number || o.id,
            order_number: o.body.order_number || o.id,
            created_at: o.body.created_at || new Date(o.timestamp).toISOString(),
            is_offline: true,
          }));
        const map = new Map();
        localList.forEach((item) => map.set(item.order_number || item.id, item));
        offlineDineIn.forEach((item) => map.set(item.order_number || item.id, item));
        setOrders(Array.from(map.values()));
      } catch (e) {}
      if (!isPolling) setLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const response = await fetch(
        "/api/orders?type=dine_in&payment_status=pending&limit=200&include_items=true",
        { cache: "no-store", signal: controller.signal },
      );
      clearTimeout(timeoutId);
      const data = await response.json();
      if (data.success) {
        const activeDineInOrders = data.data.filter(
          (o: any) =>
            (o.order_type === "dine_in" || o.order_type === "dine-in") &&
            o.table_number &&
            o.payment_status !== "paid" &&
            o.order_status !== "cancelled",
        );
        setOrders(activeDineInOrders);
        try {
          localStorage.setItem(
            "cached_active_table_orders",
            JSON.stringify(activeDineInOrders),
          );
        } catch (e) {}
      }
    } catch (error) {
      console.warn("Error fetching table orders, checking cache:", error);
      try {
        const cached = localStorage.getItem("cached_active_table_orders");
        let localList: any[] = cached ? JSON.parse(cached) : [];
        const offlineList = await getOfflineOrders();
        const offlineDineIn = offlineList
          .filter(
            (o) =>
              o.method === "POST" &&
              o.body &&
              (o.body.order_type === "dine_in" || o.body.order_type === "dine-in") &&
              o.body.table_number &&
              o.body.payment_status !== "paid" &&
              o.body.order_status !== "cancelled",
          )
          .map((o) => ({
            ...o.body,
            id: o.body.order_number || o.id,
            order_number: o.body.order_number || o.id,
            created_at: o.body.created_at || new Date(o.timestamp).toISOString(),
            is_offline: true,
          }));
        const map = new Map();
        localList.forEach((item) => map.set(item.order_number || item.id, item));
        offlineDineIn.forEach((item) => map.set(item.order_number || item.id, item));
        setOrders(Array.from(map.values()));
      } catch (e) {}
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  // Group orders by table number
  const tableGroups = orders.reduce((acc: any, order: any) => {
    const table = order.table_number.toString();
    if (!acc[table]) {
      acc[table] = { orders: [], total: 0, lastActivity: order.created_at };
    }
    acc[table].orders.push(order);
    acc[table].total += parseFloat(order.total_amount || 0);
    if (new Date(order.created_at) > new Date(acc[table].lastActivity)) {
      acc[table].lastActivity = order.created_at;
    }
    return acc;
  }, {});


  const handleEditTableItems = (tableNo: string) => {
    const group = tableGroups[tableNo];
    if (!group || group.orders.length === 0) return;

    // Sort by oldest first so we keep the first order id as the master
    const sortedOrders = [...group.orders].sort((a: any, b: any) => a.id - b.id);
    const masterOrder = sortedOrders[0];
    const otherOrders = sortedOrders.slice(1);

    // Combine all items
    let combinedItems: any[] = [];
    sortedOrders.forEach((o: any) => {
      let parsedItems = [];
      try {
        parsedItems = typeof o.items === "string" ? JSON.parse(o.items) : o.items || [];
      } catch (e) {}
      combinedItems = [...combinedItems, ...parsedItems];
    });

    // Merge same items
    const mergedItemsMap = new Map();
    combinedItems.forEach((item) => {
      const key = item.menuItem.id;
      if (mergedItemsMap.has(key)) {
        const existing = mergedItemsMap.get(key);
        mergedItemsMap.set(key, { ...existing, quantity: existing.quantity + item.quantity });
      } else {
        mergedItemsMap.set(key, item);
      }
    });
    const finalItems = Array.from(mergedItemsMap.values());

    setEditingTableItems({
      tableNo,
      masterOrderId: masterOrder.id,
      otherOrderIds: otherOrders.map((o: any) => o.id),
      items: finalItems
    });
  };

  const handleSaveTableItems = async () => {
    if (!editingTableItems) return;

    // Calculate new totals
    let totalSubtotal = 0;
    let totalTax = 0;
    
    editingTableItems.items.forEach((item: any) => {
      const itemTotal = Number(item.menuItem.price) * item.quantity;
      totalSubtotal += itemTotal;
      
      if (settings?.gstType === "regular") {
        const gstRate = (item.menuItem.gst_rate || 5) / 100;
        totalTax += itemTotal * gstRate;
      }
    });

    const finalTotal = totalSubtotal + totalTax;
    const masterPayload = {
      items: editingTableItems.items,
      subtotal: totalSubtotal,
      tax: totalTax,
      total_amount: finalTotal,
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await saveOfflineOrder(`/api/orders/${editingTableItems.masterOrderId}`, "PUT", masterPayload);
      for (const id of editingTableItems.otherOrderIds) {
        await saveOfflineOrder(`/api/orders/${id}`, "DELETE", {});
      }

      setOrders((prev) => {
        const deletedSet = new Set(editingTableItems.otherOrderIds);
        const next = prev
          .filter((o) => !deletedSet.has(o.id))
          .map((o) =>
            o.id === editingTableItems.masterOrderId
              ? { ...o, ...masterPayload, is_offline: true }
              : o,
          );
        try {
          localStorage.setItem("cached_active_table_orders", JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      alert(`Items for Table ${editingTableItems.tableNo} updated offline! Will sync automatically.`);
      setEditingTableItems(null);
      return;
    }

    try {
      // 1. Update Master Order
      await fetch(`/api/orders/${editingTableItems.masterOrderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterPayload),
      });

      // 2. Delete other orders
      if (editingTableItems.otherOrderIds.length > 0) {
        const deletePromises = editingTableItems.otherOrderIds.map((id: number) =>
          fetch(`/api/orders/${id}`, { method: "DELETE" }),
        );
        await Promise.all(deletePromises);
      }

      alert(`Items for Table ${editingTableItems.tableNo} updated successfully!`);
      setEditingTableItems(null);
      fetchActiveTableOrders();
    } catch (error) {
      console.warn("Error updating table items on server, saving offline:", error);
      try {
        await saveOfflineOrder(`/api/orders/${editingTableItems.masterOrderId}`, "PUT", masterPayload);
        for (const id of editingTableItems.otherOrderIds) {
          await saveOfflineOrder(`/api/orders/${id}`, "DELETE", {});
        }
        setOrders((prev) => {
          const deletedSet = new Set(editingTableItems.otherOrderIds);
          const next = prev
            .filter((o) => !deletedSet.has(o.id))
            .map((o) =>
              o.id === editingTableItems.masterOrderId
                ? { ...o, ...masterPayload, is_offline: true }
                : o,
            );
          try {
            localStorage.setItem("cached_active_table_orders", JSON.stringify(next));
          } catch (e) {}
          return next;
        });
        alert(`নেটওয়ার্ক সমস্যার কারণে টেবিল ${editingTableItems.tableNo}-এর আইটেম অফলাইনে সংরক্ষিত হয়েছে।`);
        setEditingTableItems(null);
      } catch (e) {
        alert("An error occurred while updating the table items.");
      }
    }
  };

  const handleSettleTable = async (
    tableNo: string,
    paymentMethod: string,
    splits?: any,
    discountOverride?: number,
    skipConfirm: boolean = false
  ) => {
    const appliedDiscount = discountOverride !== undefined ? discountOverride : tableDiscount;
    if (!skipConfirm) {
      const confirmSettle = confirm(
        `Are you sure you want to settle all pending orders for Table ${tableNo} with ${paymentMethod.toUpperCase()}${appliedDiscount > 0 ? ` (Discount: ₹${appliedDiscount.toFixed(2)})` : ''}?`,
      );
      if (!confirmSettle) return;
    }

    setSettlingTable(tableNo);
    const tableOrders = tableGroups[tableNo].orders;

    try {
      // Sort by oldest first so we keep the first order id as the master
      const sortedOrders = [...tableOrders].sort(
        (a: any, b: any) => a.id - b.id,
      );
      const masterOrder = sortedOrders[0];
      const otherOrders = sortedOrders.slice(1);

      let combinedItems: any[] = [];
      let totalSubtotal = 0;
      let totalTax = 0;
      let existingOrderDiscount = 0;

      sortedOrders.forEach((o: any) => {
        let parsedItems = [];
        try {
          parsedItems =
            typeof o.items === "string" ? JSON.parse(o.items) : o.items || [];
        } catch (e) {}
        combinedItems = [...combinedItems, ...parsedItems];
        totalSubtotal += parseFloat(o.subtotal || 0);
        totalTax += parseFloat(o.tax || 0);
        existingOrderDiscount += parseFloat(o.discount || 0);
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
      const effectiveDiscount = appliedDiscount !== undefined ? appliedDiscount : existingOrderDiscount;
      const finalTotal = Math.max(0, totalSubtotal + totalTax - effectiveDiscount);

      const masterPayload = {
        payment_status: "paid",
        payment_method: paymentMethod,
        split_cash: splits?.cash || 0,
        split_upi: splits?.upi || 0,
        split_card: splits?.card || 0,
        order_status: "delivered",
        items: finalItems,
        subtotal: totalSubtotal,
        tax: totalTax,
        discount: effectiveDiscount,
        total_amount: finalTotal,
        invoice_printed: true,
      };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await saveOfflineOrder(`/api/orders/${masterOrder.id}`, "PUT", masterPayload);
        for (const o of otherOrders) {
          await saveOfflineOrder(`/api/orders/${o.id}?is_table_merge=true`, "DELETE", {});
        }

        const settledIds = new Set([masterOrder.id, ...otherOrders.map((o: any) => o.id)]);
        setOrders((prev) => {
          const next = prev.filter((o: any) => !settledIds.has(o.id));
          try {
            localStorage.setItem("cached_active_table_orders", JSON.stringify(next));
          } catch (e) {}
          return next;
        });

        handlePrintBill(tableNo, effectiveDiscount, paymentMethod, tableGroups[tableNo], splits);

        alert(`Table ${tableNo} settled offline! Will sync when back online.`);
        setShowModal(false);
        setSettleModal(null);
        setTableDiscount(0);
        return;
      }

      // Update Master Order with merged items and totals
      await fetch(`/api/orders/${masterOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(masterPayload),
      });

      // Delete the duplicate separated orders since they are now merged
      if (otherOrders.length > 0) {
        const deletePromises = otherOrders.map((o: any) =>
          fetch(`/api/orders/${o.id}?is_table_merge=true`, { method: "DELETE" }),
        );
        await Promise.all(deletePromises);
      }

      // Auto-print Master Bill on settlement
      handlePrintBill(tableNo, effectiveDiscount, paymentMethod, tableGroups[tableNo], splits);

      alert(`Table ${tableNo} settled successfully!`);
      setShowModal(false);
      setSettleModal(null);
      setTableDiscount(0);
      fetchActiveTableOrders();
    } catch (error) {
      console.warn("Error settling table on server, saving offline:", error);
      try {
        const sortedOrders = [...tableOrders].sort((a: any, b: any) => a.id - b.id);
        const masterOrder = sortedOrders[0];
        const otherOrders = sortedOrders.slice(1);
        await saveOfflineOrder(`/api/orders/${masterOrder.id}`, "PUT", {
          payment_status: "paid",
          payment_method: paymentMethod,
          order_status: "delivered",
          invoice_printed: true,
        });
        for (const o of otherOrders) {
          await saveOfflineOrder(`/api/orders/${o.id}?is_table_merge=true`, "DELETE", {});
        }
        const settledIds = new Set([masterOrder.id, ...otherOrders.map((o: any) => o.id)]);
        setOrders((prev) => {
          const next = prev.filter((o: any) => !settledIds.has(o.id));
          try {
            localStorage.setItem("cached_active_table_orders", JSON.stringify(next));
          } catch (e) {}
          return next;
        });
        alert(`নেটওয়ার্ক সমস্যার কারণে টেবিল ${tableNo} অফলাইনে সেটেল হয়েছে।`);
        setShowModal(false);
        setSettleModal(null);
        setTableDiscount(0);
      } catch (e) {
        alert("An error occurred while settling the table.");
      }
    } finally {
      setSettlingTable(null);
    }
  };

  const openSettleModal = (tableNo: string, defaultMethod: "cash" | "upi" | "split" = "cash") => {
    const group = tableGroups[tableNo];
    if (!group) return;
    const netBill = Math.max(0, group.total - tableDiscount);
    setSettleMethod(defaultMethod);
    if (defaultMethod === "cash") {
      setSettleCashAmount(netBill.toFixed(2));
      setSettleUpiAmount("0");
    } else if (defaultMethod === "upi") {
      setSettleCashAmount("0");
      setSettleUpiAmount(netBill.toFixed(2));
    } else {
      setSettleCashAmount((netBill / 2).toFixed(2));
      setSettleUpiAmount((netBill / 2).toFixed(2));
    }
    setSettleModal({
      tableNo,
      total: netBill,
      discount: tableDiscount,
    });
  };

  const handleConfirmSettle = async () => {
    if (!settleModal) return;
    const targetTable = settleModal.tableNo;
    const targetDiscount = settleModal.discount;
    const total = settleModal.total;

    if (settleMethod === "cash") {
      const cashVal = parseFloat(settleCashAmount) || 0;
      if (cashVal < total && total > 0) {
        const proceed = confirm(`Cash amount entered (₹${cashVal.toFixed(2)}) is less than total bill (₹${total.toFixed(2)}). Settle anyway?`);
        if (!proceed) return;
      }
      const splits = { cash: total, upi: 0, card: 0 };
      setSettleModal(null);
      await handleSettleTable(targetTable, "cash", splits, targetDiscount, true);
    } else if (settleMethod === "upi") {
      const upiVal = parseFloat(settleUpiAmount) || 0;
      if (upiVal < total && total > 0) {
        const proceed = confirm(`UPI amount entered (₹${upiVal.toFixed(2)}) is less than total bill (₹${total.toFixed(2)}). Settle anyway?`);
        if (!proceed) return;
      }
      const splits = { cash: 0, upi: total, card: 0 };
      setSettleModal(null);
      await handleSettleTable(targetTable, "upi", splits, targetDiscount, true);
    } else if (settleMethod === "split") {
      const c = parseFloat(settleCashAmount) || 0;
      const u = parseFloat(settleUpiAmount) || 0;
      if (Math.abs(c + u - total) > 0.05) {
        alert(`Split total (Cash: ₹${c.toFixed(2)} + UPI: ₹${u.toFixed(2)} = ₹${(c + u).toFixed(2)}) must equal Total Bill ₹${total.toFixed(2)}!`);
        return;
      }
      const splits = { cash: c, upi: u, card: 0 };
      setSettleModal(null);
      await handleSettleTable(targetTable, "split", splits, targetDiscount, true);
    }
  };

  // Print all KOTs for a table (one popup window per order)
  const handlePrintAllKOTs = async (tableNo: string) => {
    const group = tableGroups[tableNo];
    if (!group || group.orders.length === 0) return;

    for (const order of group.orders) {
      if (isTauri()) {
        try {
          const ok = await printOrderKOT(order, settings);
          if (ok) continue;
        } catch (tauriErr) {
          console.warn("Tauri silent KOT print failed:", tauriErr);
        }
      }

      const items = (() => {
        try {
          return typeof order.items === "string"
            ? JSON.parse(order.items)
            : order.items || [];
        } catch {
          return [];
        }
      })();

      const itemsHtml = items
        .map(
          (item: any) =>
            `<tr>
              <td style="padding:4px 0;">${item.menuItem?.name || "Item"}</td>
              <td style="text-align:center;padding:4px 0;">${item.quantity}</td>
            </tr>`,
        )
        .join("");

      const noteLine = order.notes
        ? `<div style="margin-top:8px;"><strong>Notes:</strong> ${order.notes}</div>`
        : "";

      const html = `<!DOCTYPE html><html><head><title>KOT - #${order.order_number || order.id}</title>
        <style>
          @page { margin: 0; }
          body { font-family: 'Courier New', Courier, monospace; width: 72mm; margin: 0 auto; padding: 10px; font-size: 16px; font-weight: bold; color: #000; background: #fff; }
          .center { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { border-bottom: 1px dashed #000; padding-bottom: 5px; text-align: left; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
        </style>
      </head><body>
        <div class="center" style="font-size:24px;font-weight:bold;">K.O.T</div>
        <div class="center divider"></div>
        <div>Order No: ${order.order_number || order.id || "N/A"}</div>
        <div>Table: ${order.table_number || tableNo}</div>
        <div>Date: ${new Date().toLocaleString()}</div>
        <table>
          <thead><tr><th>Item</th><th style="text-align:center;">Qty</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="divider"></div>
        ${noteLine}
        <div style="height:10px;"></div>
        <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
      </body></html>`;

      printHtmlSafely(html);
    }
  };

  // Save a kitchen note for a table (updates the latest order's notes field)
  const handleSaveNote = async (tableNo: string, note: string) => {
    const group = tableGroups[tableNo];
    if (!group || group.orders.length === 0) return;

    const targetOrder = [...group.orders].sort(
      (a: any, b: any) => b.id - a.id,
    )[0];

    try {
      const res = await fetch(`/api/orders/${targetOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: note }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Note saved for Table ${tableNo}`);
        fetchActiveTableOrders(true);
      } else {
        alert("Failed to save note.");
      }
    } catch (err) {
      console.error("Error saving note:", err);
      alert("Error saving note.");
    }
  };

  // Print Bill functionality - combining all orders for the table
  const handlePrintBill = (
    tableNo: string,
    discountOverride?: number,
    paymentMethod?: string,
    providedGroup?: any,
    splits?: any
  ) => {
    if (!settings) {
      alert("Settings not loaded yet.");
      return;
    }

    const group = providedGroup || tableGroups[tableNo];
    if (!group) return;

    const isThermal = settings.printerType === "thermal";
    const paperWidth = settings.paperWidth === "58mm" ? "58mm" : "80mm";
    const fontSize = settings.paperWidth === "58mm" ? "12px" : "14px";

    // Combine items from all orders
    let combinedItems: any[] = [];
    let totalSubtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

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

    const effectiveDiscount = discountOverride !== undefined ? discountOverride : totalDiscount;
    const grandTotal = Math.max(0, totalSubtotal + totalTax - effectiveDiscount);

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

    if (isTauri()) {
      try {
        const orderNumber = group.orders.map((o: any) => o.order_number || o.id).join(", ");
        const printableOrder = {
          order_number: orderNumber || `TBL-${tableNo}`,
          table_number: tableNo,
          items: finalItems,
          subtotal: totalSubtotal,
          discount: effectiveDiscount,
          tax: totalTax,
          total_amount: grandTotal,
          payment_method: paymentMethod || "UNPAID",
          created_at: new Date().toISOString(),
        };
        printOrderBill(printableOrder, settings).catch((err) => {
          console.warn("Tauri silent master bill print failed:", err);
        });
        return;
      } catch (tauriErr) {
        console.warn("Tauri silent print error:", tauriErr);
      }
    }

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
                    ${paymentMethod ? `<div class="bold" style="margin-top: 3px;">Payment: ${paymentMethod === 'split' ? `SPLIT (Cash: ₹${splits?.cash || 0}, UPI: ₹${splits?.upi || 0}${splits?.card ? `, Card: ₹${splits?.card}` : ''})` : paymentMethod.toUpperCase()} (PAID)</div>` : `<div style="margin-top: 3px; font-style: italic;">Status: DRAFT / UNPAID</div>`}
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
                        ${
                          effectiveDiscount > 0
                            ? `
                        <tr>
                            <td>Discount</td>
                            <td class="text-right">-Rs. ${effectiveDiscount.toFixed(2)}</td>
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

    printHtmlSafely(html);
  };

  // In-Page Keyboard Shortcuts for Active Tables & Settle Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // 1. If Auto Settle Modal is OPEN:
      if (settleModal) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setSettleModal(null);
          return;
        }

        // When not typing in an input, switch mode:
        if (!isInput) {
          if (e.key === '1' || e.key.toLowerCase() === 'c') {
            e.preventDefault();
            setSettleMethod('cash');
            setSettleCashAmount(settleModal.total.toFixed(2));
            setSettleUpiAmount('0');
            return;
          }
          if (e.key === '2' || e.key.toLowerCase() === 'u') {
            e.preventDefault();
            setSettleMethod('upi');
            setSettleCashAmount('0');
            setSettleUpiAmount(settleModal.total.toFixed(2));
            return;
          }
          if (e.key === '3') {
            e.preventDefault();
            setSettleMethod('split');
            return;
          }
          if (e.key.toLowerCase() === 'd') {
            e.preventDefault();
            handlePrintBill(settleModal.tableNo, settleModal.discount);
            return;
          }
        }

        // Enter key to Confirm Settle
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirmSettle();
          return;
        }
        return;
      }

      // 2. If Table Details Drawer (showModal) is OPEN:
      if (showModal && selectedTable) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowModal(false);
          return;
        }

        if (!isInput) {
          // 'Enter' or 'S' -> Open Settle Modal
          if (e.key === 'Enter' || e.key.toLowerCase() === 's') {
            e.preventDefault();
            openSettleModal(selectedTable, 'cash');
            return;
          }
          // 'P' -> Print Draft Bill
          if (e.key.toLowerCase() === 'p') {
            e.preventDefault();
            handlePrintBill(selectedTable, tableDiscount);
            return;
          }
          // 'N' -> New Order for this table
          if (e.key.toLowerCase() === 'n') {
            e.preventDefault();
            router.push('/admin/orders/create?table=' + encodeURIComponent(selectedTable));
            return;
          }
          // 'E' -> Edit Items
          if (e.key.toLowerCase() === 'e') {
            e.preventDefault();
            handleEditTableItems(selectedTable);
            return;
          }
          // 'K' -> Print All KOTs
          if (e.key.toLowerCase() === 'k') {
            e.preventDefault();
            handlePrintAllKOTs(selectedTable);
            return;
          }
        }
        return;
      }

      // 3. If on Tables Grid (no modal open and not typing):
      if (!isInput && !showModal && !settleModal && !noteModal && !editingTableItems) {
        // Quick Select Table by digit 1 to 9
        if (e.key >= '1' && e.key <= '9' && !e.altKey && !e.ctrlKey) {
          const tableNum = e.key;
          if (tableGroups[tableNum]) {
            e.preventDefault();
            const initialDiscount = (tableGroups[tableNum]?.orders || []).reduce(
              (sum: number, o: any) => sum + parseFloat(o.discount || 0),
              0,
            );
            setTableDiscount(initialDiscount);
            setSelectedTable(tableNum);
            setShowModal(true);
            return;
          }
        }

        // 'N' -> Create New Order
        if (e.key.toLowerCase() === 'n' && !e.altKey && !e.ctrlKey) {
          e.preventDefault();
          router.push('/admin/orders/create');
          return;
        }

        // 'R' -> Refresh Tables
        if (e.key.toLowerCase() === 'r' && !e.ctrlKey) {
          e.preventDefault();
          fetchActiveTableOrders();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showModal,
    selectedTable,
    settleModal,
    noteModal,
    editingTableItems,
    tableDiscount,
    tableGroups,
    settleMethod,
    settleCashAmount,
    settleUpiAmount,
  ]);

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

  // Generate table array [1, 2, 3, ..., totalTables]
  const tablesList = getTableList(settings);

  return (
    <main className="container" style={{ padding: "2rem 1.5rem" }}>
      <div className="fade-in">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "0.5rem" }}>Active Tables (Dine-in)</h1>
            <p className="text-muted">Manage table orders & billing</p>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-keyboard-shortcuts'))}
              className="btn btn-ghost"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontWeight: 600,
                border: "1px solid var(--border-color)",
                padding: "0.5rem 0.75rem",
              }}
              title="View all Keyboard Shortcuts (F1 / ?)"
            >
              <span>⌨️</span> Shortcuts <kbd className="kbd" style={{ fontSize: "0.7rem", marginLeft: "2px" }}>F1</kbd>
            </button>
            <Link
              href="/admin/orders"
              className="btn btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontWeight: 600,
                padding: "0.5rem 0.85rem",
              }}
              title="Go to Orders (Alt + O / F3)"
            >
              <span>📋</span> Orders <kbd className="kbd" style={{ fontSize: "0.7rem", marginLeft: "2px", background: "rgba(255,255,255,0.2)", color: "#fff" }}>Alt+O</kbd>
            </Link>
            {(!isCashier || isDesktop) && (
              <button
                type="button"
                onClick={() => setIsPrinterModalOpen(true)}
                className="btn btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}
                title="Configure Cashier & KOT Thermal Printers"
              >
                <span>🖨️</span> Printer Setup
              </button>
            )}
            <Link href="/admin/dashboard" className="btn btn-ghost">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        <div>
          {getGroupedTableList(settings).map((group, groupIdx) => {
            const theme = ZONE_COLORS[groupIdx % ZONE_COLORS.length];
            return (
              <div key={group.zone} style={{ marginBottom: "2rem" }}>
                <h3 style={{ marginBottom: "1rem", color: "var(--primary)" }}>
                  {group.zone}
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {group.tables.map((tableNo) => {
                    const isOccupied = !!tableGroups[tableNo];

                    return (
                      <button
                        key={tableNo}
                        onClick={() => {
                          if (isOccupied) {
                            const initialDiscount = (tableGroups[tableNo]?.orders || []).reduce(
                              (sum: number, o: any) => sum + parseFloat(o.discount || 0),
                              0,
                            );
                            setTableDiscount(initialDiscount);
                            setSelectedTable(tableNo);
                            setShowModal(true);
                          } else {
                            // Empty table clicked
                            alert(`Table ${tableNo} is currently empty.`);
                          }
                        }}
                        style={{
                          height: "100px",
                          borderRadius: "12px",
                          background: isOccupied ? theme.occupied : theme.empty,
                          border: isOccupied
                            ? "none"
                            : `1px solid ${theme.border}`,
                          color: isOccupied ? "white" : "var(--text-primary)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          cursor: "pointer",
                          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                          transition: "transform 0.2s",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.transform = "scale(1.05)")
                        }
                        onMouseOut={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")
                          }
                          onContextMenu={(e) => {
                            e.preventDefault();
                            const menuX = Math.min(e.clientX, window.innerWidth - 200);
                            const menuY = Math.min(e.clientY, window.innerHeight - 200);
                            setContextMenu({ x: menuX, y: menuY, tableNo, isOccupied });
                          }}
                          onTouchStart={(e) => {
                            const touch = e.touches[0];
                            longPressTimer.current = setTimeout(() => {
                              const menuX = Math.min(touch.clientX, window.innerWidth - 200);
                              const menuY = Math.min(touch.clientY, window.innerHeight - 200);
                              setContextMenu({ x: menuX, y: menuY, tableNo, isOccupied });
                            }, 600);
                          }}
                          onTouchEnd={() => {
                            if (longPressTimer.current) {
                              clearTimeout(longPressTimer.current);
                            }
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Right-Click / Long-Press Context Menu */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 99999,
            background: "var(--bg-secondary)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            minWidth: "160px",
            overflow: "hidden",
          }}
        >
          {/* Table Label */}
          <div style={{ padding: "0.5rem 1rem 0.4rem", fontSize: "0.75rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)", marginBottom: "0.3rem" }}>
            {contextMenu.tableNo}
          </div>

          {/* 1. New Order — always visible */}
          <button
            onClick={() => {
              setContextMenu(null);
              router.push("/admin/orders/create?table=" + encodeURIComponent(contextMenu.tableNo));
            }}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              width: "100%", padding: "0.6rem 1rem",
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-primary)", fontSize: "0.95rem", textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border-color)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            ➕ New Order
          </button>

          {/* 2. Edit Items */}
          <button
            onClick={() => {
              if (!contextMenu.isOccupied) return;
              setContextMenu(null);
              handleEditTableItems(contextMenu.tableNo);
            }}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              width: "100%", padding: "0.6rem 1rem",
              background: "none", border: "none",
              cursor: contextMenu.isOccupied ? "pointer" : "not-allowed",
              color: contextMenu.isOccupied ? "var(--text-primary)" : "var(--text-muted)",
              opacity: contextMenu.isOccupied ? 1 : 0.4,
              fontSize: "0.95rem", textAlign: "left",
            }}
            onMouseEnter={(e) => { if (contextMenu.isOccupied) e.currentTarget.style.background = "var(--border-color)"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            ✏️ Edit Items
          </button>

          {/* 3. Notes */}
          <button
            onClick={() => {
              if (!contextMenu.isOccupied) return;
              const tableNo = contextMenu.tableNo;
              const currentNote = tableGroups[tableNo]?.orders?.[0]?.notes || "";
              setNoteText(currentNote);
              setNoteModal({ tableNo });
              setContextMenu(null);
            }}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              width: "100%", padding: "0.6rem 1rem",
              background: "none", border: "none",
              cursor: contextMenu.isOccupied ? "pointer" : "not-allowed",
              color: contextMenu.isOccupied ? "var(--text-primary)" : "var(--text-muted)",
              opacity: contextMenu.isOccupied ? 1 : 0.4,
              fontSize: "0.95rem", textAlign: "left",
            }}
            onMouseEnter={(e) => { if (contextMenu.isOccupied) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            📝 Notes
          </button>

          {/* 4. Print All KOTs */}
          <button
            onClick={() => {
              if (!contextMenu.isOccupied) return;
              setContextMenu(null);
              handlePrintAllKOTs(contextMenu.tableNo);
            }}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              width: "100%", padding: "0.6rem 1rem",
              background: "none", border: "none",
              cursor: contextMenu.isOccupied ? "pointer" : "not-allowed",
              color: contextMenu.isOccupied ? "var(--text-primary)" : "var(--text-muted)",
              opacity: contextMenu.isOccupied ? 1 : 0.4,
              fontSize: "0.95rem", textAlign: "left",
            }}
            onMouseEnter={(e) => { if (contextMenu.isOccupied) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            🖨️ Print All KOTs
          </button>

          {/* 5. Settle Table — only occupied */}
          <button
            onClick={() => {
              if (!contextMenu.isOccupied) return;
              const initialDiscount = (tableGroups[contextMenu.tableNo]?.orders || []).reduce(
                (sum: number, o: any) => sum + parseFloat(o.discount || 0),
                0,
              );
              setTableDiscount(initialDiscount);
              setContextMenu(null);
              setSelectedTable(contextMenu.tableNo);
              setShowModal(true);
            }}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              width: "100%", padding: "0.6rem 1rem",
              background: "none", border: "none",
              cursor: contextMenu.isOccupied ? "pointer" : "not-allowed",
              color: contextMenu.isOccupied ? "var(--text-primary)" : "var(--text-muted)",
              opacity: contextMenu.isOccupied ? 1 : 0.4,
              fontSize: "0.95rem", textAlign: "left",
            }}
            onMouseEnter={(e) => { if (contextMenu.isOccupied) e.currentTarget.style.background = "var(--border-color)"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            🔀 Settle Table
          </button>

          {/* 6. Master Bill */}
          <button
            onClick={() => {
              if (!contextMenu.isOccupied) return;
              setContextMenu(null);
              handlePrintBill(contextMenu.tableNo);
            }}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              width: "100%", padding: "0.6rem 1rem",
              background: "none", border: "none",
              cursor: contextMenu.isOccupied ? "pointer" : "not-allowed",
              color: contextMenu.isOccupied ? "var(--text-primary)" : "var(--text-muted)",
              opacity: contextMenu.isOccupied ? 1 : 0.4,
              fontSize: "0.95rem", textAlign: "left",
            }}
            onMouseEnter={(e) => { if (contextMenu.isOccupied) e.currentTarget.style.background = "var(--border-color)"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            🧾 Master Bill
          </button>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div
          onClick={() => setNoteModal(null)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", zIndex: 99998,
            display: "flex", justifyContent: "center", alignItems: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fade-in"
            style={{
              width: "100%", maxWidth: "400px",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1.5rem",
            }}
          >
            <h3 style={{ margin: "0 0 0.25rem 0", color: "var(--primary)" }}>
              ✏️ Add Note
            </h3>
            <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Table {noteModal.tableNo} — Note will appear on KOT
            </p>
            <textarea
              autoFocus
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. No spice, Allergy: nuts, Extra napkins..."
              rows={4}
              style={{
                width: "100%", padding: "0.75rem",
                borderRadius: "8px", border: "1px solid var(--border-color)",
                background: "var(--glass-bg)", color: "var(--text-primary)",
                fontSize: "0.95rem", resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button
                onClick={() => setNoteModal(null)}
                className="btn btn-ghost"
                style={{ flex: 1, border: "1px solid var(--border-color)" }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleSaveNote(noteModal.tableNo, noteText);
                  setNoteModal(null);
                  setNoteText("");
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Table Details */}
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
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
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
                ✕
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
                    background: "var(--glass-bg)",
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
                borderTop: "2px dashed var(--border-color)",
                paddingTop: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
                  Bill Subtotal & Taxes
                </span>
                <span style={{ fontSize: "1rem", fontWeight: 600 }}>
                  ₹{tableGroups[selectedTable].total.toFixed(2)}
                </span>
              </div>

              {/* Discount Input */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem",
                  padding: "0.5rem",
                  background: "var(--glass-bg)",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--primary)" }}>
                  🎁 Discount (₹):
                </span>
                <input
                  type="number"
                  className="input"
                  style={{ width: "120px", textAlign: "right", padding: "0.35rem 0.5rem", fontSize: "0.95rem" }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={tableDiscount || ""}
                  onChange={(e) => setTableDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.25rem",
                  paddingTop: "0.5rem",
                  borderTop: "1px dashed var(--border-color)",
                }}
              >
                <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                  Master Bill Total
                </span>
                <span
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 700,
                    color: "var(--primary)",
                  }}
                >
                  ₹{Math.max(0, tableGroups[selectedTable].total - tableDiscount).toFixed(2)}
                </span>
              </div>

              {/* Primary Auto Settle Button */}
              <button
                onClick={() => openSettleModal(selectedTable, "cash")}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  marginBottom: "0.75rem",
                  padding: "0.85rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                <span>⚡ Auto Settle & Print Master Bill</span>
                <kbd className="kbd" style={{ marginLeft: "4px", fontSize: "0.75rem", background: "rgba(255,255,255,0.25)", color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>Enter / S</kbd>
              </button>

              {/* Quick Payment Mode Buttons */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <button
                  onClick={() => openSettleModal(selectedTable, "cash")}
                  disabled={settlingTable === selectedTable}
                  className="btn btn-ghost"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25rem",
                    padding: "0.6rem 0.4rem",
                    border: "1px solid var(--border-color)",
                    fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>💵</span>
                  <span>Cash</span>
                  <kbd className="kbd" style={{ fontSize: "0.65rem" }}>1</kbd>
                </button>
                <button
                  onClick={() => openSettleModal(selectedTable, "upi")}
                  disabled={settlingTable === selectedTable}
                  className="btn btn-ghost"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25rem",
                    padding: "0.6rem 0.4rem",
                    border: "1px solid var(--border-color)",
                    fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>📱</span>
                  <span>UPI</span>
                  <kbd className="kbd" style={{ fontSize: "0.65rem" }}>2</kbd>
                </button>
                <button
                  onClick={() => openSettleModal(selectedTable, "split")}
                  disabled={settlingTable === selectedTable}
                  className="btn btn-ghost"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25rem",
                    padding: "0.6rem 0.4rem",
                    border: "1px solid var(--border-color)",
                    fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: "1.1rem" }}>✂️</span>
                  <span>Split</span>
                  <kbd className="kbd" style={{ fontSize: "0.65rem" }}>3</kbd>
                </button>
              </div>

              {/* Print Draft Bill Button */}
              <button
                onClick={() => handlePrintBill(selectedTable, tableDiscount)}
                className="btn btn-ghost"
                style={{
                  width: "100%",
                  border: "1px dashed var(--border-color)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                  padding: "0.5rem",
                  color: "var(--text-muted)",
                }}
              >
                <span>🖨️ Print Draft Bill (Keep Table Open)</span>
                <kbd className="kbd" style={{ marginLeft: "4px", fontSize: "0.7rem" }}>P</kbd>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Items Modal */}
      {editingTableItems && (
        <div className="modal-overlay" onClick={() => setEditingTableItems(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Items - Table {editingTableItems.tableNo}</h2>
            </div>
            <div className="modal-body">
              {editingTableItems.items.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.menuItem.name}</div>
                    <div className="text-muted">₹{Number(item.menuItem.price).toFixed(2)} x {item.quantity} = ₹{(Number(item.menuItem.price) * item.quantity).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-ghost" 
                      style={{ padding: '0.25rem 0.5rem', minWidth: '32px' }}
                      onClick={() => {
                        const newItems = [...editingTableItems.items];
                        if (newItems[idx].quantity > 1) {
                          newItems[idx].quantity -= 1;
                        } else {
                          newItems.splice(idx, 1);
                        }
                        setEditingTableItems({ ...editingTableItems, items: newItems });
                      }}
                    >
                      -
                    </button>
                    <span style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button 
                      className="btn btn-ghost"
                      style={{ padding: '0.25rem 0.5rem', minWidth: '32px' }}
                      onClick={() => {
                        const newItems = [...editingTableItems.items];
                        newItems[idx].quantity += 1;
                        setEditingTableItems({ ...editingTableItems, items: newItems });
                      }}
                    >
                      +
                    </button>
                    <button 
                      className="btn btn-error"
                      style={{ padding: '0.25rem 0.5rem', marginLeft: '0.5rem' }}
                      onClick={() => {
                        const newItems = [...editingTableItems.items];
                        newItems.splice(idx, 1);
                        setEditingTableItems({ ...editingTableItems, items: newItems });
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              
              {editingTableItems.items.length === 0 && (
                <div className="text-center text-muted" style={{ padding: '2rem' }}>
                  No items left for this table. (Saving will clear the items, consider cancelling the order instead).
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditingTableItems(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveTableItems}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Settle Modal (Cash / UPI / Split) */}
      {settleModal && (
        <div className="modal-overlay" onClick={() => setSettleModal(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px", width: "95%" }}
          >
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                  ⚡ Settle Table {settleModal.tableNo}
                </h2>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Select payment mode, enter amount and save
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSettleModal(null)}
                style={{ padding: "0.3rem 0.6rem", fontSize: "1.1rem" }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: "1.25rem" }}>
              {/* Total Bill Card */}
              <div
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                    Master Bill Total
                  </div>
                  {settleModal.discount > 0 && (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      Discount: ₹{settleModal.discount.toFixed(2)} applied
                    </div>
                  )}
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary)" }}>
                  ₹{settleModal.total.toFixed(2)}
                </div>
              </div>

              {/* 3 Payment Mode Buttons: Cash / UPI / Split */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "0.5rem",
                  marginBottom: "1.25rem",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSettleMethod("cash");
                    setSettleCashAmount(settleModal.total.toFixed(2));
                    setSettleUpiAmount("0");
                  }}
                  className={`btn ${settleMethod === "cash" ? "btn-primary" : "btn-ghost"}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.75rem 0.5rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    border: settleMethod === "cash" ? "2px solid #10b981" : "1px solid var(--border-color)",
                    background: settleMethod === "cash" ? "rgba(16, 185, 129, 0.15)" : "var(--glass-bg)",
                    color: settleMethod === "cash" ? "#10b981" : "var(--text-primary)",
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>💵</span>
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSettleMethod("upi");
                    setSettleCashAmount("0");
                    setSettleUpiAmount(settleModal.total.toFixed(2));
                  }}
                  className={`btn ${settleMethod === "upi" ? "btn-secondary" : "btn-ghost"}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.75rem 0.5rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    border: settleMethod === "upi" ? "2px solid #3b82f6" : "1px solid var(--border-color)",
                    background: settleMethod === "upi" ? "rgba(59, 130, 246, 0.15)" : "var(--glass-bg)",
                    color: settleMethod === "upi" ? "#3b82f6" : "var(--text-primary)",
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>📱</span>
                  <span>UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSettleMethod("split");
                    const c = parseFloat(settleCashAmount) || 0;
                    const u = parseFloat(settleUpiAmount) || 0;
                    if (Math.abs(c + u - settleModal.total) > 0.05) {
                      setSettleCashAmount((settleModal.total / 2).toFixed(2));
                      setSettleUpiAmount((settleModal.total / 2).toFixed(2));
                    }
                  }}
                  className={`btn ${settleMethod === "split" ? "btn-warning" : "btn-ghost"}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.75rem 0.5rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    border: settleMethod === "split" ? "2px solid #f59e0b" : "1px solid var(--border-color)",
                    background: settleMethod === "split" ? "rgba(245, 158, 11, 0.15)" : "var(--glass-bg)",
                    color: settleMethod === "split" ? "#f59e0b" : "var(--text-primary)",
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>✂️</span>
                  <span>Split</span>
                </button>
              </div>

              {/* Amount Inputs for User */}
              {settleMethod === "cash" && (
                <div>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600, fontSize: "0.9rem" }}>
                    💵 Cash Amount Received (₹):
                  </label>
                  <div style={{ position: "relative", marginBottom: "0.5rem" }}>
                    <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "var(--text-muted)" }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={settleCashAmount}
                      onChange={(e) => setSettleCashAmount(e.target.value)}
                      style={{
                        width: "100%",
                        paddingLeft: "2rem",
                        paddingRight: "0.75rem",
                        paddingTop: "0.6rem",
                        paddingBottom: "0.6rem",
                        fontSize: "1.15rem",
                        fontWeight: 700,
                      }}
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>

                  {/* Quick Tender Suggestions */}
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.85rem" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", border: "1px solid var(--border-color)" }}
                      onClick={() => setSettleCashAmount(settleModal.total.toFixed(2))}
                    >
                      Exact (₹{settleModal.total.toFixed(2)})
                    </button>
                    {settleModal.total < 500 && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", border: "1px solid var(--border-color)" }}
                        onClick={() => setSettleCashAmount("500")}
                      >
                        ₹500
                      </button>
                    )}
                    {settleModal.total < 1000 && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", border: "1px solid var(--border-color)" }}
                        onClick={() => setSettleCashAmount("1000")}
                      >
                        ₹1000
                      </button>
                    )}
                  </div>

                  {/* Change or Due Indicator */}
                  {(() => {
                    const c = parseFloat(settleCashAmount) || 0;
                    if (c >= settleModal.total && settleModal.total > 0) {
                      const change = c - settleModal.total;
                      return (
                        <div
                          style={{
                            background: "rgba(16, 185, 129, 0.12)",
                            border: "1px solid #10b981",
                            color: "#10b981",
                            borderRadius: "8px",
                            padding: "0.6rem 0.85rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "0.95rem",
                            fontWeight: 700,
                          }}
                        >
                          <span>🪙 Return Change (ফেরত):</span>
                          <span>₹{change.toFixed(2)}</span>
                        </div>
                      );
                    } else if (c < settleModal.total) {
                      return (
                        <div
                          style={{
                            background: "rgba(239, 68, 68, 0.12)",
                            border: "1px solid #ef4444",
                            color: "#ef4444",
                            borderRadius: "8px",
                            padding: "0.6rem 0.85rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                          }}
                        >
                          <span>⚠️ Due Amount:</span>
                          <span>₹{(settleModal.total - c).toFixed(2)}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {settleMethod === "upi" && (
                <div>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600, fontSize: "0.9rem" }}>
                    📱 UPI Amount (₹):
                  </label>
                  <div style={{ position: "relative", marginBottom: "0.5rem" }}>
                    <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "var(--text-muted)" }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={settleUpiAmount}
                      onChange={(e) => setSettleUpiAmount(e.target.value)}
                      style={{
                        width: "100%",
                        paddingLeft: "2rem",
                        paddingRight: "0.75rem",
                        paddingTop: "0.6rem",
                        paddingBottom: "0.6rem",
                        fontSize: "1.15rem",
                        fontWeight: 700,
                      }}
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.85rem" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem", border: "1px solid var(--border-color)" }}
                      onClick={() => setSettleUpiAmount(settleModal.total.toFixed(2))}
                    >
                      Exact (₹{settleModal.total.toFixed(2)})
                    </button>
                  </div>
                </div>
              )}

              {settleMethod === "split" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                        <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>💵 Cash (₹)</label>
                        <button
                          type="button"
                          onClick={() => {
                            const u = parseFloat(settleUpiAmount) || 0;
                            setSettleCashAmount(Math.max(0, settleModal.total - u).toFixed(2));
                          }}
                          style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.7rem", cursor: "pointer", textDecoration: "underline" }}
                        >
                          Auto Rest
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={settleCashAmount}
                        onChange={(e) => setSettleCashAmount(e.target.value)}
                        style={{ width: "100%", padding: "0.55rem", fontSize: "1rem", fontWeight: 700 }}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                        <label style={{ fontWeight: 600, fontSize: "0.85rem" }}>📱 UPI (₹)</label>
                        <button
                          type="button"
                          onClick={() => {
                            const c = parseFloat(settleCashAmount) || 0;
                            setSettleUpiAmount(Math.max(0, settleModal.total - c).toFixed(2));
                          }}
                          style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "0.7rem", cursor: "pointer", textDecoration: "underline" }}
                        >
                          Auto Rest
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={settleUpiAmount}
                        onChange={(e) => setSettleUpiAmount(e.target.value)}
                        style={{ width: "100%", padding: "0.55rem", fontSize: "1rem", fontWeight: 700 }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", border: "1px solid var(--border-color)" }}
                      onClick={() => {
                        const half = (settleModal.total / 2).toFixed(2);
                        setSettleCashAmount(half);
                        setSettleUpiAmount(half);
                      }}
                    >
                      50% / 50%
                    </button>
                  </div>

                  {/* Split Validation Box */}
                  {(() => {
                    const c = parseFloat(settleCashAmount) || 0;
                    const u = parseFloat(settleUpiAmount) || 0;
                    const sum = c + u;
                    const diff = settleModal.total - sum;
                    const isMatched = Math.abs(diff) < 0.05;

                    return (
                      <div
                        style={{
                          padding: "0.6rem 0.85rem",
                          borderRadius: "8px",
                          background: isMatched ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                          border: `1px solid ${isMatched ? "#10b981" : "#ef4444"}`,
                          color: isMatched ? "#10b981" : "#ef4444",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>
                          Sum: ₹{sum.toFixed(2)} / Total: ₹{settleModal.total.toFixed(2)}
                        </span>
                        <span>
                          {isMatched ? "✓ Exact Match" : `Diff: ${diff > 0 ? "+" : ""}₹${diff.toFixed(2)}`}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setSettleModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  title="Print draft check without closing the table"
                  style={{ border: "1px solid var(--border-color)", fontSize: "0.85rem" }}
                  onClick={() => handlePrintBill(settleModal.tableNo, settleModal.discount)}
                >
                  🖨️ Draft Bill
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  settlingTable === settleModal.tableNo ||
                  (settleMethod === "split" && Math.abs((parseFloat(settleCashAmount) || 0) + (parseFloat(settleUpiAmount) || 0) - settleModal.total) > 0.05)
                }
                onClick={handleConfirmSettle}
                style={{
                  fontWeight: 700,
                  padding: "0.6rem 1.2rem",
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                {settlingTable === settleModal.tableNo ? "Settling..." : "💾 Save & Print Bill"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PrinterConfigModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
      />
    </main>
  );
}
