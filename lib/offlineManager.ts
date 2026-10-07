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
    const offlineOrder: OfflineOrder = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      method,
      body,
      timestamp: Date.now(),
      status: "pending",
    };

    const existingOrders: OfflineOrder[] =
      (await localforage.getItem("pending_orders")) || [];
    existingOrders.push(offlineOrder);
    await localforage.setItem("pending_orders", existingOrders);

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
  if (!navigator.onLine) return; // Still offline

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
      } else {
        console.warn(`Failed to sync order ${order.id}:`, data);
      }
    } catch (error) {
      console.error(`Error syncing order ${order.id}:`, error);
      // Stop syncing further orders to preserve order if network is spotty
      break; 
    }
  }
};
