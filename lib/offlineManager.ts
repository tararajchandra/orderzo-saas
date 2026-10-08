import localforage from "localforage";
import { sortOrdersDesc, getLocalDateStr } from "@/lib/utils";
import { isTauri, saveLocalOrder, markOrderSynced } from "@/lib/tauriBridge";

// Configure localforage
localforage.config({
  name: "OrderZoPOS",
  storeName: "offline_orders", // Should be alphanumeric, with underscores.
  description: "Stores orders locally when offline",
});

export interface OfflineOrder {
  id: string; // unique local id
  url: string; // The API endpoint (e.g. /api/orders)
  method: string;
  body: any;
  timestamp: number;
  status: "pending" | "syncing" | "failed";
  origin_server?: string; // Origin server URL where this offline order was created
}

// Get normalized current active server origin for strict environment isolation
export const getCurrentServerOrigin = (): string => {
  if (typeof window === "undefined") return "";
  try {
    const tauriUrl = localStorage.getItem("tauri_server_url");
    if (tauriUrl && tauriUrl.trim()) {
      return tauriUrl.trim().replace(/\/+$/, "");
    }
    return (window.location.origin || "").trim().replace(/\/+$/, "");
  } catch {
    return "";
  }
};

// Generate conflict-free offline order number based on salesman/device prefix
export const generateOfflineOrderNumber = (prefix: string = "POS"): string => {
  const cleanPrefix = (prefix || "POS").trim().toUpperCase();
  const dateStr = getLocalDateStr(new Date());
  const seqKey = `offline_seq_${cleanPrefix}_${dateStr}`;
  let maxSeq = 0;
  try {
    maxSeq = parseInt(localStorage.getItem(seqKey) || "0", 10);
  } catch (e) {}

  // Check cached_admin_orders to find the highest existing sequence number for today
  try {
    const cached = localStorage.getItem("cached_admin_orders");
    if (cached) {
      const list: any[] = JSON.parse(cached);
      const pattern = `${cleanPrefix}-${dateStr}-`;
      for (const o of list) {
        const num = String(o.order_number || "");
        if (num.startsWith(pattern)) {
          const seq = parseInt(num.replace(pattern, ""), 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    }
  } catch (e) {}

  const nextSeq = maxSeq + 1;
  try {
    localStorage.setItem(seqKey, String(nextSeq));
  } catch (e) {}
  return `${cleanPrefix}-${dateStr}-${String(nextSeq).padStart(3, "0")}`;
};

// Save or update an order locally when offline
export const saveOfflineOrder = async (
  url: string,
  method: string,
  body: any
) => {
  try {
    const timestamp = Date.now();
    const cleanMethod = (method || "POST").toUpperCase();
    const existingOrders: OfflineOrder[] =
      (await localforage.getItem("pending_orders")) || [];

    // Target order key (e.g., from /api/orders/POS-20261008-001 or body.order_number / body.id)
    const targetKeyFromUrl = url.replace(/^\/api\/orders\/?/, "").trim();
    const targetKey = String(
      body?.order_number || body?.id || targetKeyFromUrl || ""
    ).trim();

    // 1. DELETE handling
    if (cleanMethod === "DELETE") {
      const postIndex = existingOrders.findIndex(
        (o) =>
          o.method === "POST" &&
          (String(o.body?.order_number || o.body?.id || o.id) === targetKey ||
            o.url === url)
      );

      if (postIndex !== -1) {
        // Pending order has not reached the server yet; remove it completely
        existingOrders.splice(postIndex, 1);
        await localforage.setItem("pending_orders", existingOrders);
      } else {
        // It's a server order, record the DELETE action for sync
        existingOrders.push({
          id: `offline_del_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
          url,
          method: "DELETE",
          body: body || {},
          timestamp,
          status: "pending",
          origin_server: getCurrentServerOrigin(),
        });
        await localforage.setItem("pending_orders", existingOrders);
      }

      // Remove from cached_admin_orders
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem("cached_admin_orders");
          if (cached) {
            const list: any[] = JSON.parse(cached);
            const filtered = list.filter(
              (o: any) =>
                String(o.order_number || o.id) !== targetKey &&
                String(o.id) !== targetKeyFromUrl
            );
            localStorage.setItem("cached_admin_orders", JSON.stringify(filtered));
          }
        } catch (e) {}
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("offline-orders-updated"));
      }
      if (typeof navigator !== "undefined" && navigator.onLine) {
        syncOfflineOrders().catch(() => {});
      }
      return null;
    }

    // 2. PUT (Edit / Update) handling
    if (cleanMethod === "PUT") {
      // Check if this targets a pending order already in local queue
      const existingPendingIndex = existingOrders.findIndex(
        (o) =>
          String(o.body?.order_number || "") === targetKey ||
          String(o.body?.id || "") === targetKey ||
          String(o.id || "") === targetKey ||
          (targetKeyFromUrl && (
            String(o.body?.order_number || "") === targetKeyFromUrl ||
            String(o.body?.id || "") === targetKeyFromUrl ||
            o.url === `/api/orders/${targetKeyFromUrl}`
          ))
      );

      if (existingPendingIndex !== -1) {
        // Order is still pending in local queue -> merge directly into it!
        const targetOrder = existingOrders[existingPendingIndex];
        const preservedCreatedAt =
          targetOrder.body?.created_at ||
          body?.created_at ||
          new Date(targetOrder.timestamp || timestamp).toISOString();

        existingOrders[existingPendingIndex] = {
          ...targetOrder,
          body: {
            ...targetOrder.body,
            ...body,
            created_at: preservedCreatedAt,
            order_number:
              targetOrder.body?.order_number || body?.order_number || targetKey,
            id: targetOrder.body?.id || body?.id || targetKey,
            is_offline: true,
          },
          // Keep original order creation timestamp so fallback sorting does not change!
          timestamp: targetOrder.timestamp || timestamp,
        };
        await localforage.setItem("pending_orders", existingOrders);
      } else {
        // Order exists on server and was fetched previously -> record PUT action
        const putIndex = existingOrders.findIndex(
          (o) =>
            o.method === "PUT" &&
            (o.url === url ||
              (targetKey && o.url === `/api/orders/${targetKey}`) ||
              (targetKeyFromUrl && o.url === `/api/orders/${targetKeyFromUrl}`))
        );

        if (putIndex !== -1) {
          existingOrders[putIndex].body = {
            ...existingOrders[putIndex].body,
            ...body,
            created_at: existingOrders[putIndex].body?.created_at || body?.created_at,
          };
          if (!existingOrders[putIndex].origin_server) {
            existingOrders[putIndex].origin_server = getCurrentServerOrigin();
          }
        } else {
          existingOrders.push({
            id: `offline_put_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            url,
            method: "PUT",
            body: {
              ...body,
              id: body?.id || targetKey,
              order_number: body?.order_number || targetKey,
              created_at: body?.created_at,
              is_offline: true,
            },
            timestamp,
            status: "pending",
            origin_server: getCurrentServerOrigin(),
          });
        }
        await localforage.setItem("pending_orders", existingOrders);
      }

      // Update cached_admin_orders in place without adding a new duplicate entry
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem("cached_admin_orders");
          if (cached) {
            const list: any[] = JSON.parse(cached);
            const updated = list.map((item: any) => {
              if (
                String(item.order_number || "") === targetKey ||
                String(item.id || "") === targetKey ||
                (targetKeyFromUrl && (
                  String(item.order_number || "") === targetKeyFromUrl ||
                  String(item.id || "") === targetKeyFromUrl
                ))
              ) {
                return {
                  ...item,
                  ...body,
                  created_at: item.created_at || body?.created_at,
                  is_offline: true,
                };
              }
              return item;
            });
            updated.sort(sortOrdersDesc);
            localStorage.setItem(
              "cached_admin_orders",
              JSON.stringify(updated.slice(0, 100))
            );
          }
        } catch (e) {}
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("offline-orders-updated"));
      }
      if (typeof navigator !== "undefined" && navigator.onLine) {
        syncOfflineOrders().catch(() => {});
      }
      return null;
    }

    // 3. POST (New Order) handling
    const orderCreatedAt =
      body?.created_at || new Date(timestamp).toISOString();
    const orderNum = String(body?.order_number || body?.id || "").trim();

    const updatedBody = {
      ...body,
      created_at: orderCreatedAt,
      is_offline: true,
    };

    const existingIndex = orderNum
      ? existingOrders.findIndex(
          (o) =>
            o.method === "POST" &&
            String(o.body?.order_number || o.body?.id) === orderNum
        )
      : -1;

    const currentOrigin = getCurrentServerOrigin();
    let offlineOrder: OfflineOrder;
    if (existingIndex !== -1) {
      existingOrders[existingIndex].body = updatedBody;
      existingOrders[existingIndex].timestamp = timestamp;
      if (!existingOrders[existingIndex].origin_server) {
        existingOrders[existingIndex].origin_server = currentOrigin;
      }
      offlineOrder = existingOrders[existingIndex];
    } else {
      offlineOrder = {
        id: `offline_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        url,
        method: "POST",
        body: updatedBody,
        timestamp,
        status: "pending",
        origin_server: currentOrigin,
      };
      existingOrders.push(offlineOrder);
    }
    await localforage.setItem("pending_orders", existingOrders);

    // Immediately cache in cached_admin_orders for instant display on orders & dashboard
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_admin_orders");
        const list: any[] = cached ? JSON.parse(cached) : [];
        const orderEntry = {
          ...updatedBody,
          id: updatedBody.id || updatedBody.order_number || offlineOrder.id,
          order_number:
            updatedBody.order_number || updatedBody.id || offlineOrder.id,
          created_at: orderCreatedAt,
          is_offline: true,
        };
        const filtered = list.filter(
          (o: any) =>
            String(o.order_number || o.id) !==
            String(orderEntry.order_number || orderEntry.id)
        );
        filtered.unshift(orderEntry);
        filtered.sort(sortOrdersDesc);
        localStorage.setItem(
          "cached_admin_orders",
          JSON.stringify(filtered.slice(0, 100))
        );
      } catch (e) {}
    }

    // Mirror to Tauri SQLite if running in desktop POS
    if (isTauri()) {
      saveLocalOrder(updatedBody, currentOrigin).catch((e) =>
        console.warn("[OfflineManager] Tauri SQLite save error:", e)
      );
    }

    // Broadcast offline order added event for instant UI updates across the app
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("offline-orders-updated"));
      window.dispatchEvent(
        new CustomEvent("offline-order-added", { detail: offlineOrder })
      );
    }

    // If online, immediately trigger auto background sync so there's 0 delay
    if (typeof navigator !== "undefined" && navigator.onLine) {
      syncOfflineOrders().catch((e) =>
        console.warn("[OfflineManager] Immediate auto-sync error:", e)
      );
    }

    return offlineOrder;
  } catch (error) {
    console.error("Error saving offline order:", error);
    throw error;
  }
};

// Retrieve offline orders, optionally filtered by active server environment
export const getOfflineOrders = async (currentServerOnly: boolean = false): Promise<OfflineOrder[]> => {
  try {
    const list: OfflineOrder[] = (await localforage.getItem("pending_orders")) || [];
    if (!currentServerOnly) return list;
    const currentOrigin = getCurrentServerOrigin();
    return list.filter((o) => {
      if (!o.origin_server) return true; // Legacy orders
      return o.origin_server.toLowerCase() === currentOrigin.toLowerCase();
    });
  } catch (error) {
    console.error("Error getting offline orders:", error);
    return [];
  }
};

// Remove a synced order from local storage
export const removeOfflineOrder = async (orderId: string) => {
  try {
    const existingOrders: OfflineOrder[] =
      (await localforage.getItem("pending_orders")) || [];
    const updatedOrders = existingOrders.filter((o) => o.id !== orderId);
    await localforage.setItem("pending_orders", updatedOrders);
  } catch (error) {
    console.error("Error removing offline order:", error);
  }
};

// Concurrency lock to prevent concurrent sync operations
let isSyncing = false;

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  remaining: number;
}

// Sync pending orders strictly to their matching server environment
export const syncOfflineOrders = async (): Promise<SyncResult> => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const list = await getOfflineOrders(true);
    return { total: list.length, synced: 0, failed: 0, remaining: list.length };
  }
  if (isSyncing) {
    console.log("[AutoSync] Sync already in progress, skipping duplicate call.");
    const list = await getOfflineOrders(true);
    return { total: list.length, synced: 0, failed: 0, remaining: list.length };
  }
  isSyncing = true;

  let syncedCount = 0;
  let failedCount = 0;
  let totalCount = 0;

  try {
    const currentOrigin = getCurrentServerOrigin();
    // STRICT DATA ISOLATION: Only sync orders belonging to the active server environment!
    // Orders created on Demo server will NEVER sync to Live server, and vice versa!
    const pendingOrders = await getOfflineOrders(true);
    totalCount = pendingOrders.length;
    if (totalCount === 0) {
      return { total: 0, synced: 0, failed: 0, remaining: 0 };
    }

    console.log(`[AutoSync] Attempting to background sync ${totalCount} offline orders to ${currentOrigin || 'current host'}...`);

    for (const order of pendingOrders) {
      try {
        let syncUrl = order.url;
        if (syncUrl.startsWith("/") && currentOrigin && currentOrigin.startsWith("http")) {
          syncUrl = `${currentOrigin}${syncUrl}`;
        }
        const response = await fetch(syncUrl, {
          method: order.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order.body),
        });

        let data: any = null;
        try {
          data = await response.json();
        } catch {
          // Response is non-JSON (e.g., gateway 502/504)
        }

        const isSuccess =
          (response.ok && data?.success !== false) ||
          response.status === 404 ||
          response.status === 409;

        if (isSuccess) {
          syncedCount++;
          console.log(`[AutoSync] Synced offline order ${order.id} successfully.`);
          await removeOfflineOrder(order.id);

          // If running in Tauri Desktop app, mark synced in SQLite
          if (isTauri()) {
            const orderNum = String(order.body?.order_number || order.body?.id || order.id);
            markOrderSynced(orderNum, data?.data?.id ? String(data.data.id) : undefined).catch(() => {});
          }

          // Update cached_admin_orders to mark synced
          if (typeof window !== "undefined") {
            try {
              const cached = localStorage.getItem("cached_admin_orders");
              if (cached) {
                const list: any[] = JSON.parse(cached);
                const targetKey = String(
                  order.body?.order_number || order.body?.id || order.id
                );
                const updated = list.map((item: any) => {
                  if (String(item.order_number || item.id) === targetKey) {
                    return {
                      ...item,
                      ...(data?.data || {}),
                      is_offline: false,
                    };
                  }
                  return item;
                });
                updated.sort(sortOrdersDesc);
                localStorage.setItem(
                  "cached_admin_orders",
                  JSON.stringify(updated.slice(0, 100))
                );
              }
            } catch (e) {}
          }
        } else if (
          response.status === 400 ||
          (data &&
            data.error &&
            (data.error.includes("already exists") ||
              data.error.includes("Invalid input")))
        ) {
          // Unrecoverable validation error, remove so sync is not stuck forever
          console.warn(
            `[AutoSync] Unrecoverable sync error for order ${order.id}, removing:`,
            data
          );
          await removeOfflineOrder(order.id);
          failedCount++;
        } else {
          console.warn(`[AutoSync] Temporary failure syncing order ${order.id}:`, data);
          failedCount++;
          // If server returns server error (500+), abort loop to avoid hammering server
          if (response.status >= 500) {
            break;
          }
        }
      } catch (error) {
        console.error(`[AutoSync] Network error syncing order ${order.id}:`, error);
        failedCount++;
        // Stop syncing further orders if network drops midway
        break;
      }
    }

    const remainingOrders = await getOfflineOrders(true);
    const result: SyncResult = {
      total: totalCount,
      synced: syncedCount,
      failed: failedCount,
      remaining: remainingOrders.length,
    };

    if (syncedCount > 0 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("offline-orders-synced", {
          detail: { count: syncedCount, remaining: remainingOrders.length },
        })
      );
      window.dispatchEvent(new CustomEvent("offline-orders-updated"));
    }

    return result;
  } finally {
    isSyncing = false;
  }
};

/**
 * Check if the backend API server is reachable
 */
export const checkServerOnline = async (timeoutMs: number = 3000): Promise<boolean> => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch("/api/health", {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(id);
    return res.ok;
  } catch {
    return false;
  }
};

let autoSyncActive = false;
let autoSyncTimer: any = null;

/**
 * Proactive Auto Background Sync Manager
 * Runs automatically across the entire app:
 * - Periodic background heartbeat (every intervalMs)
 * - Auto-triggers on 'online', 'focus', and document 'visibilitychange'
 * - Auto-triggers immediately whenever an offline order is added
 * - Registers PWA Service Worker Background Sync if supported
 */
export const startAutoBackgroundSync = (intervalMs: number = 5000) => {
  if (typeof window === "undefined" || autoSyncActive) return;
  autoSyncActive = true;

  const attemptAutoSync = async () => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      const pending = await getOfflineOrders(true);
      if (pending.length === 0) return;
      await syncOfflineOrders();
    } catch (err) {
      console.warn("[AutoBackgroundSync] Run error:", err);
    }
  };

  // 1. Regular background heartbeat
  autoSyncTimer = setInterval(attemptAutoSync, intervalMs);

  // 2. Connectivity and lifecycle triggers
  window.addEventListener("online", attemptAutoSync);
  window.addEventListener("focus", attemptAutoSync);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      attemptAutoSync();
    }
  });

  // 3. Immediate trigger when an offline order is created anywhere in the app
  window.addEventListener("offline-order-added", attemptAutoSync);

  // 4. Register PWA Service Worker Background Sync if supported
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready
      .then((reg: any) => {
        if (reg && reg.sync && typeof reg.sync.register === "function") {
          reg.sync.register("sync-offline-orders").catch(() => {});
        }
      })
      .catch(() => {});
  }

  // Initial trigger
  attemptAutoSync();
};

export const stopAutoBackgroundSync = () => {
  if (autoSyncTimer) {
    clearInterval(autoSyncTimer);
    autoSyncTimer = null;
  }
  autoSyncActive = false;
};

