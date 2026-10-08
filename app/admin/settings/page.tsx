"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ServerSwitcherModal from "@/components/ServerSwitcherModal";
import {
  isTauri,
  getInstalledPrinters,
  printSilentBill,
  openCashDrawer,
  setLocalSetting,
  getServerUrl,
  PrinterInfo,
} from "@/lib/tauriBridge";

interface Settings {
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  restaurantEmail: string;
  gstNumber: string;
  gstType: "regular" | "composite" | "unregistered";
  printerType: "thermal" | "a4";
  paperWidth: "58mm" | "80mm";
  showLogo: boolean;
  footerText: string;
  totalTables: string;
  tableZones: string;
  restaurantLat: string;
  restaurantLng: string;
  allowedRadius: string;
  customerRadius: string;
}

const defaultSettings: Settings = {
  restaurantName: "OrderZo",
  restaurantAddress: "123 Main Street, City, State 12345",
  restaurantPhone: "+91 1234567890",
  restaurantEmail: "info@OrderZo.com",
  gstNumber: "",
  gstType: "regular",
  printerType: "thermal",
  paperWidth: "80mm",
  showLogo: true,
  footerText: "Thank you for your business!",
  totalTables: "16",
  tableZones: "",
  restaurantLat: "22.5726",
  restaurantLng: "88.3639",
  allowedRadius: "50",
  customerRadius: "50",
};

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [parsedZones, setParsedZones] = useState<
    { name: string; count: string }[]
  >([{ name: "", count: "" }]);

  // Desktop POS (Tauri) hardware printer state
  const [isDesktop, setIsDesktop] = useState(false);
  const [printersList, setPrintersList] = useState<PrinterInfo[]>([]);
  const [receiptPrinter, setReceiptPrinter] = useState<string>("");
  const [kotPrinter, setKotPrinter] = useState<string>("");
  const [testPrinting, setTestPrinting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [activeServerUrl, setActiveServerUrl] = useState<string>("");

  useEffect(() => {
    getServerUrl().then((url) => {
      if (url) setActiveServerUrl(url);
      else if (typeof window !== "undefined") setActiveServerUrl(window.location.origin);
    });

    if (isTauri()) {
      setIsDesktop(true);
      getInstalledPrinters().then((list) => {
        setPrintersList(list);
        const savedReceipt =
          localStorage.getItem("tauri_receipt_printer") || list[0]?.name || "";
        const savedKot =
          localStorage.getItem("tauri_kot_printer") || savedReceipt;
        setReceiptPrinter(savedReceipt);
        setKotPrinter(savedKot);
      });
    }
  }, []);

  const handleUpdatePrinterConfig = (type: "receipt" | "kot", name: string) => {
    if (type === "receipt") {
      setReceiptPrinter(name);
      localStorage.setItem("tauri_receipt_printer", name);
      setLocalSetting("receipt_printer", name);
    } else {
      setKotPrinter(name);
      localStorage.setItem("tauri_kot_printer", name);
      setLocalSetting("kot_printer", name);
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
        restaurant_name: settings.restaurantName || "OrderZo POS",
        address: settings.restaurantAddress,
        phone: settings.restaurantPhone,
        gstin: settings.gstNumber,
        order_number: "TEST-001",
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        table_or_type: "COUNTER TEST",
        items: [
          { name: "Chicken Biryani", qty: 1, rate: 220, amount: 220 },
          { name: "Cold Drink (500ml)", qty: 2, rate: 40, amount: 80 },
        ],
        subtotal: 300,
        tax: 15,
        total: 315,
        payment_mode: "CASH",
        footer_note: "Test print successful! OrderZo Desktop POS.",
      });
      setTestResult("✅ Test receipt printed successfully!");
    } catch (err: any) {
      setTestResult(`❌ Print failed: ${err.message || String(err)}`);
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
      setTestResult("✅ Cash drawer kick command sent!");
    } catch (err: any) {
      setTestResult(`❌ Drawer kick failed: ${err.message || String(err)}`);
    }
  };

  // Parse zones on initial load
  useEffect(() => {
    if (
      settings.tableZones &&
      typeof settings.tableZones === "string" &&
      settings.tableZones.trim() !== ""
    ) {
      try {
        const z = settings.tableZones
          .split(",")
          .map((zone) => {
            const parts = zone.split(":");
            return {
              name: parts[0]?.trim() || "",
              count: parts[1]?.trim() || "",
            };
          })
          .filter((z) => z.name !== "");
        setParsedZones(z.length > 0 ? z : [{ name: "", count: "" }]);
      } catch (e) {
        setParsedZones([{ name: "", count: "" }]);
      }
    } else {
      setParsedZones([{ name: "", count: "" }]);
    }
  }, [settings.tableZones]);

  const updateZoneString = (newZones: { name: string; count: string }[]) => {
    setParsedZones(newZones);
    const str = newZones
      .filter((z) => z.name.trim() !== "" && z.count.trim() !== "")
      .map((z) => `${z.name.trim()}:${z.count.trim()}`)
      .join(", ");
    setSettings({ ...settings, tableZones: str });
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin");
      return;
    }
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (data.success) {
        setSettings({ ...defaultSettings, ...data.data });
        localStorage.setItem("cached_settings", JSON.stringify(data.data));
        localStorage.setItem("printerSettings", JSON.stringify(data.data));
        if (isTauri()) {
          setLocalSetting("cached_settings", JSON.stringify(data.data)).catch(() => {});
        }
      }
    } catch (error) {
      console.error("Failed to load settings", error);
      try {
        const cached = localStorage.getItem("cached_settings");
        if (cached) setSettings({ ...defaultSettings, ...JSON.parse(cached) });
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        // Update local storage and SQLite for immediate offline sync
        localStorage.setItem("cached_settings", JSON.stringify(settings));
        localStorage.setItem("printerSettings", JSON.stringify(settings));
        if (isTauri()) {
          setLocalSetting("cached_settings", JSON.stringify(settings)).catch(() => {});
        }
        setTimeout(() => setSaved(false), 3000);
      } else {
        const errorData = await response.json();
        alert(
          "Failed to save settings: " + (errorData.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset to default settings?")) {
      setSettings(defaultSettings);
    }
  };

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

  return (
    <main className="container" style={{ padding: "2rem 1.5rem" }}>
      <div className="fade-in">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <h1>Settings</h1>
            <button
              onClick={() => router.push("/admin/settings/financial-years")}
              className="btn btn-secondary"
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.9rem" }}
            >
              📅 Manage Financial Years
            </button>
          </div>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="btn btn-ghost"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>Restaurant Information</h2>

            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={settings.restaurantName}
                  onChange={(e) =>
                    setSettings({ ...settings, restaurantName: e.target.value })
                  }
                  className="input"
                  placeholder="Enter restaurant name"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  Address
                </label>
                <textarea
                  value={settings.restaurantAddress}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      restaurantAddress: e.target.value,
                    })
                  }
                  className="input"
                  placeholder="Enter restaurant address"
                  rows={2}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.restaurantPhone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        restaurantPhone: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.restaurantEmail}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        restaurantEmail: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="Enter email"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    Total Tables (For Active Tables View)
                  </label>
                  <input
                    type="number"
                    value={settings.totalTables}
                    onChange={(e) =>
                      setSettings({ ...settings, totalTables: e.target.value })
                    }
                    className="input"
                    placeholder="e.g. 16"
                    min="1"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <div
                  className="form-group glass-card"
                  style={{
                    padding: "1.5rem",
                    borderRadius: "12px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--glass-bg)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <label
                      className="label"
                      style={{
                        margin: 0,
                        color: "var(--primary)",
                        fontSize: "1.1rem",
                        fontWeight: 600,
                      }}
                    >
                      Table Zones Configuration
                    </label>
                    <button
                      className="btn btn-secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        updateZoneString([
                          ...parsedZones,
                          { name: "", count: "" },
                        ]);
                      }}
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                    >
                      + Add Zone
                    </button>
                  </div>
                  <span
                    className="text-muted"
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    Create dedicated areas (e.g. Cafe, Lounge) and assign the
                    number of tables for each. Leave empty if you only want
                    simple numerical tables.
                  </span>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    {parsedZones.map((z, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          gap: "1rem",
                          alignItems: "center",
                          background: "rgba(0,0,0,0.2)",
                          padding: "12px",
                          borderRadius: "8px",
                        }}
                      >
                        <input
                          type="text"
                          value={z.name}
                          onChange={(e) => {
                            const newZ = [...parsedZones];
                            newZ[idx].name = e.target.value;
                            updateZoneString(newZ);
                          }}
                          className="input"
                          placeholder="Zone Name (e.g. Cafe)"
                          style={{ flex: 2 }}
                        />
                        <input
                          type="number"
                          value={z.count}
                          onChange={(e) => {
                            const newZ = [...parsedZones];
                            newZ[idx].count = e.target.value;
                            updateZoneString(newZ);
                          }}
                          className="input"
                          placeholder="No. of Tables"
                          min="1"
                          style={{ flex: 1 }}
                        />
                        <button
                          className="btn btn-ghost"
                          onClick={(e) => {
                            e.preventDefault();
                            const newZ = parsedZones.filter(
                              (_, i) => i !== idx,
                            );
                            updateZoneString(
                              newZ.length > 0
                                ? newZ
                                : [{ name: "", count: "" }],
                            );
                          }}
                          style={{ color: "var(--error)", padding: "0.5rem" }}
                          title="Remove Zone"
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label
                    className="label"
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      color: "var(--text-secondary)",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    Table Zones (Optional)
                    <span
                      className="text-muted"
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        fontWeight: "normal",
                        marginTop: "4px",
                      }}
                    >
                      Format: ZoneName:Count (e.g. Cafe:10, Lounge:5, Couple:3).
                      Leave empty to use simple table numbers.
                    </span>
                  </label>
                  <input
                    type="text"
                    value={settings.tableZones || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, tableZones: e.target.value })
                    }
                    className="input"
                    placeholder="Cafe:10, Lounge:5, Couple:3"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    GST Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={settings.gstNumber}
                    onChange={(e) =>
                      setSettings({ ...settings, gstNumber: e.target.value })
                    }
                    className="input"
                    placeholder="Enter GST number"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    GST Type
                  </label>
                  <select
                    value={settings.gstType}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        gstType: e.target.value as any,
                      })
                    }
                    className="input"
                  >
                    <option value="regular">Regular (Tax Invoice)</option>
                    <option value="composite">
                      Composite (Bill of Supply)
                    </option>
                    <option value="unregistered">
                      Unregistered (Bill of Supply)
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SERVER & CLOUD ENVIRONMENT SWITCHER (Desktop POS App Only) */}
          {isDesktop && (
            <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "1.8rem" }}>🌐</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                      Cloud Server Environment / ক্লাউড সার্ভার সংযোগ
                    </h2>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Connect Desktop POS to Demo, Live Restaurant Server, or Localhost
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsServerModalOpen(true)}
                  className="btn btn-primary"
                  style={{ fontSize: "0.875rem" }}
                >
                  🔄 Switch Server / সার্ভার পরিবর্তন
                </button>
              </div>

              <div
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                    CURRENT ACTIVE SERVER / DATABASE:
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#34d399", wordBreak: "break-all" }}>
                    {activeServerUrl || (typeof window !== "undefined" ? window.location.origin : "Default Server")}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    {activeServerUrl.includes("demo")
                      ? "🟡 Connected to Demo Cloud Server (Test Database)"
                      : activeServerUrl.includes("localhost")
                      ? "💻 Connected to Localhost (Local Machine Server)"
                      : "🟢 Connected to Live Restaurant Cloud Server"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsServerModalOpen(true)}
                    className="btn btn-outline"
                    style={{ fontSize: "0.85rem" }}
                  >
                    ⚙️ Change URL
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ marginBottom: "1.5rem" }}>Printer Configuration</h2>

            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  Printer Type
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    onClick={() =>
                      setSettings({ ...settings, printerType: "thermal" })
                    }
                    className={
                      settings.printerType === "thermal"
                        ? "btn btn-primary"
                        : "btn btn-ghost"
                    }
                  >
                    🖨️ Thermal Printer
                  </button>
                  <button
                    onClick={() =>
                      setSettings({ ...settings, printerType: "a4" })
                    }
                    className={
                      settings.printerType === "a4"
                        ? "btn btn-primary"
                        : "btn btn-ghost"
                    }
                  >
                    📄 A4 Printer
                  </button>
                </div>
              </div>

              {settings.printerType === "thermal" && (
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    Paper Width
                  </label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.5rem",
                    }}
                  >
                    <button
                      onClick={() =>
                        setSettings({ ...settings, paperWidth: "58mm" })
                      }
                      className={
                        settings.paperWidth === "58mm"
                          ? "btn btn-primary"
                          : "btn btn-ghost"
                      }
                    >
                      58mm
                    </button>
                    <button
                      onClick={() =>
                        setSettings({ ...settings, paperWidth: "80mm" })
                      }
                      className={
                        settings.paperWidth === "80mm"
                          ? "btn btn-primary"
                          : "btn btn-ghost"
                      }
                    >
                      80mm
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  Footer Text
                </label>
                <input
                  type="text"
                  value={settings.footerText}
                  onChange={(e) =>
                    setSettings({ ...settings, footerText: e.target.value })
                  }
                  className="input"
                  placeholder="Enter footer text"
                />
              </div>

              {/* DESKTOP POS HARDWARE PRINTER SETTINGS */}
              <div
                style={{
                  gridColumn: "1 / -1",
                  marginTop: "1rem",
                  padding: "1.25rem",
                  background: isDesktop
                    ? "rgba(16, 185, 129, 0.08)"
                    : "rgba(100, 116, 139, 0.08)",
                  border: isDesktop
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px dashed rgba(100, 116, 139, 0.3)",
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>🖥️</span>
                    <strong style={{ fontSize: "1rem" }}>
                      Desktop Direct Hardware Printing (Tauri POS)
                    </strong>
                  </div>
                  {isDesktop ? (
                    <span
                      style={{
                        padding: "0.25rem 0.6rem",
                        background: "#10b981",
                        color: "#fff",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      ACTIVE DESKTOP APP
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: "0.25rem 0.6rem",
                        background: "rgba(100, 116, 139, 0.2)",
                        color: "var(--text-secondary)",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                      }}
                    >
                      WEB BROWSER MODE
                    </span>
                  )}
                </div>

                {isDesktop ? (
                  <div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.5rem",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                          }}
                        >
                          Bill / Cash Receipt Printer:
                        </label>
                        <select
                          className="input"
                          value={receiptPrinter}
                          onChange={(e) =>
                            handleUpdatePrinterConfig("receipt", e.target.value)
                          }
                        >
                          {printersList.length === 0 && (
                            <option value="">No printers detected</option>
                          )}
                          {printersList.map((p) => (
                            <option key={p.name} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            marginBottom: "0.5rem",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                          }}
                        >
                          Kitchen KOT Thermal Printer:
                        </label>
                        <select
                          className="input"
                          value={kotPrinter}
                          onChange={(e) =>
                            handleUpdatePrinterConfig("kot", e.target.value)
                          }
                        >
                          {printersList.length === 0 && (
                            <option value="">No printers detected</option>
                          )}
                          {printersList.map((p) => (
                            <option key={p.name} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={handleTestPrintBill}
                        disabled={testPrinting}
                        className="btn btn-primary"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                      >
                        {testPrinting ? "Printing..." : "🖨️ Test Receipt Print"}
                      </button>
                      <button
                        type="button"
                        onClick={handleTestDrawer}
                        className="btn btn-secondary"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
                      >
                        💵 Test Cash Drawer Kick
                      </button>
                      {testResult && (
                        <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                          {testResult}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      margin: 0,
                    }}
                  >
                    Direct silent hardware printing and cash drawer triggers are enabled automatically when running inside the <strong>OrderZo Counter Desktop App</strong> (no browser popups required).
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2>Geofencing & Attendance</h2>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setSettings({
                          ...settings,
                          restaurantLat: pos.coords.latitude.toString(),
                          restaurantLng: pos.coords.longitude.toString(),
                        });
                        alert("Location fetched successfully!");
                      },
                      (err) =>
                        alert(
                          "Could not fetch location. Please allow GPS access.",
                        ),
                    );
                  }
                }}
              >
                📍 Get Current Location
              </button>
            </div>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            >
              Set the exact GPS coordinates of your restaurant. Staff must be
              within the Allowed Radius to check-in, and customers must be
              within the Customer Radius to place orders.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  Latitude
                </label>
                <input
                  type="text"
                  className="input"
                  value={settings.restaurantLat}
                  onChange={(e) =>
                    setSettings({ ...settings, restaurantLat: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  Longitude
                </label>
                <input
                  type="text"
                  className="input"
                  value={settings.restaurantLng}
                  onChange={(e) =>
                    setSettings({ ...settings, restaurantLng: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  Staff Radius (M)
                </label>
                <input
                  type="number"
                  className="input"
                  value={settings.allowedRadius}
                  onChange={(e) =>
                    setSettings({ ...settings, allowedRadius: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  Customer Radius (M)
                </label>
                <input
                  type="number"
                  className="input"
                  value={settings.customerRadius}
                  onChange={(e) =>
                    setSettings({ ...settings, customerRadius: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div
            className="glass-card"
            style={{
              marginBottom: "1.5rem",
              border: "1px solid rgba(255, 145, 0, 0.3)",
            }}
          >
            <h2 style={{ marginBottom: "1rem", color: "var(--warning)" }}>
              Database Maintenance
            </h2>
            <p
              className="text-muted"
              style={{ marginBottom: "1.5rem", fontSize: "0.875rem" }}
            >
              If you encounter errors saying "column does not exist", use this
              button to update your database schema to the latest version.
            </p>

            <button
              onClick={async () => {
                if (confirm("Update database schema to the latest version?")) {
                  setSaving(true);
                  try {
                    const res = await fetch("/api/admin/run-migration", {
                      method: "POST",
                    });
                    const data = await res.json();
                    if (data.success) {
                      const summary = data.results
                        .map((r: any) => `${r.id}: ${r.success ? "✅" : "❌"}`)
                        .join("\n");
                      alert("Migration process finished:\n" + summary);
                    } else {
                      alert(
                        "Update failed: " + (data.error || "Unknown error"),
                      );
                    }
                  } catch (err) {
                    console.error(err);
                    alert("An error occurred during update.");
                  } finally {
                    setSaving(false);
                  }
                }
              }}
              disabled={saving}
              className="btn btn-warning"
              style={{ width: "100%" }}
            >
              {saving ? "Updating..." : "🔄 Run Database Schema Update"}
            </button>
          </div>

          <div
            style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
          >
            <button onClick={handleReset} className="btn btn-ghost">
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
              style={{ minWidth: "150px" }}
            >
              {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      {isDesktop && (
        <ServerSwitcherModal
          isOpen={isServerModalOpen}
          onClose={() => {
            setIsServerModalOpen(false);
            getServerUrl().then((u) => u && setActiveServerUrl(u));
          }}
        />
      )}
    </main>
  );
}
