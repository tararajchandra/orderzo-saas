"use client";

import { useState, useEffect } from "react";
import { syncOfflineOrders, getOfflineOrders } from "@/lib/offlineManager";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // When back online, attempt to sync immediately
      syncOfflineOrders().then(() => {
        checkPending();
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodically check for pending orders and sync if online
    const checkPending = async () => {
      const orders = await getOfflineOrders();
      setPendingCount(orders.length);
    };

    const syncInterval = setInterval(() => {
      checkPending();
      if (navigator.onLine) {
        syncOfflineOrders().then(() => checkPending());
      }
    }, 10000); // Check every 10 seconds

    checkPending();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(syncInterval);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: 9999,
        background: isOnline ? "var(--success)" : "var(--danger)",
        color: "white",
        padding: "8px 16px",
        borderRadius: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "0.875rem",
        fontWeight: "bold",
        animation: "fade-in 0.3s ease-in-out",
      }}
    >
      {isOnline ? (
        <>
          <span style={{ fontSize: "1.2rem" }}>🔄</span>
          <span>Syncing {pendingCount} offline orders...</span>
        </>
      ) : (
        <>
          <span style={{ fontSize: "1.2rem" }}>☁️ 🚫</span>
          <span>
            Offline Mode {pendingCount > 0 && `(${pendingCount} pending)`}
          </span>
        </>
      )}
    </div>
  );
}
