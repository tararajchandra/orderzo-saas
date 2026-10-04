const fs = require('fs');

let content = fs.readFileSync('app/admin/tables/page.tsx', 'utf8');

if (content.includes('const [contextMenu, setContextMenu] = useState<{')) {
  console.log('Already patched.');
  process.exit(0);
}

// 1. Add contextMenu state
content = content.replace(
  'const [settings, setSettings] = useState<any>(null);',
  `const [settings, setSettings] = useState<any>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tableNo: string;
    isOccupied: boolean;
  } | null>(null);
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  // Close context menu on any click
  const handleClick = () => setContextMenu(null);
  React.useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);`
);

// Add React import if missing
if (!content.includes("import React")) {
    content = content.replace('import { useState', 'import React, { useState');
}

// 2. Add handlers to table button
content = content.replace(
  /onMouseOut=\{\(e\) \=\>[\s\S]*?\(e\.currentTarget\.style\.transform = "scale\(1\)"\)\s*\}/,
  `onMouseOut={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")
                          }
                          onContextMenu={(e) => {
                            e.preventDefault();
                            const menuX = Math.min(e.clientX, window.innerWidth - 200);
                            const menuY = Math.min(e.clientY, window.innerHeight - 200);
                            setContextMenu({ x: menuX, y: menuY, tableNo, isOccupied });
                          }}
                          onTouchStart={(e) => {
                            const touch = e.touches[0];
                            longPressTimer.current = setTimeout(() => {
                              const menuX = Math.min(touch.clientX, window.innerWidth - 200);
                              const menuY = Math.min(touch.clientY, window.innerHeight - 200);
                              setContextMenu({ x: menuX, y: menuY, tableNo, isOccupied });
                            }, 600);
                          }}
                          onTouchEnd={() => {
                            if (longPressTimer.current) {
                              clearTimeout(longPressTimer.current);
                            }
                          }}`
);

// 3. Add Context Menu JSX at the end of <div className="fade-in">
content = content.replace(
  /(\s*)<\/div>\s*\{\/\* Modal for Table Details \*\/\}/,
  `$1</div>

      {/* Right-Click / Long-Press Context Menu */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 99999,
            background: "var(--card-bg, #1e1e2e)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            minWidth: "160px",
            overflow: "hidden",
          }}
        >
          {/* Table Label */}
          <div style={{ padding: "0.5rem 1rem 0.4rem", fontSize: "0.75rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)", marginBottom: "0.3rem" }}>
            {contextMenu.tableNo}
          </div>

          {/* New Order — always visible */}
          <button
            onClick={() => {
              setContextMenu(null);
              router.push("/admin/orders/create?table=" + encodeURIComponent(contextMenu.tableNo));
            }}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              width: "100%", padding: "0.6rem 1rem",
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-primary)", fontSize: "0.95rem", textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            ➕ New Order
          </button>

          {/* Merge/Settle Order — only occupied */}
          <button
            onClick={() => {
              if (!contextMenu.isOccupied) return;
              setContextMenu(null);
              setSelectedTable(contextMenu.tableNo);
              setShowModal(true);
            }}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              width: "100%", padding: "0.6rem 1rem",
              background: "none", border: "none",
              cursor: contextMenu.isOccupied ? "pointer" : "not-allowed",
              color: contextMenu.isOccupied ? "var(--text-primary)" : "var(--text-muted)",
              opacity: contextMenu.isOccupied ? 1 : 0.4,
              fontSize: "0.95rem", textAlign: "left",
            }}
            onMouseEnter={(e) => { if (contextMenu.isOccupied) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            🔀 Settle Table
          </button>

          {/* Print Bill — only occupied */}
          <button
            onClick={() => {
              if (!contextMenu.isOccupied) return;
              setContextMenu(null);
              handlePrintBill(contextMenu.tableNo);
            }}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              width: "100%", padding: "0.6rem 1rem",
              background: "none", border: "none",
              cursor: contextMenu.isOccupied ? "pointer" : "not-allowed",
              color: contextMenu.isOccupied ? "var(--text-primary)" : "var(--text-muted)",
              opacity: contextMenu.isOccupied ? 1 : 0.4,
              fontSize: "0.95rem", textAlign: "left",
            }}
            onMouseEnter={(e) => { if (contextMenu.isOccupied) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            🧾 Print Master Bill
          </button>
        </div>
      )}

      {/* Modal for Table Details */}`
);

fs.writeFileSync('app/admin/tables/page.tsx', content, 'utf8');
console.log('Patched admin/tables/page.tsx successfully.');
