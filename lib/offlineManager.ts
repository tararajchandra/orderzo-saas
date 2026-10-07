import localforage from "localforage";

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
}

// Generate conflict-free offline order number based on salesman/device prefix
export const generateOfflineOrderNumber = (prefix: string = "S1"): string => {
  const cleanPrefix = (prefix || "S1").trim().toUpperCase();
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
  const seqKey = `offline_seq_${cleanPrefix}_${dateStr}`;
  let currentSeq = 0;
  try {
    currentSeq = parseInt(localStorage.getItem(seqKey) || "0", 10);
  } catch (e) {}
  currentSeq += 1;
  try {
    localStorage.setItem(seqKey, String(currentSeq));
  } catch (e) {}
  return `${cleanPrefix}-${dateStr}-${String(currentSeq).padStart(3, "0")}`;
};

// Save an order locally when offline
export const saveOfflineOrder = async (
  url: string,
  method: string,
  body: any
) => {
  try {
    const timestamp = Date.now();
    const orderCreatedAt = body?.created_at || new Date(timestamp).toISOString();
    const updatedBody = {
      ...body,
      created_at: orderCreatedAt,
      is_offline: true,
    };

    const offlineOrder: OfflineOrder = {
      id: `offline_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      method,
      body: updatedBody,
      timestamp,
      status: "pending",
    };

    const existingOrders: OfflineOrder[] =
      (await localforage.getItem("pending_orders")) || [];
    existingOrders.push(offlineOrder);
    await localforage.setItem("pending_orders", existingOrders);

    // Immediately cache in cached_admin_orders for instant display on orders & dashboard
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("cached_admin_orders");
        const list: any[] = cached ? JSON.parse(cached) : [];
        const orderEntry = {
          ...updatedBody,
          id: updatedBody.id || updatedBody.order_number || offlineOrder.id,
          order_number: updatedBody.order_number || updatedBody.id || offlineOrder.id,
          created_at: orderCreatedAt,
          is_offline: true,
        };
        const filtered = list.filter(
          (o: any) =>
            String(o.order_number || o.id) !==
            String(orderEntry.order_number || orderEntry.id)
        );
        filtered.unshift(orderEntry);
        localStorage.setItem(
          "cached_admin_orders",
          JSON.stringify(filtered.slice(0, 100))
        );
      } catch (e) {}
    }

    return offlineOrder;
  } catch (error) {
    console.error("Error saving offline order:", error);
    throw error;
  }
};

// Retrieve all offline orders
export const getOfflineOrders = async (): Promise<OfflineOrder[]> => {
  try {
    return (await localforage.getItem("pending_orders")) || [];
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

// Sync pending orders to the server
export const syncOfflineOrders = async () => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return; // Still offline

  const pendingOrders = await getOfflineOrders();
  if (pendingOrders.length === 0) return; // Nothing to sync

  console.log(`Attempting to sync ${pendingOrders.length} offline orders...`);

  for (const order of pendingOrders) {
    try {
      const response = await fetch(order.url, {
        method: order.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order.body),
      });

      const data = await response.json();
      if ((response.ok && data.success !== false) || response.status === 404) {
        // Successfully synced or already resolved on server
        console.log(`Synced offline order ${order.id} successfully.`);
        await removeOfflineOrder(order.id);

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
                    ...(data.data || {}),
                    is_offline: false,
                  };
                }
                return item;
              });
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
          `Unrecoverable sync error for order ${order.id}, removing:`,
          data
        );
        await removeOfflineOrder(order.id);
      } else {
        console.warn(`Failed to sync order ${order.id}:`, data);
      }
    } catch (error) {
      console.error(`Error syncing order ${order.id}:`, error);
      // Stop syncing further orders if network drops midway
      break; 
    }
  }
};
