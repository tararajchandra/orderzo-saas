"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function QRCodesPage() {
  const router = useRouter();
  const [totalTables, setTotalTables] = useState(16);
  const [settings, setSettings] = useState<any>(null);
  const [restaurantName, setRestaurantName] = useState("OrderZo");
  const [appUrl, setAppUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin");
      return;
    }

    // Get base URL for QR codes
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

  const handlePrintQR = (tableNo: number) => {
    const orderUrl = `${appUrl}/menu?table=${tableNo}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(orderUrl)}&margin=10`;

    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print QR - Table ${tableNo}</title>
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
                    h1 { margin: 0; font-size: 36px; letter-spacing: 1px; }
                    h2 { 
                        margin: 15px 0 30px 0; 
                        font-weight: 700; 
                        font-size: 24px; 
                        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        letter-spacing: 0.5px;
                    }
                    .qr-wrapper {
                        background: white;
                        padding: 20px;
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
                        margin: 0 0 25px 0;
                        font-size: 18px;
                        font-weight: 700;
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
                    }
                    .logo-wrapper .powered-by {
                        font-size: 13px;
                        color: #555;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .logo-wrapper img {
                        height: 35px; /* Made the logo much smaller */
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
                    <h1>TABLE ${tableNo}</h1>
                    <h2>Welcome to ${restaurantName}</h2>
                    
                    <div class="qr-wrapper">
                        <img src="${qrUrl}" alt="QR Code Table ${tableNo}" onload="setTimeout(() => { window.print(); window.close(); }, 500);" />
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

  const tablesList = settings
    ? getTableList(settings)
    : Array.from({ length: totalTables }, (_, i) => `Table ${i + 1}`);

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
          <div>
            <h1 style={{ marginBottom: "0.5rem" }}>Table QR Codes</h1>
            <p className="text-muted">Generate and print QR codes for tables</p>
          </div>
          <Link href="/admin/dashboard" className="btn btn-ghost">
            ← Back to Dashboard
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {tablesList.map((tableNo) => {
            const orderUrl = `${appUrl}/?table=${tableNo}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(orderUrl)}`;

            return (
              <div
                key={tableNo}
                className="glass-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <h3>
                  {String(tableNo).startsWith("Table") ||
                  String(tableNo).includes(" ")
                    ? tableNo
                    : `Table ${tableNo}`}
                </h3>
                <img
                  src={qrUrl}
                  alt={`QR Code ${tableNo}`}
                  style={{
                    borderRadius: "8px",
                    background: "white",
                    padding: "10px",
                  }}
                />
                <button
                  onClick={() => handlePrintQR(tableNo)}
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                >
                  🖨️ Print QR
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
