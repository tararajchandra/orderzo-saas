"use client";

import React, { useState, useEffect } from "react";
import {
  isTauri,
  getInstalledPrinters,
  printSilentBill,
  printSilentKot,
  openCashDrawer,
  setLocalSetting,
  PrinterInfo,
} from "@/lib/tauriBridge";

interface PrinterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function PrinterConfigModal({
  isOpen,
  onClose,
  onSaved,
}: PrinterConfigModalProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [printersList, setPrintersList] = useState<PrinterInfo[]>([]);
  const [receiptPrinter, setReceiptPrinter] = useState("");
  const [kotPrinter, setKotPrinter] = useState("");
  const [paperWidth, setPaperWidth] = useState<"80mm" | "58mm">("80mm");
  const [testPrinting, setTestPrinting] = useState(false);
  const [testResult, setTestResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTestResult(null);
      setSaveSuccess(false);
      return;
    }

    const tauriActive = isTauri();
    setIsDesktop(tauriActive);

    // Load saved printers from localStorage or cached settings
    const savedReceipt = localStorage.getItem("tauri_receipt_printer") || "";
    const savedKot = localStorage.getItem("tauri_kot_printer") || "";
    setReceiptPrinter(savedReceipt);
    setKotPrinter(savedKot);

    try {
      const cached = localStorage.getItem("printerSettings");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.paperWidth) setPaperWidth(parsed.paperWidth);
      }
    } catch (e) {}

    if (tauriActive) {
      getInstalledPrinters()
        .then((list) => {
          setPrintersList(list);
          const defaultPr = list.find((p) => p.is_default) || list[0];
          if (!savedReceipt && defaultPr) {
            setReceiptPrinter(defaultPr.name);
          }
          if (!savedKot && defaultPr) {
            setKotPrinter(defaultPr.name);
          }
        })
        .catch((err) => {
          console.error("Error loading printers in modal:", err);
        });

    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    try {
      if (receiptPrinter) {
        localStorage.setItem("tauri_receipt_printer", receiptPrinter);
        if (isTauri()) {
          await setLocalSetting("receipt_printer", receiptPrinter).catch(() => {});
        }
      }

      if (kotPrinter) {
        localStorage.setItem("tauri_kot_printer", kotPrinter);
        if (isTauri()) {
          await setLocalSetting("kot_printer", kotPrinter).catch(() => {});
        }
      }

      // Sync paper width in printer settings cache
      try {
        const cached = localStorage.getItem("printerSettings");
        const obj = cached ? JSON.parse(cached) : {};
        obj.paperWidth = paperWidth;
        localStorage.setItem("printerSettings", JSON.stringify(obj));
        localStorage.setItem("cached_settings", JSON.stringify(obj));
      } catch (e) {}

      setSaveSuccess(true);
      if (onSaved) onSaved();

      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setTestResult({
        type: "error",
        message: "Failed to save: " + (err.message || String(err)),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrintBill = async () => {
    if (!receiptPrinter) {
      alert("Please select a Receipt Printer first.");
      return;
    }
    setTestPrinting(true);
    setTestResult(null);
    try {
      await printSilentBill({
        printer_name: receiptPrinter,
        restaurant_name: "OrderZo POS Counter",
        address: "Cashier Counter Test",
        phone: "+91 0000000000",
        order_number: "TEST-" + Math.floor(100 + Math.random() * 900),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        table_or_type: "COUNTER TEST",
        items: [
          { name: "Sample Item A", qty: 1, rate: 150, amount: 150 },
          { name: "Sample Item B", qty: 2, rate: 50, amount: 100 },
        ],
        subtotal: 250,
        tax: 12.5,
        total: 262.5,
        payment_mode: "CASH",
        footer_note: "Receipt test print successful! OrderZo Desktop POS.",
      });
      setTestResult({
        type: "success",
        message: "✅ Test receipt printed successfully to " + receiptPrinter + "!",
      });
    } catch (err: any) {
      setTestResult({
        type: "error",
        message: `❌ Bill print failed: ${err.message || String(err)}`,
      });
    } finally {
      setTestPrinting(false);
    }
  };

  const handleTestPrintKot = async () => {
    const target = kotPrinter || receiptPrinter;
    if (!target) {
      alert("Please select a KOT Printer first.");
      return;
    }
    setTestPrinting(true);
    setTestResult(null);
    try {
      await printSilentKot({
        printer_name: target,
        kot_number: "KOT-" + Math.floor(10 + Math.random() * 90),
        order_number: "TEST-KOT",
        table_or_type: "TABLE 1",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        waiter_name: "Cashier",
        items: [
          { name: "Sample Dish 1", qty: 1, note: "Spicy" },
          { name: "Sample Beverage", qty: 2 },
        ],
        notes: "Test KOT print from Cashier Counter",
      });
      setTestResult({
        type: "success",
        message: "✅ Test KOT printed successfully to " + target + "!",
      });
    } catch (err: any) {
      setTestResult({
        type: "error",
        message: `❌ KOT print failed: ${err.message || String(err)}`,
      });
    } finally {
      setTestPrinting(false);
    }
  };

  const handleTestDrawer = async () => {
    if (!receiptPrinter) {
      alert("Please select a printer connected to the cash drawer.");
      return;
    }
    try {
      await openCashDrawer(receiptPrinter);
      setTestResult({
        type: "success",
        message: "✅ Cash drawer kick command sent to " + receiptPrinter + "!",
      });
    } catch (err: any) {
      setTestResult({
        type: "error",
        message: `❌ Drawer kick failed: ${err.message || String(err)}`,
      });
    }
  };

  const handleRefreshPrinters = async () => {
    if (!isTauri()) return;
    try {
      const list = await getInstalledPrinters();
      setPrintersList(list);
      setTestResult({
        type: "success",
        message: `Found ${list.length} installed printers on this PC.`,
      });
    } catch (e: any) {
      setTestResult({
        type: "error",
        message: `Printer scan error: ${e.message || String(e)}`,
      });
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
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "580px",
          background: "var(--card-bg, #1e293b)",
          color: "var(--text-primary, #f8fafc)",
          borderRadius: "14px",
          padding: "1.75rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            paddingBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.6rem" }}>🖨️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                Counter Printer Settings
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  color: "var(--text-secondary, #94a3b8)",
                }}
              >
                Configure Cash Receipt & Kitchen KOT Thermal Printers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{
              padding: "0.4rem 0.8rem",
              fontSize: "1.1rem",
              cursor: "pointer",
              lineHeight: 1,
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1.25rem",
            background: isDesktop
              ? "rgba(16, 185, 129, 0.12)"
              : "rgba(100, 116, 139, 0.12)",
            border: isDesktop
              ? "1px solid rgba(16, 185, 129, 0.35)"
              : "1px dashed rgba(100, 116, 139, 0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.1rem" }}>
              {isDesktop ? "⚡" : "🌐"}
            </span>
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              {isDesktop
                ? "Tauri POS Desktop Engine"
                : "Web Browser Mode"}
            </span>
          </div>
          {isDesktop ? (
            <span
              style={{
                padding: "0.2rem 0.6rem",
                background: "#10b981",
                color: "#ffffff",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                letterSpacing: "0.5px",
              }}
            >
              ACTIVE DESKTOP APP
            </span>
          ) : (
            <span
              style={{
                padding: "0.2rem 0.6rem",
                background: "rgba(100, 116, 139, 0.3)",
                color: "var(--text-secondary, #94a3b8)",
                borderRadius: "4px",
                fontSize: "0.75rem",
              }}
            >
              BROWSER ONLY
            </span>
          )}
        </div>

        {!isDesktop && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              color: "#fbbf24",
              fontSize: "0.82rem",
              lineHeight: 1.45,
              marginBottom: "1.25rem",
            }}
          >
            ℹ️ Direct silent thermal printing without browser popups runs inside the{" "}
            <strong>OrderZo Counter Desktop App (.exe)</strong>. In a web browser, standard print preview will open.
          </div>
        )}

        {/* Printer Selection Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.4rem",
              }}
            >
              <label
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span>🧾</span> Bill / Receipt Printer (Thermal / Wi-Fi / USB):
              </label>
              {isDesktop && (
                <button
                  type="button"
                  onClick={handleRefreshPrinters}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary, #3b82f6)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  🔄 Refresh list
                </button>
              )}
            </div>

            {isDesktop ? (
              <select
                className="input"
                style={{ width: "100%", padding: "0.6rem" }}
                value={receiptPrinter}
                onChange={(e) => setReceiptPrinter(e.target.value)}
              >
                {printersList.length === 0 && (
                  <option value="">No printers detected on this PC</option>
                )}
                {printersList.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} {p.is_default ? "★ (Default)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="input"
                placeholder="e.g. POS-80, EPSON L3150, or TVS RP 3160"
                value={receiptPrinter}
                onChange={(e) => setReceiptPrinter(e.target.value)}
                style={{ width: "100%" }}
              />
            )}
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary, #94a3b8)",
                margin: "4px 0 0 0",
              }}
            >
              Any connected printer (Thermal POS, Wi-Fi Epson/HP, or Windows Spooler) for customer bills.
            </p>
          </div>

          <div>
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                marginBottom: "0.4rem",
              }}
            >
              <span>🍳</span> Kitchen KOT Printer (Thermal / Wi-Fi):
            </label>
            {isDesktop ? (
              <select
                className="input"
                style={{ width: "100%", padding: "0.6rem" }}
                value={kotPrinter}
                onChange={(e) => setKotPrinter(e.target.value)}
              >
                <option value="">Same as Bill Printer ({receiptPrinter || "Default"})</option>
                {printersList.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="input"
                placeholder="e.g. Kitchen-KOT-Printer (Optional)"
                value={kotPrinter}
                onChange={(e) => setKotPrinter(e.target.value)}
                style={{ width: "100%" }}
              />
            )}
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary, #94a3b8)",
                margin: "4px 0 0 0",
              }}
            >
              Printer in kitchen for food order tickets (leave empty to use Bill printer).
            </p>
          </div>

          {/* Paper Width Selection */}
          <div>
            <label
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                display: "block",
                marginBottom: "0.4rem",
              }}
            >
              📏 Receipt Paper Roll Width:
            </label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                <input
                  type="radio"
                  name="modalPaperWidth"
                  value="80mm"
                  checked={paperWidth === "80mm"}
                  onChange={() => setPaperWidth("80mm")}
                />
                80mm (3-inch Standard POS)
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                <input
                  type="radio"
                  name="modalPaperWidth"
                  value="58mm"
                  checked={paperWidth === "58mm"}
                  onChange={() => setPaperWidth("58mm")}
                />
                58mm (2-inch Compact)
              </label>
            </div>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            style={{
              marginTop: "1.25rem",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              background:
                testResult.type === "success"
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
              color:
                testResult.type === "success" ? "#10b981" : "#ef4444",
              border: `1px solid ${
                testResult.type === "success"
                  ? "rgba(16, 185, 129, 0.3)"
                  : "rgba(239, 68, 68, 0.3)"
              }`,
            }}
          >
            {testResult.message}
          </div>
        )}

        {saveSuccess && (
          <div
            style={{
              marginTop: "1.25rem",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              fontWeight: 600,
            }}
          >
            ✅ Printer settings saved & applied successfully!
          </div>
        )}

        {/* Actions & Test Buttons */}
        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {isDesktop && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleTestPrintBill}
                disabled={testPrinting || !receiptPrinter}
                style={{ fontSize: "0.82rem", padding: "0.45rem 0.8rem", flex: 1 }}
              >
                🧾 Test Print Bill
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleTestPrintKot}
                disabled={testPrinting || (!kotPrinter && !receiptPrinter)}
                style={{ fontSize: "0.82rem", padding: "0.45rem 0.8rem", flex: 1 }}
              >
                🍳 Test Print KOT
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleTestDrawer}
                disabled={testPrinting || !receiptPrinter}
                style={{ fontSize: "0.82rem", padding: "0.45rem 0.8rem" }}
                title="Pulse Cash Drawer to Open"
              >
                💵 Test Drawer
              </button>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{
                fontWeight: 600,
                padding: "0.55rem 1.4rem",
              }}
            >
              {saving ? "Saving..." : "💾 Save & Apply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
