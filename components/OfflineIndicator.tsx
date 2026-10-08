"use client";

import { useState, useEffect } from "react";
import {
  syncOfflineOrders,
  getOfflineOrders,
  startAutoBackgroundSync,
} from "@/lib/offlineManager";
import { isRouteSupportedOffline, showOfflineRouteWarning } from "@/lib/offlineRoutes";
import ServerSwitcherModal from "@/components/ServerSwitcherModal";
import { isTauri } from "@/lib/tauriBridge";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncingState, setIsSyncingState] = useState(false);
  const [justSyncedCount, setJustSyncedCount] = useState<number | null>(null);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);

    // Start auto background sync runner across the app
    startAutoBackgroundSync(5000);

    // If running in an admin or cashier session and online, pulse heartbeat to cloud
    const pulseHeartbeat = async () => {
      if (typeof window === "undefined" || !navigator.onLine) return;
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      try {
        await fetch("/api/pos/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device: "pos_counter", timestamp: Date.now() }),
        });
      } catch (e) {}
    };

    pulseHeartbeat();
    const heartbeatInterval = setInterval(pulseHeartbeat, 12000);

    const checkPending = async () => {
      const orders = await getOfflineOrders();
      setPendingCount(orders.length);
    };

    const handleOnline = () => {
      setIsOnline(true);
      checkPending();
      syncOfflineOrders().then(() => checkPending());
    };

    const handleOffline = () => {
      setIsOnline(false);
      checkPending();
    };

    const handleOrdersUpdated = () => {
      checkPending();
    };

    const handleOrdersSynced = (e: any) => {
      const count = e.detail?.count || 0;
      if (count > 0) {
        setJustSyncedCount(count);
        setTimeout(() => setJustSyncedCount(null), 4000);
      }
      checkPending();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("offline-orders-updated", handleOrdersUpdated);
    window.addEventListener("offline-orders-synced", handleOrdersSynced as EventListener);

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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTauri() && e.ctrlKey && e.shiftKey && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        setIsServerModalOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleDocumentClick, true);

    checkPending();

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("offline-orders-updated", handleOrdersUpdated);
      window.removeEventListener("offline-orders-synced", handleOrdersSynced as EventListener);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  const handleForceSync = async () => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      setIsSyncingState(true);
      try {
        const res = await syncOfflineOrders();
        const orders = await getOfflineOrders();
        setPendingCount(orders.length);
        if (res.synced > 0) {
          setJustSyncedCount(res.synced);
          setTimeout(() => setJustSyncedCount(null), 4000);
        }
      } finally {
        setIsSyncingState(false);
      }
    }
  };

  const showSyncBadge = !isOnline || pendingCount > 0 || !!justSyncedCount;

  return (
    <>
      {isTauri() && (
        <ServerSwitcherModal
          isOpen={isServerModalOpen}
          onClose={() => setIsServerModalOpen(false)}
        />
      )}

      {showSyncBadge && (
        <div
          onClick={handleForceSync}
          title={isOnline ? "ক্লিক করে এখনই সিঙ্ক করুন (Click to force sync now)" : "অফলাইন মোড - ইন্টারনেট আসলে অটো-সিঙ্ক হবে"}
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: 9999,
        background: !isOnline
          ? "#e53e3e"
          : justSyncedCount
          ? "#28a745"
          : "#3182ce",
        color: "white",
        padding: "10px 18px",
        borderRadius: "24px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "0.875rem",
        fontWeight: "bold",
        animation: "fade-in 0.3s ease-in-out",
        cursor: isOnline ? "pointer" : "default",
        userSelect: "none",
        transition: "all 0.3s ease",
      }}
    >
      {!isOnline ? (
        <>
          <span style={{ fontSize: "1.2rem" }}>☁️ 🚫</span>
          <span>
            অফলাইন মোড {pendingCount > 0 ? `(${pendingCount} টি পেন্ডিং বিল)` : ""}
          </span>
        </>
      ) : justSyncedCount ? (
        <>
          <span style={{ fontSize: "1.2rem" }}>✅</span>
          <span>অটো-সিঙ্ক সম্পন্ন ({justSyncedCount} টি বিল)!</span>
        </>
      ) : (
        <>
          <span
            style={{
              fontSize: "1.2rem",
              display: "inline-block",
              animation: "spin 1.5s linear infinite",
            }}
          >
            🔄
          </span>
          <span>
            {isSyncingState
              ? `সিঙ্ক হচ্ছে... (${pendingCount} পেন্ডিং)`
              : `অটো-সিঙ্ক হচ্ছে... (${pendingCount} পেন্ডিং বিল)`}
          </span>
        </>
      )}
    </div>
      )}
    </>
  );
}
