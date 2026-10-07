"use client";

import { useState, useEffect } from "react";
import { syncOfflineOrders, getOfflineOrders } from "@/lib/offlineManager";
import { isRouteSupportedOffline, showOfflineRouteWarning } from "@/lib/offlineRoutes";

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

    // Global interceptor for clicks on links that are not supported offline
    const handleDocumentClick = (e: MouseEvent) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const anchor = (e.target as HTMLElement)?.closest("a");
        if (anchor) {
          const href = anchor.getAttribute("href");
          if (
            href &&
            !href.startsWith("#") &&
            !href.startsWith("tel:") &&
            !href.startsWith("mailto:") &&
            !href.startsWith("javascript:")
          ) {
            try {
              const url = new URL(href, window.location.origin);
              if (url.origin === window.location.origin) {
                const pathname = url.pathname;
                if (!isRouteSupportedOffline(pathname)) {
                  e.preventDefault();
                  e.stopPropagation();
                  const linkText =
                    anchor.querySelector("h3")?.textContent?.trim() ||
                    anchor.textContent?.trim().replace(/\s+/g, " ") ||
                    pathname;
                  showOfflineRouteWarning(linkText);
                }
              }
            } catch (err) {}
          }
        }
      }
    };

    document.addEventListener("click", handleDocumentClick, true);

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
      document.removeEventListener("click", handleDocumentClick, true);
      clearInterval(syncInterval);
    };
  }, []);

  const handleForceSync = async () => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      await syncOfflineOrders();
      const orders = await getOfflineOrders();
      setPendingCount(orders.length);
    }
  };

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      onClick={handleForceSync}
      title={isOnline ? "ক্লিক করে এখনই সিঙ্ক করুন (Click to force sync)" : "অফলাইন মোড"}
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
        cursor: isOnline ? "pointer" : "default",
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
