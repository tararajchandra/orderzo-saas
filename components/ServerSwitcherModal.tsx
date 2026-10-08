"use client";

import { useState, useEffect } from "react";
import { getServerUrl, switchServerUrl, isTauri } from "@/lib/tauriBridge";

interface ServerSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServerSwitcherModal({
  isOpen,
  onClose,
}: ServerSwitcherModalProps) {
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>("custom");
  const [customUrl, setCustomUrl] = useState<string>("");
  const [testStatus, setTestStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
    latencyMs?: number;
  }>({ tested: false });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getServerUrl().then((url) => {
        const active = url || (typeof window !== "undefined" ? window.location.origin : "");
        setCurrentUrl(active);
        setCustomUrl(active);
        setTestStatus({ tested: false });

        if (active.includes("localhost")) {
          setSelectedPreset("localhost");
        } else if (active.includes("demo")) {
          setSelectedPreset("demo");
        } else {
          setSelectedPreset("custom");
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    setTestStatus({ tested: false });
    if (preset === "localhost") {
      setCustomUrl("http://localhost:3000");
    } else if (preset === "demo") {
      setCustomUrl("https://demo.orderzo.in");
    }
  };

  const handleTestConnection = async () => {
    const urlToTest = customUrl.trim().replace(/\/+$/, "");
    if (!urlToTest) {
      alert("Please enter a valid Server URL.");
      return;
    }

    setTesting(true);
    setTestStatus({ tested: false });
    const startTime = Date.now();

    try {
      // Test heartbeat or settings endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${urlToTest}/api/pos/heartbeat`, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      if (res.ok) {
        setTestStatus({
          tested: true,
          success: true,
          latencyMs: latency,
          message: `Connection successful! (${latency}ms latency)`,
        });
      } else {
        setTestStatus({
          tested: true,
          success: false,
          latencyMs: latency,
          message: `Server responded with HTTP ${res.status}.`,
        });
      }
    } catch (err: any) {
      setTestStatus({
        tested: true,
        success: false,
        message: err.name === "AbortError" ? "Connection timed out." : "Cannot reach server. Check URL or internet.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleApply = async () => {
    const urlToApply = customUrl.trim().replace(/\/+$/, "");
    if (!urlToApply) {
      alert("Please enter a valid Server URL.");
      return;
    }

    const confirmSwitch = confirm(
      `Switch server environment to:\n${urlToApply}\n\n🔒 Strict Isolation Guarantee:\nDemo and Live databases are 100% separate.\nAll local server caches and session tokens will be reset so data will never mix.\n\nContinue?`
    );
    if (!confirmSwitch) return;

    setLoading(true);
    try {
      // Purge all cached server data and sessions to prevent cross-contamination
      const envCacheKeys = [
        "adminToken",
        "user",
        "cached_admin_orders",
        "cached_cash_sales",
        "cached_expenses",
        "cached_menu_items",
        "cached_delivery_locations",
        "cached_settings",
        "cached_sales_data",
        "cached_salesmen_data",
        "cached_active_table_orders",
        "cached_salesman_pending",
        "cached_salesman_tables",
        "offline_orders_summary",
        "ruchi_current_user",
        "pos_auth_user",
      ];
      envCacheKeys.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch (e) {}
      });
      try {
        sessionStorage.clear();
      } catch (e) {}

      await switchServerUrl(urlToApply);
      onClose();
    } catch (err) {
      alert("Failed to switch server. Please check permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "540px",
          borderRadius: "16px",
          padding: "1.75rem",
          background: "hsl(150, 16%, 10%)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          color: "#fff",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.8rem" }}>🌐</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                Server / Cloud Switcher
              </h2>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {isTauri() ? "Desktop POS Environment Switcher" : "Web Environment Configuration"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: "4px 10px", fontSize: "1.2rem", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Current URL indicator */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "2px" }}>
            Currently Active Server:
          </div>
          <div style={{ fontWeight: 600, color: "#34d399", wordBreak: "break-all" }}>
            {currentUrl || "Default Local Server"}
          </div>
        </div>

        {/* Strict Isolation Notice */}
        <div
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            fontSize: "0.8rem",
            color: "#a7f3d0",
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", color: "#34d399" }}>
            <span>🛡️</span>
            <span>100% Data Isolation Guarantee</span>
          </div>
          <div>
            Demo and Live servers operate on completely separate databases. Demo orders and live orders will <b>never</b> merge. Local caches are safely cleared upon switching.
          </div>
        </div>

        {/* Preset Environments */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Select Environment:
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => handlePresetSelect("demo")}
              style={{
                padding: "0.75rem",
                borderRadius: "10px",
                border: selectedPreset === "demo" ? "2px solid #fbbf24" : "1px solid rgba(255,255,255,0.1)",
                background: selectedPreset === "demo" ? "rgba(251, 191, 36, 0.15)" : "rgba(255,255,255,0.03)",
                color: selectedPreset === "demo" ? "#fbbf24" : "#fff",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              🟡 Demo Server
              <div style={{ fontSize: "0.7rem", opacity: 0.75, fontWeight: 400 }}>Test / Demo Database</div>
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect("localhost")}
              style={{
                padding: "0.75rem",
                borderRadius: "10px",
                border: selectedPreset === "localhost" ? "2px solid #60a5fa" : "1px solid rgba(255,255,255,0.1)",
                background: selectedPreset === "localhost" ? "rgba(96, 165, 250, 0.15)" : "rgba(255,255,255,0.03)",
                color: selectedPreset === "localhost" ? "#60a5fa" : "#fff",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              💻 Localhost (3000)
              <div style={{ fontSize: "0.7rem", opacity: 0.75, fontWeight: 400 }}>Local machine server</div>
            </button>
          </div>
        </div>

        {/* Custom URL Input */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Target Server / Cloud URL:
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              className="input"
              value={customUrl}
              onChange={(e) => {
                setCustomUrl(e.target.value);
                setSelectedPreset("custom");
                setTestStatus({ tested: false });
              }}
              placeholder="e.g. https://ruchi.orderzo.in or http://192.168.1.100:3000"
              style={{ flex: 1, fontSize: "0.9rem" }}
            />
            <button
              type="button"
              onClick={handleTestConnection}
              className="btn btn-outline"
              disabled={testing || !customUrl.trim()}
              style={{ whiteSpace: "nowrap", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              {testing ? "Testing..." : "⚡ Test"}
            </button>
          </div>
        </div>

        {/* Test Result Alert */}
        {testStatus.tested && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
              background: testStatus.success ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              border: `1px solid ${testStatus.success ? "#10b981" : "#ef4444"}`,
              color: testStatus.success ? "#34d399" : "#f87171",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>{testStatus.success ? "✅" : "⚠️"}</span>
            <span>{testStatus.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Tip: Press <kbd style={{ background: "rgba(255,255,255,0.1)", padding: "2px 4px", borderRadius: "4px" }}>Ctrl+Shift+S</kbd> to open anytime.
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="btn btn-primary"
              disabled={loading || !customUrl.trim()}
            >
              {loading ? "Switching..." : "Save & Connect"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
