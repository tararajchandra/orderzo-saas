"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getTableList } from "@/lib/utils";

export default function QRCodesPage() {
  const router = useRouter();
  const [totalTables, setTotalTables] = useState(16);
  const [settings, setSettings] = useState<any>(null);
  const [restaurantName, setRestaurantName] = useState("OrderZo");
  const [appUrl, setAppUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // Batch Print Modal State
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [gridPreset, setGridPreset] = useState<"4-per-page" | "6-per-page" | "8-per-page" | "2-per-page" | "custom">("4-per-page");
  const [customWidthCm, setCustomWidthCm] = useState<number>(9.5);
  const [customHeightCm, setCustomHeightCm] = useState<number>(13.5);
  const [themeStyle, setThemeStyle] = useState<"clean" | "gradient">("clean");
  const [showCutLines, setShowCutLines] = useState<boolean>(true);
  const [showRestaurantName, setShowRestaurantName] = useState<boolean>(true);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    setAppUrl(window.location.origin);
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (data.success) {
        if (data.data.totalTables) {
          setTotalTables(parseInt(data.data.totalTables, 10));
        }
        setSettings(data.data);
        if (data.data.restaurantName) {
          setRestaurantName(data.data.restaurantName);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const tablesList: string[] = useMemo(() => {
    if (settings) {
      return getTableList(settings).map((t: any) => String(t));
    }
    return Array.from({ length: totalTables }, (_, i) => `Table ${i + 1}`);
  }, [settings, totalTables]);

  // Sync selected tables with tablesList once loaded
  useEffect(() => {
    if (tablesList.length > 0 && selectedTables.length === 0) {
      setSelectedTables(tablesList);
    }
  }, [tablesList]);

  const toggleTableSelection = (tableNo: string) => {
    if (selectedTables.includes(tableNo)) {
      setSelectedTables(selectedTables.filter((t) => t !== tableNo));
    } else {
      setSelectedTables([...selectedTables, tableNo]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedTables.length === tablesList.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables([...tablesList]);
    }
  };

  // Helper to format table name display
  const getTableDisplayName = (tableNo: string | number) => {
    const s = String(tableNo);
    return s.startsWith("Table") || s.includes(" ") ? s : `Table ${s}`;
  };

  // Helper to extract clean parameter value for QR URL
  const getCleanTableParam = (tableNo: string | number) => {
    return String(tableNo).replace(/^Table\s+/i, "");
  };

  // 1. Single QR Print
  const handlePrintQR = (tableNo: string | number) => {
    const cleanParam = getCleanTableParam(tableNo);
    const displayName = getTableDisplayName(tableNo);
    const orderUrl = `${appUrl}/menu?table=${encodeURIComponent(cleanParam)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(orderUrl)}&margin=10`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Print QR - ${displayName}</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  background: #f0f0f0;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
              }
              .qr-card {
                  background: linear-gradient(135deg, #f97316 0%, #a855f7 100%);
                  color: white;
                  text-align: center;
                  padding: 40px;
                  border-radius: 20px;
                  width: 350px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
              }
              h1 { margin: 0; font-size: 36px; letter-spacing: 1px; font-weight: 900; }
              h2 { 
                  margin: 15px 0 25px 0; 
                  font-weight: 700; 
                  font-size: 22px; 
                  letter-spacing: 0.5px;
              }
              .qr-wrapper {
                  background: white;
                  padding: 16px;
                  border-radius: 16px;
                  display: inline-block;
                  margin-bottom: 25px;
                  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
              }
              .qr-wrapper img {
                  width: 250px;
                  height: 250px;
                  display: block;
              }
              p.scan-text {
                  margin: 0 0 20px 0;
                  font-size: 16px;
                  font-weight: 800;
                  text-transform: uppercase;
                  letter-spacing: 1.5px;
              }
              .logo-wrapper {
                  background: rgba(255, 255, 255, 0.95);
                  padding: 8px 20px;
                  border-radius: 100px;
                  display: inline-flex;
                  align-items: center;
                  gap: 10px;
                  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                  color: #0f172a;
              }
              .logo-wrapper .powered-by {
                  font-size: 12px;
                  color: #555;
                  font-weight: 600;
                  text-transform: uppercase;
              }
              .logo-wrapper img {
                  height: 30px;
              }
              @media print {
                  body { background: white; align-items: flex-start; padding-top: 20px; }
                  .qr-card { box-shadow: none; break-inside: avoid; }
                  @page { margin: 0; size: auto; }
              }
          </style>
      </head>
      <body>
          <div class="qr-card">
              <h1>${displayName.toUpperCase()}</h1>
              <h2>Welcome to ${restaurantName}</h2>
              
              <div class="qr-wrapper">
                  <img src="${qrUrl}" alt="QR Code ${displayName}" onload="setTimeout(() => { window.print(); window.close(); }, 500);" />
              </div>
              
              <p class="scan-text">Scan to view menu & order!</p>
              
              <div class="logo-wrapper">
                  <span class="powered-by">Powered by</span>
                  <img src="${appUrl}/OrderZo_Logo_Mod.png" alt="OrderZo Logo" />
              </div>
          </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  // 2. Batch A4 QR Stand Printing (Customized for 4-per-page, Stand measurements, etc.)
  const handlePrintBatchA4 = () => {
    if (selectedTables.length === 0) {
      alert("Please select at least one table to print.");
      return;
    }

    let itemsPerPage = 4;
    let gridClass = "grid-4";
    let customCardStyle = "";

    if (gridPreset === "4-per-page") {
      itemsPerPage = 4;
      gridClass = "grid-4";
    } else if (gridPreset === "6-per-page") {
      itemsPerPage = 6;
      gridClass = "grid-6";
    } else if (gridPreset === "8-per-page") {
      itemsPerPage = 8;
      gridClass = "grid-8";
    } else if (gridPreset === "2-per-page") {
      itemsPerPage = 2;
      gridClass = "grid-2";
    } else if (gridPreset === "custom") {
      // Calculate how many fit on A4 (Width: ~19.8cm, Height: ~28.5cm printable)
      const w = Math.max(4, customWidthCm || 9.5);
      const h = Math.max(5, customHeightCm || 13.5);
      const cols = Math.max(1, Math.floor(19.8 / w));
      const rows = Math.max(1, Math.floor(28.5 / h));
      itemsPerPage = cols * rows;
      gridClass = "grid-custom";
      customCardStyle = `width: ${w}cm; height: ${h}cm;`;
    }

    // Chunk tables into A4 pages
    const pages: string[][] = [];
    for (let i = 0; i < selectedTables.length; i += itemsPerPage) {
      pages.push(selectedTables.slice(i, i + itemsPerPage));
    }

    // Generate HTML for each page and card
    const pagesHtml = pages
      .map((pageTables, pageIdx) => {
        const cardsHtml = pageTables
          .map((tableNo) => {
            const cleanParam = getCleanTableParam(tableNo);
            const displayName = getTableDisplayName(tableNo);
            const orderUrl = `${appUrl}/menu?table=${encodeURIComponent(cleanParam)}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(orderUrl)}&margin=6`;

            return `
              <div class="sticker-card ${themeStyle === "gradient" ? "theme-gradient" : "theme-clean"}" style="${customCardStyle}">
                ${showCutLines ? `<div class="cut-indicator">✂</div>` : ""}
                <div class="card-top">
                  <div class="table-name">${displayName.toUpperCase()}</div>
                  ${showRestaurantName ? `<div class="rest-name">${restaurantName}</div>` : ""}
                </div>

                <div class="qr-container">
                  <img src="${qrUrl}" alt="${displayName}" class="qr-img" />
                </div>

                <div class="card-bottom">
                  <div class="scan-pill">📱 SCAN TO ORDER</div>
                  <div class="brand-sub">Powered by <strong>OrderZo</strong></div>
                </div>
              </div>
            `;
          })
          .join("");

        return `
          <div class="a4-sheet ${gridClass}">
            ${cardsHtml}
          </div>
        `;
      })
      .join("");

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>A4 Stand Stickers - ${restaurantName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: #e2e8f0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
          }

          /* A4 Sheet Container: 210mm x 297mm, printable ~198mm x 285mm */
          .a4-sheet {
            width: 198mm;
            height: 285mm;
            margin: 10mm auto;
            background: #ffffff;
            box-sizing: border-box;
            display: grid;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
          }
          .a4-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }

          /* 4 Per Page Grid: 2 columns x 2 rows (Standard A6 / 4"x6" table stands) */
          .grid-4 {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 5mm;
            padding: 3mm;
          }

          /* 6 Per Page Grid: 2 columns x 3 rows */
          .grid-6 {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 4mm;
            padding: 2mm;
          }

          /* 8 Per Page Grid: 2 columns x 4 rows */
          .grid-8 {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(4, 1fr);
            gap: 3mm;
            padding: 2mm;
          }

          /* 2 Per Page Grid: 1 column x 2 rows */
          .grid-2 {
            grid-template-columns: 1fr;
            grid-template-rows: repeat(2, 1fr);
            gap: 6mm;
            padding: 4mm;
          }

          /* Custom Flex Grid */
          .grid-custom {
            display: flex;
            flex-wrap: wrap;
            align-content: flex-start;
            gap: 4mm;
            padding: 3mm;
          }

          /* Sticker Card */
          .sticker-card {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            box-sizing: border-box;
            text-align: center;
            border-radius: 10px;
            ${showCutLines ? "border: 1.5px dashed #94a3b8;" : "border: 1px solid #e2e8f0;"}
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .cut-indicator {
            position: absolute;
            top: 2px;
            right: 4px;
            font-size: 11px;
            color: #94a3b8;
            opacity: 0.7;
          }

          /* Themes */
          .theme-clean {
            background: #ffffff;
            color: #0f172a;
          }
          .theme-clean .table-name {
            color: #0f172a;
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 0.5px;
            margin: 0;
            line-height: 1.1;
          }
          .theme-clean .rest-name {
            color: #ea580c;
            font-size: 13px;
            font-weight: 700;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .theme-clean .qr-container {
            background: #ffffff;
            padding: 6px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .theme-clean .qr-img {
            max-width: 100%;
            max-height: 52mm;
            width: auto;
            height: auto;
            display: block;
          }
          .theme-clean .scan-pill {
            background: #0f172a;
            color: #ffffff;
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.8px;
            display: inline-block;
          }
          .theme-clean .brand-sub {
            font-size: 10px;
            color: #64748b;
            margin-top: 4px;
          }

          /* Gradient Theme */
          .theme-gradient {
            background: linear-gradient(135deg, #f97316 0%, #a855f7 100%);
            color: #ffffff;
          }
          .theme-gradient .table-name {
            color: #ffffff;
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 0.5px;
            margin: 0;
            line-height: 1.1;
            text-shadow: 0 1px 3px rgba(0,0,0,0.3);
          }
          .theme-gradient .rest-name {
            color: #ffffff;
            font-size: 13px;
            font-weight: 700;
            margin-top: 3px;
            opacity: 0.95;
            letter-spacing: 0.5px;
          }
          .theme-gradient .qr-container {
            background: #ffffff;
            padding: 6px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .theme-gradient .qr-img {
            max-width: 100%;
            max-height: 52mm;
            width: auto;
            height: auto;
            display: block;
          }
          .theme-gradient .scan-pill {
            background: #ffffff;
            color: #0f172a;
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.8px;
            display: inline-block;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          }
          .theme-gradient .brand-sub {
            font-size: 10px;
            color: #ffffff;
            opacity: 0.85;
            margin-top: 4px;
          }

          @media print {
            body {
              background: #ffffff !important;
            }
            .a4-sheet {
              margin: 0 !important;
              box-shadow: none !important;
            }
          }
        </style>
      </head>
      <body>
        ${pagesHtml}

        <script>
          window.onload = function() {
            var images = Array.from(document.querySelectorAll('img'));
            var loaded = 0;
            var total = images.length;
            function done() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
            if (total === 0) {
              done();
              return;
            }
            images.forEach(function(img) {
              if (img.complete) {
                loaded++;
                if (loaded >= total) done();
              } else {
                img.onload = function() {
                  loaded++;
                  if (loaded >= total) done();
                };
                img.onerror = function() {
                  loaded++;
                  if (loaded >= total) done();
                };
              }
            });
            setTimeout(done, 3000); // 3s fallback
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open("", "_blank");
    if (printWin) {
      printWin.document.write(fullHtml);
      printWin.document.close();
    } else {
      alert("Popup was blocked by your browser. Please allow popups for this site to print.");
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

  const calculatedSheets = Math.ceil(
    selectedTables.length /
      (gridPreset === "4-per-page"
        ? 4
        : gridPreset === "6-per-page"
        ? 6
        : gridPreset === "8-per-page"
        ? 8
        : gridPreset === "2-per-page"
        ? 2
        : Math.max(1, Math.floor(19.8 / Math.max(4, customWidthCm || 9.5)) * Math.floor(28.5 / Math.max(5, customHeightCm || 13.5))))
  );

  return (
    <main className="container" style={{ padding: "2rem 1.5rem" }}>
      <div className="fade-in">
        {/* Header with Print All button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h1 style={{ marginBottom: "0.25rem" }}>Table QR Codes</h1>
            <p className="text-muted" style={{ margin: 0 }}>
              Generate and print QR codes for restaurant tables ({tablesList.length} total)
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowBatchModal(true)}
              className="btn btn-primary"
              style={{
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
                fontWeight: 700,
                padding: "0.6rem 1.25rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "10px",
                fontSize: "0.95rem",
              }}
            >
              🖨️ Print All (A4 Sheet / Stand Stickers)
            </button>

            <Link href="/admin/dashboard" className="btn btn-ghost">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Individual QR Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {tablesList.map((tableNo) => {
            const cleanParam = getCleanTableParam(tableNo);
            const displayName = getTableDisplayName(tableNo);
            const orderUrl = `${appUrl}/menu?table=${encodeURIComponent(cleanParam)}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(orderUrl)}`;

            return (
              <div
                key={tableNo}
                className="glass-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1.5rem 1rem",
                  textAlign: "center",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                  {displayName}
                </h3>
                <img
                  src={qrUrl}
                  alt={`QR Code ${displayName}`}
                  style={{
                    borderRadius: "8px",
                    background: "white",
                    padding: "8px",
                    width: "150px",
                    height: "150px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                />
                <button
                  onClick={() => handlePrintQR(tableNo)}
                  className="btn btn-primary"
                  style={{ width: "100%", fontSize: "0.9rem", fontWeight: 600 }}
                >
                  🖨️ Print QR
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* A4 STAND STICKER / BATCH PRINT MODAL                     */}
      {/* ======================================================== */}
      {showBatchModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: "680px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.75rem",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>
                  🖨️ A4 Stand Sticker Print (স্টিকার ও স্ট্যান্ড মাপ)
                </h2>
                <p className="text-muted" style={{ margin: "4px 0 0 0", fontSize: "0.88rem" }}>
                  A4 স্টিকার পেপারে প্রিন্ট করে কাটার দাগ (Dashed line) বরাবর কেটে স্ট্যান্ডে বসিয়ে দিন
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                ✕
              </button>
            </div>

            {/* Presets Selection */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>
                স্ট্যান্ড বা পেজের মাপ নির্বাচন করুন:
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                  gap: "8px",
                }}
              >
                {[
                  {
                    id: "4-per-page",
                    title: "🌟 4 Pcs / Page",
                    sub: "A6 (10×14 cm) • Best for Stands",
                  },
                  {
                    id: "6-per-page",
                    title: "6 Pcs / Page",
                    sub: "Medium (9×9 cm)",
                  },
                  {
                    id: "8-per-page",
                    title: "8 Pcs / Page",
                    sub: "Compact (7×10 cm)",
                  },
                  {
                    id: "2-per-page",
                    title: "2 Pcs / Page",
                    sub: "Large (A5 Tent)",
                  },
                  {
                    id: "custom",
                    title: "📐 Custom Size",
                    sub: "নিজের স্ট্যান্ডের মাপ লিখুন",
                  },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setGridPreset(preset.id as any)}
                    style={{
                      padding: "10px 8px",
                      borderRadius: "10px",
                      border:
                        gridPreset === preset.id
                          ? "2px solid #f97316"
                          : "1px solid rgba(255, 255, 255, 0.15)",
                      background:
                        gridPreset === preset.id
                          ? "rgba(249, 115, 22, 0.15)"
                          : "rgba(255, 255, 255, 0.05)",
                      color: gridPreset === preset.id ? "#f97316" : "inherit",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{preset.title}</div>
                    <div style={{ fontSize: "0.72rem", opacity: 0.8, marginTop: "2px" }}>
                      {preset.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Dimensions Inputs (Shown only when 'custom' is selected) */}
            {gridPreset === "custom" && (
              <div
                style={{
                  background: "rgba(249, 115, 22, 0.08)",
                  border: "1px dashed rgba(249, 115, 22, 0.4)",
                  borderRadius: "10px",
                  padding: "12px",
                  marginBottom: "1.25rem",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: "120px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px" }}>
                    স্ট্যান্ড চওড়া / Width (cm):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="4"
                    max="19"
                    value={customWidthCm}
                    onChange={(e) => setCustomWidthCm(parseFloat(e.target.value) || 9.5)}
                    className="input-field"
                    style={{ width: "100%", padding: "6px 10px" }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: "120px" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "4px" }}>
                    স্ট্যান্ড উচ্চতা / Height (cm):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="4"
                    max="28"
                    value={customHeightCm}
                    onChange={(e) => setCustomHeightCm(parseFloat(e.target.value) || 13.5)}
                    className="input-field"
                    style={{ width: "100%", padding: "6px 10px" }}
                  />
                </div>
                <div style={{ fontSize: "0.78rem", color: "#f97316", width: "100%" }}>
                  💡 A4 কাগজের মাপ 21cm × 29.7cm। আপনার দেওয়া মাপে স্বয়ংক্রিয়ভাবে একটি পেজে যতগুলো ধরে সাজানো হবে।
                </div>
              </div>
            )}

            {/* Theme & Design Options */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>
                  🎨 কার্ড ডিজাইন / কালার:
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setThemeStyle("clean")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "8px",
                      border:
                        themeStyle === "clean"
                          ? "2px solid #f97316"
                          : "1px solid rgba(255, 255, 255, 0.15)",
                      background:
                        themeStyle === "clean"
                          ? "rgba(249, 115, 22, 0.15)"
                          : "rgba(255, 255, 255, 0.05)",
                      color: themeStyle === "clean" ? "#f97316" : "inherit",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ⚪ Clean White (কালি বাঁচবে)
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeStyle("gradient")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "8px",
                      border:
                        themeStyle === "gradient"
                          ? "2px solid #f97316"
                          : "1px solid rgba(255, 255, 255, 0.15)",
                      background:
                        themeStyle === "gradient"
                          ? "rgba(249, 115, 22, 0.15)"
                          : "rgba(255, 255, 255, 0.05)",
                      color: themeStyle === "gradient" ? "#f97316" : "inherit",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🌈 Vibrant Gradient
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>
                  ⚙️ বাড়তি অপশন:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={showCutLines}
                      onChange={(e) => setShowCutLines(e.target.checked)}
                    />
                    ✂️ কাঁচি দিয়ে কাটার ড্যাশ লাইন থাকবে
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={showRestaurantName}
                      onChange={(e) => setShowRestaurantName(e.target.checked)}
                    />
                    🏢 রেস্তোরাঁর নাম ({restaurantName}) থাকবে
                  </label>
                </div>
              </div>
            </div>

            {/* Table Selection Pills */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  কোন কোন টেবিল প্রিন্ট করতে চান? ({selectedTables.length}/{tablesList.length})
                </label>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f97316",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {selectedTables.length === tablesList.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  maxHeight: "120px",
                  overflowY: "auto",
                  padding: "8px",
                  background: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "8px",
                }}
              >
                {tablesList.map((tableNo) => {
                  const isChecked = selectedTables.includes(tableNo);
                  return (
                    <button
                      key={tableNo}
                      type="button"
                      onClick={() => toggleTableSelection(tableNo)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: isChecked ? "1px solid #f97316" : "1px solid rgba(255,255,255,0.15)",
                        background: isChecked ? "rgba(249, 115, 22, 0.2)" : "rgba(255,255,255,0.05)",
                        color: isChecked ? "#f97316" : "inherit",
                      }}
                    >
                      {isChecked ? "✓ " : ""}{tableNo}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary Pill & Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: "1.25rem",
              }}
            >
              <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                নির্বাচিত: <strong style={{ color: "#fff" }}>{selectedTables.length}টি টেবিল</strong> • মোট{" "}
                <strong style={{ color: "#f97316" }}>{calculatedSheets}টি A4 পেজ</strong> লাগবে
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="btn btn-ghost"
                  style={{ fontSize: "0.9rem" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePrintBatchA4}
                  className="btn btn-primary"
                  style={{
                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                    fontWeight: 700,
                    padding: "0.6rem 1.4rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  🖨️ Print Now (A4 Sheets)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
